import dotenv from "dotenv"
import express from "express"
import cors from "cors"

const app = express()
const PORT = process.env.PORT

app.use(express.json())
app.use(cors({
    origin: "*"
}))

app.get("/health", (req, res) => {
  return res.status(200).json({ message: "OK" })
})

app.listen(PORT, () => {
  console.log("Server is listening on port: ", PORT)
})
