// app.js - main PWA logic
//
// On load: read localStorage config, fetch the bin, decrypt, render.
// Setup flow on first visit. Manual refresh + auto-refresh when page
// returns from background after a few minutes.

import { decryptPayload } from './crypto-helper.js';

const STORAGE = {
    binId: 'roster.binId',
    passphrase: 'roster.passphrase',
    payload: 'roster.payload',         // last decrypted payload (cache)
    fetchedAt: 'roster.fetchedAt',
    bytes: 'roster.bytes',
};

const JSONBIN_BASE = 'https://jsonbin-zeta.vercel.app/api/bins';
const AUTO_REFRESH_THRESHOLD_MS = 5 * 60 * 1000; // re-fetch if last view was >5min ago

const $ = (id) => document.getElementById(id);

let countdownTimerId = null;
let nightModeTimerId = null;
let currentPayload = null;

// ---------- entry point ----------

(async function main() {
    registerServiceWorker();

    const binId = localStorage.getItem(STORAGE.binId);
    const passphrase = localStorage.getItem(STORAGE.passphrase);

    if (!binId || !passphrase) {
        showSetup();
        return;
    }

    // Show cached payload immediately if we have it; then fetch fresh.
    const cached = readCachedPayload();
    if (cached) {
        currentPayload = cached;
        renderPayload(cached);
        showApp();
    } else {
        showApp();
        $('loading').hidden = false;
    }

    refresh().catch(e => showFetchError(e));

    wireEvents();
})();

// ---------- setup flow ----------

function showSetup() {
    $('setup').hidden = false;
    $('app').hidden = true;
    $('setupForm').addEventListener('submit', onSetupSubmit, { once: false });
}

async function onSetupSubmit(ev) {
    ev.preventDefault();
    const binId = $('binIdInput').value.trim();
    const passphrase = $('passphraseInput').value;
    $('setupError').hidden = true;

    if (!binId || !passphrase) return;

    const btn = ev.target.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Testing…';

    try {
        // Validate before saving by trying a full fetch+decrypt round.
        const envelope = await fetchBin(binId);
        const payload = await decryptPayload(envelope, passphrase);

        localStorage.setItem(STORAGE.binId, binId);
        localStorage.setItem(STORAGE.passphrase, passphrase);
        writeCachedPayload(payload, JSON.stringify(envelope).length);

        // Re-bootstrap into the app view.
        currentPayload = payload;
        $('setup').hidden = true;
        $('app').hidden = false;
        renderPayload(payload);
        showApp();
        wireEvents();
    } catch (e) {
        $('setupError').hidden = false;
        $('setupError').textContent = friendlyError(e);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Save & load';
    }
}

// ---------- app view ----------

function showApp() {
    $('setup').hidden = true;
    $('app').hidden = false;
}

function wireEvents() {
    $('refreshBtn').addEventListener('click', () => refresh().catch(showFetchError));
    $('settingsBtn').addEventListener('click', openSettings);
    $('settingsClose').addEventListener('click', () => $('settings').hidden = true);
    $('settingsForget').addEventListener('click', forgetDevice);

    // Re-fetch when returning to the app after being backgrounded for a while.
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState !== 'visible') return;
        const lastFetch = parseInt(localStorage.getItem(STORAGE.fetchedAt) || '0', 10);
        if (Date.now() - lastFetch > AUTO_REFRESH_THRESHOLD_MS) {
            refresh().catch(showFetchError);
        }
    });
}

async function refresh() {
    const binId = localStorage.getItem(STORAGE.binId);
    const passphrase = localStorage.getItem(STORAGE.passphrase);
    if (!binId || !passphrase) return;

    const btn = $('refreshBtn');
    btn.classList.add('spinning');
    $('error').hidden = true;

    try {
        const envelope = await fetchBin(binId);
        const payload = await decryptPayload(envelope, passphrase);
        currentPayload = payload;
        writeCachedPayload(payload, JSON.stringify(envelope).length);
        renderPayload(payload);
        $('loading').hidden = true;
        $('content').hidden = false;
    } finally {
        btn.classList.remove('spinning');
    }
}

