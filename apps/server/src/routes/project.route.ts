import type { IRouter } from "@/blueprints"
import { ProjectController } from "@/controllers/project.controller"
import { asyncHandler } from "@/utils"
import { Router } from "express"
import { inject, injectable } from "inversify"

@injectable()
export class ProjectRouter implements IRouter {
  private router: Router
  constructor(
    @inject(ProjectController)
    private projectController: ProjectController
  ) {
    this.router = Router()
  }

  createRouters(): void {
    this.router
      .route("/namespaces")
      .post(
        asyncHandler(
          this.projectController.createProjectHandler.bind(
            this.projectController
          )
        )
      )

    this.router
      .route("/deployments")
      .post(
        asyncHandler(
          this.projectController.createDeploymentHandler.bind(
            this.projectController
          )
        )
      )

    this.router
      .route("/deployments")
      .get(
        asyncHandler(
          this.projectController.getAllDeploymentsHandler.bind(
            this.projectController
          )
        )
      )

    this.router
      .route("/deployments")
      .patch(
        asyncHandler(
          this.projectController.updateDeploymentHandler.bind(
            this.projectController
          )
        )
      )

      this.router
      .route("/namespaces")
      .get(
        asyncHandler(
          this.projectController.getPorjectsHandler.bind(
            this.projectController
          )
        )
      )
  }

  getRouters(): Router {
    return this.router
  }
}
