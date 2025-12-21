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

  // ✅ НОВЕ: одна функція, яку можна викликати скільки завгодно разів
  function renderHomeMission() {
    const btn = document.getElementById("missionBtn");
    const hint = document.getElementById("missionHint");
    if (!btn || !hint) return;

    const lastGameId = safeNum(localStorage.getItem("lastGameId"));
    const nextId = getNextUncompletedId();

    if (lastGameId) {
      btn.textContent = "Продовжити";
      btn.onclick = () => openGameInModal(lastGameId);

      const meta = getStoryMeta(lastGameId);
      hint.innerHTML = `
        <div>Анбу пам’ятає твою останню місію:</div>
        <div>${meta.section || `Розділ ${lastGameId}: —`}</div>
        <div>${meta.chapter || `Глава ${lastGameId}: —`}</div>
      `;
    } else {
      btn.textContent = "Почати місію";
      btn.onclick = () => openGameInModal(nextId);
      hint.textContent =
        "Ще не було місій у цьому браузері. Натисни «Почати місію», щоб зробити перший крок.";
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHomeMission();

    // ✅ НОВЕ: оновлення без перезавантаження, коли гра в модалці змінює прогрес
    window.addEventListener("progress:changed", () => {
      renderHomeMission();
    });

    // (опціонально) якщо ти міняєш прогрес в іншій вкладці
    window.addEventListener("storage", (e) => {
      if (e.key === "lastGameId" || e.key === "completedRanks") {
        renderHomeMission();
      }
    });
  });
})();
