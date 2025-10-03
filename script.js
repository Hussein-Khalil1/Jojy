/* Typewriter Effect */
const titleText = "Hi Jojy, Please Enter Password";
const titleElement = document.getElementById("password-title");
let charIndex = 0;
function typeWriter() {
  if (charIndex < titleText.length) {
    titleElement.textContent += titleText.charAt(charIndex);
    charIndex++;
    setTimeout(typeWriter, 150);
  }
}
window.onload = typeWriter;

/* Password Validation */
const overlay = document.getElementById("password-overlay");
const input = document.getElementById("password-input");
const mainContent = document.getElementById("main-content");
let failedAttempts = 0;

input.addEventListener("keypress", function(e) {
  if (e.key === "Enter") {
    if (input.value === "Jannah") {
      overlay.style.display = "none";
      mainContent.style.display = "flex";
      startPage();
    } else {
      failedAttempts++;
      input.classList.add("shake");
      setTimeout(() => input.classList.remove("shake"), 300);
      input.value = "";
      if (failedAttempts === 1) document.getElementById("hint1").style.display = "block";
      else if (failedAttempts === 2) document.getElementById("hint2").style.display = "block";
      else if (failedAttempts === 3) document.getElementById("hint3").style.display = "block";
    }
  }
});

/* Main Page Logic */
let messages = [];
let currentIndex = 0;

function startPage() {
  const morningMessages = [
    "Good morning my love ❤️",
    "Saba7 el gamal Jojy",
    "Saba7 el 3asal Jojy",
    "Saba7 el 5eir ya Jojy",
    "3omry w 7ayati, w albi kolo. Saba7 el ward",
    "Good Morning Battaa 🦆",
  ];
  const nightMessages = [
    "Goodnight, my love ❤️",
    "Sweet dreams, Jojy ❤️",
    "Tesba7y 3ala alf 5eir, Ba7ebek ❤️",
    "Sleep well, Jannahhhh 🤞🏼❤️"
  ];
  const dayMessages = [
    "Hope your day is going amazing Battaa 🦆",
    "Thinking of you right now 😁",
    "7ayati w albi, I miss you 🤞🏼❤️"
  ];

  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) messages = morningMessages;
  else if (hour >= 18 || hour < 5) messages = nightMessages;
  else messages = dayMessages;

  currentIndex = Math.floor(Math.random() * messages.length);
  const messageEl = document.getElementById("message");
  messageEl.innerText = messages[currentIndex];

  document.querySelector(".message-box").addEventListener("click", () => {
    currentIndex = (currentIndex + 1) % messages.length;
    messageEl.innerText = messages[currentIndex];
  });

  setTimeout(() => {
    startRotatingMessages("message");
  }, 5000);

  setInterval(() => { for (let i = 0; i < 3; i++) createHeart(); }, 1000);

  // Timer is now handled by CSS animation
  setTimeout(() => {
    document.getElementById("click-btn").style.display = "inline-block";
  }, 20000);
}

function createHeart() {
  const heart = document.createElement('div');
  heart.className = 'heart';
  heart.innerText = '❤️';
  heart.style.left = Math.random() * 100 + 'vw';
  heart.style.top = '100vh';
  const size = Math.random() * 1.5 + 1.2;
  heart.style.fontSize = size + 'rem';
  heart.style.opacity = Math.random() < 0.6 ? 0.9 : 0.4;
  heart.style.animationDuration = (Math.random() * 5 + 4) + 's';
  document.getElementById("hearts-container").appendChild(heart);
  setTimeout(() => heart.remove(), parseFloat(heart.style.animationDuration) * 1000);
}

/* Album Page */
const clickBtn = document.getElementById("click-btn");
const albumPage = document.getElementById("album-page");
const mainContentBox = document.getElementById("main-content");
const albumContainer = document.getElementById("album");
const scrollLeftBtn = document.getElementById("scroll-left");
const scrollRightBtn = document.getElementById("scroll-right");

