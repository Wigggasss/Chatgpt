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
const timingHint = document.getElementById("timingHint");
const coachMarker = document.getElementById("coachMarker");
const levelEl = document.getElementById("level");
const tempoEl = document.getElementById("tempo");
const levelsEl = document.getElementById("levels");
const dancer = document.querySelector(".dancer-3d");
const quizQuestion = document.getElementById("quizQuestion");
const quizChoices = document.getElementById("quizChoices");
const quizFeedback = document.getElementById("quizFeedback");
const quizStartButton = document.getElementById("quizStartButton");
const quizNextButton = document.getElementById("quizNextButton");
const quizScoreEl = document.getElementById("quizScore");
const quizStreakEl = document.getElementById("quizStreak");
const menuTabs = Array.from(document.querySelectorAll(".menu-tab"));
const tabPanels = Array.from(document.querySelectorAll(".tab-panel"));
const adminLog = document.getElementById("adminLog");
const adminCommand = document.getElementById("adminCommand");
const adminRun = document.getElementById("adminRun");
const adminLock = document.getElementById("adminLock");
const adminPanel = document.getElementById("adminPanel");
const adminCode = document.getElementById("adminCode");
const adminUnlock = document.getElementById("adminUnlock");
const adminReveal = document.getElementById("adminReveal");
const adminRole = document.getElementById("adminRole");
const adminCommandList = document.getElementById("adminCommandList");
const adminSection = document.getElementById("adminSection");
const titleScreen = document.getElementById("titleScreen");
const signupScreen = document.getElementById("signupScreen");
const gameShell = document.getElementById("gameShell");
const titleStartButton = document.getElementById("titleStartButton");
const titleSkipButton = document.getElementById("titleSkipButton");
const signupContinue = document.getElementById("signupContinue");
const controlDock = document.querySelector(".control-dock");
const leaderboardList = document.getElementById("leaderboardList");
const signupForm = document.getElementById("signupForm");
const signupName = document.getElementById("signupName");
const signupTrack = document.getElementById("signupTrack");
const signupLevel = document.getElementById("signupLevel");
const signupSummary = document.getElementById("signupSummary");
const adminUsers = document.getElementById("adminUsers");
const controlDockButtons = Array.from(document.querySelectorAll(".control-dock__button"));

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
let quizIndex = 0;
let quizActive = false;
let quizAnswered = false;
let quizScore = 0;
let quizStreak = 0;
let showAdmin = false;
let adminUnlocked = false;
let adminRevealed = false;

let audioContext = null;

const ADMIN_ACCESS_CODE = "moonwalk";
const PRESET_COUNT = 100;
const THEME_PRESETS = {
  default: { accent: "#f3b73c", accent2: "#ff5da2", lane: "#191933" },
  neon: { accent: "#59d67a", accent2: "#5db7ff", lane: "#14142b" },
  starlight: { accent: "#8ad5ff", accent2: "#a855f7", lane: "#1a1830" },
  midnight: { accent: "#f59e0b", accent2: "#22d3ee", lane: "#0f172a" },
  royal: { accent: "#f472b6", accent2: "#facc15", lane: "#1f1b2f" },
};

const ADMIN_SEQUENCE = [
  "arrowup",
  "arrowup",
  "arrowdown",
  "arrowdown",
  "arrowleft",
  "arrowright",
  "arrowleft",
  "arrowright",
  "b",
  "a",
];
let adminSequenceIndex = 0;
const ADMIN_ROLES = {
  viewer: {
    label: "Viewer",
    commands: ["help", "status", "about"],
  },
  operator: {
    label: "Operator",
    commands: [
      "help",
      "status",
      "about",
      "start",
      "pause",
      "reset",
      "level",
      "tempo",
      "sound",
      "cues",
      "duration",
      "addtime",
      "window",
      "multiplier",
      "accuracy",
      "theme",
      "score",
      "streak",
      "hint",
    ],
  },
  host: {
    label: "Host",
    commands: [
      "help",
      "status",
      "about",
      "start",
      "pause",
      "reset",
      "level",
      "tempo",
      "sound",
      "cues",
      "duration",
      "addtime",
      "window",
      "multiplier",
      "accuracy",
      "theme",
      "score",
      "streak",
      "hint",
      "grant",
      "revoke",
      "lock",
      "unlock",
      "save",
      "load",
    ],
  },
};
let adminRoleState = "viewer";
const leaderboard = JSON.parse(localStorage.getItem("moonwalk-leaderboard") || "[]");
const profiles = JSON.parse(localStorage.getItem("moonwalk-profiles") || "[]");

