"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate,
  deactivate: () => deactivate
});
module.exports = __toCommonJS(extension_exports);

// src/provider.ts
var vscode = __toESM(require("vscode"));

// node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  // determined by compression function
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), efl = b2(d, b + 30), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl;
  var _a2 = z64hs(d, es, efl, z, b4(d, b + 20), b4(d, b + 24), b4(d, b + 42)), sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + efl + b2(d, b + 32), off];
};
var z64hs = function(d, b, l, z, sc, su, off) {
  var nsc = sc == 4294967295, nsu = su == 4294967295, noff = off == 4294967295, e = b + l;
  var nf = nsc + nsu + noff;
  if (z && nf) {
    for (; b + 4 < e; b += 4 + b2(d, b + 2)) {
      if (b2(d, b) == 1) {
        return [
          nsc ? b8(d, b + 4 + 8 * nsu) : sc,
          nsu ? b8(d, b + 4) : su,
          noff ? b8(d, b + 4 + 8 * (nsu + nsc)) : off,
          1
        ];
      }
    }
    if (z < 2)
      err(13);
  }
  return [sc, su, off, 0];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = b4(data, e - 20) == 117853008;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// src/pptx.ts
var UNKNOWN = "unknown";
async function parsePptx(bytes, info) {
  const sha256 = await sha256Hex(bytes);
  let entries = {};
  let parseError;
  try {
    entries = unzipSync(bytes);
  } catch (err2) {
    parseError = `Could not unzip file: ${err2 instanceof Error ? err2.message : String(err2)}`;
  }
  const contentTypes = readText(entries["[Content_Types].xml"]);
  const core = readText(entries["docProps/core.xml"]);
  const presentation = readText(entries["ppt/presentation.xml"]);
  const slideNames = Object.keys(entries).filter((name) => /^ppt\/slides\/slide\d+\.xml$/.test(name)).sort(naturalSort);
  let hiddenSlideCount = 0;
  for (const name of slideNames) {
    if (isHiddenSlide(entries[name])) hiddenSlideCount++;
  }
  const author = extractElementText(core, "dc:creator") ?? UNKNOWN;
  const lastModifiedBy = extractElementText(core, "cp:lastModifiedBy") ?? UNKNOWN;
  const embeddedMedia = parseEmbeddedMedia(contentTypes);
  const linkedMediaFound = anyLinkedMedia(entries);
  const showType = parseShowType(presentation);
  const mediaControlsOn = parseShowMediaControls(presentation);
  return {
    fileName: info.fileName,
    size: info.size,
    sizeHuman: humanSize(info.size),
    mtime: info.mtime,
    mtimeHuman: formatTime(info.mtime),
    sha256,
    slideCount: slideNames.length,
    hiddenSlideCount,
    author,
    lastModifiedBy,
    embeddedMedia,
    flags: {
      linkedMedia: linkedMediaFound ? { ok: false, label: "Linked media", detail: "External video/audio/media relationship present on at least one slide" } : { ok: true, label: "Linked media", detail: "No external media relationships found" },
      showType: showType === "kiosk" ? { ok: false, label: "Show type", detail: "Kiosk mode (<p:kiosk/>) is set" } : showType === "browse" ? { ok: false, label: "Show type", detail: "Window/browse mode (<p:browse/>) is set" } : { ok: true, label: "Show type", detail: "Presenter mode (default)" },
      showMediaControls: mediaControlsOn ? { ok: false, label: "Show media controls", detail: "showMediaControls is enabled on <p:showPr>" } : { ok: true, label: "Show media controls", detail: "showMediaControls is absent or disabled" }
    },
    parseError
  };
}
function readText(bytes) {
  if (!bytes) return "";
  try {
    return strFromU8(bytes);
  } catch {
    return "";
  }
}
async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function humanSize(n) {
  if (n < 1024) return `${n} B`;
  const units = ["KB", "MB", "GB", "TB"];
  let value = n / 1024;
  let i = 0;
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024;
    i++;
  }
  return `${value.toFixed(value < 10 ? 2 : 1)} ${units[i]}`;
}
function formatTime(ms) {
  if (!ms) return UNKNOWN;
  try {
    return new Date(ms).toISOString();
  } catch {
    return UNKNOWN;
  }
}
function naturalSort(a, b) {
  const na = parseInt(a.match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
  const nb = parseInt(b.match(/(\d+)\.xml$/)?.[1] ?? "0", 10);
  return na - nb;
}
function extractElementText(xml, tag) {
  if (!xml) return void 0;
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`<${escaped}\\b[^>]*>([\\s\\S]*?)</${escaped}>`);
  const m = xml.match(re);
  if (!m) return void 0;
  const inner = decodeXmlEntities(m[1]).trim();
  return inner.length > 0 ? inner : void 0;
}
function decodeXmlEntities(s) {
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#(\d+);/g, (_, d) => String.fromCharCode(parseInt(d, 10))).replace(/&#x([0-9a-fA-F]+);/g, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
function parseEmbeddedMedia(contentTypesXml) {
  if (!contentTypesXml) return [];
  const counts = /* @__PURE__ */ new Map();
  const re = /ContentType="((?:audio|video)\/[^"]+)"/g;
  let m;
  while (m = re.exec(contentTypesXml)) {
    counts.set(m[1], (counts.get(m[1]) ?? 0) + 1);
  }
  return Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([mime, count]) => ({ mime, count }));
}
function anyLinkedMedia(entries) {
  for (const name of Object.keys(entries)) {
    if (!/^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/.test(name)) continue;
    const xml = readText(entries[name]);
    if (!xml) continue;
    if (relsHasExternalMedia(xml)) return true;
  }
  return false;
}
function relsHasExternalMedia(relsXml) {
  const re = /<Relationship\b([^>]*)\/?>/g;
  let m;
  while (m = re.exec(relsXml)) {
    const attrs = m[1];
    const typeMatch = /\bType="[^"]*\/(video|audio|media)"/.test(attrs);
    const external = /\bTargetMode="External"/.test(attrs);
    if (typeMatch && external) return true;
  }
  return false;
}
function getShowPrBlock(presXml) {
  if (!presXml) return null;
  const selfClose = presXml.match(/<p:showPr\b[^>]*\/>/);
  if (selfClose) return selfClose[0];
  const full = presXml.match(/<p:showPr\b[^>]*>[\s\S]*?<\/p:showPr>/);
  return full ? full[0] : null;
}
function parseShowType(presXml) {
  const block = getShowPrBlock(presXml);
  if (!block) return "presenter";
  if (/<p:kiosk\b/.test(block)) return "kiosk";
  if (/<p:browse\b/.test(block)) return "browse";
  return "presenter";
}
function parseShowMediaControls(presXml) {
  const block = getShowPrBlock(presXml);
  if (!block) return false;
  return /\bshowMediaControls="(1|true)"/i.test(block);
}
function isHiddenSlide(bytes) {
  if (!bytes) return false;
  const head = strFromU8(bytes.subarray(0, Math.min(bytes.length, 500)));
  return /<p:sld\b[^>]*\bshow="0"/.test(head);
}

