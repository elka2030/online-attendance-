const express = require("express")
const router = express.Router()
const db = require("./db")

// Middleware to validate request body
function validateBody(requiredFields) {
  return (req, res, next) => {
    const missingFields = requiredFields.filter((field) => !req.body[field])
    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        error: `Missing required fields: ${missingFields.join(", ")}`,
      })
    }
    next()
  }
}

// Authentication routes
router.post("/register", validateBody(["username", "password"]), (req, res) => {
  const { username, password } = req.body

  if (password.length < 4) {
    return res.status(400).json({
      success: false,
      error: "Password must be at least 4 characters long",
    })
  }

  const result = db.registerUser(username, password)
  res.status(result.success ? 201 : 400).json(result)
})

router.post("/login", validateBody(["username", "password"]), (req, res) => {
  const { username, password } = req.body
  const result = db.loginUser(username, password)
  res.status(result.success ? 200 : 401).json(result)
})

// Expense routes
router.post("/expenses", validateBody(["userId", "amount", "category", "date"]), (req, res) => {
  const { userId, amount, category, note, date } = req.body

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Amount must be greater than 0",
    })
  }

  const result = db.addExpense(userId, amount, category, note || "", date)
  res.status(result.success ? 201 : 400).json(result)
})

router.get("/expenses/:userId", (req, res) => {
  const userId = Number.parseInt(req.params.userId)
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID",
    })
  }

  const result = db.getExpensesByUser(userId)
  res.status(result.success ? 200 : 400).json(result)
})

router.delete("/expenses/:expenseId", validateBody(["userId"]), (req, res) => {
  const expenseId = Number.parseInt(req.params.expenseId)
  const { userId } = req.body

  if (isNaN(expenseId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid expense ID",
    })
  }

  const result = db.deleteExpense(expenseId, userId)
  res.status(result.success ? 200 : 400).json(result)
})

// Income routes
router.post("/incomes", validateBody(["userId", "amount", "source", "date"]), (req, res) => {
  const { userId, amount, source, date } = req.body

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Amount must be greater than 0",
    })
  }

  const result = db.addIncome(userId, amount, source, date)
  res.status(result.success ? 201 : 400).json(result)
})

router.get("/incomes/:userId", (req, res) => {
  const userId = Number.parseInt(req.params.userId)
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID",
    })
  }

  const result = db.getIncomesByUser(userId)
  res.status(result.success ? 200 : 400).json(result)
})

// Budget routes
router.post("/budgets", validateBody(["userId", "category", "amount", "period"]), (req, res) => {
  const { userId, category, amount, period } = req.body

  if (amount <= 0) {
    return res.status(400).json({
      success: false,
      error: "Budget amount must be greater than 0",
    })
  }

  const result = db.setBudget(userId, category, amount, period)
  res.status(result.success ? 201 : 400).json(result)
})

router.get("/budgets/:userId", (req, res) => {
  const userId = Number.parseInt(req.params.userId)
  if (isNaN(userId)) {
    return res.status(400).json({
      success: false,
      error: "Invalid user ID",
    })
  }

  const result = db.getBudgetsByUser(userId)
  res.status(result.success ? 200 : 400).json(result)
})

module.exports = router
