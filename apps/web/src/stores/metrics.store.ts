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
    if (isError) {
      this.isLoading = false
    }
  }

  setMetrics(data: MetricsResponse | null) {
    this.metrics = data
    this.isLoading = false
    this.isError = false
    this.errorMessage = ""
  }

  // Computed helper for Node process heap percentage
  get heapUsedPercent(): number {
    const heapTotal = this.metrics?.memory?.process?.heapTotalBytes
    const heapUsed = this.metrics?.memory?.process?.heapUsedBytes

    if (!heapTotal || !heapUsed) return 0
    return (heapUsed / heapTotal) * 100
  }

  // Computed System Memory Usage %
  get systemMemoryUsedPercent(): number {
    return this.metrics?.memory?.system?.usedPercent ?? 0
  }

  // Helper function returning fill color for Progress Bar only
  getProgressBarColor(percent: number): string {
    if (percent >= 85) {
      return "bg-red-500"
    }
    if (percent >= 70) {
      return "bg-amber-500"
    }
    return "bg-emerald-500"
  }
}

export const metricsStore = new MetricsStore()