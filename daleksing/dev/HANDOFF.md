# Voice Box Sing-Along: handoff

A 1980s-style speech synthesiser that sings along with your music in the browser. You load a song (or its stems), pick the parts a robot should sing, the page finds the tune and the words, and the robot sings them in a formant voice. You can harmonise several robots, fix timing syllable by syllable, and download the result.

This document is for whoever picks the project up next, starting with planning a **unified DAW-style editor** (last section).

- Live page (link has been shared, change with care): `https://jonathan-annett.github.io/daleksing/` from `daleksing/index.html`
- Dev page (all new work goes here first): `https://jonathan-annett.github.io/daleksing/dev/` from `daleksing/dev/index.html`
- Tests and tools: `daleksing/dev/tools/` (see its README)

## Where things stand

- Everything up to pull request #14 is merged. #15 (progress bars) adds to the dev page; this handoff builds on it, so merge #15 first.
- The dev page is ahead of live by: suggested parts, the zoomable overview with draggable part edges, delete fixes, progress bars, and its own storage. Nothing has been promoted to live since #12.
- **Promoting dev to live** is copying `daleksing/dev/index.html` over `daleksing/index.html`. The same file detects where it runs (see Storage), so no edits are needed.

## How work has been done

- One small pull request per change, on a branch named `daleksing-…`, never pushed to `main` directly. The owner reviews and merges.
- New features go to the dev copy only, unless the owner says otherwise.
- The page is **one self-contained HTML file, no build step**. Edit it directly. Libraries load from CDNs at run time (below).
- Look and feel: a ZX81-inspired black slab, a pale "TV screen" status area, Silkscreen for display text and Barlow Semi Condensed for body, red accent `#e5382d`. Status messages are SHORT UPPERCASE SENTENCES via `say()`. Buttons say exactly what they do.
- Every change was tested in headless Chrome before the pull request (tools below). Check with real audio on a real phone when you can; that has rarely been possible here.

## Running and testing

See `tools/README.md`. In short: `npm install`, `pip3 install playwright`, `python3 -m playwright install chromium`, `node gen_assets.js`, then `node tests/unit.js` and `sh tests/run_all.sh`. To try the page by hand, serve the repository root (for example `python3 -m http.server`) and open `/daleksing/dev/`; it needs http(s), not `file://`.

The browser tests are **observation scripts**: they print what they saw at each step and end with `errors [...]` (page errors, must be empty). Read the output against what each step expects. Converting them into asserting tests is worth doing early in the DAW work.

## External dependencies

| What | From | Used for |
|---|---|---|
| Silkscreen, Barlow Semi Condensed | Google Fonts | type |
| transformers.js 3.8.1 | `cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1` (dynamic import) | Whisper speech-to-text in the browser |
| Whisper models `Xenova/whisper-{tiny,base,small}.en`, q8 | Hugging Face, cached by the browser | the words |
| lamejs 1.2.1 | `cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js`, loaded on first MP3 | MP3 encoding |

Everything else is plain Web Audio, Canvas and IndexedDB.

## Map of `index.html` (about 2,800 lines)

Line numbers are approximate. The script is in one `<script>` block, in this order:

| Section | Starts near | What it holds |
|---|---|---|
| style, markup | 10, 127 | screen, transport, mixer, sections 1 MUSIC, 2 WORDS, 3 TIMING, 4 SCORE, 5 DOWNLOAD |
| `IS_DEV`, `APP_ID` | 339 | dev or live, chooses storage names |
| voice engine | 342 | `PH` phoneme table, `createVoice(ctx, dest)` |
| English to sounds | 536 | `DICT`, letter rules, `textToCodes`, `parseCodes` |
| signal processing (`/*DSP*/` to `/*ENDDSP*/`) | 676 | FFT, `splitClip`, `trackPitch`, `notesFromTrack`, word fitting, score parse, `scoreToEvents`, `regionsFrom`, `detectKey`, `harmonise`. No page access, so `tests/unit.js` runs it in Node |
| demo | 1022 | Daisy Bell (1892) score |
| page state, playback | 1042 | `clip`, `ensureAudio`, sounds, `prepare`, `windowFor`, `perform`, `singNow`, `stopAll` |
| sound controls | 1269 | "Sound for" scope, voices list |
| progress | 1311 | `busy()`, `dlBar()`, `partProgress()` |
| loading and analysis | 1339 | `setupClip`, `finishSetup`, stems, `loadFile(s)`, `transcribe`, `analysePart`, `runQueue`, word refit (`realignWords`), `mixBuffer` |
| marking, parts list | 1762 | scrubber, `renderParts`, `addPart`, `suggestParts` |
| song overview | 1779 | `ov` state, `drawWave`, zoom, edge dragging |
| timing editor | 2083 | `ed` state, drawing, hit testing, drag, keys, LISTEN, length box, retype |
| saved songs | 2491 | IndexedDB helpers, `saveWork`, `restoreWork`, `openSaved`, `renderSaved` |
| downloads | 2620 | offline render, limiter, `wavBlob`, `mp3Blob` |
| start-up | end | demo, dev import, reopen the last song |

