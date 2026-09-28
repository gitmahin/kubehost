// import { inject, injectable } from "inversify"
// import { K8sService } from "./k8s.service"
// import { ApiError, getCpuCores } from "@/libs"
// import os from "node:os"
// import { parseMemoryToBytes } from "@/utils/parseMemoryToBytes"

// function parseCpuToMillicores(cpu: string): number {
//   const value = parseFloat(cpu)

//   if (cpu.endsWith("n")) {
//     return value / 1_000_000
//   }

//   if (cpu.endsWith("u")) {
//     return value / 1_000
//   }

//   if (cpu.endsWith("m")) {
//     return value
//   }

//   return value * 1000
// }

// @injectable()
// export class AutoScaleService {
//   constructor(
//     @inject(K8sService)
//     private k8sService: K8sService
//   ) {}

//   async autoScaleDeployment(namespace: string, deploymentName: string) {
//     /**
//      * Get current Deployment.
//      */
//     const deployment = await this.k8sService.appsApi.readNamespacedDeployment({
//       name: deploymentName,
//       namespace,
//     })

//     const systemUsage = await this.k8sService.getAllContainerUsage()
//     const { total } = systemUsage

//     // Total CPU cores available on the system
//     const totalCpuCores = getCpuCores()

//     // Total RAM available on the system
//     const totalMemoryBytes = os.totalmem()

//     const cpuUsagePercent = (total.cpu.cores / totalCpuCores) * 100
//     const ramUsagePercent = (total.memory.bytes / totalMemoryBytes) * 100

//     if (cpuUsagePercent > 80 && ramUsagePercent > 85) {
//       console.log("System resource usage is critically high")
//       this.scaleDownAll()
//     }

//     /**
//      * Check CPU metrics.
//      */
//     const metrics = await this.k8sService.getDeploymentMetrics(
//       namespace,
//       deploymentName,
//       90,
//       90
//     )

//     /**
//      * No container is above 70%.
//      */
//     if (!metrics.shouldScale) {
//       return {
//         scaled: false,
//         reason: "CPU utilization is below threshold",
//         replicas: deployment.spec?.replicas ?? 1,
//       }
//     }

//     /**
//      * Current replica count.
//      */
//     const currentReplicas = deployment.spec?.replicas ?? 1

//     const newReplicas = currentReplicas + 1
//     const response = await this.k8sService.appsApi.patchNamespacedDeployment({
//       name: deploymentName,
//       namespace,

//       body: {
//         spec: {
//           replicas: newReplicas,
//         },
//       },

//       fieldManager: K8sService.FIELD_MANAGER,
//     })

//     return {
//       scaled: true,
//       reason: "CPU utilization exceeded threshold",
//       previousReplicas: currentReplicas,
//       replicas: newReplicas,
//       deployment: response,
//     }
//   }

//   async scaleDownAll() {
//     try {
//       const deployments =
//         await this.k8sService.appsApi.listDeploymentForAllNamespaces({
//           labelSelector: "managed-by=kubehost",
//         })

//       for (const deployment of deployments.items) {
//         const namespace = deployment.metadata?.namespace
//         const name = deployment.metadata?.name

//         if (!namespace || !name) {
//           continue
//         }

//         const replicas = deployment.spec?.replicas ?? 1

//         if (replicas <= 1) {
//           continue
//         }

//         console.log(`Scaling down ${namespace}/${name}: ${replicas} -> 1`)

//         if (!deployment.spec?.selector) {
//           console.error(
//             `Cannot scale ${namespace}/${name}: selector is missing`
//           )
//           continue
//         }

//         if (!deployment.spec.template) {
//           console.error(
//             `Cannot scale ${namespace}/${name}: template is missing`
//           )
//           continue
//         }

//         await this.k8sService.appsApi.replaceNamespacedDeployment({
//           name,
//           namespace,

//           body: {
//             apiVersion: "apps/v1",
//             kind: "Deployment",

//             metadata: {
//               ...deployment.metadata,
//               name,
//             },

//             spec: {
//               ...deployment.spec,

//               // Only change this
//               replicas: 1,

//               // Explicitly preserve required fields
//               selector: deployment.spec.selector,
//               template: deployment.spec.template,
//             },
//           },

//           fieldManager: K8sService.FIELD_MANAGER,
//         })

//         console.log(`Scaled down ${namespace}/${name} successfully`)
//       }
//     } catch (error) {
//       console.error("Failed to scale down deployments:", error)
//     }
//   }

//  async checkResourceSpike() {
//   const usage = await this.k8sService.getAllContainerUsage()

//   const nodes =
//     await this.k8sService.k8sApi.listNode()

//   let totalCpuMillicores = 0
//   let totalMemoryBytes = 0

//   for (const node of nodes.items) {
//     const cpu = node.status?.allocatable?.cpu
//     const memory = node.status?.allocatable?.memory

//     if (cpu) {
//       totalCpuMillicores += parseCpuToMillicores(cpu)
//     }

//     if (memory) {
//       totalMemoryBytes += parseMemoryToBytes(memory)
//     }
//   }

//   const cpuUsagePercent =
//     totalCpuMillicores > 0
//       ? (usage.total.cpu.millicores / totalCpuMillicores) * 100
//       : 0

//   const memoryUsagePercent =
//     totalMemoryBytes > 0
//       ? (usage.total.memory.bytes / totalMemoryBytes) * 100
//       : 0

//   console.log("\n========== Resource Usage ==========")

//   console.log(
//     `CPU: ${usage.total.cpu.cores.toFixed(4)} cores`
//   )

//   console.log(
//     `CPU Usage: ${cpuUsagePercent.toFixed(2)}%`
//   )

//   console.log(
//     `Memory: ${usage.total.memory.GiB.toFixed(2)} GiB`
//   )

//   console.log(
//     `Memory Usage: ${memoryUsagePercent.toFixed(2)}%`
//   )

//   console.log("===================================\n")

//   const CPU_SPIKE_THRESHOLD = 50
//   const MEMORY_SPIKE_THRESHOLD = 50

//   const isSpike =
//     cpuUsagePercent >= CPU_SPIKE_THRESHOLD ||
//     memoryUsagePercent >= MEMORY_SPIKE_THRESHOLD

//   if (isSpike) {
//     console.warn(
//       `[AutoScale] 🚨 RESOURCE SPIKE ` +
//       `CPU=${cpuUsagePercent.toFixed(2)}% ` +
//       `Memory=${memoryUsagePercent.toFixed(2)}%`
//     )

//     await this.scaleDownAll()
//   }

//   return {
//     isSpike,
//     cpuUsagePercent,
//     memoryUsagePercent,
//   }
// }
// }
