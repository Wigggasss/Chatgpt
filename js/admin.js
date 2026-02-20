import { commandList, globalConfigDefaults, themes, levels, tracks } from "./config.js";
import { state, setState } from "./state.js";
import { dom } from "./dom.js";
import { publishGlobalConfig } from "./api.js";
import { broadcastLocalUpdate } from "./sync.js";
import { updateAdminVisibility } from "./ui.js";

const ADMIN_ACCESS_CODE = "moonwalk";

const log = (status, message, details = "") => {
  const card = document.createElement("div");
  card.className = "log-card";
  const ts = new Date().toLocaleTimeString();
  card.innerHTML = `
    <div class="log-title">${status} ${message} <span class="log-ts">${ts}</span></div>
    ${details ? `<details><summary>details</summary><pre>${details}</pre></details>` : ""}
  `;
  dom.adminLog.prepend(card);
  // keep newest visible
  if (dom.adminLog.children.length > 200) {
    const last = dom.adminLog.children[dom.adminLog.children.length - 1];
    last.remove();
  }
};

const updateDraftCount = () => {
  dom.draftCount.textContent = state.adminDraft.changes.length;
  dom.publishedVersion.textContent = state.globalConfig.version;
};

const applyDraftChange = (path, value) => {
  const previous = state.adminDraft.data[path];
  setState((draft) => {
    draft.adminDraft.changes.push({ path, before: previous, after: value, ts: Date.now() });
    draft.adminDraft.data[path] = value;
  });
  updateDraftCount();
};

const undoDraft = () => {
  const last = state.adminDraft.changes.pop();
  if (!last) return;
  setState((draft) => {
    draft.adminDraft.data[last.path] = last.before;
  });
  updateDraftCount();
};

const publishDraft = async () => {
  try {
    const payload = {
      ...state.adminDraft.data,
      version: state.globalConfig.version,
    };
    const updated = await publishGlobalConfig(payload);
    if (updated) {
      setState((draft) => {
        draft.globalConfig.data = payload;
        draft.globalConfig.version = updated.version || draft.globalConfig.version + 1;
        draft.ui.announcement = payload.announcementBannerText || draft.ui.announcement;
        draft.adminDraft.changes = [];
      });
    } else {
      setState((draft) => {
        draft.globalConfig.data = payload;
        draft.adminDraft.changes = [];
      });
    }
    broadcastLocalUpdate(payload);
    log("✅", "Published global config", JSON.stringify(payload, null, 2));
  } catch (error) {
    log("❌", "Publish failed", error.message);
  }
  updateDraftCount();
};

const handleCommand = (raw) => {
  const command = raw.trim();
  if (!command) return;
  if (!state.ui.adminUnlocked) {
    log("⚠️", "Locked", "Unlock admin access before running commands.");
    return;
  }

  if (command === "help" || command === "commands") {
    log("✅", "Commands", commandList.join("\n"));
    return;
  }
  if (command === "whoami") {
    log("✅", "Role", state.auth.user ? "admin" : "guest");
    return;
  }
  if (command === "permissions") {
    log("✅", "Permissions", "Draft & publish global config; view sync status.");
    return;
  }
  if (command === "config draft show") {
    log("✅", "Draft config", JSON.stringify(state.adminDraft.data, null, 2));
    return;
  }
  if (command.startsWith("config draft set")) {
    const [, , , path, ...valueParts] = command.split(" ");
    const value = valueParts.join(" ");
    if (!path) {
      log("⚠️", "Usage", "config draft set <path> <value>");
      return;
    }
    applyDraftChange(path, value);
    log("✅", "Draft updated", `${path} = ${value}`);
    return;
  }
  if (command === "config draft undo") {
    undoDraft();
    log("✅", "Draft undo", "Reverted last change");
    return;
  }
  if (command === "config draft reset") {
    setState((draft) => {
      draft.adminDraft.data = { ...globalConfigDefaults };
      draft.adminDraft.changes = [];
    });
    updateDraftCount();
    log("✅", "Draft reset", "Draft set to defaults");
    return;
  }
  if (command === "config publish") {
    if (!confirm("Publish draft to global config? This will apply changes to all users.")) {
      log("⚠️", "Publish cancelled", "User cancelled publish.");
      return;
    }
    publishDraft();
    return;
  }
  if (command.startsWith("config get")) {
    const [, , path] = command.split(" ");
    if (!path) {
      log("⚠️", "Usage", "config get <path>");
      return;
    }
    log("✅", "Config", String(state.globalConfig.data[path]));
    return;
  }
  if (command.startsWith("announce set")) {
    const text = command.replace("announce set", "").trim().replace(/^"|"$/g, "");
    applyDraftChange("announcementBannerText", text);
    log("✅", "Draft announcement", text);
    return;
  }
  if (command === "announce clear") {
    applyDraftChange("announcementBannerText", "");
    log("✅", "Draft announcement", "Cleared");
    return;
  }
  if (command.startsWith("featured level set")) {
    const value = Number(command.split(" ").pop());
    if (!levels.find((level) => level.id === value)) {
      log("⚠️", "Unknown level", "Pick a valid level id");
      return;
    }
    applyDraftChange("featuredLevelId", value);
    log("✅", "Draft featured level", String(value));
    return;
  }
  if (command.startsWith("featured track set")) {
    const value = command.split(" ").pop();
    if (!tracks.find((track) => track.id === value)) {
      log("⚠️", "Unknown track", "Pick a valid track id");
      return;
    }
    applyDraftChange("featuredTrackId", value);
    log("✅", "Draft featured track", value);
    return;
  }
  if (command.startsWith("theme global set")) {
    const value = command.split(" ").pop();
    if (!themes.find((theme) => theme.id === value)) {
      log("⚠️", "Unknown theme", "Pick a valid theme id");
      return;
    }
    applyDraftChange("globalThemeId", value);
    log("✅", "Draft global theme", value);
    return;
  }
  if (command === "maintenance on") {
    applyDraftChange("maintenanceMode", true);
    log("✅", "Maintenance", "On (draft)");
    return;
  }
  if (command === "maintenance off") {
    applyDraftChange("maintenanceMode", false);
    log("✅", "Maintenance", "Off (draft)");
    return;
  }
  log("⚠️", "Unknown command", command);
};

