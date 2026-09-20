import {
  ProjectZSchema,
  type ApplicationCreateInputType,
  type ApplicationCreateServerInputType,
  type ProjectNameInputType,
} from "@/schemas"
import type z from "zod"
import { Validator } from "../validator"
import { injectable } from "inversify"

@injectable()
export class ProjectInputValidators extends Validator {
  projectNameInput(
    projectName: ProjectNameInputType
  ): ProjectNameInputType | z.ZodError {
    const { data, success, error } = this.validate(
      projectName,
      ProjectZSchema.projectName
    )
    if (!success) {
      return error
    }
    return data
  }

  applicationCreateInput(
    payload: ApplicationCreateInputType
  ): ApplicationCreateInputType | z.ZodError {
    const { data, success, error } = this.validate(
      payload,
      ProjectZSchema.applicationSchema
    )
    if (!success) {
      return error
    }

    return data
  }  
  
  applicationCreateServerInput(
    payload: ApplicationCreateServerInputType
  ): ApplicationCreateServerInputType | z.ZodError {
    const { data, success, error } = this.validate(
      payload,
      ProjectZSchema.applicationDeploymentServerSchema
    )
    if (!success) {
      return error
    }

    return data
  }
}
