import { useQuery } from "@tanstack/react-query"
import { Badge, Button } from "@workspace/ui/components"
import { useNavigate } from "@tanstack/react-router"

import { cn } from "@workspace/ui/lib/utils"
import { getStatusStyle } from "@/utils/statusStyle"
import Skeleton from "react-loading-skeleton"
import { CirclePlus } from "lucide-react"
import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"

type Deployment = {
  name?: string
  namespace?: string
  status?: string
}

export const ProjectSidebar = ({
  project_id,
  depl_id,
}: {
  project_id: string
  depl_id: string
}) => {
  const navigate = useNavigate()

  const projectService = new ProjectService(
  getClientEnv("VITE_API_SERVER_URL") + "/v1/projects"
)

  const { data: deployments = [], isLoading } = useQuery({
    queryKey: ["deployments", project_id],
    queryFn: async () => {
      const res: any = await projectService.getAllDeployments(project_id!)
      return (res?.data.data ?? []) as Deployment[]
    },
    enabled: !!project_id,
    refetchInterval: 4000,
    refetchIntervalInBackground: true,
  })

  // console.log(deployments)

  return (
    <aside className="sticky top-[55px] h-[calc(100vh-55px)] w-[250px] border-r bg-zinc-900/30 px-3 py-6">
      <Button
        className={"w-full justify-start"}
        onClick={() => {
          navigate({
            to: "/projects/create/application",
            search: {
              project_name: project_id,
            },
          })
        }}
      >
        <CirclePlus /> New Deployment
      </Button>
      <p className="mt-5 mb-3 px-2 text-sm font-medium text-zinc-400">
        Services
      </p>

      <nav className="flex flex-col gap-1">
        {isLoading && (
          <div className="flex flex-col gap-2 px-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div
                key={index}
                className="flex h-7 w-full items-center justify-between"
              >
                <Skeleton width={100} height={14} />
                <Skeleton width={45} height={14} borderRadius={6} />
              </div>
            ))}
          </div>
        )}
        {!isLoading && deployments.length === 0 && (
          <p className="px-2 text-xs text-zinc-500">No deployments yet</p>
        )}

        {deployments.length > 0 &&
          deployments.map((deployment) => {
            const isActive = deployment.name === depl_id

            return (
              <Button
                key={deployment.name}
                variant={isActive ? "outline" : "ghost"}
                size="lg"
                className="w-full justify-between"
                onClick={() => {
                  navigate({
                    to: "/projects/$project_id/depl/$depl_id",
                    params: {
                      project_id: project_id,
                      depl_id: deployment.name as string,
                    },
                  })
                }}
              >
                {deployment.name}

                <Badge
                  variant="outline"
                  className={cn(getStatusStyle(deployment.status))}
                >
                  {deployment.status}
                </Badge>
              </Button>
            )
          })}
      </nav>
    </aside>
  )
}
