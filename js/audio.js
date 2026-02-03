import { dom } from "./dom.js";
import { state } from "./state.js";
import { renderTrackEmbed } from "./ui.js";

export const updateAudioEmbed = () => {
  const autoplay = !state.selection.muted && state.selection.autoplay;
  renderTrackEmbed(autoplay);
};

export const bindAudioControls = () => {
  dom.muteToggle.addEventListener("change", () => {
    state.selection.muted = dom.muteToggle.checked;
    updateAudioEmbed();
  });
  dom.autoplayToggle.addEventListener("change", () => {
    state.selection.autoplay = dom.autoplayToggle.checked;
    updateAudioEmbed();
  });
};
