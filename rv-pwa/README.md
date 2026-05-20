# Roster PWA

A read-only mobile viewer for the roster data pushed by the
[roster-view](../roster-view-main) Chrome extension. The extension writes
an encrypted file (`roster.json`) directly into this PWA's GitHub repo
via the GitHub Contents API; the PWA fetches that file from the same
origin it's served from, decrypts it with a locally-stored passphrase,
and renders the upcoming shifts.

## Repo layout

The PWA expects to be served alongside the data file:

```
<repo root>/
    index.html
    app.js
    app.css
    service-worker.js
    crypto-helper.js
    manifest.webmanifest
    icons/...
    roster.json          ← written by the extension, do not edit by hand
```

`roster.json` doesn't need to exist before the first push - the PWA will
show "no roster file yet" and then the extension's first push creates it.

## Deploying to github.io

1. Create a repo (e.g. `my-roster`) and push the contents of this folder
   to its `main` branch.
2. In **Settings → Pages**, select source `main` / `/ (root)` and save.
3. After a minute the PWA will be live at
   `https://<your-username>.github.io/<repo>/`.
4. In the Chrome extension's Options page, point it at this repo so it
   can write `roster.json` (see the extension's own setup notes).

The repo must be public for github.io to serve it on the free tier.
That's fine - the file contents are encrypted; the only thing visible
to anyone fetching the URL is opaque base64 inside an envelope.

## First-run setup on the phone

1. Open the github.io URL in your phone's browser.
2. Enter the **passphrase** that matches the value set in the Chrome
   extension's Options page.
3. Tap **Save & load**. The PWA fetches `roster.json`, tries to decrypt,
   and only saves the passphrase to localStorage if decryption succeeded.

To install as an app:
- **iOS Safari**: Share → Add to Home Screen.
- **Android Chrome**: the install prompt usually appears automatically
  after a successful first load; otherwise menu → Install app.

## What's on the device

In `localStorage`:

- `roster.passphrase` — your passphrase
- `roster.payload` — last decrypted payload, for fast first-paint and
  offline read
- `roster.fetchedAt`, `roster.bytes` — diagnostics shown in Settings

There is no other persistence. Tap **Settings → Forget device** to wipe
all of the above and return to the setup screen.

## What's in roster.json

```json
{ "v": 1, "salt": "...", "iv": "...", "ct": "..." }
```

`ct` is `base64( AES-GCM-256( gzip( JSON.stringify(payload) ) ) )`, with a
fresh random salt and IV on each push. Without the passphrase nothing
useful can be extracted. The plaintext payload itself contains date,
times, role, location, event — no name, no identifier.

## Refresh behaviour

- **On open**: cached payload renders immediately, then a fresh fetch
  happens in the background.
- **Manual**: tap ⟳ in the top bar.
- **Return-to-foreground after 5+ minutes**: automatic refetch.

There is no background polling.

## Caching quirks

GitHub Pages serves through a CDN with ~30-60s edge caching. After the
extension pushes a new `roster.json`, there can be a short window where
the PWA still sees the old file. The app cache-busts with a timestamp
query string (`roster.json?v=...`) and the service worker is configured
to never cache the data file - between those two it usually catches the
new version on the next fetch. If you ever see stuck data, hard-refresh
(or wait a minute and tap ⟳).
