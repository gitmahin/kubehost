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

  async getDeployments(namespace: string) {
    const response = namespace
      ? await this.k8sService.appsApi.listNamespacedDeployment({ namespace })
      : await this.k8sService.appsApi.listDeploymentForAllNamespaces()

    const filtered = response.items.filter((deployment) => {
      const isManaged = deployment.metadata?.managedFields?.some(
        (mf) => mf.manager === K8sService.FIELD_MANAGER
      )
      console.log(
        deployment.metadata?.name,
        "-> managed by kubehost?",
        isManaged
      )
      return isManaged
    })

    console.log("Filtered count:", filtered.length)

    return filtered.map((deployment) => {
      const container = deployment.spec?.template?.spec?.containers?.[0]

      const availableCondition = deployment.status?.conditions?.find(
        (c) => c.type === "Available"
      )

      return {
        name: deployment.metadata?.name,
        namespace: deployment.metadata?.namespace,
        image: container?.image,
        containerPort: container?.ports?.[0]?.containerPort,

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

    const deployment = await this.k8sService.appsApi.createNamespacedDeployment(
      {
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
      }
    )

    const service = await this.k8sService.k8sApi.createNamespacedService({
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
              port: 80,
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

    console.log("Deployment Created: ", deployment)
    console.log("Service Created: ", service)
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
                            secretKeyRef: {
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

    const updatedService =
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

      if (existedIngress.metadata?.name) {
        await this.k8sService.updateIngress({
          host,
          ingressName,
          namespace,
          serviceName,
          servicePort,
          path,
        })
      }

      await this.k8sService.createIngress({
        host,
        ingressName,
        namespace,
        serviceName,
        servicePort,
        path,
      })
    }
    console.log("Updated existing deployment:", updatedDeploymentResponse)
    console.log("Updated existing Service:", updatedService)
    return updatedDeploymentResponse
  }
}
