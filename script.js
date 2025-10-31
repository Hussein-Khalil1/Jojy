/* =========================================================
   LOVE LETTER WEB APP – INTERACTIVE SCRIPT
   ---------------------------------------------------------
   The goal of this rewrite is to make every behaviour easy
   to follow. The file is split into clearly labelled blocks,
   every helper has commentary, and state is centralised so
   future tweaks feel safe and intentional.
========================================================= */

"use strict";

/* =========================================================
   GLOBAL CONSTANTS
========================================================= */
const PASSWORD = "Jannah"; // The shared secret for unlocking the surprise
const TYPEWRITER_TEXT = "Hi Jojy, Please Enter Password"; // Intro line for the typewriter effect
const RELATIONSHIP_START = new Date("2023-11-16T00:00:00"); // Update this to the exact moment your journey began
const RELATIONSHIP_REFERENCE_TOTAL_DAYS = 714; // The known total days as of the reference moment (today)
const TOGETHER_UPDATE_INTERVAL_MS = 60_000; // How frequently the together page recalculates time (1 minute keeps hours accurate)
const MS_PER_MINUTE = 60_000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const RELATIONSHIP_REFERENCE_DATE = addDays(RELATIONSHIP_START, RELATIONSHIP_REFERENCE_TOTAL_DAYS);
const RELATIONSHIP_REFERENCE_TOTAL_HOURS = RELATIONSHIP_REFERENCE_TOTAL_DAYS * 24;
const HEART_SPAWN_INTERVAL_MS = 1000; // How frequently floating hearts are created
const HEARTS_PER_TICK = 3; // Number of hearts produced each interval
const MAIN_MESSAGE_ROTATION_MS = 5000; // Delay between love messages on the landing page
const ALBUM_MESSAGE_ROTATION_MS = 3000; // Delay between album caption changes
const CLICK_BUTTON_DELAY_MS = 10000; // Matches the visual countdown animation
const COUNTDOWN_DURATION_SECONDS = 10; // Mirrors CSS custom property --t
const PASSWORD_HINT_IDS = ["hint1", "hint2", "hint3"]; // DOM ids for the progressive hints

// Rotating affirmations shared across pages.
const LOVE_MESSAGES = [
  "You're my safe place ❤️",
  "Forever isn't enough with you 💕",
  "My world is brighter with you 🌎",
  "I'll always choose you, in every lifetime 🤞🏼❤️",
  "You are my forever love 🤞🏼❤️"
];

// All secret phrases that can appear in the hangman game.
const HANGMAN_WORD = "I'll love you until forever";

/* =========================================================
   GLOBAL STATE
========================================================= */
const STATE = {
  typewriterIndex: 0, // Tracks current character position for the typewriter animation
  failedPasswordAttempts: 0, // Number of incorrect password tries (to reveal hints)
  heartIntervalId: null, // Stores the interval that continually spawns hearts
  mainMessageIntervalId: null, // Interval handle for rotating the message on the first page
  albumMessageIntervalId: null, // Interval handle for rotating captions on the album page
  albumMessageIndex: 0, // Index of the currently displayed album caption
  mainMessages: [], // Cached set of messages appropriate for the current time of day
  mainMessageIndex: 0, // Index of the message currently on screen
  clickButtonTimeoutId: null, // Timeout that reveals the “Click Me” button after the countdown
  togetherIntervalId: null, // Interval that keeps the days-together counters in sync with real time
  mainInitialised: false, // Guards the main-page initialisation work so it only runs once
  hangman: {
    word: normaliseHangmanWord(HANGMAN_WORD), // Always the lowercase, punctuation-free target used internally
    guessedLetters: new Set(), // Letters the player has already attempted
    incorrectLetters: new Set(), // Incorrect guesses displayed under the puzzle
    maxIncorrect: 6, // Maximum number of mistakes allowed
    gameOver: false, // Flag controlling interactivity of the controls
    won: false // Tracks if the player has successfully finished the round
  }
};

