import { createFileRoute } from '@tanstack/react-router'
import { useForm, useFieldArray, useWatch, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Plus } from 'lucide-react'
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
import { EnvVarRow } from '@/components/deployments'

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



function RouteComponent() {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ApplicationFormValues>({
    // @ts-ignore
    resolver: zodResolver(DeploymentSchema.applicationSchema),
    defaultValues: {
      replicas: 1,
      envVars: [],
      visibility: 'private',
    },
  })

  const visibility = useWatch({ control, name: 'visibility' })

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

      <form onSubmit={
        // @ts-ignore
        handleSubmit(onSubmit)
      } className='max-w-[500px] w-full'>
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
                        variant={field.value === 'private' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('private')}
                      >
                        Private
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'public' ? 'default' : 'outline'}
                        className="flex-1"
                        onClick={() => field.onChange('public')}
                      >
                        Public
                      </Button>
                    </div>
                  )}
                />
              </Field>
            </FieldGroup>
          </FieldSet>

          {visibility === 'public' && (
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
            </>
          )}


          <FieldSeparator />

          <FieldSet>
            <FieldLegend>Environment Variables</FieldLegend>
            <FieldDescription>
              Key is auto-generated from the variable name (used internally by Kubernetes)
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