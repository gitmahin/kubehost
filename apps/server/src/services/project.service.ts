import { inject, injectable } from "inversify"
import type {
  CreateConfigMapParams,
  CreateIngressParams,
  CreateSecretMapParams,
} from "./k8s.service"

import { K8sService } from "./k8s.service"
import { ApiError } from "@/libs"
import { getSystemCustomErrorMsgByKey } from "@/events"
import type { ApplicationCreateInputType } from "@repo/zod"
import type { DeploymentDashboard } from "@repo/types"

export type DeploymentEditData = {
  deploymentName: string
  projectName: string

  image: string
  containerName: string
  containerPort: number
  replicas: number

  portBinding: number

  visibility: "private" | "public"
  host: string
  path: string

  envVars: {
    key: string
    name: string
    value: string
    isSecret: boolean
  }[]
}

type CreateDeploymentParams = {
  namespace: string
  deploymentName: string
  containerName: string
  image: string
  containerPort: number
  visibility: ApplicationCreateInputType["visibility"]
  replicas: number
  labelName: string
}

type CreateServiceParams = {
  serviceName: string
}

type DeleteDeploymentParams = {
  namespace: string
  deploymentName: string
  serviceName: string
  secretName: string
  configName: string
  ingressName: string
}

@injectable()
export class ProjectService {
  constructor(
    @inject(K8sService)
    private k8sService: K8sService
  ) {}
  async createNewProject(projectName: string) {
    try {
      await this.k8sService.k8sApi.readNamespace({ name: projectName })

      throw new ApiError(
        409,
        getSystemCustomErrorMsgByKey("NAMESPACE_ALREADY_EXISTS")
      )
    } catch (err: any) {
      if (err?.code !== 404) {
        throw err
      }
    }

    const response = await this.k8sService.k8sApi.createNamespace({
      body: {
        metadata: {
          name: projectName,
        },
      },
      fieldManager: K8sService.FIELD_MANAGER,
    })

    return response
  }

  async deleteProject(projectName: string) {
    try {
      await this.k8sService.k8sApi.readNamespace({
        name: projectName,
      })
    } catch (err: any) {
      if (err?.code === 404) {
        throw new ApiError(
          404,
          getSystemCustomErrorMsgByKey("NAMESPACE_NOT_FOUND")
        )
      }

      throw err
    }

    const response = await this.k8sService.k8sApi.deleteNamespace({
      name: projectName,
    })

    return response
  }

  async getProjectNames() {
    const response = await this.k8sService.k8sApi.listNamespace()

    return response.items
      .filter((ns) =>
        ns.metadata?.managedFields?.some(
          (mf) => mf.manager === K8sService.FIELD_MANAGER
        )
      )
      .map((ns) => ({
        name: ns.metadata?.name,
        status: ns.status?.phase,
        createdAt: ns.metadata?.creationTimestamp,
      }))
  }

  async getDeployments(namespace?: string) {
    const response = namespace
      ? await this.k8sService.appsApi.listNamespacedDeployment({ namespace })
      : await this.k8sService.appsApi.listDeploymentForAllNamespaces()

    const filtered = response.items.filter((deployment) => {
      const isManaged = deployment.metadata?.managedFields?.some(
        (mf) => mf.manager === K8sService.FIELD_MANAGER
      )
      // console.log(
      //   deployment.metadata?.name,
      //   "-> managed by kubehost?",
      //   isManaged
      // )
      return isManaged
    })

    // console.log("Filtered count:", filtered.length)

    return filtered.map((deployment) => {
      const container = deployment.spec?.template?.spec?.containers?.[0]

      const availableCondition = deployment.status?.conditions?.find(
        (c) => c.type === "Available"
      )

      return {
        name: deployment.metadata?.name,
        namespace: deployment.metadata?.namespace,

        image: {
          name: container?.image,
          pullPolicy: container?.imagePullPolicy,
        },

        container: {
          name: container?.name,
          port: container?.ports?.[0]?.containerPort,
          command: container?.command,
          args: container?.args,
          workingDir: container?.workingDir,
        },

        resources: {
          requests: container?.resources?.requests,
          limits: container?.resources?.limits,
        },

        replicas: {
          desired: deployment.spec?.replicas ?? 0,
          ready: deployment.status?.readyReplicas ?? 0,
          available: deployment.status?.availableReplicas ?? 0,
          updated: deployment.status?.updatedReplicas ?? 0,
        },

        status: availableCondition?.status === "True" ? "Running" : "Not Ready",

        statusMessage: availableCondition?.message,

        createdAt: deployment.metadata?.creationTimestamp,

        labels: deployment.metadata?.labels,
      }
    })
  }

