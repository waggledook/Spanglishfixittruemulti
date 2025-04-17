console.log("✅ script.js loaded");

window.generateQRCode = function generateQRCode(url, elementId = "qr-code") {
  const qrContainer = document.getElementById(elementId);
  if (!qrContainer) return;

  qrContainer.innerHTML = ""; // Clear any previous QR
  new QRCode(qrContainer, {
    text: url,
    width: 160,
    height: 160,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
};

// Global variables for session and player tracking
let currentSessionId = null;
let currentPlayerId = null;

// how many players before the host can start, and max slots
const MIN_PLAYERS = 2;
const MAX_PLAYERS = 6;
const sessionParam = new URLSearchParams(window.location.search).get("session");

window.addEventListener("load", () => {
  // Debug: is this listener firing, and do we see a session param?
  console.log("🏁 window.load fired. location.search =", window.location.search);

  const sessionFromURL = new URLSearchParams(window.location.search).get("session");
  console.log("   sessionFromURL =", sessionFromURL);

  if (sessionFromURL) {
    promptForPlayerName((name) => {
      currentSessionId = sessionFromURL;
      currentPlayerId  = name;
      joinGameSession(currentSessionId, currentPlayerId);
    });
  }
});

class SpanglishFixitGame {
    constructor(sentences) {
        this.originalSentences = sentences;
        this.sentences = this.shuffle([...sentences].slice(0, 15));
        this.sentences.forEach(s => {
          s.clickedWord   = null;  // The word the player clicked
          s.studentAnswer = null;  // What the user typed
          s.wasCorrect    = null;  // Boolean indicating if the answer was correct
        });
        this.currentIndex = 0;
        this.score = 0;
        this.wrongAnswers = [];
        this.totalSentences = 15; // Each game has 15 sentences.
        this.interval = null;
        this.gameActive = false;
        this.reviewMode = false;
        this.currentErrorWord = null; // Track the selected error word

        // Define methods before binding them

        this.startReview = () => {
    if (this.wrongAnswers.length === 0) return;
    this.reviewMode = true;
    this.currentIndex = 0;
    
    // Re-show the answer input for review:
    document.getElementById("answer").style.display = "block";
    
    // Hide the Review button when entering review mode:
    document.getElementById("review").style.display = "none";
    this.updateSentence();
};

        this.setupInputListener = () => {
            document.getElementById("answer").addEventListener("keyup", (event) => {
                if (event.key === "Enter") {
                    this.checkAnswer();
                }
            });
        };

        // Bind the arrow function methods
        this.startReview = this.startReview.bind(this);
        this.setupInputListener = this.setupInputListener.bind(this);

        this.initUI();
    }

    shuffle(array) {
        return array.sort(() => Math.random() - 0.5);
    }

    initUI() {
      console.log("Game script is running!");
      document.title = "Spanglish Fixit Challenge";
      // ← insert it right here:
      const sessionParam = new URLSearchParams(window.location.search).get("session");
      console.log("initUI sees sessionParam =", sessionParam);

  if (sessionParam) {
    // Player joining mode (full UI)
    document.body.innerHTML = `
      <style>
        /* Full Game UI Styles */
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #2E3192, #1BFFFF);
          color: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          min-height: 100vh;
          margin: 0;
          overflow-y: auto;
        }
        /* Instructions overlay */
        #instructions-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        #instructions-box {
          background: #333;
          padding: 20px;
          border-radius: 10px;
          max-width: 500px;
          text-align: left;
        }
        #close-instructions {
          margin-top: 15px;
          padding: 5px 10px;
          background: #28a745;
          border: none;
          border-radius: 5px;
          color: white;
          cursor: pointer;
          transition: 0.3s;
        }
        #close-instructions:hover {
          opacity: 0.8;
        }
        /* Game container styles */
        #game-container {
          background: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
          text-align: center;
          width: 90%;
          max-width: 600px;
          margin-top: 20px;
        }
        /* Input and button styles */
        input, button {
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: none;
          margin: 10px auto;
          display: block;
        }
        button {
          cursor: pointer;
          transition: 0.3s;
        }
        button:hover {
          opacity: 0.8;
        }
        /* —— make the sentence text bigger and tappable —— */
#sentence {
  font-size: 1.5rem;       /* about 24px */
  line-height: 1.4;
}

/* every word becomes a pill-shaped tappable target */
.clickable-word {
  display: inline-block;
  padding: 6px 10px;
  margin: 0 1px;
  font-size: 1.5rem;
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}
.clickable-word:hover {
  background: rgba(255,255,255,0.2);
}

/* after click, we’ll add one of these classes: */
.correct-bubble {
  background-color: #28a745;
  color: #fff;
}
.incorrect-bubble {
  background-color: #e74c3c;
  color: #fff;
}
      </style>
      <!-- Instructions Overlay -->
      <div id="instructions-overlay">
        <div id="instructions-box">
          <h2>How to Play</h2>
          <p>Welcome to the Spanglish Fixit Challenge! Here's what to do:</p>
          <ul>
            <li>Click the incorrect word in each sentence.</li>
            <li>After clicking, type the correct word.</li>
            <li>Your points decrease from 100 to 10 over 30 seconds for each sentence.</li>
            <li>Incorrect clicks lose you 50 points.</li>
            <li>The game ends after 15 sentences.</li>
          </ul>
          <p>Good luck!</p>
          <button id="close-instructions">Got It!</button>
        </div>
      </div>
      <!-- Full Game Container -->
      <div id="game-container">
  <img
    id="titleImage"
    src="images/Spanglish-title.png"
    alt="Spanglish Fixit"
    style="display: block; max-width: 300px; margin: 0 auto;"
  />
        <p id="counter">Sentence: 0/15</p>
        <div id="points-bar-container" style="width:100%; background: #555; height: 10px;">
          <div id="points-bar" style="width: 100%; height: 100%; background: #0f0; transition: width 0.1s linear;"></div>
        </div>
        <p id="sentence"></p>
        <p id="instructionsText">Click the error and type the correction:</p>
        <input type="text" id="answer" autofocus>
        <p id="feedback"></p>
        <p>Score: <span id="score">0</span></p>
        <p>Best Score: <span id="bestScore">0</span></p>
        <button id="restart" style="display: none;">Restart</button>
        <button id="review" style="display: none;">Review Mistakes</button>
      </div>
      <!-- Multiplayer Section (if needed) -->
      <div id="multiplayer-container" style="margin-top: 20px;">
        <!-- Existing multiplayer UI elements can go here -->
      </div>
    `;
  } else {
    // Host mode (minimal UI)
    document.body.innerHTML = `
      <style>
        /* Minimal Host UI Styles */
        body {
          font-family: 'Poppins', sans-serif;
          background: linear-gradient(135deg, #2E3192, #1BFFFF);
          color: white;
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
        }
        /* Instructions overlay */
        #instructions-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        #instructions-box {
          background: #333;
          padding: 20px;
          border-radius: 10px;
          max-width: 500px;
          text-align: left;
        }
        #close-instructions {
          margin-top: 15px;
          padding: 5px 10px;
          background: #28a745;
          border: none;
          border-radius: 5px;
          color: white;
          cursor: pointer;
          transition: 0.3s;
        }
        #close-instructions:hover {
          opacity: 0.8;
        }
        /* Minimal Host Container */
        #host-container {
          margin-top: 20px;
          background: rgba(0, 0, 0, 0.8);
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
          text-align: center;
          width: 90%;
          max-width: 600px;
        }
        #hostGameButton {
          padding: 10px 20px;
          font-size: 18px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          transition: 0.3s;
        }
        #hostGameButton:hover {
          opacity: 0.8;
        }
      </style>
      <!-- Instructions Overlay -->
      <div id="instructions-overlay">
        <div id="instructions-box">
          <h2>How to Play</h2>
          <p>Welcome to the Spanglish Fixit Challenge! Here's what to do:</p>
          <ul>
            <li>Click the incorrect word in each sentence.</li>
            <li>After clicking, type the correct word.</li>
            <li>Your points decrease from 100 to 10 over 30 seconds for each sentence.</li>
            <li>Incorrect clicks lose you 50 points.</li>
            <li>The game ends after 15 sentences.</li>
          </ul>
          <p>Good luck!</p>
          <button id="close-instructions">Got It!</button>
        </div>
      </div>
      <!-- Minimal Host Container -->
      <div id="host-container">
  <img id="titleImage" src="images/Spanglish-title.png" alt="Spanglish Fixit" style="display: block; max-width: 300px; margin: 0 auto;">
  <!-- Dedicated wrapper for the QR code -->
  <div id="host-qr-wrapper" style="display: flex; justify-content: center; align-items: center; gap: 12px; margin-top: 10px;">
  <div id="host-qr-code" style="padding: 10px; background: #fff; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);">
    <!-- QR code will be generated here -->
  </div>
  <button id="copyLinkButton" style="padding: 8px 12px; font-size: 14px; border:none; border-radius:5px; cursor:pointer;">
    Copy link
  </button>
</div>
  </div>
  <button id="hostGameButton" style="display: block; margin: 20px auto 0 auto;">Host Game</button>
</div>
    `;
  }

    // Load jsPDF and AutoTable before other game code runs
function loadScript(url, callback) {
  const script = document.createElement("script");
  script.src = url;
  script.onload = callback;
  document.head.appendChild(script);
}

loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js", () => {
  loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.23/jspdf.plugin.autotable.min.js", () => {
    console.log("jsPDF and AutoTable loaded!");
    // Now you can safely call functions that depend on jsPDF, or initialize your game.
  });
});

