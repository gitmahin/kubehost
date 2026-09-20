import { Container } from "inversify"
import { ApiRouter } from "./routes"
import { K8sService, ProjectService } from "./services"
import { ProjectController } from "./controllers/project.controller"
import { ProjectRouter } from "./routes/project.route"
import { ProjectInputValidators, Validator } from "@repo/zod"

export const container = new Container()

// Validators
container.bind(ProjectInputValidators).toSelf().inRequestScope()

// Services
container.bind(K8sService).toSelf().inSingletonScope()
container.bind(ProjectService).toSelf().inSingletonScope()

// Controllers
container.bind(ProjectController).toSelf().inSingletonScope()

// Routers
container.bind(ProjectRouter).toSelf().inSingletonScope()
container.bind(ApiRouter).toSelf().inSingletonScope()