  async createDeployment({
    namespace,
    deploymentName,
    containerName,
    image,
    containerPort,
    replicas,
    labelName,
    serviceName,
    secretEnvs,
    secretName,
    configName,
    nonSecretEnvs,
    host,
    ingressName,
    servicePort,
    visibility,
    path,
  }: CreateDeploymentParams &
    CreateServiceParams &
    CreateSecretMapParams &
    CreateConfigMapParams &
    CreateIngressParams) {
    try {
      await this.k8sService.appsApi.readNamespacedDeployment({
        name: deploymentName,
        namespace,
      })

      throw new ApiError(
        409,
        getSystemCustomErrorMsgByKey("DEPLOYMENT_ALREADY_EXISTS")
      )
    } catch (err: any) {
      if (err?.code !== 404) {
        throw err
      }
    }
    let createdSecretMapName: string
    let createdConfigMapName: string
    try {
      createdSecretMapName = await this.k8sService.createSecretMap({
        namespace,
        secretEnvs,
        secretName,
      })
    } catch (error) {
      const update = await this.k8sService.updateSecretMap({
        namespace,
        secretEnvs,
        secretName,
      })

      createdSecretMapName = update.metadata?.name as string
    }

    try {
      createdConfigMapName = await this.k8sService.createConfigMap({
        namespace,
        nonSecretEnvs,
        configName,
      })
    } catch (error) {
      const update = await this.k8sService.updateConfigMap({
        namespace,
        nonSecretEnvs,
        configName,
      })

      createdConfigMapName = update.metadata?.name as string
    }

    await this.k8sService.appsApi.createNamespacedDeployment({
      namespace: namespace,
      body: {
        apiVersion: "apps/v1",
        kind: "Deployment",
        metadata: {
          name: deploymentName,
          labels: {
            app: labelName,
          },
        },
        spec: {
          replicas,
          selector: { matchLabels: { app: labelName } },
          template: {
            metadata: { labels: { app: labelName } },
            spec: {
              containers: [
                {
                  name: containerName,
                  image: image,
                  ports: [
                    {
                      containerPort,
                      protocol: "TCP",
                    },
                  ],
                  env: [
                    ...Object.keys(secretEnvs).map((key) => {
                      return {
                        name: secretEnvs[key]!.name,
                        valueFrom: {
                          secretKeyRef: {
                            name: createdSecretMapName,
                            key: key,
                          },
                        },
                      }
                    }),
                    ...Object.keys(nonSecretEnvs).map((key) => {
                      return {
                        name: nonSecretEnvs[key]!.name,
                        valueFrom: {
                          configMapKeyRef: {
                            name: createdConfigMapName,
                            key: key,
                          },
                        },
                      }
                    }),
                  ],
                },
              ],
            },
          },
        },
      },

      fieldManager: K8sService.FIELD_MANAGER,
    })

    await this.k8sService.k8sApi.createNamespacedService({
      namespace,
      body: {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: serviceName,
        },
        spec: {
          selector: {
            app: labelName,
          },
          ports: [
            {
              protocol: "TCP",
              port: servicePort,
              targetPort: containerPort,
            },
          ],
        },
      },

      fieldManager: K8sService.FIELD_MANAGER,
    })

    if (visibility == "public") {
      try {
        await this.k8sService.createIngress({
          host,
          ingressName,
          namespace,
          serviceName,
          servicePort,
          path,
        })
      } catch (error) {
        await this.k8sService.updateIngress({
          host,
          ingressName,
          namespace,
          serviceName,
          servicePort,
          path,
        })
      }
    }

