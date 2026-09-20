import { ProjectSidebar } from "@/components/project-sidebar"
import { createFileRoute, Outlet, useParams } from "@tanstack/react-router"

export const Route = createFileRoute("/_pathlessMain/projects/$project_id")({
  component: RouteComponent,
})

function RouteComponent() {
  const { project_id, depl_id } = useParams({
    strict: false,
  })
  return (
    <div className="flex h-full w-full items-start justify-start">
      <ProjectSidebar
        project_id={project_id as string}
        depl_id={depl_id as string}
      />
      <Outlet />
    </div>
  )
}