loadScript("https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js", () => {
  console.log("QRCode.js loaded!");
});

    // Attach Multiplayer UI event listeners:
    const createBtn = document.getElementById("createMultiplayer");
    const joinBtn = document.getElementById("joinMultiplayer");
    const sessionInput = document.getElementById("sessionIdInput");


function generateQRCode(url, elementId = "qr-code") {
  // By default it uses "qr-code", but we can pass in "host-qr-code"
  const qrContainer = document.getElementById(elementId);
  if (!qrContainer) return;
  
  qrContainer.innerHTML = ""; // Clear any previous QR
  new QRCode(qrContainer, {
    text: url,
    width: 160,
    height: 160,
    colorDark: "#000000",
    colorLight: "#ffffff",
    correctLevel: QRCode.CorrectLevel.H
  });
}

    if (createBtn && joinBtn && sessionInput) {
  // For creating a game (player1)
  createBtn.addEventListener("click", () => {
    promptForPlayerName((name) => {
      currentPlayerId = name; // Use custom name for player1
      currentSessionId = createGameSession(sentences);
      joinGameSession(currentSessionId, currentPlayerId);
      
      // Hide the single-player start button and show waiting message
      document.getElementById("start").style.display = "none";
      const waitingMessage = document.createElement('div');
      waitingMessage.id = 'waiting';
      waitingMessage.style.fontSize = '24px';
      waitingMessage.style.marginTop = '10px';
      waitingMessage.textContent = "Waiting for another player to join...";
      document.getElementById("game-container").appendChild(waitingMessage);
      
      // Mark game as active and show the session ID for sharing
      window.game.gameActive = true;
      console.log("Multiplayer session created & joined as", currentPlayerId, "with session ID:", currentSessionId);
      sessionInput.value = currentSessionId;
    });
  });

  // For joining a game (player2)
  joinBtn.addEventListener("click", () => {
    const roomId = sessionInput.value.trim();
    if (!roomId) return;
    promptForPlayerName((name) => {
      currentSessionId = roomId;
      currentPlayerId = name; // Use custom name for player2
      joinGameSession(currentSessionId, currentPlayerId);
    });
  });
}

   // Attach event listeners common to both modes:

// Always attach the close-instructions listener (present in both UIs)
const closeBtn = document.getElementById("close-instructions");
if (closeBtn) {
  closeBtn.addEventListener("click", () => {
    const overlay = document.getElementById("instructions-overlay");
    if (overlay) overlay.style.display = "none";
  });
}

