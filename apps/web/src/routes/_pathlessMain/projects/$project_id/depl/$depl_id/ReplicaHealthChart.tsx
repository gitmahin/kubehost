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
import type { DashboardData } from "."

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

type ReplicaHealthChartPropsType = {
  replicaData: any
}
export const ReplicaHealthChart = ({
  replicaData,
}: ReplicaHealthChartPropsType) => {
  return (
    <Card className="border-zinc-800 bg-zinc-900/40">
      <CardHeader>
        <CardTitle className="text-base text-zinc-100">
          Replica Health Distribution
        </CardTitle>
        <CardDescription className="text-xs text-zinc-500">
          Ratio of ready vs unready pod instances
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ChartContainer config={replicaChartConfig} className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={replicaData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                shape={(props: any) => {
                  const { fill, payload, ...sectorProps } = props
                  return (
                    <Sector {...sectorProps} fill={payload?.fill || fill} />
                  )
                }}
              />
              <RechartsTooltip content={<ChartTooltipContent />} />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
