document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("gameModal");
  const frame = document.getElementById("gameFrame");
  const grid = document.getElementById("rankGames");
  if (!modal || !frame || !grid) return;

  // (опційно) старт-екран у модалці (щоб гра не відкривалась одразу)
  const startScreen =
    modal.querySelector("[data-start-screen]") ||
    modal.querySelector("#gameStartScreen") ||
    modal.querySelector(".game-start-screen");

  const startBtn =
    modal.querySelector("[data-start-game]") ||
    modal.querySelector("#startGameBtn") ||
    modal.querySelector(".start-game-btn");

  let pendingUrl = null;

  function bustUrl(rawUrl) {
    const u = new URL(rawUrl, location.href);
    u.searchParams.set("_", String(Date.now()));
    return u.href;
  }

  function setFrameSrc(rawUrl) {
    const href = bustUrl(rawUrl);
    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = href;
    });
  }

  function showStart(rawUrl) {
    pendingUrl = rawUrl;

    // стопаємо попередню гру
    frame.src = "about:blank";

    // показуємо старт-екран (якщо він реально є)
    if (startScreen && startBtn) {
      startScreen.hidden = false;
      frame.hidden = true;
    } else {
      // якщо старт-екрану нема — просто одразу відкриваємо гру
      frame.hidden = false;
      setFrameSrc(rawUrl);
    }
  }

  function hideStart() {
    pendingUrl = null;
    if (startScreen) startScreen.hidden = true;
    frame.hidden = false;
  }

  function openModal(rawUrl) {
    showStart(rawUrl);
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    frame.src = "about:blank";
    pendingUrl = null;
    if (startScreen) startScreen.hidden = true;
    frame.hidden = false;
    document.body.style.overflow = "";
  }

  function refreshUI(reason, data) {
    // оновлюємо панель гравця без перезавантаження
    window.renderPlayerInfo?.();
    window.notifyPlayerUpdate?.(reason || "refreshUI", { data });
  }

  // Кнопка START (якщо є)
  if (startBtn) {
    startBtn.addEventListener("click", () => {
      if (!pendingUrl) return;
      const url = pendingUrl;
      hideStart();
      setFrameSrc(url);
    });
  }

  // Відкриття гри по кліку на картку
  grid.addEventListener("click", (e) => {
    const card = e.target.closest(".game-card");
    if (!card || card.classList.contains("locked")) return;
    e.preventDefault();
    openModal(card.dataset.gameUrl);
  });

  // Закриття модалки (підтримує різні кнопки, щоб нічого не ламати)
  modal.addEventListener("click", (e) => {
    const shouldClose =
      e.target.matches("[data-close]") ||
      e.target.matches("[data-close-modal]") ||
      e.target.closest("[data-close]") ||
      e.target.closest("[data-close-modal]") ||
      e.target.closest(".modal-close");

    if (!shouldClose) return;

    closeModal();
    refreshUI("modalClosed");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.classList.contains("is-open")) {
      closeModal();
      refreshUI("modalClosedEscape");
    }
  });

  // Повідомлення від гри (iframe)
  window.addEventListener("message", (e) => {
    if (e.origin !== location.origin) return;
    const msg = e.data || {};

    // 1) просто кажуть “прогрес змінився” — онови UI
    if (msg.type === "progressUpdated") {
      refreshUI("progressUpdated", msg);
      return;
    }

    // 2) виграш пазлу
    if (msg.type === "puzzleWin") {
      // якщо передали nextUrl — не стартуємо одразу, а покажемо Start
      if (msg.nextUrl) {
        // тримаємо модалку відкритою і готуємо наступну главу
        openModal(msg.nextUrl);
      } else {
        closeModal();
      }

      refreshUI("puzzleWin", msg);

      // НЕ робимо reload!
      if (msg.hardReload) location.reload(); // тільки якщо прям дуже треба
      return;
    }

    // 3) запит закрити модалку (наприклад кнопкою “вийти”)
    if (msg.type === "closeGameModal") {
      if (msg.nextUrl) {
        openModal(msg.nextUrl); // знов покаже Start
        refreshUI("nextChapterPrepared", msg);
      } else {
        closeModal();
        refreshUI("closeGameModal", msg);
      }

      if (msg.hardReload) location.reload();
      return;
    }
  });
});