if (sessionParam) {
  // PLAYER MODE (full UI)
  const restartBtn = document.getElementById("restart");
  if (restartBtn) {
    restartBtn.addEventListener("click", () => this.restartGame());
  }
  const reviewBtn = document.getElementById("review");
  if (reviewBtn) {
    reviewBtn.addEventListener("click", () => this.startReview());
  }
  // Set up gameplay input listener and best score display
  this.setupInputListener();
  this.updateBestScoreDisplay();
} else {
  // HOST MODE (minimal UI)
  const hostBtn = document.getElementById("hostGameButton");
  if (hostBtn) {
    hostBtn.addEventListener("click", () => {
      promptForPlayerName((name) => {
        // Create a game session as a host.
        const sessionId = createHostGameSession(sentences, name);
        currentSessionId = sessionId;
        currentPlayerId = "host"; // Mark client as host

        // Update the host container: hide the host button and show a host label.
        hostBtn.style.display = "none";
        const hostLabel = document.createElement("div");
        hostLabel.id = "host-label";
        hostLabel.style.marginTop = "10px";
        hostLabel.style.fontWeight = "bold";
        hostLabel.textContent = "You are hosting this game";
        const hostContainer = document.getElementById("host-container");
        if (hostContainer) hostContainer.appendChild(hostLabel);

        // Generate the join URL and display the QR code in the host container.
        let baseUrl = (location.hostname === "localhost")
          ? window.location.origin
          : "https://waggledook.github.io/Spanglishfixittruemulti";
        const joinUrl = `${baseUrl}?session=${sessionId}`;

        // Create a container for the QR code if it doesn't exist.
        let qrContainer = document.getElementById("host-qr-code");
        if (!qrContainer && hostContainer) {
          qrContainer = document.createElement("div");
          qrContainer.id = "host-qr-code";
          qrContainer.style.marginTop = "10px";
          hostContainer.appendChild(qrContainer);
        }
        generateQRCode(joinUrl, "host-qr-code");
        // then wire up our copy button:
const copyBtn = document.getElementById("copyLinkButton");
copyBtn.addEventListener("click", () => {
  navigator.clipboard.writeText(joinUrl)
    .then(() => {
      // simple feedback
      copyBtn.textContent = "Copied!";
      setTimeout(() => copyBtn.textContent = "Copy link", 1500);
    })
    .catch(() => alert("Failed to copy. Try again."));
});

        // Attach the realtime listener for the host view.
        joinGameSessionAsHost(sessionId, name);
      });
    });
  }
}
    }

    updateBestScoreDisplay() {
        let storedBest = localStorage.getItem("bestScoreSpanglish") || 0;
        document.getElementById("bestScore").textContent = storedBest;
    }

    updateSentence() {
      // Reset error word selection for the new sentence.
      this.currentErrorWord = null;
      document.getElementById("answer").disabled = false;
    
      if (this.reviewMode) {
        if (this.currentIndex >= this.wrongAnswers.length) {
          document.getElementById("sentence").innerHTML = "Review complete!";
          document.getElementById("answer").style.display = "none";
          document.getElementById("feedback").textContent = "";
          this.reviewMode = false;
          return;
        }
        document.getElementById("counter").textContent = `Review: ${this.currentIndex + 1}/${this.wrongAnswers.length}`;
      } else {
        if (this.currentIndex >= this.totalSentences) {
          this.endGame();
          return;
        }
        document.getElementById("counter").textContent = `Sentence: ${this.currentIndex + 1}/${this.totalSentences}`;
      }
    
      const currentSet = this.reviewMode ? this.wrongAnswers : this.sentences;
      const currentSentence = currentSet[this.currentIndex];
      const sentenceParts = currentSentence.sentence.split(" ");
      let sentenceHTML = sentenceParts.map((word) => `<span class="clickable-word">${word}</span>`).join(" ");
      document.getElementById("sentence").innerHTML = sentenceHTML;
    
      // Re-enable clicking for the new sentence.
      document.getElementById("sentence").style.pointerEvents = "auto";
    
      // Start the 30-second phase timer for scoring (max 100 points, min 10)
      this.startClickTime = Date.now();
      if (this.pointsInterval) clearInterval(this.pointsInterval);
      this.pointsInterval = setInterval(() => {
        let elapsed = Date.now() - this.startClickTime;
        let availablePoints = Math.max(100 - Math.floor(elapsed / 300), 10);
        let percentage = ((availablePoints - 10) / (100 - 10)) * 100;
        document.getElementById("points-bar").style.width = percentage + "%";
      }, 100);
    
      // Attach click listeners to each word.
      const clickableWords = document.querySelectorAll(".clickable-word");
      clickableWords.forEach((wordElement) => {
        wordElement.addEventListener("click", () => {
          this.handleWordClick(wordElement, currentSentence);
        });
      });
    }

    handleWordClick(wordElement, currentSentence) {
    if (this.pointsInterval) {
        clearInterval(this.pointsInterval);
        this.pointsInterval = null;
    }
    const clickedWord = wordElement.textContent;
    // Record the clicked word in the current sentence:
    currentSentence.clickedWord = clickedWord;
    
    const cleanedClickedWord = clickedWord.replace(/[^\w\s]|_/g, "").trim().toLowerCase();
    const cleanedErrorWord = currentSentence.errorWord.replace(/[^\w\s]|_/g, "").trim().toLowerCase();
    const clickTime = Date.now() - this.startClickTime;
        if (this.reviewMode) {
           // clear any previous bubbles
document.querySelectorAll('.clickable-word')
.forEach(el => el.classList.remove('correct-bubble','incorrect-bubble'));

// now bubble the clicked word
if (cleanedClickedWord === cleanedErrorWord) {
wordElement.classList.add('correct-bubble');
} else {
wordElement.classList.add('incorrect-bubble');
}
            const correctWordElements = document.querySelectorAll('.clickable-word');
            correctWordElements.forEach((element) => {
                if (element.textContent.replace(/[^\w\s]|_/g, "").trim().toLowerCase() === cleanedErrorWord) {
                    element.style.color = 'green';
                }
            });
            // Remove listeners so further clicks don’t register
            document.getElementById("sentence").style.pointerEvents = "none";
            this.selectErrorWord(clickedWord);
            return;
        }
        // Normal game mode: update score based on click speed
        if (cleanedClickedWord === cleanedErrorWord) {
            let clickScore = Math.max(100 - Math.floor(clickTime / 300), 10);
            this.score += clickScore;
            // clear any old bubbles then add the green pill
             document.querySelectorAll('.clickable-word')
            .forEach(el => el.classList.remove('correct-bubble','incorrect-bubble'));
            wordElement.classList.add('correct-bubble');
        } else {
            this.score -= 50;
            // clear any old bubbles then add the red pill
            document.querySelectorAll('.clickable-word')
           .forEach(el => el.classList.remove('correct-bubble','incorrect-bubble'));
           wordElement.classList.add('incorrect-bubble');
            if (!this.wrongAnswers.includes(currentSentence)) {
                this.wrongAnswers.push(currentSentence);
            }
        }
        document.getElementById("score").textContent = this.score;
        const correctWordElements = document.querySelectorAll('.clickable-word');
        correctWordElements.forEach((element) => {
            if (element.textContent.replace(/[^\w\s]|_/g, "").trim().toLowerCase() === cleanedErrorWord) {
                element.style.color = 'green';
            }
        });
        // Disable further clicks for this sentence
        document.getElementById("sentence").style.pointerEvents = "none";
        this.selectErrorWord(clickedWord);
    }

    selectErrorWord(word) {
        this.currentErrorWord = word;
        document.getElementById("feedback").textContent = `You selected "${word}". Now, type the correction.`;
        if (this.pointsInterval) {
            clearInterval(this.pointsInterval);
            this.pointsInterval = null;
        }
        this.startCorrectionTime = Date.now();
        document.getElementById("points-bar").style.width = "100%";
        this.pointsInterval = setInterval(() => {
            let elapsed = Date.now() - this.startCorrectionTime;
            let availablePoints = Math.max(100 - Math.floor(elapsed / 300), 10);
            let percentage = ((availablePoints - 10) / (100 - 10)) * 100;
            document.getElementById("points-bar").style.width = percentage + "%";
        }, 100);
        document.getElementById("answer").focus();
    }

    checkAnswer() {
  const input = document.getElementById("answer");
  // If input is already disabled, ignore additional submissions.
  if (input.disabled) return;
  
  // If no error word was clicked yet, do not proceed.
  if (!this.currentErrorWord) {
    document.getElementById("feedback").textContent = "Please click on the incorrect word first!";
    return;
  }
  
  if (this.pointsInterval) {
    clearInterval(this.pointsInterval);
    this.pointsInterval = null;
  }
  if (!this.gameActive && !this.reviewMode) return;
  
  // Disable the input so that the player cannot submit again this round.
  input.disabled = true;

  const userInput = input.value.trim().toLowerCase();
  const currentSet = this.reviewMode ? this.wrongAnswers : this.sentences;
  const currentSentence = currentSet[this.currentIndex];
  const correctionTime = Date.now() - this.startCorrectionTime;
  let possibleAnswers = currentSentence.correctAnswer;
  if (!Array.isArray(possibleAnswers)) {
    possibleAnswers = [possibleAnswers];
  }
  possibleAnswers = possibleAnswers.map(answer => answer.toLowerCase());
  // Record the student's answer and correctness for the final report.
  currentSentence.studentAnswer = userInput;
  currentSentence.wasCorrect = possibleAnswers.includes(userInput);

  // -----------------------
  // REVIEW MODE BRANCH
  // -----------------------
  if (this.reviewMode) {
    if (possibleAnswers.includes(userInput)) {
      let correctionScore = Math.max(100 - Math.floor(correctionTime / 300), 10);
      this.score += correctionScore;
      document.getElementById("score").textContent = this.score;
      input.classList.add("correct");
      document.getElementById("feedback").textContent = `Correct. The answer is: ${possibleAnswers.join(" / ")}`;

      setTimeout(() => {
        input.classList.remove("correct");
        input.value = "";
        // Submit the answer (with answer text) to Firebase so both players sync:
        submitAnswer(this.score, userInput);
        // Then advance to the next sentence locally:
        this.currentIndex++;
        this.currentErrorWord = null;
        this.updateSentence();
      }, 1000);
    } else {
      input.classList.add("incorrect");
      document.getElementById("feedback").textContent = `Incorrect. The correct answer is: ${possibleAnswers.join(" / ")}`;

      setTimeout(() => {
        input.classList.remove("incorrect");
        input.value = "";
        this.currentIndex++;
        this.currentErrorWord = null;
        this.updateSentence();
      }, 1000);
    }
    return;
  }

  // -----------------------
  // NORMAL MODE BRANCH
  // -----------------------
  if (possibleAnswers.includes(userInput)) {
    let correctionScore = Math.max(100 - Math.floor(correctionTime / 300), 10);
    this.score += correctionScore;
    document.getElementById("score").textContent = this.score;
    input.classList.add("correct");
    document.getElementById("feedback").textContent = `Correct. The answer is: ${possibleAnswers.join(" / ")}`;
    
    setTimeout(() => {
      input.classList.remove("correct");
      input.value = "";
      // Submit the answer (with answer text) to Firebase so both players sync:
      submitAnswer(this.score, userInput);
      // (Do not update this.currentIndex or call updateSentence() here; these are updated via Firebase.)
    }, 1000);
  } else {
    this.score -= 50;
    if (!this.wrongAnswers.some(item => item.sentence === currentSentence.sentence)) {
      this.wrongAnswers.push({
        sentence: currentSentence.sentence,
        errorWord: currentSentence.errorWord,
        correctAnswer: currentSentence.correctAnswer,
        studentAnswer: userInput
      });
    }
    document.getElementById("score").textContent = this.score;
    input.classList.add("incorrect");
    document.getElementById("feedback").textContent = `Incorrect. The correct answer is: ${possibleAnswers.join(" / ")}`;
    
    setTimeout(() => {
      input.classList.remove("incorrect");
      input.value = "";
      // Submit the answer (with answer text) to Firebase so both players sync:
      submitAnswer(this.score, userInput);
    }, 1000);
  }
}


    // No overall timer now, so startTimer() is removed.

    endGame() {
      this.gameActive = false;
      if (this.pointsInterval) clearInterval(this.pointsInterval);
    
      // Remove any leftover intermission overlays
      ['intermission','host-intermission'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    
      if (!currentSessionId) return;
    
      const sessionRef = firebase.database().ref('gameSessions/' + currentSessionId);
      sessionRef.once('value').then(snapshot => {
        const data = snapshot.val() || {};
        const playersObj = data.players || {};
    
        // Turn into array, sort by descending score
        const playersArr = Object.values(playersObj)
                                 .sort((a, b) => b.score - a.score);
    
        // Build HTML list of all players
        const listHtml = playersArr.map(p =>
          `<p style="font-size:20px; margin:4px 0;">
             <strong>${p.name}</strong>: ${p.score}
           </p>`
        ).join('');
    
        // Determine winner(s)
        const topScore = playersArr[0]?.score ?? 0;
        const winners  = playersArr
          .filter(p => p.score === topScore)
          .map(p => p.name);
    
        const winnerMessage = winners.length > 1
          ? `It's a tie between ${winners.join(', ')}!`
          : `${winners[0]} wins!`;
    
        // Compose the final HTML
        const finalHtml = `
          <div class="game-over" style="font-size:36px;color:#FFD700;text-shadow:2px 2px 4px #000;">
            Game Over!
          </div>
          <div style="margin:20px 0;">
            ${listHtml}
          </div>
          <div style="font-size:28px;color:#FFFFFF;text-shadow:1px 1px 2px #000;">
            ${winnerMessage}
          </div>
          <button id="restart" style="
            margin-top:20px;
            padding:10px 20px;
            font-size:18px;
            background:#007bff;
            color:white;
            border:none;
            border-radius:5px;
            cursor:pointer;
          ">Restart Game</button>
        `;
    
        // Render for host vs. player
        if (currentPlayerId === 'host') {
          const hostDiv = document.getElementById('host-status');
          if (hostDiv) hostDiv.innerHTML = finalHtml;
        } else {
          document.getElementById('sentence').innerHTML = finalHtml;
        }
    
        // Wire up the Restart button
        document.getElementById('restart')
                .addEventListener('click', () => this.restartGame());
      }).catch(err => console.error('endGame error', err));
    }    

restartGame() {
    this.gameActive = false;
    this.reviewMode = false;
    if (this.pointsInterval) clearInterval(this.pointsInterval);
    this.currentIndex = 0;
    this.score = 0;
    this.wrongAnswers = [];
    this.sentences = this.shuffle([...this.originalSentences].slice(0, 15));

    document.getElementById("score").textContent = this.score;
    document.getElementById("feedback").textContent = "";
    document.getElementById("sentence").textContent = "";
    document.getElementById("answer").value = "";

    // Re-show the answer input
    document.getElementById("answer").style.display = "block";

    // Re-show instructions paragraph
    document.getElementById("instructionsText").style.display = "block";

    // Reset counters, hide review, hide restart, show start
    document.getElementById("counter").textContent = "Sentence: 0/15";
    document.getElementById("review").style.display = "none";
    document.getElementById("restart").style.display = "none";
}


    downloadReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  // Build table rows for the 15 tested sentences:
  let tableRows = [];
  window.game.sentences.forEach((item, index) => {
    let correct = Array.isArray(item.correctAnswer)
      ? item.correctAnswer.join(" / ")
      : item.correctAnswer;
    
    // Use a placeholder if no answer was recorded.
    let choice = item.clickedWord ? item.clickedWord : "—";
    let correction = item.studentAnswer ? item.studentAnswer : "—";

    tableRows.push([
      (index + 1).toString(),  // Sentence #
      item.sentence,           // Full Sentence
      item.errorWord,          // Error Word
      choice,                  // Your Choice
      correct,                 // Correct Answer
      correction               // Your Correction
    ]);
  });

  // Add a title at the top
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 150);  // dark blue
  doc.text("Spanglish Fixit Challenge - Results", 14, 20);

  // Reset text color for table
  doc.setTextColor(0, 0, 0);

  // Build the table with the proper header.
  doc.autoTable({
    startY: 30,
    head: [["#", "Full Sentence", "Error Word", "Your Choice", "Correct Answer", "Your Correction"]],
    body: tableRows,
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    bodyStyles: { fillColor: [216, 216, 216], textColor: 0 },
    alternateRowStyles: { fillColor: [255, 255, 255] },
    margin: { left: 10, right: 10 },
    styles: { fontSize: 10, cellPadding: 3 },
    didParseCell: function(data) {
      // Our table rows come from window.game.sentences.
      // Columns: 0: Sentence #, 1: Full Sentence, 2: Error Word, 
      // 3: Your Choice, 4: Correct Answer, 5: Your Correction.
      if (data.section === 'body' && data.row.index < window.game.sentences.length) {
        let sentenceData = window.game.sentences[data.row.index];
        // For "Your Choice" (column index 3):
        if (data.column.index === 3) {
          let normalizedClicked = sentenceData.clickedWord 
            ? sentenceData.clickedWord.replace(/[^\w\s]/g, "").toLowerCase() 
            : "";
          let normalizedError = sentenceData.errorWord.replace(/[^\w\s]/g, "").toLowerCase();
          if (normalizedClicked === normalizedError) {
            data.cell.styles.textColor = [0, 128, 0]; // green
          } else {
            data.cell.styles.textColor = [255, 0, 0]; // red
          }
        }
        // For "Your Correction" (column index 5):
        if (data.column.index === 5) {
          let possible = Array.isArray(sentenceData.correctAnswer) 
            ? sentenceData.correctAnswer 
            : [sentenceData.correctAnswer];
          possible = possible.map(ans => ans.toLowerCase());
          let normalizedCorrection = sentenceData.studentAnswer 
            ? sentenceData.studentAnswer.toLowerCase() 
            : "";
          if (possible.includes(normalizedCorrection)) {
            data.cell.styles.textColor = [0, 128, 0]; // green
          } else {
            data.cell.styles.textColor = [255, 0, 0]; // red
          }
        }
      }
    }
  });

  // Save the PDF
  doc.save("SpanglishFixit_Report.pdf");
}


}

