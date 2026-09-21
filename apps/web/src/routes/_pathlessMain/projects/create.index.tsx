import { useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  Input,
  FieldLegend,
  FieldSet,
  Button,
} from "@workspace/ui/components"
import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"

export const Route = createFileRoute("/_pathlessMain/projects/create/")({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [projectName, setProjectName] = useState("")
  const projectService = new ProjectService(
    getClientEnv("VITE_API_SERVER_URL") + "/v1/projects"
  )
  const createProjectMutation = useMutation({
    mutationFn: async (name: string) => {
      const toastId = toast.loading("Creating project...")

      try {
        const res: any = await projectService.createProject(name)

        const responseData = res?.data?.data ?? res?.data ?? res

        const createdProjectName =
          responseData?.project_name ??
          responseData?.name ??
          responseData?.id ??
          name

        toast.success(res?.message ?? "Project created successfully!", {
          id: toastId,
        })

        queryClient.invalidateQueries({ queryKey: ["projects"] })
        navigate({
          to: "/projects/create/application",
          search: { project_name: createdProjectName },
        })

        return responseData
      } catch (error: any) {
        toast.error(error.message, {
          id: toastId,
          description: error.errors?.length
            ? String(error.errors[0])
            : undefined,
        })
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedName = projectName.trim()
    if (!trimmedName) {
      toast.error("Project name is required")
      return
    }

    createProjectMutation.mutate(trimmedName)
  }

  return (
    <div className="mt-16 flex w-full items-center justify-center">
      <form onSubmit={handleSubmit} className="w-full max-w-[500px]">
        <FieldGroup className="w-full">
          <FieldSet>
            <FieldLegend>Create New Project</FieldLegend>
            <FieldDescription>
              All transactions are secure and encrypted
            </FieldDescription>
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="project-name-input">
                  Project Name
                </FieldLabel>
                <Input
                  id="project-name-input"
                  placeholder="Evil Rabbit"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  disabled={createProjectMutation.isPending}
                  required
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal" className="flex gap-2">
            <Button type="submit" disabled={createProjectMutation.isPending}>
              {createProjectMutation.isPending ? "Creating..." : "Create"}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={createProjectMutation.isPending}
              onClick={() => navigate({ to: "/deployments" })}
            >
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}