clickBtn.addEventListener("click", () => {
  mainContentBox.style.display = "none";
  albumPage.style.setProperty("display", "flex", "important");

  const albumMessageEl = document.getElementById("album-rotating-message");
  
  // Use love messages for album page
  let albumMsgIndex = Math.floor(Math.random() * loveMessages.length);
  albumMessageEl.textContent = loveMessages[albumMsgIndex];
  
  // Clear any existing interval
  if (window.albumMessageInterval) {
    clearInterval(window.albumMessageInterval);
  }
  
  // Continue with random order
  window.albumMessageInterval = setInterval(() => {
    // Fade out current message
    albumMessageEl.classList.add('message-fade-out');
    
    setTimeout(() => {
      let newIndex;
      do {
        newIndex = Math.floor(Math.random() * loveMessages.length);
      } while (newIndex === albumMsgIndex && loveMessages.length > 1);
      albumMsgIndex = newIndex;
      albumMessageEl.textContent = loveMessages[albumMsgIndex];
      
      // Remove fade-out class and add slide-in animation
      albumMessageEl.classList.remove('message-fade-out');
      albumMessageEl.classList.add('message-slide-in');
      
      // Remove slide-in class after animation completes
      setTimeout(() => {
        albumMessageEl.classList.remove('message-slide-in');
      }, 500);
    }, 250); // Half of the transition duration
  }, 3000);
});

/* Netflix-style scroll functionality */
scrollLeftBtn.addEventListener("click", () => {
  albumContainer.scrollBy({
    left: -320, // Scroll by one image width + gap
    behavior: 'smooth'
  });
});

scrollRightBtn.addEventListener("click", () => {
  albumContainer.scrollBy({
    left: 320, // Scroll by one image width + gap
    behavior: 'smooth'
  });
});

/* Enhanced hover effects for images */
const albumImages = document.querySelectorAll("#album img");
albumImages.forEach((img, index) => {
  img.addEventListener("mouseenter", () => {
    // Add a subtle glow effect
    img.style.filter = "brightness(1.1) saturate(1.2)";
    
    // Add a small delay before scaling to create smooth effect
    setTimeout(() => {
      img.style.transform = "scale(1.15) translateY(-20px)";
    }, 50);
  });

  img.addEventListener("mouseleave", () => {
    img.style.filter = "brightness(1) saturate(1)";
    img.style.transform = "scale(1) translateY(0)";
  });

  // Add keyboard navigation
  img.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      // Trigger fullscreen
      const fullscreen = document.getElementById("fullscreen");
      const fullscreenImg = fullscreen.querySelector("img");
      fullscreen.style.display = "flex";
      fullscreenImg.src = img.src;
    }
  });

  // Make images focusable for keyboard navigation
  img.setAttribute("tabindex", "0");
});

/* Fullscreen Image */
const fullscreen = document.getElementById("fullscreen");
const fullscreenImg = fullscreen.querySelector("img");
document.querySelectorAll("#album img").forEach(img => {
  img.addEventListener("click", () => {
    fullscreen.style.display = "flex";
    fullscreenImg.src = img.src;
  });
});
fullscreen.addEventListener("click", () => {
  fullscreen.style.display = "none";
});

/* ===============================
   NAVIGATION MENU
=============================== */
const navMenu = document.getElementById("nav-menu");
const hamburger = document.getElementById("hamburger");
const navDropdown = document.getElementById("nav-dropdown");
const navMessage = document.getElementById("nav-message");
const navAlbum = document.getElementById("nav-album");

// Album page navigation elements
const navMenuAlbum = document.getElementById("nav-menu-album");
const hamburgerAlbum = document.getElementById("hamburger-album");
const navDropdownAlbum = document.getElementById("nav-dropdown-album");
const navMessageAlbum = document.getElementById("nav-message-album");
const navAlbumAlbum = document.getElementById("nav-album-album");

// mainContent and albumPage already declared above

// Toggle navigation menu (main content)
if (navMenu) {
  navMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburger.classList.toggle("open");
    navDropdown.classList.toggle("show");
  });
}

// Toggle navigation menu (album page)
if (navMenuAlbum) {
  navMenuAlbum.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburgerAlbum.classList.toggle("open");
    navDropdownAlbum.classList.toggle("show");
  });
}