const storedHigh = Number(localStorage.getItem("moonwalk-high")) || 0;
highScoreEl.textContent = storedHigh;

const quizItems = [
  {
    question: "Which Michael Jackson album is the best-selling album of all time?",
    choices: ["Bad", "Thriller", "Dangerous", "Off the Wall"],
    answer: 1,
    fact: "Thriller (1982) is the best-selling album worldwide and revolutionized music videos.",
  },
  {
    question: "Which dance move did Michael Jackson famously debut on TV in 1983?",
    choices: ["The moonwalk", "The robot", "The twist", "The Charleston"],
    answer: 0,
    fact: "The moonwalk debut happened during the Motown 25 performance of “Billie Jean.”",
  },
  {
    question: "What was the name of MJ’s 1992-1993 world tour?",
    choices: ["Victory Tour", "Bad World Tour", "Dangerous World Tour", "History Tour"],
    answer: 2,
    fact: "The Dangerous World Tour promoted the album Dangerous and supported global charities.",
  },
  {
    question: "Which MJ song features the iconic lean-forward choreography?",
    choices: ["Smooth Criminal", "Beat It", "Black or White", "Remember the Time"],
    answer: 0,
    fact: "The anti-gravity lean from Smooth Criminal became an iconic stage illusion.",
  },
  {
    question: "Which Motown TV special featured MJ's moonwalk debut?",
    choices: ["Motown 25", "Soul Train", "American Bandstand", "The Ed Sullivan Show"],
    answer: 0,
    fact: "Motown 25: Yesterday, Today, Forever aired in 1983.",
  },
  {
    question: "Which album includes the song “Billie Jean”?",
    choices: ["Off the Wall", "Thriller", "Bad", "Dangerous"],
    answer: 1,
    fact: "Billie Jean is a centerpiece of Thriller.",
  },
  {
    question: "MJ's 1987 tour was named after which album?",
    choices: ["Bad", "Thriller", "Dangerous", "HIStory"],
    answer: 0,
    fact: "The Bad World Tour ran from 1987 to 1989.",
  },
  {
    question: "Which song features the famous “Annie, are you OK?” lyric?",
    choices: ["Smooth Criminal", "Beat It", "Man in the Mirror", "The Way You Make Me Feel"],
    answer: 0,
    fact: "Smooth Criminal includes the “Annie, are you OK?” refrain.",
  },
  {
    question: "Which MJ album came out in 1991?",
    choices: ["Dangerous", "Bad", "Off the Wall", "Thriller"],
    answer: 0,
    fact: "Dangerous launched in 1991 and expanded his sound.",
  },
  {
    question: "Which music video features a zombie dance routine?",
    choices: ["Thriller", "Beat It", "Bad", "Remember the Time"],
    answer: 0,
    fact: "Thriller's choreographed dance remains iconic.",
  },
  {
    question: "Which song was a charity anthem released in 1985?",
    choices: ["We Are the World", "Heal the World", "Earth Song", "Will You Be There"],
    answer: 0,
    fact: "We Are the World raised funds for humanitarian aid.",
  },
  {
    question: "Which MJ song opens with a heartbeat sound?",
    choices: ["Beat It", "Billie Jean", "Dangerous", "Rock With You"],
    answer: 0,
    fact: "Beat It starts with a heartbeat sound effect.",
  },
  {
    question: "Which MJ song features a rival dance crew storyline?",
    choices: ["Beat It", "Bad", "Smooth Criminal", "Black or White"],
    answer: 0,
    fact: "Beat It pairs music with a story of ending a rivalry.",
  },
  {
    question: "Which MJ tour supported the HIStory album?",
    choices: ["HIStory World Tour", "Bad World Tour", "Dangerous World Tour", "Victory Tour"],
    answer: 0,
    fact: "The HIStory World Tour ran from 1996 to 1997.",
  },
];

const setMessage = (text, tone = "") => {
  messageEl.textContent = text;
  messageEl.dataset.tone = tone;
};

const setTimingFeedback = (text, tone) => {
  if (!timingFeedback) return;
  timingFeedback.textContent = text;
  timingFeedback.className = `timing-feedback ${tone}`;
};