function showFetchError(e) {
    console.error(e);
    // If we have cached content, leave it on screen and show a small inline
    // hint; otherwise show a full-screen error.
    if (currentPayload) {
        $('updated').textContent = `couldn't refresh — ${friendlyError(e)}`;
    } else {
        $('loading').hidden = true;
        $('error').hidden = false;
        $('error').textContent = friendlyError(e);
    }
}

// ---------- rendering ----------

function renderPayload(payload) {
    const now = new Date();
    const shifts = (payload.shifts || []).map(s => ({
        ...s,
        start: parseShiftDateTime(s.date, s.startTime),
        end: parseShiftDateTime(s.date, s.endTime, s.startTime),
    })).filter(s => s.end > now); // hide shifts already finished

    shifts.sort((a, b) => a.start - b.start);

    renderCountdown(shifts);
    renderHorizon(shifts);
    renderShiftList(shifts);
    renderUpdated(payload.ts);
    scheduleTickers();
    applyNightMode();
}

function renderCountdown(shifts) {
    const value = $('countdownValue');
    const detail = $('countdownDetail');
    value.classList.remove('green', 'orange', 'yellow', 'red', 'active');

    if (shifts.length === 0) {
        value.textContent = 'none';
        detail.textContent = 'no upcoming shifts';
        return;
    }

    const now = new Date();
    const next = shifts[0];
    const onShiftNow = now >= next.start && now < next.end;

    if (onShiftNow) {
        value.classList.add('active');
        value.textContent = 'on shift';
        const remaining = next.end - now;
        detail.innerHTML = `until ${formatTime12h(next.end)} • ${humanDuration(remaining)} left`;
        return;
    }

    const diff = next.start - now;
    const hrs = diff / 3600000;
    if      (hrs >= 3) value.classList.add('green');
    else if (hrs >= 2) value.classList.add('orange');
    else if (hrs >= 1) value.classList.add('yellow');
    else               value.classList.add('red');

    value.textContent = humanDuration(diff);

    const dateLabel = sameDay(next.start, now) ? 'today'
                    : sameDay(next.start, addDays(now, 1)) ? 'tomorrow'
                    : next.start.toLocaleDateString(undefined, { weekday: 'long' });

    const where = next.location ? ` @ ${next.location}` : '';
    detail.innerHTML = `${dateLabel} • ${formatTime12h(next.start)}–${formatTime12h(next.end)}` +
                       `<br><span class="role">${escapeHtml(next.role || '')}${escapeHtml(where)}</span>`;
}

