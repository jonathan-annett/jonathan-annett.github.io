(function () {
  if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      "a2cb",
      "function"
    )
  )
    return;

  window.a2cb = a2cb;

  var cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);

  async function a2cb(fn, cb) {
    try {
      cb(undefined, await fn());
    } catch (e) {
      cb(e);
    }
  }

  async function a2cb1(fn, a, cb) {
    try {
      cb(undefined, await fn(a));
    } catch (e) {
      cb(e);
    }
  }

  async function a2cb2(fn, a, b, cb) {
    try {
      cb(undefined, await fn(a, b));
    } catch (e) {
      cb(e);
    }
  }

  async function a2cb3(fn, a, b, c, cb) {
    try {
      cb(undefined, await fn(a, b, c));
    } catch (e) {
      cb(e);
    }
  }

  function a2cb(fn) {
    switch (fn.length) {
      case 0:
        return function (cb) {
          a2cb0(fn, cb);
        };
      case 1:
        return function (a, cb) {
          a2cb1(fn, a, cb);
        };
      case 2:
        return function (a, b, cb) {
          a2cb2(fn, a, b, cb);
        };
      case 3:
        return function (a, b, c, cb) {
          a2cb3(fn, a, b, c, cb);
        };
      case 3:
        return function (a, b, c, d, cb) {
          a2cb4(fn, a, b, c, d, cb);
        };
    }
  }

  function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
      s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      !(e.concat([o]).indexOf(location.hostname) >= 0) &&
      (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
      console.warn(
        "Please download " + s + " and serve it from your own server."
      ),
      !0)
    );
  }
})();

(function () {
  if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      "subtle_hash",
      "object"
    )
  )
    return;

  window.subtle_hash = {
    sha256 : sha256,
    sha1   : sha1
  };

  async function sha256(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
    return hashHex;
  }

  async function sha1(message) {
    const msgUint8 = new TextEncoder().encode(message); // encode as (utf-8) Uint8Array
    const hashBuffer = await crypto.subtle.digest("SHA-1", msgUint8); // hash the message
    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
    const hashHex = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join(""); // convert bytes to hex string
    return hashHex;
  }

  function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
      s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      !(e.concat([o]).indexOf(location.hostname) >= 0) &&
      (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
      console.warn(
        "Please download " + s + " and serve it from your own server."
      ),
      !0)
    );
  }
})();
