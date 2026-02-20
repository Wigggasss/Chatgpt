import { levels, tracks, themes, choreography, globalConfigDefaults } from "./config.js";
import { state, setState } from "./state.js";
import { dom } from "./dom.js";
import {
  setActivePage,
  renderLevels,
  renderTracks,
  renderLeaderboardLevels,
  renderLeaderboard,
  updateHUD,
  updateStatus,
  updateProfileCard,
  updateSettingsForm,
  renderThemeOptions,
  applyTheme,
  renderTrackEmbed,
  updateSummary,
  openSummary,
  closeSummary,
  getLevel,
  getTrack,
  setGameSceneActive,
  updateAdminVisibility,
} from "./ui.js";
import { initAuth, bindAuthActions } from "./auth.js";
import { initSync, setNetworkStatus } from "./sync.js";
import { fetchLeaderboard, submitScore, saveProfile } from "./api.js";
import { startRun, pauseRun, resetRun, handleHit, endRun, setRunEndCallback } from "./engine.js";
import { initAdminPanel, revealAdminNav } from "./admin.js";
import { updateAudioEmbed, bindAudioControls } from "./audio.js";

const quizItems = [
  {
    question: "Which album is MJ's best-selling?",
    choices: ["Bad", "Thriller", "Dangerous", "Off the Wall"],
    answer: 1,
    fact: "Thriller is the best-selling album of all time.",
  },
  {
    question: "Which TV special featured the moonwalk debut?",
    choices: ["Motown 25", "Soul Train", "Bandstand", "Ed Sullivan"],
    answer: 0,
    fact: "Motown 25 aired in 1983.",
  },
  {
    question: "Which song features the anti-gravity lean?",
    choices: ["Smooth Criminal", "Beat It", "Bad", "Thriller"],
    answer: 0,
    fact: "Smooth Criminal introduced the lean.",
  },
  {
    question: "Which album includes 'Billie Jean'?",
    choices: ["Thriller", "Bad", "Dangerous", "Off the Wall"],
    answer: 0,
    fact: "Billie Jean is on Thriller.",
  },
  {
    question: "Which tour supported the Bad album?",
    choices: ["Bad World Tour", "Dangerous", "Victory", "HIStory"],
    answer: 0,
    fact: "The Bad World Tour ran 1987-1989.",
  },
  {
    question: "Which video features a zombie dance?",
    choices: ["Thriller", "Beat It", "Bad", "Jam"],
    answer: 0,
    fact: "Thriller's choreo is iconic.",
  },
  {
    question: "Which song opens with a heartbeat?",
    choices: ["Beat It", "Billie Jean", "Rock With You", "Bad"],
    answer: 0,
    fact: "Beat It starts with a heartbeat effect.",
  },
  {
    question: "Which album released in 1991?",
    choices: ["Dangerous", "Bad", "Thriller", "Off the Wall"],
    answer: 0,
    fact: "Dangerous launched in 1991.",
  },
  {
    question: "Which song includes 'Annie, are you OK?'",
    choices: ["Smooth Criminal", "Billie Jean", "Bad", "Beat It"],
    answer: 0,
    fact: "Smooth Criminal uses that line.",
  },
  {
    question: "Which MJ album came first?",
    choices: ["Off the Wall", "Thriller", "Bad", "Dangerous"],
    answer: 0,
    fact: "Off the Wall released in 1979.",
  },
];

let quizIndex = 0;
let quizScore = 0;
let quizStreak = 0;

const updateQuizUI = () => {
  dom.quizScore.textContent = quizScore;
  dom.quizStreak.textContent = quizStreak;
};

const renderQuizQuestion = () => {
  const item = quizItems[quizIndex];
  dom.quizQuestion.textContent = item.question;
  dom.quizChoices.innerHTML = "";
  dom.quizFeedback.textContent = "Choose an answer.";
  dom.quizNextButton.disabled = true;

  item.choices.forEach((choice, index) => {
    const button = document.createElement("button");
    button.className = "quiz-choice";
    button.textContent = choice;
    button.addEventListener("click", () => handleQuizChoice(index));
    dom.quizChoices.appendChild(button);
  });
};

