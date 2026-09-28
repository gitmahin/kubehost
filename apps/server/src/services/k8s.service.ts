import "dotenv/config"
import { baseConfig } from "@/config"
import { getSystemCustomErrorMsgByKey } from "@/events"
import { ApiError } from "@/libs"
import * as k8s from "@kubernetes/client-node"
import { injectable } from "inversify"
import { parseCpuToNano } from "@/utils/parseCpuToNano"
import { parseMemoryToBytes } from "@/utils/parseMemoryToBytes"
import type {
  ContainerMetrics,
  DeploymentMetrics,
  PodMetrics,
} from "@repo/types"

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
  public customObjectsApi
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
    this.customObjectsApi = this.kc.makeApiClient(k8s.CustomObjectsApi)
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

    const normalizedPath =
      !path || path === "/" ? "/" : path.replace(/\/+$/, "")

    const ingressPath =
      normalizedPath === "/" ? "/(.*)" : `${normalizedPath}/(.*)`

    const newPathEntry = {
      path: ingressPath,
      pathType: "ImplementationSpecific" as const,
      backend: {
        service: {
          name: serviceName,
          port: {
            number: servicePort,
          },
        },
      },
    }

    // Find the host
    const hostRuleIndex = existingRules.findIndex((rule) => rule.host === host)

    let updatedRules: typeof existingRules

    if (hostRuleIndex !== -1) {
      // Host already exists.
      // Replace its path completely.
      updatedRules = existingRules.map((rule, index) =>
        index === hostRuleIndex
          ? {
              ...rule,
              http: {
                ...rule.http,
                paths: [newPathEntry],
              },
            }
          : rule
      )
    } else {
      // Host doesn't exist.
      // Create a new host with exactly one path.
      updatedRules = [
        ...existingRules,
        {
          host,
          http: {
            paths: [newPathEntry],
          },
        },
      ]
    }

    return await this.networkingApi.replaceNamespacedIngress({
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

  async getDeploymentMetrics(
    namespace: string,
    deploymentName: string
  ): Promise<DeploymentMetrics> {
    // Get Deployment
    const deployRes = await this.appsApi.readNamespacedDeployment({
      name: deploymentName,
      namespace,
    })

    const deploymentContainers =
      deployRes.spec?.template?.spec?.containers ?? []

    if (deploymentContainers.length === 0) {
      throw new Error(`No containers found in deployment "${deploymentName}"`)
    }

    // Build Deployment label selector
    const matchLabels = deployRes.spec?.selector?.matchLabels ?? {}

    const labelSelector = Object.entries(matchLabels)
      .map(([key, value]) => `${key}=${value}`)
      .join(",")

    // Get Pod metrics
    const metricsRes = (await this.customObjectsApi.listNamespacedCustomObject({
      group: "metrics.k8s.io",
      version: "v1beta1",
      namespace,
      plural: "pods",
      labelSelector,
    })) as { items?: any[] }

    const podMetricsList = metricsRes?.items ?? []

    if (podMetricsList.length === 0) {
      return {
        pods: [],
        totalCpuMillicores: 0,
        totalMemoryBytes: 0,
        totalMemoryMiB: 0,
      }
    }

    let totalCpuNano = 0
    let totalMemoryBytes = 0

    const pods: PodMetrics[] = podMetricsList.map((pod: any) => {
      const containers: any[] = pod.containers ?? []

      const containerMetrics: ContainerMetrics[] = containers.map(
        (containerMetric: any) => {
          const cpuUsage: string | undefined = containerMetric.usage?.cpu
          const memoryUsage: string | undefined = containerMetric.usage?.memory

          // Find the same container in Deployment spec
          const containerSpec = deploymentContainers.find(
            (container) => container.name === containerMetric.name
          )

          const cpuLimit = containerSpec?.resources?.limits?.cpu
          const memoryLimit = containerSpec?.resources?.limits?.memory

          // CPU
          let cpuUtilization: number | null = null

          if (cpuUsage) {
            const usageNano = parseCpuToNano(cpuUsage)
            totalCpuNano += usageNano

            if (cpuLimit) {
              const limitNano = parseCpuToNano(cpuLimit)
              cpuUtilization =
                limitNano > 0 ? (usageNano / limitNano) * 100 : null
            }
          }

          // Memory
          let memoryUtilization: number | null = null

          if (memoryUsage) {
            const usageBytes = parseMemoryToBytes(memoryUsage)
            totalMemoryBytes += usageBytes

            if (memoryLimit) {
              const limitBytes = parseMemoryToBytes(memoryLimit)
              memoryUtilization =
                limitBytes > 0 ? (usageBytes / limitBytes) * 100 : null
            }
          }

          return {
            name: containerMetric.name,

            cpu: {
              usage: cpuUsage ?? null,
              limit: cpuLimit ?? null,
              utilization: cpuUtilization,
            },

            memory: {
              usage: memoryUsage ?? null,
              limit: memoryLimit ?? null,
              utilization: memoryUtilization,
            },
          }
        }
      )

      return {
        name: pod.metadata?.name,
        containers: containerMetrics,
      }
    })

    return {
      pods,
      totalCpuMillicores: totalCpuNano / 1_000_000,
      totalMemoryBytes,
      totalMemoryMiB: totalMemoryBytes / (1024 * 1024),
    }
  }

  // TODO: Fix the unknown error
  // async getAllContainerUsage() {
  //   // Get actual Pod usage from Metrics Server
  //   const metricsRes =
  //     await this.customObjectsApi.listClusterCustomObject({
  //       group: "metrics.k8s.io",
  //       version: "v1beta1",
  //       plural: "pods",
  //     })

  //   const podMetricsList =
  //     (metricsRes as any)?.items ??
  //     (metricsRes as any)?.body?.items ??
  //     []

  //   let totalCpuNano = 0
  //   let totalMemoryBytes = 0

  //   const containers = []

  //   for (const pod of podMetricsList) {
  //     const namespace = pod.metadata?.namespace
  //     const podName = pod.metadata?.name

  //     for (const container of pod.containers ?? []) {
  //       const cpuUsage = container.usage?.cpu
  //       const memoryUsage = container.usage?.memory

  //       if (!cpuUsage || !memoryUsage) {
  //         continue
  //       }

  //       const cpuNano = parseCpuToNano(cpuUsage)
  //       const memoryBytes = parseMemoryToBytes(memoryUsage)

  //       totalCpuNano += cpuNano
  //       totalMemoryBytes += memoryBytes

  //       containers.push({
  //         namespace,
  //         pod: podName,
  //         container: container.name,

  //         cpu: {
  //           usage: cpuUsage,
  //           nanocores: cpuNano,
  //           millicores: cpuNano / 1_000_000,
  //           cores: cpuNano / 1_000_000_000,
  //         },

  //         memory: {
  //           usage: memoryUsage,
  //           bytes: memoryBytes,
  //           MiB: memoryBytes / (1024 * 1024),
  //           GiB: memoryBytes / (1024 * 1024 * 1024),
  //         },
  //       })
  //     }
  //   }

  //   const totalCpuCores =
  //     totalCpuNano / 1_000_000_000

  //   const totalCpuMillicores =
  //     totalCpuNano / 1_000_000

  //   const totalMemoryMiB =
  //     totalMemoryBytes / (1024 * 1024)

  //   const totalMemoryGiB =
  //     totalMemoryBytes / (1024 * 1024 * 1024)

  //   return {
  //     containers,

  //     total: {
  //       cpu: {
  //         nanocores: totalCpuNano,
  //         millicores: totalCpuMillicores,
  //         cores: totalCpuCores,
  //       },

  //       memory: {
  //         bytes: totalMemoryBytes,
  //         MiB: totalMemoryMiB,
  //         GiB: totalMemoryGiB,
  //       },
  //     },
  //   }
  // }
}