    // console.log("Deployment Created: ", deployment)
    // console.log("Service Created: ", service)
  }

  async updateDeployment({
    namespace,
    deploymentName,
    containerName,
    image,
    containerPort,
    replicas,
    labelName,
    secretName,
    secretEnvs,
    serviceName,
    configName,
    nonSecretEnvs,
    host,
    ingressName,
    servicePort,
    visibility,
    path,
  }: CreateDeploymentParams &
    CreateSecretMapParams &
    CreateServiceParams &
    CreateConfigMapParams &
    CreateIngressParams) {
    try {
      await this.k8sService.appsApi.readNamespacedDeployment({
        name: deploymentName,
        namespace,
      })
    } catch (err: any) {
      if (err?.code === 404) {
        throw new ApiError(
          404,
          getSystemCustomErrorMsgByKey("DEPLOYMENT_NOT_FOUND")
        )
      }
      throw err
    }

    let secretMapName: string
    let configMapName: string

    const getExistedSecretMap = await this.k8sService.getSecretMap({
      namespace,
      secretName,
    })

    const getExistedConfigMap = await this.k8sService.getConfigMap({
      namespace,
      configName,
    })

    // Create or update Config Map
    if (!getExistedConfigMap) {
      configMapName = await this.k8sService.createConfigMap({
        nonSecretEnvs,
        namespace,
        configName,
      })
    } else {
      const response = await this.k8sService.updateConfigMap({
        nonSecretEnvs,
        namespace,
        configName,
      })

      configMapName = response.metadata?.name as string
    }

    // Create or update Secret Map
    if (!getExistedSecretMap) {
      secretMapName = await this.k8sService.createSecretMap({
        secretEnvs,
        namespace,
        secretName,
      })
    } else {
      const response = await this.k8sService.updateSecretMap({
        secretEnvs,
        namespace,
        secretName,
      })

      secretMapName = response.metadata?.name as string
    }

    const updatedDeploymentResponse =
      await this.k8sService.appsApi.replaceNamespacedDeployment({
        name: deploymentName,
        namespace,
        body: {
          apiVersion: "apps/v1",
          kind: "Deployment",
          metadata: { name: deploymentName, labels: { app: labelName } },
          spec: {
            replicas,
            selector: { matchLabels: { app: labelName } },
            template: {
              metadata: { labels: { app: labelName } },
              spec: {
                containers: [
                  {
                    name: containerName,
                    image: image,
                    ports: [{ containerPort: containerPort }],
                    env: [
                      ...Object.keys(secretEnvs).map((key) => {
                        return {
                          name: secretEnvs[key]!.name,
                          valueFrom: {
                            secretKeyRef: {
                              name: secretMapName,
                              key: key,
                            },
                          },
                        }
                      }),
                      ...Object.keys(nonSecretEnvs).map((key) => {
                        return {
                          name: nonSecretEnvs[key]!.name,
                          valueFrom: {
                            configMapKeyRef: {
                              name: configMapName,
                              key: key,
                            },
                          },
                        }
                      }),
                    ],
                  },
                ],
              },
            },
          },
        },

        fieldManager: K8sService.FIELD_MANAGER,
      })

    await this.k8sService.k8sApi.replaceNamespacedService({
      name: serviceName,
      namespace,
      body: {
        apiVersion: "v1",
        kind: "Service",
        metadata: {
          name: serviceName,
        },
        spec: {
          selector: {
            app: labelName,
          },
          ports: [
            {
              protocol: "TCP",
              port: servicePort,
              targetPort: containerPort,
            },
          ],
        },
      },

      fieldManager: K8sService.FIELD_MANAGER,
    })

    if (visibility == "public") {
      const existedIngress = await this.k8sService.getIngress({
        ingressName,
        namespace,
      })

      if (existedIngress) {
        await this.k8sService.updateIngress({
          host,
          ingressName,
          namespace,
          serviceName,
          servicePort,
          path,
        })
      } else {
        await this.k8sService.createIngress({
          host,
          ingressName,
          namespace,
          serviceName,
          servicePort,
          path,
        })
      }
    } else {
      await this.k8sService.deleteIngress({
        ingressName,
        namespace,
      })
    }
    // console.log("Updated existing deployment:", updatedDeploymentResponse)
    // console.log("Updated existing Service:", updatedService)
    return updatedDeploymentResponse
  }

  async deleteDeployment({
    namespace,
    deploymentName,
    serviceName,
    secretName,
    configName,
    ingressName,
  }: DeleteDeploymentParams) {
    try {
      await this.k8sService.appsApi.readNamespacedDeployment({
        name: deploymentName,
        namespace,
      })
    } catch (err: any) {
      if (err?.code === 404) {
        throw new ApiError(
          404,
          getSystemCustomErrorMsgByKey("DEPLOYMENT_NOT_FOUND")
        )
      }
      throw err
    }

    await this.k8sService.deleteIngress({ namespace, ingressName })

    await this.k8sService.deleteService({ namespace, serviceName })

    await this.k8sService.deleteDeployment({ namespace, deploymentName })

    await Promise.all([
      this.k8sService.deleteSecretMap({ namespace, secretName }),
      this.k8sService.deleteConfigMap({ namespace, configName }),
    ])
  }

  async getAllDomains() {
    const response =
      await this.k8sService.networkingApi.listIngressForAllNamespaces()

    return response.items.flatMap((ingress) =>
      (ingress.spec?.rules ?? []).map((rule) => ({
        host: rule.host,
        namespace: ingress.metadata?.namespace,
        ingress: ingress.metadata?.name,
      }))
    )
  }

  async getDeploymentDashboard(
    namespace: string,
    deploymentName: string
  ): Promise<DeploymentDashboard | null> {
    const [deploymentResponse, serviceResponse, ingressResponse, podResponse] =
      await Promise.all([
        this.k8sService.appsApi.readNamespacedDeployment({
          name: deploymentName,
          namespace,
        }),

        this.k8sService.k8sApi.listNamespacedService({
          namespace,
        }),

        this.k8sService.networkingApi.listNamespacedIngress({
          namespace,
        }),

        this.k8sService.k8sApi.listNamespacedPod({
          namespace,
          labelSelector: `app=${deploymentName}`,
        }),
      ])

    const deployment = deploymentResponse

    const container = deployment.spec?.template?.spec?.containers?.[0]

    const replicas = {
      desired: deployment.spec?.replicas ?? 0,
      ready: deployment.status?.readyReplicas ?? 0,
      available: deployment.status?.availableReplicas ?? 0,
      updated: deployment.status?.updatedReplicas ?? 0,
    }

    // Find Service belonging to this Deployment.
    const service = serviceResponse.items.find((service) => {
      const selector = service.spec?.selector

      if (!selector) return false

      return Object.entries(selector).every(
        ([key, value]) =>
          deployment.spec?.template?.metadata?.labels?.[key] === value
      )
    })

    // Pods belonging to this Deployment.
    const pods = podResponse.items.filter((pod) => {
      const labels = pod.metadata?.labels
      const deploymentLabels = deployment.spec?.template?.metadata?.labels

      if (!labels || !deploymentLabels) return false

      return Object.entries(deploymentLabels).every(
        ([key, value]) => labels[key] === value
      )
    })

    // Find Ingress rules that point to this Service.
    const ingress = ingressResponse.items.flatMap((item) =>
      (item.spec?.rules ?? []).flatMap((rule) =>
        (rule.http?.paths ?? [])
          .filter(
            (path) => path.backend.service?.name === service?.metadata?.name
          )
          .map((path) => ({
            name: item.metadata?.name,
            host: rule.host,
            path: path.path,
            pathType: path.pathType,
          }))
      )
    )

    return {
      deployment: {
        name: deployment.metadata?.name,
        namespace: deployment.metadata?.namespace,
        image: container?.image,
        containerPort: container?.ports?.[0]?.containerPort,
        replicas,
        createdAt: deployment.metadata?.creationTimestamp,
      },

      service: service
        ? {
            name: service.metadata?.name,
            type: service.spec?.type,
            clusterIP: service.spec?.clusterIP,
            ports:
              service.spec?.ports?.map((port) => ({
                port: port.port,
                targetPort: port.targetPort,
                protocol: port.protocol,
              })) ?? [],
          }
        : undefined,

      ingress,

      pods: pods.map((pod) => ({
        name: pod.metadata?.name,
        status: pod.status?.phase,
        podIP: pod.status?.podIP,
        nodeName: pod.spec?.nodeName,
        restarts:
          pod.status?.containerStatuses?.reduce(
            (total, container) => total + (container.restartCount ?? 0),
            0
          ) ?? 0,
        createdAt: pod.metadata?.creationTimestamp,
      })),
    }
  }

  async getDeploymentEditData(
    namespace: string,
    deploymentName: string
  ): Promise<DeploymentEditData> {
    const [deployment, services, ingresses] = await Promise.all([
      this.k8sService.appsApi.readNamespacedDeployment({
        name: deploymentName,
        namespace,
      }),

      this.k8sService.k8sApi.listNamespacedService({
        namespace,
      }),

      this.k8sService.networkingApi.listNamespacedIngress({
        namespace,
      }),
    ])

    const container = deployment.spec?.template?.spec?.containers?.[0]

    if (!container) {
      throw new Error(`No container found in deployment "${deploymentName}"`)
    }

    // Service
    const deploymentLabels = deployment.spec?.template?.metadata?.labels ?? {}

    const service = services.items.find((service) => {
      const selector = service.spec?.selector

      if (!selector) return false

      return Object.entries(selector).every(
        ([key, value]) => deploymentLabels[key] === value
      )
    })

    // Ingress
    let host = ""
    let path = "/"
    let visibility: "private" | "public" = "private"

    if (service) {
      for (const ingress of ingresses.items) {
        for (const rule of ingress.spec?.rules ?? []) {
          for (const ingressPath of rule.http?.paths ?? []) {
            if (ingressPath.backend.service?.name === service.metadata?.name) {
              visibility = "public"
              host = rule.host ?? ""

              const ingressPathValue = ingressPath.path ?? "/"

              if (ingressPathValue === "/(.*)") {
                path = "/"
              } else if (ingressPathValue.endsWith("/(.*)")) {
                path = ingressPathValue.slice(0, -4) || "/"
              } else {
                path = ingressPathValue
              }

              break
            }
          }
        }
      }
    }

    // Environment variables
    const envVars = await Promise.all(
      (container.env ?? []).map(async (env) => {
        // Direct value
        if (env.value !== undefined) {
          return {
            key: env.name ?? "",
            name: env.name ?? "",
            value: env.value,
            isSecret: false,
          }
        }

        // Secret
        if (env.valueFrom?.secretKeyRef) {
          const secretRef = env.valueFrom.secretKeyRef

          const secret = await this.k8sService.k8sApi.readNamespacedSecret({
            name: secretRef.name!,
            namespace,
          })

          const encodedValue = secret.data?.[secretRef.key!]

          return {
            key: secretRef.key ?? "",
            name: env.name ?? "",
            value: encodedValue
              ? Buffer.from(encodedValue, "base64").toString("utf8")
              : "",
            isSecret: true,
          }
        }

        // ConfigMap
        if (env.valueFrom?.configMapKeyRef) {
          const configMapRef = env.valueFrom.configMapKeyRef

          const configMap =
            await this.k8sService.k8sApi.readNamespacedConfigMap({
              name: configMapRef.name!,
              namespace,
            })

          return {
            key: configMapRef.key ?? "",
            name: env.name ?? "",
            value: configMap.data?.[configMapRef.key!] ?? "",
            isSecret: false,
          }
        }

        return {
          key: env.name ?? "",
          name: env.name ?? "",
          value: "",
          isSecret: false,
        }
      })
    )

    // Service port
    const portBinding = service?.spec?.ports?.[0]?.port ?? 80

    return {
      deploymentName: deployment.metadata?.name ?? deploymentName,
      projectName: namespace,
      image: container.image ?? "",
      containerName: container.name ?? "",
      containerPort: container.ports?.[0]?.containerPort ?? 3000,
      replicas: deployment.spec?.replicas ?? 1,
      portBinding,
      visibility,
      host,
      path,
      envVars,
    }
  }
}
