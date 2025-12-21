(() => {
  function safeNum(v) {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  }

  function getCompletedSet() {
    try {
      return new Set(
        JSON.parse(localStorage.getItem("completedRanks") || "[]").map(Number)
      );
    } catch {
      return new Set();
    }
  }

  function getNextUncompletedId() {
    const done = getCompletedSet();
    let id = 1;
    for (let i = 0; i < 999; i++) {
      if (!done.has(id)) return id;
      id++;
    }
    return 1;
  }

  function openGameModal(gameId) {
    const modal = document.getElementById("gameModal");
    const frame = document.getElementById("gameFrame");

    const url = `game.html?id=${gameId}&autostart=1`;

    // fallback: якщо модалки нема (раптом), просто переходимо на сторінку
    if (!modal || !frame) {
      location.href = url;
      return;
    }

    // cache-bust як у modal.js
    const u = new URL(url, location.href);
    u.searchParams.set("_", String(Date.now()));

    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = u.href;
    });

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function closeGameModal(reload = false) {
    const modal = document.getElementById("gameModal");
    const frame = document.getElementById("gameFrame");
    if (!modal || !frame) return;

    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    frame.src = "about:blank";
    document.body.style.overflow = "";

    if (reload) location.reload();
  }

  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startMissionBtn");
    const contBtn = document.getElementById("continueMissionBtn");
    const hint = document.getElementById("missionHint");

    if (!startBtn || !contBtn || !hint) return;

    const lastGameId = safeNum(localStorage.getItem("lastGameId"));
    const nextId = getNextUncompletedId();

    // Start
    startBtn.textContent = `Почати місію (Глава ${nextId})`;
    startBtn.addEventListener("click", () => openGameModal(nextId));

    // Continue
    if (lastGameId) {
      contBtn.disabled = false;
      contBtn.textContent = `Продовжити (Глава ${lastGameId})`;
      contBtn.addEventListener("click", () => openGameModal(lastGameId));
      hint.textContent = `Сувій пам’ятає твою останню місію: Глава ${lastGameId}.`;
    } else {
      contBtn.disabled = true;
      contBtn.textContent = "Продовжити (немає місії)";
      hint.textContent =
        "Ще не було місій у цьому браузері. Натисни «Почати місію», щоб зробити перший крок.";
    }

    // Закриття модалки по кліку на overlay/кнопку
    const modal = document.getElementById("gameModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target && e.target.matches("[data-close]")) closeGameModal(false);
      });
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
          closeGameModal(false);
        }
      });
    }

    // Повідомлення з game.html (iframe)
    window.addEventListener("message", (e) => {
      if (e.data?.type === "puzzleWin") {
        closeGameModal(true);
      }
      // якщо ти вже використовуєш requestCloseModal({type:"closeGameModal"})
      if (e.data?.type === "closeGameModal") {
        closeGameModal(!!e.data.reload);
      }
    });
  });
})();
