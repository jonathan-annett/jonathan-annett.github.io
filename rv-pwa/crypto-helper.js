// crypto-helper.js
//
// Encrypt/decrypt JSON payloads with a passphrase. Uses gzip compression
// (via CompressionStream) before encryption to reduce size and hide
// payload structure from byte-count observers.
//
// Output envelope (JSON):
//   { v: 1, salt: <b64>, iv: <b64>, ct: <b64> }
//
// salt = 16 random bytes, regenerated per write
// iv   = 12 random bytes, regenerated per write
// ct   = base64( AES-GCM-256( gzip( JSON.stringify(payload) ) ) )
// key  = PBKDF2-SHA256(passphrase, salt, 250000 iterations, 32 bytes)
//
// Notes:
//   * AES-GCM provides authentication; tampering yields decrypt error.
//   * PBKDF2 iterations make brute-forcing the passphrase slow even with
//     the public ciphertext in hand.
//   * salt + iv vary per write so identical payloads produce different
//     ciphertext (defeats trivial replay/equality observation).

export { encryptPayload, decryptPayload, quickHash };

const PBKDF2_ITERATIONS = 250000;
const SALT_BYTES = 16;
const IV_BYTES = 12;
const ENVELOPE_VERSION = 1;

async function encryptPayload(payload, passphrase) {
    const plaintext = new TextEncoder().encode(JSON.stringify(payload));
    const compressed = await compress(plaintext);

    const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
    const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
    const key = await deriveKey(passphrase, salt);

    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        compressed
    );

    return {
        v: ENVELOPE_VERSION,
        salt: bytesToBase64(salt),
        iv: bytesToBase64(iv),
        ct: bytesToBase64(new Uint8Array(ciphertext)),
    };
}

async function decryptPayload(envelope, passphrase) {
    if (!envelope || typeof envelope !== 'object') {
        throw new Error('crypto: missing envelope');
    }
    if (envelope.v !== ENVELOPE_VERSION) {
        throw new Error(`crypto: unsupported envelope version ${envelope.v}`);
    }
    if (!envelope.salt || !envelope.iv || !envelope.ct) {
        throw new Error('crypto: envelope is missing fields');
    }

    const salt = base64ToBytes(envelope.salt);
    const iv = base64ToBytes(envelope.iv);
    const ct = base64ToBytes(envelope.ct);
    const key = await deriveKey(passphrase, salt);

    let compressed;
    try {
        compressed = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv },
            key,
            ct
        );
    } catch (e) {
        // AES-GCM authentication failure - most likely wrong passphrase,
        // but also catches tampered ciphertext.
        throw new Error('crypto: decryption failed (wrong passphrase or corrupted data)');
    }

    const plaintext = await decompress(new Uint8Array(compressed));
    return JSON.parse(new TextDecoder().decode(plaintext));
}

// Cheap non-cryptographic hash for change detection (so we don't push
// to the bin when nothing changed). Returns a short base64 string.
async function quickHash(obj) {
    const data = new TextEncoder().encode(JSON.stringify(obj));
    const digest = await crypto.subtle.digest('SHA-256', data);
    return bytesToBase64(new Uint8Array(digest)).slice(0, 22);
}

// ---------- internals ----------

async function deriveKey(passphrase, salt) {
    const baseKey = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(passphrase),
        { name: 'PBKDF2' },
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt,
            iterations: PBKDF2_ITERATIONS,
            hash: 'SHA-256',
        },
        baseKey,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function compress(data) {
    const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
}

async function decompress(data) {
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('gzip'));
    const buf = await new Response(stream).arrayBuffer();
    return new Uint8Array(buf);
}

function bytesToBase64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        s += String.fromCharCode(bytes[i]);
    }
    return btoa(s);
}

function base64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) {
        bytes[i] = bin.charCodeAt(i);
    }
    return bytes;
}