/* =========================================================
   DOM ELEMENT REGISTRY
========================================================= */
const els = {
  // Password gateway elements
  password: {
    overlay: document.getElementById("password-overlay"),
    title: document.getElementById("password-title"),
    input: document.getElementById("password-input")
  },

  // Containers for each “page” of the experience
  pages: {
    main: document.getElementById("main-content"),
    album: document.getElementById("album-page"),
    hangman: document.getElementById("hangman-page"),
    days: document.getElementById("together-page")
  },

  // Elements specific to the landing page
  main: {
    messageBox: document.querySelector(".message-box"),
    message: document.getElementById("message"),
    countdown: document.getElementById("countdown"),
    clickButton: document.getElementById("click-btn"),
    heartsContainer: document.getElementById("hearts-container"),
    fromTo: document.querySelector(".from-to")
  },

  // Album page components
  album: {
    message: document.getElementById("album-rotating-message"),
    container: document.getElementById("album"),
    scrollLeftBtn: document.getElementById("scroll-left"),
    scrollRightBtn: document.getElementById("scroll-right"),
    images: Array.from(document.querySelectorAll("#album img")),
    fullscreen: document.getElementById("fullscreen"),
    fullscreenImage: document.querySelector("#fullscreen img")
  },

  // Together counter page
  days: {
    daysCount: document.getElementById("days-count"),
    weeksCount: document.getElementById("weeks-count"),
    hoursCount: document.getElementById("hours-count"),
    breakdown: document.getElementById("years-months-count")
  },

  // Navigation menus and dropdowns (one set per page)
  navMenus: [
    {
      trigger: document.getElementById("nav-menu"),
      hamburger: document.getElementById("hamburger"),
      dropdown: document.getElementById("nav-dropdown")
    },
    {
      trigger: document.getElementById("nav-menu-album"),
      hamburger: document.getElementById("hamburger-album"),
      dropdown: document.getElementById("nav-dropdown-album")
    },
    {
      trigger: document.getElementById("nav-menu-hangman"),
      hamburger: document.getElementById("hamburger-hangman"),
      dropdown: document.getElementById("nav-dropdown-hangman")
    },
    {
      trigger: document.getElementById("nav-menu-days"),
      hamburger: document.getElementById("hamburger-days"),
      dropdown: document.getElementById("nav-dropdown-days")
    }
  ]
};

/* =========================================================
   PAGE CONTROLLERS
   ---------------------------------------------------------
   Each entry knows how to show/hide a page. Using dedicated
   handlers keeps display logic consistent everywhere.
========================================================= */
const PAGES = {
  main: {
    show: () => {
      if (els.pages.main) els.pages.main.style.display = "flex";
    },
    hide: () => {
      if (els.pages.main) els.pages.main.style.display = "none";
    }
  },
  album: {
    show: () => {
      if (els.pages.album) {
        els.pages.album.style.setProperty("display", "flex", "important");
      }
    },
    hide: () => {
      if (els.pages.album) {
        els.pages.album.style.setProperty("display", "none", "important");
      }
    }
  },
  hangman: {
    show: () => {
      if (els.pages.hangman) {
        els.pages.hangman.style.setProperty("display", "flex", "important");
      }
    },
    hide: () => {
      if (els.pages.hangman) {
        els.pages.hangman.style.setProperty("display", "none", "important");
      }
    }
  },
  days: {
    show: () => {
      if (els.pages.days) els.pages.days.style.display = "flex";
    },
    hide: () => {
      if (els.pages.days) els.pages.days.style.display = "none";
    }
  }
};

/* =========================================================
   INITIALISATION ENTRY POINT
========================================================= */
initializeApp();
window.onload = typeWriter; // Kick off the typewriter once the window fires “load”

/* =========================================================
   CORE INITIALISATION ROUTINE
========================================================= */
function initializeApp() {
  setupPasswordGate();
  setupMainPageInteractions();
  setupAlbumInteractions();
  setupFullscreenViewer();
  setupNavigation();
  startTogetherCounter(); // Begin tracking how long you've been together
}

