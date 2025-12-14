function getPlayerName() {
  const name = (localStorage.getItem("playerName") || "").trim();
  return name.length ? name : null;
}

function applyPlayerName() {
  const name = getPlayerName() || "Гравцю";
  document.querySelectorAll("[data-player-name]").forEach(el => (el.textContent = name));

   const avatarTitle = document.querySelector(".avatar-title");
  if (avatarTitle && getPlayerName()) avatarTitle.textContent = name;
}

document.addEventListener("DOMContentLoaded", applyPlayerName);

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("nameForm");
  const input = document.getElementById("nameInput");
  if (!form || !input) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = input.value.trim();
    if (!name) return;
    localStorage.setItem("playerName", name);
    applyPlayerName();
    input.value = "";
  });
});

