import { globalConfigDefaults } from "./config.js";

export const state = {
  ui: {
    activePage: "play",
    status: "Ready",
    network: "Online",
    announcement: globalConfigDefaults.announcementBannerText,
    scene: "menu",
    adminUnlocked: false,
  },
  selection: {
    levelId: 1,
    trackId: "billie-jean",
    themeId: "neon-purple",
    layout: "horizontal",
    noteSize: "medium",
    laneScale: 1,
    fx: "medium",
    dancer: "low",
  },
  run: {
    running: false,
    paused: false,
    rafId: null,
    timerId: null,
    lastFrame: 0,
    lastSpawnAt: 0,
    timeLeft: 0,
    score: 0,
    streak: 0,
    maxStreak: 0,
    accuracy: 100,
    hits: 0,
    misses: 0,
    perfectCount: 0,
    goodCount: 0,
    okayCount: 0,
    missCount: 0,
    totalNotes: 0,
    totalHit: 0,
    avgMultiplier: 1,
    scoreByGrade: { perfect: 0, good: 0, okay: 0 },
  },
  auth: {
    user: null,
    status: "guest",
    role: "guest",
  },
  profile: {
    displayName: "Guest Dancer",
    favoriteTrack: "",
    lastLevelId: 1,
    lastTrackId: "billie-jean",
    personalBestScoreByLevel: {},
    personalBestAccuracyByLevel: {},
    personalBestStreakByLevel: {},
  },
  leaderboard: {
    entries: [],
    selectedLevelId: 1,
    status: "idle",
  },
  globalConfig: {
    version: 0,
    published: true,
    data: { ...globalConfigDefaults },
  },
  adminDraft: {
    changes: [],
    data: { ...globalConfigDefaults },
  },
};

export const listeners = new Set();

export const setState = (updater) => {
  updater(state);
  listeners.forEach((listener) => listener(state));
};

export const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