/* =========================================================
   TYPEWRITER INTRO
========================================================= */
function typeWriter() {
  if (!els.password.title) return;

  if (STATE.typewriterIndex < TYPEWRITER_TEXT.length) {
    els.password.title.textContent += TYPEWRITER_TEXT.charAt(STATE.typewriterIndex);
    STATE.typewriterIndex += 1;
    setTimeout(typeWriter, 150); // Adjust delay here to speed up / slow down the typing effect
  }
}

/* =========================================================
   PASSWORD GATE SETUP
========================================================= */
function setupPasswordGate() {
  if (!els.password.input) return;

  els.password.input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      handlePasswordAttempt();
    }
  });
}

// Evaluates the password and handles success or failure responses.
function handlePasswordAttempt() {
  if (!els.password.input) return;

  const isCorrect = els.password.input.value === PASSWORD;

  if (isCorrect) {
    unlockExperience();
  } else {
    registerFailedPasswordAttempt();
  }
}

// Unlocks the hidden content, hides the overlay, and launches the main experience.
function unlockExperience() {
  if (els.password.overlay) {
    els.password.overlay.style.display = "none";
  }

  goToPage("main");
  startMainExperience();
}

// Provides feedback for wrong guesses, including the shake animation and progressive hints.
function registerFailedPasswordAttempt() {
  STATE.failedPasswordAttempts += 1;

  if (!els.password.input) return;

  els.password.input.classList.add("shake");
  setTimeout(() => els.password.input.classList.remove("shake"), 300);
  els.password.input.value = "";

  revealNextPasswordHint();
}

// Reveals the next hint based on how many attempts have been made.
function revealNextPasswordHint() {
  const hintId = PASSWORD_HINT_IDS[STATE.failedPasswordAttempts - 1];
  if (!hintId) return;

  const hintElement = document.getElementById(hintId);
  if (hintElement) {
    hintElement.style.display = "block";
  }
}

/* =========================================================
   MAIN PAGE SETUP
========================================================= */
function setupMainPageInteractions() {
  if (els.main.messageBox) {
    els.main.messageBox.addEventListener("click", advanceMainMessageManually);
  }

  if (els.main.clickButton) {
    els.main.clickButton.addEventListener("click", () => {
      goToPage("album");
    });
  }
}

// Runs once when the password is correct to configure messages, hearts, and button timing.
function startMainExperience() {
  if (STATE.mainInitialised) return; // Prevent duplicating intervals and listeners
  STATE.mainInitialised = true;

  prepareMainMessages();
  showRandomMainMessage();
  startMainMessageRotation();
  startHeartSpawner();
  synchroniseCountdownWithButton();
}

// Chooses the appropriate pool of messages based on the current time.
function prepareMainMessages() {
  const hour = new Date().getHours();

  const morningMessages = [
    "Good morning my love ❤️",
    "Saba7 el gamal Jojy",
    "Saba7 el 3asal Jojy",
    "Saba7 el 5eir ya Jojy",
    "3omry w 7ayati, w albi kolo. Saba7 el ward",
    "Good Morning Battaa 🦆"
  ];

  const dayMessages = [
    "Hope your day is going amazing Battaa 🦆",
    "Thinking of you right now 😁",
    "7ayati w albi, I miss you 🤞🏼❤️"
  ];

  const nightMessages = [
    "Goodnight, my love ❤️",
    "Sweet dreams, Jojy ❤️",
    "Tesba7y 3ala alf 5eir, Ba7ebek ❤️",
    "Sleep well, Jannahhhh 🤞🏼❤️"
  ];

  if (hour >= 5 && hour < 12) {
    STATE.mainMessages = morningMessages;
  } else if (hour >= 18 || hour < 5) {
    STATE.mainMessages = nightMessages;
  } else {
    STATE.mainMessages = dayMessages;
  }

  STATE.mainMessageIndex = getRandomIndex(STATE.mainMessages.length);
}

