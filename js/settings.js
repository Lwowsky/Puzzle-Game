(() => {
  const NAME_KEY = "playerName";
  const STATE_KEY = "playerState";
  const WINS_KEY = "gamesPlayed";
  const AVATAR_KEY = "playerAvatarId";

  const RANKS_UK = ["Учень", "Шинобі", "Генін", "Чунін", "Джонін", "Хокаге"];
  const RANKS_EN = ["Student", "Shinobi", "Genin", "Chunin", "Jonin", "Hokage"];
  const RANKS_JA = ["見習い", "忍", "下忍", "中忍", "上忍", "火影"];

  function getLang() {
    const lang = (document.documentElement.lang || "").toLowerCase();
    if (lang.startsWith("ja") || location.pathname.includes("/ja/")) return "ja";
    if (lang.startsWith("en") || location.pathname.includes("/en/")) return "en";
    return "uk";
  }

  const I18N = {
    uk: {
      aria_avatar: (i) => `Аватар ${i}`,
      aria_avatar_locked: (i) => `Аватар ${i} заблоковано`,
      hint_locked: "🔒 Цей аватар відкриється з вищим рангом.",
      hint_selected: (i) => `✅ Обрано аватар ${i}`,
      hint_saved_avatar: "✅ Аватар збережено!",
      hint_enter_name: "Введи ім’я.",
      hint_saved_name: "✅ Ім’я збережено!",
      confirm_reset:
        "Точно скинути ВСЕ? Це видалить ім’я, XP, прогрес глав і аватар.",
      hint_reset_done: "✅ Скинуто. Перезавантажую...",
    },
    en: {
      aria_avatar: (i) => `Avatar ${i}`,
      aria_avatar_locked: (i) => `Avatar ${i} locked`,
      hint_locked: "🔒 This avatar unlocks at a higher rank.",
      hint_selected: (i) => `✅ Selected avatar ${i}`,
      hint_saved_avatar: "✅ Avatar saved!",
      hint_enter_name: "Enter a name.",
      hint_saved_name: "✅ Name saved!",
      confirm_reset:
        "Reset EVERYTHING? This will delete your name, XP, chapter progress, and avatar.",
      hint_reset_done: "✅ Reset done. Reloading...",
    },
    ja: {
      aria_avatar: (i) => `アバター ${i}`,
      aria_avatar_locked: (i) => `アバター ${i} はロック中`,
      hint_locked: "🔒 このアバターはより高いランクで解放されます。",
      hint_selected: (i) => `✅ アバター ${i} を選択しました`,
      hint_saved_avatar: "✅ アバターを保存しました！",
      hint_enter_name: "名前を入力してください。",
      hint_saved_name: "✅ 名前を保存しました！",
      confirm_reset:
        "すべてリセットしますか？名前、XP、チャプター進行、アバターが削除されます。",
      hint_reset_done: "✅ リセットしました。再読み込み中…",
    },
  };

  function t(key, ...args) {
    const dict = I18N[getLang()] || I18N.uk;
    const val = dict[key];
    return typeof val === "function" ? val(...args) : val;
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
    const lang = getLang();
    const ranks = lang === "ja" ? RANKS_JA : lang === "en" ? RANKS_EN : RANKS_UK;
    return ranks[clampRankLevel(level) - 1];
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
      tabs.forEach((t) => t.classList.toggle("is-active", t.dataset.tab === key));
      panes.forEach((p) => p.classList.toggle("is-active", p.dataset.pane === key));
      if (key === "stats") renderStats();
    }

    tabs.forEach((btn) => btn.addEventListener("click", () => setTab(btn.dataset.tab)));

    modal.addEventListener("click", (e) => {
      if (e.target.matches("[data-close-settings]")) closeModal(modal);
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("is-open")) closeModal(modal);
    });

    const grid = document.getElementById("avatarGrid");
    const hint = document.getElementById("avatarHint");
    const saveAvatarBtn = document.getElementById("saveAvatarBtn");

    let selectedAvatar = Number(localStorage.getItem(AVATAR_KEY) || "1");

    function renderAvatarGrid() {
      if (!grid) return;

      selectedAvatar = Number(localStorage.getItem(AVATAR_KEY) || selectedAvatar || "1");

      const st = loadState();
      const unlockedMax = clampRankLevel(st.level);

      if (!Number.isFinite(selectedAvatar) || selectedAvatar < 1) selectedAvatar = 1;
      if (selectedAvatar > unlockedMax) selectedAvatar = unlockedMax;

      grid.innerHTML = "";

      for (let i = 1; i <= 6; i++) {
        const locked = i > unlockedMax;

        const card = document.createElement("button");
        card.type = "button";
        card.className =
          "avatar-card" +
          (locked ? " is-locked" : "") +
          (i === selectedAvatar ? " is-selected" : "");

        card.setAttribute("aria-label", locked ? t("aria_avatar_locked", i) : t("aria_avatar", i));

        const img = document.createElement("img");
        img.src = `../img/avatar/avatar${pad3(i)}.png`;
        img.alt = locked ? t("aria_avatar_locked", i) : t("aria_avatar", i);
        card.appendChild(img);

        if (locked) {
          const lock = document.createElement("div");
          lock.className = "avatar-lock";
          lock.textContent = "🔒";
          card.appendChild(lock);
        }

        card.addEventListener("click", () => {
          if (locked) {
            if (hint) hint.textContent = t("hint_locked");
            return;
          }
          selectedAvatar = i;
          if (hint) hint.textContent = t("hint_selected", i);
          renderAvatarGrid();
        });

        grid.appendChild(card);
      }
    }

    saveAvatarBtn?.addEventListener("click", () => {
      const st = loadState();
      const unlockedMax = clampRankLevel(st.level);

      if (!Number.isFinite(selectedAvatar) || selectedAvatar < 1) selectedAvatar = 1;
      if (selectedAvatar > unlockedMax) selectedAvatar = unlockedMax;

      localStorage.setItem(AVATAR_KEY, String(selectedAvatar));
      if (hint) hint.textContent = t("hint_saved_avatar");

      window.renderPlayerInfo?.();
      renderAvatarGrid();
    });

    openBtn.addEventListener("click", () => {
      renderAvatarGrid();
      renderStats();
      setTab("avatar");
      openModal(modal);
    });

    const newNameInput = document.getElementById("newNameInput");
    const saveNameBtn = document.getElementById("saveNameBtn");
    const nameHint = document.getElementById("nameHint");

    saveNameBtn?.addEventListener("click", () => {
      const val = (newNameInput?.value || "").trim();
      if (!val) {
        if (nameHint) nameHint.textContent = t("hint_enter_name");
        return;
      }
      localStorage.setItem(NAME_KEY, val);
      if (newNameInput) newNameInput.value = "";
      if (nameHint) nameHint.textContent = t("hint_saved_name");
      window.renderPlayerInfo?.();

      document.querySelectorAll("[data-player-name]").forEach((el) => (el.textContent = val));
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

    window.addEventListener("player:update", () => {
      if (modal && modal.classList.contains("is-open")) {
        renderStats();
        renderAvatarGrid();
      }
    });

    const resetBtn = document.getElementById("resetAllBtn");
    const resetHint = document.getElementById("resetHint");

    resetBtn?.addEventListener("click", () => {
      const ok = confirm(t("confirm_reset"));
      if (!ok) return;

      localStorage.removeItem(NAME_KEY);
      localStorage.removeItem(STATE_KEY);
      localStorage.removeItem(WINS_KEY);
      localStorage.removeItem(AVATAR_KEY);
      localStorage.removeItem("completedRanks");
      localStorage.removeItem("lastGameId");

      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("puzzleBest_")) localStorage.removeItem(k);
      });

      if (resetHint) resetHint.textContent = t("hint_reset_done");
      setTimeout(() => location.reload(), 300);
    });
  });
})();
