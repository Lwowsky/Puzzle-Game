(() => {
  function getLang() {
    const lang = (document.documentElement.lang || "").toLowerCase();
    if (lang.startsWith("ja") || location.pathname.includes("/ja/")) return "ja";
    if (lang.startsWith("en") || location.pathname.includes("/en/")) return "en";
    return "uk";
  }

  const I18N = {
    uk: {
      btn_continue: "Продовжити",
      btn_start: "Почати місію",
      hint_last_title: "Анбу пам’ятає твою останню місію:",
      fallback_section: (id) => `Розділ ${id}: —`,
      fallback_chapter: (id) => `Глава ${id}: —`,
      hint_no_missions:
        "Поки що місій немає, даттебайо! Натисни «Почати місію» — заробиш на рамен.",
    },
    en: {
      btn_continue: "Continue",
      btn_start: "Start mission",
      hint_last_title: "Anbu remembers your last mission:",
      fallback_section: (id) => `Section ${id}: —`,
      fallback_chapter: (id) => `Chapter ${id}: —`,
      hint_no_missions:
        "No missions yet, dattebayo! Click “Start mission” — earn some ramen money.",
    },
    ja: {
      btn_continue: "続ける",
      btn_start: "ミッション開始",
      hint_last_title: "暗部（ANBU）は前回の任務を覚えている：",
      fallback_section: (id) => `セクション ${id}: —`,
      fallback_chapter: (id) => `チャプター ${id}: —`,
      hint_no_missions:
        "まだミッションはないってばよ！「ミッション開始」を押してラーメン代を稼ごう。",
    },
  };

  function t(key, ...args) {
    const dict = I18N[getLang()] || I18N.uk;
    const val = dict[key];
    return typeof val === "function" ? val(...args) : val;
  }

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

  function getStoryMeta(id) {
    const d = window.STORIES?.[id];
    return {
      section: d?.title ? String(d.title) : "",
      chapter: d?.chapter ? String(d.chapter) : "",
    };
  }

  function openGameInModal(id) {
    const modal = document.getElementById("gameModal");
    const frame = document.getElementById("gameFrame");

    if (!modal || !frame) {
      location.href = `./game.html?id=${id}`;
      return;
    }

    const url = new URL("./game.html", location.href);
    url.searchParams.set("id", String(id));
    url.searchParams.set("_", String(Date.now()));

    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = url.href;
    });

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  function renderHomeMission() {
    const btn = document.getElementById("missionBtn");
    const hint = document.getElementById("missionHint");
    if (!btn || !hint) return;

    let lastGameId = safeNum(localStorage.getItem("lastGameId"));
    if (lastGameId && !window.STORIES?.[lastGameId]) lastGameId = null;

    const nextId = getNextUncompletedId();

    if (lastGameId) {
      btn.textContent = t("btn_continue");
      btn.onclick = () => openGameInModal(lastGameId);

      const meta = getStoryMeta(lastGameId);
      hint.innerHTML = `
        <div>${t("hint_last_title")}</div>
        <div>${meta.section || t("fallback_section", lastGameId)}</div>
        <div>${meta.chapter || t("fallback_chapter", lastGameId)}</div>
      `;
    } else {
      btn.textContent = t("btn_start");
      btn.onclick = () => openGameInModal(nextId);
      hint.textContent = t("hint_no_missions");
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHomeMission();

    window.addEventListener("progress:changed", () => {
      renderHomeMission();
    });

    window.addEventListener("storage", (e) => {
      if (e.key === "lastGameId" || e.key === "completedRanks") {
        renderHomeMission();
      }
    });
  });
})();
