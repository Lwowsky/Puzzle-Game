(() => {
  const RANK_STORAGE_KEY = "completedRanks";
  const RANK_PER_SECTION = 4;

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function getRankIdFromUrl() {
    // без "$" — працює навіть якщо є query або інші штуки
    const m = location.pathname.match(/rank(\d{3})\.html/i);
    return m ? Number(m[1]) : null;
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
    const section = Math.ceil(id / RANK_PER_SECTION);
    const start = (section - 1) * RANK_PER_SECTION + 1;
    if (id === 1) return true;
    return done.has(id - 1);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const rankId = getRankIdFromUrl();
    const grid = document.getElementById("rankGames");

    if (!grid) return;
    const rankFromData = Number(document.body.dataset.rank || "0");
    const safeRankId = rankFromData || rankId || 1;

    const done = loadDone();
    const start = (safeRankId - 1) * RANK_PER_SECTION + 1;
    const end = start + RANK_PER_SECTION - 1;

    let html = "";
    for (let id = start; id <= end; id++) {
      const isDone = done.has(id);
      const unlocked = isUnlocked(done, id);

      let state = "locked",
        status = "Заблоковано",
        icon = "🔒";
      if (isDone) {
        state = "done";
        status = "Пройдено";
        icon = "✅";
      } else if (unlocked) {
        state = "available";
        status = "Доступно";
        icon = "▶️";
      }

const u = new URL("game.html", location.href);
u.searchParams.set("id", String(id));
u.searchParams.set("_", String(Date.now())); // щоб iframe точно оновився

const href = u.toString();
const thumb = `../img/puzzles/tom${pad3(id)}.png`;

html += `
  <a class="game-card ${state}"
     href="${href}"
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

   const finishBtn = document.getElementById("finishRank");
if (finishBtn) {
  finishBtn.addEventListener("click", () => {
    window.location.href = "../index.html";
  });
}
  });
  
})();
