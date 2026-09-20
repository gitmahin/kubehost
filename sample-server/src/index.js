import "dotenv/config"
import express from "express"
import cors from "cors"
import { drizzle } from "drizzle-orm/node-postgres"
import { sql } from "drizzle-orm"

const app = express()
const PORT = process.env.PORT ?? 3000

app.use(express.json())
app.use(
  cors({
    origin: "*",
  })
)

app.get("/health", async (req, res) => {
  try {
    const pgDb = drizzle(process.env.DATABASE_URL, {
      relations: {},
      jit: true,
    })
    const result = await pgDb.execute(sql`SELECT NOW()`)

    return res.status(200).json({
      message: "OK",
      database: {
        connected: true,
        time: result.rows[0]?.now,
      },
    })
  } catch (error) {
    return res.status(500).json({
      message: "Database health check failed",
      database: {
        connected: false,
      },
    })
  }
})

app.listen(PORT, () => {
  console.log("Server is listening on port: ", PORT)
})