const updateTimingCoach = (offset, tone) => {
  if (!coachMarker) return;
  const maxWindow = gameConfig.okayWindow;
  const clamped = Math.max(-maxWindow, Math.min(maxWindow, offset));
  const percent = 50 - (clamped / maxWindow) * 50;
  coachMarker.style.left = `${percent}%`;
  if (timingHint) {
    if (tone === "perfect") {
      timingHint.textContent = "On time! Centered hit.";
    } else if (offset > 0) {
      timingHint.textContent = `Early by ${Math.round(offset)}ms`;
    } else {
      timingHint.textContent = `Late by ${Math.round(Math.abs(offset))}ms`;
    }
  }
};

const resetTimingCoach = () => {
  if (coachMarker) {
    coachMarker.style.left = "50%";
  }
  if (timingHint) {
    timingHint.textContent = "Nail the center for maximum points.";
  }
};

const setActiveTab = (tab) => {
  menuTabs.forEach((button) => {
    button.classList.toggle("active", button.dataset.tab === tab);
  });
  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tab);
  });
};

const appendAdminLog = (text, tone = "info") => {
  if (!adminLog) return;
  const line = document.createElement("div");
  line.className = `log-line ${tone}`;
  line.textContent = text;
  adminLog.appendChild(line);
  adminLog.scrollTop = adminLog.scrollHeight;
};

const setAdminUnlocked = (unlocked) => {
  adminUnlocked = unlocked;
  if (adminLock) {
    adminLock.classList.toggle("hidden", unlocked);
  }
  if (adminPanel) {
    adminPanel.classList.toggle("hidden", !unlocked);
  }
  if (adminReveal) {
    adminReveal.classList.toggle("hidden", !unlocked);
  }
  if (adminCommand) {
    adminCommand.disabled = !unlocked;
  }
  if (adminRun) {
    adminRun.disabled = !unlocked;
  }
  if (unlocked) {
    appendAdminLog("Admin access granted. Type help to see commands.");
  }
};

const setAdminRole = (role) => {
  adminRoleState = ADMIN_ROLES[role] ? role : "viewer";
  if (adminRole) {
    adminRole.textContent = `Role: ${ADMIN_ROLES[adminRoleState].label}`;
  }
  renderCommandList();
};

const canRun = (command) => ADMIN_ROLES[adminRoleState].commands.includes(command);

const canRunForProfile = (command, profile) => {
  if (!profile) return canRun(command);
  if (profile.role && ADMIN_ROLES[profile.role]) {
    if (ADMIN_ROLES[profile.role].commands.includes(command)) return true;
  }
  return (profile.customCommands || []).includes(command);
};

const renderCommandList = () => {
  if (!adminCommandList) return;
  adminCommandList.innerHTML = "";
  const commands = new Set([
    ...ADMIN_ROLES[adminRoleState].commands,
    "help",
    "status",
    "about",
    "leaderboard",
    "profile",
    "permissions",
  ]);
  for (let i = 1; i <= PRESET_COUNT; i += 1) {
    commands.add(`preset${i}`);
  }
  Object.keys(THEME_PRESETS).forEach((theme) => {
    commands.add(`theme ${theme}`);
  });
  Array.from(commands)
    .sort()
    .forEach((command) => {
      const option = document.createElement("option");
      option.value = command;
      adminCommandList.appendChild(option);
    });
};

const setScreen = (screen) => {
  if (titleScreen) titleScreen.classList.toggle("hidden", screen !== "title");
  if (signupScreen) signupScreen.classList.toggle("hidden", screen !== "signup");
  if (gameShell) gameShell.classList.toggle("hidden", screen !== "game");
  if (controlDock) controlDock.classList.toggle("hidden", screen !== "game");
};

const revealAdminSection = () => {
  if (adminSection) {
    adminSection.classList.remove("hidden");
  }
  setActiveTab("admin");
};

const toggleAdminPanel = () => {
  adminRevealed = !adminRevealed;
  if (adminPanel) {
    adminPanel.classList.toggle("hidden", !adminRevealed);
  }
  if (adminReveal) {
    adminReveal.textContent = adminRevealed ? "Hide Panel" : "Reveal Panel";
  }
};

