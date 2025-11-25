const express = require("express")
const cors = require("cors")
const path = require("path")
const routes = require("./routes")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, "../frontend")))

// Routes
app.use("/api", routes)

// Serve frontend files
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/auth/login.html"))
})

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log("Access the application at: http://localhost:3000")
})
