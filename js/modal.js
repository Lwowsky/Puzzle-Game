document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gameModal");
  const frame = document.getElementById("gameFrame");
  if (!modal || !frame) return;

  const grid = document.getElementById("rankGames"); // ✅ може бути null на index.html

  function openModal(rawUrl) {
    const u = new URL(rawUrl, location.href);
    u.searchParams.set("_", String(Date.now())); // cache-bust

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

  // ✅ Щоб index.html теж міг відкривати модалку (кнопка "Продовжити" може це викликати)
  window.openGameModal = openModal;
  window.closeGameModal = closeModal;

  // ✅ Клік по картках є тільки на rank-сторінках
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = e.target.closest(".game-card");
      if (!card || card.classList.contains("locked")) return;
      e.preventDefault();
      openModal(card.dataset.gameUrl);
    });
  }

  // ✅ Закриття по X / кнопках закриття
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

  // ✅ ОЦЕ — головне: слухаємо postMessage з iframe на ВСІХ сторінках, включно з index.html
  window.addEventListener("message", (e) => {
    // Безпечніше: приймаємо тільки повідомлення від поточного iframe
    if (e.source !== frame.contentWindow) return;

    // Якщо ти тестиш через file:// — origin може бути "null"
    if (e.origin !== location.origin && e.origin !== "null") return;

    const type = typeof e.data === "string" ? e.data : e.data?.type;

    if (type === "closeGameModal") {
      closeModal();
      window.renderPlayerInfo?.();

      // ✅ сигнал “прогрес змінився” (щоб index міг оновити розділ/главу без reload)
      window.dispatchEvent(new Event("progress:changed"));
      return;
    }

    if (type === "puzzleWin") {
      // НЕ робимо reload
      closeModal();
      window.renderPlayerInfo?.();
      window.dispatchEvent(new Event("progress:changed"));

      // якщо гра передає nextUrl і ти хочеш авто-перехід — відкривай:
      if (e.data?.nextUrl) openModal(e.data.nextUrl);

      return;
    }
  });
});

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