const handleQuizChoice = (index) => {
  const item = quizItems[quizIndex];
  const buttons = Array.from(dom.quizChoices.children);
  buttons.forEach((button, idx) => {
    button.disabled = true;
    if (idx === item.answer) button.classList.add("correct");
    if (idx === index && idx !== item.answer) button.classList.add("incorrect");
  });
  dom.quizNextButton.disabled = false;
  if (index === item.answer) {
    quizScore += 1;
    quizStreak += 1;
    dom.quizFeedback.textContent = `Correct! ${item.fact}`;
  } else {
    quizStreak = 0;
    dom.quizFeedback.textContent = `Not quite. ${item.fact}`;
  }
  updateQuizUI();
};

const setRunStatus = (status) => {
  setState((draft) => {
    draft.ui.status = status;
  });
  updateStatus();
};

const updateDancer = (grade) => {
  if (state.selection.dancer === "off") return;
  const track = getTrack();
  const choreo = choreography[track.id] || choreography.default;
  const options = choreo.triggers[grade] || [choreo.baseAnim];
  const choice = options[Math.floor(Math.random() * options.length)];
  const levelTier = state.selection.levelId <= 3 ? "low" : state.selection.levelId <= 6 ? "mid" : "high";
  const speed = choreo.intensityByLevel[levelTier] || 1;
  dom.dancer.dataset.move = choice;
  dom.dancer.style.setProperty("--dancer-speed", speed);
  dom.dancer.className = `dancer-silhouette ${choice} ${state.selection.dancer}`;
};

const formatKeyLabel = (key) => {
  if (!key) return "";
  if (key.startsWith("arrow")) {
    return `Arrow ${key.replace("arrow", "").replace(/^./, (ch) => ch.toUpperCase())}`;
  }
  if (key === " ") return "Space";
  return key.length === 1 ? key.toUpperCase() : key;
};

const resolveDirectionFromKey = (key) => {
  const lowered = key.toLowerCase();
  const binds = state.selection.keybinds;
  if (lowered === binds.left) return "left";
  if (lowered === binds.down) return "down";
  if (lowered === binds.up) return "up";
  if (lowered === binds.right) return "right";
  return null;
};

const handleKeydown = (event) => {
  if (state.ui.scene !== "game") return;
  const isTyping = ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName);
  if (isTyping) return;
  const key = event.key.toLowerCase();
  const direction = resolveDirectionFromKey(key);
  if (direction) {
    const grade = handleHit(direction) || "good";
    updateDancer(grade);
    event.preventDefault();
  }
  if (key === " ") {
    pauseRun();
    setRunStatus(state.run.paused ? "Paused" : "Running");
    event.preventDefault();
  }
};

const syncSetupControls = () => {
  dom.setupTrackSelect.value = state.selection.trackId;
  dom.setupLevelSelect.value = String(state.selection.levelId);
  dom.setupLayoutSelect.value = state.selection.layout;
  dom.setupThemeSelect.value = state.selection.themeId;
  dom.setupNoteSizeSelect.value = state.selection.noteSize;
  dom.setupLaneScaleInput.value = state.selection.laneScale;
  dom.setupFxSelect.value = state.selection.fx;
  dom.setupDancerSelect.value = state.selection.dancer;
  dom.setupCustomTrackInput.value = state.selection.customTrackQuery || "";
  dom.bindLeft.value = formatKeyLabel(state.selection.keybinds.left);
  dom.bindDown.value = formatKeyLabel(state.selection.keybinds.down);
  dom.bindUp.value = formatKeyLabel(state.selection.keybinds.up);
  dom.bindRight.value = formatKeyLabel(state.selection.keybinds.right);
};

