import * as k8s from "@kubernetes/client-node"
import { injectable } from "inversify"

export type SecretMapDataType = {
    [key: string]: {
      name: string
      value: string
    }
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

   static GetBase64SecretData(data: SecretMapDataType ) {
    return Object.fromEntries(
      Object.entries(data).map(([key, data]) => {
        return [key, Buffer.from(data.value).toString("base64")]
      })
    )
  }
}
