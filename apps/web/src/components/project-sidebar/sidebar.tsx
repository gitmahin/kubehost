import { useQuery } from "@tanstack/react-query"
import { Badge, Button } from "@workspace/ui/components"
import { projectService } from "@/lib/service"
import { useNavigate } from "@tanstack/react-router"

import { cn } from "@workspace/ui/lib/utils"
import { getStatusStyle } from "@/utils/statusStyle"

type Deployment = {
    name?: string
    namespace?: string
    status?: string
}

export const ProjectSidebar = ({ project_id, depl_id }: { project_id: string, depl_id: string }) => {
    const navigate = useNavigate()


    const { data: deployments = [], isLoading } = useQuery({
        queryKey: ["deployments", project_id],
        queryFn: async () => {
            const res: any = await projectService.getAllDeployments(project_id!)
            return (res?.data.data ?? []) as Deployment[]
        },
        enabled: !!project_id,
    })

    console.log(deployments)

    return (
        <aside className="w-[250px] h-[calc(100vh-55px)] sticky top-0 bg-zinc-900/30 border-r px-3 py-6">
            <p className="text-sm font-medium text-zinc-400 mb-3 px-2">Services</p>

            <nav className="flex flex-col gap-1">
                {isLoading && (
                    <p className="text-xs text-zinc-500 px-2">Loading...</p>
                )}

                {!isLoading && deployments.length === 0 && (
                    <p className="text-xs text-zinc-500 px-2">No deployments yet</p>
                )}

                {deployments.length > 0 &&
                    deployments.map((deployment) => {
                        const isActive = deployment.name === depl_id

                        return (
                            <Button
                                key={deployment.name}
                                variant={isActive ? "outline" : "ghost"}
                                size="lg"
                                className="justify-between w-full"
                                onClick={() => {
                                    navigate({
                                        to: "/projects/$project_id/depl/$depl_id",
                                        params: {
                                            project_id: project_id,
                                            depl_id: deployment.name as string,
                                        }
                                    })
                                }}
                            >

                                {deployment.name}

                                <Badge variant="outline" className={cn(getStatusStyle(deployment.status))}>
                                    {deployment.status}
                                </Badge>

                            </Button>
                        )
                    })}
            </nav>
        </aside>
    )
}