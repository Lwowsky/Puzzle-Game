(() => {
  const NAME_KEY = "playerName";
  const STATE_KEY = "playerState";
  const WINS_KEY = "gamesPlayed";
  const AVATAR_KEY = "playerAvatarId";

  const RANKS_UK = ["Учень", "Шинобі", "Генін", "Чунін", "Джонін", "Хокаге"];
  const RANKS_EN = ["Student", "Shinobi", "Genin", "Chunin", "Jonin", "Hokage"];
  const RANKS_JA = ["見習い", "忍び", "下忍", "中忍", "上忍", "火影"];

  function getLang() {
    const lang = (document.documentElement.lang || "").toLowerCase();
    const path = (location.pathname || "").toLowerCase();

    if (lang.startsWith("ja") || path.includes("/ja/")) return "ja";
    if (lang.startsWith("en") || path.includes("/en/")) return "en";
    return "uk"; // дефолт: українська
  }

  function t(map) {
    return map[getLang()] ?? map.uk;
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
    const lang = getLang();
    const ranks =
      lang === "ja" ? RANKS_JA : lang === "en" ? RANKS_EN : RANKS_UK;
    return ranks[clampRankLevel(level) - 1];
  }

  function getPlayerName() {
    const name = (localStorage.getItem(NAME_KEY) || "").trim();
    return name.length ? name : null;
  }

  function applyPlayerName() {
    const fallback = t({ uk: "Гравцю", en: "Player", ja: "プレイヤー" });
    const name = getPlayerName() || fallback;

    document.querySelectorAll("[data-player-name]").forEach((el) => {
      el.textContent = name;
    });

    const avatarTitle = document.querySelector(".avatar-title");
    if (avatarTitle) avatarTitle.textContent = name;
  }

  function totalXP(st) {
    let total = st.xp;
    for (let lvl = 1; lvl < st.level; lvl++) total += xpNeeded(lvl);
    return total;
  }

  function getWins() {
    return Number(localStorage.getItem(WINS_KEY) || "0");
  }

  // ✅ один івент для всіх: settings, панель, грід глав і т.д.
  function notifyPlayerUpdate() {
    const st = loadState();
    window.dispatchEvent(
      new CustomEvent("player:update", { detail: { state: st } })
    );
  }

  function sanitizeAvatarId(avatarId, rankLevel) {
    let id = Number(avatarId || 1);
    if (!Number.isFinite(id) || id < 1) id = 1;
    if (id > rankLevel) id = rankLevel;
    return id;
  }

  // ✅ Автозміна аватара при підвищенні рівня:
  // Якщо гравець був на "максимально доступному" аватарі (або вище) — піднімаємо до нового максимуму.
  // Якщо він вручну обрав нижчий — не чіпаємо.
  function autoUpgradeAvatarOnLevelUp(prevLevel, newLevel) {
    const prevRank = clampRankLevel(prevLevel);
    const newRank = clampRankLevel(newLevel);
    if (newRank <= prevRank) return;

    const current = sanitizeAvatarId(localStorage.getItem(AVATAR_KEY), prevRank);

    // якщо аватар був на максимумі (або вище) — апгрейдимо
    if (current >= prevRank) {
      localStorage.setItem(AVATAR_KEY, String(newRank));
    }
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

    // ✅ Показуємо саме обраний/збережений аватар (але не вище доступного)
    if (rankIcon) {
      const avatarId = sanitizeAvatarId(
        localStorage.getItem(AVATAR_KEY),
        rankLevel
      );
      localStorage.setItem(AVATAR_KEY, String(avatarId));
      rankIcon.src = `../img/avatar/avatar${pad3(avatarId)}.png`;
      rankIcon.alt = t({
        uk: `Аватар ${avatarId}`,
        en: `Avatar ${avatarId}`,
        ja: `アバター ${avatarId}`,
      });
    }

    if (bar) {
      const pct = need > 0 ? Math.min(100, Math.round((st.xp / need) * 100)) : 0;
      bar.style.width = pct + "%";
      bar.setAttribute("aria-valuenow", String(st.xp));
      bar.setAttribute("aria-valuemax", String(need));
      if (label) label.textContent = pct + "%";
    }

    renderPlayerPanel();
    notifyPlayerUpdate(); // ✅ хай всі інші частини UI підхоплюють зміни
  }

  function addXP(amount) {
    if (!amount || !Number.isFinite(amount)) return;

    const prev = loadState();
    const st = loadState();

    st.xp += Math.max(0, Math.floor(amount));

    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1;
    }

    // ✅ апгрейд аватара лише при підвищенні рівня
    if (st.level > prev.level) {
      autoUpgradeAvatarOnLevelUp(prev.level, st.level);
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
        renderPlayerInfo();
      });
    }

    renderPlayerPanel();
  });

  // (опційно) якщо відкрито в іншій вкладці щось змінилось
  window.addEventListener("storage", (e) => {
    if ([NAME_KEY, STATE_KEY, WINS_KEY, AVATAR_KEY].includes(e.key)) {
      applyPlayerName();
      renderPlayerInfo();
    }
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
