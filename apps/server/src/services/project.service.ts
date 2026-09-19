import { inject, injectable } from "inversify"
import { K8sService, SecretMapDataType } from "./k8s.service"

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

type CreateSecretMapParams = {
  namespace: string
  secretName: string
  data: SecretMapDataType
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

  async createSecretMap({
    namespace,
    secretName,
    data,
  }: CreateSecretMapParams): Promise<string> {
    const baseEncodedSecrets = K8sService.GetBase64SecretData(data)

    const secret = await this.k8sService.k8sApi.createNamespacedSecret({
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
    data,
  }: CreateSecretMapParams) {
    const baseEncodedSecrets = K8sService.GetBase64SecretData(data)

    const secret = await this.k8sService.k8sApi.replaceNamespacedSecret({
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

    return secret.metadata?.name
  }

  async getSecretMap({
    namespace,
    secretName,
  }: Omit<CreateSecretMapParams, "data">) {
    const response = await this.k8sService.k8sApi.readNamespacedSecret({
      name: secretName,
      namespace,
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
    data,
    secretName,
  }: CreateDeploymentParams & CreateServiceParams & CreateSecretMapParams) {
    const createdSecretMapName = await this.createSecretMap({
      namespace,
      data,
      secretName,
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
                      ...Object.keys(data).map((key) => {
                        return {
                          name: data[key].name,
                          valueFrom: {
                            secretKeyRef: {
                              name: createdSecretMapName,
                              key: data[key].value,
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
    console.log("Deployment Created: ", deployment)

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
    data,
    serviceName,
  }: CreateDeploymentParams & CreateSecretMapParams & CreateServiceParams) {
    let secretMapName: string

    const getExistedSecretMap = await this.getSecretMap({
      namespace,
      secretName,
    })

    if (!getExistedSecretMap) {
      secretMapName = await this.createSecretMap({
        data,
        namespace,
        secretName,
      })
    } else {
      secretMapName = getExistedSecretMap.metadata?.name as string
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
                      ...Object.keys(data).map((key) => {
                        return {
                          name: data[key].name,
                          valueFrom: {
                            secretKeyRef: {
                              name: secretMapName,
                              key: data[key].value,
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
    return data
  }
}
