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

@injectable()
export class K8sService {
  private kc
  public k8sApi
  public appsApi
  public static FIELD_MANAGER: string = "kubehost"
  constructor() {
    this.kc = new k8s.KubeConfig()
    this.kc.loadFromDefault()
    this.k8sApi = this.kc.makeApiClient(k8s.CoreV1Api)
    this.appsApi = this.kc.makeApiClient(k8s.AppsV1Api)
  }

  async listAllPods() {
    const res = await this.k8sApi.listNamespacedPod({ namespace: "default" })
    console.log(res)
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
    const response = await this.k8sApi.readNamespacedSecret({
      name: secretName,
      namespace,
    })

    return response
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
    const response = await this.k8sApi.readNamespacedConfigMap({
      name: configName,
      namespace,
    })

    return response
  }
}
