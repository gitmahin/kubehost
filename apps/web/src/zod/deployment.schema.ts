import z from "zod"

export class DeploymentSchema {
  static envVarSchema = z.object({
    key: z.string().min(1, "Key is required"),
    name: z.string().min(1, "Name is required"),
    value: z.string().min(1, "Value is required"),
  })

  static applicationSchema = z.object({
    image: z.string().min(1, "Image is required"),
    containerName: z.string().min(1, "Container name is required"),
    containerPort: z.coerce
      .number({ error: "Container port must be a number" })
      .int()
      .min(0, "Port cannot be negative")
      .max(65535, "Port must be 65535 or below"),
    portBinding: z.coerce
      .number({ error: "Port binding must be a number" })
      .int()
      .min(0, "Port cannot be negative")
      .max(65535, "Port must be 65535 or below"),
    replicas: z.coerce
      .number({ error: "Replicas must be a number" })
      .int()
      .min(1, "At least 1 replica is required"),
    host: z.string().min(1, "Host is required"),
    path: z.string().optional(),
    envVars: z.array(this.envVarSchema),
  })
}


export type ApplicationFormValues = z.infer<typeof DeploymentSchema.applicationSchema>