// Sample sentences for testing
const sentences = [
    { 
        sentence: "It depends of the person.", 
        errorWord: "of",
        correctAnswer: "on"
    },
    { 
        sentence: "There is too much air contamination in Madrid.", 
        errorWord: "contamination",
        correctAnswer: "pollution"
    },
    { 
        sentence: "I went to a bar last night but it was almost empty. There were little people there.", 
        errorWord: "little",
        correctAnswer: "few"
    },
    { 
        sentence: "I couldn’t assist the meeting.", 
        errorWord: "assist",
        correctAnswer: "attend"
    },
    { 
        sentence: "Today’s class was very bored.", 
        errorWord: "bored",
        correctAnswer: "boring"
    },
    { 
        sentence: "She usually lives with her friends, but actually, she's staying with her mum while she recovers.", 
        errorWord: "actually",
        correctAnswer: ["currently", "at the moment"]
    },
    { 
        sentence: "Don’t shout at him. He’s very sensible.", 
        errorWord: "sensible",
        correctAnswer: "sensitive"
    },
    { 
        sentence: "She presented me to her friend Bea.", 
        errorWord: "presented",
        correctAnswer: "introduced"
    },
    { 
        sentence: "I don’t have no money.", 
        errorWord: "no",
        correctAnswer: "any"
    },
    { 
        sentence: "She gave me some good advices.", 
        errorWord: "advices",
        correctAnswer: "advice"
    },
    { 
        sentence: "I did a big effort.", 
        errorWord: "did",
        correctAnswer: "made"
    },
    { 
        sentence: "It’s an important amount of material.", 
        errorWord: "important",
        correctAnswer: ["significant", "considerable"]
    },
    {
        sentence: "I’m thinking in buying a new car.",
        errorWord: "in",
        correctAnswer: ["about", "of"]
    },
    {
        sentence: "The exam consists in 5 different papers.",
        errorWord: "in",
        correctAnswer: "of"
    },
    {
        sentence: "It was a real deception when I failed the exam.",
        errorWord: "deception",
        correctAnswer: "disappointment"
    },
    {
        sentence: "My favourite travel was when I went to Thailand.",
        errorWord: "travel",
        correctAnswer: "trip"
    },
    {
        sentence: "He’s absolutely compromised to the company’s goals.",
        errorWord: "compromised",
        correctAnswer: "committed"
    },
    {
        sentence: "This is your final advice! Don’t be late again.",
        errorWord: "advice",
        correctAnswer: "warning"
    },
    {
        sentence: "If you approve this final test, you’ll get the job.",
        errorWord: "approve",
        correctAnswer: "pass"
    },
    {
        sentence: "Could you give me the direction for the new offices?",
        errorWord: "direction",
        correctAnswer: "address"
    },
    {
        sentence: "They got very bad notes in their exams.",
        errorWord: "notes",
        correctAnswer: ["marks", "grades"]
    },
    {
        sentence: "You shouldn’t talk to the bus conductor while she’s driving.",
        errorWord: "conductor",
        correctAnswer: "driver"
    },
    {
        sentence: "We stayed in a camping, but it was dirty and overcrowded.",
        errorWord: "camping",
        correctAnswer: ["campsite", "camp site"]
    },
    {
        sentence: "Is there a public parking near here?",
        errorWord: "parking",
        correctAnswer: ["car park", "parking lot"]
    },
    {
        sentence: "Were you expecting to see him there or was it just a casualty?",
        errorWord: "casualty",
        correctAnswer: "coincidence"
    },
    {
        sentence: "I really can’t support people like that!",
        errorWord: "support",
        correctAnswer: "stand"
    },
    {
        sentence: "I don’t eat jam because I’m a vegetarian.",
        errorWord: "jam",
        correctAnswer: "ham"
    },
    {
        sentence: "I always take a coffee before going to work.",
        errorWord: "take",
        correctAnswer: ["have", "drink"]
    },
    {
        sentence: "That was a very long history.",
        errorWord: "history",
        correctAnswer: "story"
    },
    {
        sentence: "It was a very tired journey.",
        errorWord: "tired",
        correctAnswer: "tiring"
    },
    {
        sentence: "I have afraid of spiders.",
        errorWord: "have",
        correctAnswer: "am"
    },
    {
        sentence: "I had lucky to get the job.",
        errorWord: "had",
        correctAnswer: "was"
    },
    {
        sentence: "People is always telling me that.",
        errorWord: "is",
        correctAnswer: "are"
    },
    {
        sentence: "I organized a big party but anybody came.",
        errorWord: "anybody",
        correctAnswer: ["nobody", "no one"]
    },
    {
        sentence: "I have a carpet here with all the relevant documents.",
        errorWord: "carpet",
        correctAnswer: "folder"
    },
    {
        sentence: "She’s responsible of training new employees.",
        errorWord: "of",
        correctAnswer: "for"
    },
    {
        sentence: "At the moment, I’m unemployment, but I’m looking for a job.",
        errorWord: "unemployment",
        correctAnswer: "unemployed"
    },
    {
        sentence: "My wife and I often discuss about stupid things.",
        errorWord: "discuss",
        correctAnswer: "argue"
    },
    {
        sentence: "You can’t avoid me from seeing my friends.",
        errorWord: "avoid",
        correctAnswer: ["prevent", "stop"]
    },
    {
        sentence: "I wish it doesn’t rain during your holiday!",
        errorWord: "wish",
        correctAnswer: "hope"
    },
    {
        sentence: "Atleti won Real Madrid last night.",
        errorWord: "won",
        correctAnswer: "beat"
    },
    {
        sentence: "I’ll have a shower before go out.",
        errorWord: "go",
        correctAnswer: "going"
    },
    {
        sentence: "Sarah doesn’t think he’s coming today but I think yes.",
        errorWord: "yes",
        correctAnswer: "so"
    },
    {
        sentence: "For a long and healthy life, it’s important to practise sport regularly.",
        errorWord: "practise",
        correctAnswer: "do"
    },
    {
        sentence: "The factory needs to contract more staff over the summer.",
        errorWord: "contract",
        correctAnswer: ["hire", "employ", "take on"]
    },
    {
        sentence: "I’ve never been in London, but I would really like to go.",
        errorWord: "in",
        correctAnswer: "to"
    },
    {
        sentence: "Don’t put attention to anything they say.",
        errorWord: "put",
        correctAnswer: "pay"
    },
    {
        sentence: "He’s talking with the phone right now.",
        errorWord: "with",
        correctAnswer: "on"
    },
    {
        sentence: "The flight was cancelled for the weather.",
        errorWord: "for",
        correctAnswer: ["because of", "due to"]
    },
    {
        sentence: "I have known them since seven years.",
        errorWord: "since",
        correctAnswer: "for"
    },
    {
        sentence: "I don’t know how it is called.",
        errorWord: "how",
        correctAnswer: "what"
    },
    {
        sentence: "I have a doubt about this.",
        errorWord: "doubt",
        correctAnswer: "question"
    },
    {
        sentence: "I have a lot of homeworks.",
        errorWord: "homeworks",
        correctAnswer: "homework"
    },
    {
        sentence: "She’s very good in maths.",
        errorWord: "in",
        correctAnswer: "at"
    },
    {
        sentence: "They remembered me of my cousins.",
        errorWord: "remembered",
        correctAnswer: "reminded"
    },
    {
        sentence: "She’s married with an Ethiopian man.",
        errorWord: "with",
        correctAnswer: "to"
    },
    {
        sentence: "I like going to a disco at the weekend.",
        errorWord: "disco",
        correctAnswer: "club"
    },
    {
        sentence: "He’s so educated. He always treats everybody with a lot of respect.",
        errorWord: "educated",
        correctAnswer: "polite"
    },
    {
        sentence: "He needs to go to university because he pretends to be a doctor.",
        errorWord: "pretends",
        correctAnswer: ["intends", "wants", "hopes"]
    },
    {
        sentence: "The noise from the neighbour’s house is molesting me.",
        errorWord: "molesting",
        correctAnswer: ["bothering", "annoying", "disturbing", "irritating"]
    },
    {
        sentence: "I liked the movie, but it was a little large for me.",
        errorWord: "large",
        correctAnswer: "long"
    },
    {
        sentence: "He got a great punctuation in the game.",
        errorWord: "punctuation",
        correctAnswer: "score"
    },
    {
        sentence: "Can you borrow me your pen?",
        errorWord: "borrow",
        correctAnswer: "lend"
    },
    {
        sentence: "She works as a commercial in a bank.",
        errorWord: "commercial",
        correctAnswer: ["saleswoman", "salesperson"]
    },
    {
        sentence: "They said me to wait here.",
        errorWord: "said",
        correctAnswer: "told"
    },
    {
        sentence: "They all agreed that rock-climbing would be more funny.",
        errorWord: "funny",
        correctAnswer: "fun"
    },
    {
        sentence: "Did you know that Jane is going to make a party on Friday?",
        errorWord: "make",
        correctAnswer: "have"
    },
    { 
        sentence: "There’s plenty more soap if you’re still hungry.", 
        errorWord: "soap", 
        correctAnswer: "soup"
    },
    { 
        sentence: "We knew each other in 1996.", 
        errorWord: "knew", 
        correctAnswer: "met"
    },
    { 
        sentence: "I lived in Japan during three years.", 
        errorWord: "during", 
        correctAnswer: "for"
    },
    { 
        sentence: "I have two brothers, María and Juan.", 
        errorWord: "brothers", 
        correctAnswer: "siblings"
    },
    { 
        sentence: "Jane works very hardly. She’s a workaholic.", 
        errorWord: "hardly", 
        correctAnswer: "hard"
    },
    { 
        sentence: "Our teacher puts us too much homework.", 
        errorWord: "puts", 
        correctAnswer: ["gives", "sets"]
    },
    { 
        sentence: "I prefer spending time with another people.", 
        errorWord: "another", 
        correctAnswer: "other"
    },
    { 
        sentence: "I usually visit my family in Christmas.", 
        errorWord: "in", 
        correctAnswer: "at"
    },
    { 
        sentence: "Tim’s not as taller as me.", 
        errorWord: "taller", 
        correctAnswer: "tall"
    },
    { 
        sentence: "It’s one of the safest city in the world.", 
        errorWord: "city", 
        correctAnswer: "cities"
    },
    { 
        sentence: "How many time do you need?", 
        errorWord: "many", 
        correctAnswer: "much"
    },
    { 
        sentence: "I'm watching a great serie at the moment.", 
        errorWord: "serie", 
        correctAnswer: "series"
    },
    {
        sentence: "If you can’t tell me the true, just don’t say anything.",
        errorWord: "true",
        correctAnswer: "truth"
    },
    {
        sentence: "Hannah’s always doing me such personal questions.",
        errorWord: "doing",
        correctAnswer: "asking"
    },
    {
        sentence: "Do you know the website’s politics on returning items?",
        errorWord: "politics",
        correctAnswer: "policy"
    },
    {
        sentence: "I’ve only watched 4 chapters so far, but I love the new season!",
        errorWord: "chapters",
        correctAnswer: "episodes"
    },
    {
        sentence: "I’m too afraid to start inverting in the stock market.",
        errorWord: "inverting",
        correctAnswer: "investing"
    },
    {
        sentence: "If you’re worried about committing mistakes, you won’t improve.",
        errorWord: "committing",
        correctAnswer: "making"
    },
    {
        sentence: "He’s a military in the army.",
        errorWord: "military",
        correctAnswer: "soldier"
    },
    {
        sentence: "She’s working in a car fabric, but she’s looking for another position.",
        errorWord: "fabric",
        correctAnswer: "factory"
    },
    {
        sentence: "Tesla is starting to face a lot of competence from other car manufacturers.",
        errorWord: "competence",
        correctAnswer: "competition"
    },
    {
        sentence: "Did you do it by your own, or did somebody help you?",
        errorWord: "by",
        correctAnswer: "on"
    },
    {
        sentence: "I’ve read all of the collection less the third book.",
        errorWord: "less",
        correctAnswer: ["except", "but", "apart from", "except for"]
    },
    {
        sentence: "Nick isn’t here right now. He stays at home.",
        errorWord: "stays",
        correctAnswer: "is"
    },
    {
        sentence: "I passed a great weekend at the beach.",
        errorWord: "passed",
        correctAnswer: ["had", "spent"]
    },
    {
        sentence: "She made a photo of me in front of the cathedral.",
        errorWord: "made",
        correctAnswer: "took"
    },
    {
        sentence: "She works like a lawyer in New York.",
        errorWord: "like",
        correctAnswer: "as"
    },
    {
        sentence: "As Samantha, I live in the countryside",
        errorWord: "As",
        correctAnswer: "like"
    }
];


