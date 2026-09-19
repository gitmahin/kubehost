// ┌─────────────────────────┐
// │ Base Imports            │
// └─────────────────────────┘
import { ApiResponse} from "./libs";
import { errorHandlerMiddleware, requestLogger } from "./middlewares";
import { baseConfig } from "./config";
import { ExpressServer } from "./server";
import { container } from "./container";
import { ApiRouter } from "./routes";

/* -------------------------------------------------------------------------- */
/*                               Create Server                                */
/* -------------------------------------------------------------------------- */
const server = new ExpressServer();
const app = server.GetApp();

// app.use(requestLogger());
/* -------------------------------------------------------------------------- */
/*                                   Routes                                   */
/* -------------------------------------------------------------------------- */

const apiRouter = container.get(ApiRouter);
apiRouter.createRouters();
app.use("/api", apiRouter.getRouters());
app.get("/health", async (_, res) => {
  return res.status(200).json(new ApiResponse(200, "OK"));
});

/* -------------------------------------------------------------------------- */
/*                          Error Handler Middleware                          */
/* -------------------------------------------------------------------------- */
app.use(errorHandlerMiddleware);

// Start Server
app.listen(baseConfig.PORT, async () => {
  console.log(`                                     
               █             ███          
 ██   █        █               █          
 ██░  █        █               █          
 █▒▓  █  ███   █▓██   █   █    █    ░███░ 
 █ █  █ ▓▓ ▒█  █▓ ▓█  █   █    █    █▒ ▒█ 
 █ ▓▓ █ █   █  █   █  █   █    █        █ 
 █  █ █ █████  █   █  █   █    █    ▒████ 
 █  ▓▒█ █      █   █  █   █    █    █▒  █ 
 █  ░██ ▓▓  █  █▓ ▓█  █▒ ▓█    █░   █░ ▓█ 
 █   ██  ███▒  █▓██   ▒██▒█    ▒██  ▒██▒█     
 Listening...                  Port: ${baseConfig.PORT}`);
});