// Close menus when clicking outside
document.addEventListener("click", (e) => {
  if (navMenu && !navMenu.contains(e.target)) {
    hamburger.classList.remove("open");
    navDropdown.classList.remove("show");
  }
  if (navMenuAlbum && !navMenuAlbum.contains(e.target)) {
    hamburgerAlbum.classList.remove("open");
    navDropdownAlbum.classList.remove("show");
  }
});

// Navigation functionality (main content)
if (navMessage) {
  navMessage.addEventListener("click", () => {
    albumPage.style.display = "none";
    mainContent.style.display = "flex";
    hamburger.classList.remove("open");
    navDropdown.classList.remove("show");
  });
}

if (navAlbum) {
  navAlbum.addEventListener("click", () => {
    mainContent.style.display = "none";
    albumPage.style.setProperty("display", "flex", "important");
    hamburger.classList.remove("open");
    navDropdown.classList.remove("show");
    
    // Show love message instantly and start rotation
    const albumMessageEl = document.getElementById("album-rotating-message");
    let albumMsgIndex = Math.floor(Math.random() * loveMessages.length);
    albumMessageEl.textContent = loveMessages[albumMsgIndex];
    
    // Clear any existing interval
    if (window.albumMessageInterval) {
      clearInterval(window.albumMessageInterval);
    }
    
    // Start message rotation
    window.albumMessageInterval = setInterval(() => {
      // Fade out current message
      albumMessageEl.classList.add('message-fade-out');
      
      setTimeout(() => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * loveMessages.length);
        } while (newIndex === albumMsgIndex && loveMessages.length > 1);
        albumMsgIndex = newIndex;
        albumMessageEl.textContent = loveMessages[albumMsgIndex];
        
        // Remove fade-out class and add slide-in animation
        albumMessageEl.classList.remove('message-fade-out');
        albumMessageEl.classList.add('message-slide-in');
        
        // Remove slide-in class after animation completes
        setTimeout(() => {
          albumMessageEl.classList.remove('message-slide-in');
        }, 500);
      }, 250); // Half of the transition duration
    }, 3000);
  });
}

// Navigation functionality (album page)
if (navMessageAlbum) {
  navMessageAlbum.addEventListener("click", () => {
    albumPage.style.display = "none";
    mainContent.style.display = "flex";
    hamburgerAlbum.classList.remove("open");
    navDropdownAlbum.classList.remove("show");
  });
}

if (navAlbumAlbum) {
  navAlbumAlbum.addEventListener("click", () => {
    mainContent.style.display = "none";
    albumPage.style.setProperty("display", "flex", "important");
    hamburgerAlbum.classList.remove("open");
    navDropdownAlbum.classList.remove("show");
    
    // Show love message instantly and start rotation
    const albumMessageEl = document.getElementById("album-rotating-message");
    let albumMsgIndex = Math.floor(Math.random() * loveMessages.length);
    albumMessageEl.textContent = loveMessages[albumMsgIndex];
    
    // Clear any existing interval
    if (window.albumMessageInterval) {
      clearInterval(window.albumMessageInterval);
    }
    
    // Start message rotation
    window.albumMessageInterval = setInterval(() => {
      // Fade out current message
      albumMessageEl.classList.add('message-fade-out');
      
      setTimeout(() => {
        let newIndex;
        do {
          newIndex = Math.floor(Math.random() * loveMessages.length);
        } while (newIndex === albumMsgIndex && loveMessages.length > 1);
        albumMsgIndex = newIndex;
        albumMessageEl.textContent = loveMessages[albumMsgIndex];
        
        // Remove fade-out class and add slide-in animation
        albumMessageEl.classList.remove('message-fade-out');
        albumMessageEl.classList.add('message-slide-in');
        
        // Remove slide-in class after animation completes
        setTimeout(() => {
          albumMessageEl.classList.remove('message-slide-in');
        }, 500);
      }, 250); // Half of the transition duration
    }, 3000);
  });
}