const logStatus = () => {
  appendAdminLog(
    `Status — Level ${currentLevel} (${levelConfig[currentLevel].label}), Tempo ${levelConfig[currentLevel].tempo} BPM, ` +
      `Score ${score}, Streak ${streak}, Accuracy ${getAccuracy()}%, Time ${timeLeft}s.`
  );
};

const logAbout = () => {
  appendAdminLog("Moonwalk Mania Admin Console: manage tempo, cues, level flow, and show pacing.");
};

const saveProfiles = () => {
  localStorage.setItem("moonwalk-profiles", JSON.stringify(profiles));
};

const upsertProfile = (profile) => {
  const existing = profiles.findIndex((item) => item.name.toLowerCase() === profile.name.toLowerCase());
  if (existing >= 0) {
    profiles[existing] = { ...profiles[existing], ...profile };
  } else {
    profiles.push(profile);
  }
  saveProfiles();
};

const renderAdminUsers = () => {
  if (!adminUsers) return;
  adminUsers.innerHTML = "";
  if (!profiles.length) {
    adminUsers.innerHTML = "<div class=\"hint\">No users yet. Ask players to sign up.</div>";
    return;
  }

  profiles.forEach((profile) => {
    const card = document.createElement("div");
    card.className = "admin-user-card";

    const header = document.createElement("div");
    header.className = "admin-user-row";
    header.innerHTML = `<strong>${profile.name}</strong><span>${profile.track || "Unknown track"}</span>`;
    card.appendChild(header);

    const actions = document.createElement("div");
    actions.className = "admin-user-actions";

    const roleSelect = document.createElement("select");
    ["viewer", "operator", "host"].forEach((role) => {
      const option = document.createElement("option");
      option.value = role;
      option.textContent = role;
      if ((profile.role || "viewer") === role) option.selected = true;
      roleSelect.appendChild(option);
    });

    const customInput = document.createElement("input");
    customInput.placeholder = "Custom commands (comma-separated)";
    customInput.value = (profile.customCommands || []).join(", ");

    const saveButton = document.createElement("button");
    saveButton.className = "ghost";
    saveButton.textContent = "Save";
    saveButton.addEventListener("click", () => {
      profile.role = roleSelect.value;
      profile.customCommands = customInput.value
        .split(",")
        .map((cmd) => cmd.trim().toLowerCase())
        .filter(Boolean);
      upsertProfile(profile);
      appendAdminLog(`Permissions saved for ${profile.name}.`);
      renderAdminUsers();
    });

    actions.appendChild(roleSelect);
    actions.appendChild(customInput);
    actions.appendChild(saveButton);
    card.appendChild(actions);
    adminUsers.appendChild(card);
  });
};

const applyPreset = (index) => {
  const tempo = 80 + index;
  const duration = 60 + Math.floor(index / 2);
  updateTempo(tempo);
  gameConfig.duration = duration;
  timeLeft = Math.min(timeLeft, gameConfig.duration);
  updateStats();
  appendAdminLog(`Preset ${index} applied: ${tempo} BPM, duration ${duration}s.`);
};

const saveShowState = () => {
  const payload = {
    level: currentLevel,
    score,
    streak,
    timeLeft,
    accuracy,
    tempo: levelConfig[currentLevel].tempo,
    duration: gameConfig.duration,
    windows: {
      perfect: gameConfig.perfectWindow,
      good: gameConfig.goodWindow,
      okay: gameConfig.okayWindow,
    },
  };
  localStorage.setItem("moonwalk-admin-save", JSON.stringify(payload));
  appendAdminLog("Show state saved.");
};