## Data model

### The song: `clip`
`{ id, name, sr, dur, L, R, origBuf, stems, vocal, from, to, pos, pk, parts, sel, mix, mixKey }`
- `L`, `R`: the full mix as Float32Arrays; `origBuf` the playable AudioBuffer. With stems, `L`/`R` are the channels of `origBuf`.
- `stems`: `[{ name, buf, role: 'vocal'|'music', lvl }]` or null. `vocal`: all vocal stems summed to mono, or null.
- `from`/`to`: the manual marker. `pos`: the cursor. `pk`: waveform peaks (256-sample blocks).
- `mix`/`mixKey`: cached song with the singer removed from parts set to REPLACES SINGER.
- `id`: `name|size|lastModified` for a file, `stems|…` for a stem set.

### A part (a stretch the robot sings)
`{ from, to, remove, done, held, failed, stereo, centre, midi, hopSec, notes, text, words, level, sound }`
- `held`: a suggestion not yet analysed. `done`: analysed. `remove`: replace the original singer here.
- `centre`: the singer's audio for this part (split from the mix, or the vocal stem slice). `midi`/`hopSec`: pitch track (fractional MIDI per frame, NaN when unvoiced). `notes`: detected notes `{ start, midi, dur }` in song time.
- `level`: robot volume 0–150. `sound`: its own sound, or null for the default.
- Transient: `_prog`, `_stage`, `_est` (progress), `_vb` (playable vocal buffer), `_pk` (editor peaks).

### The score (the source of truth for what is sung)
Plain text, one word per line, song time in seconds:
```
2.57 robot G4:0.25 G4:0.25
3.07 voices E4:0.51 A3:0.51@3.62
```
`START WORD NOTE:LENGTH …`; one note per syllable; extra notes on a line are slurred on the last syllable; `@START` gives a syllable its own start. A word belongs to the part whose `[from, to)` contains its start. The timing editor, the words box and analysis all read and write these lines (`partLines`, `setScoreRange`, `edWrite`).

### Sounds
`{ voices: [{ iv, lvl }], ring, octave, key, hold }`. `iv` is a scale-step interval (2 = third, 4 = fifth, 7 = octave, negative below), applied in the detected or chosen key by `harmonise`. `baseSound` is the default; a part's `sound` overrides it.

### From score to sound
`prepare()` turns the score into per-syllable events (`scoreToEvents`), tags each with its part, level and sound, and caps long notes. `perform()` gives voice slot *i* the *i*-th voice of each syllable's sound, so one set of robot voices covers parts with different sounds; ring modulation, pan and level switch per syllable. `singNow(opts)` plays a window (`windowFor`) with the music (`mixBuffer`, or the part's own voice for editor listening).

### The voice engine
`createVoice(ctx, dest)` builds a formant synthesiser: sawtooth (voicing) and noise (hiss) through three band-pass formant filters, a fricative filter, a compressor, then trim, volume, per-part level, ring modulator and pan. `speak(codes)` talks; `sing(events)` stretches each syllable's vowel to its note, keeping consonants short. Phonemes are a 43-entry table (`PH`) of formant targets.

### Analysis
- `splitClip`: STFT; keeps what is identical in both channels (the centre, usually the lead vocal) and builds a pitch-salience table. `energyOnly` mode for whole songs.
- `trackPitch`: Viterbi path through the salience table (quarter-semitone grid, MIDI 40–84).
- `transcribe`: Whisper with word timestamps, falling back to phrase timestamps, then none.
- `fitTimedWords`: places words on the pitch track; moves words the model put before the singing to where the voice starts; snaps to note onsets.
- `realignWords`: when lyrics are corrected, keeps unchanged words' timing (longest common subsequence) and retimes only the changed stretches.
- `suggestParts`: finds singing (vocal stem loudness, or voiced centre energy) and makes held parts split at gaps (`regionsFrom`).

## Storage

