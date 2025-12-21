(() => {
  function getId() {
    const qs = new URLSearchParams(location.search);
    const n = Number(qs.get("id"));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }
  function pad3(n) {
    return String(n).padStart(3, "0");
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
    if (typeof window.addXP === "function") return window.addXP(amount);
    const st = loadPlayerState();
    st.xp += amount;
    while (st.xp >= xpNeeded(st.level)) {
      st.xp -= xpNeeded(st.level);
      st.level += 1;
    }
    savePlayerState(st);
    if (typeof window.renderPlayerInfo === "function")
      window.renderPlayerInfo();
  }

  const DIFFICULTY_XP = { 3: 5, 4: 10, 5: 25 };
  const FIRST_CLEAR_BONUS_XP = 25;
  const COMPLETED_KEY = "completedRanks";
  function requestCloseModal(reload = false) {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "closeGameModal", reload }, "*");
      return;
    }
    location.href = "./index.html";
  }

  document.addEventListener("DOMContentLoaded", () => {
    const id = getId();
    const id3 = pad3(id);
    localStorage.setItem("lastGameId", String(id));
    const completedSet = new Set(
      JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]").map(Number)
    );
    const alreadyCompleted = completedSet.has(id);
    const data = window.STORIES?.[id];
    const titleEl = document.getElementById("gameTitle");
    const chapterEl = document.getElementById("gameChapter");
    const storyEl = document.getElementById("gameStory");
    if (titleEl) titleEl.textContent = data?.title || `Гра ${id}`;
    if (chapterEl) chapterEl.textContent = data?.chapter || "";
    if (storyEl) {
      const text = data?.text;
      storyEl.innerHTML = Array.isArray(text)
        ? text.map((t) => `<p>${t}</p>`).join("")
        : `<p>${text || "Ця глава ще готується..."}</p>`;
    }

    const container = document.getElementById("puzzleContainer");
    if (!container) return;
    container.innerHTML = `
      <div class="pz-layout">
        <div class="pz-left">
          <div class="pz-board-wrap" id="pzStage">
            <div id="pzBoard" aria-label="Puzzle board"></div>
            <img id="pzPreview" class="pz-preview" alt="Preview">
            <button class="pz-btn pz-start" id="pzStart" type="button">Почати</button>
            <div class="pz-pause-overlay" id="pzPauseOverlay" aria-hidden="true">
              <div class="pz-pause-card">
                <div class="pz-pause-title">Пауза</div>
                <button class="pz-btn" id="pzResume" type="button">Продовжити</button>
                <button class="pz-btn" id="pzExit2" type="button">Вийти</button>
              </div>
            </div>
          </div>
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
              <div>⏳ <span id="pzTime">0</span> сек</div>
              <div>🏆 <span id="pzBest">—</span></div>
            </div>
          </div>
          <div class="pz-controls">
            <button class="pz-btn" id="pzShuffle" type="button">Перемішати</button>
            <button class="pz-btn" id="pzPause" type="button">Пауза</button>
            <button class="pz-btn" id="pzExit" type="button">Вийти</button>
          </div>
          <div class="pz-status" id="pzStatus"></div>
          <button class="pz-btn" id="completeBtn" type="button" disabled></button>
        </div>
      </div>
    `;

    const board = container.querySelector("#pzBoard");
    const stage = container.querySelector("#pzStage");
    const previewImg = container.querySelector("#pzPreview");
    const startBtn = container.querySelector("#pzStart");
    const status = container.querySelector("#pzStatus");
    const timeEl = container.querySelector("#pzTime");
    const bestEl = container.querySelector("#pzBest");
    const shuffleBtn = container.querySelector("#pzShuffle");
    const pauseBtn = container.querySelector("#pzPause");
    const exitBtn = container.querySelector("#pzExit");
    const resumeBtn = container.querySelector("#pzResume");
    const exitBtn2 = container.querySelector("#pzExit2");
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
    let started = false;
    let paused = false;
    let solved = false;

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
      container.querySelectorAll(".pz-sizes [data-size]").forEach((b) => {
        const isActive = Number(b.dataset.size) === size;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    function setCompletePreWinState() {
      solved = false;
      completeBtn.classList.remove("is-done");
      completeBtn.disabled = true;
      completeBtn.textContent = alreadyCompleted
        ? "Бонус 25 XP уже отримано ✅"
        : "Завершити главу 25 XP";
    }
    function setCompletePostWinState() {
      solved = true;
      completeBtn.disabled = false;
      completeBtn.classList.remove("is-done");
      const nextId = id + 1;
      const hasNext = !!window.STORIES?.[nextId];
      if (hasNext) {
        completeBtn.textContent = "Наступна глава →";
        completeBtn.onclick = () => {
          location.href = `./game.html?id=${nextId}`;
        };
      } else {
        completeBtn.textContent = "Закрити";
        completeBtn.onclick = () => requestCloseModal(true);
      }
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

    function startTimer() {
      stopTimer();
      timer = setInterval(() => {
        time++;
        timeEl.textContent = String(time);
      }, 1000);
    }

    function stopTimer() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    function pauseGame() {
      if (!started || paused) return;
      paused = true;
      stage.classList.add("paused");
      stopTimer();
      status.textContent = "⏸ Пауза";
    }

    function resumeGame() {
      if (!started || !paused) return;
      paused = false;
      stage.classList.remove("paused");
      startTimer();
      status.textContent = "Гра продовжена!";
    }

    function togglePause() {
      if (!started) return;
      paused ? resumeGame() : pauseGame();
    }

    function shuffle() {
      if (paused) return;
      clearSelection();
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const tmp = pieces[i];
        pieces[i] = pieces[j];
        pieces[j] = tmp;
      }
      renderBoard();
      status.textContent = "Перемішано!";
    }

    function preparePuzzle() {
      if (!imgSrc) return;
      started = false;
      paused = false;
      solved = false;
      stage.classList.remove("started");
      stage.classList.remove("paused");
      stopTimer();
      time = 0;
      timeEl.textContent = "0";
      bestEl.textContent = getBest();
      status.textContent = "Натисни «Почати», щоб почати гру.";
      setCompletePreWinState();
      board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      board.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      pieces = [];
      correctOrder = [];
      dragged = null;
      clearSelection();
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
              if (!started || paused) return;
              dragged = this;
              this.classList.add("is-dragging");
            });
            piece.addEventListener("dragend", function () {
              this.classList.remove("is-dragging");
              dragged = null;
            });
            piece.addEventListener("dragover", (e) => {
              if (!started || paused) return;
              e.preventDefault();
            });
            piece.addEventListener("drop", function () {
              if (!started || paused) return;
              if (!dragged || dragged === this) return;
              swapPieces(dragged, this);
            });
          } else {
            piece.addEventListener("click", () => {
              if (!started || paused) return;

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
      highlightSize();
      shuffleBtn.disabled = true;
      pauseBtn.disabled = true;
      startBtn.disabled = false;
      exitBtn.disabled = false;
    }

    function beginGame() {
      if (!imgSrc || started) return;
      started = true;
      paused = false;
      stage.classList.add("started");
      stage.classList.remove("paused");
      shuffleBtn.disabled = false;
      pauseBtn.disabled = false;
      shuffle();
      startTimer();
      status.textContent = "Гра почалась!";
    }

    function checkWin() {
      if (solved) return;
      for (let i = 0; i < pieces.length; i++) {
        if (Number(pieces[i].dataset.index) !== correctOrder[i]) return;
      }

      solved = true;
      stopTimer();
      const diffXP = DIFFICULTY_XP[size] || 0;
      addXP(diffXP);
      let bonusXP = 0;
      if (!completedSet.has(id)) {
        completedSet.add(id);
        localStorage.setItem(COMPLETED_KEY, JSON.stringify([...completedSet]));
        bonusXP = FIRST_CLEAR_BONUS_XP;
        addXP(bonusXP);
      }

      const best = getBest();
      if (best === "—" || time < Number(best)) {
        setBest(time);
        bestEl.textContent = String(time);
      } else {
        bestEl.textContent = best;
      }

      status.textContent = bonusXP
        ? `🎉 Пазл складено! +${diffXP} XP • Перше проходження: +${bonusXP} XP`
        : `✅ Пазл складено! +${diffXP} XP`;
      setCompletePostWinState();
    }

    startBtn.addEventListener("click", beginGame);
    shuffleBtn.addEventListener("click", () => started && !paused && shuffle());
    pauseBtn.addEventListener("click", togglePause);
    resumeBtn.addEventListener("click", resumeGame);
    exitBtn.addEventListener("click", () => requestCloseModal(false));
    exitBtn2.addEventListener("click", () => requestCloseModal(false));
    container.querySelectorAll(".pz-sizes [data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        size = Number(btn.dataset.size);
        preparePuzzle();
      });
    });

    function tryLoadImage(i = 0) {
      if (i >= imgCandidates.length) {
        status.textContent = "❌ Картинка не знайдена.";
        return;
      }
      const src = imgCandidates[i];
      const test = new Image();
      test.onload = () => {
        imgSrc = src;
        previewImg.src = src;
        preparePuzzle();

        if (new URLSearchParams(location.search).get("autostart") === "1") {
          beginGame();
        }
      };
      test.onerror = () => tryLoadImage(i + 1);
      test.src = src;
    }

    highlightSize();
    tryLoadImage();
  });
})();
