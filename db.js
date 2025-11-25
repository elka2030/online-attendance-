const Database = require("better-sqlite3")
const path = require("path")

// Initialize database
const db = new Database(path.join(__dirname, "expense_manager.db"))

// Create tables if they don't exist
function initializeDatabase() {
  // Users table
  db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `)

  // Expenses table
  db.exec(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            note TEXT,
            date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `)

  // Incomes table
  db.exec(`
        CREATE TABLE IF NOT EXISTS incomes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            source TEXT NOT NULL,
            date DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    `)

  // Budgets table
  db.exec(`
        CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category TEXT NOT NULL,
            amount REAL NOT NULL,
            period TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            UNIQUE(user_id, category, period)
        )
    `)

  console.log("Database initialized successfully")
}

// User operations
function registerUser(username, password) {
  try {
    const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)")
    const result = stmt.run(username, password)
    return { success: true, userId: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function loginUser(username, password) {
  try {
    const stmt = db.prepare("SELECT id, username FROM users WHERE username = ? AND password = ?")
    const user = stmt.get(username, password)
    return user ? { success: true, user } : { success: false, error: "Invalid credentials" }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Expense operations
function addExpense(userId, amount, category, note, date) {
  try {
    const stmt = db.prepare("INSERT INTO expenses (user_id, amount, category, note, date) VALUES (?, ?, ?, ?, ?)")
    const result = stmt.run(userId, amount, category, note, date)
    return { success: true, expenseId: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function getExpensesByUser(userId) {
  try {
    const stmt = db.prepare("SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC")
    const expenses = stmt.all(userId)
    return { success: true, expenses }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function deleteExpense(expenseId, userId) {
  try {
    const stmt = db.prepare("DELETE FROM expenses WHERE id = ? AND user_id = ?")
    const result = stmt.run(expenseId, userId)
    return { success: true, deleted: result.changes > 0 }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Income operations
function addIncome(userId, amount, source, date) {
  try {
    const stmt = db.prepare("INSERT INTO incomes (user_id, amount, source, date) VALUES (?, ?, ?, ?)")
    const result = stmt.run(userId, amount, source, date)
    return { success: true, incomeId: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function getIncomesByUser(userId) {
  try {
    const stmt = db.prepare("SELECT * FROM incomes WHERE user_id = ? ORDER BY date DESC")
    const incomes = stmt.all(userId)
    return { success: true, incomes }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Budget operations
function setBudget(userId, category, amount, period) {
  try {
    const stmt = db.prepare(`
            INSERT OR REPLACE INTO budgets (user_id, category, amount, period) 
            VALUES (?, ?, ?, ?)
        `)
    const result = stmt.run(userId, category, amount, period)
    return { success: true, budgetId: result.lastInsertRowid }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

function getBudgetsByUser(userId) {
  try {
    const stmt = db.prepare("SELECT * FROM budgets WHERE user_id = ?")
    const budgets = stmt.all(userId)
    return { success: true, budgets }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Initialize database on module load
initializeDatabase()

module.exports = {
  registerUser,
  loginUser,
  addExpense,
  getExpensesByUser,
  deleteExpense,
  addIncome,
  getIncomesByUser,
  setBudget,
  getBudgetsByUser,
}
