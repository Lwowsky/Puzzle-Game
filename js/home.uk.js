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

  function openGameInModal(id, { autoStart = false } = {}) {
    const modal = document.getElementById("gameModal");
    const frame = document.getElementById("gameFrame");

    // якщо модалки нема — fallback на перехід сторінкою
    if (!modal || !frame) {
      const url = `./game.html?id=${id}${autoStart ? "&autostart=1" : ""}`;
      location.href = url;
      return;
    }

    const u = new URL("./game.html", location.href);
    u.searchParams.set("id", String(id));
    if (autoStart) u.searchParams.set("autostart", "1");

    // cache-bust щоб iframe завжди оновлювався
    u.searchParams.set("_", String(Date.now()));

    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = u.href;
    });

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startMissionBtn");
    const contBtn = document.getElementById("continueMissionBtn");
    const hint = document.getElementById("missionHint");

    if (!startBtn || !contBtn || !hint) return;

    const lastGameId = safeNum(localStorage.getItem("lastGameId"));
    const nextId = getNextUncompletedId();

    // Почати місію — БЕЗ автозапуску, щоб була кнопка "Почати" у грі
    startBtn.textContent = `Почати місію (Глава ${nextId})`;
    startBtn.addEventListener("click", () => openGameInModal(nextId, { autoStart: false }));

    // Продовжити — можна з автозапуском (якщо хочеш швидко)
    if (lastGameId) {
      contBtn.disabled = false;
      contBtn.textContent = `Продовжити (Глава ${lastGameId})`;
      contBtn.addEventListener("click", () => openGameInModal(lastGameId, { autoStart: true }));
      hint.textContent = `Сувій пам’ятає твою останню місію: Глава ${lastGameId}.`;
    } else {
      contBtn.disabled = true;
      contBtn.textContent = "Продовжити (немає місії)";
      hint.textContent =
        "Ще не було місій у цьому браузері. Натисни «Почати місію», щоб зробити перший крок.";
    }
  });
})();
