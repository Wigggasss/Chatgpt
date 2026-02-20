import { trackProfiles } from "./config.js";
import { state, setState } from "./state.js";
import { getLevel, getTrack, updateHUD } from "./ui.js";
import { dom } from "./dom.js";

const notes = [];
const noteSpeedClamp = 1000 / 30;
let resetLock = false;
let onEndCallback = null;
let nextSpawnAt = 0;
let patternIndex = 0;
let directionIndex = 0;
let lastInputAt = 0;

const directionSymbols = {
  left: "←",
  right: "→",
  up: "↑",
  down: "↓",
};

const directionRows = {
  left: 25,
  down: 45,
  up: 65,
  right: 85,
};

const getTrackProfile = () => trackProfiles[getTrack().id] || trackProfiles.default;

const getPatternSegment = (timePlayed) => {
  const profile = getTrackProfile();
  let elapsed = 0;
  for (let i = 0; i < profile.segments.length; i += 1) {
    const segment = profile.segments[i];
    elapsed += segment.durationSec;
    if (timePlayed <= elapsed) {
      return { segment, index: i };
    }
  }
  return { segment: profile.segments[profile.segments.length - 1], index: profile.segments.length - 1 };
};

const resetPatternState = () => {
  nextSpawnAt = 0;
  patternIndex = 0;
  directionIndex = 0;
  lastInputAt = 0;
};

const spawnNote = (now, direction) => {
  const note = document.createElement("div");
  note.className = `note size-${state.selection.noteSize} dir-${direction}`;
  note.dataset.spawn = now;
  note.dataset.direction = direction;
  note.textContent = directionSymbols[direction];
  note.style.top = `${directionRows[direction]}%`;
  
  const laneWidth = dom.lane.clientWidth;
  // Randomize horizontal spawn position across full lane width to prevent stacking
  const randomX = Math.random() * laneWidth;
  note.style.left = `${randomX}px`;
  
  // scale note slightly with level speed to aid visibility at high speeds
  const level = getLevel();
  const baseSpeed = 300;
  const extra = Math.max(0, (level.speedPxPerSec - baseSpeed) / 600);
  const scale = Math.min(1.5, 1 + extra + 0.1);
  note.style.transform = `translate(-50%, -50%) scale(${scale})`;
  dom.lane.appendChild(note);
  notes.push({
    id: now,
    spawnTime: now,
    direction,
    element: note,
  });
  state.run.totalNotes += 1;
};

const updateNotes = (now, dt) => {
  const laneWidth = dom.lane.clientWidth;
  const hitX = laneWidth * 0.18;
  const level = getLevel();
  const speed = level.speedPxPerSec;

  notes.forEach((note) => {
    const elapsed = (now - note.spawnTime) / 1000;
    const x = laneWidth - elapsed * speed;
    note.element.style.left = `${x}px`;
  });

  for (let i = notes.length - 1; i >= 0; i -= 1) {
    const note = notes[i];
    const elapsed = (now - note.spawnTime) / 1000;
    const x = laneWidth - elapsed * speed;
    if (x < hitX - 80) {
      registerMiss();
      note.element.remove();
      notes.splice(i, 1);
    }
  }

  state.run.avgMultiplier = 1 + Math.floor(state.run.streak / 8) * 0.2;
  state.run.accuracy = state.run.hits + state.run.misses === 0
    ? 100
    : Math.max(0, Math.round((state.run.hits / (state.run.hits + state.run.misses)) * 100));
  state.run.timeLeft = Math.max(0, state.run.timeLeft - dt / 1000);
};

export const handleHit = (direction) => {
  if (!state.run.running || state.run.paused) return;
  const now = performance.now();
  // Reduce debounce to 15ms to allow proper single taps in rhythm games
  if (now - lastInputAt < 15) return;
  lastInputAt = now;

  if (!notes.length) {
    registerMiss();
    return "miss";
  }
  const laneWidth = dom.lane.clientWidth;
  const hitX = laneWidth * 0.18;
  const level = getLevel();

  const note = notes[0];
  const elapsed = (now - note.spawnTime) / 1000;
  const x = laneWidth - elapsed * level.speedPxPerSec;
  const diff = Math.abs(x - hitX);
  const offset = state.selection.timingOffset || 0;
  const diffMs = (diff / level.speedPxPerSec) * 1000 - offset;

  if (diffMs <= level.wOkayMs) {
    const grade = diffMs <= level.wPerfectMs ? "perfect" : diffMs <= level.wGoodMs ? "good" : "okay";
    if (note.direction !== direction) {
      registerMiss();
      note.element.remove();
      notes.shift();
      return "miss";
    }
    registerHit(grade);
    note.element.classList.add("hit");
    note.element.remove();
    notes.shift();
    return grade;
  }

  if (x < hitX) {
    registerMiss();
    note.element.remove();
    notes.shift();
    return "miss";
  }

  registerMiss();
  return "miss";
};

export const peekNextNote = () => (notes.length ? notes[0].direction : null);