function renderHorizon(shifts) {
    const el = $('horizon');
    el.innerHTML = '';

    const now = Date.now();
    const horizonStart = now - 1 * 3600000;     // show 1 hour back
    const horizonEnd = now + 47 * 3600000;      // 48 hours forward
    const span = horizonEnd - horizonStart;
    const widthPct = (ms) => (ms / span) * 100;
    const leftPct = (t) => widthPct(t - horizonStart);

    // Hour ticks
    for (let h = 0; h <= 48; h += 6) {
        const tick = document.createElement('div');
        tick.className = 'horizon-tick';
        tick.style.left = `${leftPct(now - 3600000 + h * 3600000)}%`;
        el.appendChild(tick);
    }

    // Each shift gets a colored slot + pre-shift warning bands
    shifts.forEach(s => {
        const startMs = s.start.getTime();
        const endMs = s.end.getTime();
        if (endMs < horizonStart || startMs > horizonEnd) return;

        // 3hr, 2hr, 1hr warning bands (clipped to horizon)
        const bands = [
            { cls: 'horizon-warn3', from: startMs - 3 * 3600000, to: startMs - 2 * 3600000 },
            { cls: 'horizon-warn2', from: startMs - 2 * 3600000, to: startMs - 1 * 3600000 },
            { cls: 'horizon-warn1', from: startMs - 1 * 3600000, to: startMs },
        ];
        bands.forEach(b => {
            const f = Math.max(b.from, horizonStart);
            const t = Math.min(b.to, horizonEnd);
            if (t <= f) return;
            const div = document.createElement('div');
            div.className = b.cls;
            div.style.left = `${leftPct(f)}%`;
            div.style.width = `${widthPct(t - f)}%`;
            el.appendChild(div);
        });

        // The shift block itself
        const block = document.createElement('div');
        block.className = 'horizon-shift';
        if (now >= startMs && now < endMs) block.classList.add('now');
        const f = Math.max(startMs, horizonStart);
        const t = Math.min(endMs, horizonEnd);
        block.style.left = `${leftPct(f)}%`;
        block.style.width = `${widthPct(t - f)}%`;
        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = `${formatTime12h(s.start)} ${s.role || ''}`.trim();
        block.appendChild(label);
        el.appendChild(block);
    });

    // 'Now' indicator line
    const nowLine = document.createElement('div');
    nowLine.className = 'horizon-now';
    nowLine.style.left = `${leftPct(now)}%`;
    el.appendChild(nowLine);
}

function renderShiftList(shifts) {
    const list = $('shiftList');
    list.innerHTML = '';
    if (shifts.length === 0) {
        const li = document.createElement('li');
        li.className = 'shift';
        li.textContent = 'No upcoming shifts.';
        list.appendChild(li);
        return;
    }

    const now = new Date();
    shifts.forEach((s, i) => {
        const li = document.createElement('li');
        li.className = 'shift' + (i === 0 ? ' next' : '');

        const dateLabel = sameDay(s.start, now) ? 'Today'
                        : sameDay(s.start, addDays(now, 1)) ? 'Tomorrow'
                        : s.start.toLocaleDateString(undefined, {
                              weekday: 'long', month: 'short', day: 'numeric',
                          });

        const time = `${formatTime12h(s.start)} – ${formatTime12h(s.end)}`;
        const where = s.location ? `<div class="where">${escapeHtml(s.location)}</div>` : '';
        const event = s.event ? `<div class="where">${escapeHtml(s.event)}</div>` : '';

        li.innerHTML =
            `<div class="when">` +
                `<span class="date">${escapeHtml(dateLabel)}</span>` +
                `<span class="time">${escapeHtml(time)}</span>` +
            `</div>` +
            `<div class="role">${escapeHtml(s.role || '')}</div>` +
            where + event;
        list.appendChild(li);
    });
}

function renderUpdated(ts) {
    const el = $('updated');
    if (!ts) { el.textContent = '—'; return; }
    const updated = new Date(ts);
    const mins = Math.round((Date.now() - updated.getTime()) / 60000);
    let label;
    if (mins < 1)        label = 'updated just now';
    else if (mins < 60)  label = `updated ${mins}m ago`;
    else if (mins < 1440) label = `updated ${Math.floor(mins / 60)}h ago`;
    else                 label = `updated ${updated.toLocaleDateString()}`;
    el.textContent = label;
}

function scheduleTickers() {
    if (countdownTimerId) clearInterval(countdownTimerId);
    countdownTimerId = setInterval(() => {
        if (!currentPayload || document.visibilityState !== 'visible') return;
        renderPayload(currentPayload);
    }, 1000);

    if (!nightModeTimerId) {
        nightModeTimerId = setInterval(applyNightMode, 60 * 1000);
    }
}

function applyNightMode() {
    const h = new Date().getHours();
    document.body.classList.toggle('night', h >= 23 || h < 7);
}

// ---------- settings ----------

