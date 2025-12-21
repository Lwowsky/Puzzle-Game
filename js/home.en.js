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

  function renderHomeMission() {
    const btn = document.getElementById("missionBtn");
    const hint = document.getElementById("missionHint");
    if (!btn || !hint) return;

    const lastGameId = safeNum(localStorage.getItem("lastGameId"));
    const nextId = getNextUncompletedId();

    if (lastGameId) {
      btn.textContent = "Continue";
      btn.onclick = () => openGameInModal(lastGameId);

      const meta = getStoryMeta(lastGameId);
      hint.innerHTML = `
        <div>Anbu remembers your last mission:</div>
        <div>${meta.section || `Section ${lastGameId}: —`}</div>
        <div>${meta.chapter || `Chapter ${lastGameId}: —`}</div>
      `;
    } else {
      btn.textContent = "Start mission";
      btn.onclick = () => openGameInModal(nextId);
      hint.textContent =
        "No missions yet, dattebayo! Click “Start mission” — earn some ramen money.";
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
