(() => {
  function getId() {
    const qs = new URLSearchParams(location.search);
    const n = Number(qs.get("id"));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  function pad3(n) {
    return String(n).padStart(3, "0");
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  // fallback (if you don't have window.addXP in player.js)
  const PLAYER_STATE_KEY = "playerState";
  function loadPlayerState() {
    try {
      const raw = localStorage.getItem(PLAYER_STATE_KEY);
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
  function savePlayerState(state) {
    localStorage.setItem(PLAYER_STATE_KEY, JSON.stringify(state));
  }
  function xpNeeded(level) {
    // lvl1 -> 100, lvl2 -> 200, lvl3 -> 400 ...
    return 100 * Math.pow(2, Math.max(0, level - 1));
  }
  function addXP(amount) {
    if (!amount) return;

    // if you already have addXP in player.js — use it
    if (typeof window.addXP === "function") {
      window.addXP(amount);
      return;
    }

    // otherwise — simple fallback
    const st = loadPlayerState();
    st.xp += amount;

    // level up
    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1;
    }

    savePlayerState(st);

    // if you have your UI update function — call it
    if (typeof window.renderPlayerInfo === "function") {
      window.renderPlayerInfo();
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    const id = getId();
    const id3 = pad3(id);

    const COMPLETED_KEY = "completedRanks";

    // XP rules
    const DIFFICULTY_XP = { 3: 5, 4: 10, 5: 25 };
    const FIRST_CLEAR_BONUS_XP = 25;

    // ===== STORY =====
    const data = window.STORIES?.[id];

    const titleEl = document.getElementById("gameTitle");
    const chapterEl = document.getElementById("gameChapter");
    const storyEl = document.getElementById("gameStory");

    if (titleEl) titleEl.textContent = data?.title || `Game ${id}`;
    if (chapterEl) chapterEl.textContent = data?.chapter || "";

    if (storyEl) {
      const text = data?.text;
      if (!text) {
        storyEl.innerHTML = "<p>This chapter is still in progress…</p>";
      } else if (Array.isArray(text)) {
        storyEl.innerHTML = text.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
      } else {
        storyEl.innerHTML = `<p>${escapeHtml(text)}</p>`;
      }
    }

    // ===== PUZZLE UI =====
    const container = document.getElementById("puzzleContainer");
    if (!container) return;

    container.innerHTML = `
      <div class="pz-layout">
        <div class="pz-left"><div id="pzBoard"></div></div>

        <div class="pz-right">
          <div class="pz-top">
            <div class="pz-controls">
              <button class="pz-btn" data-size="3" type="button">3×3</button>
              <button class="pz-btn" data-size="4" type="button">4×4</button>
              <button class="pz-btn" data-size="5" type="button">5×5</button>
            </div>
            <div class="pz-stats">
              <div>⏳ <span id="pzTime">0</span> sec</div>
              <div>🏆 <span id="pzBest">—</span></div>
            </div>
          </div>

          <div class="pz-controls">
            <button class="pz-btn" id="pzShuffle" type="button">Shuffle</button>
            <button class="pz-btn" id="pzReset" type="button">Reset</button>
          </div>

          <div class="pz-status" id="pzStatus"></div>
          <div class="pz-hint" id="pzHint"></div>

          <button class="pz-btn" id="completeBtn" type="button" disabled>Complete chapter</button>
        </div>
      </div>
    `;

    const board = container.querySelector("#pzBoard");
    const status = container.querySelector("#pzStatus");
    const timeEl = container.querySelector("#pzTime");
    const bestEl = container.querySelector("#pzBest");
    const shuffleBtn = container.querySelector("#pzShuffle");
    const resetBtn = container.querySelector("#pzReset");
    const hintEl = container.querySelector("#pzHint");
    const completeBtn = container.querySelector("#completeBtn");

    const imgCandidates = [
      `../img/puzzles/tom${id3}.png`,
      `../img/puzzles/tom${id3}.jpg`,
      `../img/puzzles/${id3}.png`,
      `../img/puzzles/${id3}.jpg`,
    ];

    let size = 3;
    let imgSrc = "";
    let pieces = [];
    let correctOrder = [];
    let dragged = null;

    let timer = null;
    let time = 0;

    function bestKey() {
      return `puzzleBest_${id}_${size}`;
    }
    function getBest() {
      return localStorage.getItem(bestKey()) || "—";
    }
    function setBest(v) {
      localStorage.setItem(bestKey(), String(v));
    }

    function highlightSize() {
      container.querySelectorAll("[data-size]").forEach((b) => {
        b.classList.toggle("active", Number(b.dataset.size) === size);
      });
    }

    container.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        size = Number(btn.dataset.size);
        highlightSize();
        startGame();
      });
    });

    shuffleBtn.addEventListener("click", shuffle);
    resetBtn.addEventListener("click", startGame);

    // This button now only closes / refreshes the chapter list (no XP here)
    completeBtn.addEventListener("click", () => {
      window.parent?.postMessage({ type: "puzzleWin", id }, "*");
      status.textContent = "✅ Done!";
    });

    function tryLoadImage(i = 0) {
      if (i >= imgCandidates.length) {
        hintEl.textContent = `❌ No image found for game ${id}. Add: img/puzzles/tom${id3}.png`;
        return;
      }
      const src = imgCandidates[i];
      hintEl.textContent = `Game ${id} • Loading: ${src}`;

      const test = new Image();
      test.onload = () => {
        imgSrc = src;
        hintEl.textContent = "";
        startGame();
      };
      test.onerror = () => tryLoadImage(i + 1);
      test.src = src;
    }

    function startGame() {
      if (!imgSrc) return;

      stopTimer();
      time = 0;
      timeEl.textContent = "0";
      status.textContent = "";
      completeBtn.disabled = true;

      bestEl.textContent = getBest();

      board.innerHTML = "";
      board.style.display = "grid";
      board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      board.style.gridTemplateRows = `repeat(${size}, 1fr)`;

      pieces = [];
      correctOrder = [];
      dragged = null;

      let index = 0;
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const piece = document.createElement("div");
          piece.className = "pz-piece";
          piece.style.backgroundImage = `url("${imgSrc}")`;
          piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
          piece.style.backgroundPosition = `${(x / (size - 1)) * 100}% ${
            (y / (size - 1)) * 100
          }%`;

          piece.dataset.index = String(index);
          correctOrder.push(index);

          piece.draggable = true;
          piece.addEventListener("dragstart", function () {
            dragged = this;
          });
          piece.addEventListener("dragover", (e) => e.preventDefault());
          piece.addEventListener("drop", function () {
            if (!dragged || dragged === this) return;

            const a = pieces.indexOf(dragged);
            const b = pieces.indexOf(this);

            pieces[a] = this;
            pieces[b] = dragged;

            board.innerHTML = "";
            pieces.forEach((p) => board.appendChild(p));

            checkWin();
          });

          pieces.push(piece);
          board.appendChild(piece);
          index++;
        }
      }

      shuffle();
      startTimer();
      highlightSize();
    }

    function shuffle() {
      pieces.sort(() => Math.random() - 0.5);
      board.innerHTML = "";
      pieces.forEach((p) => board.appendChild(p));
      status.textContent = "Shuffled!";
    }

    function startTimer() {
      timer = setInterval(() => {
        time++;
        timeEl.textContent = String(time);
      }, 1000);
    }

    function stopTimer() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function checkWin() {
      for (let i = 0; i < pieces.length; i++) {
        if (Number(pieces[i].dataset.index) !== correctOrder[i]) return;
      }

      stopTimer();

      // ✅ +1 до “зіграно разів”
      localStorage.setItem(
        "gamesPlayed",
        String(Number(localStorage.getItem("gamesPlayed") || "0") + 1)
      );

      // 1) XP for difficulty (every time)
      const diffXP = DIFFICULTY_XP[size] || 0;
      addXP(diffXP);

      // 2) Bonus + mark chapter as completed (only once per chapter)
      const done = new Set(
        JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]").map(Number)
      );

      let bonusXP = 0;
      if (!done.has(id)) {
        done.add(id);
        localStorage.setItem(COMPLETED_KEY, JSON.stringify([...done]));
        bonusXP = FIRST_CLEAR_BONUS_XP;
        addXP(bonusXP);
      }

      status.textContent = bonusXP
        ? `🎉 Puzzle completed! +${diffXP} XP • First chapter clear: +${bonusXP} XP`
        : `✅ Puzzle completed! +${diffXP} XP`;

      // best time
      const best = getBest();
      if (best === "—" || time < Number(best)) {
        setBest(time);
        bestEl.textContent = String(time);
      }

      // now you can "complete chapter" (close modal)
      completeBtn.disabled = false;
    }

    highlightSize();
    tryLoadImage();
  });
})();