// Displays the current message stored in STATE.mainMessages at STATE.mainMessageIndex.
function showRandomMainMessage() {
  if (!els.main.message || STATE.mainMessages.length === 0) return;

  els.main.message.innerText = STATE.mainMessages[STATE.mainMessageIndex];
}

// Advances to the next message manually when the user clicks the message box.
function advanceMainMessageManually() {
  rotateMainMessage();
  showRandomMainMessage();
}

// Starts the timed rotation for the main page message.
function startMainMessageRotation() {
  if (STATE.mainMessageIntervalId) {
    clearInterval(STATE.mainMessageIntervalId);
  }

  STATE.mainMessageIntervalId = setInterval(() => {
    rotateMainMessage();
    showRandomMainMessage();
  }, MAIN_MESSAGE_ROTATION_MS);
}

// Moves the main message index forward, looping back to the beginning if necessary.
function rotateMainMessage() {
  if (STATE.mainMessages.length === 0) return;
  STATE.mainMessageIndex = (STATE.mainMessageIndex + 1) % STATE.mainMessages.length;
}

// Synchronises the countdown animation with the reveal of the “Click Me” button.
function synchroniseCountdownWithButton() {
  if (!els.main.clickButton) return;

  if (STATE.clickButtonTimeoutId) {
    clearTimeout(STATE.clickButtonTimeoutId);
  }

  STATE.clickButtonTimeoutId = setTimeout(() => {
    els.main.clickButton.style.display = "inline-block";
  }, CLICK_BUTTON_DELAY_MS);

  // The CSS animation runs independently but matches COUNTDOWN_DURATION_SECONDS via custom properties.
  if (els.main.countdown) {
    els.main.countdown.style.setProperty("--t", COUNTDOWN_DURATION_SECONDS);
  }
}

// Repeatedly spawns floating hearts for ambience.
function startHeartSpawner() {
  if (!els.main.heartsContainer) return;

  if (STATE.heartIntervalId) {
    clearInterval(STATE.heartIntervalId);
  }

  STATE.heartIntervalId = setInterval(() => {
    for (let i = 0; i < HEARTS_PER_TICK; i += 1) {
      createHeart();
    }
  }, HEART_SPAWN_INTERVAL_MS);
}

// Creates a single floating heart and schedules its removal so the DOM stays clean.
function createHeart() {
  if (!els.main.heartsContainer) return;

  const heart = document.createElement("div");
  heart.className = "heart";
  heart.innerText = "❤️";
  heart.style.left = `${Math.random() * 100}vw`;
  heart.style.top = "100vh";

  const size = Math.random() * 1.5 + 1.2;
  heart.style.fontSize = `${size}rem`;
  heart.style.opacity = Math.random() < 0.6 ? "0.9" : "0.4";
  heart.style.animationDuration = `${Math.random() * 5 + 4}s`;

  els.main.heartsContainer.appendChild(heart);

  const lifetime = parseFloat(heart.style.animationDuration) * 1000;
  setTimeout(() => heart.remove(), lifetime);
}

/* =========================================================
   PAGE NAVIGATION
========================================================= */
function setupNavigation() {
  setupMenuToggles();
  setupNavigationLinks();
  setupOutsideClickCloser();
}

// Attaches click handlers to every hamburger menu so they can toggle open/closed states.
function setupMenuToggles() {
  els.navMenus.forEach((menu) => {
    if (!menu.trigger || !menu.hamburger || !menu.dropdown) return;

    menu.trigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleMenu(menu);
    });
  });
}

