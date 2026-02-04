import { getSupabaseClient } from "./api.js";
import { state, setState } from "./state.js";
import { dom } from "./dom.js";
import { updateAdminVisibility, updateProfileCard } from "./ui.js";

export const initAuth = async () => {
  const client = await getSupabaseClient();
  if (!client) return;
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
    if (!client) return;
    await client.auth.signInWithPassword({
      email: dom.authEmail.value,
      password: dom.authPassword.value,
    });
  });

  dom.signupButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) return;
    await client.auth.signUp({
      email: dom.authEmail.value,
      password: dom.authPassword.value,
    });
  });

  dom.googleButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) return;
    await client.auth.signInWithOAuth({ provider: "google" });
  });

  dom.logoutButton.addEventListener("click", async () => {
    const client = await getSupabaseClient();
    if (!client) return;
    await client.auth.signOut();
  });
};
