import { makeAutoObservable } from "mobx"
import type {MetricsResponse} from "@repo/types"


class MetricsStore {
  metrics: MetricsResponse | null = null

  constructor() {
    makeAutoObservable(this)
  }

  // Set metrics into the store
  setMetrics(data: MetricsResponse | null) {
    this.metrics = data
  }

  // Computed helper for memory heap percentage
  get heapUsedPercent(): number {
    if (!this.metrics || !this.metrics.memory.heapTotalBytes) return 0
    return (
      (this.metrics.memory.heapUsedBytes / this.metrics.memory.heapTotalBytes) *
      100
    )
  }
}

export const metricsStore = new MetricsStore()