// Connects every nav item to the destination page it should expose.
function setupNavigationLinks() {
  const linkMap = [
    { id: "nav-message", page: "main" },
    { id: "nav-album", page: "album" },
    { id: "nav-days", page: "days" },
    { id: "nav-hangman", page: "hangman" },
    { id: "nav-message-album", page: "main" },
    { id: "nav-album-album", page: "album" },
    { id: "nav-days-album", page: "days" },
    { id: "nav-hangman-album", page: "hangman" },
    { id: "nav-message-hangman", page: "main" },
    { id: "nav-album-hangman", page: "album" },
    { id: "nav-days-hangman", page: "days" },
    { id: "nav-hangman-hangman", page: "hangman" },
    { id: "nav-message-days", page: "main" },
    { id: "nav-album-days", page: "album" },
    { id: "nav-days-days", page: "days" },
    { id: "nav-hangman-days", page: "hangman" }
  ];

  linkMap.forEach((link) => {
    const element = document.getElementById(link.id);
    if (!element) return;

    element.addEventListener("click", () => {
      closeAllMenus();
      goToPage(link.page);
    });
  });
}

// Closes menus when the user clicks away from the dropdown region.
function setupOutsideClickCloser() {
  document.addEventListener("click", (event) => {
    els.navMenus.forEach((menu) => {
      if (!menu.trigger || !menu.hamburger || !menu.dropdown) return;
      if (!menu.trigger.contains(event.target)) {
        closeMenu(menu);
      }
    });
  });
}

// Toggles a given menu between open and closed states.
function toggleMenu(menu) {
  if (!menu.hamburger || !menu.dropdown) return;

  menu.hamburger.classList.toggle("open");
  menu.dropdown.classList.toggle("show");
}

// Ensures a menu is fully closed (used when navigating away or clicking elsewhere).
function closeMenu(menu) {
  if (!menu.hamburger || !menu.dropdown) return;

  menu.hamburger.classList.remove("open");
  menu.dropdown.classList.remove("show");
}

// Closes every menu on the page.
function closeAllMenus() {
  els.navMenus.forEach(closeMenu);
}

// Central function for switching between “pages”.
function goToPage(pageKey) {
  Object.entries(PAGES).forEach(([key, controller]) => {
    if (key === pageKey) {
      controller.show();
    } else {
      controller.hide();
    }
  });

  // Handle page-specific side-effects.
  if (pageKey === "album") {
    startAlbumMessageRotation();
  } else {
    stopAlbumMessageRotation();
  }

  if (pageKey === "hangman") {
    initializeHangmanGame();
  }

  if (pageKey === "days") {
    updateTogetherPage(); // Refresh immediately when visiting the days page
  }
}

/* =========================================================
   ALBUM INTERACTIONS
========================================================= */
function setupAlbumInteractions() {
  setupAlbumScrollButtons();
  setupAlbumImageHoverEffects();
  setupAlbumKeyboardAccessibility();
}

// Allows the user to nudge the album left/right using the buttons.
function setupAlbumScrollButtons() {
  if (els.album.scrollLeftBtn) {
    els.album.scrollLeftBtn.addEventListener("click", () => {
      scrollAlbumBy(-320);
    });
  }

  if (els.album.scrollRightBtn) {
    els.album.scrollRightBtn.addEventListener("click", () => {
      scrollAlbumBy(320);
    });
  }
}

// Performs the actual scrolling animation by the provided offset.
function scrollAlbumBy(offset) {
  if (!els.album.container) return;

  els.album.container.scrollBy({
    left: offset,
    behavior: "smooth"
  });
}

// Adds a soft glow and lift when hovering over photos.
function setupAlbumImageHoverEffects() {
  els.album.images.forEach((img) => {
    img.addEventListener("mouseenter", () => {
      img.style.filter = "brightness(1.1) saturate(1.2)";
      setTimeout(() => {
        img.style.transform = "scale(1.15) translateY(-20px)";
      }, 50);
    });

    img.addEventListener("mouseleave", () => {
      img.style.filter = "brightness(1) saturate(1)";
      img.style.transform = "scale(1) translateY(0)";
    });
  });
}

// Ensures every photo can be focused and opened with the keyboard.
function setupAlbumKeyboardAccessibility() {
  els.album.images.forEach((img) => {
    img.setAttribute("tabindex", "0");

    img.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFullscreenImage(img.src);
      }
    });

    img.addEventListener("click", () => {
      openFullscreenImage(img.src);
    });
  });
}

