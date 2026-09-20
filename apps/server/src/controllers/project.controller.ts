import { ApiResponse } from "@/libs"
import { ProjectService } from "@/services"
import type { Request, Response } from "express"
import { inject, injectable } from "inversify"
import {
  ProjectInputValidators,
  type ApplicationCreateServerInputType,
} from "@repo/zod"
import { isZodError, validationError } from "@/utils"

@injectable()
export class ProjectController {
  constructor(
    @inject(ProjectService)
    private projectService: ProjectService,
    @inject(ProjectInputValidators)
    private projectInputValidators: ProjectInputValidators
  ) {}

  async createProjectHandler(req: Request, res: Response) {
    const { project_name } = req.body

    const parsedProjectName =
      this.projectInputValidators.projectNameInput(project_name)
    if (isZodError(parsedProjectName)) throw validationError(parsedProjectName)

    this.projectService.createNewProject(parsedProjectName)
    return res.status(200).json(new ApiResponse(200, "Ok"))
  }

  async createDeploymentHandler(req: Request, res: Response) {
    const payload = req.body as ApplicationCreateServerInputType

    const parsedPayload =
      this.projectInputValidators.applicationCreateServerInput(payload)
    if (isZodError(parsedPayload)) throw validationError(parsedPayload)

    const {
      projectName,
      containerName,
      containerPort,
      image,
      portBinding,
      replicas,
      visibility,
      host,
      path,
      nonSecretEnvs,
      deploymentName,
      secretEnvs,
    } = parsedPayload

    this.projectService.createDeployment({
      namespace: projectName,
      deploymentName: deploymentName,
      containerName: containerName,
      image: image,
      containerPort: containerPort,
      replicas: replicas,
      secretEnvs: secretEnvs,
      labelName: deploymentName,
      secretName: deploymentName,
      serviceName: deploymentName,
      configName: deploymentName,
      nonSecretEnvs: nonSecretEnvs,
      host: host as string,
      ingressName: deploymentName,
      servicePort: portBinding,
      path: path,
      visibility,
    })

    return res.status(200).json(new ApiResponse(200, "Deployment Created"))
  }

  async updateDeploymentHandler(req: Request, res: Response) {
    const payload = req.body as ApplicationCreateServerInputType

    const parsedPayload =
      this.projectInputValidators.applicationCreateServerInput(payload)
    if (isZodError(parsedPayload)) throw validationError(parsedPayload)

    const {
      containerName,
      containerPort,
      image,
      portBinding,
      replicas,
      visibility,
      host,
      path,
      nonSecretEnvs,
      deploymentName,
      secretEnvs,
      projectName,
    } = parsedPayload

    this.projectService.updateDeployment({
      namespace: projectName,
      deploymentName: deploymentName,
      containerName: containerName,
      image: image,
      containerPort: containerPort,
      replicas: replicas,
      secretEnvs: secretEnvs,
      labelName: deploymentName,
      secretName: deploymentName,
      serviceName: deploymentName,
      configName: deploymentName,
      nonSecretEnvs: nonSecretEnvs,
      host: host as string,
      ingressName: deploymentName,
      visibility,
      servicePort: portBinding,
      path: path,
    })
    return res.status(200).json(new ApiResponse(200, "Deployment Updated"))
  }

  async getAllDeploymentsHandler(req: Request, res: Response) {
    const { project } = req.query as { project: string }
    const response = await this.projectService.getDeployments(project)
    return res.status(200).json(new ApiResponse(200, "OK", response))
  }

  async getPorjectsHandler(req: Request, res: Response) {
    const repsonse = await this.projectService.getProjectNames()
    return res.status(200).json(new ApiResponse(200, "Ok", repsonse))
  }
}
