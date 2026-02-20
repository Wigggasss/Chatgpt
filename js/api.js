import { state } from "./state.js";

const supabaseUrl = window.SUPABASE_URL || "";
const supabaseKey = window.SUPABASE_ANON_KEY || "";
let supabaseClient = null;

export const getSupabaseClient = async () => {
  if (supabaseClient) return supabaseClient;
  if (!supabaseUrl || !supabaseKey) return null;
  const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm");
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  return supabaseClient;
};

export const fetchLeaderboard = async (levelId = "all") => {
  const client = await getSupabaseClient();
  if (!client) {
    const keys = Object.keys(localStorage).filter((key) => key.startsWith("leaderboard-"));
    let buckets = [];
    if (levelId === "all") {
      buckets = keys.flatMap((key) => JSON.parse(localStorage.getItem(key) || "[]"));
    } else {
      const levelKey = `leaderboard-${levelId}`;
      buckets = JSON.parse(localStorage.getItem(levelKey) || "[]");
    }
    return buckets.sort((a, b) => b.score - a.score).slice(0, 50).map((row) => ({
      playerName: row.playerName || row.player_name || "Unknown",
      score: row.score || 0,
      accuracy: typeof row.accuracy === "number" ? row.accuracy : Math.round((row.accuracy || 1) * 100),
      streakMax: row.streakMax || row.streak_max || 0,
      track: row.track || row.track_id || "-",
      date: row.date || row.created_at || new Date().toISOString(),
    }));
  }
  const query = client
    .from("scores")
    .select("player_name,score,accuracy,streak_max,track_id,created_at")
    .order("score", { ascending: false })
    .limit(50);
  if (levelId !== "all") {
    query.eq("level_id", levelId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data.map((row) => ({
    playerName: row.player_name,
    score: row.score,
    accuracy: row.accuracy,
    streakMax: row.streak_max,
    track: row.track_id,
    date: row.created_at,
  }));
};

export const submitScore = async (payload) => {
  const client = await getSupabaseClient();
  if (!client) {
    const levelKey = `leaderboard-${payload.levelId}`;
    const current = JSON.parse(localStorage.getItem(levelKey) || "[]");
    current.push({
      playerName: payload.playerName,
      score: payload.score,
      accuracy: payload.accuracy,
      streakMax: payload.streakMax,
      track: payload.trackId,
      date: new Date().toISOString(),
    });
    current.sort((a, b) => b.score - a.score);
    localStorage.setItem(levelKey, JSON.stringify(current.slice(0, 50)));
    return { status: "Saved locally" };
  }
  const { error } = await client.rpc("validate_and_insert_score", {
    payload,
  });
  if (error) throw error;
  return { status: "Submitted" };
};

export const getGlobalConfig = async () => {
  const client = await getSupabaseClient();
  if (!client) return null;
  const { data, error } = await client.from("global_config").select("*").single();
  if (error) throw error;
  return data;
};

export const publishGlobalConfig = async (data) => {
  const client = await getSupabaseClient();
  if (!client) return null;
  const nextVersion = typeof data.version === "number" ? data.version + 1 : 1;
  const { data: updated, error } = await client
    .from("global_config")
    .update({ data, version: nextVersion })
    .eq("id", 1)
    .select()
    .single();
  if (error) throw error;
  return updated;
};

export const saveProfile = async (profile) => {
  const client = await getSupabaseClient();
  if (!client) {
    // local fallback: save profile to localStorage keyed by user id if available, otherwise global guest
    const uid = state.auth.user ? state.auth.user.id : "guest";
    const key = `profile-${uid}`;
    const toSave = {
      displayName: profile.displayName,
      themeId: profile.themeId,
      layout: profile.layout,
      noteSize: profile.noteSize,
      laneScale: profile.laneScale,
      fx: profile.fx,
      lastLevelId: profile.lastLevelId,
      lastTrackId: profile.lastTrackId,
    };
    localStorage.setItem(key, JSON.stringify(toSave));
    return { status: "Saved locally" };
  }
  if (!state.auth.user) return;
  await client.from("profiles").upsert({
    user_id: state.auth.user.id,
    display_name: profile.displayName,
    theme_id: profile.themeId,
    layout: profile.layout,
    note_size: profile.noteSize,
    lane_scale: profile.laneScale,
    fx: profile.fx,
    last_level_id: profile.lastLevelId,
    last_track_id: profile.lastTrackId,
  });
};
