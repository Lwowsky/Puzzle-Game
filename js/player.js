(() => {
  const NAME_KEY = "playerName";
  const STATE_KEY = "playerState";
  const WINS_KEY = "gamesPlayed";
  const AVATAR_KEY = "playerAvatarId";

  const RANKS_UK = ["Учень", "Шинобі", "Генін", "Чунін", "Джонін", "Хокаге"];
  const RANKS_EN = ["Student", "Shinobi", "Genin", "Chunin", "Jonin", "Hokage"];

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
    return Math.min(Math.max(1, level), 6);
  }

  function getRankName(level) {
    const ranks = isEN() ? RANKS_EN : RANKS_UK;
    return ranks[clampRankLevel(level) - 1];
  }

  function getPlayerName() {
    const name = (localStorage.getItem(NAME_KEY) || "").trim();
    return name.length ? name : null;
  }

  function getWins() {
    return Number(localStorage.getItem(WINS_KEY) || "0");
  }

  function totalXP(st) {
    let total = st.xp;
    for (let lvl = 1; lvl < st.level; lvl++) total += xpNeeded(lvl);
    return total;
  }

  // === Глобальна подія “онови UI” (щоб settings/stat модалки оновлювались без reload)
  function notifyPlayerUpdate(reason, extra = {}) {
    window.dispatchEvent(
      new CustomEvent("player:update", { detail: { reason, ...extra } })
    );
  }
  window.notifyPlayerUpdate = notifyPlayerUpdate;

  function applyPlayerName() {
    const fallback = isEN() ? "Player" : "Гравцю";
    const name = getPlayerName() || fallback;

    document.querySelectorAll("[data-player-name]").forEach((el) => {
      el.textContent = name;
    });

    const avatarTitle = document.querySelector(".avatar-title");
    if (avatarTitle) avatarTitle.textContent = name;
  }

  function renderPlayerPanel() {
    const name = getPlayerName();
    const registerBox = document.getElementById("registerBox");
    const panel = document.getElementById("playerPanel");
    if (!registerBox || !panel) return;

    if (!name) {
      registerBox.hidden = false;
      panel.hidden = true;
      return;
    }

    registerBox.hidden = true;
    panel.hidden = false;

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

  function getStoredAvatarId() {
    let id = Number(localStorage.getItem(AVATAR_KEY) || "1");
    if (!Number.isFinite(id) || id < 1) id = 1;
    return id;
  }

  // ✅ Авто-апдейт аватара при левел-апі:
  // - якщо гравець МАНУАЛЬНО вибрав нижчий аватар — не перетираємо
  // - якщо стояв “максимально доступний” (тобто був auto-поведінкою) — піднімемо на новий
  function syncAvatarAfterLevelChange(oldRankLevel, newRankLevel) {
    let id = getStoredAvatarId();

    // нормалізація під старий рівень (щоб не було “заблокований аватар”)
    if (id > oldRankLevel) id = oldRankLevel;

    // якщо раніше був на максимумі — авто піднімаємо
    if (newRankLevel > oldRankLevel && id === oldRankLevel) {
      id = newRankLevel;
    }

    // і в будь-якому випадку не вище нового ліміту
    if (id > newRankLevel) id = newRankLevel;

    localStorage.setItem(AVATAR_KEY, String(id));
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

    const need = xpNeeded(st.level);
    const rankLevel = clampRankLevel(st.level);

    if (rankEl) rankEl.textContent = getRankName(st.level);
    if (levelEl) levelEl.textContent = String(st.level);
    if (xpEl) xpEl.textContent = String(st.xp);
    if (xpMaxEl) xpMaxEl.textContent = String(need);

    // ✅ Ставимо аватар із localStorage, але clamp по доступному рангу
    if (rankIcon) {
      let avatarId = getStoredAvatarId();
      if (avatarId > rankLevel) avatarId = rankLevel;
      if (avatarId < 1) avatarId = 1;

      // якщо поправили — збережемо
      localStorage.setItem(AVATAR_KEY, String(avatarId));

      rankIcon.src = `../img/avatar/avatar${pad3(avatarId)}.png`;
      rankIcon.alt = `Avatar ${avatarId}`;
    }

    if (bar) {
      const pct =
        need > 0 ? Math.min(100, Math.round((st.xp / need) * 100)) : 0;
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(st.xp));
      bar.setAttribute("aria-valuemax", String(need));
      if (label) label.textContent = pct + "%";
    }

    renderPlayerPanel();
  }

  function addXP(amount) {
    if (!amount || !Number.isFinite(amount)) return;

    const st = loadState();
    const oldRankLevel = clampRankLevel(st.level);

    st.xp += Math.max(0, Math.floor(amount));

    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1;
    }

    const newRankLevel = clampRankLevel(st.level);

    // ✅ аватар синхронізуємо саме тут (бо тут відомо, що був левел-ап)
    syncAvatarAfterLevelChange(oldRankLevel, newRankLevel);

    saveState(st);
    renderPlayerInfo();
    notifyPlayerUpdate("xpChanged", { amount });
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
        renderPlayerInfo();
        notifyPlayerUpdate("nameChanged", { name });
      });
    }

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