const syncSelection = () => {
  updateHUD();
  updateSettingsForm();
  syncSetupControls();
  applyTheme(state.selection.themeId);
  renderTrackEmbed(state.selection.autoplay && !state.selection.muted);
  dom.lane.style.transform = `scaleX(${state.selection.laneScale})`;
  document.body.dataset.layout = state.selection.layout;
};

const populateSetupOptions = () => {
  dom.setupTrackSelect.innerHTML = tracks
    .map((track) => `<option value="${track.id}">${track.name} (${track.bpm} BPM)</option>`)
    .join("");
  dom.setupTrackSelect.insertAdjacentHTML("beforeend", `<option value="custom">Custom Song (AcroMusic)</option>`);
  dom.setupLevelSelect.innerHTML = levels
    .map((level) => `<option value="${level.id}">Lv ${level.id} · ${level.name}</option>`)
    .join("");
  dom.setupThemeSelect.innerHTML = themes
    .map((theme) => `<option value="${theme.id}">${theme.name}</option>`)
    .join("");
  syncSetupControls();
};

const toggleSetupOverlay = (visible) => {
  dom.setupOverlay.classList.toggle("hidden", !visible);
  dom.gameScene.classList.toggle("running", !visible);
  dom.setupRunHint.textContent = state.run.running
    ? "Reset to change settings."
    : "Choose settings before starting.";
};

const resetKeybindsToDefault = () => {
  applySelection("keybinds", {
    left: "arrowleft",
    down: "arrowdown",
    up: "arrowup",
    right: "arrowright",
  });
};

const applySelection = (key, value) => {
  if (state.run.running) {
    dom.settingsHint.textContent = "Reset to change settings while running.";
    dom.setupRunHint.textContent = "Reset to change settings.";
    return;
  }
  dom.settingsHint.textContent = "";
  setState((draft) => {
    draft.selection[key] = value;
  });
  syncSelection();
  persistSettings();
};

const persistSettings = () => {
  localStorage.setItem("moonwalk-settings", JSON.stringify(state.selection));
  if (state.auth.user) {
    saveProfile({
      displayName: state.profile.displayName,
      themeId: state.selection.themeId,
      layout: state.selection.layout,
      noteSize: state.selection.noteSize,
      laneScale: state.selection.laneScale,
      fx: state.selection.fx,
      lastLevelId: state.selection.levelId,
      lastTrackId: state.selection.trackId,
    });
  }
};

const loadSettings = () => {
  const stored = JSON.parse(localStorage.getItem("moonwalk-settings") || "{}");
  setState((draft) => {
    draft.selection = { ...draft.selection, ...stored };
  });
};

const submitRunScore = async () => {
  const levelId = state.selection.levelId;
  const currentBest = state.profile.personalBestScoreByLevel[levelId] || 0;
  const isBest = state.run.score > currentBest;
  if (isBest) {
    setState((draft) => {
      draft.profile.personalBestScoreByLevel[levelId] = state.run.score;
      draft.profile.personalBestAccuracyByLevel[levelId] = state.run.accuracy;
      draft.profile.personalBestStreakByLevel[levelId] = state.run.maxStreak;
    });
  }
  try {
    const payload = {
      playerName: state.profile.displayName,
      score: state.run.score,
      accuracy: state.run.accuracy,
      streakMax: state.run.maxStreak,
      levelId: state.selection.levelId,
      trackId: state.selection.trackId,
    };
    const response = await submitScore(payload);
    updateSummary(response.status || "Submitted", isBest);
  } catch (error) {
    updateSummary("Failed", isBest);
  }
  openSummary();
};

const refreshLeaderboard = async () => {
  try {
    const entries = await fetchLeaderboard();
    renderLeaderboard(entries);
  } catch (error) {
    renderLeaderboard([]);
  }
};

