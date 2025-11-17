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
const ANNIVERSARY_START = new Date(2025, 10, 16); // Nov 16, 2025 (month is zero-based)
const ANNIVERSARY_END = new Date(2025, 11, 16); // Dec 16, 2025

// Rotating affirmations shared across pages.
const LOVE_MESSAGES = [
  "You're my safe place ❤️",
  "Forever isn't enough with you 💕",
  "My world is brighter with you 🌎",
  "I'll always choose you, in every lifetime 🤞🏼❤️",
  "You are my forever love 🤞🏼❤️"
];


/* =========================================================
   GLOBAL STATE
========================================================= */
const STATE = {
  typewriterIndex: 0, // Tracks current character position for the typewriter animation
  letterTypewriterIndex: 0, // Tracks current character position for the letter title typewriter
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
  confettiIntervalId: null, // Interval for anniversary confetti
  daysNextButtonTimeoutId: null // Timeout to reveal the days page next button
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

  // Containers for each "page" of the experience
  pages: {
    main: document.getElementById("main-content"),
    album: document.getElementById("album-page"),
    days: document.getElementById("together-page"),
    letter: document.getElementById("letter-page")
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
    yearsDisplay: document.getElementById("years-display"),
    togetherDetails: document.getElementById("together-details"),
    daysCount: document.getElementById("days-count"),
    weeksCount: document.getElementById("weeks-count"),
    hoursCount: document.getElementById("hours-count"),
    breakdown: document.getElementById("years-months-count"),
    nextButton: document.getElementById("days-next-btn")
  },

  // Letter page
  letter: {
    page: document.getElementById("letter-page"),
    nextButton: document.getElementById("letter-next-btn")
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
  days: {
    show: () => {
      if (els.pages.days) els.pages.days.style.display = "flex";
    },
    hide: () => {
      if (els.pages.days) els.pages.days.style.display = "none";
    }
  },
  letter: {
    show: () => {
      if (els.pages.letter) els.pages.letter.style.display = "flex";
    },
    hide: () => {
      if (els.pages.letter) els.pages.letter.style.display = "none";
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
  setupDaysPageInteractions();
  setupLetterPageInteractions();
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

  goToPage("days");
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
  if (els.main.clickButton) {
    els.main.clickButton.addEventListener("click", () => {
      goToPage("days");
    });
  }
}

// Runs once when the password is correct to configure messages, hearts, and button timing.
function startMainExperience() {
  if (STATE.mainInitialised) return; // Prevent duplicating intervals and listeners
  STATE.mainInitialised = true;

  prepareMainMessages();
  showRandomMainMessage();
  startHeartSpawner();
  // Show the action button immediately (no countdown)
  if (els.main.clickButton) {
    els.main.clickButton.style.display = "inline-block";
  }
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
      { id: "nav-message", page: "days" },
      { id: "nav-album", page: "album" },
      { id: "nav-letter", page: "letter" },
      { id: "nav-message-album", page: "days" },
      { id: "nav-album-album", page: "album" },
      { id: "nav-letter-album", page: "letter" },
      { id: "nav-message-days", page: "days" },
      { id: "nav-album-days", page: "album" },
      { id: "nav-letter-days", page: "letter" },
      { id: "nav-message-letter", page: "days" },
      { id: "nav-album-letter", page: "album" },
      { id: "nav-letter-letter", page: "letter" }
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
  if (pageKey !== "album") {
    stopAlbumMessageRotation();
  }

  if (pageKey === "days") {
    showYearsFirst(); // Show "2 Years" first, then details
    startAnniversaryConfetti();
    scheduleDaysNextButton();
  } else {
    stopAnniversaryConfetti();
    hideDaysNextButton();
  }

  if (pageKey === "letter") {
    resetLetterNextButton();
    if (els.letter.page) {
      els.letter.page.scrollTo({ top: 0, behavior: "smooth" });
    }
    startLetterTypewriter(); // Start typing "Jannah,"
    updateLetterHours(); // Update the hours count in the letter
  }
}

/* =========================================================
   ALBUM INTERACTIONS
========================================================= */
function setupAlbumInteractions() {
  setupAlbumScrollButtons();
  setupAlbumImageHoverEffects();
  setupAlbumKeyboardAccessibility();

  // Keep album caption static (no rotation)
  if (els.album.message) {
    els.album.message.textContent = LOVE_MESSAGES[0];
  }
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
   DAYS TOGETHER PAGE
========================================================= */
function startTogetherCounter() {
  updateTogetherPage(); // Prime the UI immediately

  if (STATE.togetherIntervalId) {
    clearInterval(STATE.togetherIntervalId);
  }

  STATE.togetherIntervalId = setInterval(updateTogetherPage, TOGETHER_UPDATE_INTERVAL_MS);
}

// Shows "2 Years" prominently first, then reveals the detailed breakdown after a delay
function showYearsFirst() {
  if (!els.days.yearsDisplay || !els.days.togetherDetails) return;

  // Show "2 Years" display
  els.days.yearsDisplay.style.display = "flex";
  els.days.togetherDetails.style.display = "none";

  // After 3 seconds, hide "2 Years" and show detailed breakdown
  setTimeout(() => {
    if (els.days.yearsDisplay && els.days.togetherDetails) {
      els.days.yearsDisplay.style.display = "none";
      els.days.togetherDetails.style.display = "block";
      updateTogetherPage(); // Update the detailed breakdown
    }
  }, 3000);
}

function updateTogetherPage() {
  if (!els.days.daysCount || !els.days.weeksCount || !els.days.hoursCount || !els.days.breakdown) {
    return;
  }

  // Keep confetti alive if the anniversary window is active and we're already on the page
  if (els.pages.days && els.pages.days.style.display !== "none") {
    startAnniversaryConfetti();
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
   ANNIVERSARY CONFETTI (Nov 16 – Dec 16, 2025)
========================================================= */
function isAnniversaryWindow(now = new Date()) {
  return now >= ANNIVERSARY_START && now < ANNIVERSARY_END;
}

function startAnniversaryConfetti() {
  if (!isAnniversaryWindow()) {
    stopAnniversaryConfetti();
    return;
  }

  if (STATE.confettiIntervalId) return;

  let container = document.getElementById("confetti-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "confetti-container";
    document.body.appendChild(container);
  }

  STATE.confettiIntervalId = setInterval(() => {
    for (let i = 0; i < 12; i += 1) {
      container.appendChild(createConfettiPiece());
    }
  }, 400);
}

function stopAnniversaryConfetti() {
  if (STATE.confettiIntervalId) {
    clearInterval(STATE.confettiIntervalId);
    STATE.confettiIntervalId = null;
  }

  const container = document.getElementById("confetti-container");
  if (container) {
    container.innerHTML = "";
  }
}

function createConfettiPiece() {
  const piece = document.createElement("div");
  piece.className = "confetti-piece";
  const colors = ["#e75480", "#ffb3c6", "#ffd166", "#7dd3fc", "#b5e48c"];
  piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
  piece.style.left = `${Math.random() * 100}vw`;
  piece.style.animationDuration = `${2.5 + Math.random() * 1.5}s`;
  piece.style.transform = `rotate(${Math.random() * 360}deg)`;

  piece.addEventListener("animationend", () => {
    piece.remove();
  });

  return piece;
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

/* =========================================================
   ANNIVERSARY LETTER PAGE
========================================================= */
function setupLetterPageInteractions() {
  if (!els.letter.page) return;

  const checkScrollPosition = () => {
    const { scrollTop, clientHeight, scrollHeight } = els.letter.page;
    const atBottom = scrollTop + clientHeight >= scrollHeight - 10;

    if (atBottom && els.letter.nextButton) {
      els.letter.nextButton.classList.add("show");
    }
  };

  els.letter.page.addEventListener("scroll", checkScrollPosition);

  if (els.letter.nextButton) {
    els.letter.nextButton.addEventListener("click", () => {
      triggerLetterNextButtonAnimation();
      goToPage("album");
    });
  }

  resetLetterNextButton();
  checkScrollPosition();
}

function setupDaysPageInteractions() {
  if (!els.days.nextButton) return;
  els.days.nextButton.addEventListener("click", () => {
    goToPage("letter");
  });
}

function scheduleDaysNextButton() {
  hideDaysNextButton();

  STATE.daysNextButtonTimeoutId = setTimeout(() => {
    if (els.days.nextButton) {
      els.days.nextButton.classList.add("show");
    }
  }, 5000);
}

function hideDaysNextButton() {
  if (STATE.daysNextButtonTimeoutId) {
    clearTimeout(STATE.daysNextButtonTimeoutId);
    STATE.daysNextButtonTimeoutId = null;
  }

  if (els.days.nextButton) {
    els.days.nextButton.classList.remove("show");
  }
}

function resetLetterNextButton() {
  if (els.letter.nextButton) {
    els.letter.nextButton.classList.remove("show");
    els.letter.nextButton.classList.remove("is-animating");
  }
}

function triggerLetterNextButtonAnimation() {
  if (!els.letter.nextButton) return;
  els.letter.nextButton.classList.remove("is-animating");
  // Force reflow so the animation can restart
  void els.letter.nextButton.offsetWidth;
  els.letter.nextButton.classList.add("is-animating");
}

// Types out "Jannah," with typewriter effect, then shows the letter content
function startLetterTypewriter() {
  const letterTitle = document.getElementById("letter-title");
  const letterContent = document.getElementById("letter-content");
  
  if (!letterTitle) return;

  // Reset state
  STATE.letterTypewriterIndex = 0;
  letterTitle.textContent = "";
  
  // Hide content initially
  if (letterContent) {
    letterContent.style.display = "none";
  }

  const LETTER_TITLE_TEXT = "Jannah,";
  
  function typeLetterTitle() {
    if (STATE.letterTypewriterIndex < LETTER_TITLE_TEXT.length) {
      letterTitle.textContent += LETTER_TITLE_TEXT.charAt(STATE.letterTypewriterIndex);
      STATE.letterTypewriterIndex += 1;
      setTimeout(typeLetterTitle, 150);
    } else {
      // After typing is complete, show the letter content with fade-in
      if (letterContent) {
        letterContent.style.display = "block";
        letterContent.style.opacity = "0";
        letterContent.style.transition = "opacity 0.5s ease";
        setTimeout(() => {
          if (letterContent) {
            letterContent.style.opacity = "1";
          }
        }, 50);
      }
    }
  }
  
  typeLetterTitle();
}

// Updates the hours count in the letter
function updateLetterHours() {
  const letterHoursElement = document.getElementById("letter-hours");
  if (!letterHoursElement) return;

  const now = new Date();
  const start = RELATIONSHIP_START;

  if (Number.isNaN(start.getTime()) || Number.isNaN(RELATIONSHIP_REFERENCE_DATE.getTime())) {
    letterHoursElement.textContent = "17,566";
    return;
  }

  const diffFromReferenceMs = now.getTime() - RELATIONSHIP_REFERENCE_DATE.getTime();
  const additionalHours = Math.floor(diffFromReferenceMs / MS_PER_HOUR);
  const totalHours = RELATIONSHIP_REFERENCE_TOTAL_HOURS + additionalHours;

  letterHoursElement.textContent = Math.max(totalHours, 17566).toLocaleString();
}
