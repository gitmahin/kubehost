// ┌─────────────────────────┐
// │ Base Imports            │
// └─────────────────────────┘
import { ApiResponse, getCpuCores, getSystemMemory } from "./libs"
import { errorHandlerMiddleware, requestLogger } from "./middlewares"
import { baseConfig } from "./config"
import { ExpressServer } from "./server"
import { container } from "./container"
import { ApiRouter } from "./routes"
import promClient from "@prometheus-io/client"
import { statfs } from "node:fs/promises"
import type {
  ProcessMemory,
  SystemMemory,
  MetricsResponse,
  StorageStats,
} from "@repo/types"
import os from "node:os"
/* -------------------------------------------------------------------------- */
/*                                 Metrics                                    */
/* -------------------------------------------------------------------------- */
const collectDefaultMetrics = promClient.collectDefaultMetrics
const Registry = promClient.Registry
const register = new Registry()
collectDefaultMetrics({ register })

/* -------------------------------------------------------------------------- */
/*                               Create Server                                */
/* -------------------------------------------------------------------------- */
const server = new ExpressServer()
const app = server.GetApp()

// app.use(requestLogger());
/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

const apiRouter = container.get(ApiRouter)
apiRouter.createRouters()
app.use("/api", apiRouter.getRouters())
app.get("/health", async (_, res) => {
  return res.status(200).json(new ApiResponse(200, "OK"))
})

app.get("/api/metrics", async (_req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON()

    const getValue = (name: string, labelFilter = {}) => {
      const metric = metrics.find((m) => m.name === name)
      if (!metric) return null
      const match = metric.values.find((v) =>
        Object.entries(labelFilter).every(([k, val]) => v.labels[k] === val)
      )
      return match ? match.value : (metric.values[0]?.value ?? null)
    }

    // Process-level memory (this Node process only, via prom-client)
    const processMemory: ProcessMemory = {
      residentBytes: getValue("process_resident_memory_bytes") ?? 0,
      residentMB: +(
        getValue("process_resident_memory_bytes")! /
        1024 /
        1024
      ).toFixed(2),
      virtualBytes: getValue("process_virtual_memory_bytes") ?? 0,
      heapTotalBytes: getValue("nodejs_heap_size_total_bytes") ?? 0,
      heapUsedBytes: getValue("nodejs_heap_size_used_bytes") ?? 0,
      externalBytes: getValue("nodejs_external_memory_bytes") ?? 0,
    }

    // Disk/storage stats
    let storage: StorageStats
    try {
      const stats = await statfs("/")
      const totalBytes = stats.blocks * stats.bsize
      const freeBytes = stats.bfree * stats.bsize
      const usedBytes = totalBytes - freeBytes
      const availableBytes = stats.bavail * stats.bsize

      storage = {
        totalBytes,
        usedBytes,
        freeBytes,
        totalGB: +(totalBytes / 1024 ** 3).toFixed(2),
        usedGB: +(usedBytes / 1024 ** 3).toFixed(2),
        freeGB: +(freeBytes / 1024 ** 3).toFixed(2),
        usedPercent: +((usedBytes / totalBytes) * 100).toFixed(2),
        availableBytes,
      }
    } catch (err: any) {
      storage = {
        totalBytes: 0,
        usedBytes: 0,
        freeBytes: 0,
        availableBytes: 0,
        totalGB: 0,
        usedGB: 0,
        freeGB: 0,
        usedPercent: 0,
        error: (err as Error).message,
      }
    }

    const organized: Partial<MetricsResponse> = {
      cpu: {
        userSeconds: getValue("process_cpu_user_seconds_total") ?? 0,
        systemSeconds: getValue("process_cpu_system_seconds_total") ?? 0,
        totalSeconds: getValue("process_cpu_seconds_total") ?? 0,
        cores: getCpuCores(),
      },
      memory: {
        process: processMemory,
        system: getSystemMemory(),
      },
      storage,
      eventLoop: {
        lagSeconds: getValue("nodejs_eventloop_lag_seconds") ?? 0,
        lagP50: getValue("nodejs_eventloop_lag_p50_seconds") ?? 0,
        lagP90: getValue("nodejs_eventloop_lag_p90_seconds") ?? 0,
        lagP99: getValue("nodejs_eventloop_lag_p99_seconds") ?? 0,
      },
      handles: {
        activeHandlesTotal: getValue("nodejs_active_handles_total") ?? 0,
        activeRequestsTotal: getValue("nodejs_active_requests_total") ?? 0,
        openFds: getValue("process_open_fds") ?? 0,
        maxFds: getValue("process_max_fds") ?? 0,
      },
      process: {
        startTimeSeconds: getValue("process_start_time_seconds") ?? 0,
        uptimeSeconds:
          Date.now() / 1000 - getValue("process_start_time_seconds")!,
      },
      timestamp: Date.now(),
    }

    res.json(organized)
  } catch (err) {
    res.status(500).json({ error: String(err) })
  }
})

/* -------------------------------------------------------------------------- */
/*                          Error Handler Middleware                          */
/* -------------------------------------------------------------------------- */
app.use(errorHandlerMiddleware)

// Start Server
app.listen(baseConfig.PORT, async () => {
  console.log(`                                                                                           
 █             █             █                          
 █             █             █                      █   
 █             █             █                      █   
 █  ▒█  █   █  █▓██    ███   █▒██▒   ███   ▒███▒  █████ 
 █ ▒█   █   █  █▓ ▓█  ▓▓ ▒█  █▓ ▒█  █▓ ▓█  █▒ ░█    █   
 █▒█    █   █  █   █  █   █  █   █  █   █  █▒░      █   
 ██▓    █   █  █   █  █████  █   █  █   █  ░███▒    █   
 █░█░   █   █  █   █  █      █   █  █   █     ▒█    █   
 █ ░█   █▒ ▓█  █▓ ▓█  ▓▓  █  █   █  █▓ ▓█  █░ ▒█    █░  
 █  ▒█  ▒██▒█  █▓██    ███▒  █   █   ███   ▒███▒    ▒██                                                                                                        
 Listening...                  Port: ${baseConfig.PORT}`)
})
