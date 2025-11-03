// ========================= GLOBAL DATA =========================
let users = JSON.parse(localStorage.getItem("users")) || [];
let books = JSON.parse(localStorage.getItem("books")) || [
  { id: 1, title: "Intro to Programming", author: "John Doe", available: true, borrower: null },
  { id: 2, title: "Data Science 101", author: "Jane Smith", available: true, borrower: null }
];
localStorage.setItem("books", JSON.stringify(books));

// ========================= REGISTER =========================
const registerForm = document.getElementById("registerForm");
if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const name = document.getElementById("name").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    const role = document.getElementById("role").value;

    if (users.find(u => u.email === email)) {
      alert("Email already registered!");
      return;
    }

    users.push({ name, email, password, role });
    localStorage.setItem("users", JSON.stringify(users));
    alert("Registration successful! Please login.");
    window.location.href = "index.html";
  });
}

// ========================= LOGIN =========================
const loginForm = document.getElementById("loginForm");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
      localStorage.setItem("currentUser", JSON.stringify(user));
      alert("Login successful!");

      if (user.role === "Admin") {
        window.location.href = "admin.html";
      } else {
        window.location.href = "student.html";
      }
    } else {
      alert("Invalid credentials!");
    }
  });
}

// ========================= LOGOUT =========================
function logout() {
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}
