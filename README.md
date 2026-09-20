# FocusForge

FocusForge is a free, open-source focus workspace inspired by the product category pioneered by apps like Flocus: a timer, task queue, ambient room, music hub, and focus analytics in one browser app.

It is intentionally **static-first and dependency-light** so you can host it on Netlify for free or run it locally without a backend database.

## What is included

- Fully customizable timer with Pomodoro, 52/17, Deep Work 90/20, Animedoro, Countdown, Stopwatch, and Custom modes.
- Auto-logged completed focus sessions with task association.
- Priority task queue with one-click focus selection.
- Daily / 7-day / 30-day focus metrics, streaks, charts, recent-session history, and JSON export.
- Generated-in-browser soundscapes: Rain, Brown Noise, Café, Fireplace, Ocean, Wind, and White Noise. Layers are adjustable and can play together without downloading copyrighted audio assets.
- Theme system with six visual workspaces plus an optional custom background URL.
- Curated Spotify playlist links.
- Optional Spotify OAuth connection using the browser-safe Authorization Code + PKCE flow. It can load the user's profile, playlists, and current playback metadata without embedding a client secret in the frontend.
- Browser notifications, keyboard shortcuts, PWA manifest, local persistence, and an installable service worker.

## Deploy on Netlify

### Easiest: GitHub

1. Put this folder in a public or private GitHub repo.
2. In Netlify, choose **Add new site → Import an existing project**.
3. Select the repo.
4. Publish directory: `.`
5. Build command: leave blank.
6. Deploy.

`netlify.toml` is included so the publish directory and Netlify Functions directory are already declared.

### Drag and drop

You can also deploy the folder directly in Netlify's manual deploy UI. The static UI will work immediately. Spotify only needs the optional environment variable described below.

## Enable Spotify

Spotify's current browser guidance recommends Authorization Code with PKCE when a client secret cannot be safely stored, including JavaScript applications. See: https://developer.spotify.com/documentation/web-api/concepts/authorization

1. Create a Spotify Developer app and copy its **Client ID**.
2. In Netlify: **Site configuration → Environment variables → Add variable**.
3. Add:

```text
SPOTIFY_CLIENT_ID=your_client_id_here
```

4. In the Spotify app's redirect URI allowlist, add your exact Netlify site URL, e.g.:

```text
https://your-site.netlify.app/
```

The app calls `/.netlify/functions/config`, which returns only the public client ID. No Spotify client secret is required or stored.

The connection requests only playlist/current-playback read scopes. Spotify documents `playlist-read-private` for private playlists and `user-read-currently-playing` / `user-read-playback-state` for playback metadata. See: https://developer.spotify.com/documentation/web-api/concepts/scopes and https://developer.spotify.com/documentation/web-api/reference/get-a-list-of-current-users-playlists

## Local development

Because the app is static, there is no frontend dependency install required.

```bash
python3 -m http.server 8080
```

Then open `http://localhost:8080/`.

The included `package.json` only provides optional convenience scripts; the production site does not need `npm install`.

## Project structure

```text
focusforge/
├── assets/                  # Put optional custom assets here
├── docs/                    # Project notes and extension ideas
├── netlify/
│   └── functions/
│       └── config.mjs       # Public runtime config endpoint
├── public/
│   ├── _redirects           # Netlify SPA fallback
│   ├── favicon.svg
│   ├── manifest.webmanifest
│   └── sw.js
├── src/
│   ├── main.js              # App state, timer, audio, Spotify, views
│   └── styles.css            # UI system + responsive layouts
├── .env.example
├── .gitignore
├── index.html
├── LICENSE
├── netlify.toml
├── package.json
└── README.md
```

## Data and privacy

By default, tasks, settings, and focus history stay in browser `localStorage`. No account is required.

When Spotify is enabled, Spotify authorization tokens are stored in the browser so the app can maintain the connection. The app does not send them to a custom database or analytics service.

Spotify data and playback integrations remain subject to Spotify's developer terms and platform policies. This app is intended as a productivity UI and metadata connector, not a replacement music player. Spotify also states that streaming applications cannot be commercial and that Spotify content must not be synchronized with visual media. See: https://developer.spotify.com/documentation/web-api/reference/get-information-about-the-users-currently-playing-track

## Extending it

The app is deliberately easy to modify:

- Add new timer presets in `MODES` inside `src/main.js`.
- Add themes in `THEMES` and the matching CSS rules in `src/styles.css`.
- Add sound generators in `AudioEngine.add()`.
- Add additional statistics in `statsView()`.
- Replace curated playlist URLs in `CURATED_PLAYLISTS`.
- Add a backend later without changing the core local-first app model.

## License

MIT. See `LICENSE`.
