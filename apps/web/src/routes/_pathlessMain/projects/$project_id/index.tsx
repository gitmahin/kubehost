import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import {
  Rocket,
  Plus,
  HelpCircle,
  Trash2,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  Badge,
} from "@workspace/ui/components"
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
} from "@workspace/ui/components/alert-dialog"

import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"
import { useQueryClient } from "@tanstack/react-query"

export const Route = createFileRoute("/_pathlessMain/projects/$project_id/")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const { project_id } = Route.useParams()
  const queryClient = useQueryClient()

  const [isDeleting, setIsDeleting] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)

  const projectService = new ProjectService(
    getClientEnv("VITE_API_SERVER_URL") + "/v1/projects"
  )
  const handleDeleteProject = async () => {
    // 1. Trigger Sonner loading toast
    const toastId = toast.loading(`Deleting project "${project_id}"...`)
    setIsDeleting(true)

    try {
      // 2. Call the service method
      await projectService.deleteProject(project_id)

      // 3. Update toast to success
      toast.success(`Project "${project_id}" deleted successfully!`, {
        id: toastId,
      })

      setDialogOpen(false)
      await queryClient.invalidateQueries({ queryKey: ["projects"] })
      await queryClient.invalidateQueries({ queryKey: ["deployments"] })

      // Option 1A: Navigate to deployments then reload
      await navigate({ to: "/" })
     
    } catch (error: any) {
      // 5. Update toast to error
      toast.error(
        error?.response?.data?.message ||
        error?.message ||
        `Failed to delete project "${project_id}".`,
        { id: toastId }
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl flex-1 space-y-6 p-6 md:p-8">
      {/* Header Section */}
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">
              Deployment Dashboard
            </h1>
            <Badge variant="outline" className="font-mono text-xs">
              {project_id}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Rapidly deploy and run your containers without infrastructure
            overhead.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a href="https://github.com/gitmahin/kubehost/blob/main/README.md">

            <Button variant="outline" size="sm" >
              <HelpCircle className="mr-2 h-4 w-4" />
              Documentation
            </Button>
          </a>

          {/* Delete Project Alert Dialog */}
          <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <AlertDialogTrigger>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Project
              </Button>
            </AlertDialogTrigger>

            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  project <strong className="text-foreground">{project_id}</strong>{" "}
                  and remove all associated deployments and resources.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={(e) => {
                    e.preventDefault()
                    handleDeleteProject()
                  }}
                  disabled={isDeleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    "Delete Project"
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Main Hero Empty State */}
      <Card className="border-dashed bg-gradient-to-b from-card to-muted/20">
        <CardContent className="flex flex-col items-center justify-center px-4 py-16 text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-inner">
            <Rocket className="h-8 w-8" />
          </div>

          <CardTitle className="max-w-lg text-2xl font-bold tracking-tight sm:text-3xl">
            Rapidly deploy your application in seconds
          </CardTitle>
          <CardDescription className="mt-3 max-w-xl text-base leading-relaxed text-muted-foreground">
            Just provide your Docker image - our platform handles networking,
            ingress rules, and scaling complexities behind the scenes.
          </CardDescription>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="px-6"
              onClick={() => {
                navigate({
                  to: "/projects/create/application",
                  search: {
                    project_name: project_id,
                  },
                })
              }}
            >
              <Plus className="mr-2 h-5 w-5" />
              Create Deployment
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="px-6"
              onClick={() => {
                navigate({
                  to: "/projects/create",
                })
              }}
            >
              Create New Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}