function openSettings() {
    $('settings').hidden = false;
    $('settingsBinId').textContent = localStorage.getItem(STORAGE.binId) || '—';
    $('settingsBytes').textContent = localStorage.getItem(STORAGE.bytes) || '—';
    $('settingsShifts').textContent = currentPayload && currentPayload.shifts
        ? String(currentPayload.shifts.length) : '—';
    const fetched = parseInt(localStorage.getItem(STORAGE.fetchedAt) || '0', 10);
    $('settingsLastFetch').textContent = fetched ? new Date(fetched).toLocaleString() : '—';
}

function forgetDevice() {
    if (!confirm('Forget the bin ID and passphrase on this device?')) return;
    Object.values(STORAGE).forEach(k => localStorage.removeItem(k));
    location.reload();
}

// ---------- networking ----------

async function fetchBin(binId) {
    const res = await fetch(`${JSONBIN_BASE}/${encodeURIComponent(binId)}`, {
        method: 'GET',
        cache: 'no-store',
    });
    if (res.status === 404) {
        throw new Error('Bin not found. Check the bin ID.');
    }
    if (!res.ok) {
        throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
    }
    return await res.json();
}

// ---------- storage helpers ----------

function writeCachedPayload(payload, bytes) {
    try {
        localStorage.setItem(STORAGE.payload, JSON.stringify(payload));
        localStorage.setItem(STORAGE.fetchedAt, String(Date.now()));
        localStorage.setItem(STORAGE.bytes, String(bytes || 0));
    } catch (e) {
        console.warn('cache write failed', e);
    }
}

function readCachedPayload() {
    try {
        const raw = localStorage.getItem(STORAGE.payload);
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

// ---------- service worker ----------

function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('service-worker.js').catch(e => {
        console.log('SW registration failed:', e);
    });
}

// ---------- formatting helpers ----------

function parseShiftDateTime(dateStr, timeStr, startStr) {
    // dateStr: 'YYYY-MM-DD', timeStr: 'HH:mm'. If this is an endTime that
    // is earlier than startStr, the shift crosses midnight - add a day.
    const [y, m, d] = dateStr.split('-').map(Number);
    const [hh, mm] = timeStr.split(':').map(Number);
    let date = new Date(y, m - 1, d, hh, mm, 0, 0);
    if (startStr) {
        const [sh, sm] = startStr.split(':').map(Number);
        if (hh < sh || (hh === sh && mm < sm)) {
            date = new Date(date.getTime() + 24 * 3600000);
        }
    }
    return date;
}

function formatTime12h(date) {
    let h = date.getHours();
    const m = date.getMinutes();
    const period = h < 12 ? 'am' : 'pm';
    h = h % 12 || 12;
    return `${h}:${String(m).padStart(2, '0')}${period}`;
}

function humanDuration(ms) {
    if (ms <= 0) return 'now';
    const sec = Math.floor(ms / 1000);
    const days = Math.floor(sec / 86400);
    const hrs = Math.floor((sec % 86400) / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const s = sec % 60;

    if (days >= 2) return `${days} days, ${hrs}h`;
    if (days === 1) return hrs === 0 ? '1 day' : `1 day, ${hrs}h`;
    if (hrs >= 6) return `${hrs}h`;
    if (hrs >= 1) return `${hrs}h ${mins}m`;
    if (mins >= 1) return `${mins}m ${String(s).padStart(2, '0')}s`;
    return `${s}s`;
}

function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear()
        && a.getMonth() === b.getMonth()
        && a.getDate() === b.getDate();
}

function addDays(d, n) {
    const r = new Date(d);
    r.setDate(r.getDate() + n);
    return r;
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function friendlyError(e) {
    const msg = (e && e.message) ? e.message : String(e);
    if (/decryption failed/i.test(msg)) return 'Wrong passphrase, or the bin contains data from a different version.';
    if (/bin not found/i.test(msg))     return 'Bin not found. Check the bin ID.';
    if (/fetch failed|networkerror|failed to fetch/i.test(msg)) return 'Could not reach the bin server.';
    return msg;
}
