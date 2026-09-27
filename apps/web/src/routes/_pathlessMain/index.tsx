import { useQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"
import {
  Cpu,
  HardDrive,
  MemoryStick,
  Activity,
  Server,
  Clock,
  Gauge,
  CheckCircle2,
} from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Progress } from "@workspace/ui/components"
import { Badge } from "@workspace/ui/components/badge"

import Skeleton from "react-loading-skeleton"

import { metricsStore } from "@/stores"
import {observer} from "mobx-react"

export const Route = createFileRoute("/_pathlessMain/")({
  component: observer(RouteComponent),
})

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB", "TB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

function formatUptime(seconds: number): string {
  const hrs = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  if (hrs > 0) return `${hrs}h ${mins}m ${secs}s`
  if (mins > 0) return `${mins}m ${secs}s`
  return `${secs}s`
}

function RouteComponent() {
 

 // 3. Read value directly from MobX store
  const { metrics, heapUsedPercent, isLoading, isError, errorMessage } = metricsStore

  if (isLoading || !metrics) {
    return (
      <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6 md:p-8">
        <div className="flex items-center justify-between border-b pb-6">
          <Skeleton className="h-8 w-[200px]" />
          <Skeleton className="h-6 w-[100px]" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[120px] rounded-xl" />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-destructive">Failed to Load Metrics</CardTitle>
            <CardDescription>{errorMessage || "An error occurred"}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Metrics</h1>
          <p className="text-sm text-muted-foreground">
            Fetched via TanStack Query every 4s and stored in MobX state.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1.5 border-green-500/40 bg-green-500/10 text-green-500">
            <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
            Live Query + MobX
          </Badge>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* CPU */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.cpu.totalSeconds.toFixed(3)}s
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              User: {metrics.cpu.userSeconds.toFixed(3)}s | Sys: {metrics.cpu.systemSeconds.toFixed(3)}s
            </p>
          </CardContent>
        </Card>

        {/* Memory */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Memory (RSS)</CardTitle>
            <MemoryStick className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics.memory.residentMB.toFixed(1)} MB
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Heap ({formatBytes(metrics.memory.heapUsedBytes)})</span>
                <span>{heapUsedPercent.toFixed(1)}%</span>
              </div>
              <Progress value={heapUsedPercent} className="h-1.5" />
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
              {metrics.storage.usedGB.toFixed(1)} / {metrics.storage.totalGB.toFixed(1)} GB
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Used</span>
                <span>{metrics.storage.usedPercent}%</span>
              </div>
              <Progress value={metrics.storage.usedPercent} className="h-1.5" />
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
              {formatUptime(metrics.process.uptimeSeconds)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Started: {new Date(metrics.process.startTimeSeconds * 1000).toLocaleTimeString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Diagnostic Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Memory Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MemoryStick className="h-4 w-4 text-primary" /> Memory Breakdown
            </CardTitle>
            <CardDescription>Process memory allocations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Resident (RSS)</span>
              <span className="font-mono font-medium">{formatBytes(metrics.memory.residentBytes)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Virtual Memory</span>
              <span className="font-mono font-medium">{formatBytes(metrics.memory.virtualBytes)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Heap Used</span>
              <span className="font-mono font-medium">{formatBytes(metrics.memory.heapUsedBytes)}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Heap Total</span>
              <span className="font-mono font-medium">{formatBytes(metrics.memory.heapTotalBytes)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">External Memory</span>
              <span className="font-mono font-medium">{formatBytes(metrics.memory.externalBytes)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Event Loop */}
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
              <span className="font-mono font-medium">{(metrics.eventLoop.lagSeconds * 1000).toFixed(2)} ms</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">p50 / p90 Latency</span>
              <span className="font-mono font-medium">
                {(metrics.eventLoop.lagP50 * 1000).toFixed(1)} ms / {(metrics.eventLoop.lagP90 * 1000).toFixed(1)} ms
              </span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Active Handles</span>
              <span className="font-mono font-medium">{metrics.handles.activeHandlesTotal}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Open File Descriptors</span>
              <span className="font-mono font-medium">
                {metrics.handles.openFds} / {metrics.handles.maxFds}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Active Requests</span>
              <span className="font-mono font-medium">{metrics.handles.activeRequestsTotal}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <HardDrive className="h-4 w-4 text-primary" /> Disk Volume
            </CardTitle>
            <CardDescription>Disk capacity statistics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Total Capacity</span>
              <span className="font-mono font-medium">{metrics.storage.totalGB.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Used Space</span>
              <span className="font-mono font-medium">{metrics.storage.usedGB.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Free Space</span>
              <span className="font-mono font-medium">{metrics.storage.freeGB.toFixed(1)} GB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Available Space</span>
              <span className="font-mono font-medium">{formatBytes(metrics.storage.availableBytes)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}