const bindEvents = () => {
  dom.navItems.forEach((button) => {
    button.addEventListener("click", () => setActivePage(button.dataset.page));
  });

  dom.enterGameButton.addEventListener("click", () => {
    setGameSceneActive(true);
    toggleSetupOverlay(true);
    dom.timingFeedback.textContent = "Choose a track in setup, then start.";
  });

  dom.exitGameButton.addEventListener("click", () => {
    if (state.run.running && !state.run.paused) {
      pauseRun();
      setRunStatus("Paused");
    }
    setGameSceneActive(false);
  });

  dom.startButton.addEventListener("click", () => {
    if (state.globalConfig.data.maintenanceMode) {
      dom.timingFeedback.textContent = "Maintenance mode: runs disabled.";
      return;
    }
    toggleSetupOverlay(false);
    renderTrackEmbed(true);
    startRun();
    setRunStatus("Running");
    dom.pauseButton.disabled = false;
  });

  dom.pauseButton.addEventListener("click", () => {
    pauseRun();
    setRunStatus(state.run.paused ? "Paused" : "Running");
  });

  dom.resetButton.addEventListener("click", () => {
    resetRun();
    toggleSetupOverlay(true);
    setRunStatus("Ready");
    dom.pauseButton.disabled = true;
  });

  dom.summaryClose.addEventListener("click", closeSummary);
  dom.summaryPlayAgain.addEventListener("click", () => {
    closeSummary();
    resetRun();
    toggleSetupOverlay(false);
    renderTrackEmbed(true);
    startRun();
    setRunStatus("Running");
    dom.pauseButton.disabled = false;
  });
  dom.summaryBackLevels.addEventListener("click", () => {
    closeSummary();
    setGameSceneActive(false);
    setActivePage("levels");
  });
  dom.summaryViewLeaderboard.addEventListener("click", () => {
    closeSummary();
    setGameSceneActive(false);
    setActivePage("leaderboard");
  });

  dom.quizStartButton.addEventListener("click", () => {
    quizIndex = 0;
    quizScore = 0;
    quizStreak = 0;
    updateQuizUI();
    renderQuizQuestion();
  });
  dom.quizNextButton.addEventListener("click", () => {
    quizIndex = (quizIndex + 1) % quizItems.length;
    renderQuizQuestion();
  });

  dom.levelsPanel.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-level]");
    if (!button) return;
    applySelection("levelId", Number(button.dataset.level));
  });

  dom.tracksPanel.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-track]");
    if (!button) return;
    applySelection("trackId", button.dataset.track);
  });

  dom.leaderboardLevelSelect.addEventListener("change", () => {
    refreshLeaderboard();
  });

  dom.themeSelect.addEventListener("change", () => applySelection("themeId", dom.themeSelect.value));
  dom.layoutSelect.addEventListener("change", () => applySelection("layout", dom.layoutSelect.value));
  dom.noteSizeSelect.addEventListener("change", () => applySelection("noteSize", dom.noteSizeSelect.value));
  dom.laneScaleInput.addEventListener("input", () => applySelection("laneScale", Number(dom.laneScaleInput.value)));
  dom.fxSelect.addEventListener("change", () => applySelection("fx", dom.fxSelect.value));
  dom.dancerSelect.addEventListener("change", () => applySelection("dancer", dom.dancerSelect.value));


  dom.setupTrackSelect.addEventListener("change", () => applySelection("trackId", dom.setupTrackSelect.value));
  dom.setupLevelSelect.addEventListener("change", () => applySelection("levelId", Number(dom.setupLevelSelect.value)));
  dom.setupLayoutSelect.addEventListener("change", () => applySelection("layout", dom.setupLayoutSelect.value));
  dom.setupThemeSelect.addEventListener("change", () => applySelection("themeId", dom.setupThemeSelect.value));
  dom.setupNoteSizeSelect.addEventListener("change", () => applySelection("noteSize", dom.setupNoteSizeSelect.value));
  dom.setupLaneScaleInput.addEventListener("input", () => applySelection("laneScale", Number(dom.setupLaneScaleInput.value)));
  dom.setupFxSelect.addEventListener("change", () => applySelection("fx", dom.setupFxSelect.value));
  dom.setupDancerSelect.addEventListener("change", () => applySelection("dancer", dom.setupDancerSelect.value));

  dom.setupCustomTrackButton.addEventListener("click", () => {
    const query = dom.setupCustomTrackInput.value.trim();
    if (!query) return;
    setState((draft) => {
      draft.selection.trackId = "custom";
      draft.selection.customTrackQuery = query;
      draft.selection.customTrackBpm = Math.max(70, Math.min(190, 80 + Math.floor(query.length * 2)));
    });
    syncSelection();
    persistSettings();
  });

  const bindFields = [
    [dom.bindLeft, "left"],
    [dom.bindDown, "down"],
    [dom.bindUp, "up"],
    [dom.bindRight, "right"],
  ];

  bindFields.forEach(([input, direction]) => {
    input.addEventListener("keydown", (event) => {
      event.preventDefault();
      const key = event.key.toLowerCase();
      const next = { ...state.selection.keybinds, [direction]: key };
      applySelection("keybinds", next);
    });
  });

  dom.resetKeybinds.addEventListener("click", resetKeybindsToDefault);

  dom.setupLoginButton.addEventListener("click", () => {
    setGameSceneActive(false);
    setActivePage("profile");
  });

  dom.setupGuestButton.addEventListener("click", () => {
    setState((draft) => {
      draft.auth.user = null;
      draft.auth.status = "guest";
      draft.profile.displayName = draft.profile.displayName || "Guest Dancer";
    });
    updateProfileCard();
  });

  dom.displayNameInput.addEventListener("input", () => {
    setState((draft) => {
      draft.profile.displayName = dom.displayNameInput.value;
    });
    updateProfileCard();
    persistSettings();
  });

  dom.favoriteTrackInput.addEventListener("input", () => {
    setState((draft) => {
      draft.profile.favoriteTrack = dom.favoriteTrackInput.value;
    });
  });

  document.addEventListener("keydown", handleKeydown);

  dom.profileLoginButton.addEventListener("click", () => setActivePage("profile"));
};