// command history for convenience
const commandHistory = [];
let historyIndex = -1;

export const initAdminPanel = () => {
  updateDraftCount();
  dom.adminRun.addEventListener("click", () => handleCommand(dom.adminCommand.value));
  dom.adminCommand.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      handleCommand(dom.adminCommand.value);
      // record history and clear
      if (dom.adminCommand.value.trim()) {
        commandHistory.unshift(dom.adminCommand.value.trim());
        historyIndex = -1;
      }
      dom.adminCommand.value = "";
      event.preventDefault();
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      historyIndex = Math.min(commandHistory.length - 1, (historyIndex === -1 ? 0 : historyIndex + 1));
      dom.adminCommand.value = commandHistory[historyIndex];
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (commandHistory.length === 0) return;
      if (historyIndex <= 0) {
        historyIndex = -1;
        dom.adminCommand.value = "";
        return;
      }
      historyIndex -= 1;
      dom.adminCommand.value = commandHistory[historyIndex];
      return;
    }
  });
  dom.adminClear.addEventListener("click", () => {
    dom.adminLog.innerHTML = "";
  });
  dom.adminUndo.addEventListener("click", () => {
    undoDraft();
    log("✅", "Undo", "Draft change reverted");
  });
  dom.adminPublish.addEventListener("click", publishDraft);

  const lockControls = () => {
    const locked = !state.ui.adminUnlocked;
    dom.adminCommand.disabled = locked;
    dom.adminRun.disabled = locked;
    dom.adminUndo.disabled = locked;
    dom.adminPublish.disabled = locked;
  };

  if (dom.adminUnlockButton) {
    dom.adminUnlockButton.addEventListener("click", () => {
      const code = dom.adminUnlockInput.value.trim();
      if (code === ADMIN_ACCESS_CODE) {
        setState((draft) => {
          draft.ui.adminUnlocked = true;
          draft.auth.role = draft.auth.role === "guest" ? "host" : draft.auth.role;
        });
        lockControls();
        dom.adminGate.classList.add("hidden");
        updateAdminVisibility(true);
        log("✅", "Admin unlocked", "Host access enabled.");
      } else {
        log("❌", "Unlock failed", "Invalid access code.");
      }
    });
  }

  lockControls();

  dom.adminControls.innerHTML = `
    <div class="control-card">
      <h3>Announcement</h3>
      <button class="ghost" data-admin="announce">Set banner</button>
    </div>
    <div class="control-card">
      <h3>Featured Level</h3>
      <button class="ghost" data-admin="featured-level">Set from current</button>
    </div>
    <div class="control-card">
      <h3>Featured Track</h3>
      <button class="ghost" data-admin="featured-track">Set from current</button>
    </div>
    <div class="control-card">
      <h3>Maintenance</h3>
      <button class="ghost" data-admin="maintenance">Toggle</button>
    </div>
  `;

  dom.adminControls.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const action = button.dataset.admin;
    if (action === "announce") {
      const text = prompt("Announcement text?");
      if (text !== null) applyDraftChange("announcementBannerText", text);
    }
    if (action === "featured-level") {
      applyDraftChange("featuredLevelId", state.selection.levelId);
    }
    if (action === "featured-track") {
      applyDraftChange("featuredTrackId", state.selection.trackId);
    }
    if (action === "maintenance") {
      applyDraftChange("maintenanceMode", !state.adminDraft.data.maintenanceMode);
    }
    updateDraftCount();
  });
};

export const revealAdminNav = () => {
  dom.adminNavSection.classList.remove("hidden");
};
