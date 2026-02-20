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

## Admin Roles & Workflow

Roles:
- viewer: read-only
- mod: moderation
- admin: config + debug
- superadmin: rollback

Admin draft + publish:
1. Open Admin page with **Ctrl+Shift+Alt+M** (or reveal via Konami if role allows).
2. Enter the admin access code `moonwalk` in the Admin Access gate to unlock tools.
3. Draft changes are local only.
4. Click **Publish** to push global_config updates and broadcast to all clients.

## Sync Behavior

- Clients subscribe to `global_config` changes via Supabase Realtime.
- Updates apply instantly to all players (non-disruptive).
- Maintenance mode blocks starting new runs.

## Troubleshooting

- If auth fails, confirm Supabase URL/key and redirect URLs.
- If leaderboards are empty, confirm RPC and RLS policies.
- If updates do not sync, check Realtime is enabled for `global_config`.
