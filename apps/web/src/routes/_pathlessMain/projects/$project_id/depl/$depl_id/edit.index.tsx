import { useEffect, useState } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useForm, useFieldArray, useWatch, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Plus, Loader2 } from "lucide-react"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@workspace/ui/components"
import { ProjectZSchema } from "@repo/zod"
import type {
  ApplicationCreateInputType,
  ApplicationCreateServerInputType,
} from "@repo/zod"
import { EnvVarRow } from "@/components/deployments"
import { projectService } from "@/lib/service"
import { EditFormLoader } from "@/components/skeleton"

export const Route = createFileRoute(
  "/_pathlessMain/projects/$project_id/depl/$depl_id/edit/"
)({
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
  const { project_id: projectId, depl_id: deplId } = Route.useParams()

  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [pendingValues, setPendingValues] =
    useState<ApplicationCreateInputType | null>(null)

  // Fetch existing deployment data
  const {
    data: deploymentData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["deployment-edit", projectId, deplId],
    queryFn: async () => {
      const res: any = await projectService.getDeploymentEditData({
        project_name: projectId,
        deployment_name: deplId,
      })
      return res?.data.data
    },
  })

  const {
    register,
    control,
    handleSubmit,
    setValue,
    reset,
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

  // Pre-fill form when deployment data is fetched
  useEffect(() => {
    if (deploymentData) {
      reset({
        deploymentName: deploymentData.deploymentName ?? "",
        image: deploymentData.image ?? "",
        containerName: deploymentData.containerName ?? "",
        containerPort: deploymentData.containerPort ?? 3000,
        portBinding: deploymentData.portBinding ?? 80,
        replicas: deploymentData.replicas ?? 1,
        envVars: deploymentData.envVars ?? [],
        visibility: deploymentData.visibility ?? "private",
        host: deploymentData.host ?? "",
        path: deploymentData.path ?? "/",
      })
    }
  }, [deploymentData, reset])

  const visibility = useWatch({ control, name: "visibility" })

  const { fields, append, remove } = useFieldArray({
    control,
    name: "envVars",
  })

  // Mutation to update deployment
  const updateDeploymentMutation = useMutation({
    mutationFn: async (payload: ApplicationCreateServerInputType) => {
      const toastId = toast.loading("Updating deployment...")

      try {
        const res: any = await projectService.updateDeployment(payload)

        toast.success(res?.message ?? "Deployment Updated Successfully!", {
          id: toastId,
        })

        queryClient.invalidateQueries({
          queryKey: ["deployments", payload.projectName],
        })
        queryClient.invalidateQueries({
          queryKey: ["deployment-edit", projectId, deplId],
        })

        // Redirect back to deployment page
        navigate({
          to: "/projects/$project_id/depl/$depl_id",
          params: {
            project_id: projectId,
            depl_id: deplId,
          },
        })

        return res
      } catch (err: any) {
        toast.error(err.message, {
          id: toastId,
          description: err.errors?.length ? String(err.errors[0]) : undefined,
        })
      }
    },
  })

  const onSubmit = (values: ApplicationCreateInputType) => {
    setPendingValues(values)
    setIsConfirmOpen(true)
  }

  const handleConfirmUpdate = () => {
    if (!pendingValues) return

    const secretEnvs: SecretMapDataType = {}
    const nonSecretEnvs: SecretMapDataType = {}

    // Group secrets and non-secrets
    for (const { key, name, value, isSecret } of pendingValues.envVars ?? []) {
      if (!key) continue
      const target = isSecret ? secretEnvs : nonSecretEnvs
      target[key] = { name, value }
    }

    const { envVars, ...restValues } = pendingValues

    const serverPayload: ApplicationCreateServerInputType = {
      ...restValues,
      projectName: projectId,
      secretEnvs,
      nonSecretEnvs,
    }

    setIsConfirmOpen(false)
    updateDeploymentMutation.mutate(serverPayload)
  }

  if (isLoading) {
    return <EditFormLoader />
  }

  if (isError) {
    return (
      <div className="mt-16 text-center">
        <p className="font-semibold text-destructive">
          Failed to load deployment data
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "An unexpected error occurred."}
        </p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() =>
            navigate({
              to: "/projects/$project_id/depl/$depl_id",
              params: { project_id: projectId, depl_id: deplId },
            })
          }
        >
          Back to Deployment
        </Button>
      </div>
    )
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
            <FieldLegend>Edit Deployment</FieldLegend>
            <FieldDescription>
              Updating deployment for project:{" "}
              <span className="font-semibold text-zinc-100">{projectId}</span>
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
                  disabled={updateDeploymentMutation.isPending}
                  {...register("deploymentName")}
                />
                {errors.deploymentName && (
                  <FieldError>{errors.deploymentName.message}</FieldError>
                )}
              </Field>

              {/* Note: The image field is deliberately hidden as image cannot be edited */}

              <Field data-invalid={!!errors.containerName}>
                <FieldLabel htmlFor="container-name">Container Name</FieldLabel>
                <Input
                  id="container-name"
                  placeholder="my-app-container"
                  aria-invalid={!!errors.containerName}
                  disabled={updateDeploymentMutation.isPending}
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
                    disabled={updateDeploymentMutation.isPending}
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
                    aria-invalid={!!errors.portBinding}
                    disabled={
                      updateDeploymentMutation.isPending ||
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
                  disabled={updateDeploymentMutation.isPending}
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
                        disabled={updateDeploymentMutation.isPending}
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
                        disabled={updateDeploymentMutation.isPending}
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
                      disabled={updateDeploymentMutation.isPending}
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
                      disabled={updateDeploymentMutation.isPending}
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
                disabled={updateDeploymentMutation.isPending}
                onClick={() =>
                  append({ key: "", name: "", value: "", isSecret: false })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Environment Variable
              </Button>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal" className="flex gap-2">
            <Button type="submit" disabled={updateDeploymentMutation.isPending}>
              {updateDeploymentMutation.isPending
                ? "Updating..."
                : "Update Deployment"}
            </Button>
            <Button
              variant="outline"
              type="button"
              disabled={updateDeploymentMutation.isPending}
              onClick={() =>
                navigate({
                  to: "/projects/$project_id/depl/$depl_id",
                  params: {
                    project_id: projectId,
                    depl_id: deplId,
                  },
                })
              }
            >
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Deployment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to update this deployment configuration?
              This action will apply changes to the live cluster pods.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={updateDeploymentMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={updateDeploymentMutation.isPending}
              onClick={handleConfirmUpdate}
            >
              Confirm Update
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