// Create and store the game instance globally
window.game = new SpanglishFixitGame(sentences);


// -------------------------------
// Firebase Multiplayer Functions
// -------------------------------

// Create a new game session and store it in Firebase
function createGameSession(allSentences) {
  // Shuffle & slice to 15
  const selected = [...allSentences].sort(() => Math.random() - 0.5).slice(0, 15);
  const newSessionRef = firebase.database().ref("gameSessions").push();
  newSessionRef.set({
    sentences: selected,  // Only 15 are stored
    currentRound: -1, // Game not started until host triggers start
    roundStartTime: Date.now(),
    players: {},
    createdAt: Date.now()
  });
  console.log("Created game session with ID:", newSessionRef.key);
  return newSessionRef.key;
}

function createHostGameSession(allSentences, hostName) {
  const selected = [...allSentences].sort(() => Math.random() - 0.5).slice(0, 15);
  const newSessionRef = firebase.database().ref("gameSessions").push();
  newSessionRef.set({
    sentences: selected,
    currentRound: -1,  // <--- Must be -1 so the game waits for host
    roundStartTime: Date.now(),
    players: {},
    createdAt: Date.now(),
    host: { name: hostName }
  });
  console.log("Created host game session with ID:", newSessionRef.key);
  return newSessionRef.key;
}

