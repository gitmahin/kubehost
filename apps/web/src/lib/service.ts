import { ProjectService } from "@repo/services"

const API_SERVER_URL = process.env.NITRO_PUBLIC_API_SERVER_URL!

export const projectService = new ProjectService(
  API_SERVER_URL + "/v1/projects"
)
