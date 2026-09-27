import { inject, injectable } from "inversify"
import { K8sService, type CreateConfigMapParams } from "./k8s.service"
import { ApiError } from "@/libs"
import { getSystemCustomErrorMsgByKey } from "@/events"
import type { DeploymentEditData } from "./project.service"

type SavePeakRequestParamsType = {} & CreateConfigMapParams
type LimiCpuParamsType = {} & Pick<
  DeploymentEditData,
  "deploymentName" | "projectName"
>

@injectable()
export class AutoScaleService {
  constructor(
    @inject(K8sService)
    private k8sService: K8sService
  ) {}

  async savePeakRequest({
    configName,
    namespace,
    nonSecretEnvs,
  }: SavePeakRequestParamsType) {
    let configMapName: string
    const getExistedConfigMap = await this.k8sService.getConfigMap({
      namespace,
      configName,
    })

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
  }

  async limitCpu({ deploymentName, projectName }: LimiCpuParamsType) {
    const deployment = await this.k8sService.appsApi.readNamespacedDeployment({
      name: deploymentName,
      namespace: projectName,
    })

    const container = deployment.spec?.template?.spec?.containers?.[0]

    if (!container) {
      throw new Error("Container not found")
    }

    container.resources ??= {}

    const metrics = await this.k8sService.metricsApi.getPodMetrics(namespace)

    container.resources.limits = {
      ...container.resources.limits,
      cpu,
    }

    return this.k8sService.appsApi.replaceNamespacedDeployment({
      name: deploymentName,
      namespace,
      body: deployment,
      fieldManager: K8sService.FIELD_MANAGER,
    })
  }

  async getDeploymentMetrics(namespace: string, deploymentName: string) {
    try {
      console.log(
        `Fetching metrics for deployment: ${deploymentName} in namespace: ${namespace}...\n`
      )

      // 2. Fetch the Deployment status metadata
      const deployRes = await this.k8sService.appsApi.readNamespacedDeployment({
        name: deploymentName,
        namespace: namespace,
      })
      const deployment = deployRes.spec?.template?.spec?.containers?.[0]

      // 3. Extract the label selector to find the managed Pods
      const matchLabels = deployRes.spec?.selector.matchLabels
      const labelSelector = Object.entries(matchLabels)
        .map(([key, val]) => `${key}=${val}`)
        .join(",")

      // 4. Query the Metrics API for the resource metrics of these matching pods
      // Endpoint: /apis/metrics.k8s.io/v1beta1/namespaces/{namespace}/pods?labelSelector={selector}
      const metricsRes = await customObjectsApi.listNamespacedCustomObject(
        "metrics.k8s.io",
        "v1beta1",
        namespace,
        "pods",
        undefined, // pretty
        undefined, // allowWatchBookmarks
        undefined, // continue
        undefined, // fieldSelector
        labelSelector // Filter metrics by deployment pod labels
      )

      console.log("--- Resource Utilization Metrics ---")
      const podMetricsList = metricsRes.body.items || []

      if (podMetricsList.length === 0) {
        console.log(
          "No active resource metrics found. Ensure metrics-server is running."
        )
        return
      }

      let totalCpuNano = 0
      let totalMemoryKi = 0

      podMetricsList.forEach((pod) => {
        console.log(`Pod: ${pod.metadata.name}`)
        pod.containers.forEach((container) => {
          const cpu = container.usage.cpu // e.g., "100m" or "5000000n"
          const mem = container.usage.memory // e.g., "256Mi" or "1024Ki"

          console.log(
            `  Container: ${container.name} | CPU: ${cpu} | Memory: ${mem}`
          )

          // Parse CPU to Nanocores
          if (cpu.endsWith("n")) totalCpuNano += parseInt(cpu)
          else if (cpu.endsWith("m")) totalCpuNano += parseInt(cpu) * 1000000
          else totalCpuNano += parseInt(cpu) * 1000000000

          // Parse Memory to Kibibytes (Ki)
          if (mem.endsWith("Ki")) totalMemoryKi += parseInt(mem)
          else if (mem.endsWith("Mi")) totalMemoryKi += parseInt(mem) * 1024
          else if (mem.endsWith("Gi"))
            totalMemoryKi += parseInt(mem) * 1024 * 1024
        })
      })

      console.log("\n--- Aggregated Resource Totals ---")
      console.log(
        `Total CPU Usage:    ${(totalCpuNano / 1000000).toFixed(2)} millicores`
      )
      console.log(
        `Total Memory Usage: ${(totalMemoryKi / 1024).toFixed(2)} MiB`
      )
    } catch (error) {
      console.error(
        "Error fetching metrics:",
        error.response ? error.response.body : error.message
      )
    }
  }
}
