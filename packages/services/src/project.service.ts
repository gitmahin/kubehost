import { ApiService } from "./api.service";

export class ProjectService extends ApiService {
    constructor(baseUrl: string) {
        super(baseUrl)
    }

    async listAllProjects() {
        return this.get("/")
    }
}