const loadShowState = () => {
  const raw = localStorage.getItem("moonwalk-admin-save");
  if (!raw) {
    appendAdminLog("No saved state found.", "error");
    return;
  }
  const payload = JSON.parse(raw);
  applyLevel(payload.level || 1);
  score = payload.score || 0;
  streak = payload.streak || 0;
  timeLeft = payload.timeLeft || gameConfig.duration;
  accuracy = payload.accuracy || { hits: 0, total: 0 };
  gameConfig.duration = payload.duration || gameConfig.duration;
  if (payload.windows) {
    gameConfig.perfectWindow = payload.windows.perfect || gameConfig.perfectWindow;
    gameConfig.goodWindow = payload.windows.good || gameConfig.goodWindow;
    gameConfig.okayWindow = payload.windows.okay || gameConfig.okayWindow;
  }
  updateStats();
  appendAdminLog("Show state loaded.");
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

const renderLeaderboard = () => {
  if (!leaderboardList) return;
  leaderboardList.innerHTML = "";
  const topScores = leaderboard.slice(0, 10);
  if (!topScores.length) {
    leaderboardList.innerHTML = "<li>No scores yet. Be the first!</li>";
    return;
  }
  topScores.forEach((entry) => {
    const item = document.createElement("li");
    item.textContent = `${entry.name} · ${entry.score} pts · Lv ${entry.level}`;
    leaderboardList.appendChild(item);
  });
};

const addLeaderboardEntry = (finalScore) => {
  const profile = JSON.parse(localStorage.getItem("moonwalk-profile") || "{}");
  leaderboard.push({
    name: profile.name || "Guest",
    score: finalScore,
    level: currentLevel,
  });
  leaderboard.sort((a, b) => b.score - a.score);
  leaderboard.splice(10);
  localStorage.setItem("moonwalk-leaderboard", JSON.stringify(leaderboard));
  renderLeaderboard();
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
  setActiveTab("play");
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
  addLeaderboardEntry(score);
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
  resetTimingCoach();
  pauseButton.disabled = true;
  pauseButton.textContent = "Pause";
  startButton.disabled = false;
  if (showAdmin) {
    appendAdminLog("Game reset.");
  }
};

const registerHit = (move, timing, offset) => {
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
    message = "Good!";
    timingTone = "okay";
    frequency = 520;
  }

  const pointsAwarded = Math.round(base * multiplier * levelConfig[currentLevel].scoreBoost);
  score += pointsAwarded;
  setFeedback(move, "hit");
  const offsetLabel =
    timingTone === "perfect" ? "On time" : offset > 0 ? `Early ${Math.round(offset)}ms` : `Late ${Math.round(Math.abs(offset))}ms`;
  setMessage(`${message} (${offsetLabel}) +${pointsAwarded} points`, "hit");
  setTimingFeedback(`${message} · ${offsetLabel}`, timingTone);
  playHitSound(frequency);
  updateDancerMove(move, timingTone);
  updateTimingCoach(offset, timingTone);
};

const registerMiss = (move) => {
  accuracy.total += 1;
  streak = 0;
  setFeedback(move, "miss");
  setMessage("Missed the beat. Regain your rhythm!", "miss");
  setTimingFeedback("Miss", "miss");
  playHitSound(240);
  updateDancerMove(move, "miss");
  updateTimingCoach(gameConfig.okayWindow, "miss");
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
  const offset = beat.targetTime - now;
  if (diff <= gameConfig.okayWindow) {
    registerHit(move, diff, offset);
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
  oscillator.type = frequency >= 700 ? "triangle" : "sine";
  oscillator.frequency.value = frequency;
  gain.gain.value = 0.08;
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.12);
};

const updateDancerMove = (move, timingTone) => {
  if (!dancer) return;
  dancer.classList.remove("moonwalk", "spin", "pose", "pose-one", "pose-two", "pose-three");
  if (timingTone === "perfect") {
    const poses = ["pose-one", "pose-two", "pose-three"];
    dancer.classList.add(poses[Math.floor(Math.random() * poses.length)]);
  } else if (move === "left" || move === "right") {
    dancer.classList.add("moonwalk");
  } else {
    dancer.classList.add("pose");
  }
};

const renderQuizQuestion = () => {
  if (!quizQuestion || !quizChoices || !quizFeedback) return;
  const item = quizItems[quizIndex];
  if (!item) return;
  quizQuestion.textContent = item.question;
  quizChoices.innerHTML = "";
  quizAnswered = false;
  quizFeedback.textContent = "Choose an answer to learn a quick fact.";
  quizNextButton.disabled = true;

  item.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "quiz-choice";
    button.textContent = choice;
    button.addEventListener("click", () => handleQuizChoice(button, index));
    quizChoices.appendChild(button);
  });
};

const updateQuizStats = () => {
  if (quizScoreEl) quizScoreEl.textContent = quizScore;
  if (quizStreakEl) quizStreakEl.textContent = quizStreak;
};

