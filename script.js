const startButton = document.getElementById("startButton");
const pauseButton = document.getElementById("pauseButton");
const resetButton = document.getElementById("resetButton");
const soundToggle = document.getElementById("soundToggle");
const autoAdvanceToggle = document.getElementById("autoAdvanceToggle");
const scoreEl = document.getElementById("score");
const streakEl = document.getElementById("streak");
const multiplierEl = document.getElementById("multiplier");
const accuracyEl = document.getElementById("accuracy");
const highScoreEl = document.getElementById("highScore");
const timeEl = document.getElementById("time");
const progressBar = document.getElementById("progressBar");
const messageEl = document.getElementById("message");
const moveCards = Array.from(document.querySelectorAll(".move-card"));
const queueList = document.getElementById("queueList");
const lane = document.getElementById("lane");
const timingFeedback = document.getElementById("timingFeedback");
const levelEl = document.getElementById("level");
const tempoEl = document.getElementById("tempo");
const levelsEl = document.getElementById("levels");
const dancer = document.querySelector(".dancer-3d");

const moves = ["left", "up", "down", "right"];
const moveLabels = {
  left: "Slide Left",
  up: "Tip Hat",
  down: "Spin Drop",
  right: "Slide Right",
};
const moveSymbols = {
  left: "◀︎",
  up: "▲",
  down: "▼",
  right: "▶︎",
};

const gameConfig = {
  duration: 75,
  beatInterval: 650,
  travelTime: 2200,
  perfectWindow: 90,
  goodWindow: 150,
  okayWindow: 220,
  comboStep: 8,
};

const levelConfig = {
  1: { label: "Club Intro", beatInterval: 720, travelTime: 2400, scoreBoost: 1, tempo: 92 },
  2: { label: "Tour Vibes", beatInterval: 610, travelTime: 2200, scoreBoost: 1.2, tempo: 104 },
  3: { label: "Stadium Finale", beatInterval: 520, travelTime: 2000, scoreBoost: 1.4, tempo: 120 },
};

let currentMove = null;
let isPlaying = false;
let isPaused = false;
let score = 0;
let streak = 0;
let timeLeft = gameConfig.duration;
let timerId = null;
let animationId = null;
let beatId = 0;
let beats = [];
let accuracy = { hits: 0, total: 0 };
let currentLevel = 1;

let audioContext = null;

const storedHigh = Number(localStorage.getItem("moonwalk-high")) || 0;
highScoreEl.textContent = storedHigh;

const setMessage = (text, tone = "") => {
  messageEl.textContent = text;
  messageEl.dataset.tone = tone;
};

const setTimingFeedback = (text, tone) => {
  if (!timingFeedback) return;
  timingFeedback.textContent = text;
  timingFeedback.className = `timing-feedback ${tone}`;
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
  multiplierEl.textContent = `${getMultiplier().toFixed(1)}x`;
  accuracyEl.textContent = `${getAccuracy()}%`;
  timeEl.textContent = timeLeft;
  levelEl.textContent = currentLevel;
  tempoEl.textContent = `${levelConfig[currentLevel].tempo} BPM`;
  progressBar.style.width = `${(timeLeft / gameConfig.duration) * 100}%`;
};

const getMultiplier = () => 1 + Math.floor(streak / gameConfig.comboStep) * 0.2;

const getAccuracy = () => {
  if (accuracy.total === 0) return 100;
  return Math.max(0, Math.round((accuracy.hits / accuracy.total) * 100));
};

const updateHighScore = () => {
  const currentHigh = Number(localStorage.getItem("moonwalk-high")) || 0;
  if (score > currentHigh) {
    localStorage.setItem("moonwalk-high", score);
    highScoreEl.textContent = score;
  }
};

const resetLane = () => {
  beats.forEach((beat) => beat.element.remove());
  beats = [];
};

const pickMove = () => moves[Math.floor(Math.random() * moves.length)];

