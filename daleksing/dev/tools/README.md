# Test tools for the sing-along page

The page (`../index.html`) is a single self-contained file with no build step. These tools only test it.

## Setup (macOS or Linux)

```sh
cd daleksing/dev/tools
npm install                         # lamejs, served to the page in place of the CDN copy during tests
pip3 install playwright             # Python Playwright
python3 -m playwright install chromium
node gen_assets.js                  # writes synthetic test audio to assets/ (git-ignored)
```

Set `CHROME=/path/to/chrome` to use a particular browser; otherwise Playwright's Chromium is used.

## Running

```sh
node tests/unit.js                  # pure functions, pass/fail
python3 tests/test_suggest.py       # one browser test
sh tests/run_all.sh                 # everything
```

Each browser test serves the whole repository on 127.0.0.1 and opens `/daleksing/dev/` (one also opens the live `/daleksing/`).
They print what they observed, step by step, and end with `errors [...]` listing page errors, which must be empty.
They are observation scripts, not assertion suites: compare the output with what each step says it expects.
Turning them into asserting tests is on the to-do list in `../HANDOFF.md`.

## What the tests stand in for

- `fake-tf.js` replaces transformers.js (the in-browser Whisper library) in `test_progress.py`: it reports model download progress like the real library and "transcribes" in 2.5 s. Other tests let the real CDN import fail, which the page handles by finding the tune without words.
- `lamejs` from `node_modules` is served in place of the jsDelivr copy for MP3 tests.
- `gen_assets.js` makes the audio: a 4.6 s sung tune over chords, the same as three stems, and a 40 s song with singing at known times.

| Test | Covers |
|---|---|
| unit.js | key finding, harmony, part suggestion regions, first-word placement |
| test_multipart | several parts, singer replacement per part, whole-song and parts-only playback |
| test_scrubber | scrubber, drag-to-seek, marking while paused |
| test_choir_save_download | choir and harmony, part levels, saving and restoring, WAV downloads, deleting |
| test_editor_sound | automatic analysis, word refit, per-part sound, timing editor, phrase moves |
| test_stems_mp3 | stems, exact singer removal, stem levels, MP3 downloads, saving stems |
| test_word_corrections | correcting misheard words keeps the rest of the timing |
| test_listen_length | HEAR as a stop toggle, LISTEN for a selection, syllable length box |
| test_reopen | the last song reopens on refresh |
| test_suggest | suggested parts from a mix and from stems |
| test_dev_live | the dev copy's storage is separate from the live page's |
| test_overview | zoomable overview, dragging suggested part edges |
| test_delete | deleting parts and songs stops playback and resets the page |
| test_progress | progress bars (uses fake-tf.js) |
| test_first_word | where a part's first word lands |
| test_no_page_scroll | playing never scrolls the window |
