(() => {
  function getId() {
    const qs = new URLSearchParams(location.search);
    const n = Number(qs.get("id"));
    return Number.isFinite(n) && n > 0 ? n : 1;
  }

  const DIFFICULTY_XP = { 3: 5, 4: 10, 5: 25 };
  const FIRST_CLEAR_BONUS_XP = 25;
  const COMPLETED_KEY = "completedRanks";

  document.addEventListener("DOMContentLoaded", () => {
    const id = getId();
    const id3 = String(id).padStart(3, "0");
    localStorage.setItem("lastGameId", String(id));

    const data = window.STORIES?.[id];
    document.getElementById("gameTitle").textContent =
      data?.title || `Гра ${id}`;
    document.getElementById("gameChapter").textContent = data?.chapter || "";
    const storyEl = document.getElementById("gameStory");
    if (storyEl)
      storyEl.innerHTML = Array.isArray(data?.text)
        ? data.text.map((t) => `<p>${t}</p>`).join("")
        : `<p>${data?.text || "Ця глава ще готується..."}</p>`;

    const container = document.getElementById("puzzleContainer");
    container.innerHTML = `
      <div class="pz-layout">
        <div class="pz-left">
          <div class="pz-board-wrap" id="pzStage">
            <div id="pzBoard"></div>
            <img id="pzPreview" class="pz-preview" alt="Preview">
            <button class="pz-btn pz-start" id="pzStart">Почати</button>
          </div>
        </div>
        <div class="pz-right">
          <div class="pz-controls pz-sizes">
            <div class="pz-size-option">
              <button class="pz-btn" data-size="3">3×3</button><div class="pz-xp">+5 XP</div>
            </div>
            <div class="pz-size-option">
              <button class="pz-btn" data-size="4">4×4</button><div class="pz-xp">+10 XP</div>
            </div>
            <div class="pz-size-option">
              <button class="pz-btn" data-size="5">5×5</button><div class="pz-xp">+25 XP</div>
            </div>
          </div>
          <div class="pz-stats"><div>⏳ <span id="pzTime">0</span> сек</div><div>🏆 <span id="pzBest">—</span></div></div>
          <div class="pz-controls">
            <button class="pz-btn" id="pzShuffle">Перемішати</button>
            <button class="pz-btn" id="pzReset">Скинути</button>
          </div>
          <div class="pz-status" id="pzStatus"></div>
          <button class="pz-btn" id="completeBtn" disabled>Завершити главу</button>
        </div>
      </div>
    `;

    const board = container.querySelector("#pzBoard");
    const stage = container.querySelector("#pzStage");
    const preview = container.querySelector("#pzPreview");
    const startBtn = container.querySelector("#pzStart");
    const shuffleBtn = container.querySelector("#pzShuffle");
    const resetBtn = container.querySelector("#pzReset");
    const completeBtn = container.querySelector("#completeBtn");
    const status = container.querySelector("#pzStatus");
    const timeEl = container.querySelector("#pzTime");
    const bestEl = container.querySelector("#pzBest");

    const imgList = [
      `../img/puzzles/tom${id3}.png`,
      `../img/puzzles/tom${id3}.jpg`,
      `../img/puzzles/${id3}.png`,
      `../img/puzzles/${id3}.jpg`,
    ];

    let imgSrc = "";
    let size = 3;
    let pieces = [];
    let correctOrder = [];
    let started = false;
    let time = 0;
    let timer;

    function getBestKey() {
      return `puzzleBest_${id}_${size}`;
    }
    function getBest() {
      return localStorage.getItem(getBestKey()) || "—";
    }
    function setBest(v) {
      localStorage.setItem(getBestKey(), v);
    }

    function stopTimer() {
      if (timer) clearInterval(timer);
      timer = null;
    }
    function startTimer() {
      stopTimer();
      timer = setInterval(() => {
        time++;
        timeEl.textContent = time;
      }, 1000);
    }

    function renderBoard() {
      board.innerHTML = "";
      pieces.forEach((p) => board.appendChild(p));
    }

    function checkWin() {
      if (!pieces.every((p, i) => +p.dataset.index === correctOrder[i])) return;
      stopTimer();
      status.textContent = "✅ Пазл складено!";
      completeBtn.disabled = false;
      const best = getBest();
      if (best === "—" || time < +best) setBest(time);
      bestEl.textContent = getBest();
    }

    function shuffle() {
      for (let i = pieces.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pieces[i], pieces[j]] = [pieces[j], pieces[i]];
      }
      renderBoard();
    }

    function preparePuzzle() {
      started = false;
      stage.classList.remove("started");
      stopTimer();
      time = 0;
      timeEl.textContent = "0";
      status.textContent = "Натисни «Почати», щоб почати гру.";

      pieces = [];
      correctOrder = [];

      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          const piece = document.createElement("div");
          piece.className = "pz-piece";
          piece.style.backgroundImage = `url("${imgSrc}")`;
          piece.style.backgroundSize = `${size * 100}% ${size * 100}%`;
          piece.style.backgroundPosition = `${(x / (size - 1)) * 100}% ${
            (y / (size - 1)) * 100
          }%`;
          piece.dataset.index = String(correctOrder.length);
          piece.addEventListener("click", () => {
            if (!started) return;
            piece.classList.toggle("is-selected");
          });
          pieces.push(piece);
          correctOrder.push(correctOrder.length);
        }
      }

      board.style.gridTemplateColumns = `repeat(${size}, 1fr)`;
      board.style.gridTemplateRows = `repeat(${size}, 1fr)`;
      renderBoard();
      bestEl.textContent = getBest();
      highlightSize();
    }

    function beginGame() {
      if (started || !imgSrc) return;
      started = true;
      stage.classList.add("started");
      shuffle();
      startTimer();
      status.textContent = "Гра почалась!";
    }

    startBtn.addEventListener("click", beginGame);
    shuffleBtn.addEventListener("click", () => started && shuffle());
    resetBtn.addEventListener("click", () => {
      preparePuzzle();
      beginGame();
    });

    container.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        size = +btn.dataset.size;
        preparePuzzle();
        highlightSize();
      });
    });
    function highlightSize() {
      container.querySelectorAll(".pz-sizes [data-size]").forEach((b) => {
        const isActive = Number(b.dataset.size) === size;
        b.classList.toggle("active", isActive);
        b.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
    }

    // === Image load ===
    (function loadImage(i = 0) {
      if (i >= imgList.length) {
        status.textContent = "❌ Картинка не знайдена.";
        return;
      }
      const img = new Image();
      img.onload = () => {
        imgSrc = img.src;
        preview.src = imgSrc;
        preparePuzzle();
      };
      img.onerror = () => loadImage(i + 1);
      img.src = imgList[i];
    })();
  });
})();
