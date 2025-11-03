// popup.js
function showPopup(message, type = "info") {
  const popup = document.createElement("div");
  popup.className = `popup ${type}`;
  popup.innerHTML = `
    <div class="popup-content">
      <p>${message}</p>
    </div>
  `;

  document.body.appendChild(popup);

  setTimeout(() => {
    popup.classList.add("show");
  }, 100);

  setTimeout(() => {
    popup.classList.remove("show");
    setTimeout(() => popup.remove(), 300);
  }, 2500);
}

function confirmAction(message, callback) {
  const overlay = document.createElement("div");
  overlay.className = "popup-overlay";

  const box = document.createElement("div");
  box.className = "confirm-box";
  box.innerHTML = `
    <p>${message}</p>
    <div class="buttons">
      <button class="yes">Yes</button>
      <button class="no">No</button>
    </div>
  `;

  overlay.appendChild(box);
  document.body.appendChild(overlay);

  box.querySelector(".yes").onclick = () => {
    callback(true);
    overlay.remove();
  };
  box.querySelector(".no").onclick = () => {
    callback(false);
    overlay.remove();
  };
}
