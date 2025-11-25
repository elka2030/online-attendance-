// Global variables
let currentUser = null
let expenses = []
let filteredExpenses = []

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

  // Set default date to today
  document.getElementById("date").valueAsDate = new Date()

  // Load expenses
  await loadExpenses()
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
  document.getElementById("expenseForm").addEventListener("submit", handleAddExpense)

  // Filter controls
  document.getElementById("categoryFilter").addEventListener("change", applyFilters)
  document.getElementById("monthFilter").addEventListener("change", applyFilters)

  // Set default month filter to current month
  const currentDate = new Date()
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  document.getElementById("monthFilter").value = currentMonth
}

// Load expenses from API
async function loadExpenses() {
  try {
    showLoadingState()

    const response = await fetch(`${API_BASE}/expenses/${currentUser.id}`)
    const data = await response.json()

    if (data.success) {
      expenses = data.expenses
      applyFilters()
      updateSummaryCards()
    } else {
      showMessage(data.error || "Failed to load expenses", "error")
      showEmptyState()
    }
  } catch (error) {
    console.error("Error loading expenses:", error)
    showMessage("Network error. Please refresh the page.", "error")
    showEmptyState()
  }
}

// Handle add expense form submission
async function handleAddExpense(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const expenseData = {
    userId: currentUser.id,
    amount: Number.parseFloat(formData.get("amount")),
    category: formData.get("category"),
    note: formData.get("note") || "",
    date: formData.get("date"),
  }

  // Validation
  if (expenseData.amount <= 0) {
    showMessage("Amount must be greater than 0", "error")
    return
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  try {
    // Show loading state
    submitBtn.disabled = true
    submitBtn.textContent = "Adding..."

    const response = await fetch(`${API_BASE}/expenses`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(expenseData),
    })

    const data = await response.json()

    if (data.success) {
      showMessage("Expense added successfully!", "success")

      // Reset form
      e.target.reset()
      document.getElementById("date").valueAsDate = new Date()

      // Reload expenses
      await loadExpenses()
    } else {
      showMessage(data.error || "Failed to add expense", "error")
    }
  } catch (error) {
    console.error("Error adding expense:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    // Reset button state
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Delete expense
async function deleteExpense(expenseId) {
  if (!confirm("Are you sure you want to delete this expense?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/expenses/${expenseId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: currentUser.id }),
    })

    const data = await response.json()

    if (data.success) {
      showMessage("Expense deleted successfully!", "success")
      await loadExpenses()
    } else {
      showMessage(data.error || "Failed to delete expense", "error")
    }
  } catch (error) {
    console.error("Error deleting expense:", error)
    showMessage("Network error. Please try again.", "error")
  }
}

// Apply filters to expenses
function applyFilters() {
  const categoryFilter = document.getElementById("categoryFilter").value
  const monthFilter = document.getElementById("monthFilter").value

  filteredExpenses = expenses.filter((expense) => {
    // Category filter
    if (categoryFilter && expense.category !== categoryFilter) {
      return false
    }

    // Month filter
    if (monthFilter) {
      const expenseMonth = expense.date.substring(0, 7) // YYYY-MM format
      if (expenseMonth !== monthFilter) {
        return false
      }
    }

    return true
  })

  renderExpensesList()
}

// Render expenses list
function renderExpensesList() {
  const expensesContainer = document.getElementById("expensesList")

  if (filteredExpenses.length === 0) {
    const categoryFilter = document.getElementById("categoryFilter").value
    const monthFilter = document.getElementById("monthFilter").value

    let emptyMessage = "No expenses found"
    if (categoryFilter || monthFilter) {
      emptyMessage += " for the selected filters"
    }

    expensesContainer.innerHTML = `
            <div class="empty-state">
                <h4>${emptyMessage}</h4>
                <p>Try adjusting your filters or add a new expense</p>
            </div>
        `
    return
  }

  // Sort expenses by date (newest first)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => new Date(b.date) - new Date(a.date))

  const expensesHTML = sortedExpenses
    .map(
      (expense) => `
        <div class="expense-item" data-expense-id="${expense.id}">
            <div class="expense-info">
                <div class="expense-icon">
                    ${categoryIcons[expense.category] || "📦"}
                </div>
                <div class="expense-details">
                    <h4>${expense.category}</h4>
                    <p>${expense.note || "No description"}</p>
                    <p>${formatDate(expense.date)}</p>
                </div>
            </div>
            <div class="expense-amount">
                ${formatCurrency(expense.amount)}
            </div>
            <div class="expense-actions">
                <button class="btn-icon btn-delete" onclick="deleteExpense(${expense.id})" title="Delete expense">
                    🗑️
                </button>
            </div>
        </div>
    `,
    )
    .join("")

  expensesContainer.innerHTML = expensesHTML
}

// Update summary cards
function updateSummaryCards() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Calculate monthly total
  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const monthlyTotal = monthlyExpenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)

  // Find top category
  const categoryTotals = {}
  expenses.forEach((expense) => {
    categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + Number.parseFloat(expense.amount)
  })

  const topCategory = Object.keys(categoryTotals).reduce(
    (a, b) => (categoryTotals[a] > categoryTotals[b] ? a : b),
    "None",
  )

  // Update DOM
  document.getElementById("monthlyTotal").textContent = formatCurrency(monthlyTotal)
  document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses)
  document.getElementById("topCategory").textContent = topCategory
}

// Utility functions
function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

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
  document.getElementById("expensesList").innerHTML = `
        <div class="loading-state">Loading expenses...</div>
    `
}

function showEmptyState() {
  document.getElementById("expensesList").innerHTML = `
        <div class="empty-state">
            <h4>No expenses yet</h4>
            <p>Start by adding your first expense above</p>
        </div>
    `
}
