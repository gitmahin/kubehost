import { useMemo } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import Skeleton from "react-loading-skeleton"
import "react-loading-skeleton/dist/skeleton.css"
import {
  Pencil,
  Trash2,
  Server,
  Globe,
  Boxes,
  Cpu,
  Layers,
  ExternalLink,
  ShieldAlert,
} from "lucide-react"
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from "recharts"

import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@workspace/ui/components"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@workspace/ui/components/table"
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from "@workspace/ui/components"
import { cn } from "@workspace/ui/lib/utils"
import { projectService } from "@/lib/service"

export const Route = createFileRoute(
  "/_pathlessMain/projects/$project_id/depl/$depl_id/",
)({
  component: RouteComponent,
})

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

type DashboardData = {
  deployment?: {
    name?: string
    namespace?: string
    image?: string
    replicas?: {
      desired: number
      ready: number
      available: number
      updated: number
    }
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
    statusStyles[status ?? ""] ?? "border-zinc-600/40 text-zinc-400 bg-zinc-500/10"
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

function RouteComponent() {
  const { project_id, depl_id } = Route.useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Fetch dashboard data
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", project_id, depl_id],
    queryFn: async () => {
      const res: any = await projectService.getDashboard({
        project_name: project_id,
        deployment_name: depl_id,
      })
      return (res?.data?.data ?? res?.data) as DashboardData
    },
    enabled: !!project_id && !!depl_id,
  })

  // Delete Deployment Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await projectService.deleteDeployment({
        project_name: project_id,
        deployment_name: depl_id,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      navigate({ to: "/deployments" })
    },
  })

  const handleDelete = () => {
    if (
      confirm(
        `Are you sure you want to delete "${depl_id}" in project "${project_id}"?`
      )
    ) {
      deleteMutation.mutate()
    }
  }

  // Chart Data Calculations
  const replicaData = useMemo(() => {
    if (!data?.deployment?.replicas) return []
    const { desired = 0, ready = 0 } = data.deployment.replicas
    const unready = Math.max(0, desired - ready)
    return [
      { name: "Ready", value: ready, fill: "#22c55e" },
      { name: "Unready", value: unready, fill: "#eab308" },
    ]
  }, [data?.deployment?.replicas])

  const podRestartData = useMemo(() => {
    if (!data?.pods) return []
    return data.pods.map((pod) => ({
      name: pod.name?.replace(`${depl_id}-`, "") || pod.name || "pod",
      restarts: pod.restarts ?? 0,
    }))
  }, [data?.pods, depl_id])

  if (isLoading) {
    return (
      <div className="w-full p-6 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton width={180} height={28} baseColor="#27272a" highlightColor="#3f3f46" />
            <Skeleton width={120} height={16} baseColor="#27272a" highlightColor="#3f3f46" />
          </div>
          <div className="flex gap-2">
            <Skeleton width={80} height={36} borderRadius={6} baseColor="#27272a" highlightColor="#3f3f46" />
            <Skeleton width={80} height={36} borderRadius={6} baseColor="#27272a" highlightColor="#3f3f46" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-zinc-800 bg-zinc-900/40">
              <CardHeader className="p-4">
                <Skeleton width={120} height={16} baseColor="#27272a" highlightColor="#3f3f46" />
              </CardHeader>
              <CardContent className="p-4 pt-0 flex flex-col gap-2">
                <Skeleton width={160} height={24} baseColor="#27272a" highlightColor="#3f3f46" />
                <Skeleton width={200} height={14} baseColor="#27272a" highlightColor="#3f3f46" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const deployment = data?.deployment
  const service = data?.service
  const ingressList = data?.ingress ?? []
  const pods = data?.pods ?? []

  return (
    <div className="w-full p-6 flex flex-col gap-6 text-zinc-100">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-50">{deployment?.name || depl_id}</h1>
            <Badge variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-800/50">
              {deployment?.namespace || project_id}
            </Badge>
          </div>
          <p className="text-xs font-mono text-zinc-500">{deployment?.image ?? "-"}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => {
              navigate({
                to: "/projects/$project_id/depl/$depl_id",
                params: { project_id, depl_id },
              })
            }}
          >
            <Pencil className="w-4 h-4 mr-1.5" />
            Edit
          </Button>

          <Button
            variant="destructive"
            size="sm"
            disabled={deleteMutation.isPending}
            onClick={handleDelete}
            className="bg-red-900/40 border border-red-800/60 text-red-300 hover:bg-red-800/60"
          >
            <Trash2 className="w-4 h-4 mr-1.5" />
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Replicas Overview */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Replicas</CardTitle>
            <Boxes className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">
              {deployment?.replicas?.ready ?? 0} / {deployment?.replicas?.desired ?? 0}
            </div>
            <p className="text-xs text-zinc-500 mt-1">
              {deployment?.replicas?.available ?? 0} available, {deployment?.replicas?.updated ?? 0} updated
            </p>
          </CardContent>
        </Card>

        {/* Networking Service */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Service IP</CardTitle>
            <Server className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-mono font-semibold text-zinc-50">
              {service?.clusterIP ?? "No Service"}
            </div>
            <div className="flex gap-2 mt-1">
              {service?.ports?.map((p, idx) => (
                <Badge key={idx} variant="secondary" className="text-[10px] bg-zinc-800 text-zinc-300">
                  {p.port}:{p.targetPort}/{p.protocol}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* External Ingress */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">Ingress Host</CardTitle>
            <Globe className="w-4 h-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            {ingressList.length > 0 ? (
              ingressList.map((ing, i) => (
                <div key={i} className="flex items-center gap-1.5 text-sm font-mono text-blue-400">
                  <a
                    href={`http://${ing.host}`}
                    target="_blank"
                    rel="noreferrer"
                    className="hover:underline flex items-center gap-1"
                  >
                    {ing.host}
                    <ExternalLink className="w-3 h-3 text-zinc-500" />
                  </a>
                </div>
              ))
            ) : (
              <span className="text-sm text-zinc-500">No Ingress routing set</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Replica Distribution Pie Chart */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Replica Health Distribution</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Ratio of ready vs unready pod instances
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ChartContainer config={replicaChartConfig} className="w-full h-full">
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
                  >
                    {replicaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <RechartsTooltip content={<ChartTooltipContent />} />
                </PieChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Pod Restarts Bar Chart */}
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader>
            <CardTitle className="text-base text-zinc-100">Pod Restarts</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Total restart counts across active pods
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ChartContainer config={restartChartConfig} className="w-full h-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={podRestartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={11} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={11} tickLine={false} allowDecimals={false} />
                  <RechartsTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="restarts" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Pod Instances Table */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-zinc-100">Pod Instances</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Real-time telemetry and metrics for active runtime containers
            </CardDescription>
          </div>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400">
            {pods.length} Total Pods
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-zinc-800">
            <Table>
              <TableHeader>
                <TableRow className="border-zinc-800 hover:bg-transparent">
                  <TableHead className="text-zinc-400">Pod Name</TableHead>
                  <TableHead className="text-zinc-400">Status</TableHead>
                  <TableHead className="text-zinc-400">Pod IP</TableHead>
                  <TableHead className="text-zinc-400">Node</TableHead>
                  <TableHead className="text-zinc-400">Restarts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pods.length === 0 ? (
                  <TableRow className="border-zinc-800">
                    <TableCell colSpan={5} className="text-center text-zinc-500 py-6 text-sm">
                      No active pods found
                    </TableCell>
                  </TableRow>
                ) : (
                  pods.map((pod) => (
                    <TableRow key={pod.name} className="border-zinc-800/60 hover:bg-zinc-800/30">
                      <TableCell className="font-mono text-xs text-zinc-200">
                        {pod.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cn(getStatusStyle(pod.status))}>
                          {pod.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-zinc-400">
                        {pod.podIP ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {pod.nodeName ?? "-"}
                      </TableCell>
                      <TableCell className="text-xs text-zinc-400">
                        {pod.restarts}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}