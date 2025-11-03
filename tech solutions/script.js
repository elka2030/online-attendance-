// 🛒 Enhanced Cart System with Counter

let cart = JSON.parse(localStorage.getItem('cart')) || [];

// Update cart count immediately
updateCartCount();

document.addEventListener("DOMContentLoaded", () => {
  const addButtons = document.querySelectorAll(".add-cart");

  addButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const product = button.closest(".product");
      const name = product.querySelector("h3").innerText;
      const price = product.querySelector(".price").innerText;
      const image = product.querySelector("img").src;

      addToCart(name, price, image);
    });
  });
});

function addToCart(name, price, image) {
  const item = { name, price, image };
  cart.push(item);
  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartCount();
  alert(`${name} added to your cart!`);
}

function updateCartCount() {
  const countElement = document.getElementById("cart-count");
  if (countElement) {
    countElement.textContent = cart.length;
  }
}
