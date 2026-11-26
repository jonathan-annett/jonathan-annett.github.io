// Writes the synthetic test audio the browser tests use into tools/assets/ (not committed):
//   test-clip.wav              4.6 s stereo: a sung tune in the centre, different chords left and right
//   stems/Robot Test (*).wav   the same idea as three time-aligned stems: Vocals, Instrumental, Drums
//   long/Long Song*.wav        40 s with singing at 2-8, 9-12, 19-25 and 31-34 s, as a mix and as two stems
// Run: node gen_assets.js
const fs = require('fs'), path = require('path');
const OUT = path.join(__dirname, 'assets'), sr = 44100;
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function wav(file, L, R) {
  const n = L.length, pcm = new Int16Array(n * 2);
  for (let i = 0; i < n; i++) { pcm[2 * i] = Math.max(-1, Math.min(1, L[i])) * 32767; pcm[2 * i + 1] = Math.max(-1, Math.min(1, R[i])) * 32767; }
  const h = Buffer.alloc(44); h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.byteLength, 4); h.write('WAVEfmt ', 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(2, 22);
  h.writeUInt32LE(sr, 24); h.writeUInt32LE(sr * 4, 28); h.writeUInt16LE(4, 32); h.writeUInt16LE(16, 34); h.write('data', 36); h.writeUInt32LE(pcm.byteLength, 40);
  fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, Buffer.concat([h, Buffer.from(pcm.buffer)]));
}
// a voice-like tone with vibrato and strong 3rd/4th harmonics
function sing(buf, t, d, f, amp) {
  for (let i = Math.floor(t * sr); i < (t + d) * sr && i < buf.length; i++) {
    const x = i / sr, ph = 2 * Math.PI * f * x + (f * 0.012 / 5.5) * Math.sin(2 * Math.PI * 5.5 * x); let s = 0;
    for (let h = 1; h <= 10; h++) s += Math.sin(h * ph) / h * (h === 3 || h === 4 ? 1.6 : 1);
    buf[i] += amp * s * Math.min(1, (x - t) / .03, (t + d - x) / .03);
  }
}
function bed(n) {   // chords hard left and right, bass in the centre
  const L = new Float32Array(n), R = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = i / sr; let l = 0, r = 0;
    for (const f of [196, 246.9, 293.7]) for (let h = 1; h <= 5; h++) l += Math.sin(2 * Math.PI * f * h * x) / h;
    for (const f of [130.8, 164.8, 220, 329.6]) for (let h = 1; h <= 5; h++) r += Math.sin(2 * Math.PI * f * h * x + 1) / h;
    const bass = 0.3 * Math.sin(2 * Math.PI * 65.4 * x); L[i] = 0.07 * l + bass; R[i] = 0.07 * r + bass;
  }
  return [L, R];
}
const NOTE = { A3: 57, C4: 60, D4: 62, E4: 64, G4: 67 };
// test clip and its stems: A3 C4 E4 D4, rest, G4 E4 A3 from 0.2 s
{
  const n = Math.floor(sr * 4.6), voc = new Float32Array(n), tune = [['A3', .5], ['C4', .5], ['E4', .4], ['D4', .6], [null, .4], ['G4', .5], ['E4', .5], ['A3', .8]];
  let t = 0.2; for (const [k, d] of tune) { if (k) sing(voc, t, d, midiHz(NOTE[k]), 0.25); t += d; }
  const [iL, iR] = bed(n);
  wav(path.join(OUT, 'test-clip.wav'), voc.map((v, i) => v + iL[i] + 0.01 * (Math.random() - .5)), voc.map((v, i) => v + iR[i] + 0.01 * (Math.random() - .5)));
  const dr = new Float32Array(n);
  for (let b = 0; b < 9; b++) { const s0 = Math.floor((0.25 + b * 0.5) * sr); for (let i = 0; i < 0.08 * sr; i++) dr[s0 + i] += (Math.random() * 2 - 1) * 0.4 * Math.exp(-i / (0.015 * sr)); }
  wav(path.join(OUT, 'stems/Robot Test (Vocals).wav'), voc, voc.map(v => v * 0.8));
  wav(path.join(OUT, 'stems/Robot Test (Instrumental).wav'), iL, iR);
  wav(path.join(OUT, 'stems/Robot Test (Drums).wav'), dr, dr);
}
// long song
{
  const n = sr * 40, voc = new Float32Array(n);
  for (const [a, b, notes] of [[2, 8, [57, 60, 64, 62]], [9, 12, [67, 64]], [19, 25, [60, 62, 64, 65]], [31, 34, [69, 67, 64]]]) {
    const d = (b - a) / notes.length; notes.forEach((m, k) => sing(voc, a + k * d, d, midiHz(m), 0.22));
  }
  const [iL, iR] = bed(n);
  for (let i = 0; i < n; i++) { iL[i] += 0.01 * (Math.random() - .5); iR[i] += 0.01 * (Math.random() - .5); }
  wav(path.join(OUT, 'long/Long Song.wav'), voc.map((v, i) => v + iL[i]), voc.map((v, i) => v * 0.9 + iR[i]));
  wav(path.join(OUT, 'long/Long Song (Vocals).wav'), voc, voc.map(v => v * 0.9));
  wav(path.join(OUT, 'long/Long Song (Instrumental).wav'), iL, iR);
}
console.log('test audio written to', OUT);