// src/webview.ts
function renderHtml(r) {
  const metadataRows = [
    ["File name", r.fileName],
    ["Size", `${r.sizeHuman} (${r.size.toLocaleString()} bytes)`],
    ["Modified", r.mtimeHuman],
    ["SHA-256", r.sha256],
    ["Slides", String(r.slideCount)],
    ["Hidden slides", String(r.hiddenSlideCount)],
    ["Author", r.author],
    ["Last modified by", r.lastModifiedBy],
    ["Embedded media", formatMedia(r.embeddedMedia)]
  ];
  const errorBanner = r.parseError ? `<div class="banner warn">${escapeHtml(r.parseError)}</div>` : "";
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<title>${escapeHtml(r.fileName)}</title>
<style>${css()}</style>
</head>
<body>
  <main>
    <h1>${escapeHtml(r.fileName)}</h1>
    ${errorBanner}

    <section>
      <h2>Metadata</h2>
      <dl class="meta">
        ${metadataRows.map(([k, v]) => row(k, v)).join("\n")}
      </dl>
    </section>

    <section>
      <h2>Validation</h2>
      <ul class="flags">
        ${flagLi(r.flags.linkedMedia)}
        ${flagLi(r.flags.showType)}
        ${flagLi(r.flags.showMediaControls)}
      </ul>
    </section>
  </main>
</body>
</html>`;
}
function renderError(path, message) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';">
<title>Pptx error</title>
<style>${css()}</style>
</head>
<body>
  <main>
    <h1>Could not open file</h1>
    <p class="path">${escapeHtml(path)}</p>
    <div class="banner warn">${escapeHtml(message)}</div>
  </main>
</body>
</html>`;
}
function row(key, value) {
  return `<div class="row">
    <dt>${escapeHtml(key)}</dt>
    <dd>${escapeHtml(value)}</dd>
  </div>`;
}
function flagLi(f) {
  const cls = f.ok ? "pass" : "warn";
  const tag = f.ok ? "OK" : "WARN";
  return `<li class="flag ${cls}">
    <span class="pill">${tag}</span>
    <span class="label">${escapeHtml(f.label)}</span>
    <span class="detail">${escapeHtml(f.detail)}</span>
  </li>`;
}
function formatMedia(media) {
  if (media.length === 0) return "none";
  return media.map((m) => `${m.mime} \xD7 ${m.count}`).join(", ");
}
function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
function css() {
  return `
    :root { color-scheme: light dark; }
    body {
      margin: 0;
      font-family: var(--vscode-font-family, system-ui);
      font-size: var(--vscode-font-size, 13px);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      line-height: 1.5;
    }
    main { max-width: 900px; margin: 0 auto; padding: 24px; }
    h1 {
      font-size: 1.4em;
      margin: 0 0 16px;
      word-break: break-all;
    }
    h2 {
      font-size: 1.05em;
      margin: 24px 0 8px;
      color: var(--vscode-descriptionForeground);
      font-weight: 600;
    }
    .path {
      color: var(--vscode-descriptionForeground);
      font-family: var(--vscode-editor-font-family, monospace);
      word-break: break-all;
      margin-top: -8px;
    }
    .banner {
      padding: 8px 12px;
      border-radius: 4px;
      margin: 12px 0;
    }
    .banner.warn {
      background: color-mix(in srgb, var(--vscode-errorForeground) 12%, transparent);
      border-left: 3px solid var(--vscode-errorForeground);
      color: var(--vscode-foreground);
    }

    /* Metadata: 2-col grid (label | value). 'auto 1fr' = label hugs content, value fills. */
    dl.meta {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 4px 16px;
      margin: 0;
    }
    dl.meta .row {
      display: contents; /* lets <dt>/<dd> participate directly in the grid */
    }
    dl.meta dt {
      color: var(--vscode-descriptionForeground);
      white-space: nowrap;
    }
    dl.meta dd {
      margin: 0;
      font-family: var(--vscode-editor-font-family, monospace);
      word-break: break-all;
    }

    /* Validation flags. Each row is a flexbox with a status pill + label + detail. */
    ul.flags {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .flag {
      display: grid;
      grid-template-columns: max-content max-content 1fr;
      gap: 12px;
      align-items: baseline;
      padding: 8px 12px;
      border-radius: 4px;
      border-left: 3px solid transparent;
    }
    .flag.pass {
      background: color-mix(in srgb, var(--vscode-foreground) 4%, transparent);
      border-left-color: var(--vscode-charts-green, #4caf50);
    }
    .flag.warn {
      background: color-mix(in srgb, var(--vscode-errorForeground) 10%, transparent);
      border-left-color: var(--vscode-errorForeground);
    }
    .pill {
      font-size: 0.75em;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      border-radius: 3px;
      font-family: var(--vscode-editor-font-family, monospace);
    }
    .flag.pass .pill {
      background: var(--vscode-charts-green, #4caf50);
      color: var(--vscode-editor-background);
    }
    .flag.warn .pill {
      background: var(--vscode-errorForeground);
      color: var(--vscode-editor-background);
    }
    .label { font-weight: 600; }
    .detail { color: var(--vscode-descriptionForeground); }
  `;
}

