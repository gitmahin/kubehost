import "dotenv/config"
import { baseConfig } from "@/config"
import { getSystemCustomErrorMsgByKey } from "@/events"
import { ApiError } from "@/libs"
import * as k8s from "@kubernetes/client-node"
import { injectable } from "inversify"

export type EnvMapDataType = {
  [key: string]: {
    name: string
    value: string
  }
}

export type CreateSecretMapParams = {
  namespace: string
  secretName: string
  secretEnvs: EnvMapDataType
}

export type CreateConfigMapParams = {
  namespace: string
  configName: string
  nonSecretEnvs: EnvMapDataType
}

export type CreateIngressParams = {
  namespace: string
  ingressName: string
  host: string
  path?: string
  serviceName: string
  servicePort: number
}

type IngressPathConfig = {
  path: string
  serviceName: string
  servicePort: number
}

export type UpdateIngressParams = {
  namespace: string
  ingressName: string
  host: string
  paths: IngressPathConfig[]
}

@injectable()
export class K8sService {
  private kc
  public k8sApi
  public appsApi
  public networkingApi
  public static FIELD_MANAGER: string = "kubehost"
  constructor() {
    this.kc = new k8s.KubeConfig()

    if (baseConfig.NODE_ENV !== "production") {
      this.kc.loadFromDefault()
    } else {
      this.kc.loadFromOptions({
        clusters: [
          {
            name: "minikube",
            server: process.env.K8S_SERVER,
            skipTLSVerify: true,
          },
        ],
        users: [
          {
            name: "kubehost-sa",
            token: process.env.K8S_TOKEN,
          },
        ],
        contexts: [{ name: "ctx", cluster: "minikube", user: "kubehost-sa" }],
        currentContext: "ctx",
      })
    }

    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api)
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api)
    this.networkingApi = this.kc.makeApiClient(k8s.NetworkingV1Api)
  }

  async listAllPods(namespace: string) {
    const res = await this.k8sApi.listNamespacedPod({ namespace: namespace })
    // console.log(res)
    return res
  }

  static GetBase64SecretData(data: EnvMapDataType) {
    return Object.fromEntries(
      Object.entries(data).map(([key, data]) => {
        return [key, Buffer.from(data.value).toString("base64")]
      })
    )
  }

  static GetConfigMapData(data: EnvMapDataType) {
    return Object.fromEntries(
      Object.entries(data).map(([key, data]) => {
        return [key, data.value]
      })
    )
  }

  async createSecretMap({
    namespace,
    secretName,
    secretEnvs,
  }: CreateSecretMapParams): Promise<string> {
    const baseEncodedSecrets = K8sService.GetBase64SecretData(secretEnvs)

    const secret = await this.k8sApi.createNamespacedSecret({
      namespace,
      body: {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: secretName,
        },
        type: "Opaque",
        data: baseEncodedSecrets,
      },

      fieldManager: K8sService.FIELD_MANAGER,
    })

    return secret.metadata?.name as string
  }

  async updateSecretMap({
    namespace,
    secretName,
    secretEnvs,
  }: CreateSecretMapParams) {
    const baseEncodedSecrets = K8sService.GetBase64SecretData(secretEnvs)

    const response = await this.k8sApi.replaceNamespacedSecret({
      name: secretName,
      namespace,
      body: {
        apiVersion: "v1",
        kind: "Secret",
        metadata: {
          name: secretName,
        },
        type: "Opaque",
        data: baseEncodedSecrets,
      },

      fieldManager: K8sService.FIELD_MANAGER,
    })

    return response
  }

  async getSecretMap({
    namespace,
    secretName,
  }: Omit<CreateSecretMapParams, "secretEnvs">) {
    try {
      return await this.k8sApi.readNamespacedSecret({
        name: secretName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code === 404) return null
      throw error
    }
  }

  async createConfigMap({
    configName,
    namespace,
    nonSecretEnvs,
  }: CreateConfigMapParams): Promise<string> {
    const configMapData = K8sService.GetConfigMapData(nonSecretEnvs)
    const response = await this.k8sApi.createNamespacedConfigMap({
      namespace,
      body: {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: configName,
        },
        data: configMapData,
      },
      fieldManager: K8sService.FIELD_MANAGER,
    })

    return response.metadata?.name as string
  }

  async updateConfigMap({
    configName,
    namespace,
    nonSecretEnvs,
  }: CreateConfigMapParams) {
    const configMapData = K8sService.GetConfigMapData(nonSecretEnvs)
    const response = await this.k8sApi.replaceNamespacedConfigMap({
      name: configName,
      namespace,
      body: {
        apiVersion: "v1",
        kind: "ConfigMap",
        metadata: {
          name: configName,
        },
        data: configMapData,
      },
      fieldManager: K8sService.FIELD_MANAGER,
    })

    return response
  }

  async getConfigMap({
    namespace,
    configName,
  }: Omit<CreateConfigMapParams, "nonSecretEnvs">) {
    try {
      return await this.k8sApi.readNamespacedConfigMap({
        name: configName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code === 404) return null
      throw error
    }
  }

  async createIngress({
    host,
    namespace,
    ingressName,
    serviceName,
    servicePort,
    path = "/",
  }: CreateIngressParams) {
    try {
      await this.networkingApi.readNamespacedIngress({
        name: ingressName,
        namespace,
      })

      throw new ApiError(
        400,
        getSystemCustomErrorMsgByKey("INGRESS_ALREADY_EXISTS")
      )
    } catch (error: any) {
      if (error?.code !== 404) {
        throw error
      }
    }

    const normalizedPath = path.replace(/\/$/, "")
    const ingressPath =
      normalizedPath === "" ? "/(.*)" : `${normalizedPath}/(.*)`

    await this.networkingApi.createNamespacedIngress({
      namespace,
      body: {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: ingressName,
          namespace,
          annotations: {
            "kubernetes.io/ingress.class": "nginx",
            "nginx.ingress.kubernetes.io/use-regex": "true",
            "nginx.ingress.kubernetes.io/rewrite-target": "/$1",
          },
        },
        spec: {
          ingressClassName: "nginx",
          rules: [
            {
              host,
              http: {
                paths: [
                  {
                    path: ingressPath,
                    pathType: "ImplementationSpecific",
                    backend: {
                      service: {
                        name: serviceName,
                        port: {
                          number: servicePort,
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      fieldManager: K8sService.FIELD_MANAGER,
    })
  }

  async updateIngress({
    host,
    namespace,
    ingressName,
    serviceName,
    servicePort,
    path = "/",
  }: CreateIngressParams) {
    const existingIngress = await this.networkingApi.readNamespacedIngress({
      name: ingressName,
      namespace,
    })

    const existingRules = existingIngress.spec?.rules ?? []

    const normalizedPath = path.replace(/\/$/, "")
    const ingressPath =
      normalizedPath === "" ? "/(.*)" : `${normalizedPath}/(.*)`

    const newPathEntry = {
      path: ingressPath,
      pathType: "ImplementationSpecific",
      backend: {
        service: {
          name: serviceName,
          port: {
            number: servicePort,
          },
        },
      },
    }

    const hostRuleIndex = existingRules.findIndex((rule) => rule.host === host)

    let updatedRules

    if (hostRuleIndex >= 0) {
      const existingPaths = existingRules[hostRuleIndex]?.http?.paths ?? []

      const pathMatchIndex = existingPaths.findIndex((p) => p.path === path)

      const mergedPaths =
        pathMatchIndex >= 0
          ? existingPaths.map((p, i) =>
              i === pathMatchIndex ? newPathEntry : p
            )
          : [...existingPaths, newPathEntry]

      updatedRules = existingRules.map((rule, i) =>
        i === hostRuleIndex ? { ...rule, http: { paths: mergedPaths } } : rule
      )
    } else {
      // add a brand-new rule with just this one path if new host
      updatedRules = [
        ...existingRules,
        {
          host,
          http: { paths: [newPathEntry] },
        },
      ]
    }

    const response = await this.networkingApi.replaceNamespacedIngress({
      name: ingressName,
      namespace,
      body: {
        apiVersion: "networking.k8s.io/v1",
        kind: "Ingress",
        metadata: {
          name: ingressName,
          namespace,
          resourceVersion: existingIngress.metadata?.resourceVersion,
          annotations: existingIngress.metadata?.annotations,
        },
        spec: {
          ingressClassName: existingIngress.spec?.ingressClassName ?? "nginx",
          rules: updatedRules,
        },
      },
      fieldManager: K8sService.FIELD_MANAGER,
    })

    return response
  }

  async getIngress({
    ingressName,
    namespace,
  }: Pick<CreateIngressParams, "namespace" | "ingressName">) {
    try {
      return await this.networkingApi.readNamespacedIngress({
        name: ingressName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code === 404) return null
      throw error
    }
  }

  async deleteDeployment({
    namespace,
    deploymentName,
  }: {
    namespace: string
    deploymentName: string
  }) {
    try {
      await this.appsApi.deleteNamespacedDeployment({
        name: deploymentName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code !== 404) throw error
    }
  }

  async deleteService({
    namespace,
    serviceName,
  }: {
    namespace: string
    serviceName: string
  }) {
    try {
      await this.k8sApi.deleteNamespacedService({
        name: serviceName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code !== 404) throw error
    }
  }

  async deleteSecretMap({
    namespace,
    secretName,
  }: Omit<CreateSecretMapParams, "secretEnvs">) {
    try {
      await this.k8sApi.deleteNamespacedSecret({
        name: secretName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code !== 404) throw error
    }
  }

  async deleteConfigMap({
    namespace,
    configName,
  }: Omit<CreateConfigMapParams, "nonSecretEnvs">) {
    try {
      await this.k8sApi.deleteNamespacedConfigMap({
        name: configName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code !== 404) throw error
    }
  }

  async deleteIngress({
    namespace,
    ingressName,
  }: Pick<CreateIngressParams, "namespace" | "ingressName">) {
    try {
      await this.networkingApi.deleteNamespacedIngress({
        name: ingressName,
        namespace,
      })
    } catch (error: any) {
      if (error?.code !== 404) throw error
    }
  }
}
