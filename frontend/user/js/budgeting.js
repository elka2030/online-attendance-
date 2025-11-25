
// Global variables
let currentUser = null
let budgets = []
let expenses = []
let currentView = "grid" // 'grid' or 'list'
let editingBudgetId = null

// API base URL
const API_BASE = "http://localhost:3000/api"

// Category icons mapping
const categoryIcons = {
  Food: "🍔",
  Transportation: "🚗",
  Housing: "🏠",
  Utilities: "⚡",
  Healthcare: "🏥",
  Entertainment: "🎬",
  Shopping: "🛍️",
  Education: "📚",
  Other: "📦",
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  if (!checkAuth()) {
    return
  }

  // Set up event listeners
  setupEventListeners()

  // Load data
  await loadData()
})

// Authentication check
function checkAuth() {
  const userData = localStorage.getItem("currentUser")
  if (!userData) {
    window.location.href = "/frontend/auth/login.html"
    return false
  }

  try {
    currentUser = JSON.parse(userData)
    document.getElementById("welcomeMessage").textContent = `Welcome, ${currentUser.username}!`
    return true
  } catch (error) {
    console.error("Error parsing user data:", error)
    localStorage.removeItem("currentUser")
    window.location.href = "/frontend/auth/login.html"
    return false
  }
}

// Set up event listeners
function setupEventListeners() {
  // Logout functionality
  document.getElementById("logoutBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to logout?")) {
      localStorage.removeItem("currentUser")
      window.location.href = "/frontend/auth/login.html"
    }
  })

  // Form submission
  document.getElementById("budgetForm").addEventListener("submit", handleBudgetSubmit)

  // Period filter
  document.getElementById("periodFilter").addEventListener("change", () => {
    updateOverview()
    renderBudgets()
  })

  // View toggle
  document.getElementById("viewToggle").addEventListener("click", toggleView)

  // Cancel edit
  document.getElementById("cancelEdit").addEventListener("click", cancelEdit)
}

// Load all data
async function loadData() {
  try {
    showLoadingState()

    // Load budgets and expenses concurrently
    const [budgetsResult, expensesResult] = await Promise.all([fetchBudgets(), fetchExpenses()])

    if (budgetsResult.success) {
      budgets = budgetsResult.budgets
    } else {
      showMessage(budgetsResult.error || "Failed to load budgets", "error")
    }

    if (expensesResult.success) {
      expenses = expensesResult.expenses
    } else {
      showMessage(expensesResult.error || "Failed to load expenses", "error")
    }

    // Update UI
    updateOverview()
    renderBudgets()
  } catch (error) {
    console.error("Error loading data:", error)
    showMessage("Network error. Please refresh the page.", "error")
    showEmptyState()
  }
}

