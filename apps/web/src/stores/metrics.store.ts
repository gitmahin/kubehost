import type { MetricsResponse } from "@repo/types"
import { makeAutoObservable } from "mobx"



class MetricsStore {
  metrics: MetricsResponse | null = null
  isLoading = true
  isError = false
  errorMessage = ""

  constructor() {
    makeAutoObservable(this)
  }

  setIsLoading(loading: boolean) {
    this.isLoading = loading
  }

  setError(isError: boolean, message: string = "") {
    this.isError = isError
    this.errorMessage = message
  }

  setMetrics(data: MetricsResponse | null) {
    this.metrics = data
    this.isLoading = false
    this.isError = false
    this.errorMessage = ""
  }

  get heapUsedPercent(): number {
    if (!this.metrics || !this.metrics.memory?.heapTotalBytes) return 0
    return (
      (this.metrics.memory.heapUsedBytes / this.metrics.memory.heapTotalBytes) *
      100
    )
  }
}

export const metricsStore = new MetricsStore()