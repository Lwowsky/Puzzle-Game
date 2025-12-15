(() => {
  const NAME_KEY = "playerName";
  const STATE_KEY = "playerState"; // { level: number, xp: number }

  const RANKS_UK = ["Учень", "Шинобі", "Генін", "Чунін", "Джонін", "Хокаге"];
  const RANKS_EN = ["Apprentice", "Shinobi", "Genin", "Chunin", "Jonin", "Hokage"];

  function isEN() {
    return document.documentElement.lang?.toLowerCase().startsWith("en") ||
           location.pathname.includes("/en/");
  }

  function pad3(n){ return String(n).padStart(3,"0"); }

  function xpNeeded(level) {
    // lvl1 -> 100, lvl2 -> 200, lvl3 -> 400 ...
    return 100 * Math.pow(2, Math.max(0, level - 1));
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return { level: 1, xp: 0 };
      const obj = JSON.parse(raw);
      return {
        level: Number(obj.level) > 0 ? Number(obj.level) : 1,
        xp: Number(obj.xp) >= 0 ? Number(obj.xp) : 0,
      };
    } catch {
      return { level: 1, xp: 0 };
    }
  }

  function saveState(st) {
    localStorage.setItem(STATE_KEY, JSON.stringify(st));
  }

  function clampRankLevel(level){
    return Math.min(Math.max(1, level), 6); // 1..6
  }

  function getRankName(level) {
    const ranks = isEN() ? RANKS_EN : RANKS_UK;
    return ranks[clampRankLevel(level) - 1];
  }

  function getPlayerName() {
    const name = (localStorage.getItem(NAME_KEY) || "").trim();
    return name.length ? name : null;
  }

  function applyPlayerName() {
    const fallback = isEN() ? "Player" : "Гравцю";
    const name = getPlayerName() || fallback;

    document.querySelectorAll("[data-player-name]").forEach((el) => {
      el.textContent = name;
    });

    const avatarTitle = document.querySelector(".avatar-title");
    if (avatarTitle) avatarTitle.textContent = name;
  }

  function renderPlayerInfo() {
    const st = loadState();

    const rankEl = document.getElementById("playerRank");
    const levelEl = document.getElementById("playerLevel");
    const xpEl = document.getElementById("playerXP");
    const xpMaxEl = document.getElementById("playerXPMax");
    const bar = document.querySelector(".progress-bar");

    const rankIcon = document.getElementById("playerRankIcon");
    const avatarImg = document.getElementById("playerAvatar");

    const need = xpNeeded(st.level);
    const rankLevel = clampRankLevel(st.level);

    if (rankEl) rankEl.textContent = getRankName(st.level);
    if (levelEl) levelEl.textContent = String(st.level);
    if (xpEl) xpEl.textContent = String(st.xp);
    if (xpMaxEl) xpMaxEl.textContent = String(need);

    // ✅ Авто-іконка рангу
    if (rankIcon) {
      rankIcon.src = `../img/avatar/avatar${pad3(rankLevel)}.png`;
      rankIcon.alt = `Rank ${rankLevel}`;
    }

    // (Опційно) якщо у тебе є avatar001..avatar006 — розкоментуй:
    // if (avatarImg) avatarImg.src = `../img/avatar/avatar${pad3(rankLevel)}.png`;

    if (bar) {
      const pct = need > 0 ? Math.min(100, Math.round((st.xp / need) * 100)) : 0;
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(st.xp));
      bar.setAttribute("aria-valuemax", String(need));
    }
  }

  // Глобальна функція для гри: window.addXP(25)
  function addXP(amount) {
    if (!amount || !Number.isFinite(amount)) return;

    const st = loadState();
    st.xp += Math.max(0, Math.floor(amount));

    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1; // рівень росте → ранг теж автоматом
    }

    saveState(st);
    renderPlayerInfo();
  }

  window.addXP = addXP;
  window.renderPlayerInfo = renderPlayerInfo;

  document.addEventListener("DOMContentLoaded", () => {
    applyPlayerName();
    renderPlayerInfo();

    const form = document.getElementById("nameForm");
    const input = document.getElementById("nameInput");
    if (form && input) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = input.value.trim();
        if (!name) return;
        localStorage.setItem(NAME_KEY, name);
        input.value = "";
        applyPlayerName();
      });
    }
  });
})();
