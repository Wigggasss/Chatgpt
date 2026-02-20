# Moonwalk Mania

A browser rhythm game with Fortnite-style UI, global sync, customizable controls, and AcroMusic-powered song playback.

Website: https://wigggasss.github.io/Chatgpt/

## Setup

1. Install dependencies (optional, for Supabase SDK):
   ```bash
   npm install
   ```
2. Serve locally:
   ```bash
   python -m http.server 8000
   ```
3. Open: http://127.0.0.1:8000

## Deploy (GitHub Pages)

1. Commit your changes.
2. Push to the `main` branch.
3. In GitHub, go to **Settings → Pages**.
4. Set **Source** to `Deploy from a branch` and choose `main / root`.
5. Save. The site will publish at the URL above.

## Song Playback (AcroMusic API)

- Track playback uses `https://acromusic.pages.dev` API endpoints.
- Default tracks are presets, and Game Setup also supports **Custom Song** search queries.
- The game attempts multiple AcroMusic audio endpoints for compatibility (`/api/preview`, `/api/play`, `/api/stream`).

## Supabase Auth + Sync

Set these globals in your hosting environment (or inject via a small config script):

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Auth supports email/password and Google OAuth (configure redirect URLs in Supabase).

## Database Schema

### profiles
- `user_id` (pk)
- `display_name`
- `theme_id`
- `layout`
- `note_size`
- `lane_scale`
- `fx`
- `last_level_id`
- `last_track_id`
- `updated_at`

### scores
- `id`
- `user_id`
- `level_id`
- `track_id`
- `score`
- `accuracy`
- `streak_max`
- `created_at`

### global_config
- `id` (single row)
- `version`
- `data` (jsonb)
- `updated_by`
- `updated_at`

### global_config_history
- `version`
- `data` (jsonb)
- `updated_by`
- `updated_at`

## Validation Rules (Leaderboard)

Scores must be submitted through `validate_and_insert_score(payload)` RPC to prevent cheating.
Suggested checks:
- rate limit by user/IP
- max score by time window
- valid level/track ids

## Admin Access

Admin tools are accessible via **Ctrl+Shift+Alt+M** hotkey. The console opens a Minecraft-style terminal where you can execute commands using the `/category subcommand` format.

To unlock admin access:
1. Press **Ctrl+Shift+Alt+M** to open the admin console.
2. Enter the access code `moonwalk`.
3. Use admin commands to manage game state, reset scores, spawn notes, and more.

## Admin Commands

Commands use the format: `/category subcommand [args]`

Examples:
- `/game status` - Show game state
- `/game reset` - Reset current run
- `/score show` - Display leaderboard
- `/level set 3` - Change level
- `/song play` - Play current song
- `/notes spawn 4` - Spawn notes
- `/help` - List all commands

Categories:
- **game**: start, pause, resume, reset, status, speed
- **score**: show, set, add, reset
- **level**: set, list, next, previous
- **song**: set, list, play
- **notes**: spawn, clear, freeze, speed
- **hud**: show, hide, scale, reset
- **debug**: fps, state, log, reset

## Game Controls & Input

- **Arrow Keys** or **WASD** to hit notes
- Input debounce: **15ms** (optimized for single taps in rhythm games)
- **Space** to pause/resume
- **R** to reset run
- **Ctrl+Shift+Alt+M** to open/close admin console
- **Ctrl+Shift+Alt+K** for Konami code (admin unlock, if role allows)

## Game Improvements

### Visual Enhancements
- **Lane Separators**: Visual guides for lane boundaries
- **Randomized Note Spawn**: Notes spawn at random horizontal positions to prevent stacking
- **Improved Note Visibility**: Larger note sizes (40x40 to 64x64 px) for better visibility in fast songs
- **Vertical-Only Layout**: Full-screen vertical game scene for immersive gameplay

### Gameplay Refinements
- **Real-time HUD Updates**: Score, streak, accuracy, and time update instantly during gameplay
- **Proper Reset**: All stats, notes, and UI elements clear correctly on reset
- **Better Hit Detection**: Collision-based hit detection with visual feedback
- **Jump Scare Effect**: Loading animation on game start (optional with FX toggle)


## Sync Behavior

- Clients subscribe to `global_config` changes via Supabase Realtime.
- Updates apply instantly to all players (non-disruptive).
- Maintenance mode blocks starting new runs.

## Troubleshooting

- If auth fails, confirm Supabase URL/key and redirect URLs.
- If leaderboards are empty, confirm RPC and RLS policies.
- If updates do not sync, check Realtime is enabled for `global_config`.
