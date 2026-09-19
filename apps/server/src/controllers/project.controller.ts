import { ApiResponse } from "@/libs"
import { ProjectService } from "@/services"
import type { Request, Response } from "express"
import { inject, injectable } from "inversify"

@injectable()
export class ProjectController {
  constructor(
    @inject(ProjectService)
    private projectService: ProjectService
  ) {}

  async createProjectHandler(req: Request, res: Response) {
    this.projectService.createNewProject("my-demo-project")
    return res.status(200).json(new ApiResponse(200, "Ok"))
  }

  async createDeploymentHandler(req: Request, res: Response) {
    this.projectService.createDeployment({
      namespace: "my-demo-project",
      deploymentName: "sample-express",
      containerName: "sample-express",
      image: "dockermahin/sample-express",
      containerPort: 3000,
      replicas: 1,
      secretEnvs: {},
      labelName: "",
      secretName: "",
      serviceName: "",
      configName: "",
      nonSecretEnvs: {},
    })
    return res.status(200).json(new ApiResponse(200, "Deployment Created"))
  }

  async updateDeploymentHandler(req: Request, res: Response) {
    this.projectService.updateDeployment({
      namespace: "my-demo-project",
      deploymentName: "sample-express",
      containerName: "sample-express",
      image: "dockermahin/sample-express",
      containerPort: 3000,
      replicas: 2,
      secretEnvs: {},
      labelName: "",
      secretName: "",
      serviceName: "",
      configName: "",
      nonSecretEnvs: {},
    })
    return res.status(200).json(new ApiResponse(200, "Deployment Updated"))
  }
}