// Hangman page navigation elements
const navMenuHangman = document.getElementById("nav-menu-hangman");
const hamburgerHangman = document.getElementById("hamburger-hangman");
const navDropdownHangman = document.getElementById("nav-dropdown-hangman");
const navMessageHangman = document.getElementById("nav-message-hangman");
const navAlbumHangman = document.getElementById("nav-album-hangman");
const navHangmanHangman = document.getElementById("nav-hangman-hangman");
const hangmanPage = document.getElementById("hangman-page");

// Toggle navigation menu (hangman page)
if (navMenuHangman) {
  navMenuHangman.addEventListener("click", (e) => {
    e.stopPropagation();
    hamburgerHangman.classList.toggle("open");
    navDropdownHangman.classList.toggle("show");
  });
}

// Close menus when clicking outside (hangman page)
document.addEventListener("click", (e) => {
  if (navMenuHangman && !navMenuHangman.contains(e.target)) {
    hamburgerHangman.classList.remove("open");
    navDropdownHangman.classList.remove("show");
  }
});

// Navigation functionality (hangman page)
if (navMessageHangman) {
  navMessageHangman.addEventListener("click", () => {
    hangmanPage.style.display = "none";
    mainContent.style.display = "flex";
    hamburgerHangman.classList.remove("open");
    navDropdownHangman.classList.remove("show");
  });
}

if (navAlbumHangman) {
  navAlbumHangman.addEventListener("click", () => {
    hangmanPage.style.display = "none";
    albumPage.style.setProperty("display", "flex", "important");
    hamburgerHangman.classList.remove("open");
    navDropdownHangman.classList.remove("show");
  });
}

// Add hangman navigation to existing menus
const navHangman = document.getElementById("nav-hangman");
const navHangmanAlbum = document.getElementById("nav-hangman-album");

if (navHangman) {
  navHangman.addEventListener("click", () => {
    mainContent.style.display = "none";
    albumPage.style.display = "none";
    hangmanPage.style.setProperty("display", "flex", "important");
    hamburger.classList.remove("open");
    navDropdown.classList.remove("show");
    initializeHangmanGame();
  });
}

if (navHangmanAlbum) {
  navHangmanAlbum.addEventListener("click", () => {
    mainContent.style.display = "none";
    albumPage.style.display = "none";
    hangmanPage.style.setProperty("display", "flex", "important");
    hamburgerAlbum.classList.remove("open");
    navDropdownAlbum.classList.remove("show");
    initializeHangmanGame();
  });
}

/* ===============================
   ROTATING LOVE MESSAGES
=============================== */
const loveMessages = [
  "You're my safe place ❤️",
  "Forever isn't enough with you 💕",
  "My world is brighter with you 🌎",
  "I'll always choose you, in every lifetime 🤞🏼❤️",
  "You are my forever love 🤞🏼❤️"
];

function startRotatingMessages(targetId) {
  const messagesEl = document.getElementById(targetId);
  let msgIndex = 0;
  setInterval(() => {
    messagesEl.textContent = loveMessages[msgIndex];
    msgIndex = (msgIndex + 1) % loveMessages.length;
  }, 5000);
}

/* ===============================
   HANGMAN GAME
=============================== */
const hangmanWord = "I'll love you until forever";
let gameState = {
  word: hangmanWord.toLowerCase().replace(/[^a-z]/g, ''), // Remove spaces and punctuation
  guessedLetters: new Set(),
  incorrectLetters: new Set(),
  maxIncorrect: 6,
  gameOver: false,
  won: false
};

function initializeHangmanGame() {
  const hangmanPage = document.getElementById("hangman-page");
  const wordDisplay = document.getElementById("word-display");
  const incorrectLettersContainer = document.getElementById("incorrect-letters");
  const gameStatus = document.getElementById("game-status");
  const letterInput = document.getElementById("letter-input");
  const guessBtn = document.getElementById("guess-btn");
  const newGameBtn = document.getElementById("new-game-btn");

  // Reset game state
  gameState = {
    word: hangmanWord.toLowerCase().replace(/[^a-z]/g, ''),
    guessedLetters: new Set(),
    incorrectLetters: new Set(),
    maxIncorrect: 6,
    gameOver: false,
    won: false
  };

  // Display the word with spaces and punctuation
  displayWord();
  updateIncorrectLetters();
  updateGameStatus();
  
  // Clear input
  letterInput.value = '';
  letterInput.focus();

  // Event listeners
  guessBtn.onclick = makeGuess;
  newGameBtn.onclick = initializeHangmanGame;
  letterInput.onkeypress = (e) => {
    if (e.key === 'Enter') makeGuess();
  };

  // Only allow letters
  letterInput.oninput = (e) => {
    e.target.value = e.target.value.replace(/[^a-zA-Z]/g, '').toLowerCase();
  };
}

