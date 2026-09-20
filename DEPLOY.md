# FocusForge — exact GitHub/Netlify update

This version is intentionally static-first. There is no npm build step.

## 1. Replace these files

Replace the files in your GitHub repo with the matching files from this package:

- `index.html`
- `netlify.toml`
- `manifest.webmanifest`
- `favicon.svg`
- `src/main.js`
- `src/styles.css`
- `assets/README.md`
- `assets/audio/rain.wav`
- `assets/audio/brown.wav`
- `assets/audio/cafe.wav`
- `assets/audio/fire.wav`
- `assets/audio/ocean.wav`
- `assets/audio/wind.wav`
- `assets/audio/white.wav`
- `netlify/functions/config.mjs`
- `package.json`

You may leave `docs/`, `LICENSE`, and the old `public/` folder in the repository. The app no longer registers the old service worker, so `public/` is not required for runtime.

For the cleanest repo, delete the old `public/` folder after confirming the new site works.

## 2. Commit and push

Commit all replacements to the `main` branch. Netlify should redeploy automatically.

## 3. Netlify settings

Use:

- Build command: blank
- Publish directory: `.`
- Functions directory: `netlify/functions`

The included `netlify.toml` declares these values.

## 4. Hard-refresh the site

After Netlify finishes deploying, use `Ctrl + Shift + R` in Chrome. Because this version does not register the old service worker, an older app cache should not be able to keep the previous UI alive.

## 5. Spotify (optional)

The Soundroom works without Spotify. To enable Spotify:

1. Create a Spotify Developer app and copy its Client ID.
2. In Netlify, add an environment variable named `SPOTIFY_CLIENT_ID` with that value.
3. In Spotify's redirect URI settings, add the exact site origin with a trailing slash, for example `https://focus-forge-demo.netlify.app/`.
4. Redeploy.

The frontend never receives a Spotify client secret; the Netlify function only exposes the public Client ID.
