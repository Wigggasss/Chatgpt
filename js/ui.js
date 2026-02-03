import { levels, tracks, themes } from "./config.js";
import { state, setState } from "./state.js";
import { dom } from "./dom.js";

export const setActivePage = (page) => {
  setState((draft) => {
    draft.ui.activePage = page;
  });
  dom.pages.forEach((section) => {
    section.classList.toggle("active", section.dataset.page === page);
  });
  dom.navItems.forEach((button) => {
    button.classList.toggle("active", button.dataset.page === page);
  });
};

export const renderThemeOptions = () => {
  dom.themeSelect.innerHTML = "";
  themes.forEach((theme) => {
    const option = document.createElement("option");
    option.value = theme.id;
    option.textContent = theme.name;
    dom.themeSelect.appendChild(option);
  });
};

export const applyTheme = (themeId) => {
  const theme = themes.find((item) => item.id === themeId) || themes[0];
  Object.entries(theme.vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

export const renderLevels = () => {
  dom.levelsPanel.innerHTML = "";
  levels.forEach((level) => {
    const card = document.createElement("div");
    card.className = "select-card";
    card.innerHTML = `
      <div>
        <h3>${level.name}</h3>
        <p class="hint">${level.timeSec}s · ${level.density.toFixed(2)}x density</p>
      </div>
      <button class="ghost" data-level="${level.id}">Select</button>
    `;
    dom.levelsPanel.appendChild(card);
  });
};

export const renderTracks = () => {
  dom.tracksPanel.innerHTML = "";
  tracks.forEach((track) => {
    const card = document.createElement("div");
    card.className = "select-card";
    card.innerHTML = `
      <div>
        <h3>${track.name}</h3>
        <p class="hint">${track.bpm} BPM · Official preview</p>
      </div>
      <button class="ghost" data-track="${track.id}">Select</button>
    `;
    dom.tracksPanel.appendChild(card);
  });
};

export const renderLeaderboardLevels = () => {
  dom.leaderboardLevelSelect.innerHTML = "";
  levels.forEach((level) => {
    const option = document.createElement("option");
    option.value = level.id;
    option.textContent = level.name;
    dom.leaderboardLevelSelect.appendChild(option);
  });
};

export const renderLeaderboard = (entries) => {
  dom.leaderboardPanel.innerHTML = "";
  if (!entries.length) {
    dom.leaderboardPanel.innerHTML = "<p class=\"hint\">No scores yet.</p>";
    return;
  }
  const table = document.createElement("table");
  table.className = "leaderboard-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th>#</th>
        <th>Player</th>
        <th>Score</th>
        <th>Acc</th>
        <th>Streak</th>
        <th>Track</th>
        <th>Date</th>
      </tr>
    </thead>
  `;
  const body = document.createElement("tbody");
  entries.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${index + 1}</td>
      <td>${entry.playerName}</td>
      <td>${entry.score}</td>
      <td>${entry.accuracy}%</td>
      <td>${entry.streakMax}</td>
      <td>${entry.track}</td>
      <td>${new Date(entry.date).toLocaleDateString()}</td>
    `;
    body.appendChild(row);
  });
  table.appendChild(body);
  dom.leaderboardPanel.appendChild(table);
};

export const updateHUD = () => {
  dom.score.textContent = state.run.score;
  dom.streak.textContent = state.run.streak;
  dom.multiplier.textContent = `${state.run.avgMultiplier.toFixed(1)}x`;
  dom.accuracy.textContent = `${state.run.accuracy}%`;
  dom.time.textContent = Math.max(0, Math.ceil(state.run.timeLeft));
  dom.hudTrack.textContent = getTrack().name;
  dom.levelLabel.textContent = getLevel().name;
  dom.currentLevelLabel.textContent = getLevel().name;
  dom.currentTrackLabel.textContent = getTrack().name;
  dom.layoutIndicator.textContent = state.selection.layout === "vertical" ? "Vertical" : "Horizontal";
  dom.fxIndicator.textContent = state.selection.fx;
};

export const updateStatus = () => {
  dom.runStatus.textContent = state.ui.status;
  dom.syncIndicator.textContent = state.ui.network;
  dom.announcementBanner.textContent = state.ui.announcement;
};

export const updateProfileCard = () => {
  dom.profileName.textContent = state.profile.displayName || "Guest Dancer";
  dom.profileStatus.textContent = state.auth.user ? "Signed in" : "Not signed in";
  dom.profileAvatar.textContent = (state.profile.displayName || "MJ").slice(0, 2).toUpperCase();
};

export const updateSettingsForm = () => {
  dom.themeSelect.value = state.selection.themeId;
  dom.layoutSelect.value = state.selection.layout;
  dom.noteSizeSelect.value = state.selection.noteSize;
  dom.laneScaleInput.value = state.selection.laneScale;
  dom.fxSelect.value = state.selection.fx;
  dom.dancerSelect.value = state.selection.dancer;
};

export const renderTrackEmbed = (autoplay = false) => {
  const track = getTrack();
  const autoplayParam = autoplay ? "?autoplay=1" : "";
  dom.trackEmbed.innerHTML = `
    <iframe
      src="${track.embedUrl}${autoplayParam}"
      title="${track.name}"
      frameborder="0"
      allow="autoplay; encrypted-media"
      allowfullscreen
    ></iframe>
  `;
};

export const updateSummary = (submitStatus, isPersonalBest = false) => {
  dom.summaryScore.textContent = state.run.score;
  dom.summaryAccuracy.textContent = `${state.run.accuracy}%`;
  dom.summaryMaxStreak.textContent = state.run.maxStreak;
  dom.summaryAvgMultiplier.textContent = `${state.run.avgMultiplier.toFixed(1)}x`;
  dom.summaryNotes.textContent = `${state.run.totalHit}/${state.run.totalNotes}`;
  dom.summaryPerfect.textContent = state.run.perfectCount;
  dom.summaryGood.textContent = state.run.goodCount;
  dom.summaryOkay.textContent = state.run.okayCount;
  dom.summaryMiss.textContent = state.run.missCount;
  dom.summaryBreakdown.textContent = `${state.run.scoreByGrade.perfect}/${state.run.scoreByGrade.good}/${state.run.scoreByGrade.okay}`;
  dom.summaryLevel.textContent = getLevel().name;
  dom.summaryTrack.textContent = getTrack().name;
  dom.summaryTime.textContent = `${getLevel().timeSec - Math.max(0, Math.ceil(state.run.timeLeft))}s`;
  dom.summaryPersonalBest.textContent = isPersonalBest ? "New Personal Best!" : "—";
  dom.summarySubmit.textContent = submitStatus;
};

export const openSummary = () => {
  dom.summaryModal.classList.remove("hidden");
};

export const closeSummary = () => {
  dom.summaryModal.classList.add("hidden");
};

export const getLevel = () => levels.find((item) => item.id === state.selection.levelId) || levels[0];
export const getTrack = () => tracks.find((item) => item.id === state.selection.trackId) || tracks[0];
