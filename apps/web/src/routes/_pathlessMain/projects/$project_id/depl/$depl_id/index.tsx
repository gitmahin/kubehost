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
import { projectService } from "@/lib/service"

export const Route = createFileRoute(
  "/_pathlessMain/projects/$project_id/depl/$depl_id/"
)({
  component: RouteComponent,
})

/**
 * ClientOnly wrapper prevents SSR hydration mismatches (Error #419)
 * for DOM/Window-dependent libraries like Recharts.
 */
function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode
  fallback?: ReactNode
}) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return (
      fallback ?? (
        <div className="flex h-full w-full items-center justify-center rounded bg-zinc-900/20">
          <Skeleton
            width="100%"
            height={180}
            baseColor="#27272a"
            highlightColor="#3f3f46"
          />
        </div>
      )
    )
  }

  return <>{children}</>
}

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
    statusStyles[status ?? ""] ??
    "border-zinc-600/40 text-zinc-400 bg-zinc-500/10"
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)

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
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  })

  // Delete Deployment Mutation using Sonner toasts
  const deleteMutation = useMutation({
    mutationFn: async () => {
      return await projectService.deleteDeployment({
        project_name: project_id,
        deployment_name: depl_id,
      })
    },
    onSuccess: (res: any) => {
      toast.success(
        res?.message ?? `Deployment "${depl_id}" deleted successfully.`
      )
      queryClient.invalidateQueries({ queryKey: ["deployments"] })
      setIsDeleteDialogOpen(false)
      navigate({ to: "/deployments" })
    },
    onError: (error: any) => {
      toast.error(error.message, {
        description: error.errors?.length ? String(error.errors[0]) : undefined,
      })
    },
  })

  const uniqueIngress = useMemo(() => {
    if (!data?.ingress) return []
    const seen = new Set<string>()
    return data.ingress.filter((ing) => {
      if (!ing.host || seen.has(ing.host)) return false
      seen.add(ing.host)
      return true
    })
  }, [data?.ingress])

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
      <div className="flex w-full flex-col gap-6 p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-2">
            <Skeleton
              width={180}
              height={28}
              baseColor="#27272a"
              highlightColor="#3f3f46"
            />
            <Skeleton
              width={120}
              height={16}
              baseColor="#27272a"
              highlightColor="#3f3f46"
            />
          </div>
          <div className="flex gap-2">
            <Skeleton
              width={80}
              height={36}
              borderRadius={6}
              baseColor="#27272a"
              highlightColor="#3f3f46"
            />
            <Skeleton
              width={80}
              height={36}
              borderRadius={6}
              baseColor="#27272a"
              highlightColor="#3f3f46"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border-zinc-800 bg-zinc-900/40">
              <CardHeader className="p-4">
                <Skeleton
                  width={120}
                  height={16}
                  baseColor="#27272a"
                  highlightColor="#3f3f46"
                />
              </CardHeader>
              <CardContent className="flex flex-col gap-2 p-4 pt-0">
                <Skeleton
                  width={160}
                  height={24}
                  baseColor="#27272a"
                  highlightColor="#3f3f46"
                />
                <Skeleton
                  width={200}
                  height={14}
                  baseColor="#27272a"
                  highlightColor="#3f3f46"
                />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const deployment = data?.deployment
  const service = data?.service
  const pods = data?.pods ?? []

  return (
    <div className="flex w-full flex-col gap-6 p-6 text-zinc-100">
      {/* Header & Quick Actions */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-zinc-50">
              {deployment?.name || depl_id}
            </h1>
            <Badge
              variant="outline"
              className="border-zinc-700 bg-zinc-800/50 text-zinc-400"
            >
              {deployment?.namespace || project_id}
            </Badge>
          </div>
          <p className="font-mono text-xs text-zinc-500">
            {deployment?.image ?? "-"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800"
            onClick={() => {
              navigate({
                to: "/projects/$project_id/depl/$depl_id/edit",
                params: { project_id, depl_id },
              })
            }}
          >
            <Pencil className="mr-1.5 h-4 w-4" />
            Edit
          </Button>

          <AlertDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
          >
            <AlertDialogTrigger>
              <Button
                variant="destructive"
                size="sm"
                className="border border-red-800/60 bg-red-900/40 text-red-300 hover:bg-red-800/60"
              >
                <Trash2 className="mr-1.5 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="border-zinc-800 bg-zinc-900 text-zinc-100">
              <AlertDialogHeader>
                <AlertDialogTitle className="text-zinc-50">
                  Delete Deployment
                </AlertDialogTitle>
                <AlertDialogDescription className="text-zinc-400">
                  Are you sure you want to delete deployment{" "}
                  <span className="font-semibold text-zinc-200">{depl_id}</span>{" "}
                  in project{" "}
                  <span className="font-semibold text-zinc-200">
                    {project_id}
                  </span>
                  ? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="border-zinc-700 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100">
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleteMutation.isPending}
                  onClick={(e: any) => {
                    e.preventDefault()
                    deleteMutation.mutate()
                  }}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  {deleteMutation.isPending
                    ? "Deleting..."
                    : "Delete Deployment"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Top Overview Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Replicas
            </CardTitle>
            <Boxes className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-zinc-50">
              {deployment?.replicas?.ready ?? 0} /{" "}
              {deployment?.replicas?.desired ?? 0}
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {deployment?.replicas?.available ?? 0} available,{" "}
              {deployment?.replicas?.updated ?? 0} updated
            </p>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Service IP
            </CardTitle>
            <Server className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="font-mono text-lg font-semibold text-zinc-50">
              {service?.clusterIP ?? "No Service"}
            </div>
            <div className="mt-1 flex gap-2">
              {service?.ports?.map((p, idx) => (
                <Badge
                  key={idx}
                  variant="secondary"
                  className="bg-zinc-800 text-[10px] text-zinc-300"
                >
                  {p.port}:{p.targetPort}/{p.protocol}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800 bg-zinc-900/40">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-zinc-400">
              Ingress Host
            </CardTitle>
            <Globe className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            {uniqueIngress.length > 0 ? (
              <div className="flex flex-col gap-1">
                {uniqueIngress.map((ing, i) => (
                  <div
                    key={`${ing.name ?? i}-${ing.host}`}
                    className="flex items-center gap-1.5 font-mono text-sm text-blue-400"
                  >
                    <a
                      href={`http://${ing.host}${ing.path ?? ""}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:underline"
                    >
                      {ing.host}
                      <ExternalLink className="h-3 w-3 text-zinc-500" />
                    </a>
                  </div>
                ))}
              </div>
            ) : (
              <span className="text-sm text-zinc-500">
                No Ingress routing set
              </span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analytics & Charts Section (Wrapped in ClientOnly to fix Hydration Error #419) */}
      <ClientOnly>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
              <ChartContainer
                config={replicaChartConfig}
                className="h-full w-full"
              >
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
      return <Sector {...sectorProps} fill={payload?.fill || fill} />
    }}
  />
                    <RechartsTooltip content={<ChartTooltipContent />} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/40">
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
        </div>
      </ClientOnly>

      {/* Pod Instances Table */}
      <Card className="border-zinc-800 bg-zinc-900/40">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base text-zinc-100">Instances</CardTitle>
            <CardDescription className="text-xs text-zinc-500">
              Metrics for active runtime containers
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
                    <TableCell
                      colSpan={5}
                      className="py-6 text-center text-sm text-zinc-500"
                    >
                      No active pods found
                    </TableCell>
                  </TableRow>
                ) : (
                  pods.map((pod) => (
                    <TableRow
                      key={pod.name}
                      className="border-zinc-800/60 hover:bg-zinc-800/30"
                    >
                      <TableCell className="font-mono text-xs text-zinc-200">
                        {pod.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={cn(getStatusStyle(pod.status))}
                        >
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