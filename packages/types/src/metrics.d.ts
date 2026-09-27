export type MetricsResponse = {
  cpu: {
    userSeconds: number
    systemSeconds: number
    totalSeconds: number
  }
  memory: {
    residentBytes: number
    residentMB: number
    virtualBytes: number
    heapTotalBytes: number
    heapUsedBytes: number
    externalBytes: number
  }
  storage: {
    totalBytes: number
    usedBytes: number
    freeBytes: number
    availableBytes: number
    totalGB: number
    usedGB: number
    freeGB: number
    usedPercent: number
  }
  eventLoop: {
    lagSeconds: number
    lagP50: number
    lagP90: number
    lagP99: number
  }
  handles: {
    activeHandlesTotal: number
    activeRequestsTotal: number
    openFds: number
    maxFds: number
  }
  process: {
    startTimeSeconds: number
    uptimeSeconds: number
  }
  timestamp: number
}