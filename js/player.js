(() => {
  const NAME_KEY = "playerName";
  const STATE_KEY = "playerState"; // { level: number, xp: number }
  const WINS_KEY = "gamesPlayed"; // будемо рахувати перемоги (wins)

  const RANKS_UK = ["Учень", "Шинобі", "Генін", "Чунін", "Джонін", "Хокаге"];
  const RANKS_EN = [
    "Apprentice",
    "Shinobi",
    "Genin",
    "Chunin",
    "Jonin",
    "Hokage",
  ];

  function isEN() {
    return (
      document.documentElement.lang?.toLowerCase().startsWith("en") ||
      location.pathname.includes("/en/")
    );
  }

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

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

  function clampRankLevel(level) {
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

  // total XP = сума всіх попередніх рівнів + поточний xp
  function totalXP(st) {
    let total = st.xp;
    for (let lvl = 1; lvl < st.level; lvl++) total += xpNeeded(lvl);
    return total;
  }

  function getWins() {
    return Number(localStorage.getItem(WINS_KEY) || "0");
  }

  function renderPlayerPanel() {
    const name = getPlayerName();

    const registerBox = document.getElementById("registerBox");
    const panel = document.getElementById("playerPanel");

    // якщо на цій сторінці немає блока — просто нічого не робимо
    if (!registerBox || !panel) return;

    // показ/приховування
    if (!name) {
      registerBox.hidden = false;
      panel.hidden = true;
      return;
    }

    registerBox.hidden = true;
    panel.hidden = false;

    // заповнюємо статистику
    const st = loadState();

    const nameEl = document.getElementById("playerNameLabel");
    const playsEl = document.getElementById("statPlays");
    const totalEl = document.getElementById("statTotalXP");
    const toNextEl = document.getElementById("statToNext");

    const need = xpNeeded(st.level);
    const toNext = Math.max(0, need - st.xp);

    if (nameEl) nameEl.textContent = name;
    if (playsEl) playsEl.textContent = String(getWins());
    if (totalEl) totalEl.textContent = String(totalXP(st));
    if (toNextEl) toNextEl.textContent = String(toNext);
  }

  function renderPlayerInfo() {
    const st = loadState();

    const rankEl = document.getElementById("playerRank");
    const levelEl = document.getElementById("playerLevel");
    const xpEl = document.getElementById("playerXP");
    const xpMaxEl = document.getElementById("playerXPMax");
    const bar = document.querySelector(".progress-bar");
    const label = document.getElementById("progressLabel");

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

    if (avatarImg) {
      avatarImg.src = `../img/avatar/avatar${pad3(rankLevel)}.png`;
    }

    if (bar) {
      const pct =
        need > 0 ? Math.min(100, Math.round((st.xp / need) * 100)) : 0;
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(st.xp));
      bar.setAttribute("aria-valuemax", String(need));
      if (label) label.textContent = pct + "%";
    }

    // оновимо також панель
    renderPlayerPanel();
  }

  // Глобальна функція для гри: window.addXP(25)
  function addXP(amount) {
    if (!amount || !Number.isFinite(amount)) return;

    const st = loadState();
    st.xp += Math.max(0, Math.floor(amount));

    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1;
    }

    saveState(st);
    renderPlayerInfo();
  }

  window.addXP = addXP;
  window.renderPlayerInfo = renderPlayerInfo;

  document.addEventListener("DOMContentLoaded", () => {
    applyPlayerName();
    renderPlayerInfo(); // всередині викличе renderPlayerPanel()

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
        renderPlayerInfo(); // оновить і панель, і прогрес
      });
    }

    // на всякий випадок, якщо форми нема — але панель є
    renderPlayerPanel();
  });
})();
document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.getElementById("playerSidebar");
  const btn = document.getElementById("playerSidebarToggle");
  if (!sidebar || !btn) return;

  btn.addEventListener("click", () => {
    const open = sidebar.classList.toggle("is-open");
    btn.setAttribute("aria-expanded", String(open));
  });
});