import { Router } from "express";
import type { IRouter } from "@/blueprints";
import { inject, injectable } from "inversify";


@injectable()
export class ApiRouter implements IRouter {
  private router: Router;

  constructor(
    // @inject(UserRouter)
    // private userRouter: UserRouter,

  ) {
    this.router = Router();
    // this.userRouter.createRouters();

  }

  createRouters(): void {
    // this.router.use("/v1/users", this.userRouter.getRouters());

  }

  getRouters(): Router {
    return this.router;
  }
}