function joinGameSession(sessionId, userEnteredName) {
  // ← Debug
  console.log("joinGameSession – MAX_PLAYERS =", MAX_PLAYERS);

  // 0. Validate player name
  if (!userEnteredName) {
    console.error("joinGameSession called without a valid player name!");
    return;
  }
  // Hide single‑player “Start” button if present
  const startBtn = document.getElementById("start");
  if (startBtn) startBtn.style.display = "none";

  // Prepare Firebase refs
  const sessionRef = firebase.database().ref('gameSessions/' + sessionId);
  const playersRef = sessionRef.child('players');

  // 1️⃣ Load the 15 sentences once
  sessionRef.child('sentences').once('value').then(snap => {
    const data = snap.val();
    if (data) window.game.sentences = data;
  });

  // 2️⃣ Atomically claim the next free slot
  playersRef.transaction(currentPlayers => {
    if (currentPlayers == null) currentPlayers = {};
    for (let i = 1; i <= MAX_PLAYERS; i++) {
      const slot = 'player' + i;
      if (!currentPlayers[slot]) {
        currentPlayers[slot] = {
          name: userEnteredName,
          score: 0,
          hasAnswered: false
        };
        currentPlayerId = slot;    // remember our slot
        return currentPlayers;     // commit
      }
    }
    return; // abort if no free slots
  }, (error, committed) => {
    if (error) {
      console.error("Could not join (transaction failed):", error);
      return;
    }
    if (!committed) {
      console.error(`Session is already full (max ${MAX_PLAYERS} players).`);
      return;
    }

    // 🎉 Successfully joined!
    currentSessionId = sessionId;
    window.game.gameActive = true;
    window.game.currentIndex = -1;

    // Remove us on disconnect
    playersRef.child(currentPlayerId).onDisconnect().remove();

    // 3️⃣ Attach the real‑time listener
    sessionRef.on('value', snapshot => {
      const gameState = snapshot.val();
      if (!gameState) return;

      // Game‑over?
      if (gameState.currentRound >= window.game.totalSentences) {
        return window.game.endGame();
      }

      // Waiting for enough players
      const playerCount = gameState.players
        ? Object.keys(gameState.players).length
        : 0;
      if (playerCount < MIN_PLAYERS) {
        document.getElementById("feedback").textContent =
          `Waiting for ${MIN_PLAYERS - playerCount} more player(s) to join…`;
        return;
      }

      // Waiting for host to start
      if (gameState.currentRound === -1) {
        if (currentPlayerId === "host") {
          if (!window.startButtonDisplayed) {
            window.startButtonDisplayed = true;
            const btn = document.createElement("button");
            btn.id = "hostStartGame";
            btn.textContent = "Start Game";
            btn.style.cssText = `
              padding:10px 20px;
              font-size:18px;
              margin-top:10px;
              background:#28a745;color:#fff;
              border:none;border-radius:5px;
              cursor:pointer;
            `;
            btn.addEventListener("click", () => {
              sessionRef.update({
                currentRound: 0,
                roundOver: false,
                roundStartTime: Date.now()
              });
              btn.remove();
              window.startButtonDisplayed = false;
            });
            document.getElementById("feedback").textContent = "";
            document.getElementById("game-container")
                    .appendChild(btn);
          }
        } else {
          document.getElementById("feedback").textContent =
            "Waiting for host to start the game…";
        }
        return;
      }

      // Game in progress: update counter & sentence
      document.getElementById("counter").textContent =
        `Round: ${gameState.currentRound + 1}`;
      if (window.game.currentIndex !== gameState.currentRound) {
        window.game.currentIndex = gameState.currentRound;
        window.game.updateSentence();
      }

      // Round intermission
      if (gameState.roundOver && !window.overlayDisplayed) {
        window.overlayDisplayed = true;
        if (currentPlayerId === "host") {
          showHostIntermission(
            gameState.sentences[gameState.currentRound],
            gameState
          );
        } else {
          showPlayerIntermission(
            gameState.sentences[gameState.currentRound],
            gameState
          );
        }
      } else if (!gameState.roundOver) {
        // Remove intermission overlay and advance
        const overlay = document.getElementById("intermission");
        if (overlay) overlay.remove();
        window.overlayDisplayed = false;
        if (window.game.currentIndex !== gameState.currentRound) {
          window.game.currentIndex = gameState.currentRound;
          window.game.updateSentence();
        }
      }
    });
  });
}

// -------------------------------
// Example Usage:
// -------------------------------

// To create a multiplayer session, call createGameSession with your sentences array:
// const sessionId = createGameSession(sentences);
// You can then display this sessionId on the UI so another player can join.

// To join a multiplayer session, use joinGameSession with the room ID and a unique player identifier:
// joinGameSession("theRoomIdFromUI", "player1");

// ------------------------------------------------------
// You can integrate these functions with new UI elements such as:
// - A "Create Multiplayer Game" button that calls createGameSession(sentences)
// - An input field for a room ID and a "Join Multiplayer Game" button that calls joinGameSession(roomId, playerId)
// ------------------------------------------------------

function submitAnswer(newScore, answerText) {
  if (!currentSessionId || !currentPlayerId) return;

  const sessionRef = firebase.database().ref('gameSessions/' + currentSessionId);

  // 1) Update this player's score + answered flag
  sessionRef.child('players').child(currentPlayerId).update({
    score: newScore,
    hasAnswered: true,
    lastAnswer: answerText
  });

  // 2) Re‐read all players and count who’s answered
  sessionRef.once('value').then(snapshot => {
    const data = snapshot.val() || {};
    const players = data.players || {};
    const totalPlayers  = Object.keys(players).length;
    const answeredCount = Object.values(players)
                                .filter(p => p.hasAnswered).length;

    // 3) If **everyone** has answered and roundOver is not yet set…
    if (answeredCount === totalPlayers && !data.roundOver) {
      sessionRef.update({
        roundOver:     true,
        roundOverTime: Date.now()
      });
    }
  });
}

