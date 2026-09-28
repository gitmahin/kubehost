import Skeleton from "react-loading-skeleton"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table"

import { cn } from "@workspace/ui/lib/utils"

import type { DeploymentMetrics, ResourceMetric } from "@repo/types"

function formatCpu(value?: string | null) {
  if (!value) return "-"
  const num = parseFloat(value)
  let millicores: number
  if (value.endsWith("n")) millicores = num / 1_000_000
  else if (value.endsWith("u")) millicores = num / 1_000
  else if (value.endsWith("m")) millicores = num
  else millicores = num * 1000
  return `${millicores.toFixed(millicores < 10 ? 1 : 0)}m`
}

function formatMemory(value?: string | null) {
  if (!value) return "-"
  const num = parseFloat(value)
  const units: Record<string, number> = {
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
    K: 1000,
    M: 1000 ** 2,
    G: 1000 ** 3,
    T: 1000 ** 4,
  }
  const unit = Object.keys(units).find((u) => value.endsWith(u))
  const bytes = unit ? num * units[unit]! : num
  const mib = bytes / (1024 * 1024)
  return mib >= 1024
    ? `${(mib / 1024).toFixed(2)} GiB`
    : `${mib.toFixed(1)} MiB`
}

function getUtilizationColor(pct: number) {
  if (pct >= 90) return "bg-red-500"
  if (pct >= 70) return "bg-yellow-500"
  return "bg-green-500"
}

function MetricBar({ metric }: { metric: ResourceMetric }) {
  if (metric.utilization === null) {
    return <span className="text-xs text-zinc-500">No limit set</span>
  }
  const pct = Math.min(100, Math.max(0, metric.utilization))
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-zinc-800">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            getUtilizationColor(pct)
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-xs text-zinc-300">
        {metric.utilization.toFixed(1)}%
      </span>
    </div>
  )
}

type PodResourceMetricsPropsType = {
  metrics: DeploymentMetrics
  isLoading: boolean
}
export const PodResourceMetrics = ({
  metrics,
  isLoading,
}: PodResourceMetricsPropsType) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-base text-zinc-100">
            Resource Usage
          </CardTitle>
          <CardDescription className="text-xs text-zinc-500">
            CPU and memory usage per container (vs. configured limits)
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            CPU {(metrics?.totalCpuMillicores ?? 0).toFixed(1)}m
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            Mem {(metrics?.totalMemoryMiB ?? 0).toFixed(1)} MiB
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-zinc-800">
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">Pod</TableHead>
                <TableHead className="text-zinc-400">CPU</TableHead>
                <TableHead className="text-zinc-400">CPU Utilization</TableHead>
                <TableHead className="text-zinc-400">Memory</TableHead>
                <TableHead className="text-zinc-400">
                  Memory Utilization
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow className="border-zinc-800">
                  <TableCell colSpan={6}>
                    <Skeleton
                      height={20}
                      count={2}
                      baseColor="#27272a"
                      highlightColor="#3f3f46"
                    />
                  </TableCell>
                </TableRow>
              ) : !metrics?.pods?.length ? (
                <TableRow className="border-zinc-800">
                  <TableCell
                    colSpan={6}
                    className="py-6 text-center text-sm text-zinc-500"
                  >
                    No metrics available. Make sure metrics-server is running.
                  </TableCell>
                </TableRow>
              ) : (
                metrics.pods.flatMap((pod) =>
                  pod.containers.map((container) => (
                    <TableRow
                      key={`${pod.name}-${container.name}`}
                      className="border-zinc-800/60 hover:bg-zinc-800/30"
                    >
                      <TableCell className="font-mono text-xs text-zinc-200">
                        {pod.name}
                      </TableCell>

                      <TableCell className="font-mono text-xs text-zinc-300">
                        {formatCpu(container.cpu.usage)}
                        <span className="text-zinc-500">
                          {" "}
                          /{" "}
                          {container.cpu.limit
                            ? formatCpu(container.cpu.limit)
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <MetricBar metric={container.cpu} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-300">
                        {formatMemory(container.memory.usage)}
                        <span className="text-zinc-500">
                          {" "}
                          /{" "}
                          {container.memory.limit
                            ? formatMemory(container.memory.limit)
                            : "-"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <MetricBar metric={container.memory} />
                      </TableCell>
                    </TableRow>
                  ))
                )
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
