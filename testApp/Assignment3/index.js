document.addEventListener("DOMContentLoaded", () => {
  const GameModule = (function () {
    let score = 0;
    let finalScore = 0; // Locks the score for the display modal
    let isPlaying = false;
    let activeTileIndex = null;

    // Timers
    let gameLoopTimer = null; // Controls the "too slow" refresh
    let gameEndTimer = null; // Controls the 10s duration
    let visualResetTimer = null; // Controls green flash duration

    // Config
    const GAME_DURATION = 10000;

    // DOM Cache
    const grid = document.getElementById("game-container");
    const scoreDisplay = document.getElementById("score-display");
    const startBtn = document.getElementById("start-btn");
    const modal = document.getElementById("modal");
    const finalScoreDisplay = document.getElementById("final-score");
    const saveBtn = document.getElementById("save-score-btn");
    const cancelBtn = document.getElementById("cancel-btn");
    const nameInput = document.getElementById("player-name");
    const scoreList = document.getElementById("score-list");

    // --- PRIVATE HELPERS ---

    const createGrid = () => {
      grid.innerHTML = "";
      for (let i = 0; i < 9; i++) {
        let tile = document.createElement("div");
        tile.classList.add("tile");
        tile.dataset.index = i; // Store index in DOM
        grid.appendChild(tile);
      }
    };

    const updateScoreUI = () => {
      scoreDisplay.textContent = score;
    };

    const clearTimers = () => {
      clearTimeout(gameLoopTimer);
      clearTimeout(gameEndTimer);
      clearTimeout(visualResetTimer);
    };

    // SECURITY: Sanitize user input to prevent XSS attacks
    // This function escapes HTML special characters as an extra layer of protection
    const sanitizeInput = (str) => {
      const div = document.createElement("div");
      div.textContent = str; // textContent escapes HTML entities
      return div.textContent;
    };

    // Core Game Logic: Moves the blue square
    const activateNextTile = () => {
      if (!isPlaying) return;

      // Reset UI for all tiles
      const tiles = document.querySelectorAll(".tile");
      tiles.forEach((t) => t.classList.remove("active", "hit"));

      // Logic to pick a random tile (different from current)
      let newIndex = Math.floor(Math.random() * 9);
      // If we have more than 1 tile, ensure we don't pick the same one twice
      if (tiles.length > 1) {
        while (newIndex === activeTileIndex) {
          newIndex = Math.floor(Math.random() * 9);
        }
      }

      activeTileIndex = newIndex;
      tiles[activeTileIndex].classList.add("active");

      // Set "Too Slow" timer - moves tile if you don't click fast enough
      // Speed increases as score increases (capped at 400ms)
      const speed = Math.max(400, 1000 - score * 50);
      gameLoopTimer = setTimeout(activateNextTile, speed);
    };

    // --- PUBLIC CONTROLLER CLASS ---
    class GameController {
      constructor() {
        // Binding 'this' explicitly for event handlers
        this.startGame = this.startGame.bind(this);
        this.handleGridClick = this.handleGridClick.bind(this);
        this.handleGlobalKeys = this.handleGlobalKeys.bind(this);
        this.endGame = this.endGame.bind(this);
        this.saveScore = this.saveScore.bind(this);
        this.closeModal = this.closeModal.bind(this);
      }

      init() {
        createGrid();
        startBtn.addEventListener("click", this.startGame);
        saveBtn.addEventListener("click", this.saveScore);
        cancelBtn.addEventListener("click", this.closeModal);
      }

      startGame() {
        if (isPlaying) return;

        // 1. Reset State
        score = 0;
        activeTileIndex = null;
        isPlaying = true;
        updateScoreUI();
        modal.style.display = "none";
        startBtn.disabled = true;

        // 2. Start Game Loop
        activateNextTile();

        // 3. Set Game Over Timer
        gameEndTimer = setTimeout(this.endGame, GAME_DURATION);

        // 4. Attach Listeners
        // EVENT DELEGATION: We listen on the grid, not the tiles
        grid.addEventListener("mousedown", this.handleGridClick);
        // MEMORY MANAGEMENT: Global listener added
        window.addEventListener("keydown", this.handleGlobalKeys);
      }

      endGame() {
        isPlaying = false;
        finalScore = score; // Lock score for display

        // Memory Management: Remove listeners and clear timers
        this.cleanup();

        // Show UI
        finalScoreDisplay.textContent = finalScore;
        modal.style.display = "flex";
        startBtn.disabled = false;
      }

      cleanup() {
        // Remove listeners
        grid.removeEventListener("mousedown", this.handleGridClick);
        window.removeEventListener("keydown", this.handleGlobalKeys);

        // Stop all timers
        clearTimers();
      }

      handleGridClick(e) {
        if (!isPlaying) return;

        // Check if the clicked element (or its parent) is a tile
        const tile = e.target.closest(".tile");
        if (!tile) return; // Clicked grid gap, ignore

        const index = parseInt(tile.dataset.index);

        // Logic: Did we hit the active tile?
        if (index === activeTileIndex) {
          // Valid Hit
          score++;
          updateScoreUI();

          // Prevent double-clicking:
          activeTileIndex = null;

          // Visual Feedback
          tile.classList.remove("active");
          tile.classList.add("hit"); // Green flash

          // Reset the "Too Slow" timer immediately
          clearTimeout(gameLoopTimer);

          // Delay slightly before next tile appears so user sees the green
          visualResetTimer = setTimeout(() => {
            if (isPlaying) activateNextTile();
          }, 150);
        }
      }

      handleGlobalKeys(e) {
        if (e.key === "Escape") {
          this.endGame();
        }
      }

      saveScore() {
        // Get user input
        const rawName = nameInput.value.trim() || "Anonymous";

        // SECURITY: Detect potentially malicious input (HTML/script injection attempts)
        // Check for HTML tags or script patterns
        const htmlPattern = /<[^>]*>/; // Matches any HTML tag like <img>, <script>, etc.

        if (htmlPattern.test(rawName)) {
          // Alert user about invalid input and DO NOT save
          alert(
            "Invalid name! HTML tags are not allowed. Please enter a valid name.",
          );
          nameInput.value = ""; // Clear the malicious input
          nameInput.focus(); // Focus back on input field
          return; // Exit without saving
        }

        // SECURITY: Sanitize the input as an extra layer of protection
        const safeName = sanitizeInput(rawName);

        // Create DOM elements safely (never use innerHTML with user data!)
        const entry = document.createElement("div");
        entry.className = "entry";

        const nameSpan = document.createElement("span");
        // SECURITY: textContent treats content as plain text, not HTML
        // This prevents any script injection even if sanitizeInput was bypassed
        nameSpan.textContent = safeName;

        const scoreSpan = document.createElement("span");
        scoreSpan.textContent = finalScore;

        entry.appendChild(nameSpan);
        entry.appendChild(scoreSpan);
        scoreList.prepend(entry);

        this.closeModal();
      }

      closeModal() {
        modal.style.display = "none";
        nameInput.value = "";
      }
    }

    return new GameController();
  })();

  // Initialize Game
  GameModule.init();
});
