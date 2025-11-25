// Global variables
let currentUser = null
let incomes = []
let filteredIncomes = []
let expenses = []

// API base URL
const API_BASE = "http://localhost:3000/api"

// Source icons mapping
const sourceIcons = {
  Salary: "💼",
  Freelance: "💻",
  Business: "🏢",
  Investment: "📈",
  Rental: "🏠",
  Gift: "🎁",
  Bonus: "🎉",
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
  document.getElementById("incomeForm").addEventListener("submit", handleAddIncome)

  // Filter controls
  document.getElementById("sourceFilter").addEventListener("change", applyFilters)
  document.getElementById("monthFilter").addEventListener("change", applyFilters)

  // Set default month filter to current month
  const currentDate = new Date()
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}`
  document.getElementById("monthFilter").value = currentMonth
}

// Load all data
async function loadData() {
  try {
    showLoadingState()

    // Load incomes and expenses concurrently
    const [incomesResult, expensesResult] = await Promise.all([fetchIncomes(), fetchExpenses()])

    if (incomesResult.success) {
      incomes = incomesResult.incomes
      applyFilters()
      updateSummaryCards()
    } else {
      showMessage(incomesResult.error || "Failed to load incomes", "error")
      showEmptyState()
    }

    if (expensesResult.success) {
      expenses = expensesResult.expenses
      updateComparison()
    }
  } catch (error) {
    console.error("Error loading data:", error)
    showMessage("Network error. Please refresh the page.", "error")
    showEmptyState()
  }
}

// Fetch incomes from API
async function fetchIncomes() {
  try {
    const response = await fetch(`${API_BASE}/incomes/${currentUser.id}`)
    return await response.json()
  } catch (error) {
    console.error("Error fetching incomes:", error)
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

// Handle add income form submission
async function handleAddIncome(e) {
  e.preventDefault()

  const formData = new FormData(e.target)
  const incomeData = {
    userId: currentUser.id,
    amount: Number.parseFloat(formData.get("amount")),
    source: formData.get("source"),
    date: formData.get("date"),
  }

  // Add description if provided
  const description = formData.get("description")
  if (description) {
    incomeData.description = description
  }

  // Validation
  if (incomeData.amount <= 0) {
    showMessage("Amount must be greater than 0", "error")
    return
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  try {
    // Show loading state
    submitBtn.disabled = true
    submitBtn.textContent = "Adding..."

    const response = await fetch(`${API_BASE}/incomes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(incomeData),
    })

    const data = await response.json()

    if (data.success) {
      showMessage("Income added successfully!", "success")

      // Reset form
      e.target.reset()
      document.getElementById("date").valueAsDate = new Date()

      // Reload data
      await loadData()
    } else {
      showMessage(data.error || "Failed to add income", "error")
    }
  } catch (error) {
    console.error("Error adding income:", error)
    showMessage("Network error. Please try again.", "error")
  } finally {
    // Reset button state
    submitBtn.disabled = false
    submitBtn.textContent = originalText
  }
}