// src/provider.ts
var PptxDocument = class {
  constructor(uri) {
    this.uri = uri;
  }
  dispose() {
  }
};
var PptxEditorProvider = class _PptxEditorProvider {
  static viewType = "pptxViewer.viewer";
  static register() {
    return vscode.window.registerCustomEditorProvider(
      _PptxEditorProvider.viewType,
      new _PptxEditorProvider(),
      {
        webviewOptions: { retainContextWhenHidden: false },
        supportsMultipleEditorsPerDocument: false
      }
    );
  }
  async openCustomDocument(uri) {
    return new PptxDocument(uri);
  }
  async resolveCustomEditor(document, webviewPanel, _token) {
    webviewPanel.webview.options = { enableScripts: false };
    try {
      const [bytes, stat] = await Promise.all([
        vscode.workspace.fs.readFile(document.uri),
        vscode.workspace.fs.stat(document.uri)
      ]);
      const fileName = document.uri.path.split("/").pop() ?? "unknown.pptx";
      const result = await parsePptx(bytes, {
        fileName,
        size: stat.size,
        mtime: stat.mtime
      });
      webviewPanel.webview.html = renderHtml(result);
    } catch (err2) {
      const message = err2 instanceof Error ? err2.message : String(err2);
      webviewPanel.webview.html = renderError(document.uri.path, message);
    }
  }
};

// src/extension.ts
function activate(context) {
  context.subscriptions.push(PptxEditorProvider.register());
}
function deactivate() {
}
//# sourceMappingURL=extension.js.map
