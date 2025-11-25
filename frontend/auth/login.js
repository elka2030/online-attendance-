// DOM elements
const loginForm = document.getElementById("loginForm")
const registerForm = document.getElementById("registerForm")
const showRegisterLink = document.getElementById("showRegister")
const showLoginLink = document.getElementById("showLogin")
const messageDiv = document.getElementById("message")

// API base URL
const API_BASE = "http://localhost:3000/api"

// Form switching functionality
showRegisterLink.addEventListener("click", (e) => {
  e.preventDefault()
  switchToRegister()
})

showLoginLink.addEventListener("click", (e) => {
  e.preventDefault()
  switchToLogin()
})

function switchToRegister() {
  loginForm.classList.remove("active")
  registerForm.classList.add("active")
  clearMessage()
}

function switchToLogin() {
  registerForm.classList.remove("active")
  loginForm.classList.add("active")
  clearMessage()
}

// Message handling
function showMessage(message, type = "error") {
  messageDiv.textContent = message
  messageDiv.className = `message ${type}`
  messageDiv.style.display = "block"

  // Auto-hide success messages after 3 seconds
  if (type === "success") {
    setTimeout(() => {
      clearMessage()
    }, 3000)
  }
}

function clearMessage() {
  messageDiv.style.display = "none"
  messageDiv.className = "message"
}

// Form submission handlers
loginForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  await handleLogin(e)
})

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault()
  await handleRegister(e)
})

// Login functionality
async function handleLogin(e) {
  const formData = new FormData(e.target)
  const username = formData.get("username").trim()
  const password = formData.get("password")

  // Basic validation
  if (!username || !password) {
    showMessage("Please fill in all fields")
    return
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  try {
    // Show loading state
    submitBtn.disabled = true
    submitBtn.textContent = "Logging in..."
    submitBtn.classList.add("loading")

    const response = await fetch(`${API_BASE}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (data.success) {
      // Store user data in localStorage
      localStorage.setItem("currentUser", JSON.stringify(data.user))

      showMessage("Login successful! Redirecting...", "success")

      // Redirect to dashboard after short delay
      setTimeout(() => {
        window.location.href = "/frontend/user/pages/dashboard.html"
      }, 1500)
    } else {
      showMessage(data.error || "Login failed")
    }
  } catch (error) {
    console.error("Login error:", error)
    showMessage("Network error. Please try again.")
  } finally {
    // Reset button state
    submitBtn.disabled = false
    submitBtn.textContent = originalText
    submitBtn.classList.remove("loading")
  }
}

// Register functionality
async function handleRegister(e) {
  const formData = new FormData(e.target)
  const username = formData.get("username").trim()
  const password = formData.get("password")
  const confirmPassword = formData.get("confirmPassword")

  // Validation
  if (!username || !password || !confirmPassword) {
    showMessage("Please fill in all fields")
    return
  }

  if (username.length < 3) {
    showMessage("Username must be at least 3 characters long")
    return
  }

  if (password.length < 4) {
    showMessage("Password must be at least 4 characters long")
    return
  }

  if (password !== confirmPassword) {
    showMessage("Passwords do not match")
    return
  }

  const submitBtn = e.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.textContent

  try {
    // Show loading state
    submitBtn.disabled = true
    submitBtn.textContent = "Creating Account..."
    submitBtn.classList.add("loading")

    const response = await fetch(`${API_BASE}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, password }),
    })

    const data = await response.json()

    if (data.success) {
      showMessage("Account created successfully! Please login.", "success")

      // Clear form and switch to login
      e.target.reset()
      setTimeout(() => {
        switchToLogin()
      }, 2000)
    } else {
      showMessage(data.error || "Registration failed")
    }
  } catch (error) {
    console.error("Registration error:", error)
    showMessage("Network error. Please try again.")
  } finally {
    // Reset button state
    submitBtn.disabled = false
    submitBtn.textContent = originalText
    submitBtn.classList.remove("loading")
  }
}

// Check if user is already logged in
function checkAuthStatus() {
  const currentUser = localStorage.getItem("currentUser")
  if (currentUser) {
    // User is already logged in, redirect to dashboard
    window.location.href = "/frontend/user/pages/dashboard.html"
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  checkAuthStatus()

  // Focus on first input
  document.getElementById("loginUsername").focus()
})

// Utility function to handle API errors
function handleApiError(error) {
  console.error("API Error:", error)
  if (error.message.includes("Failed to fetch")) {
    showMessage("Unable to connect to server. Please check your connection.")
  } else {
    showMessage("An unexpected error occurred. Please try again.")
  }
}
