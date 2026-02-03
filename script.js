const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const highScoreEl = document.getElementById("highScore");
const timeEl = document.getElementById("time");
const progressBar = document.getElementById("progressBar");
const messageEl = document.getElementById("message");
const moveCards = Array.from(document.querySelectorAll(".move-card"));

const moves = ["left", "up", "down", "right"];
const moveLabels = {
  left: "Slide Left",
  up: "Tip Hat",
  down: "Spin Drop",
  right: "Slide Right",
};

let currentMove = null;
let isPlaying = false;
let score = 0;
let streak = 0;
let timeLeft = 60;
let timerId = null;
let cueId = null;

const storedHigh = Number(localStorage.getItem("moonwalk-high")) || 0;
highScoreEl.textContent = storedHigh;

const setMessage = (text, tone = "") => {
  messageEl.textContent = text;
  messageEl.dataset.tone = tone;
};

const highlightMove = (move) => {
  moveCards.forEach((card) => {
    card.classList.toggle("active", card.dataset.move === move);
  });
};

const setFeedback = (move, status) => {
  const card = moveCards.find((item) => item.dataset.move === move);
  if (!card) return;
  card.classList.add(status);
  setTimeout(() => card.classList.remove(status), 350);
};

const updateStats = () => {
  scoreEl.textContent = score;
  streakEl.textContent = streak;
  timeEl.textContent = timeLeft;
  progressBar.style.width = `${(timeLeft / 60) * 100}%`;
};

const updateHighScore = () => {
  const currentHigh = Number(localStorage.getItem("moonwalk-high")) || 0;
  if (score > currentHigh) {
    localStorage.setItem("moonwalk-high", score);
    highScoreEl.textContent = score;
  }
};

const pickMove = () => {
  const nextMove = moves[Math.floor(Math.random() * moves.length)];
  currentMove = nextMove;
  highlightMove(nextMove);
  setMessage(`Cue: ${moveLabels[nextMove]}!`, "cue");
};

const startTimer = () => {
  timerId = setInterval(() => {
    timeLeft -= 1;
    updateStats();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
};

const startCueLoop = () => {
  pickMove();
  cueId = setInterval(pickMove, 1800);
};

const startGame = () => {
  if (isPlaying) return;
  isPlaying = true;
  score = 0;
  streak = 0;
  timeLeft = 60;
  updateStats();
  setMessage("Showtime! Follow the rhythm.", "start");
  startTimer();
  startCueLoop();
};

const endGame = () => {
  isPlaying = false;
  clearInterval(timerId);
  clearInterval(cueId);
  highlightMove(null);
  updateHighScore();
  setMessage(`Final bow! You scored ${score} points.`, "end");
};

const resetGame = () => {
  clearInterval(timerId);
  clearInterval(cueId);
  isPlaying = false;
  score = 0;
  streak = 0;
  timeLeft = 60;
  currentMove = null;
  highlightMove(null);
  updateStats();
  setMessage("Hit start to begin the show.");
};

const handleMove = (move) => {
  if (!isPlaying || !currentMove) return;
  if (move === currentMove) {
    score += 150 + streak * 10;
    streak += 1;
    setFeedback(move, "hit");
    setMessage("Perfect timing!", "hit");
    pickMove();
  } else {
    streak = 0;
    setFeedback(move, "miss");
    setMessage("Missed the beat. Regain your rhythm!", "miss");
  }
  updateStats();
};

const keyMap = {
  ArrowLeft: "left",
  ArrowUp: "up",
  ArrowDown: "down",
  ArrowRight: "right",
  a: "left",
  w: "up",
  s: "down",
  d: "right",
};

document.addEventListener("keydown", (event) => {
  const move = keyMap[event.key];
  if (move) {
    handleMove(move);
  }
});

startButton.addEventListener("click", startGame);
resetButton.addEventListener("click", resetGame);

updateStats();
