document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gameModal");
  const frame = document.getElementById("gameFrame");
  const grid = document.getElementById("rankGames");
  if (!modal || !frame || !grid) return;

  function openModal(url) {
    // форс перезавантаження iframe
    frame.src = "about:blank";
    setTimeout(() => {
      frame.src = url;
    }, 20);

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    frame.src = "about:blank";
    document.body.style.overflow = "";
  }

  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".game-card");
    if (!card || card.classList.contains("locked")) return;

    e.preventDefault();

    const url = card.dataset.gameUrl; // ✅ тільки звідси
    if (!url) return;

    openModal(url);
  });

  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  window.addEventListener("message", (e) => {
    if (e.data?.type === "puzzleWin") {
      closeModal();
      location.reload();
    }
  });
});