function showIntermission(currentSentence, sessionData) {
  // Convert the players object to an array for sorting.
  const playersArray = Object.values(sessionData.players);
  
  // Sort players descending by score.
  playersArray.sort((a, b) => b.score - a.score);
  
  // Now, the player with the higher score is first.
  const winner = playersArray[0];
  const loser = playersArray[1];

  // Format the correct answer text (handling arrays if necessary).
  const correctText = Array.isArray(currentSentence.correctAnswer)
    ? currentSentence.correctAnswer.join(" / ")
    : currentSentence.correctAnswer;

  // Create an intermission overlay element with enhanced visuals.
  const intermissionDiv = document.createElement('div');
  intermissionDiv.id = 'intermission';
  intermissionDiv.style.position = 'absolute';
  intermissionDiv.style.top = '50%';
  intermissionDiv.style.left = '50%';
  intermissionDiv.style.transform = 'translate(-50%, -50%)';
  intermissionDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
  intermissionDiv.style.padding = '30px';
  intermissionDiv.style.borderRadius = '12px';
  intermissionDiv.style.boxShadow = '0px 0px 20px rgba(0, 0, 0, 0.5)';
  intermissionDiv.style.zIndex = '2000';
  intermissionDiv.style.color = '#fff';
  intermissionDiv.style.fontFamily = "'Poppins', sans-serif";
  
  // Build the inner HTML with ordered scores.
  intermissionDiv.innerHTML = `
    <h2 style="margin-top: 0; font-size: 28px;">Round Complete!</h2>
    <p style="font-size: 20px;">
      <strong>Error Word:</strong> 
      <span style="color: #FF4D4D; font-weight: bold;">${currentSentence.errorWord}</span>
    </p>
    <p style="font-size: 20px;">
      <strong>Correct Word:</strong> 
      <span style="color: #66FF66; font-weight: bold;">${correctText}</span>
    </p>
    <hr style="border: 1px solid #555; margin: 20px 0;">
    <p style="font-size: 20px;">
      <strong style="color: #00FF00;">${winner.name} Score:</strong> ${winner.score}
    </p>
    <p style="font-size: 20px;">
      <strong style="color: #FF0000;">${loser.name} Score:</strong> ${loser.score}
    </p>
    <p style="font-size: 18px; margin-top: 20px;">
      Next round starting in <span id="intermissionCountdown">5</span> seconds
    </p>
  `;
  
  document.getElementById("game-container").appendChild(intermissionDiv);

  // ✅ Replace the old countdown block with this one line:
startIntermissionCountdown(sessionData.currentRound);
}
/**
 * Advances to the next round after a 5‑second countdown,
 * and resets every player's hasAnswered flag.
 *
 * @param {number} prevRound  the round index that just finished
 */
function startIntermissionCountdown(prevRound) {
  let count = 5;
  const interval = setInterval(() => {
    const el = document.getElementById("intermissionCountdown");
    if (el) el.textContent = count;
    
    if (count-- <= 0) {
      clearInterval(interval);
      const overlay = document.getElementById("intermission");
      if (overlay) overlay.remove();

      const sessionRef = firebase
        .database()
        .ref('gameSessions/' + currentSessionId);

      // Atomically bump the round and clear everyone’s hasAnswered
      sessionRef.transaction(session => {
        if (!session) return session;
        session.currentRound    = prevRound + 1;
        session.roundOver       = false;
        session.roundStartTime  = Date.now();
        Object.keys(session.players || {}).forEach(key => {
          session.players[key].hasAnswered = false;
        });
        return session;
      });
    }
  }, 1000);
}

// Now define startMultiplayerGame() at top level, not inside submitAnswer()
function startMultiplayerGame() {
  promptForPlayerName((name) => {
    currentPlayerId = name; // Use the custom name for player1
    currentSessionId = createGameSession(sentences);
    joinGameSession(currentSessionId, currentPlayerId);

    // Hide the single-player Start button
    document.getElementById("start").style.display = "none";

    // Display a waiting message for player1 until another player joins
    const waitingMessage = document.createElement('div');
    waitingMessage.id = 'waiting';
    waitingMessage.style.fontSize = '24px';
    waitingMessage.style.marginTop = '10px';
    waitingMessage.textContent = "Waiting for another player to join...";
    document.getElementById("game-container").appendChild(waitingMessage);

    // Mark the game as active in multiplayer mode
    window.game.gameActive = true;
    console.log("Multiplayer session created & joined as", currentPlayerId, "with session ID:", currentSessionId);
  });
}

function startCountdown() {
  let countdown = 5;
  const countdownEl = document.createElement("div");
  countdownEl.id = "countdown";
  countdownEl.style.fontSize = "24px";
  countdownEl.style.marginTop = "10px";
  document.getElementById("game-container").appendChild(countdownEl);

  const interval = setInterval(() => {
    countdownEl.textContent = `Game starting in ${countdown}...`;
    if (countdown <= 0) {
      clearInterval(interval);
      countdownEl.remove();
      // Start the game for both players after countdown
      window.game.startGame();
    }
    countdown--;
  }, 1000);
}

function promptForPlayerName(callback) {
  // Create an overlay element
  const overlay = document.createElement("div");
  overlay.id = "nameOverlay";
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
  overlay.style.display = "flex";
  overlay.style.alignItems = "center";
  overlay.style.justifyContent = "center";
  overlay.style.zIndex = "3000";
  
  // Create inner content with aesthetics matching the game overlays
  overlay.innerHTML = `
    <div style="
      background: #333;
      color: white;
      padding: 20px;
      border-radius: 10px;
      text-align: center;
      width: 80%;
      max-width: 400px;
      font-family: 'Poppins', sans-serif;
    ">
      <h2 style="margin-top: 0;">Enter Your Name</h2>
      <input type="text" id="playerNameInput" placeholder="Your name" style="
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: none;
          outline: none;
          text-align: center;
          display: block;
          margin: 10px auto;
          width: 80%;
      "/>
      <br/>
      <button id="submitPlayerName" style="
          padding: 10px 20px;
          font-size: 16px;
          cursor: pointer;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 5px;
          transition: 0.3s;
      ">Submit</button>
    </div>
  `;
  
  document.body.appendChild(overlay);
  
  // Auto-select the input and allow submission with Enter key
  const input = document.getElementById("playerNameInput");
  input.focus();
  input.addEventListener("keyup", (event) => {
    if (event.key === "Enter") {
      document.getElementById("submitPlayerName").click();
    }
  });
  
  document.getElementById("submitPlayerName").addEventListener("click", () => {
    const name = input.value.trim();
    if (name !== "") {
      document.body.removeChild(overlay);
      callback(name);
    } else {
      alert("Please enter a valid name.");
    }
  });
}

function joinGameSessionAsHost(sessionId, hostName) {
  const sessionRef = firebase.database().ref("gameSessions/" + sessionId);
  sessionRef.child("host").set({ name: hostName });


  // Create the host box if it doesn't already exist
  let hostStatusDiv = document.getElementById("host-status");
  if (!hostStatusDiv) {
    hostStatusDiv = document.createElement("div");
    hostStatusDiv.id = "host-status";
    hostStatusDiv.style.background = "rgba(0, 0, 0, 0.8)";
    hostStatusDiv.style.padding = "20px";
    hostStatusDiv.style.borderRadius = "10px";
    hostStatusDiv.style.width = "90%";
    hostStatusDiv.style.maxWidth = "600px";
    hostStatusDiv.style.margin = "20px auto";
    hostStatusDiv.style.color = "#fff";

    // Reorder the HTML so the dynamic info (round, scores) appears above the QR code
    hostStatusDiv.innerHTML = `
      <h2>Host View</h2>
      <!-- 1) Dynamic game info goes here -->
      <div id="host-dynamic-content"></div>
    `;

    // Insert the host box in its original position
    const multiDiv = document.getElementById("multiplayer-container");
    document.body.insertBefore(hostStatusDiv, multiDiv);
  }

  // Define joinUrl
  let baseUrl;
  if (location.hostname === "localhost") {
    baseUrl = window.location.origin;
  } else {
    baseUrl = "https://waggledook.github.io/Spanglishfixithostcomp";
  }
  const joinUrl = `${baseUrl}?session=${sessionId}`;

  // Listen for Firebase updates and update only the dynamic area
  sessionRef.on("value", (snapshot) => {
    const gameState = snapshot.val();
    if (!gameState) return;

    // Build your round info, sentence, player scores, etc.
    let dynamicHtml = `<p style="font-size: 20px;">Current Round: ${
      gameState.currentRound === -1 ? "Not started" : gameState.currentRound + 1
    }</p>`;

    if (
      gameState.currentRound >= 0 &&
      gameState.currentRound < gameState.sentences.length
    ) {
      const currentSentence = gameState.sentences[gameState.currentRound];
      dynamicHtml += `<div style="
        font-size: 26px; 
        font-weight: bold; 
        background: #fff; 
        color: #000; 
        padding: 10px; 
        border-radius: 5px; 
        margin: 10px 0;">
          ${currentSentence.sentence}
      </div>`;
    }

    if (gameState.players) {
      dynamicHtml += "<h3 style='font-size: 24px;'>Players</h3>";
      for (let playerKey in gameState.players) {
        const p = gameState.players[playerKey];
        dynamicHtml += `<p style="font-size: 18px;">
          ${p.name}: Score ${p.score} ${p.hasAnswered ? "(Answered)" : "(Waiting)"}
        </p>`;
      }
    }

    // If the game hasn't started, show "Start Game" button (for the host)
    if (
      gameState.currentRound === -1 &&
      gameState.players &&
      Object.keys(gameState.players).length >= MIN_PLAYERS &&
      currentPlayerId === "host"
    ) {
      dynamicHtml += `
        <button id="hostStartGame" style="
          padding: 10px 20px;
          font-size: 18px;
          margin-top: 10px;
          background: #28a745;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
        ">Start Game</button>
      `;
    }
    // Wire up Start Game click only once
const startBtn = document.getElementById("hostStartGame");
if (startBtn && !window.startButtonDisplayed) {
  startBtn.addEventListener("click", () => {
    sessionRef.update({
      currentRound:  0,
      roundOver:     false,
      roundStartTime: Date.now()
    });
    window.startButtonDisplayed = true;
  });
}

    // Update only the dynamic content container
    const dynamicContent = document.getElementById("host-dynamic-content");
    if (dynamicContent) {
      dynamicContent.innerHTML = dynamicHtml;

      // Attach event listener for the "Start Game" button if it exists
      const startButton = document.getElementById("hostStartGame");
      if (startButton) {
        startButton.addEventListener("click", () => {
          sessionRef.update({
            currentRound: 0,
            roundOver: false,
            roundStartTime: Date.now(),
          });
          startButton.remove();
          window.startButtonDisplayed = false;
        });
      }
    }

    // Check for game over or round intermission
    if (gameState.currentRound >= window.game.totalSentences) {
      window.game.endGame();
    } else if (
      gameState.roundOver &&
      currentPlayerId === "host" &&
      !window.overlayDisplayed
    ) {
      window.overlayDisplayed = true;
      showHostIntermission(gameState.sentences[gameState.currentRound], gameState);
    }
  });
}

