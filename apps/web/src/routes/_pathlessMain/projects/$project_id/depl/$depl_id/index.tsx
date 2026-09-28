import { useMemo, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Pencil,
  Trash2,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Badge } from "@workspace/ui/components/badge"
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
import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"
import type { DeploymentMetrics } from "@repo/types"
import { PodResourceMetrics } from "./PodResourceMetrics"
import { PodInstances } from "./PodInstances"
import { ReplicaHealthChart } from "./ReplicaHealthChart"
import { PodRestartsChart } from "./PodRestartsChart"
import type { IngressRule } from "./OverviewCard"
import OverviewCard from "./OverviewCard"
import { LoadingSkeleton } from "./LoadingSkeleton"

export const Route = createFileRoute(
  "/_pathlessMain/projects/$project_id/depl/$depl_id/"
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

function RouteComponent() {
  const projectService = new ProjectService(
    getClientEnv("VITE_API_SERVER_URL") + "/v1/projects"
  )
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
      return (res?.data?.data ?? res?.data) as DashboardData & { metrics: DeploymentMetrics }
    },
    enabled: !!project_id && !!depl_id,
    refetchInterval: 4000,
    refetchIntervalInBackground: false,
  })

  const metrics = data?.metrics

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
    return <LoadingSkeleton />
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
      <OverviewCard deployment={deployment} service={service} uniqueIngress={uniqueIngress} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ReplicaHealthChart replicaData={replicaData} />
        <PodRestartsChart podRestartData={podRestartData} />
      </div>

      {/* Pod Resource Metrics */}
      <PodResourceMetrics isLoading={isLoading} metrics={metrics!} />
      {/* Pod Instances Table */}
      <PodInstances pods={pods} />
    </div>
  )
}
