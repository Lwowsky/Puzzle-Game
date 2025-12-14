(() => {
  const RANK_STORAGE_KEY = "completedRanks";
  const RANK_PER_SECTION = 4;

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function getRankIdFromUrl() {
    const m = location.pathname.match(/rank(\d{3})\.html/i);
    return m ? Number(m[1]) : 1;
  }

  function loadDone() {
    try {
      return new Set(
        JSON.parse(localStorage.getItem(RANK_STORAGE_KEY) || "[]").map(Number)
      );
    } catch {
      return new Set();
    }
  }

  function isUnlocked(done, id) {
    if (id === 1) return true;          // тільки 1 відкрита спочатку
    return done.has(id - 1);            // далі строго по черзі 1→2→3...
  }

  document.addEventListener("DOMContentLoaded", () => {
    const grid = document.getElementById("rankGames");
    if (!grid) return;

    const rankFromData = Number(document.body.dataset.rank || "0");
    const rankId = rankFromData || getRankIdFromUrl();

    const done = loadDone();
    const start = (rankId - 1) * RANK_PER_SECTION + 1;
    const end = start + RANK_PER_SECTION - 1;

    let html = "";

    for (let id = start; id <= end; id++) {
      const isDone = done.has(id);
      const unlocked = isUnlocked(done, id);

      let state = "locked", status = "Заблоковано", icon = "🔒";
      if (isDone) { state = "done"; status = "Пройдено"; icon = "✅"; }
      else if (unlocked) { state = "available"; status = "Доступно"; icon = "▶️"; }

      // ✅ АБСОЛЮТНИЙ url до chapters/game.html з id
      const u = new URL("./game.html", location.href);
      u.searchParams.set("id", String(id));
      u.searchParams.set("_", String(Date.now())); // анти-кеш
      const href = u.href;

      const thumb = `../img/puzzles/tom${pad3(id)}.png`;

      html += `
        <a class="game-card ${state}"
           href="${href}"
           data-id="${id}"
           data-game-url="${href}"
           style="--thumb: url('${thumb}')">
          <div class="left">
            <div class="name">Гра ${id}</div>
            <div class="status">${status}</div>
          </div>
          <div class="icon">${icon}</div>
        </a>
      `;
    }

    grid.innerHTML = html;
  });
})();