function showHostIntermission(currentSentence, sessionData) {
  // 1) Debug: inspect what players data looks like
  console.log("🔔 Host intermission data:", sessionData.players);

  // 2) Build an array of players with slot keys
  const playersArr = Object.entries(sessionData.players || {})
    .map(([slot, p]) => ({ slot, ...p }))
    .sort((a, b) => b.score - a.score);

  // 3) Normalize correct answers to lowercase
  let possible = currentSentence.correctAnswer;
  if (!Array.isArray(possible)) possible = [possible];
  possible = possible.map(ans => ans.toLowerCase());

  // 4) Build HTML for each player: name, score, and color‑coded answer
  const scoresHtml = playersArr.map(p => {
    const name = p.name || p.slot;
    const answer = (p.lastAnswer || "").trim();
    const isCorrect = possible.includes(answer.toLowerCase());
    const color = isCorrect ? "#0f0" : "#f00";
    return `
      <div style="margin:8px 0; text-align:left;">
        <p style="font-size:20px; margin:2px 0;">
          <strong>${name}</strong>: ${p.score}
          ${p.hasAnswered ? "(Answered)" : "(Waiting)"}
        </p>
        <p style="font-size:16px; margin:2px 0;">
          Answer: 
          <span style="color:${color}; font-weight:bold;">
            ${answer || "—"}
          </span>
        </p>
      </div>
    `;
  }).join("");

  // 5) Create and style the overlay
  const intermissionDiv = document.createElement('div');
  intermissionDiv.id = 'host-intermission';
  Object.assign(intermissionDiv.style, {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    zIndex: '2000',
    color: '#fff',
    fontFamily: "'Poppins', sans-serif",
    textAlign: 'center',
    width: '90%',
    maxWidth: '600px'
  });

  // 6) Format the correct answer(s)
  const correctText = Array.isArray(currentSentence.correctAnswer)
    ? currentSentence.correctAnswer.join(' / ')
    : currentSentence.correctAnswer;

  intermissionDiv.innerHTML = `
    <h2 style="margin-top:0;font-size:28px;">Round Complete!</h2>
    <p style="font-size:20px; margin:8px 0;">
      <strong>Error Word:</strong>
      <span style="color:#FF4D4D;font-weight:bold;">
        ${currentSentence.errorWord}
      </span>
    </p>
    <p style="font-size:20px; margin:8px 0;">
      <strong>Correct Word:</strong>
      <span style="color:#66FF66;font-weight:bold;">
        ${correctText}
      </span>
    </p>
    <hr style="border:1px solid #555; margin:20px 0;">
    ${scoresHtml}
    <button id="nextRoundBtn" style="
      padding:10px 20px;
      font-size:18px;
      margin-top:20px;
      background:#28a745;
      color:white;
      border:none;
      border-radius:5px;
      cursor:pointer;
      transition:0.3s;
    ">Next Round</button>
  `;

  document.body.appendChild(intermissionDiv);

  // 7) Advance when host clicks "Next Round"
  document.getElementById("nextRoundBtn").addEventListener("click", () => {
    const sessionRef = firebase.database().ref("gameSessions/" + currentSessionId);

    // If final round, end the game
    if (sessionData.currentRound >= window.game.totalSentences - 1) {
      intermissionDiv.remove();
      window.overlayDisplayed = false;
      return sessionRef.update({ currentRound: window.game.totalSentences });
    }

    // Otherwise, bump round + reset answered flags
    const next = sessionData.currentRound + 1;
    sessionRef.update({
      currentRound:   next,
      roundStartTime: Date.now(),
      roundOver:      false
    });
    Object.keys(sessionData.players || {}).forEach(key => {
      sessionRef.child("players").child(key)
                .update({ hasAnswered: false });
    });

    intermissionDiv.remove();
    window.overlayDisplayed = false;
  });
}

function showPlayerIntermission(currentSentence, sessionData) {
  // Debug: inspect what data we have
  console.log("⏱ Intermission players data:", sessionData.players);

  // Build an array of players with their slot key
  const playersArr = Object.entries(sessionData.players || {})
    .map(([slot, p]) => ({ slot, ...p }))
    .sort((a, b) => b.score - a.score);

  // Normalize correct answers to lowercase
  let possible = currentSentence.correctAnswer;
  if (!Array.isArray(possible)) possible = [possible];
  possible = possible.map(ans => ans.toLowerCase());

  // Build the HTML for each player
  const scoresHtml = playersArr.map(p => {
    const displayName = p.name || p.slot;
    const answer = (p.lastAnswer || "").trim();
    const isCorrect = possible.includes(answer.toLowerCase());
    const answerColor = isCorrect ? "#0f0" : "#f00";

    return `
      <div style="margin:8px 0; text-align:left;">
        <p style="font-size:20px; margin:2px 0;">
          <strong>${displayName}</strong>: ${p.score}
          ${p.hasAnswered ? "(Answered)" : "(Waiting)"}
        </p>
        <p style="font-size:16px; margin:2px 0;">
          Answer: 
          <span style="color:${answerColor}; font-weight:bold;">
            ${answer || "—"}
          </span>
        </p>
      </div>
    `;
  }).join("");

  // Create and style the overlay
  const intermissionDiv = document.createElement('div');
  intermissionDiv.id = 'intermission';
  Object.assign(intermissionDiv.style, {
    position: 'absolute',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    backgroundColor: 'rgba(0,0,0,0.85)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 0 20px rgba(0,0,0,0.5)',
    zIndex: '2000',
    color: '#fff',
    fontFamily: "'Poppins', sans-serif",
    textAlign: 'center',
    width: '90%',
    maxWidth: '600px'
  });

  // Format the correct answer for display
  const correctText = Array.isArray(currentSentence.correctAnswer)
    ? currentSentence.correctAnswer.join(' / ')
    : currentSentence.correctAnswer;

  intermissionDiv.innerHTML = `
    <h2 style="margin-top:0; font-size:28px;">Round Complete!</h2>
    <p style="font-size:20px; margin:8px 0;">
      <strong>Error Word:</strong> ${currentSentence.errorWord}
    </p>
    <p style="font-size:20px; margin:8px 0;">
      <strong>Correct Word:</strong> ${correctText}
    </p>
    <hr style="border:1px solid #555; margin:20px 0;">
    ${scoresHtml}
    <p style="font-size:20px; margin-top:20px;">
      Waiting for host to start the next round...
    </p>
  `;

  document.getElementById("game-container").appendChild(intermissionDiv);
}



