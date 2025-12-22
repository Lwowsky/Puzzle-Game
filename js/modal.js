document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gameModal");
  const frame = document.getElementById("gameFrame");
  if (!modal || !frame) return;

  const grid = document.getElementById("rankGames");

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
    window.renderPlayerInfo?.();
    window.dispatchEvent(new Event("progress:changed"));
  }
  window.openGameModal = openModal;
  window.closeGameModal = closeModal;
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".game-card");
      if (!card || card.classList.contains("locked")) return;
      e.preventDefault();
      openModal(card.dataset.gameUrl);
    });
  }
  modal.addEventListener("click", (e) => {
    if (
      e.target.matches("[data-close]") ||
      e.target.matches("[data-close-modal]") ||
      e.target.closest("[data-close]") ||
      e.target.closest("[data-close-modal]") ||
      e.target.closest(".modal-close")
    ) {
      closeModal();
    }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
  window.addEventListener("message", (e) => {
    if (e.source !== frame.contentWindow) return;
    if (e.origin !== location.origin && e.origin !== "null") return;
    const type = typeof e.data === "string" ? e.data : e.data?.type;
    if (type === "closeGameModal") {
      closeModal();
      window.renderPlayerInfo?.();
      window.dispatchEvent(new Event("progress:changed"));
      return;
    }
    if (type === "puzzleWin") {
      closeModal();
      window.renderPlayerInfo?.();
      window.dispatchEvent(new Event("progress:changed"));
      if (e.data?.nextUrl) openModal(e.data.nextUrl);
      return;
    }
  });
});
