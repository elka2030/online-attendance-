// Global variables
let currentUser = null
let expenseChart = null
let monthlyChart = null

// API base URL
const API_BASE = "http://localhost:3000/api"

// Initialize dashboard
document.addEventListener("DOMContentLoaded", async () => {
  // Check authentication
  if (!checkAuth()) {
    return
  }

  // Set up event listeners
  setupEventListeners()

  // Load dashboard data
  await loadDashboardData()
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
}

// Load all dashboard data
async function loadDashboardData() {
  try {
    // Show loading states
    showLoadingStates()

    // Load data concurrently
    const [expensesResult, incomesResult, budgetsResult] = await Promise.all([
      fetchExpenses(),
      fetchIncomes(),
      fetchBudgets(),
    ])

    if (expensesResult.success && incomesResult.success && budgetsResult.success) {
      const expenses = expensesResult.expenses
      const incomes = incomesResult.incomes
      const budgets = budgetsResult.budgets

      // Update summary cards
      updateSummaryCards(expenses, incomes, budgets)

      // Update charts
      updateCharts(expenses, incomes)

      // Update recent transactions
      updateRecentTransactions(expenses, incomes)
    } else {
      showError("Failed to load dashboard data")
    }
  } catch (error) {
    console.error("Error loading dashboard data:", error)
    showError("Network error. Please refresh the page.")
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

// Update summary cards
function updateSummaryCards(expenses, incomes, budgets) {
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()

  // Filter current month data
  const currentMonthExpenses = expenses.filter((expense) => {
    const expenseDate = new Date(expense.date)
    return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear
  })

  const currentMonthIncomes = incomes.filter((income) => {
    const incomeDate = new Date(income.date)
    return incomeDate.getMonth() === currentMonth && incomeDate.getFullYear() === currentYear
  })

  // Calculate totals
  const totalIncome = currentMonthIncomes.reduce((sum, income) => sum + Number.parseFloat(income.amount), 0)
  const totalExpenses = currentMonthExpenses.reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
  const balance = totalIncome - totalExpenses

  // Update DOM
  document.getElementById("totalIncome").textContent = formatCurrency(totalIncome)
  document.getElementById("totalExpenses").textContent = formatCurrency(totalExpenses)
  document.getElementById("balance").textContent = formatCurrency(balance)

  // Update balance card color based on value
  const balanceCard = document.querySelector(".balance-card .amount")
  balanceCard.style.color = balance >= 0 ? "#22c55e" : "#ef4444"

  // Calculate budget status
  const budgetStatus = calculateBudgetStatus(currentMonthExpenses, budgets)
  document.getElementById("budgetStatus").textContent = budgetStatus.status

  const budgetStatusElement = document.getElementById("budgetStatus")
  budgetStatusElement.style.color = budgetStatus.color
}

// Calculate budget status
function calculateBudgetStatus(expenses, budgets) {
  if (budgets.length === 0) {
    return { status: "No Budget", color: "#666" }
  }

  const monthlyBudgets = budgets.filter((budget) => budget.period === "monthly")
  if (monthlyBudgets.length === 0) {
    return { status: "No Budget", color: "#666" }
  }

  let totalBudget = 0
  let totalSpent = 0

  monthlyBudgets.forEach((budget) => {
    totalBudget += Number.parseFloat(budget.amount)
    const categoryExpenses = expenses
      .filter((expense) => expense.category.toLowerCase() === budget.category.toLowerCase())
      .reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
    totalSpent += categoryExpenses
  })

  const percentage = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0

  if (percentage <= 70) {
    return { status: "Good", color: "#22c55e" }
  } else if (percentage <= 90) {
    return { status: "Warning", color: "#f59e0b" }
  } else {
    return { status: "Over Budget", color: "#ef4444" }
  }
}

// Update charts
function updateCharts(expenses, incomes) {
  updateExpenseChart(expenses)
  updateMonthlyChart(expenses, incomes)
}

// Update expense pie chart
function updateExpenseChart(expenses) {
  const ctx = document.getElementById("expenseChart").getContext("2d")

  // Group expenses by category
  const categoryTotals = {}
  expenses.forEach((expense) => {
    const category = expense.category
    categoryTotals[category] = (categoryTotals[category] || 0) + Number.parseFloat(expense.amount)
  })

  const categories = Object.keys(categoryTotals)
  const amounts = Object.values(categoryTotals)

  // Destroy existing chart if it exists
  if (expenseChart) {
    expenseChart.destroy()
  }

  if (categories.length === 0) {
    // Show empty state
    ctx.font = "16px Arial"
    ctx.fillStyle = "#666"
    ctx.textAlign = "center"
    ctx.fillText("No expenses to display", ctx.canvas.width / 2, ctx.canvas.height / 2)
    return
  }

  expenseChart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: categories,
      datasets: [
        {
          data: amounts,
          backgroundColor: [
            "#667eea",
            "#764ba2",
            "#f093fb",
            "#f5576c",
            "#4facfe",
            "#00f2fe",
            "#43e97b",
            "#38f9d7",
            "#ffecd2",
            "#fcb69f",
          ],
          borderWidth: 2,
          borderColor: "#fff",
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
          },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const label = context.label || ""
              const value = formatCurrency(context.parsed)
              const total = context.dataset.data.reduce((a, b) => a + b, 0)
              const percentage = ((context.parsed / total) * 100).toFixed(1)
              return `${label}: ${value} (${percentage}%)`
            },
          },
        },
      },
    },
  })
}

