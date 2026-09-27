// ┌─────────────────────────┐
// │ Base Imports            │
// └─────────────────────────┘
import { ApiResponse } from "./libs"
import { errorHandlerMiddleware, requestLogger } from "./middlewares"
import { baseConfig } from "./config"
import { ExpressServer } from "./server"
import { container } from "./container"
import { ApiRouter } from "./routes"
import promClient from "@prometheus-io/client";
import { statfs } from "node:fs/promises";

/* -------------------------------------------------------------------------- */
/*                                 Metrics                                    */
/* -------------------------------------------------------------------------- */
const collectDefaultMetrics = promClient.collectDefaultMetrics;
const Registry = promClient.Registry;
const register = new Registry();
collectDefaultMetrics({ register });


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
    const metrics = await register.getMetricsAsJSON();

    const getValue = (name: string, labelFilter = {}) => {
      const metric = metrics.find((m) => m.name === name);
      if (!metric) return null;
      const match = metric.values.find((v) =>
        Object.entries(labelFilter).every(([k, val]) => v.labels[k] === val)
      );
      return match ? match.value : metric.values[0]?.value ?? null;
    };

    // Disk/storage stats for the path your app runs on 
    let storage = null;
    try {
      const stats = await statfs("/"); // change path if you want a specific mount/drive
      const totalBytes = stats.blocks * stats.bsize;
      const freeBytes = stats.bfree * stats.bsize;
      const availableBytes = stats.bavail * stats.bsize; // available to non-root users
      const usedBytes = totalBytes - freeBytes;

      storage = {
        totalBytes,
        usedBytes,
        freeBytes,
        availableBytes,
        totalGB: +(totalBytes / 1024 ** 3).toFixed(2),
        usedGB: +(usedBytes / 1024 ** 3).toFixed(2),
        freeGB: +(freeBytes / 1024 ** 3).toFixed(2),
        usedPercent: +((usedBytes / totalBytes) * 100).toFixed(2),
      };
    } catch (err: any) {
      storage = { error: `Failed to read disk stats: ${err.message}` };
    }

    const organized = {
      cpu: {
        userSeconds: getValue("process_cpu_user_seconds_total"),
        systemSeconds: getValue("process_cpu_system_seconds_total"),
        totalSeconds: getValue("process_cpu_seconds_total"),
      },
      memory: {
        residentBytes: getValue("process_resident_memory_bytes"),
        residentMB: +(getValue("process_resident_memory_bytes")! / 1024 / 1024).toFixed(2),
        virtualBytes: getValue("process_virtual_memory_bytes"),
        heapTotalBytes: getValue("nodejs_heap_size_total_bytes"),
        heapUsedBytes: getValue("nodejs_heap_size_used_bytes"),
        externalBytes: getValue("nodejs_external_memory_bytes"),
      },
      storage,
      eventLoop: {
        lagSeconds: getValue("nodejs_eventloop_lag_seconds"),
        lagP50: getValue("nodejs_eventloop_lag_p50_seconds"),
        lagP90: getValue("nodejs_eventloop_lag_p90_seconds"),
        lagP99: getValue("nodejs_eventloop_lag_p99_seconds"),
      },
      handles: {
        activeHandlesTotal: getValue("nodejs_active_handles_total"),
        activeRequestsTotal: getValue("nodejs_active_requests_total"),
        openFds: getValue("process_open_fds"),
        maxFds: getValue("process_max_fds"),
      },
      process: {
        startTimeSeconds: getValue("process_start_time_seconds"),
        uptimeSeconds: Date.now() / 1000 - getValue("process_start_time_seconds")!,
      },
      timestamp: Date.now(),
    };

    res.json(organized);
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

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
