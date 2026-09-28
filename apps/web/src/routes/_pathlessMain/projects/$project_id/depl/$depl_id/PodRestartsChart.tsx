import { useMemo, useState, useEffect, type ReactNode } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import { toast } from "sonner"
import {
  Pencil,
  Trash2,
  Server,
  Globe,
  Boxes,
  ExternalLink,
} from "lucide-react"
import {
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Sector,
} from "recharts"

import { Button } from "@workspace/ui/components/button"
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components/chart"
import { cn } from "@workspace/ui/lib/utils"
import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"
import type { DeploymentMetrics, ResourceMetric } from "@repo/types"
import { PodResourceMetrics } from "./PodResourceMetrics"
import { PodInstances } from "./PodInstances"
import { ReplicaHealthChart } from "./ReplicaHealthChart"

type Pod = {
  name?: string
  status?: string
  podIP?: string
  nodeName?: string
  restarts?: number
}

type ServicePort = {
  port: number
  targetPort: number
  protocol: string
}

type Service = {
  name?: string
  type?: string
  clusterIP?: string
  ports?: ServicePort[]
}

type IngressRule = {
  name?: string
  host?: string
  path?: string
  pathType?: string
}

type ReplicasType = {

  desired: number
  ready: number
  available: number
  updated: number

}


export type DashboardData = {
  deployment?: {
    name?: string
    namespace?: string
    image?: string
    replicas?: ReplicasType
  }
  service?: Service
  ingress?: IngressRule[]
  pods?: Pod[]
}

const statusStyles: Record<string, string> = {
  Running: "border-green-600/40 text-green-500 bg-green-500/10",
  Pending: "border-yellow-600/40 text-yellow-500 bg-yellow-500/10",
  Failed: "border-red-600/40 text-red-500 bg-red-500/10",
  Succeeded: "border-blue-600/40 text-blue-500 bg-blue-500/10",
}

function getStatusStyle(status?: string) {
  return (
    statusStyles[status ?? ""] ??
    "border-zinc-600/40 text-zinc-400 bg-zinc-500/10"
  )
}

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
  return mib >= 1024 ? `${(mib / 1024).toFixed(2)} GiB` : `${mib.toFixed(1)} MiB`
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
          className={cn("h-full rounded-full transition-all", getUtilizationColor(pct))}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-12 text-right font-mono text-xs text-zinc-300">
        {metric.utilization.toFixed(1)}%
      </span>
    </div>
  )
}

const replicaChartConfig = {
  ready: {
    label: "Ready",
    color: "#22c55e",
  },
  unready: {
    label: "Unready",
    color: "#eab308",
  },
} satisfies ChartConfig

const restartChartConfig = {
  restarts: {
    label: "Restarts",
    color: "#3b82f6",
  },
} satisfies ChartConfig

type PodRestartsChartPropsType = {
  podRestartData: any
}

export const PodRestartsChart = ({ podRestartData }: PodRestartsChartPropsType) => {
  return <Card className="border-zinc-800 bg-zinc-900/40">
    <CardHeader>
      <CardTitle className="text-base text-zinc-100">
        Pod Restarts
      </CardTitle>
      <CardDescription className="text-xs text-zinc-500">
        Total restart counts across active pods
      </CardDescription>
    </CardHeader>
    <CardContent className="h-[220px]">
      <ChartContainer
        config={restartChartConfig}
        className="h-full w-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={podRestartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
            />
            <YAxis
              stroke="#71717a"
              fontSize={11}
              tickLine={false}
              allowDecimals={false}
            />
            <RechartsTooltip content={<ChartTooltipContent />} />
            <Bar
              dataKey="restarts"
              fill="#3b82f6"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </ChartContainer>
    </CardContent>
  </Card>
}
