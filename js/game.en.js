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
    return 100 * Math.pow(2, Math.max(0, level - 1));
  }
  function addXP(amount) {
    if (!amount) return;
    if (typeof window.addXP === "function") {
      window.addXP(amount);
      return;
    }
    const st = loadPlayerState();
    st.xp += amount;
    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1;
    }
    savePlayerState(st);
    if (typeof window.renderPlayerInfo === "function") {
      window.renderPlayerInfo();
    }
  }
  document.addEventListener("DOMContentLoaded", () => {
    const id = getId();
    const id3 = pad3(id);
    const COMPLETED_KEY = "completedRanks";
    const DIFFICULTY_XP = { 3: 5, 4: 10, 5: 25 };
    const FIRST_CLEAR_BONUS_XP = 25;
    const data = window.STORIES?.[id];
    const titleEl = document.getElementById("gameTitle");
    const chapterEl = document.getElementById("gameChapter");
    const storyEl = document.getElementById("gameStory");
    if (titleEl) titleEl.textContent = data?.title || `Game ${id}`;
    if (chapterEl) chapterEl.textContent = data?.chapter || "";
    if (storyEl) {
      const text = data?.text;
      if (!text) {
        storyEl.innerHTML = "<p>This chapter is still being prepared…</p>";
      } else if (Array.isArray(text)) {
        storyEl.innerHTML = text.map((p) => `<p>${escapeHtml(p)}</p>`).join("");
      } else {
        storyEl.innerHTML = `<p>${escapeHtml(text)}</p>`;
      }
    }
    const container = document.getElementById("puzzleContainer");
    if (!container) return;
    container.innerHTML = `
      <div class="pz-layout">
        <div class="pz-left">
          <div id="pzBoard" aria-label="Puzzle board"></div>
        </div>
        <div class="pz-right">
        <div class="pz-top">
            <div class="pz-controls pz-sizes">
              <div class="pz-size-option">
                <button class="pz-btn" data-size="3" type="button">3×3</button>
                <div class="pz-xp">+5 XP</div>
              </div>
              <div class="pz-size-option">
                <button class="pz-btn" data-size="4" type="button">4×4</button>
                <div class="pz-xp">+10 XP</div>
              </div>
              <div class="pz-size-option">
                <button class="pz-btn" data-size="5" type="button">5×5</button>
                <div class="pz-xp">+25 XP</div>
              </div>
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
          <button class="pz-btn" id="completeBtn" type="button" disabled>Finish chapter</button>
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
    const isTouch = matchMedia("(pointer: coarse)").matches;
    let size = 3;
    let imgSrc = "";
    let pieces = [];
    let correctOrder = [];
    let dragged = null;
    let selectedPiece = null;
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
    function renderBoard() {
      board.innerHTML = "";
      pieces.forEach((p) => board.appendChild(p));
    }
    function swapPieces(p1, p2) {
      const a = pieces.indexOf(p1);
      const b = pieces.indexOf(p2);
      if (a < 0 || b < 0) return;
      pieces[a] = p2;
      pieces[b] = p1;
      renderBoard();
      checkWin();
    }
    function clearSelection() {
      if (selectedPiece) selectedPiece.classList.remove("is-selected");
      selectedPiece = null;
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
    completeBtn.addEventListener("click", () => {
      window.parent?.postMessage({ type: "puzzleWin", id }, "*");
      status.textContent = "✅ Done!";
    });
    function tryLoadImage(i = 0) {
      if (i >= imgCandidates.length) {
        hintEl.textContent = `❌ No image found for game ${id}. Add: img/puzzles/tom${id3}.jpg`;
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
      clearSelection();
      bestEl.textContent = getBest();
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
          if (!isTouch) {
            piece.draggable = true;
            piece.addEventListener("dragstart", function () {
              dragged = this;
              this.classList.add("is-dragging");
            });
            piece.addEventListener("dragend", function () {
              this.classList.remove("is-dragging");
              dragged = null;
            });
            piece.addEventListener("dragover", (e) => e.preventDefault());
            piece.addEventListener("drop", function () {
              if (!dragged || dragged === this) return;
              swapPieces(dragged, this);
            });
          } else {
            piece.addEventListener("click", () => {
              if (!selectedPiece) {
                selectedPiece = piece;
                piece.classList.add("is-selected");
                return;
              }
              if (selectedPiece === piece) {
                clearSelection();
                return;
              }
              const p1 = selectedPiece;
              clearSelection();
              swapPieces(p1, piece);
            });
          }
          pieces.push(piece);
          index++;
        }
      }
      renderBoard();
      shuffle();
      startTimer();
      highlightSize();
    }
    function shuffle() {
      clearSelection();
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pieces[i];
        pieces[i] = pieces[j];
        pieces[j] = tmp;
      }
      renderBoard();
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
      localStorage.setItem(
        "gamesPlayed",
        String(Number(localStorage.getItem("gamesPlayed") || "0") + 1)
      );
      const diffXP = DIFFICULTY_XP[size] || 0;
      addXP(diffXP);
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
        ? `🎉 Puzzle completed! +${diffXP} XP • First clear bonus: +${bonusXP} XP`
        : `✅ Puzzle completed! +${diffXP} XP`;
      const best = getBest();
      if (best === "—" || time < Number(best)) {
        setBest(time);
        bestEl.textContent = String(time);
      }
      completeBtn.disabled = false;
    }
    highlightSize();
    tryLoadImage();
  });
})();