// Update monthly bar chart
function updateMonthlyChart(expenses, incomes) {
  const ctx = document.getElementById("monthlyChart").getContext("2d")

  // Get last 6 months data
  const months = []
  const monthlyExpenses = []
  const monthlyIncomes = []

  for (let i = 5; i >= 0; i--) {
    const date = new Date()
    date.setMonth(date.getMonth() - i)
    const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    const monthName = date.toLocaleDateString("en-US", { month: "short", year: "2-digit" })

    months.push(monthName)

    // Calculate expenses for this month
    const monthExpenses = expenses
      .filter((expense) => expense.date.startsWith(monthYear))
      .reduce((sum, expense) => sum + Number.parseFloat(expense.amount), 0)
    monthlyExpenses.push(monthExpenses)

    // Calculate incomes for this month
    const monthIncomes = incomes
      .filter((income) => income.date.startsWith(monthYear))
      .reduce((sum, income) => sum + Number.parseFloat(income.amount), 0)
    monthlyIncomes.push(monthIncomes)
  }

  // Destroy existing chart if it exists
  if (monthlyChart) {
    monthlyChart.destroy()
  }

  monthlyChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels: months,
      datasets: [
        {
          label: "Income",
          data: monthlyIncomes,
          backgroundColor: "rgba(34, 197, 94, 0.8)",
          borderColor: "rgba(34, 197, 94, 1)",
          borderWidth: 1,
        },
        {
          label: "Expenses",
          data: monthlyExpenses,
          backgroundColor: "rgba(239, 68, 68, 0.8)",
          borderColor: "rgba(239, 68, 68, 1)",
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "top",
        },
        tooltip: {
          callbacks: {
            label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: (value) => formatCurrency(value),
          },
        },
      },
    },
  })
}

// Update recent transactions
function updateRecentTransactions(expenses, incomes) {
  const transactionsContainer = document.getElementById("recentTransactions")

  // Combine and sort transactions
  const allTransactions = [
    ...expenses.map((expense) => ({
      ...expense,
      type: "expense",
      title: expense.category,
      description: expense.note || "No description",
    })),
    ...incomes.map((income) => ({
      ...income,
      type: "income",
      title: income.source,
      description: "Income",
    })),
  ]

  // Sort by date (newest first) and take first 5
  allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
  const recentTransactions = allTransactions.slice(0, 5)

  if (recentTransactions.length === 0) {
    transactionsContainer.innerHTML = `
            <div class="empty-state">
                <h4>No transactions yet</h4>
                <p>Start by adding your first expense or income</p>
            </div>
        `
    return
  }

  const transactionsHTML = recentTransactions
    .map(
      (transaction) => `
        <div class="transaction-item">
            <div class="transaction-info">
                <div class="transaction-icon ${transaction.type}">
                    ${transaction.type === "expense" ? "💸" : "💰"}
                </div>
                <div class="transaction-details">
                    <h4>${transaction.title}</h4>
                    <p>${transaction.description} • ${formatDate(transaction.date)}</p>
                </div>
            </div>
            <div class="transaction-amount ${transaction.type}">
                ${transaction.type === "expense" ? "-" : "+"}${formatCurrency(transaction.amount)}
            </div>
        </div>
    `,
    )
    .join("")

  transactionsContainer.innerHTML = transactionsHTML
}

// Utility functions
function formatCurrency(amount) {
  return new Intl.NumberFormat("en-KE", {
    style: "currency",
    currency: "KES",
  }).format(amount)
}

function formatDate(dateString) {
  const date = new Date(dateString)
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })
}

function showLoadingStates() {
  document.getElementById("totalIncome").textContent = "Loading..."
  document.getElementById("totalExpenses").textContent = "Loading..."
  document.getElementById("balance").textContent = "Loading..."
  document.getElementById("budgetStatus").textContent = "Loading..."
}

function showError(message) {
  console.error(message)
  // You could implement a toast notification system here
  alert(message)
}

// Refresh dashboard data
function refreshDashboard() {
  loadDashboardData()
}

// Export for use in other scripts
window.dashboardUtils = {
  refreshDashboard,
  formatCurrency,
  formatDate,
}