// Fetch budgets from API
async function fetchBudgets() {
  try {
    const response = await fetch(`${API_BASE}/budgets/${currentUser.id}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching budgets:", error)
    return { success: false, error: error.message }
  }
}

// Fetch expenses from API
async function fetchExpenses() {
  try {
    const response = await fetch(`${API_BASE}/expenses/${currentUser.id}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching expenses:", error)
    return { success: false, error: error.message }
  }
}

// Handle budget form submission
async function handleBudgetSubmit(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const budgetData = {
    userId: currentUser.id,
    category: formData.get("category"),
    amount: Number.parseFloat(formData.get("amount")),
    period: formData.get("period"),
  }

  // Add description if provided
  const description = formData.get("description")
  if (description) {
    budgetData.description = description
  }

  // Validation
  if (budgetData.amount <= 0) {
    showMessage("Budget amount must be greater than 0", "error")
    return
  }

  const submitBtn = document.getElementById("submitBtn")
  const originalText = submitBtn.textContent

  try {
    // Show loading state
    submitBtn.disabled = true
    submitBtn.textContent = editingBudgetId ? "Updating..." : "Setting..."

    const response = await fetch(`${API_BASE}/budgets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budgetData),
    })

    const data = await response.json()

    if (data.success) {
      showMessage(editingBudgetId ? "Budget updated successfully!" : "Budget set successfully!", "success")

      // Reset form and editing state
      e.target.reset()
      cancelEdit()

      // Reload data
      await loadData()
    } else {
      showMessage(data.error || "Failed to save budget", "error")
    }
  } catch (error) {
    console.error("Error saving budget:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    // Reset button state
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Edit budget
function editBudget(budget) {
  editingBudgetId = budget.id

  // Populate form
  document.getElementById("category").value = budget.category
  document.getElementById("amount").value = budget.amount
  document.getElementById("period").value = budget.period
  document.getElementById("description").value = budget.description || ""

  // Update UI
  document.getElementById("formTitle").textContent = "Edit Budget"
  document.getElementById("submitBtn").textContent = "Update Budget"
  document.getElementById("cancelEdit").style.display = "block"

  // Scroll to form
  document.querySelector(".form-section").scrollIntoView({ behavior: "smooth" })
}

// Cancel edit
function cancelEdit() {
  editingBudgetId = null

  // Reset form
  document.getElementById("budgetForm").reset()

  // Update UI
  document.getElementById("formTitle").textContent = "Set New Budget"
  document.getElementById("submitBtn").textContent = "Set Budget"
  document.getElementById("cancelEdit").style.display = "none"
}

// Delete budget
async function deleteBudget(budgetId) {
  if (!confirm("Are you sure you want to delete this budget?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/budgets/${budgetId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: currentUser.id }),
    })

    const data = await response.json()

    if (data.success) {
      showMessage("Budget deleted successfully!", "success")
      await loadData()
    } else {
      showMessage(data.error || "Failed to delete budget", "error")
    }
  } catch (error) {
    console.error("Error deleting budget:", error)
    showMessage("Network error. Please try again.", "error")
  }
}

// Update overview section
function updateOverview() {
  const selectedPeriod = document.getElementById("periodFilter").value
  const filteredBudgets = budgets.filter((budget) => budget.period === selectedPeriod)

  // Calculate totals
  const totalBudget = filteredBudgets.reduce((sum, budget) => sum + Number.parseFloat(budget.amount), 0)

  // Calculate spent amounts for each budget category
  let totalSpent = 0
  filteredBudgets.forEach((budget) => {
    const categoryExpenses = getCategoryExpenses(budget.category, budget.period)
    totalSpent += categoryExpenses
  })

  const totalRemaining = totalBudget - totalSpent

  // Determine budget health
  let budgetHealth = "Good"
  let healthColor = "#22c55e"

  if (totalBudget > 0) {
    const spentPercentage = (totalSpent / totalBudget) * 100
    if (spentPercentage > 100) {
      budgetHealth = "Over Budget"
      healthColor = "#ef4444"
    } else if (spentPercentage > 80) {
      budgetHealth = "Warning"
      healthColor = "#f59e0b"
    }
  } else {
    budgetHealth = "No Budgets"
    healthColor = "#666"
  }

  // Update DOM
  document.getElementById("totalBudget").textContent = formatCurrency(totalBudget)
  document.getElementById("totalSpent").textContent = formatCurrency(totalSpent)
  document.getElementById("totalRemaining").textContent = formatCurrency(totalRemaining)
  document.getElementById("budgetHealth").textContent = budgetHealth
  document.getElementById("budgetHealth").style.color = healthColor
}

// Get category expenses for a specific period
function getCategoryExpenses(category, period) {
  const now = new Date()
  let startDate

  if (period === "weekly") {
    // Get start of current week (Sunday)
    startDate = new Date(now)
    startDate.setDate(now.getDate() - now.getDay())
    startDate.setHours(0, 0, 0, 0)
  } else {
    // Get start of current month
    startDate = new Date(now.getFullYear(), now.getMonth(), 1)
  }

  return expenses
    .filter((expense) => {
      const expenseDate = new Date(expense.date)
      return expense.category === category && expenseDate >= startDate
    })
    .reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
}

// Render budgets
function renderBudgets() {
  const container = document.getElementById("budgetsContainer")
  const selectedPeriod = document.getElementById("periodFilter").value
  const filteredBudgets = budgets.filter((budget) => budget.period === selectedPeriod)

  if (filteredBudgets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h4>No ${selectedPeriod} budgets set</h4>
        <p>Create your first budget to start tracking your spending</p>
      </div>
    `
    return
  }

  const containerClass = currentView === "grid" ? "budgets-grid" : "budgets-list"

  const budgetsHTML = filteredBudgets
    .map((budget) => {
      const spent = getCategoryExpenses(budget.category, budget.period)
      const remaining = Number.parseFloat(budget.amount) - spent
      const percentage = budget.amount > 0 ? (spent / Number.parseFloat(budget.amount)) * 100 : 0

      let progressClass = ""
      let statusClass = ""

      if (percentage > 100) {
        progressClass = "danger"
        statusClass = "over"
      } else if (percentage > 80) {
        progressClass = "warning"
      }

      return `
      <div class="budget-item" data-budget-id="${budget.id}">
        <div class="budget-header">
          <div class="budget-category">
            <span class="category-icon">${categoryIcons[budget.category] || "📦"}</span>
            <span class="category-name">${budget.category}</span>
          </div>
          <span class="budget-period">${budget.period}</span>
        </div>
        
        <div class="budget-amounts">
          <div class="amount-row">
            <span class="amount-label">Budget:</span>
            <span class="amount-value budget">${formatCurrency(budget.amount)}</span>
          </div>
          <div class="amount-row">
            <span class="amount-label">Spent:</span>
            <span class="amount-value spent">${formatCurrency(spent)}</span>
          </div>
          <div class="amount-row">
            <span class="amount-label">Remaining:</span>
            <span class="amount-value ${remaining >= 0 ? "remaining" : "over"}">${formatCurrency(Math.abs(remaining))}</span>
          </div>
        </div>
        
        <div class="progress-container">
          <div class="progress-label">
            <span>Progress</span>
            <span>${Math.min(percentage, 100).toFixed(1)}%</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill ${progressClass}" style="width: ${Math.min(percentage, 100)}%"></div>
          </div>
        </div>
        
        <div class="budget-actions">
          <button class="btn-icon btn-edit" onclick="editBudget(${JSON.stringify(budget).replace(/"/g, "&quot;")})" title="Edit budget">
            ✏️
          </button>
          <button class="btn-icon btn-delete" onclick="deleteBudget(${budget.id})" title="Delete budget">
            🗑️
          </button>
        </div>
      </div>
    `
    })
    .join("")

  container.innerHTML = `<div class="${containerClass}">${budgetsHTML}</div>`
}

// Toggle view between grid and list
function toggleView() {
  const toggleBtn = document.getElementById("viewToggle")

  if (currentView === "grid") {
    currentView = "list"
    toggleBtn.textContent = "Grid View"
  } else {
    currentView = "grid"
    toggleBtn.textContent = "List View"
  }

  renderBudgets()
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount)
}

function showMessage(message, type = "error") {
  const messageDiv = document.getElementById("message")
  messageDiv.textContent = message
  messageDiv.className = `message ${type}`
  messageDiv.style.display = "block"

  // Auto-hide after 5 seconds
  setTimeout(() => {
    messageDiv.style.display = "none"
  }, 5000)
}

function showLoadingState() {
  document.getElementById("budgetsContainer").innerHTML = `
    <div class="loading-state">Loading budgets...</div>
  `
}

function showEmptyState() {
  document.getElementById("budgetsContainer").innerHTML = `
    <div class="empty-state">
      <h4>No budgets yet</h4>
      <p>Start by setting your first budget above</p>
    </div>
  `
}

// Make functions available globally for onclick handlers
window.editBudget = editBudget
window.deleteBudget = deleteBudget
