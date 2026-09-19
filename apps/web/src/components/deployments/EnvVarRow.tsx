import { useWatch } from 'react-hook-form'
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form'
import {  Trash2 } from 'lucide-react'
import {
  Field,

  FieldError,
  
  FieldLabel,
  Input,
  Button,
} from '@workspace/ui/components'

import type { ApplicationFormValues } from '@/zod'
import { useEffect, useRef } from 'react'

function toEnvKey(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/_/g, '-')
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function EnvVarRow({
  control,
  index,
  register,
  setValue,
  errors,
  onRemove,
}: {
  control: Control<ApplicationFormValues>
  index: number
  register: UseFormRegister<ApplicationFormValues>
  setValue: UseFormSetValue<ApplicationFormValues>
  errors: FieldErrors<ApplicationFormValues>
  onRemove: () => void
}) {
  const nameValue = useWatch({ control, name: `envVars.${index}.name` })
  const keyManuallyEdited = useRef(false)

  useEffect(() => {
    if (keyManuallyEdited.current) return
    setValue(`envVars.${index}.key`, toEnvKey(nameValue || ''), {
      shouldValidate: true,
    })
  }, [nameValue, index, setValue])

  return (
    <div className="flex flex-col gap-2 border rounded-md p-3">
      <div className="flex items-start gap-2">
        <div className="flex-1 flex flex-col gap-2">
          <Field data-invalid={!!errors.envVars?.[index]?.name}>
            <FieldLabel htmlFor={`env-name-${index}`}>Name</FieldLabel>
            <Input
              id={`env-name-${index}`}
              placeholder="PORT"
              {...register(`envVars.${index}.name`)}
            />
            {errors.envVars?.[index]?.name && (
              <FieldError>{errors.envVars[index]?.name?.message}</FieldError>
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
              <FieldError>{errors.envVars[index]?.value?.message}</FieldError>
            )}
          </Field>

          <Field data-invalid={!!errors.envVars?.[index]?.key}>
            <FieldLabel htmlFor={`env-key-${index}`}>
              Key <span className="text-muted-foreground">(editable)</span>
            </FieldLabel>
            <Input
              id={`env-key-${index}`}
              placeholder="app-port"
              {...register(`envVars.${index}.key`, {
                onChange: () => {
                  keyManuallyEdited.current = true
                },
              })}
            />
            {errors.envVars?.[index]?.key && (
              <FieldError>{errors.envVars[index]?.key?.message}</FieldError>
            )}
          </Field>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="mt-6 shrink-0"
          onClick={onRemove}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </Button>
      </div>
    </div>
  )
}