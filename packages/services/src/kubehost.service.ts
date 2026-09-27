import { ApiService } from "./api.service"

export class KubehostService extends ApiService {
  constructor(baseUrl: string) {
    super(baseUrl)
  }

  async getMetricsDashboard() {
    return this.get(`/metrics`)
  }


}
