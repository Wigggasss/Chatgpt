import { getSupabaseClient, getGlobalConfig } from "./api.js";
import { setState } from "./state.js";
import { themes } from "./config.js";

const channel = new BroadcastChannel("moonwalk-sync");

const applyGlobalTheme = (themeId) => {
  const theme = themes.find((item) => item.id === themeId);
  if (!theme) return;
  Object.entries(theme.vars).forEach(([key, value]) => {
    document.documentElement.style.setProperty(key, value);
  });
};

export const initSync = async () => {
  const client = await getSupabaseClient();
  if (client) {
    client
      .channel("global_config")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "global_config" },
        (payload) => {
          setState((draft) => {
            draft.globalConfig.version = payload.new.version;
            draft.globalConfig.data = payload.new.data;
            draft.ui.announcement = payload.new.data.announcementBannerText || draft.ui.announcement;
            if (payload.new.data.globalThemeId) {
              draft.selection.themeId = payload.new.data.globalThemeId;
            }
          });
          applyGlobalTheme(payload.new.data.globalThemeId);
        }
      )
      .subscribe();

    const config = await getGlobalConfig();
    if (config) {
      setState((draft) => {
        draft.globalConfig.version = config.version;
        draft.globalConfig.data = config.data;
        draft.ui.announcement = config.data.announcementBannerText || draft.ui.announcement;
        if (config.data.globalThemeId) {
          draft.selection.themeId = config.data.globalThemeId;
        }
      });
      applyGlobalTheme(config.data.globalThemeId);
    }
  }

  channel.onmessage = (event) => {
    if (event.data?.type === "global-update") {
      setState((draft) => {
        draft.globalConfig.data = event.data.payload;
        draft.ui.announcement = event.data.payload.announcementBannerText || draft.ui.announcement;
        if (event.data.payload.globalThemeId) {
          draft.selection.themeId = event.data.payload.globalThemeId;
        }
      });
      applyGlobalTheme(event.data.payload.globalThemeId);
    }
  };
};

export const broadcastLocalUpdate = (payload) => {
  channel.postMessage({ type: "global-update", payload });
};

export const setNetworkStatus = (status) => {
  setState((draft) => {
    draft.ui.network = status;
  });
};