const handleQuizChoice = (button, index) => {
  if (quizAnswered) return;
  const item = quizItems[quizIndex];
  quizAnswered = true;
  quizNextButton.disabled = false;
  Array.from(quizChoices.children).forEach((choiceButton, choiceIndex) => {
    if (choiceIndex === item.answer) {
      choiceButton.classList.add("correct");
    } else if (choiceIndex === index) {
      choiceButton.classList.add("incorrect");
    }
    choiceButton.disabled = true;
  });
  if (index === item.answer) {
    quizScore += 1;
    quizStreak += 1;
    quizFeedback.textContent = `Correct! ${item.fact}`;
  } else {
    quizStreak = 0;
    quizFeedback.textContent = `Not quite. ${item.fact}`;
  }
  updateQuizStats();
};

const startQuiz = () => {
  quizActive = true;
  quizIndex = 0;
  quizScore = 0;
  quizStreak = 0;
  updateQuizStats();
  renderQuizQuestion();
};

const nextQuizQuestion = () => {
  if (!quizActive) return;
  quizIndex = (quizIndex + 1) % quizItems.length;
  renderQuizQuestion();
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
  if (showAdmin) {
    appendAdminLog(`Level set to ${level} (${config.label}).`);
  }
};

const updateTempo = (value) => {
  const tempo = Number(value);
  if (Number.isNaN(tempo) || tempo <= 0) return false;
  gameConfig.beatInterval = Math.max(320, Math.round(60000 / tempo));
  levelConfig[currentLevel].tempo = tempo;
  updateStats();
  return true;
};

