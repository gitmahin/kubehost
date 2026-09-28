export type ProcessMemory = {
  residentBytes: number
  residentMB: number
  virtualBytes: number
  heapTotalBytes: number
  heapUsedBytes: number
  externalBytes: number
}

export type SystemMemory = {
  totalBytes: number
  freeBytes: number
  usedBytes: number
  totalGB: number
  freeGB: number
  usedGB: number
  usedPercent: number
}

export type StorageStats = {
  totalBytes: number
  usedBytes: number
  freeBytes: number
  availableBytes: number
  totalGB: number
  usedGB: number
  freeGB: number
  usedPercent: number
  error?: string
}

export type MetricsResponse = Partial<{
  cpu: {
    userSeconds: number
    systemSeconds: number
    totalSeconds: number
    cores: number
    totalConsumedCpu: number
    totalReservedCpu: number
  }
  memory: {
    process: ProcessMemory // from prom-client — this Node process only
    system: SystemMemory // from os — whole machine RAM
  }
  storage: StorageStats
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
}>
