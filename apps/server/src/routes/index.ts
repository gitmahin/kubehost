import { Router } from "express"
import type { IRouter } from "@/blueprints"
import { inject, injectable } from "inversify"
import { ProjectRouter } from "./project.route"

@injectable()
export class ApiRouter implements IRouter {
  private router: Router

  constructor(
    @inject(ProjectRouter)
    private projectRouter: ProjectRouter
  ) {
    this.router = Router()
    this.projectRouter.createRouters()
  }

  createRouters(): void {
    this.router.use("/v1/projects", this.projectRouter.getRouters())
  }

  getRouters(): Router {
    return this.router
  }
}
