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
    // Шукаємо першу непройдену главу починаючи з 1
    let id = 1;
    // hard limit щоб випадково не зациклитись
    for (let i = 0; i < 999; i++) {
      if (!done.has(id)) return id;
      id++;
    }
    return 1;
  }

  function toGame(id) {
    // важливо: autostart=1
    location.href = `./game.html?id=${id}&autostart=1`;
  }

  document.addEventListener("DOMContentLoaded", () => {
    const startBtn = document.getElementById("startMissionBtn");
    const contBtn = document.getElementById("continueMissionBtn");
    const hint = document.getElementById("missionHint");

    if (!startBtn || !contBtn || !hint) return;

    const lastGameId = safeNum(localStorage.getItem("lastGameId"));
    const nextId = getNextUncompletedId();

    // Start button
    startBtn.textContent = `Почати місію (Глава ${nextId})`;
    startBtn.addEventListener("click", () => toGame(nextId));

    // Continue button
    if (lastGameId) {
      contBtn.disabled = false;
      contBtn.textContent = `Продовжити (Глава ${lastGameId})`;
      contBtn.addEventListener("click", () => toGame(lastGameId));
      hint.textContent = `Сувій пам’ятає твою останню місію: Глава ${lastGameId}.`;
    } else {
      contBtn.disabled = true;
      contBtn.textContent = "Продовжити (немає місії)";
      hint.textContent =
        "Ще не було місій у цьому браузері. Натисни «Почати місію», щоб зробити перший крок.";
    }
  });
})();
