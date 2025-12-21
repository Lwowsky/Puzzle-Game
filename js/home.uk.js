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

  // відкриваємо гру в модалці (як у rank-сторінках)
  function openGameInModal(id) {
    const modal = document.getElementById("gameModal");
    const frame = document.getElementById("gameFrame");

    // fallback якщо раптом модалки нема
    if (!modal || !frame) {
      location.href = `./game.html?id=${id}`;
      return;
    }

    const url = new URL("./game.html", location.href);
    url.searchParams.set("id", String(id));
    url.searchParams.set("_", String(Date.now())); // щоб кеш не заважав
    // НЕ додаємо autostart=1 — тоді кнопка “Почати” в грі не зникає

    frame.src = "about:blank";
    requestAnimationFrame(() => {
      frame.src = url.href;
    });

    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("missionBtn");
    const hint = document.getElementById("missionHint");
    if (!btn || !hint) return;

    const lastGameId = safeNum(localStorage.getItem("lastGameId"));
    const nextId = getNextUncompletedId();

    // ✅ 1 кнопка: “Почати місію” або “Продовжити”
    if (lastGameId) {
      btn.textContent = "Продовжити";
      btn.onclick = () => openGameInModal(lastGameId);

      const meta = getStoryMeta(lastGameId);
      const parts = [];
      if (meta.section) parts.push(meta.section);
      if (meta.chapter) parts.push(meta.chapter);

      hint.textContent = parts.length
        ? `Сувій пам’ятає твою останню місію: ${parts.join(" • ")}`
        : `Сувій пам’ятає твою останню місію: Глава ${lastGameId}.`;
    } else {
      btn.textContent = "Почати місію";
      btn.onclick = () => openGameInModal(nextId);

      // ✅ цей рядок залишаємо як ти просив
      hint.textContent =
        "Ще не було місій у цьому браузері. Натисни «Почати місію», щоб зробити перший крок.";
    }
  });
})();
