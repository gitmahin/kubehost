import { ApiService } from "./api.service"
import type {
  ApplicationCreateServerInputType,
  ProjectNameInputType,
  DeleteDeploymentInputType,
} from "@repo/zod"

export class ProjectService extends ApiService {
  constructor(baseUrl: string) {
    super(baseUrl)
  }

  async createProject(projectName: ProjectNameInputType) {
    return this.post("/", { project_name: projectName })
  }

  async listAllProjects() {
    return this.get("/")
  }

  async createDeployment(payload: ApplicationCreateServerInputType) {
    return this.post("/deployments", payload)
  }

  async updateDeployment(payload: ApplicationCreateServerInputType) {
    return this.patch("/deployments", payload)
  }

  async getAllDeployments(project: string) {
    return this.get("/deployments", { params: { project } })
  }

  async deleteDeployment({
    project_name,
    deployment_name,
  }: DeleteDeploymentInputType) {
    return this.delete(`/${project_name}/deployments/${deployment_name}`)
  }
}