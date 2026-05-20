# Roster PWA

A read-only mobile viewer for the roster data pushed by the
[roster-view](../roster-view-main) Chrome extension. Fetches an encrypted
payload from a public JSONBin, decrypts it with a passphrase stored only
in the device's localStorage, and renders the upcoming shifts.

## Deploying to github.io

1. Create a repo (e.g. `my-roster`) and push the contents of this folder
   to its `main` branch (the folder root is the site root).
2. In **Settings → Pages**, select source `main` / `/ (root)` and save.
3. After a minute the PWA will be live at
   `https://<your-username>.github.io/<repo>/`.

Service workers and the WebCrypto APIs only work over HTTPS or localhost,
which github.io covers.

## First-run setup

On your phone:

1. Open the github.io URL in your phone's browser.
2. Enter the **Bin ID** and **Passphrase** that match the values you set in
   the Chrome extension's Options page.
3. Tap **Save & load**. The PWA will fetch the bin, try to decrypt with
   the passphrase, and only save the values to localStorage if both
   succeed.

To install as an app: use your browser's "Add to home screen" option.
On iOS this needs Safari. On Android, Chrome's install prompt should
appear automatically after a successful first load.

## What's on the device

Stored only in `localStorage`:

- `roster.binId`, `roster.passphrase` — your config
- `roster.payload` — the last decrypted payload, for fast first-paint and
  offline read
- `roster.fetchedAt`, `roster.bytes` — diagnostics shown in Settings

There is no other persistence. Tap **Settings → Forget device** to wipe
all of the above and return to the setup screen.

## What's in the bin

The bin contents are an opaque envelope:

```json
{ "v": 1, "salt": "...", "iv": "...", "ct": "..." }
```

`ct` is `base64( AES-GCM-256( gzip( JSON.stringify(payload) ) ) )`, with a
fresh random salt and IV on each push. Without the passphrase nothing
useful can be extracted. The decrypted payload itself contains date,
times, role, location, event — no name, no identifier.

## Refresh behaviour

- On open: cached payload is shown immediately, then a fresh fetch
  happens in the background.
- On manual refresh: tap the ⟳ in the top bar.
- On return-to-foreground after >5 minutes: a fresh fetch is triggered
  automatically.

There is no background polling — the PWA only fetches when you're
looking at it.