const enqueueBeat = (now) => {
  const move = pickMove();
  const targetTime = now + gameConfig.travelTime;
  const beatElement = document.createElement("div");
  beatElement.className = `beat ${move}`;
  beatElement.textContent = moveSymbols[move];
  lane.appendChild(beatElement);

  beats.push({
    id: beatId += 1,
    move,
    targetTime,
    element: beatElement,
  });

  if (autoAdvanceToggle.checked) {
    currentMove = move;
    highlightMove(move);
  }
};

const updateQueue = () => {
  const upcoming = beats.slice(0, 4);
  queueList.innerHTML = "";
  upcoming.forEach((beat) => {
    const item = document.createElement("div");
    item.className = "queue-item";
    item.innerHTML = `<strong>${moveSymbols[beat.move]}</strong>${moveLabels[beat.move]}`;
    queueList.appendChild(item);
  });
  if (!upcoming.length) {
    queueList.innerHTML = `<div class="queue-item">Waiting...</div>`;
  }
};

const startTimer = () => {
  timerId = setInterval(() => {
    if (isPaused) return;
    timeLeft -= 1;
    updateStats();
    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
};

const startBeatLoop = () => {
  let lastBeat = performance.now();
  const spawn = () => {
    if (!isPlaying || isPaused) {
      animationId = requestAnimationFrame(spawn);
      return;
    }
    const now = performance.now();
    if (now - lastBeat >= gameConfig.beatInterval) {
      enqueueBeat(now);
      lastBeat = now;
      playMetronome();
    }
    animationId = requestAnimationFrame(spawn);
  };
  spawn();
};

const updateBeatPositions = (now) => {
  const laneRect = lane.getBoundingClientRect();
  const startX = laneRect.width + 40;
  const targetX = laneRect.width * 0.22;

  beats = beats.filter((beat) => {
    const timeUntil = beat.targetTime - now;
    const progress = 1 - timeUntil / gameConfig.travelTime;
    const x = startX - (startX - targetX) * progress;
    beat.element.style.left = `${x}px`;

    if (timeUntil < -gameConfig.okayWindow) {
      registerMiss(beat.move);
      beat.element.remove();
      return false;
    }
    return true;
  });
};

const animateLane = () => {
  const loop = () => {
    if (!isPlaying) return;
    if (!isPaused) {
      updateBeatPositions(performance.now());
      updateQueue();
    }
    animationId = requestAnimationFrame(loop);
  };
  loop();
};

const startGame = () => {
  if (isPlaying) return;
  isPlaying = true;
  isPaused = false;
  score = 0;
  streak = 0;
  accuracy = { hits: 0, total: 0 };
  timeLeft = gameConfig.duration;
  resetLane();
  updateStats();
  setMessage("Showtime! Hit the beats on the line.", "start");
  startTimer();
  startBeatLoop();
  animateLane();
  pauseButton.disabled = false;
  startButton.disabled = true;
};

const pauseGame = () => {
  if (!isPlaying) return;
  isPaused = !isPaused;
  pauseButton.textContent = isPaused ? "Resume" : "Pause";
  setMessage(isPaused ? "Paused. Catch your breath." : "Back on the beat!", "pause");
};

const endGame = () => {
  isPlaying = false;
  isPaused = false;
  clearInterval(timerId);
  cancelAnimationFrame(animationId);
  updateHighScore();
  setMessage(`Final bow! You scored ${score} points.`, "end");
  pauseButton.disabled = true;
  pauseButton.textContent = "Pause";
  startButton.disabled = false;
};

const resetGame = () => {
  clearInterval(timerId);
  cancelAnimationFrame(animationId);
  isPlaying = false;
  isPaused = false;
  score = 0;
  streak = 0;
  timeLeft = gameConfig.duration;
  accuracy = { hits: 0, total: 0 };
  currentMove = null;
  highlightMove(null);
  resetLane();
  updateStats();
  setMessage("Hit start to begin the show.");
  setTimingFeedback("Hit the beat to hear your timing callout.", "");
  pauseButton.disabled = true;
  pauseButton.textContent = "Pause";
  startButton.disabled = false;
};

const registerHit = (move, timing) => {
  accuracy.hits += 1;
  accuracy.total += 1;
  streak += 1;
  const multiplier = getMultiplier();
  let base = 120;
  let message = "Okay";
  let timingTone = "okay";
  let frequency = 420;

  if (timing <= gameConfig.perfectWindow) {
    base = 220;
    message = "Perfect!";
    timingTone = "perfect";
    frequency = 780;
  } else if (timing <= gameConfig.goodWindow) {
    base = 170;
    message = "Great!";
    timingTone = "good";
    frequency = 620;
  } else {
    base = 130;
    message = "Nice!";
    timingTone = "okay";
    frequency = 520;
  }

  const pointsAwarded = Math.round(base * multiplier * levelConfig[currentLevel].scoreBoost);
  score += pointsAwarded;
  setFeedback(move, "hit");
  setMessage(`${message} +${pointsAwarded} points`, "hit");
  setTimingFeedback(message, timingTone);
  playHitSound(frequency);
  updateDancerMove(move, timingTone);
};

const registerMiss = (move) => {
  accuracy.total += 1;
  streak = 0;
  setFeedback(move, "miss");
  setMessage("Missed the beat. Regain your rhythm!", "miss");
  setTimingFeedback("Miss", "miss");
  playHitSound(240);
  updateDancerMove(move, "miss");
};

const handleMove = (move) => {
  if (!isPlaying || isPaused) return;
  const now = performance.now();
  const candidates = beats
    .filter((beat) => beat.move === move)
    .map((beat) => ({
      beat,
      diff: Math.abs(beat.targetTime - now),
    }))
    .sort((a, b) => a.diff - b.diff);

  if (!candidates.length) {
    registerMiss(move);
    updateStats();
    return;
  }

  const { beat, diff } = candidates[0];
  if (diff <= gameConfig.okayWindow) {
    registerHit(move, diff);
    beat.element.classList.add("hit");
    beat.element.remove();
    beats = beats.filter((item) => item.id !== beat.id);
  } else {
    registerMiss(move);
  }

  updateStats();
};

const playMetronome = () => {
  if (!soundToggle.checked) return;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "triangle";
  oscillator.frequency.value = 740;
  gain.gain.value = 0.06;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.08);
};

const playHitSound = (frequency) => {
  if (!soundToggle.checked) return;
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
};

const updateDancerMove = (move, timingTone) => {
  if (!dancer) return;
  dancer.classList.remove("moonwalk", "spin", "pose");
  if (timingTone === "perfect") {
    dancer.classList.add("spin");
  } else if (move === "left" || move === "right") {
    dancer.classList.add("moonwalk");
  } else {
    dancer.classList.add("pose");
  }
};

const applyLevel = (level) => {
  const config = levelConfig[level];
  if (!config) return;
  currentLevel = level;
  gameConfig.beatInterval = config.beatInterval;
  gameConfig.travelTime = config.travelTime;
  updateStats();
  if (levelsEl) {
    levelsEl.querySelectorAll(".level-button").forEach((button) => {
      button.classList.toggle("active", Number(button.dataset.level) === level);
    });
  }
  setMessage(`Level ${level}: ${config.label}`, "level");
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
  if (event.key === " ") {
    pauseGame();
  }
});

startButton.addEventListener("click", () => {
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
  startGame();
});

pauseButton.addEventListener("click", pauseGame);
resetButton.addEventListener("click", resetGame);

if (levelsEl) {
  levelsEl.addEventListener("click", (event) => {
    const button = event.target.closest(".level-button");
    if (!button) return;
    applyLevel(Number(button.dataset.level));
  });
}

updateStats();
updateQueue();
applyLevel(currentLevel);