IndexedDB database `APP_ID` (`daleksing` live, `daleksing-dev` dev), version 1, stores with out-of-line keys:
- `meta[id]`: `{ id, name, dur, parts, savedAt }` for the list
- `audio[id]`: the original file as an ArrayBuffer, or `{ stems: [{ name, data }] }`
- `work[id]`: parts (without audio), score, words, marker, cursor, selection, settings, stem roles and levels
- `vocals[id#from-to]`: a part's split-off singer (Float32Array)

localStorage: `APP_ID + '-last-song'`, `-model`, `-gap`, and `daleksing-dev-imported`. On its first visit the dev copy copies the live songs in, reading only, after checking with `indexedDB.databases()` that the live database exists (opening a missing one would create an empty v1 database and break the live page).

**Schema changes**: bump the version and migrate in `onupgradeneeded`, and remember live and dev share the origin.

## Known limitations and loose ends

- Real songs: tune tracking on busy mixes, and Whisper on singing, are rough; stems help a lot. Centred lead instruments can be taken for singing.
- The WORDS progress is an estimate (the library reports nothing while transcribing).
- Pinch and touch drags have not been tried on a real phone. Safari on iPhone can clear site data after weeks unused.
- The test scripts observe rather than assert.
- English only; the pronunciation rules are crude and a dictionary of about 200 words patches the worst. Stress and prosody are not modelled.
- Licensing: lyrics and melodies (scores) are the songwriter's, however they are encoded. Keep scores on the user's device; do not build a public score library without legal advice.

## Ideas discussed, not built

- **Sing-along by listening**: Shazam-style fingerprints (spectrogram peak pairs hashed as `(f1, f2, Δt)`) of the user's saved songs, matched from the microphone to find the song and the position, then the robots join in. Feasible on device; needs latency calibration.
- **Whisper as a judge** to tune the synthesiser's parameters for intelligibility (a closed loop on WebGPU).
- **Robot Talkie**: a separate walkie-talkie project (Cloudflare Worker and Durable Object relay, phoneme messages). It was delivered as a zip in the chat, not in this repository.

## Next: a unified DAW-style editor

**The owner's brief**: a new editor that works on the entire song like a DAW, unified in one place. Keep the existing editors while it is prototyped; the new editor then becomes the way forward.

### What exists that it can build on
- One time base for everything: song seconds. Parts, score lines, notes and the cursor all use it.
- Two canvas views already share ideas: the song overview (`ov`: zoom, scroll, regions, edge drags) and the part timing editor (`ed`: waveform, pitch line, syllable blocks, joined-syllable dragging, selection, undo). The DAW editor is roughly the two merged and widened to the whole song.
- Playback can already start anywhere, play a window, mute the robot, and swap the music for a part's isolated voice.
- Offline rendering already reproduces playback exactly, so anything the editor plays can be exported.

### A starting shape to discuss
- **Tracks (lanes)**, top to bottom, sharing one zoomable, scrollable timeline and playhead:
  - music: the mix, or one lane per stem, with mute, solo and level
  - the singer's voice (vocal stem or split centre), for alignment
  - parts: regions with edges, the part's sound and level, singer replacement
  - words and syllables: the score as blocks on a piano-roll, with the pitch track behind them
  - optionally one lane per robot voice slot, showing harmonies
- **Transport**: play, stop, loop a selection, cursor, follow playhead; keyboard shortcuts.
- **Selection across lanes**: a time range, regions, words or syllables; move, nudge, stretch, transpose; one undo history for the whole song.
- **Inspector**: properties of the selection (part sound, levels, a syllable's length and note, word text).
- Analysis and suggestions run from inside it (select a range, find the tune and words).

### Engineering notes
- 2,800 lines in one file is near the limit for comfortable editing. Before the DAW work, consider splitting into modules served as separate files (still no build, ES modules), keeping a single-file export if wanted. Live and dev would then each need their own copies.
- A shared timeline component (time-to-pixel, zoom, scroll, pinch, wheel) would replace the duplicated logic in `ov` and `ed`.
- Rendering: canvas with layered drawing per lane; only redraw what changed during playback.
- Model: keep the score text as the saved format, but edit through an in-memory model (words, syllables, notes with absolute times) like `ed.words`, writing back to text, as `edWrite` does.
- Prototype it behind a mode switch on the dev page; existing sections stay until it replaces them.

### Questions for the owner before building
1. Desktop first, or must it work on a phone from the start?
2. Should stems remain separate lanes you can edit (move, cut, fade), or only mute, solo and level?
3. Is the robot's performance edited as syllables only, or also as continuous pitch and volume curves (automation)?
4. Should it support more than one robot "performer" with different words (call and response), or harmonies only?
5. Split the file into modules now, or keep one file for the prototype?
6. What should be the first milestone: view-only timeline of the whole song with playback, or editing one lane end to end?
