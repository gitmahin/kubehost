import z from "zod"
import { ZodBase } from "./base.zod"

export class ProjectZSchema extends ZodBase {
  static projectName = z
    .string()
    .min(1, "Project name is required")
    .max(63, "Project name must be 63 characters or fewer")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Only letters, numbers, and hyphens are allowed - no spaces or special characters"
    )

  static deploymentName = z
    .string()
    .min(1, "Deployment name is required")
    .max(70, "Deployment name must be 70 characters or fewer")
    .regex(
      /^[a-zA-Z0-9-]+$/,
      "Only letters, numbers, and hyphens are allowed - no spaces or special characters"
    )

  static envVarSchema = z.object({
    key: z.string().min(1, "Key is required"),
    name: z.string().min(1, "Name is required"),
    value: z.string().min(1, "Value is required"),
    isSecret: z.boolean().default(false),
  })

  static envMapDataSchema = z.record(
    z.string(),
    z.object({
      name: z.string(),
      value: z.string(),
    })
  )

  static applicationBaseSchema = z.object({
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

  static hostRequiredForPublic(
    data: { visibility: string; host?: string },
    ctx: z.RefinementCtx
  ) {
    if (data.visibility === "public" && !data.host) {
      ctx.addIssue({
        code: "custom",
        message: "Host is required for public deployments",
        path: ["host"],
      })
    }
  }

  static applicationSchema = this.applicationBaseSchema.superRefine(
    this.hostRequiredForPublic
  )

  static applicationDeploymentServerSchema = this.applicationBaseSchema
    .omit({ envVars: true })
    .extend({
      projectName: this.projectName,
      deploymentName: this.deploymentName,
      secretEnvs: this.envMapDataSchema,
      nonSecretEnvs: this.envMapDataSchema,
    })
    .superRefine(this.hostRequiredForPublic)

  static deleteDeploymentSchema = z.object({
    project_name: this.projectName,
    deployment_name: this.deploymentName,
  })
}

export type ProjectNameInputType = z.infer<typeof ProjectZSchema.projectName>

export type ApplicationCreateInputType = z.infer<
  typeof ProjectZSchema.applicationSchema
>

export type ApplicationCreateServerInputType = z.infer<
  typeof ProjectZSchema.applicationDeploymentServerSchema
>

export type DeleteDeploymentInputType = z.infer<
  typeof ProjectZSchema.deleteDeploymentSchema
>