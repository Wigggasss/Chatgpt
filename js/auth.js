import { getSupabaseClient } from "./api.js";
import { state, setState } from "./state.js";
import { dom } from "./dom.js";
import { updateAdminVisibility, updateProfileCard } from "./ui.js";
import { saveProfile } from "./api.js";

export const initAuth = async () => {
  const client = await getSupabaseClient();
  // If supabase isn't configured, support a local fallback auth using localStorage
  if (!client) {
    const localSession = JSON.parse(localStorage.getItem("local-session") || "null");
    setState((draft) => {
      if (localSession) {
        draft.auth.user = localSession;
        draft.auth.status = "authed";
        draft.auth.role = localSession.role || "guest";
        // load profile if present
        const p = JSON.parse(localStorage.getItem(`profile-${localSession.id}`) || "null");
        if (p) {
          draft.profile = { ...draft.profile, ...p };
        }
      } else {
        draft.auth.user = null;
        draft.auth.status = "guest";
        draft.auth.role = "guest";
      }
    });
    updateProfileCard();
    updateAdminVisibility(["admin", "superadmin", "mod", "host"].includes(state.auth.role));
    return;
  }

  const { data } = await client.auth.getSession();
  setState((draft) => {
    draft.auth.user = data.session?.user || null;
    draft.auth.status = draft.auth.user ? "authed" : "guest";
    draft.auth.role =
      data.session?.user?.app_metadata?.role ||
      data.session?.user?.user_metadata?.role ||
      "guest";
  });
  updateProfileCard();
  updateAdminVisibility(["admin", "superadmin", "mod", "host"].includes(state.auth.role));

  client.auth.onAuthStateChange((_event, session) => {
    setState((draft) => {
      draft.auth.user = session?.user || null;
      draft.auth.status = draft.auth.user ? "authed" : "guest";
      draft.auth.role =
        session?.user?.app_metadata?.role ||
        session?.user?.user_metadata?.role ||
        "guest";
    });
    updateProfileCard();
    updateAdminVisibility(["admin", "superadmin", "mod", "host"].includes(state.auth.role));
  });
};

export const bindAuthActions = () => {
  dom.loginButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) {
      // local fallback
      const email = dom.authEmail.value.trim();
      const password = dom.authPassword.value;
      const users = JSON.parse(localStorage.getItem("local-users") || "{}");
      if (users[email] && users[email].password === password) {
        const user = { id: `local-${email}`, email, role: users[email].role || "guest" };
        localStorage.setItem("local-session", JSON.stringify(user));
        setState((draft) => {
          draft.auth.user = user;
          draft.auth.status = "authed";
          draft.auth.role = user.role;
          const p = JSON.parse(localStorage.getItem(`profile-${user.id}`) || "null");
          if (p) draft.profile = { ...draft.profile, ...p };
        });
        updateProfileCard();
        updateAdminVisibility(["admin", "superadmin", "mod", "host"].includes(state.auth.role));
        return;
      }
      alert("Local login failed");
      return;
    }
    await client.auth.signInWithPassword({
      email: dom.authEmail.value,
      password: dom.authPassword.value,
    });
  });

  dom.signupButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) {
      // local signup: store in local-users
      const email = dom.authEmail.value.trim();
      const password = dom.authPassword.value;
      if (!email || !password) {
        alert("Enter email and password");
        return;
      }
      const users = JSON.parse(localStorage.getItem("local-users") || "{}");
      if (users[email]) {
        alert("User already exists");
        return;
      }
      users[email] = { password, role: "host" };
      localStorage.setItem("local-users", JSON.stringify(users));
      const user = { id: `local-${email}`, email, role: "host" };
      localStorage.setItem("local-session", JSON.stringify(user));
      setState((draft) => {
        draft.auth.user = user;
        draft.auth.status = "authed";
        draft.auth.role = "host";
        draft.profile.displayName = email.split("@")[0];
      });
      // save initial profile locally
      await saveProfile({
        displayName: state.profile.displayName,
        themeId: state.selection.themeId,
        layout: state.selection.layout,
        noteSize: state.selection.noteSize,
        laneScale: state.selection.laneScale,
        fx: state.selection.fx,
        lastLevelId: state.selection.levelId,
        lastTrackId: state.selection.trackId,
      });
      updateProfileCard();
      updateAdminVisibility(true);
      return;
    }
    await client.auth.signUp({
      email: dom.authEmail.value,
      password: dom.authPassword.value,
    });
  });

  dom.googleButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) {
      // fallback: prompt for a display name and create a local session
      const name = prompt("Enter display name for local OAuth:") || "Guest";
      const id = `local-oauth-${Date.now()}`;
      const user = { id, email: `${name}@local`, role: "guest" };
      localStorage.setItem("local-session", JSON.stringify(user));
      setState((draft) => {
        draft.auth.user = user;
        draft.auth.status = "authed";
        draft.auth.role = "guest";
        draft.profile.displayName = name;
      });
      updateProfileCard();
      return;
    }
    await client.auth.signInWithOAuth({ provider: "google" });
  });

  dom.logoutButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) {
      localStorage.removeItem("local-session");
      setState((draft) => {
        draft.auth.user = null;
        draft.auth.status = "guest";
        draft.auth.role = "guest";
      });
      updateProfileCard();
      updateAdminVisibility(false);
      return;
    }
    await client.auth.signOut();
  });
};