const handleAdminCommand = () => {
  if (!adminCommand) return;
  if (!adminUnlocked) {
    appendAdminLog("Admin console locked. Enter the access code first.", "error");
    adminCommand.value = "";
    return;
  }
  const raw = adminCommand.value.trim();
  if (!raw) return;
  const [command, ...args] = raw.toLowerCase().split(" ");
  let handled = true;
  const presetMatch = command.match(/^preset(\d{1,3})$/);
  const activeProfile = JSON.parse(localStorage.getItem("moonwalk-profile") || "{}");

  if (!canRunForProfile(command, activeProfile) && !["help", "status", "about"].includes(command)) {
    appendAdminLog("Permission denied for this command.", "error");
    adminCommand.value = "";
    return;
  }

  switch (command) {
    case "help":
      appendAdminLog(
        [
          `Commands for ${ADMIN_ROLES[adminRoleState].label}:`,
          ADMIN_ROLES[adminRoleState].commands.join(", "),
          "Common: help, status, about",
          "Presets: preset1 ... preset100",
        ].join(" ")
      );
      break;
    case "status":
      logStatus();
      break;
    case "about":
      logAbout();
      break;
    case "start":
      startGame();
      appendAdminLog("Show started.");
      break;
    case "pause":
      pauseGame();
      appendAdminLog(isPaused ? "Show paused." : "Show resumed.");
      break;
    case "reset":
      resetGame();
      appendAdminLog("Show reset.");
      break;
    case "level": {
      const level = Number(args[0]);
      if (levelConfig[level]) {
        applyLevel(level);
      } else {
        appendAdminLog("Unknown level. Try 1, 2, or 3.", "error");
      }
      break;
    }
    case "tempo": {
      const ok = updateTempo(args[0]);
      appendAdminLog(ok ? `Tempo set to ${levelConfig[currentLevel].tempo} BPM.` : "Tempo must be a number.", ok ? "info" : "error");
      break;
    }
    case "sound": {
      const value = args[0];
      if (value === "on" || value === "off") {
        soundToggle.checked = value === "on";
        appendAdminLog(`Metronome ${soundToggle.checked ? "enabled" : "disabled"}.`);
      } else {
        appendAdminLog("Sound must be 'on' or 'off'.", "error");
      }
      break;
    }
    case "cues": {
      const value = args[0];
      if (value === "on" || value === "off") {
        autoAdvanceToggle.checked = value === "on";
        appendAdminLog(`Auto-advance cues ${autoAdvanceToggle.checked ? "enabled" : "disabled"}.`);
      } else {
        appendAdminLog("Cues must be 'on' or 'off'.", "error");
      }
      break;
    }
    case "duration": {
      const value = Number(args[0]);
      if (Number.isNaN(value) || value <= 10) {
        appendAdminLog("Duration must be a number greater than 10.", "error");
      } else {
        gameConfig.duration = Math.round(value);
        timeLeft = Math.min(timeLeft, gameConfig.duration);
        updateStats();
        appendAdminLog(`Show duration set to ${gameConfig.duration}s.`);
      }
      break;
    }
    case "addtime": {
      const value = Number(args[0]);
      if (Number.isNaN(value)) {
        appendAdminLog("Add time must be a number.", "error");
      } else {
        timeLeft = Math.max(0, Math.round(timeLeft + value));
        updateStats();
        appendAdminLog(`Added ${value}s. Time left: ${timeLeft}s.`);
      }
      break;
    }
    case "window": {
      const slot = args[0];
      const value = Number(args[1]);
      if (!["perfect", "good", "okay"].includes(slot) || Number.isNaN(value)) {
        appendAdminLog("Window usage: window <perfect|good|okay> <ms>", "error");
      } else {
        gameConfig[`${slot}Window`] = Math.max(40, Math.round(value));
        appendAdminLog(`${slot} window set to ${gameConfig[`${slot}Window`]}ms.`);
      }
      break;
    }
    case "multiplier": {
      const value = Number(args[0]);
      if (Number.isNaN(value) || value < 1) {
        appendAdminLog("Multiplier must be a number greater than 0.", "error");
      } else {
        streak = Math.round((value - 1) / 0.2) * gameConfig.comboStep;
        updateStats();
        appendAdminLog(`Multiplier adjusted to ${getMultiplier().toFixed(1)}x.`);
      }
      break;
    }
    case "accuracy": {
      const value = Number(args[0]);
      if (Number.isNaN(value) || value < 0 || value > 100) {
        appendAdminLog("Accuracy must be 0-100.", "error");
      } else {
        accuracy = { hits: value, total: 100 };
        updateStats();
        appendAdminLog(`Accuracy set to ${getAccuracy()}%.`);
      }
      break;
    }
    case "theme": {
      const value = args[0];
      if (THEME_PRESETS[value]) {
        const theme = THEME_PRESETS[value];
        document.documentElement.style.setProperty("--accent", theme.accent);
        document.documentElement.style.setProperty("--accent-2", theme.accent2);
        document.documentElement.style.setProperty("--lane", theme.lane);
        appendAdminLog(`Theme set to ${value}.`);
      } else {
        appendAdminLog(`Theme options: ${Object.keys(THEME_PRESETS).join(", ")}.`, "error");
      }
      break;
    }
    case "grant": {
      const role = args[0];
      if (!ADMIN_ROLES[role]) {
        appendAdminLog("Grant usage: grant <viewer|operator|host>", "error");
      } else {
        setAdminRole(role);
        appendAdminLog(`Role updated to ${ADMIN_ROLES[role].label}.`);
      }
      break;
    }
    case "revoke":
      setAdminRole("viewer");
      appendAdminLog("Role reset to Viewer.");
      break;
    case "lock":
      setAdminUnlocked(false);
      appendAdminLog("Admin console locked.");
      break;
    case "unlock":
      appendAdminLog("Use the access code to unlock.", "error");
      break;
    case "save":
      saveShowState();
      break;
    case "load":
      loadShowState();
      break;
    case "leaderboard":
      renderLeaderboard();
      appendAdminLog("Leaderboard refreshed.");
      break;
    case "profile":
      appendAdminLog(localStorage.getItem("moonwalk-profile") || "No profile saved.");
      break;
    case "permissions": {
      const name = args.join(" ");
      const profile = profiles.find((item) => item.name.toLowerCase() === name.toLowerCase());
      if (!profile) {
        appendAdminLog("User not found.", "error");
      } else {
        appendAdminLog(
          `${profile.name} · role=${profile.role || "viewer"} · custom=${(profile.customCommands || []).join(", ") || "none"}`
        );
      }
      break;
    }
    case "score": {
      const value = Number(args[0]);
      if (Number.isNaN(value)) {
        appendAdminLog("Score must be a number.", "error");
      } else {
        score = Math.max(0, Math.round(value));
        updateStats();
        appendAdminLog(`Score set to ${score}.`);
      }
      break;
    }
    case "streak": {
      const value = Number(args[0]);
      if (Number.isNaN(value)) {
        appendAdminLog("Streak must be a number.", "error");
      } else {
        streak = Math.max(0, Math.round(value));
        updateStats();
        appendAdminLog(`Streak set to ${streak}.`);
      }
      break;
    }
    case "hint": {
      const hint = args.join(" ");
      if (!hint) {
        appendAdminLog("Hint cannot be empty.", "error");
      } else {
        setMessage(hint);
        appendAdminLog("Hint updated on stage.");
      }
      break;
    }
    default:
      if (presetMatch) {
        const value = Number(presetMatch[1]);
        if (value >= 1 && value <= PRESET_COUNT) {
          applyPreset(value);
        } else {
          appendAdminLog("Preset out of range (1-100).", "error");
        }
      } else {
        handled = false;
      }
  }

  if (!handled) {
    appendAdminLog("Unknown command. Type help for options.", "error");
  }
  adminCommand.value = "";
};