const init = async () => {
  loadSettings();
  setState((draft) => {
    const level = levels.find((item) => item.id === draft.selection.levelId) || levels[0];
    draft.run.timeLeft = level.timeSec;
  });
  renderThemeOptions();
  populateSetupOptions();
  renderLevels();
  renderTracks();
  renderLeaderboardLevels();
  updateHUD();
  updateStatus();
  updateProfileCard();
  updateSettingsForm();
  applyTheme(state.selection.themeId);
  renderTrackEmbed();
  syncSelection();
  toggleSetupOverlay(true);
  bindEvents();
  bindAuthActions();
  bindAudioControls();
  initAdminPanel();
  await initAuth();
  updateAdminVisibility(["admin", "superadmin", "mod", "host"].includes(state.auth.role));
  await initSync();

  setNetworkStatus(navigator.onLine ? "Online" : "Offline");
  window.addEventListener("online", () => setNetworkStatus("Online"));
  window.addEventListener("offline", () => setNetworkStatus("Offline"));

  const konami = ["arrowup", "arrowup", "arrowdown", "arrowdown", "arrowleft", "arrowright", "arrowleft", "arrowright", "b", "a"];
  let index = 0;
  document.addEventListener("keydown", (event) => {
    if (event.key.toLowerCase() === konami[index]) {
      index += 1;
      if (index >= konami.length) {
        if (["admin", "superadmin", "mod", "host"].includes(state.auth.role)) {
          setState((draft) => {
            draft.ui.adminUnlocked = true;
          });
          updateAdminVisibility(true);
          revealAdminNav();
        }
        index = 0;
      }
    } else {
      index = 0;
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === "m") {
      if (state.ui.scene !== "game") {
        setActivePage("admin");
      }
      event.preventDefault();
    }
  });

  setState((draft) => {
    draft.globalConfig.data = { ...globalConfigDefaults };
  });

  refreshLeaderboard();
};

window.addEventListener("load", init);

setRunEndCallback(() => {
  submitRunScore();
  toggleSetupOverlay(true);
  renderTrackEmbed(false);
  dom.pauseButton.disabled = true;
});
