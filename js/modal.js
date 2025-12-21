document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gameModal");
  const frame = document.getElementById("gameFrame");
  const grid = document.getElementById("rankGames");
  if (!modal || !frame || !grid) return;

  function openModal(rawUrl) {
    const u = new URL(rawUrl, location.href);
    u.searchParams.set("_", String(Date.now()));
    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = u.href;
    });
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
    openModal(card.dataset.gameUrl);
  });

  modal.addEventListener("click", (e) => {
    if (e.target.matches("[data-close]")) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;

    if (e.data?.type === "closeGameModal") {
      closeModal();
      if (e.data?.reload) location.reload();
      return;
    }

    if (e.data?.type === "puzzleWin") {
      closeModal();
      location.reload();
    }
  });
});
// === Game modal close support ===
document.addEventListener("click", (e) => {
  const modal = e.target.closest("#gameModal");
  if (!modal) return;

  if (
    e.target.matches("[data-close-modal]") ||
    e.target.closest("[data-close-modal]") ||
    e.target.closest(".modal-close")
  ) {
    const frame = modal.querySelector("#gameFrame");
    if (frame) frame.src = "about:blank";
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
});