const registerHit = (grade) => {
  state.run.hits += 1;
  state.run.totalHit += 1;
  state.run.streak += 1;
  state.run.maxStreak = Math.max(state.run.maxStreak, state.run.streak);
  let points = 60;
  if (grade === "perfect") {
    points = 140;
    state.run.perfectCount += 1;
    state.run.scoreByGrade.perfect += points;
    dom.timingFeedback.textContent = "Perfect!";
  } else if (grade === "good") {
    points = 100;
    state.run.goodCount += 1;
    state.run.scoreByGrade.good += points;
    dom.timingFeedback.textContent = "Good!";
  } else {
    points = 80;
    state.run.okayCount += 1;
    state.run.scoreByGrade.okay += points;
    dom.timingFeedback.textContent = "Okay!";
  }
  const multiplier = 1 + Math.floor(state.run.streak / 8) * 0.2;
  state.run.score += Math.round(points * multiplier);
  // Visual lane feedback for hits
  try {
    dom.lane.classList.add(`grade-${grade}`);
    setTimeout(() => dom.lane.classList.remove(`grade-${grade}`), 160);
  } catch (e) {
    // ignore DOM errors in non-browser environments
  }
};

const registerMiss = () => {
  state.run.misses += 1;
  state.run.missCount += 1;
  state.run.streak = 0;
  dom.timingFeedback.textContent = "Miss";
  // Visual feedback for miss
  try {
    dom.lane.classList.add("grade-miss");
    setTimeout(() => dom.lane.classList.remove("grade-miss"), 200);
  } catch (e) {
    // ignore
  }
};

export const startRun = () => {
  if (state.run.running) return;
  if (resetLock) return;
  if (state.run.rafId) {
    cancelAnimationFrame(state.run.rafId);
    state.run.rafId = null;
  }
  resetPatternState();
  const level = getLevel();
  setState((draft) => {
    draft.run.running = true;
    draft.run.paused = false;
    draft.run.lastFrame = performance.now();
    draft.run.lastSpawnAt = performance.now();
    draft.run.timeLeft = level.timeSec;
    draft.ui.status = "Running";
  });

  const loop = (now) => {
    if (!state.run.running) return;
    const dt = Math.min(noteSpeedClamp, now - state.run.lastFrame);
    state.run.lastFrame = now;

    if (!state.run.paused) {
      const levelData = getLevel();
      const timePlayed = levelData.timeSec - state.run.timeLeft;
      const { segment, index } = getPatternSegment(timePlayed);
      if (patternIndex !== index) {
        patternIndex = index;
        directionIndex = 0;
      }
      const spacingMs = segment.spacingMs / levelData.density;
      if (now >= nextSpawnAt) {
        const direction = segment.directions[directionIndex % segment.directions.length];
        spawnNote(now, direction);
        directionIndex += 1;
        nextSpawnAt = now + spacingMs;
        state.run.lastSpawnAt = now;
      }
      updateNotes(now, dt);
      updateHUD();
      if (state.run.timeLeft <= 0) {
        endRun();
        return;
      }
    }

    state.run.rafId = requestAnimationFrame(loop);
  };

  state.run.rafId = requestAnimationFrame(loop);
};

export const pauseRun = () => {
  if (!state.run.running) return;
  setState((draft) => {
    draft.run.paused = !draft.run.paused;
    draft.ui.status = draft.run.paused ? "Paused" : "Running";
  });
};

export const resetRun = () => {
  if (resetLock) return;
  resetLock = true;
  setTimeout(() => {
    resetLock = false;
  }, 300);

  if (state.run.rafId) {
    cancelAnimationFrame(state.run.rafId);
    state.run.rafId = null;
  }
  if (state.run.timerId) {
    clearInterval(state.run.timerId);
    state.run.timerId = null;
  }
  // Completely clear all notes from DOM
  notes.forEach((note) => {
    if (note.element && note.element.parentNode) {
      note.element.remove();
    }
  });
  notes.length = 0;
  resetPatternState();

  const level = getLevel();
  setState((draft) => {
    draft.run.running = false;
    draft.run.paused = false;
    draft.run.lastFrame = 0;
    draft.run.lastSpawnAt = 0;
    draft.run.timeLeft = level.timeSec;
    draft.run.score = 0;
    draft.run.streak = 0;
    draft.run.maxStreak = 0;
    draft.run.hits = 0;
    draft.run.misses = 0;
    draft.run.perfectCount = 0;
    draft.run.goodCount = 0;
    draft.run.okayCount = 0;
    draft.run.missCount = 0;
    draft.run.totalNotes = 0;
    draft.run.totalHit = 0;
    draft.run.avgMultiplier = 1;
    draft.run.scoreByGrade = { perfect: 0, good: 0, okay: 0 };
    draft.ui.status = "Ready";
  });
};

export const endRun = () => {
  if (state.run.rafId) {
    cancelAnimationFrame(state.run.rafId);
    state.run.rafId = null;
  }
  if (state.run.timerId) {
    clearInterval(state.run.timerId);
    state.run.timerId = null;
  }
  notes.forEach((note) => note.element.remove());
  notes.length = 0;
  resetPatternState();
  setState((draft) => {
    draft.run.running = false;
    draft.run.paused = false;
    draft.ui.status = "Ready";
  });
  if (onEndCallback) {
    onEndCallback();
  }
};

export const setRunEndCallback = (callback) => {
  onEndCallback = callback;
};

export const isResetLocked = () => resetLock;