function displayWord() {
  const wordDisplay = document.getElementById("word-display");
  wordDisplay.innerHTML = '';
  
  for (let i = 0; i < hangmanWord.length; i++) {
    const char = hangmanWord[i];
    const letterSpace = document.createElement('div');
    letterSpace.className = 'letter-space';
    
    if (char === ' ') {
      letterSpace.innerHTML = '&nbsp;';
      letterSpace.style.border = 'none';
      letterSpace.style.width = '1rem';
    } else if (char === "'" || char === "'") {
      letterSpace.innerHTML = "'";
      letterSpace.style.border = 'none';
      letterSpace.style.width = '0.5rem';
    } else if (gameState.guessedLetters.has(char.toLowerCase())) {
      letterSpace.textContent = char;
      letterSpace.classList.add('revealed');
    }
    
    wordDisplay.appendChild(letterSpace);
  }
}

function updateIncorrectLetters() {
  const incorrectLettersContainer = document.getElementById("incorrect-letters");
  incorrectLettersContainer.innerHTML = '';
  
  gameState.incorrectLetters.forEach(letter => {
    const letterElement = document.createElement('div');
    letterElement.className = 'incorrect-letter';
    letterElement.textContent = letter.toUpperCase();
    letterElement.onclick = () => deleteIncorrectLetter(letterElement, letter);
    incorrectLettersContainer.appendChild(letterElement);
  });
}

function deleteIncorrectLetter(element, letter) {
  element.classList.add('deleting');
  setTimeout(() => {
    gameState.incorrectLetters.delete(letter);
    updateIncorrectLetters();
    updateGameStatus();
  }, 600);
}

function updateGameStatus() {
  const gameStatus = document.getElementById("game-status");
  
  if (gameState.won) {
    gameStatus.textContent = "Ba7ebek ya 3omry 🤞🏼❤️";
    gameStatus.style.color = "#4CAF50";
  } else if (gameState.gameOver) {
    gameStatus.textContent = "Game Over! Try again!";
    gameStatus.style.color = "#ff6b6b";
  } else {
    const remaining = gameState.maxIncorrect - gameState.incorrectLetters.size;
    gameStatus.textContent = `Incorrect guesses remaining: ${remaining}`;
    gameStatus.style.color = "var(--accent)";
  }
}

function makeGuess() {
  if (gameState.gameOver) return;
  
  const letterInput = document.getElementById("letter-input");
  const letter = letterInput.value.toLowerCase();
  
  if (!letter || letter.length !== 1) {
    letterInput.style.borderColor = "#ff6b6b";
    setTimeout(() => letterInput.style.borderColor = "var(--accent)", 1000);
    return;
  }
  
  if (gameState.guessedLetters.has(letter)) {
    letterInput.style.borderColor = "#ffa500";
    setTimeout(() => letterInput.style.borderColor = "var(--accent)", 1000);
    return;
  }
  
  gameState.guessedLetters.add(letter);
  
  if (gameState.word.includes(letter)) {
    displayWord();
    checkWin();
  } else {
    gameState.incorrectLetters.add(letter);
    updateIncorrectLetters();
    checkLose();
  }
  
  updateGameStatus();
  letterInput.value = '';
  letterInput.focus();
}

function checkWin() {
  const allLettersGuessed = gameState.word.split('').every(letter => 
    gameState.guessedLetters.has(letter)
  );
  
  if (allLettersGuessed) {
    gameState.won = true;
    gameState.gameOver = true;
    updateGameStatus();
  }
}

function checkLose() {
  if (gameState.incorrectLetters.size >= gameState.maxIncorrect) {
    gameState.gameOver = true;
    updateGameStatus();
  }
}
