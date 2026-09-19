import { createFileRoute } from '@tanstack/react-router'
import { useForm, useFieldArray, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, Trash2 } from 'lucide-react'
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
} from '@workspace/ui/components'
import { DeploymentSchema } from '@/zod'
import type { ApplicationFormValues } from '@/zod'

export const Route = createFileRoute(
  '/_pathlessMain/projects/create/application/',
)({
  component: RouteComponent,
})

export type SecretMapDataType = {
  [key: string]: {
    name: string
    value: string
  }
}

function toEnvKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}



function RouteComponent() {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, dirtyFields },
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(DeploymentSchema.applicationSchema),
    defaultValues: {
      replicas: 1,
      envVars: [],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'envVars',
  })

  const onSubmit = (values: ApplicationFormValues) => {

    const envData: SecretMapDataType = Object.fromEntries(
      values.envVars.map(({ key, name, value }) => [key, { name, value }])
    )
    console.log({
      ...values,
      envVars: envData,
    })
  
  }

  return (
    <div className='w-full flex justify-center items-center mt-16 pb-20'>
      <form onSubmit={handleSubmit(onSubmit)} className='max-w-[500px] w-full'>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Deploy New Application</FieldLegend>
            <FieldDescription>
              All transactions are secure and encrypted
            </FieldDescription>
            <FieldGroup>
              <Field data-invalid={!!errors.image}>
                <FieldLabel htmlFor="image">Image</FieldLabel>
                <Input
                  id="image"
                  placeholder="nginx:latest"
                  aria-invalid={!!errors.image}
                  {...register('image')}
                />
                {errors.image && <FieldError>{errors.image.message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.containerName}>
                <FieldLabel htmlFor="container-name">Container Name</FieldLabel>
                <Input
                  id="container-name"
                  placeholder="my-app-container"
                  aria-invalid={!!errors.containerName}
                  {...register('containerName')}
                />
                {errors.containerName && (
                  <FieldError>{errors.containerName.message}</FieldError>
                )}
              </Field>

              <Field orientation="horizontal">
                <Field data-invalid={!!errors.containerPort}>
                  <FieldLabel htmlFor="container-port">Container Port</FieldLabel>
                  <Input
                    id="container-port"
                    type="number"
                    placeholder="8080"
                    aria-invalid={!!errors.containerPort}
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault()
                    }}
                    {...register('containerPort')}
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
                    onKeyDown={(e) => {
                      if (e.key === '-' || e.key === 'e') e.preventDefault()
                    }}
                    {...register('portBinding')}
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
                  onKeyDown={(e) => {
                    if (e.key === '-' || e.key === 'e') e.preventDefault()
                  }}
                  {...register('replicas')}
                />
                {errors.replicas && <FieldError>{errors.replicas.message}</FieldError>}
              </Field>
            </FieldGroup>
          </FieldSet>

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
                  {...register('host')}
                />
                {errors.host && <FieldError>{errors.host.message}</FieldError>}
              </Field>

              <Field data-invalid={!!errors.path}>
                <FieldLabel htmlFor="path">
                  Path <span className="text-muted-foreground">(optional)</span>
                </FieldLabel>
                <Input
                  id="path"
                  placeholder="/"
                  aria-invalid={!!errors.path}
                  {...register('path')}
                />
                {errors.path && <FieldError>{errors.path.message}</FieldError>}
              </Field>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Environment Variables</FieldLegend>
            <FieldDescription>
              Key is auto-generated from the variable name (used internally by Kubernetes)
            </FieldDescription>
            <FieldGroup>
              {fields.map((field, index) => (
                <div key={field.id} className="flex flex-col gap-2 border rounded-md p-3">
                  <div className="flex items-start gap-2">
                    <div className="flex-1 flex flex-col gap-2">
                      <Field data-invalid={!!errors.envVars?.[index]?.name}>
                        <FieldLabel htmlFor={`env-name-${index}`}>Name</FieldLabel>
                        <Controller
                          control={control}
                          name={`envVars.${index}.name`}
                          render={({ field: nameField }) => (
                            <Input
                              id={`env-name-${index}`}
                              placeholder="PORT"
                              value={nameField.value}
                              onChange={(e) => {
                                const rawName = e.target.value
                                nameField.onChange(rawName)

                                // only auto-fill key if the user hasn't manually edited it
                                const keyWasManuallyEdited =
                                  dirtyFields.envVars?.[index]?.key
                                if (!keyWasManuallyEdited) {
                                  setValue(
                                    `envVars.${index}.key`,
                                    toEnvKey(rawName),
                                    { shouldValidate: true }
                                  )
                                }
                              }}
                            />
                          )}
                        />
                        {errors.envVars?.[index]?.name && (
                          <FieldError>
                            {errors.envVars[index]?.name?.message}
                          </FieldError>
                        )}
                      </Field>

                      <Field data-invalid={!!errors.envVars?.[index]?.value}>
                        <FieldLabel htmlFor={`env-value-${index}`}>Value</FieldLabel>
                        <Input
                          id={`env-value-${index}`}
                          placeholder="3000"
                          {...register(`envVars.${index}.value`)}
                        />
                        {errors.envVars?.[index]?.value && (
                          <FieldError>
                            {errors.envVars[index]?.value?.message}
                          </FieldError>
                        )}
                      </Field>

                      <Field data-invalid={!!errors.envVars?.[index]?.key}>
                        <FieldLabel htmlFor={`env-key-${index}`}>
                          Key <span className="text-muted-foreground">(auto-generated)</span>
                        </FieldLabel>
                        <Input
                          id={`env-key-${index}`}
                          placeholder="app-port"
                          {...register(`envVars.${index}.key`)}
                        />
                        {errors.envVars?.[index]?.key && (
                          <FieldError>
                            {errors.envVars[index]?.key?.message}
                          </FieldError>
                        )}
                      </Field>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="mt-6 shrink-0"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => append({ key: '', name: '', value: '' })}
              >
                <Plus className="w-4 h-4" /> Add Environment Variable
              </Button>
            </FieldGroup>
          </FieldSet>

          <Field orientation="horizontal">
            <Button type="submit">Deploy</Button>
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Field>
        </FieldGroup>
      </form>
    </div>
  )
}