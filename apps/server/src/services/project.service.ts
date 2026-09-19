import { inject, injectable } from "inversify"
import {
  CreateConfigMapParams,
  CreateSecretMapParams,
  K8sService,
} from "./k8s.service"

type CreateDeploymentParams = {
  namespace: string
  deploymentName: string
  containerName: string
  image: string
  containerPort: number
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
    const namespace = {
      metadata: {
        name: projectName,
      },
    }

    const response = await this.k8sService.k8sApi.createNamespace({
      body: namespace,
    })

    return response
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
  }: CreateDeploymentParams &
    CreateServiceParams &
    CreateSecretMapParams &
    CreateConfigMapParams) {
    const createdSecretMapName = await this.k8sService.createSecretMap({
      namespace,
      secretEnvs,
      secretName,
    })

    const createdConfigMapName = await this.k8sService.createConfigMap({
      namespace,
      nonSecretEnvs,
      configName,
    })

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
                          name: secretEnvs[key].name,
                          valueFrom: {
                            secretKeyRef: {
                              name: createdSecretMapName,
                              key: secretEnvs[key].value,
                            },
                          },
                        }
                      }),
                      ...Object.keys(nonSecretEnvs).map((key) => {
                        return {
                          name: nonSecretEnvs[key].name,
                          valueFrom: {
                            secretKeyRef: {
                              name: createdConfigMapName,
                              key: nonSecretEnvs[key].value,
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
  }: CreateDeploymentParams &
    CreateSecretMapParams &
    CreateServiceParams &
    CreateConfigMapParams) {
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
                          name: secretEnvs[key].name,
                          valueFrom: {
                            secretKeyRef: {
                              name: secretMapName,
                              key: secretEnvs[key].value,
                            },
                          },
                        }
                      }),
                      ...Object.keys(nonSecretEnvs).map((key) => {
                        return {
                          name: nonSecretEnvs[key].name,
                          valueFrom: {
                            secretKeyRef: {
                              name: configMapName,
                              key: nonSecretEnvs[key].value,
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
                port: 80,
                targetPort: containerPort,
              },
            ],
          },
        },

        fieldManager: K8sService.FIELD_MANAGER,
      })

    console.log("Updated existing deployment:", updatedDeploymentResponse)
    console.log("Updated existing Service:", updatedService)
    return updatedDeploymentResponse
  }
}
