import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router"
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus } from "lucide-react"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Input,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  Button,
} from "@workspace/ui/components"
import { ProjectZSchema } from "@repo/zod"
import type {
  ApplicationCreateInputType,
  ApplicationCreateServerInputType,
} from "@repo/zod"
import { EnvVarRow } from "@/components/deployments"
import { ProjectService } from "@repo/services"
import { getClientEnv } from "@/utils/env"

type SearchParams = {
  project_name?: string
}

export const Route = createFileRoute(
  "/_pathlessMain/projects/create/application/"
)({
  validateSearch: (search: Record<string, unknown>): SearchParams => ({
    project_name: (search.project_name as string) ?? "",
  }),
  component: RouteComponent,
})

export type SecretMapDataType = {
  [key: string]: {
    name: string
    value: string
  }
}

function RouteComponent() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Capture `project_name` passed from search parameters
  const { project_name: projectName } = useSearch({
    from: "/_pathlessMain/projects/create/application/",
  })

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ApplicationCreateInputType>({
    // @ts-ignore
    resolver: zodResolver(ProjectZSchema.applicationSchema),
    defaultValues: {
      deploymentName: "",
      image: "",
      containerName: "",
      containerPort: 3000,
      portBinding: 80,
      replicas: 1,
      envVars: [],
      visibility: "private",
      host: "",
      path: "/",
    },
  })

  const visibility = useWatch({ control, name: "visibility" })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "envVars",
  })
