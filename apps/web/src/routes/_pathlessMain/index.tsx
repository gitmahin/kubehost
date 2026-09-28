import { createFileRoute } from "@tanstack/react-router"
import { observer } from "mobx-react"
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Clock,
  Server,
} from "lucide-react"
import Skeleton from "react-loading-skeleton"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components"
import { Badge } from "@workspace/ui/components/badge"
import { metricsStore } from "@/stores"
import { formatBytes } from "@/utils/formatBytes"
import { formatUptime } from "@/utils/formatUptime"
import { MetricsDashLoader } from "@/components/skeleton"

export const Route = createFileRoute("/_pathlessMain/")({
  component: observer(RouteComponent),
})

function RouteComponent() {
  const {
    metrics,
    heapUsedPercent,
    isLoading,
    isError,
    errorMessage,
    getProgressBarColor,
  } = metricsStore

  if (isLoading || (!metrics && !isError)) {
    return <MetricsDashLoader />
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">
              Failed to Load Metrics
            </CardTitle>
            <CardDescription>
              {errorMessage || "An error occurred"}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  const procMem = metrics?.memory?.process
  const sysMem = metrics?.memory?.system
  const cpu = metrics?.cpu
  const storage = metrics?.storage
  const processInfo = metrics?.process
  const eventLoop = metrics?.eventLoop
  const handles = metrics?.handles

  const cpuUsagePercent =
    cpu?.cores && cpu.totalConsumedCpu != null
      ? (cpu.totalConsumedCpu / cpu.cores) * 100
      : 0

  const cpuColor =
    cpuUsagePercent >= 85
      ? "text-red-500"
      : cpuUsagePercent >= 70
        ? "text-amber-500"
        : "text-emerald-500"

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Metrics</h1>
          <p className="text-sm text-muted-foreground">
            Updates every 4 seconds
          </p>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>

            <CardTitle className="text-sm font-medium">CPU Usage </CardTitle>
            <CardDescription>by kubehost</CardDescription>
            </div>
            <Cpu className={`h-4 w-4 ${cpuColor}`} />
          </CardHeader>

          <CardContent>
            <div className={`text-2xl font-bold ${cpuColor}`}>
              {cpu?.totalConsumedCpu?.toFixed(2) ?? "0.00"} Cores
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {cpu?.cores && (
                <Badge variant="outline">
                  {cpu.cores} Cores
                </Badge>
              )}

              <Badge variant="secondary">
                {cpuUsagePercent.toFixed(1)}%
              </Badge>

              <Badge variant="secondary">
                User: {cpu?.userSeconds?.toFixed(3) ?? "0"}s
              </Badge>

              <Badge variant="secondary">
                Sys: {cpu?.systemSeconds?.toFixed(3) ?? "0"}s
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Process Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Process Memory
            </CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {procMem?.residentMB ?? 0} MB
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Heap ({formatBytes(procMem?.heapUsedBytes)})</span>
                <span>{heapUsedPercent.toFixed(1)}%</span>
              </div>
              <Progress
                value={heapUsedPercent}
                className="h-1.5"
                indicatorClassName={getProgressBarColor(heapUsedPercent ?? 0)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Storage */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {storage?.usedGB?.toFixed(1) ?? 0} /{" "}
              {storage?.totalGB?.toFixed(1) ?? 0} GB
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used</span>
                <span>{storage?.usedPercent ?? 0}%</span>
              </div>
              <Progress
                value={storage?.usedPercent ?? 0}
                className="h-1.5"
                indicatorClassName={getProgressBarColor(
                  storage?.usedPercent ?? 0
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatUptime(processInfo?.uptimeSeconds)}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Started:{" "}
              {processInfo?.startTimeSeconds
                ? new Date(
                  processInfo.startTimeSeconds * 1000
                ).toLocaleTimeString()
                : "N/A"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Diagnostic Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Process Memory Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MemoryStick className="h-4 w-4 text-primary" /> Process Memory
            </CardTitle>
            <CardDescription>Node.js engine memory footprint</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Resident (RSS)</span>
              <span className="font-mono font-medium">
                {formatBytes(procMem?.residentBytes)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Virtual Memory</span>
              <span className="font-mono font-medium">
                {formatBytes(procMem?.virtualBytes)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Heap Used</span>
              <span className="font-mono font-medium">
                {formatBytes(procMem?.heapUsedBytes)}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Heap Total</span>
              <span className="font-mono font-medium">
                {formatBytes(procMem?.heapTotalBytes)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">External Memory</span>
              <span className="font-mono font-medium">
                {formatBytes(procMem?.externalBytes)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* System Memory Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Server className="h-4 w-4 text-primary" /> System Memory
            </CardTitle>
            <CardDescription>Host RAM statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total Memory</span>
              <span className="font-mono font-medium">
                {sysMem?.totalGB?.toFixed(2) ?? 0} GB
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Used Memory</span>
              <span className="font-mono font-medium">
                {sysMem?.usedGB?.toFixed(2) ?? 0} GB
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Free Memory</span>
              <span className="font-mono font-medium">
                {sysMem?.freeGB?.toFixed(2) ?? 0} GB
              </span>
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>System Usage</span>
                <span>{sysMem?.usedPercent ?? 0}%</span>
              </div>
              <Progress
                value={sysMem?.usedPercent ?? 0}
                className="h-1.5"
                indicatorClassName={getProgressBarColor(
                  sysMem?.usedPercent ?? 0
                )}
              />
            </div>
          </CardContent>
        </Card>

        {/* Disk usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4 text-primary" /> System Disk Volume
            </CardTitle>
            <CardDescription>Host Disk capacity statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total Capacity</span>
              <span className="font-mono font-medium">
                {storage?.totalGB?.toFixed(1) ?? 0} GB (
                {formatBytes(storage?.totalBytes)})
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Used Space</span>
              <span className="font-mono font-medium">
                {storage?.usedGB?.toFixed(1) ?? 0} GB (
                {formatBytes(storage?.usedBytes)})
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Free Space</span>
              <span className="font-mono font-medium">
                {storage?.freeGB?.toFixed(1) ?? 0} GB (
                {formatBytes(storage?.freeBytes)})
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Space</span>
              <span className="font-mono font-medium">
                {formatBytes(storage?.availableBytes)}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Event Loop & Handles */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4 text-primary" /> Event Loop & I/O
            </CardTitle>
            <CardDescription>File descriptors and loop lag</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Current Lag</span>
              <span className="font-mono font-medium">
                {((eventLoop?.lagSeconds ?? 0) * 1000).toFixed(2)} ms
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">p50 / p90 Latency</span>
              <span className="font-mono font-medium">
                {((eventLoop?.lagP50 ?? 0) * 1000).toFixed(1)} ms /{" "}
                {((eventLoop?.lagP90 ?? 0) * 1000).toFixed(1)} ms
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Active Handles</span>
              <span className="font-mono font-medium">
                {handles?.activeHandlesTotal ?? 0}
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">
                Open File Descriptors
              </span>
              <span className="font-mono font-medium">
                {handles?.openFds ?? 0} / {handles?.maxFds ?? 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Requests</span>
              <span className="font-mono font-medium">
                {handles?.activeRequestsTotal ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
