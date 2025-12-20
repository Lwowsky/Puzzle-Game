(() => {
  const NAME_KEY = "playerName";
  const STATE_KEY = "playerState";
  const WINS_KEY = "gamesPlayed";
  const AVATAR_KEY = "playerAvatarId";
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
    return 100 * Math.pow(2, Math.max(0, level - 1));
  }
  function loadState() {
    try {
      const raw = localStorage.getItem(STATE_KEY);
      if (!raw) return { level: 1, xp: 0 };
      const o = JSON.parse(raw);
      return {
        level: Math.max(1, Number(o.level) || 1),
        xp: Math.max(0, Number(o.xp) || 0),
      };
    } catch {
      return { level: 1, xp: 0 };
    }
  }
  function totalXP(st) {
    let t = st.xp;
    for (let lvl = 1; lvl < st.level; lvl++) t += xpNeeded(lvl);
    return t;
  }
  function clampRankLevel(level) {
    return Math.min(Math.max(1, level), 6);
  }
  function getRankName(level) {
    const ranks = isEN() ? RANKS_EN : RANKS_UK;
    return ranks[clampRankLevel(level) - 1];
  }
  function getName() {
    const n = (localStorage.getItem(NAME_KEY) || "").trim();
    return n.length ? n : null;
  }
  function getWins() {
    return Number(localStorage.getItem(WINS_KEY) || "0");
  }
  function openModal(modal) {
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeModal(modal) {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  document.addEventListener("DOMContentLoaded", () => {
    const modal = document.getElementById("settingsModal");
    const openBtn = document.getElementById("openSettings");
    if (!modal || !openBtn) return;
    const tabs = modal.querySelectorAll("[data-tab]");
    const panes = modal.querySelectorAll("[data-pane]");
    function setTab(key) {
      tabs.forEach((t) =>
        t.classList.toggle("is-active", t.dataset.tab === key)
      );
      panes.forEach((p) =>
        p.classList.toggle("is-active", p.dataset.pane === key)
      );
      if (key === "stats") renderStats();
    }
    tabs.forEach((btn) =>
      btn.addEventListener("click", () => setTab(btn.dataset.tab))
    );
    modal.addEventListener("click", (e) => {
      if (e.target.matches("[data-close-settings]")) closeModal(modal);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open"))
        closeModal(modal);
    });
    openBtn.addEventListener("click", () => {
      renderAvatarGrid();
      renderStats();
      setTab("avatar");
      openModal(modal);
    });
    const grid = document.getElementById("avatarGrid");
    const hint = document.getElementById("avatarHint");
    const saveAvatarBtn = document.getElementById("saveAvatarBtn");
    let selectedAvatar = Number(localStorage.getItem(AVATAR_KEY) || "0");
    function renderAvatarGrid() {
      if (!grid) return;
      const st = loadState();
      const unlockedMax = clampRankLevel(st.level);
      grid.innerHTML = "";
      for (let i = 1; i <= 6; i++) {
        const locked = i > unlockedMax;
        const card = document.createElement("button");
        card.type = "button";
        card.className =
          "avatar-card" +
          (locked ? " is-locked" : "") +
          (i === selectedAvatar ? " is-selected" : "");
        card.setAttribute(
          "aria-label",
          locked ? `Avatar ${i} locked` : `Avatar ${i}`
        );
        const img = document.createElement("img");
        img.src = `../img/avatar/avatar${pad3(i)}.png`;
        img.alt = `Avatar ${i}`;
        card.appendChild(img);
        if (locked) {
          const lock = document.createElement("div");
          lock.className = "avatar-lock";
          lock.textContent = "🔒";
          card.appendChild(lock);
        }
        card.addEventListener("click", () => {
          if (locked) {
            if (hint)
              hint.textContent = "🔒 Цей аватар відкриється з вищим рангом.";
            return;
          }
          selectedAvatar = i;
          if (hint) hint.textContent = `✅ Обрано аватар ${i}`;
          renderAvatarGrid();
        });
        grid.appendChild(card);
      }
    }
    saveAvatarBtn?.addEventListener("click", () => {
      if (!selectedAvatar) selectedAvatar = 1;
      localStorage.setItem(AVATAR_KEY, String(selectedAvatar));
      hint && (hint.textContent = "✅ Аватар збережено!");
      window.renderPlayerInfo?.();
    });
    const newNameInput = document.getElementById("newNameInput");
    const saveNameBtn = document.getElementById("saveNameBtn");
    const nameHint = document.getElementById("nameHint");
    saveNameBtn?.addEventListener("click", () => {
      const val = (newNameInput?.value || "").trim();
      if (!val) {
        if (nameHint) nameHint.textContent = "Введи ім’я.";
        return;
      }
      localStorage.setItem(NAME_KEY, val);
      if (newNameInput) newNameInput.value = "";
      if (nameHint) nameHint.textContent = "✅ Ім’я збережено!";
      window.renderPlayerInfo?.();
      document
        .querySelectorAll("[data-player-name]")
        .forEach((el) => (el.textContent = val));
      const title = document.querySelector(".avatar-title");
      if (title) title.textContent = val;
    });
    function renderStats() {
      const st = loadState();
      const need = xpNeeded(st.level);
      const toNext = Math.max(0, need - st.xp);
      const set = (id, v) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(v);
      };
      set("sRank", getRankName(st.level));
      set("sLevel", st.level);
      set("sXP", st.xp);
      set("sNeed", need);
      set("sToNext", toNext);
      set("sTotal", totalXP(st));
      set("sPlays", getWins());
    }
    const resetBtn = document.getElementById("resetAllBtn");
    const resetHint = document.getElementById("resetHint");
    resetBtn?.addEventListener("click", () => {
      const ok = confirm(
        "Точно скинути ВСЕ? Це видалить ім’я, XP, прогрес глав і аватар."
      );
      if (!ok) return;
      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(WINS_KEY);
      localStorage.removeItem(AVATAR_KEY);
      localStorage.removeItem("completedRanks");
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("puzzleBest_")) localStorage.removeItem(k);
      });
      if (resetHint) resetHint.textContent = "✅ Скинуто. Перезавантажую...";
      setTimeout(() => location.reload(), 300);
    });
  });
})();
