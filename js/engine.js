import { state, setState } from "./state.js";
import { getLevel } from "./ui.js";
import { dom } from "./dom.js";

const notes = [];
const noteSpeedClamp = 1000 / 30;
let resetLock = false;
let onEndCallback = null;

const spawnNote = (now) => {
  const note = document.createElement("div");
  note.className = `note size-${state.selection.noteSize}`;
  note.dataset.spawn = now;
  dom.lane.appendChild(note);
  notes.push({
    id: now,
    spawnTime: now,
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
    note.element.style.transform = `translateX(${x}px)`;
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

export const handleHit = () => {
  if (!state.run.running || state.run.paused) return;
  if (!notes.length) {
    registerMiss();
    return "miss";
  }
  const now = performance.now();
  const laneWidth = dom.lane.clientWidth;
  const hitX = laneWidth * 0.18;
  const level = getLevel();

  let closestIndex = -1;
  let closestDiff = Infinity;

  notes.forEach((note, index) => {
    const elapsed = (now - note.spawnTime) / 1000;
    const x = laneWidth - elapsed * level.speedPxPerSec;
    const diff = Math.abs(x - hitX);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIndex = index;
    }
  });

  if (closestIndex === -1) {
    registerMiss();
    return "miss";
  }

  const diffMs = (closestDiff / level.speedPxPerSec) * 1000;
  const note = notes[closestIndex];

  if (diffMs <= level.wOkayMs) {
    const grade = diffMs <= level.wPerfectMs ? "perfect" : diffMs <= level.wGoodMs ? "good" : "okay";
    registerHit(grade);
    note.element.classList.add("hit");
    note.element.remove();
    notes.splice(closestIndex, 1);
    return grade;
  } else {
    registerMiss();
    return "miss";
  }
};

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
};

const registerMiss = () => {
  state.run.misses += 1;
  state.run.missCount += 1;
  state.run.streak = 0;
  dom.timingFeedback.textContent = "Miss";
};

export const startRun = () => {
  if (state.run.running) return;
  if (resetLock) return;
  if (state.run.rafId) {
    cancelAnimationFrame(state.run.rafId);
    state.run.rafId = null;
  }
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
      const spawnInterval = 1000 / (levelData.density * 2);
      if (now - state.run.lastSpawnAt >= spawnInterval) {
        spawnNote(now);
        state.run.lastSpawnAt = now;
      }
      updateNotes(now, dt);
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
  }, 150);

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