// Starts the rotating album captions with fade/slide transitions.
function startAlbumMessageRotation() {
  if (!els.album.message) return;

  stopAlbumMessageRotation(); // Avoid duplicate intervals

  STATE.albumMessageIndex = getRandomIndex(LOVE_MESSAGES.length);
  els.album.message.textContent = LOVE_MESSAGES[STATE.albumMessageIndex];

  STATE.albumMessageIntervalId = setInterval(() => {
    if (!els.album.message) return;

    els.album.message.classList.add("message-fade-out");

    setTimeout(() => {
      const nextIndex = getDistinctRandomIndex(LOVE_MESSAGES.length, STATE.albumMessageIndex);
      STATE.albumMessageIndex = nextIndex;
      els.album.message.textContent = LOVE_MESSAGES[STATE.albumMessageIndex];
      els.album.message.classList.remove("message-fade-out");
      els.album.message.classList.add("message-slide-in");

      setTimeout(() => {
        if (els.album.message) {
          els.album.message.classList.remove("message-slide-in");
        }
      }, 500);
    }, 250);
  }, ALBUM_MESSAGE_ROTATION_MS);
}

// Stops the rotating captions when leaving the album page.
function stopAlbumMessageRotation() {
  if (STATE.albumMessageIntervalId) {
    clearInterval(STATE.albumMessageIntervalId);
    STATE.albumMessageIntervalId = null;
  }

  if (els.album.message) {
    els.album.message.classList.remove("message-fade-out", "message-slide-in");
  }
}

/* =========================================================
   FULLSCREEN VIEWER
========================================================= */
function setupFullscreenViewer() {
  if (!els.album.fullscreen || !els.album.fullscreenImage) return;

  els.album.fullscreen.addEventListener("click", () => {
    els.album.fullscreen.style.display = "none";
    els.album.fullscreenImage.src = "";
  });
}

// Shows the fullscreen overlay with the selected image.
function openFullscreenImage(src) {
  if (!els.album.fullscreen || !els.album.fullscreenImage) return;

  els.album.fullscreen.style.display = "flex";
  els.album.fullscreenImage.src = src;
}

/* =========================================================
   HANGMAN GAME LOGIC
========================================================= */
function initializeHangmanGame() {
  const wordDisplay = document.getElementById("word-display");
  const incorrectLettersContainer = document.getElementById("incorrect-letters");
  const gameStatus = document.getElementById("game-status");
  const letterInput = document.getElementById("letter-input");
  const guessBtn = document.getElementById("guess-btn");
  const newGameBtn = document.getElementById("new-game-btn");

  if (!wordDisplay || !incorrectLettersContainer || !gameStatus || !letterInput || !guessBtn || !newGameBtn) {
    return;
  }

  resetHangmanState();
  renderHangmanWord();
  updateIncorrectLetters();
  updateGameStatus();
  configureHangmanControls(letterInput, guessBtn, newGameBtn);
}

// Normalises the displayed word back to its initial state.
function resetHangmanState() {
  STATE.hangman = {
    word: normaliseHangmanWord(HANGMAN_WORD),
    guessedLetters: new Set(),
    incorrectLetters: new Set(),
    maxIncorrect: 6,
    gameOver: false,
    won: false
  };
}

// Displays the word with underscores while preserving spaces and apostrophes.
function renderHangmanWord() {
  const wordDisplay = document.getElementById("word-display");
  if (!wordDisplay) return;

  wordDisplay.innerHTML = "";
  const originalChars = Array.from(HANGMAN_WORD);

  originalChars.forEach((char) => {
    const letterSpace = document.createElement("div");
    letterSpace.className = "letter-space";

    if (char === " ") {
      letterSpace.innerHTML = "&nbsp;";
      letterSpace.style.border = "none";
      letterSpace.style.width = "1rem";
    } else if (char === "'") {
      letterSpace.textContent = "'";
      letterSpace.style.border = "none";
      letterSpace.style.width = "0.5rem";
    } else if (STATE.hangman.guessedLetters.has(char.toLowerCase())) {
      letterSpace.textContent = char;
      letterSpace.classList.add("revealed");
    }

    wordDisplay.appendChild(letterSpace);
  });
}

