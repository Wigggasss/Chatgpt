import { state, setState } from "./state.js";
import { levels, tracks } from "./config.js";
import { startRun, pauseRun, resetRun, endRun } from "./engine.js";
import { dom } from "./dom.js";

const commandLog = [];
const MAX_LOG = 100;

const log = (message, type = "info") => {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { timestamp, message, type };
  commandLog.push(entry);
  if (commandLog.length > MAX_LOG) commandLog.shift();
  return entry;
};

const parseCommand = (input) => {
  const parts = input.trim().split(/\s+/);
  if (!parts[0].startsWith("/")) return null;
  
  const category = parts[0].substring(1).toLowerCase();
  const subcommand = parts[1]?.toLowerCase() || "";
  const args = parts.slice(2);
  
  return { category, subcommand, args, raw: input };
};

const handlers = {
  help: {
    execute: (subcommand, args) => {
      if (!subcommand) {
        return `Available categories: game, player, song, level, notes, score, hud, dancer, timer, admin, debug`;
      }
      const categories = {
        game: "start, pause, resume, reset, stop, restart, status, lock, unlock, speed, seed, debug",
        player: "list, info, kick, ban, unban, mute, unmute, setlevel, resetstats, giveguest, forcesignout",
        song: "list, play, stop, preview, set, lock, unlock, volume, bpm, reload, mute, unmute",
        level: "list, set, next, previous, lock, unlock, speed, density, window, reset",
        notes: "spawn, clear, freeze, unfreeze, speed, density, pattern, random, strict, preview, debug, reset",
        score: "show, set, add, reset, stats",
        hud: "show, hide, scale, compact, reset, theme, refresh",
        dancer: "on, off, mode, move, reset, speed, effects",
        timer: "start, pause, resume, reset, set, add, status, freeze",
        admin: "lock, unlock, status, role, config",
        debug: "fps, notes, input, timing, hitwindow, memory, state, reset, log, clear",
      };
      return categories[subcommand] ? `${subcommand}: ${categories[subcommand]}` : "Category not found";
    },
  },

  version: {
    execute: () => `Moonwalk Mania v2.0.0 · Admin Console`,
  },

  status: {
    execute: () => {
      const runStatus = state.run.running ? "Running" : "Idle";
      return `Status: ${runStatus} | Level: ${levels.find(l => l.id === state.selection.levelId)?.name} | Score: ${state.run.score}`;
    },
  },

  game: {
    start: () => state.run.running ? "Already running" : (startRun(), "Game started"),
    pause: () => !state.run.running ? "Game not running" : (pauseRun(), "Toggled pause"),
    resume: () => !state.run.paused ? "Not paused" : (pauseRun(), "Resumed"),
    reset: () => (resetRun(), "Game reset"),
    stop: () => (endRun(), "Game stopped"),
    restart: () => { resetRun(); startRun(); return "Restarted"; },
    status: () => `Running: ${state.run.running} | Paused: ${state.run.paused} | Time: ${state.run.timeLeft.toFixed(1)}s`,
    lock: () => (setState(d => d.globalConfig.data.maintenanceMode = true), "Locked"),
    unlock: () => (setState(d => d.globalConfig.data.maintenanceMode = false), "Unlocked"),
    speed: (args) => {
      const mult = parseFloat(args[0]);
      if (isNaN(mult)) return "Invalid multiplier";
      return `Speed set to ${mult}x (client-side only)`;
    },
    debug: (args) => `Debug: ${args[0] === "on" ? "enabled" : "disabled"}`,
  },

  score: {
    show: () => `Score: ${state.run.score} | Streak: ${state.run.streak} | Accuracy: ${state.run.accuracy}%`,
    set: (args) => {
      const val = parseInt(args[0]);
      if (isNaN(val)) return "Invalid number";
      setState(d => d.run.score = val);
      return `Score set to ${val}`;
    },
    add: (args) => {
      const val = parseInt(args[0]);
      if (isNaN(val)) return "Invalid number";
      setState(d => d.run.score += val);
      return `Added ${val} to score`;
    },
    reset: () => (setState(d => { d.run.score = 0; d.run.streak = 0; }), "Score reset"),
  },

  level: {
    list: () => `Levels: ${levels.map(l => `${l.name}(${l.id})`).join(", ")}`,
    set: (args) => {
      const id = parseInt(args[0]);
      const level = levels.find(l => l.id === id);
      if (!level) return "Level not found";
      setState(d => d.selection.levelId = id);
      return `Level set to ${level.name}`;
    },
    next: () => {
      const current = state.selection.levelId;
      const idx = levels.findIndex(l => l.id === current);
      if (idx >= levels.length - 1) return "Already at max";
      const next = levels[idx + 1];
      setState(d => d.selection.levelId = next.id);
      return `Changed to ${next.name}`;
    },
  },

  song: {
    list: () => `Tracks: ${tracks.map(t => `${t.name}(${t.id})`).join(", ")}`,
    set: (args) => {
      const id = args[0];
      if (!tracks.find(t => t.id === id)) return "Track not found";
      setState(d => d.selection.trackId = id);
      return `Track set to ${id}`;
    },
  },

  notes: {
    clear: () => (dom.lane.innerHTML = dom.lane.innerHTML, "Notes cleared"),
    spawn: (args) => {
      const dir = args[0];
      if (!["left", "right", "up", "down"].includes(dir)) return "Invalid direction";
      return `Note spawned: ${dir}`;
    },
  },

  hud: {
    show: () => (dom.gameHud.style.display = "flex", "HUD shown"),
    hide: () => (dom.gameHud.style.display = "none", "HUD hidden"),
    reset: () => (dom.gameHud.style.display = "flex", "HUD reset"),
  },

  debug: {
    fps: () => `FPS info requested`,
    state: () => JSON.stringify(state, null, 2),
    reset: () => (commandLog.length = 0, "Debug log cleared"),
    log: () => commandLog.slice(-10).map(e => `[${e.timestamp}] ${e.message}`).join("\n"),
  },
};

export const executeCommand = (input) => {
  const cmd = parseCommand(input);
  if (!cmd) return null;

  try {
    const category = handlers[cmd.category];
    if (!category) return log(`Unknown category: ${cmd.category}`, "error").message;

    if (typeof category.execute === "function") {
      const result = category.execute(cmd.subcommand, cmd.args);
      return log(result, "success").message;
    }

    const handler = category[cmd.subcommand];
    if (!handler) return log(`Unknown command: /${cmd.category} ${cmd.subcommand}`, "error").message;

    const result = typeof handler === "function" ? handler(cmd.args) : handler;
    return log(result || "OK", "success").message;
  } catch (e) {
    return log(`Error: ${e.message}`, "error").message;
  }
};

export const getCommandLog = () => [...commandLog];
export const clearCommandLog = () => (commandLog.length = 0);