const handleAdminUnlock = () => {
  if (!adminCode) return;
  const code = adminCode.value.trim().toLowerCase();
  if (code === ADMIN_ACCESS_CODE) {
    setAdminUnlocked(true);
    setAdminRole("operator");
  } else {
    if (adminLock) {
      const hint = adminLock.querySelector(".hint");
      if (hint) {
        hint.textContent = "Incorrect code. Try again.";
      }
    }
  }
  adminCode.value = "";
};

const keyMap = {
  arrowleft: "left",
  arrowup: "up",
  arrowdown: "down",
  arrowright: "right",
  a: "left",
  w: "up",
  s: "down",
  d: "right",
};

document.addEventListener("keydown", (event) => {
  const tagName = event.target.tagName;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(tagName);
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key.toLowerCase();

  if (isTyping) {
    return;
  }

  if (!isTyping) {
    if (key === ADMIN_SEQUENCE[adminSequenceIndex]) {
      adminSequenceIndex += 1;
      if (adminSequenceIndex >= ADMIN_SEQUENCE.length) {
        adminSequenceIndex = 0;
        revealAdminSection();
      }
    } else {
      adminSequenceIndex = 0;
    }
  }

  const move = keyMap[key];
  if (move) {
    handleMove(move);
    event.preventDefault();
  }
  if (event.key === " ") {
    pauseGame();
    event.preventDefault();
  }
  if (event.key === "ArrowUp" || event.key === "ArrowDown") {
    event.preventDefault();
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

if (menuTabs.length) {
  menuTabs.forEach((button) => {
    button.addEventListener("click", () => setActiveTab(button.dataset.tab));
  });
}

if (quizStartButton) {
  quizStartButton.addEventListener("click", startQuiz);
}

if (quizNextButton) {
  quizNextButton.addEventListener("click", nextQuizQuestion);
}

if (adminRun) {
  adminRun.addEventListener("click", handleAdminCommand);
}

if (adminCommand) {
  adminCommand.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleAdminCommand();
    }
  });
}

if (adminUnlock) {
  adminUnlock.addEventListener("click", handleAdminUnlock);
}

if (adminCode) {
  adminCode.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleAdminUnlock();
    }
  });
}

if (adminReveal) {
  adminReveal.addEventListener("click", toggleAdminPanel);
}

if (controlDockButtons.length) {
  controlDockButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      if (action === "start") {
        startGame();
      } else if (action === "pause") {
        pauseGame();
      } else if (action === "reset") {
        resetGame();
      }
    });
  });
}

if (signupForm) {
  signupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const profile = {
      name: signupName.value.trim(),
      track: signupTrack.value.trim(),
      level: signupLevel.value,
      role: "viewer",
      customCommands: [],
    };
    localStorage.setItem("moonwalk-profile", JSON.stringify(profile));
    upsertProfile(profile);
    renderAdminUsers();
    if (signupSummary) {
      signupSummary.classList.remove("hidden");
      signupSummary.textContent = `Saved! ${profile.name} · ${profile.track} · ${profile.level.toUpperCase()}`;
    }
    if (signupContinue) {
      signupContinue.classList.remove("hidden");
    }
  });
}

if (titleStartButton) {
  titleStartButton.addEventListener("click", () => setScreen("signup"));
}

if (titleSkipButton) {
  titleSkipButton.addEventListener("click", () => setScreen("game"));
}

if (signupContinue) {
  signupContinue.addEventListener("click", () => setScreen("game"));
}

updateStats();
updateQueue();
applyLevel(currentLevel);
resetTimingCoach();
updateQuizStats();
setActiveTab("play");
showAdmin = true;
setAdminUnlocked(false);
setAdminRole("viewer");
renderLeaderboard();
renderAdminUsers();
setScreen("title");