// Re-renders the incorrect letters list with delete animations.
function updateIncorrectLetters() {
  const incorrectLettersContainer = document.getElementById("incorrect-letters");
  if (!incorrectLettersContainer) return;

  incorrectLettersContainer.innerHTML = "";

  STATE.hangman.incorrectLetters.forEach((letter) => {
    const element = document.createElement("div");
    element.className = "incorrect-letter";
    element.textContent = letter.toUpperCase();
    element.addEventListener("click", () => deleteIncorrectLetter(element, letter));
    incorrectLettersContainer.appendChild(element);
  });
}

// Handles the animation when removing an incorrect letter from the list.
function deleteIncorrectLetter(element, letter) {
  element.classList.add("deleting");
  setTimeout(() => {
    STATE.hangman.incorrectLetters.delete(letter);
    updateIncorrectLetters();
    updateGameStatus();
  }, 600);
}

// Updates the status line (remaining guesses or win/lose messages).
function updateGameStatus() {
  const gameStatus = document.getElementById("game-status");
  if (!gameStatus) return;

  if (STATE.hangman.won) {
    gameStatus.textContent = "Ba7ebek ya 3omry 🤞🏼❤️";
    gameStatus.style.color = "#4CAF50";
  } else if (STATE.hangman.gameOver) {
    gameStatus.textContent = "Game Over! Try again!";
    gameStatus.style.color = "#ff6b6b";
  } else {
    const remaining = STATE.hangman.maxIncorrect - STATE.hangman.incorrectLetters.size;
    gameStatus.textContent = `Incorrect guesses remaining: ${remaining}`;
    gameStatus.style.color = "var(--accent)";
  }
}

// Binds click/keyboard events for the hangman controls.
function configureHangmanControls(letterInput, guessBtn, newGameBtn) {
  guessBtn.onclick = () => makeHangmanGuess(letterInput);
  newGameBtn.onclick = initializeHangmanGame;
  letterInput.value = "";
  letterInput.focus();

  letterInput.onkeypress = (event) => {
    if (event.key === "Enter") {
      makeHangmanGuess(letterInput);
    }
  };

  letterInput.oninput = (event) => {
    event.target.value = event.target.value.replace(/[^a-zA-Z]/g, "").toLowerCase();
  };
}

// Processes a single letter guess from the player.
function makeHangmanGuess(input) {
  if (STATE.hangman.gameOver) return;

  const letter = input.value.toLowerCase();

  if (!letter || letter.length !== 1) {
    input.style.borderColor = "#ff6b6b";
    setTimeout(() => input.style.borderColor = "var(--accent)", 1000);
    return;
  }

  if (STATE.hangman.guessedLetters.has(letter)) {
    input.style.borderColor = "#ffa500";
    setTimeout(() => input.style.borderColor = "var(--accent)", 1000);
    return;
  }

  STATE.hangman.guessedLetters.add(letter);

  if (STATE.hangman.word.includes(letter)) {
    renderHangmanWord();
    checkHangmanWin();
  } else {
    STATE.hangman.incorrectLetters.add(letter);
    updateIncorrectLetters();
    checkHangmanLoss();
  }

  updateGameStatus();
  input.value = "";
  input.focus();
}

// Checks if the player has successfully guessed the entire word.
function checkHangmanWin() {
  const allLettersGuessed = STATE.hangman.word.split("").every((letter) =>
    STATE.hangman.guessedLetters.has(letter)
  );

  if (allLettersGuessed) {
    STATE.hangman.won = true;
    STATE.hangman.gameOver = true;
    updateGameStatus();
  }
}

// Ends the game if the player runs out of attempts.
function checkHangmanLoss() {
  if (STATE.hangman.incorrectLetters.size >= STATE.hangman.maxIncorrect) {
    STATE.hangman.gameOver = true;
    updateGameStatus();
  }
}

