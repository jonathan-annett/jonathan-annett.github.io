/*global base32*/

async function generateSecret(length = 20) {
    const randomBuffer = new Uint8Array(length);
    crypto.getRandomValues(randomBuffer);
    return base32.encode(randomBuffer).replace(/=/g, '');
}

async function generateHOTP(secret, counter) {
    const decodedSecret = base32.decode.asBytes(secret);
    const buffer = new ArrayBuffer(8);
    const dataView = new DataView(buffer);

    for (let i = 0; i < 8; i++) {
        dataView.setUint8(7 - i, counter & 0xff);
        counter = counter >> 8;
    }

    const keyData = new Uint8Array(decodedSecret);
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const hmacResult = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        buffer
    );

    const hmacArray = new Uint8Array(hmacResult);
    const code = dynamicTruncationFn(hmacArray);

    return code % 10 ** 6;
}

function dynamicTruncationFn(hmacValue) {
    const offset = hmacValue[hmacValue.length - 1] & 0xf;

    return (
        ((hmacValue[offset] & 0x7f) << 24) |
        ((hmacValue[offset + 1] & 0xff) << 16) |
        ((hmacValue[offset + 2] & 0xff) << 8) |
        (hmacValue[offset + 3] & 0xff)
    );
}

async function generateTOTP(secret, window = 0) {
    const counter = Math.floor(Date.now() / 30000);
    return await generateHOTP(secret, counter + window);
}

async function verifyTOTP(token, secret, window = 1) {
  
    if (Math.abs(+window) > 10) {
        console.error('Window size is too large');
        return false;
    }

    for (let errorWindow = -window; errorWindow <= +window; errorWindow++) {
        const totp = await generateTOTP(secret, errorWindow);
        if (token === totp) {
            return true;
        }
    }

    return false;
}

