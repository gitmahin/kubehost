import z from "zod"

export class DeploymentSchema {
  static envVarSchema = z.object({
    key: z.string().min(1, "Key is required"),
    name: z.string().min(1, "Name is required"),
    value: z.string().min(1, "Value is required"),
  })

  static applicationSchema = z
    .object({
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
      envVars: z.array(this.envVarSchema),
      visibility: z.enum(["public", "private"]),
      host: z.string().optional(),
      path: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (data.visibility === "public" && !data.host) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Host is required for public deployments",
          path: ["host"],
        })
      }
    })
}

export type ApplicationFormValues = z.infer<
  typeof DeploymentSchema.applicationSchema
>