/* =========================================================
   DAYS TOGETHER PAGE
========================================================= */
function startTogetherCounter() {
  updateTogetherPage(); // Prime the UI immediately

  if (STATE.togetherIntervalId) {
    clearInterval(STATE.togetherIntervalId);
  }

  STATE.togetherIntervalId = setInterval(updateTogetherPage, TOGETHER_UPDATE_INTERVAL_MS);
}

function updateTogetherPage() {
  if (!els.days.daysCount || !els.days.weeksCount || !els.days.hoursCount || !els.days.breakdown) {
    return;
  }

  const now = new Date();
  const start = RELATIONSHIP_START;

  if (Number.isNaN(start.getTime()) || Number.isNaN(RELATIONSHIP_REFERENCE_DATE.getTime())) {
    els.days.daysCount.textContent = "—";
    els.days.weeksCount.textContent = "—";
    els.days.hoursCount.textContent = "—";
    els.days.breakdown.innerHTML = `<span class="breakdown-line breakdown-line--single">Set RELATIONSHIP_START</span>`;
    return;
  }

  const diffFromReferenceMs = now.getTime() - RELATIONSHIP_REFERENCE_DATE.getTime();
  const additionalDays = Math.floor(diffFromReferenceMs / MS_PER_DAY);
  const additionalHours = Math.floor(diffFromReferenceMs / MS_PER_HOUR);

  const totalDays = RELATIONSHIP_REFERENCE_TOTAL_DAYS + additionalDays;
  const totalWeeks = Math.floor(totalDays / 7);
  const totalHours = RELATIONSHIP_REFERENCE_TOTAL_HOURS + additionalHours;

  const virtualCurrent = addDays(start, Math.max(totalDays, 0));
  const { years, months, days } = calculateCalendarBreakdown(start, virtualCurrent);
  const breakdownSegments = [];
  if (years) breakdownSegments.push({ value: years, unit: years === 1 ? "year" : "years" });
  if (months) breakdownSegments.push({ value: months, unit: months === 1 ? "month" : "months" });
  if (days) breakdownSegments.push({ value: days, unit: days === 1 ? "day" : "days" });

  els.days.daysCount.textContent = Math.max(totalDays, 0).toLocaleString();
  els.days.weeksCount.textContent = Math.max(totalWeeks, 0).toLocaleString();
  els.days.hoursCount.textContent = Math.max(totalHours, 0).toLocaleString();

  if (breakdownSegments.length === 0 || totalDays < 1) {
    els.days.breakdown.innerHTML = `<span class="breakdown-line breakdown-line--single">Less than a day</span>`;
    return;
  }

  const breakdownMarkup = breakdownSegments
    .map((segment) => `
      <span class="breakdown-line">
        <span class="breakdown-value">${segment.value.toLocaleString()}</span>
        <span class="breakdown-unit">${segment.unit}</span>
      </span>
    `)
    .join("");

  els.days.breakdown.innerHTML = breakdownMarkup;
}

/* =========================================================
   HELPER UTILITIES
========================================================= */
// Returns a random index from 0..length-1.
function getRandomIndex(length) {
  if (length <= 0) return 0;
  return Math.floor(Math.random() * length);
}

// Returns a random index different from the current one to avoid repeating the same message.
function getDistinctRandomIndex(length, currentIndex) {
  if (length <= 1) return 0;

  let index = getRandomIndex(length);
  while (index === currentIndex) {
    index = getRandomIndex(length);
  }
  return index;
}

// Normalises a hangman phrase by stripping non-letter characters and lowercasing it.
function normaliseHangmanWord(word) {
  return word.toLowerCase().replace(/[^a-z]/g, "");
}

function calculateCalendarBreakdown(startDate, endDate) {
  const start = new Date(startDate.getTime());
  const end = new Date(endDate.getTime());

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    const previousMonth = new Date(end.getFullYear(), end.getMonth(), 0);
    days += previousMonth.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

function addDays(date, numberOfDays) {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + numberOfDays);
  return result;
}
