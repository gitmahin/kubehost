import { ProjectService } from "@repo/services"

const API_SERVER_URL = process.env.API_SERVER_URL ?? "http://localhost:5000/api"

export const projectService = new ProjectService(
  API_SERVER_URL + "/v1/projects"
)
