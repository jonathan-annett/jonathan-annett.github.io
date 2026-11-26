// Pure-function checks run in Node against the page's own code: key finding, harmony, the region finder, word trimming.
// Run: node tests/unit.js
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', '..', 'index.html'), 'utf8');
const script = html.split('<script>')[1].split('</script>')[0];
const pre = script.split('// ---------- page ----------')[0].replace(/function createVoice[\s\S]*?\n}\n\n\/\/ ---------- English/, '// ---------- English');
const M = new Function(pre + ';return {detectKey,harmonise,keyName,noteName,noteMidi,parseScore,scoreToEvents,daisyScore,regionsFrom,fitTimedWords};')();
let fails = 0; const ok = (name, cond, got) => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (cond ? '' : '  got: ' + got)); if (!cond) fails++; };
const ev = M.scoreToEvents(M.parseScore(M.daisyScore()).words);
ok('Daisy Bell is in G major', M.keyName(M.detectKey(ev)) === 'G MAJOR', M.keyName(M.detectKey(ev)));
const G = { tonic: 7, minor: false }, h = (n, st) => M.noteName(M.harmonise(M.noteMidi(n), st, G));
ok('third above G4 in G is B4', h('G4', 2) === 'B4', h('G4', 2));
ok('third above F#4 in G is A4', h('F#4', 2) === 'A4', h('F#4', 2));
ok('fifth below B4 in G is E4', h('B4', -4) === 'E4', h('B4', -4));
const hop = 0.05, mk = (dur, spans) => { const a = new Uint8Array(Math.round(dur / hop)); spans.forEach(([s, e]) => { for (let f = Math.round(s / hop); f < Math.round(e / hop); f++) a[f] = 1; }); return a; };
const show = r => r.map(x => x.start.toFixed(1) + '-' + x.end.toFixed(1)).join(' ');
const r1 = show(M.regionsFrom(mk(60, [[2, 8], [9, 12], [19, 25], [30, 31.2], [36, 36.6], [50, 55]]), hop, 5, 60, 90));
ok('regions split at 5 s gaps', r1 === '1.7-12.3 18.7-25.3 29.7-36.9 49.7-55.3', r1);
const longS = []; for (let t = 1; t < 200; t += 4) longS.push([t, t + 3.5]);
const r2 = M.regionsFrom(mk(210, longS), hop, 5, 210, 90);
ok('long singing split at breaths, none over 90 s', r2.every(x => x.end - x.start <= 90.01) && r2.length === 3, show(r2));
const midi = new Float32Array(300).fill(NaN); for (let f = Math.round(0.37 / 0.02); f < Math.round(2.2 / 0.02); f++) midi[f] = 67;
const fw = M.fitTimedWords([{ text: 'robot', t0: 0, t1: 0.3 }, { text: 'voices', t0: 0.3, t1: 1.9 }], midi, 0.02, 2.2);
ok('a first word placed before the singing moves to it (2.57 s, within a frame)', /^2\.5[6-9] robot/.test(fw), fw.split('\n')[0]);
console.log(fails ? fails + ' FAILED' : 'all passed'); process.exit(fails ? 1 : 0);
