document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gameModal");
  const frame = document.getElementById("gameFrame");
  const grid = document.getElementById("rankGames");
  if (!modal || !frame || !grid) return;

  // ✅ (опційно) якщо в модалці є старт-екран/кнопка:
  // Додай у HTML будь-що з атрибутами:
  //   <div data-start-screen> ... <button data-start-game>Почати</button> ... </div>
  const startScreen = modal.querySelector("[data-start-screen]");
  const startBtn = modal.querySelector("[data-start-game]");

  let pendingUrl = null;

  function refreshUIAfterGame() {
    // ✅ оновлюємо дані гравця без перезавантаження
    window.renderPlayerInfo?.();
    // якщо є ще якісь рендери гріду/глав — підчепляться через player:update
    window.dispatchEvent(new CustomEvent("player:update"));
  }

  function loadIntoFrame(rawUrl) {
    const u = new URL(rawUrl, location.href);
    u.searchParams.set("_", String(Date.now())); // cache-bust

    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = u.href;
    });
  }

  function showStart(url) {
    pendingUrl = url;
    if (startScreen) startScreen.hidden = false;
    frame.hidden = true;
    frame.src = "about:blank";
  }

  function startGameNow() {
    if (!pendingUrl) return;
    if (startScreen) startScreen.hidden = true;
    frame.hidden = false;
    loadIntoFrame(pendingUrl);
    pendingUrl = null;
  }

  function openModal(rawUrl) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";

    // якщо є старт-екран — показуємо його
    if (startScreen && startBtn) {
      showStart(rawUrl);
    } else {
      frame.hidden = false;
      loadIntoFrame(rawUrl);
    }
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    frame.src = "about:blank";
    frame.hidden = false;
    if (startScreen) startScreen.hidden = true;
    pendingUrl = null;
    document.body.style.overflow = "";
  }

  // старт кнопка (якщо існує)
  startBtn?.addEventListener("click", startGameNow);

  // клік по карточках
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".game-card");
    if (!card || card.classList.contains("locked")) return;
    e.preventDefault();
    openModal(card.dataset.gameUrl);
  });

  // закриття модалки (підтримка різних кнопок)
  modal.addEventListener("click", (e) => {
    if (
      e.target.matches("[data-close]") ||
      e.target.closest("[data-close]") ||
      e.target.matches("[data-close-modal]") ||
      e.target.closest("[data-close-modal]") ||
      e.target.closest(".modal-close")
    ) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });

  // ✅ повідомлення від гри (iframe)
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;

    // 1) просто закрити модалку (без reload)
    if (e.data?.type === "closeGameModal") {
      // якщо гра каже "reload" — ми тепер робимо м’який refresh UI
      refreshUIAfterGame();

      // якщо прислали nextUrl — відкриємо наступну главу через старт-екран
      if (e.data?.nextUrl) {
        openModal(e.data.nextUrl);
        return;
      }

      closeModal();
      return;
    }

    // 2) перемога/пройдена глава
    if (e.data?.type === "puzzleWin") {
      refreshUIAfterGame();

      // якщо є наступна глава — не стартуємо автоматом, а відкриваємо через start-screen (якщо він є)
      if (e.data?.nextUrl) {
        openModal(e.data.nextUrl);
        return;
      }

      closeModal();
      return;
    }

    // 3) якщо захочеш явно керувати відкриттям наступної гри:
    // parent.postMessage({type:"openNextGame", url:"..."}, location.origin)
    if (e.data?.type === "openNextGame" && e.data?.url) {
      refreshUIAfterGame();
      openModal(e.data.url);
      return;
    }

    // 4) якщо гра просто каже “я оновила дані”
    if (e.data?.type === "playerUpdated") {
      refreshUIAfterGame();
      return;
    }
  });
});