// Delete income
async function deleteIncome(incomeId) {
  if (!confirm("Are you sure you want to delete this income?")) {
    return
  }

  try {
    const response = await fetch(`${API_BASE}/incomes/${incomeId}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: currentUser.id }),
    })

    const data = await response.json()

    if (data.success) {
      showMessage("Income deleted successfully!", "success")
      await loadData()
    } else {
      showMessage(data.error || "Failed to delete income", "error")
    }
  } catch (error) {
    console.error("Error deleting income:", error)
    showMessage("Network error. Please try again.", "error")
  }
}

// Apply filters to incomes
function applyFilters() {
  const sourceFilter = document.getElementById("sourceFilter").value
  const monthFilter = document.getElementById("monthFilter").value

  filteredIncomes = incomes.filter((income) => {
    // Source filter
    if (sourceFilter && income.source !== sourceFilter) {
      return false
    }

    // Month filter
    if (monthFilter) {
      const incomeMonth = income.date.substring(0, 7) // YYYY-MM format
      if (incomeMonth !== monthFilter) {
        return false
      }
    }

    return true
  })

  renderIncomesList()
}

// Render incomes list
function renderIncomesList() {
  const incomesContainer = document.getElementById("incomeList")

  if (filteredIncomes.length === 0) {
    const sourceFilter = document.getElementById("sourceFilter").value
    const monthFilter = document.getElementById("monthFilter").value

    let emptyMessage = "No income found"
    if (sourceFilter || monthFilter) {
      emptyMessage += " for the selected filters"
    }

    incomesContainer.innerHTML = `
            <div class="empty-state">
                <h4>${emptyMessage}</h4>
                <p>Try adjusting your filters or add a new income</p>
            </div>
        `
    return
  }

  // Sort incomes by date (newest first)
  const sortedIncomes = [...filteredIncomes].sort((a, b) => new Date(b.date) - new Date(a.date))

  const incomesHTML = sortedIncomes
    .map(
      (income) => `
        <div class="income-item" data-income-id="${income.id}">
            <div class="income-info">
                <div class="income-icon">
                    ${sourceIcons[income.source] || "📦"}
                </div>
                <div class="income-details">
                    <h4>${income.source}</h4>
                    <p>${income.description || "No description"}</p>
                    <p>${formatDate(income.date)}</p>
                </div>
            </div>
            <div class="income-amount">
                +${formatCurrency(income.amount)}
            </div>
            <div class="income-actions">
                <button class="btn-icon btn-delete" onclick="deleteIncome(${income.id})" title="Delete income">
                    🗑️
                </button>
            </div>
        </div>
    `,
    )
    .join("")

  incomesContainer.innerHTML = incomesHTML
}

// Update summary cards
function updateSummaryCards() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Calculate monthly total
  const monthlyIncomes = incomes.filter((income) => {
    const incomeDate = new Date(income.date)
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
  })

  const monthlyTotal = monthlyIncomes.reduce((sum, income) => sum + Number.parseFloat(income.amount), 0)

  // Calculate total income
  const totalIncome = incomes.reduce((sum, income) => sum + Number.parseFloat(income.amount), 0)

  // Find top source
  const sourceTotals = {}
  incomes.forEach((income) => {
    sourceTotals[income.source] = (sourceTotals[income.source] || 0) + Number.parseFloat(income.amount)
  })

  const topSource = Object.keys(sourceTotals).reduce((a, b) => (sourceTotals[a] > sourceTotals[b] ? a : b), "None")

  // Calculate average monthly income (last 6 months)
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const recentIncomes = incomes.filter((income) => new Date(income.date) >= sixMonthsAgo)
  const monthsWithIncome = new Set(recentIncomes.map((income) => income.date.substring(0, 7))).size
  const averageMonthly =
    monthsWithIncome > 0
      ? recentIncomes.reduce((sum, income) => sum + Number.parseFloat(income.amount), 0) / monthsWithIncome
      : 0

  // Update DOM
  document.getElementById("monthlyTotal").textContent = formatCurrency(monthlyTotal)
  document.getElementById("totalIncome").textContent = formatCurrency(totalIncome)
  document.getElementById("topSource").textContent = topSource
  document.getElementById("averageMonthly").textContent = formatCurrency(averageMonthly)
}

// Update income vs expenses comparison
function updateComparison() {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Calculate current month totals
  const monthlyIncomes = incomes.filter((income) => {
    const incomeDate = new Date(income.date)
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
  })

  const monthlyExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const totalIncome = monthlyIncomes.reduce((sum, income) => sum + Number.parseFloat(income.amount), 0)
  const totalExpenses = monthlyExpenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
  const balance = totalIncome - totalExpenses

  // Update DOM
  document.getElementById("comparisonIncome").textContent = formatCurrency(totalIncome)
  document.getElementById("comparisonExpenses").textContent = formatCurrency(totalExpenses)
  document.getElementById("comparisonBalance").textContent = formatCurrency(balance)

  // Update balance color
  const balanceElement = document.getElementById("comparisonBalance")
  if (balance > 0) {
    balanceElement.style.color = "#22c55e"
  } else if (balance < 0) {
    balanceElement.style.color = "#ef4444"
  } else {
    balanceElement.style.color = "#333"
  }
}

// Show loading state
function showLoadingState() {
  const incomeList = document.getElementById("incomeList")
  incomeList.innerHTML = `
    <div class="loading-state">Loading income...</div>
  `
}

// Show empty state
function showEmptyState() {
  const incomeList = document.getElementById("incomeList")
  incomeList.innerHTML = `
    <div class="empty-state">
      <h4>No income found</h4>
      <p>Start by adding your first income above</p>
    </div>
  `
}

// Show message
function showMessage(message, type) {
  const messageElement = document.getElementById("message")
  messageElement.textContent = message
  messageElement.className = `message ${type}`
  messageElement.style.display = "block"

  setTimeout(() => {
    messageElement.style.display = "none"
  }, 3000)
}

// Format date
function formatDate(dateString) {
  const date = new Date(dateString)
  return `${date.toLocaleString("default", { month: "long" })} ${date.getDate()}, ${date.getFullYear()}`
}

// Format currency
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount)
}
