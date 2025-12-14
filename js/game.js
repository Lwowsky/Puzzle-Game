(() => {
  document.addEventListener("DOMContentLoaded", () => {
    // ====== 1) ID гри тільки з URL ======
    const id = Number(new URLSearchParams(location.search).get("id") || "1");
    const COMPLETED_KEY = "completedRanks";

    // ====== 2) Підтягнути історію ======
    const data = window.STORIES?.[id];

    const titleEl = document.getElementById("gameTitle");
    const chapterEl = document.getElementById("gameChapter");
    const storyEl = document.getElementById("gameStory");

    if (titleEl) titleEl.textContent = data?.title || `Гра ${id}`;
    if (chapterEl) chapterEl.textContent = data?.chapter || "";

    if (storyEl) {
      const text = data?.text;
      if (!text) {
        storyEl.innerHTML = "<p>Ця глава ще готується…</p>";
      } else if (Array.isArray(text)) {
        storyEl.innerHTML = text.map((p) => `<p>${escapeHtml(String(p))}</p>`).join("");
      } else {
        storyEl.innerHTML = `<p>${escapeHtml(String(text))}</p>`;
      }
    }

    // ====== 3) Контейнер гри ======
    const container = document.getElementById("puzzleContainer");
    if (!container) return;

    function pad3(n) {
      return String(n).padStart(3, "0");
    }

    const id3 = pad3(id);

    // ====== 4) UI гри (рендеримо ОДИН раз) ======
    container.innerHTML = `
      <div class="pz-layout">
        <div class="pz-left">
          <div id="pzBoard"></div>
        </div>

        <div class="pz-right">
          <div class="pz-top">
            <div class="pz-controls">
              <button class="pz-btn" data-size="3" type="button">3×3</button>
              <button class="pz-btn" data-size="4" type="button">4×4</button>
              <button class="pz-btn" data-size="5" type="button">5×5</button>
            </div>

            <div class="pz-stats">
              <div>⏳ <span id="pzTime">0</span> сек</div>
              <div>🏆 <span id="pzBest">—</span></div>
            </div>
          </div>

          <div class="pz-controls">
            <button class="pz-btn" id="pzShuffle" type="button">Перемішати</button>
            <button class="pz-btn" id="pzReset" type="button">Скинути</button>
          </div>

          <div class="pz-status" id="pzStatus"></div>
          <div class="pz-hint" id="pzHint"></div>

          <button class="pz-btn" id="completeBtn" type="button" disabled>Завершити главу</button>
        </div>
      </div>
    `;

    // ====== 5) Елементи ПІСЛЯ рендера ======
    const board = container.querySelector("#pzBoard");
    const status = container.querySelector("#pzStatus");
    const timeEl = container.querySelector("#pzTime");
    const bestEl = container.querySelector("#pzBest");
    const shuffleBtn = container.querySelector("#pzShuffle");
    const resetBtn = container.querySelector("#pzReset");
    const hintEl = container.querySelector("#pzHint");
    const completeBtn = container.querySelector("#completeBtn");

    // ====== 6) Картинка саме під цей id ======
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

    // ====== 7) Кнопки складності ======
    container.querySelectorAll("[data-size]").forEach((btn) => {
      btn.addEventListener("click", () => {
        size = Number(btn.dataset.size);
        highlightSize();
        startGame();
      });
    });

    shuffleBtn?.addEventListener("click", shuffle);
    resetBtn?.addEventListener("click", startGame);

    // ====== 8) Завершити главу ======
    completeBtn?.addEventListener("click", () => {
      const done = new Set(
        JSON.parse(localStorage.getItem(COMPLETED_KEY) || "[]").map(Number)
      );
      done.add(id);
      localStorage.setItem(COMPLETED_KEY, JSON.stringify([...done]));

      // якщо сторінка в iframe (модалка) — батько перезавантажиться
      window.parent?.postMessage({ type: "puzzleWin", id }, "*");

      // якщо відкрито напряму — просто покажемо підтвердження
      status.textContent = "✅ Глава збережена як пройдена!";
    });

    // ====== 9) Завантаження картинки з fallback ======
    function tryLoadImage(i = 0) {
      if (i >= imgCandidates.length) {
        hintEl.textContent =
          `❌ Не знайдено картинку для гри ${id}. ` +
          `Додай файл: img/puzzles/tom${id3}.png`;
        return;
      }

      const src = imgCandidates[i];
      hintEl.textContent = `Гра ${id} • Завантажую: ${src}`;

      const test = new Image();
      test.onload = () => {
        imgSrc = src;
        hintEl.textContent = ""; // прибираємо підказку
        startGame(); // авто-старт
      };
      test.onerror = () => tryLoadImage(i + 1);
      test.src = src;
    }

    // ====== 10) ЛОГІКА ПАЗЛУ ======
    function startGame() {
      if (!imgSrc) return;

      stopTimer();
      time = 0;
      timeEl.textContent = "0";
      status.textContent = "";
      if (completeBtn) completeBtn.disabled = true;

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
          piece.style.backgroundPosition =
            `${(x / (size - 1)) * 100}% ${(y / (size - 1)) * 100}%`;

          piece.dataset.index = String(index);
          correctOrder.push(index);

          piece.draggable = true;
          piece.addEventListener("dragstart", dragStart);
          piece.addEventListener("dragover", dragOver);
          piece.addEventListener("drop", dropPiece);

          // ПК: правою кнопкою — поворот (не обов’язково)
          piece.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            rotatePiece(piece);
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

    function rotatePiece(piece) {
      const deg = (Number(piece.dataset.rot) || 0) + 90;
      piece.dataset.rot = String(deg);
      piece.style.transform = `rotate(${deg}deg)`;
    }

    function shuffle() {
      pieces.sort(() => Math.random() - 0.5);
      board.innerHTML = "";
      pieces.forEach((p) => board.appendChild(p));
      status.textContent = "Перемішано!";
    }

    function dragStart() {
      dragged = this;
    }

    function dragOver(e) {
      e.preventDefault();
    }

    function dropPiece() {
      if (!dragged || dragged === this) return;

      const a = pieces.indexOf(dragged);
      const b = pieces.indexOf(this);

      pieces[a] = this;
      pieces[b] = dragged;

      board.innerHTML = "";
      pieces.forEach((p) => board.appendChild(p));

      checkWin();
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
      status.textContent = "✅ Пазл складено! Тепер можна завершити главу.";
      if (completeBtn) completeBtn.disabled = false;

      const best = getBest();
      if (best === "—" || time < Number(best)) {
        setBest(time);
        bestEl.textContent = String(time);
      }
    }

    function escapeHtml(s) {
      return s
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
    }

    // ====== START ======
    highlightSize();
    tryLoadImage();
  });
})();