const projectService = new ProjectService(
  getClientEnv("VITE_API_SERVER_URL") + "/v1/projects"
)
  // Mutation to send structured deployment data to server
  const createDeploymentMutation = useMutation({
    mutationFn: async (payload: ApplicationCreateServerInputType) => {
      const toastId = toast.loading("Deploying application...")

      try {
        const res: any = await projectService.createDeployment(payload)

        toast.success(res?.message ?? "Deployment Created Successfully!", {
          id: toastId,
        })

        queryClient.invalidateQueries({
          queryKey: ["deployments", payload.projectName],
        })

        // Redirect to dashboard page
        navigate({
          to: "/projects/$project_id/depl/$depl_id",
          params: {
            project_id: payload.projectName,
            depl_id: payload.deploymentName,
          },
        })

        return res
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

  const onSubmit = (values: ApplicationCreateInputType) => {
    if (!projectName) {
      toast.error(
        "Missing Project Name. Please create or select a project first."
      )
      return
    }

    const secretEnvs: SecretMapDataType = {}
    const nonSecretEnvs: SecretMapDataType = {}

    // Group secrets and non-secrets
    for (const { key, name, value, isSecret } of values.envVars ?? []) {
      if (!key) continue
      const target = isSecret ? secretEnvs : nonSecretEnvs
      target[key] = { name, value }
    }

    // Omit `envVars` and compose server input matching ApplicationCreateServerInputType
    const { envVars, ...restValues } = values

    const serverPayload: ApplicationCreateServerInputType = {
      ...restValues,
      projectName,
      secretEnvs,
      nonSecretEnvs,
    }

    createDeploymentMutation.mutate(serverPayload)
  }

  return (
    <div className="mt-16 flex w-full items-center justify-center pb-20">
      <form
        onSubmit={
          // @ts-ignore
          handleSubmit(onSubmit)
        }
        className="w-full max-w-[500px]"
      >
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Deploy New Application</FieldLegend>
            <FieldDescription>
              Deploying to project:{" "}
              <span className="font-semibold text-zinc-100">
                {projectName || "Unspecified"}
              </span>
            </FieldDescription>
            <FieldGroup>
              <Field data-invalid={!!errors.deploymentName}>
                <FieldLabel htmlFor="deploymentName">
                  Deployment Name
                </FieldLabel>
                <Input
                  id="deploymentName"
                  placeholder="my-node-app"
                  aria-invalid={!!errors.deploymentName}
                  disabled={createDeploymentMutation.isPending}
                  {...register("deploymentName")}
                />
                {errors.deploymentName && (
                  <FieldError>{errors.deploymentName.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.image}>
                <FieldLabel htmlFor="image">Image</FieldLabel>
                <Input
                  id="image"
                  placeholder="nginx:latest"
                  aria-invalid={!!errors.image}
                  disabled={createDeploymentMutation.isPending}
                  {...register("image")}
                />
                {errors.image && (
                  <FieldError>{errors.image.message}</FieldError>
                )}
              </Field>

              <Field data-invalid={!!errors.containerName}>
                <FieldLabel htmlFor="container-name">Container Name</FieldLabel>
                <Input
                  id="container-name"
                  placeholder="my-app-container"
                  aria-invalid={!!errors.containerName}
                  disabled={createDeploymentMutation.isPending}
                  {...register("containerName")}
                />
                {errors.containerName && (
                  <FieldError>{errors.containerName.message}</FieldError>
                )}
              </Field>

              <Field orientation="horizontal">
                <Field data-invalid={!!errors.containerPort}>
                  <FieldLabel htmlFor="container-port">
                    Container Port
                  </FieldLabel>
                  <Input
                    id="container-port"
                    type="number"
                    placeholder="3000"
                    aria-invalid={!!errors.containerPort}
                    disabled={createDeploymentMutation.isPending}
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") e.preventDefault()
                    }}
                    {...register("containerPort")}
                  />
                  {errors.containerPort && (
                    <FieldError>{errors.containerPort.message}</FieldError>
                  )}
                </Field>

                <Field data-invalid={!!errors.portBinding}>
                  <FieldLabel htmlFor="port-binding">Port Binding</FieldLabel>
                  <Input
                    id="port-binding"
                    type="number"
                    placeholder="80"
                    defaultValue={80}
                    aria-invalid={!!errors.portBinding}
                    disabled={
                      createDeploymentMutation.isPending ||
                      visibility == "public"
                    }
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e") e.preventDefault()
                    }}
                    {...register("portBinding")}
                  />
                  {errors.portBinding && (
                    <FieldError>{errors.portBinding.message}</FieldError>
                  )}
                </Field>
              </Field>

              <Field data-invalid={!!errors.replicas}>
                <FieldLabel htmlFor="replicas">Replicas</FieldLabel>
                <Input
                  id="replicas"
                  type="number"
                  placeholder="1"
                  aria-invalid={!!errors.replicas}
                  disabled={createDeploymentMutation.isPending}
                  onKeyDown={(e) => {
                    if (e.key === "-" || e.key === "e") e.preventDefault()
                  }}
                  {...register("replicas")}
                />
                {errors.replicas && (
                  <FieldError>{errors.replicas.message}</FieldError>
                )}
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Visibility</FieldLegend>
            <FieldDescription>
              Public deployments are reachable from the internet via a host
            </FieldDescription>
            <FieldGroup>
              <Field>
                <Controller
                  control={control}
                  name="visibility"
                  render={({ field }) => (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={
                          field.value === "private" ? "default" : "outline"
                        }
                        className="flex-1"
                        disabled={createDeploymentMutation.isPending}
                        onClick={() => field.onChange("private")}
                      >
                        Private
                      </Button>
                      <Button
                        type="button"
                        variant={
                          field.value === "public" ? "default" : "outline"
                        }
                        className="flex-1"
                        disabled={createDeploymentMutation.isPending}
                        onClick={() => field.onChange("public")}
                      >
                        Public
                      </Button>
                    </div>
                  )}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          {visibility === "public" && (
            <>
              <FieldSeparator />
              <FieldSet>
                <FieldLegend>Host</FieldLegend>
                <FieldDescription>
                  Configure how this application is exposed
                </FieldDescription>
                <FieldGroup>
                  <Field data-invalid={!!errors.host}>
                    <FieldLabel htmlFor="host">Host</FieldLabel>
                    <Input
                      id="host"
                      placeholder="app.example.com"
                      aria-invalid={!!errors.host}
                      disabled={createDeploymentMutation.isPending}
                      {...register("host")}
                    />
                    {errors.host && (
                      <FieldError>{errors.host.message}</FieldError>
                    )}
                  </Field>

                  <Field data-invalid={!!errors.path}>
                    <FieldLabel htmlFor="path">
                      Path{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FieldLabel>
                    <Input
                      id="path"
                      placeholder="/"
                      aria-invalid={!!errors.path}
                      disabled={createDeploymentMutation.isPending}
                      {...register("path")}
                    />
                    {errors.path && (
                      <FieldError>{errors.path.message}</FieldError>
                    )}
                  </Field>
                </FieldGroup>
              </FieldSet>
            </>
          )}

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Environment Variables</FieldLegend>
            <FieldDescription>
              Key is auto-generated from the variable name (used internally by
              Kubernetes)
            </FieldDescription>
            <FieldGroup>
              {fields.map((field, index) => (
                <EnvVarRow
                  key={field.id}
                  // @ts-ignore
                  control={control}
                  index={index}
                  register={register}
                  setValue={setValue}
                  errors={errors}
                  onRemove={() => remove(index)}
                />
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={createDeploymentMutation.isPending}
                onClick={() =>
                  append({ key: "", name: "", value: "", isSecret: false })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Environment Variable
              </Button>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal" className="flex gap-2">
            <Button type="submit" disabled={createDeploymentMutation.isPending}>
              {createDeploymentMutation.isPending ? "Deploying..." : "Deploy"}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={createDeploymentMutation.isPending}
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
