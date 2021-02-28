(function(functionName) {
    /*
  MIT License
Copyright (c) 2021 Jonathan Annett
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  
@license*/

    if (
    scriptCheck(
    ["cdpn.io", "codepen.io"],
        "jonathan-annett.github.io",
    functionName,
        "function")) return;

    function scriptCheck(e, o, t, n) {
        /* jshint ignore:start*/
        if ("object" != typeof window || t && typeof window[t] === n) return !1;
        var r = document.getElementsByTagName("script"),
            s = r[r.length - 1].src;
        
        return !!s.startsWith("https://" + o + "/") && (!(e.concat([o]).indexOf(location.hostname) >= 0) && (console.error("PLEASE DON'T LINK TO THIS FILE FROM " + o), console.warn("Please download " + s + " and serve it from your own server."), !0))
        /* jshint ignore:end*/
        
    } 
    
    //inject a2cb
    (function (functionName) {
      if (
        scriptCheck(
          ["cdpn.io", "codepen.io"],
          "jonathan-annett.github.io",
          functionName,
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
    
     
    })("a2cb");
    
    //inject subtle_hash
    (function (functionName) {
      if (
        scriptCheck(
          ["cdpn.io", "codepen.io"],
          "jonathan-annett.github.io",
          functionName,
          "object"
        )
      )
        return;
    
      window.subtle_hash = {
        sha256 : sha256,
        sha1   : sha1,
        cb: {
              sha256 : window.a2cb(sha256), 
              sha1   : window.a2cb(sha1),
        }
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
    
    })("subtle_hash");
    
    //inject current-device
    /*based on https://github.com/matthewhudson/current-device/blob/master/src/index.js*/
    (function(exports,module){'use strict';
    
    exports.__esModule = true;
    
    delete window.device;
    
    var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };
    
    // Save the previous value of the device variable.
    var previousDevice = window.device;
    
    var device = {};
    
    var changeOrientationList = [];
    
    // Add device as a global object.
    window.device = device;
    
    // The <html> element.
    var documentElement = window.document.documentElement;
    
    // The client user agent string.
    // Lowercase, so we can use the more efficient indexOf(), instead of Regex
    var userAgent = window.navigator.userAgent.toLowerCase();
    
    // Detectable television devices.
    var television = ['googletv', 'viera', 'smarttv', 'internet.tv', 'netcast', 'nettv', 'appletv', 'boxee', 'kylo', 'roku', 'dlnadoc', 'pov_tv', 'hbbtv', 'ce-html'];
    
    // Main functions
    // --------------
    
    device.macos = function () {
      return find('mac');
    };
    
    device.ios = function () {
      return device.iphone() || device.ipod() || device.ipad();
    };
    
    device.iphone = function () {
      return !device.windows() && find('iphone');
    };
    
    device.ipod = function () {
      return find('ipod');
    };
    
    device.ipad = function () {
      var iPadOS13Up = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
      return find('ipad') || iPadOS13Up;
    };
    
    device.android = function () {
      return !device.windows() && find('android');
    };
    
    device.androidPhone = function () {
      return device.android() && find('mobile');
    };
    
    device.androidTablet = function () {
      return device.android() && !find('mobile');
    };
    
    device.blackberry = function () {
      return find('blackberry') || find('bb10') || find('rim');
    };
    
    device.blackberryPhone = function () {
      return device.blackberry() && !find('tablet');
    };
    
    device.blackberryTablet = function () {
      return device.blackberry() && find('tablet');
    };
    
    device.windows = function () {
      return find('windows');
    };
    
    device.windowsPhone = function () {
      return device.windows() && find('phone');
    };
    
    device.windowsTablet = function () {
      return device.windows() && find('touch') && !device.windowsPhone();
    };
    
    device.fxos = function () {
      return (find('(mobile') || find('(tablet')) && find(' rv:');
    };
    
    device.fxosPhone = function () {
      return device.fxos() && find('mobile');
    };
    
    device.fxosTablet = function () {
      return device.fxos() && find('tablet');
    };
    
    device.meego = function () {
      return find('meego');
    };
    
    device.cordova = function () {
      return window.cordova && location.protocol === 'file:';
    };
    
    device.nodeWebkit = function () {
      return _typeof(window.process) === 'object';
    };
    
    device.mobile = function () {
      return device.androidPhone() || device.iphone() || device.ipod() || device.windowsPhone() || device.blackberryPhone() || device.fxosPhone() || device.meego();
    };
    
    device.tablet = function () {
      return device.ipad() || device.androidTablet() || device.blackberryTablet() || device.windowsTablet() || device.fxosTablet();
    };
    
    device.desktop = function () {
      return !device.tablet() && !device.mobile();
    };
    
    device.television = function () {
      var i = 0;
      while (i < television.length) {
        if (find(television[i])) {
          return true;
        }
        i++;
      }
      return false;
    };
    
    device.framed = function () {
      /*
      https://developer.mozilla.org/en-US/docs/Web/API/Window/parent
      
        The Window.parent property is a reference to the parent of the current window or subframe.
      
      If a window does not have a parent, its parent property is a reference to itself.
      
      When a window is loaded in an <iframe>, <object>, or <frame>, its parent is the window with the element embedding the window.
        */
         try {
           // strictly speaking do not need to wrap this as we aren't digging into any parent properties
           // but if we were, a cross-origin error may occur.
           return window.parent!==window;
         } catch (e) {
            return true;
         }
    };
    
    device.portrait = function () {
      if (screen.orientation && Object.prototype.hasOwnProperty.call(window, 'onorientationchange')) {
        return includes(screen.orientation.type, 'portrait');
      }
      if (device.ios() && Object.prototype.hasOwnProperty.call(window, 'orientation')) {
        return Math.abs(window.orientation) !== 90;
      }
      return window.innerHeight / window.innerWidth > 1;
    };
    
    device.landscape = function () {
      if (screen.orientation && Object.prototype.hasOwnProperty.call(window, 'onorientationchange')) {
        return includes(screen.orientation.type, 'landscape');
      }
      if (device.ios() && Object.prototype.hasOwnProperty.call(window, 'orientation')) {
        return Math.abs(window.orientation) === 90;
      }
      return window.innerHeight / window.innerWidth < 1;
    };
    
    // Public Utility Functions
    // ------------------------
    
    // Run device.js in noConflict mode,
    // returning the device variable to its previous owner.
    device.noConflict = function () {
      window.device = previousDevice;
      return this;
    };
    
    // Private Utility Functions
    // -------------------------
    
    // Check if element exists
    function includes(haystack, needle) {
      return haystack.indexOf(needle) !== -1;
    }
    
    // Simple UA string search
    function find(needle) {
      return includes(userAgent, needle);
    }
    
    // Check if documentElement already has a given class.
    function hasClass(className) {
      return documentElement.className.match(new RegExp(className, 'i'));
    }
    
    // Add one or more CSS classes to the <html> element.
    function addClass(className) {
      var currentClassNames = null;
      if (!hasClass(className)) {
        currentClassNames = documentElement.className.replace(/^\s+|\s+$/g, '');
        documentElement.className = currentClassNames + ' ' + className;
      }
    }
    
    // Remove single CSS class from the <html> element.
    function removeClass(className) {
      if (hasClass(className)) {
        documentElement.className = documentElement.className.replace(' ' + className, '');
      }
    }
    
    // HTML Element Handling
    // ---------------------
    
    // Insert the appropriate CSS class based on the _user_agent.
    function setClasses (device) {
        
        'ios ipad iphone ipod mobile table desktop macos desktop '+
        'windows television cordova framed android '+
        'blackberry fxos meego node-webkit'.split(' ').forEach(
            function(x){ 
                removeClass(x);
            });
        
        if (device.ios()) {
          if (device.ipad()) {
            addClass('ios ipad tablet');
          } else if (device.iphone()) {
            addClass('ios iphone mobile');
          } else if (device.ipod()) {
            addClass('ios ipod mobile');
          }
        } else if (device.macos()) {
          addClass('macos desktop');
        } else if (device.android()) {
          if (device.androidTablet()) {
            addClass('android tablet');
          } else {
            addClass('android mobile');
          }
        } else if (device.blackberry()) {
          if (device.blackberryTablet()) {
            addClass('blackberry tablet');
          } else {
            addClass('blackberry mobile');
          }
        } else if (device.windows()) {
          if (device.windowsTablet()) {
            addClass('windows tablet');
          } else if (device.windowsPhone()) {
            addClass('windows mobile');
          } else {
            addClass('windows desktop');
          }
        } else if (device.fxos()) {
          if (device.fxosTablet()) {
            addClass('fxos tablet');
          } else {
            addClass('fxos mobile');
          }
        } else if (device.meego()) {
          addClass('meego mobile');
        } else if (device.nodeWebkit()) {
          addClass('node-webkit');
        } else if (device.television()) {
          addClass('television');
        } else if (device.desktop()) {
          addClass('desktop');
        }
        
        if (device.cordova()) {
          addClass('cordova');
        }
        
        if ( device.framed () ) {
          addClass("framed");
        }
    
    
    }
    // Orientation Handling
    // --------------------
    setClasses (device);
    
    // Handle device orientation changes.
    function handleOrientation() {
      if (device.landscape()) {
        removeClass('portrait');
        addClass('landscape');
        walkOnChangeOrientationList('landscape');
      } else {
        removeClass('landscape');
        addClass('portrait');
        walkOnChangeOrientationList('portrait');
      }
      setOrientationCache();
    }
    
    function walkOnChangeOrientationList(newOrientation) {
      for (var index in changeOrientationList) {
        changeOrientationList[index](newOrientation);
      }
    }
    
    device.onChangeOrientation = function (cb) {
      if (typeof cb == 'function') {
        changeOrientationList.push(cb);
      }
    };
    
    // Detect whether device supports orientationchange event,
    // otherwise fall back to the resize event.
    var orientationEvent = 'resize';
    if (Object.prototype.hasOwnProperty.call(window, 'onorientationchange')) {
      orientationEvent = 'orientationchange';
    }
    
    // Listen for changes in orientation.
    if (window.addEventListener) {
      window.addEventListener(orientationEvent, handleOrientation, false);
    } else if (window.attachEvent) {
      window.attachEvent(orientationEvent, handleOrientation);
    } else {
      window[orientationEvent] = handleOrientation;
    }
    
    handleOrientation();
    
    // Public functions to get the current value of type, os, or orientation
    // ---------------------------------------------------------------------
    
    function findMatch(arr) {
      for (var i = 0; i < arr.length; i++) {
        if (device[arr[i]]()) {
          return arr[i];
        }
      }
      return 'unknown';
    }
    
    device.type = findMatch(['mobile', 'tablet', 'desktop']);
    device.os = findMatch(['ios', 'iphone', 'ipad', 'ipod', 'android', 'blackberry', 'macos', 'windows', 'fxos', 'meego', 'television']);
    
    function setOrientationCache() {
      device.orientation = findMatch(['portrait', 'landscape']);
    }
    
    setOrientationCache();
     
    
    device.cancelFakeItMode = function() {
        
    };
      
    device.fakeItMode = function(modes) {
      
      var realDevice =  device.noConflict();
    
      device = {
          
          fakeItMode : function() {
              Object.keys(realDevice).forEach(function(key) {
                 if (key==='fakeItMode') return;
                 if (key==='cancelFakeItMode') return;
                  
                 var x = realDevice[key];
                 if (typeof x === 'function') {
                     device[key]=function() {
                         if (typeof modes[key]==='undefined') {
                             return x();
                         }
                         return modes[key];
                     }
                 }
              });
              
              setClasses (device);
              
          },
          cancelFakeItMode : function() {
              device = realDevice;
          }
      };
      
      device.fakeItMode(modes);
      
    };
    
    exports.default = device;
    module.exports = exports['default'];})({},{exports:{}})
    
    //inject Lz-String

 /*
 
 Copyright (c) 2013 Pieroxy <pieroxy@pieroxy.net>
 This work is free. You can redistribute it and/or modify it
 under the terms of the WTFPL, Version 2
 For more information see LICENSE.txt or http://www.wtfpl.net/
 For more information, the home page:
 http://pieroxy.net/blog/pages/lz-string/testing.html
 LZ-based compression algorithm, version 1.4.4
 
 
 MIT License
 
 Copyright (c) 2013 pieroxy
 
 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:
 
 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.
 
 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 
 @license*/
 
 // private property
 var f = String.fromCharCode;
 var keyStrBase64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
 var keyStrUriSafe = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$";
 var baseReverseDic = {};
 
 function getBaseValue(alphabet, character) {
   if (!baseReverseDic[alphabet]) {
     baseReverseDic[alphabet] = {};
     for (var i=0 ; i<alphabet.length ; i++) {
       baseReverseDic[alphabet][alphabet.charAt(i)] = i;
     }
   }
   return baseReverseDic[alphabet][character];
 }

 
 window.LZString = window.LZString || {
   compressToBase64 : function (input) {
     if (input === null) return "";
     var res = LZString._compress(input, 6, function(a){return keyStrBase64.charAt(a);});
     switch (res.length % 4) { // To produce valid Base64
     default: // When could this happen ?
     case 0 : return res;
     case 1 : return res+"===";
     case 2 : return res+"==";
     case 3 : return res+"=";
     }
   },
 
   decompressFromBase64 : function (input) {
     if (input === null) return "";
     if (input === "") return null;
     return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrBase64, input.charAt(index)); });
   },
 
   compressToUTF16 : function (input) {
     if (input === null) return "";
     return LZString._compress(input, 15, function(a){return f(a+32);}) + " ";
   },
 
   decompressFromUTF16: function (compressed) {
     if (compressed === null) return "";
     if (compressed === "") return null;
     return LZString._decompress(compressed.length, 16384, function(index) { return compressed.charCodeAt(index) - 32; });
   },
 
   //compress into uint8array (UCS-2 big endian format)
   compressToUint8Array: function (uncompressed) {
     var compressed = LZString.compress(uncompressed);
     var buf=new Uint8Array(compressed.length*2); // 2 bytes per character
 
     for (var i=0, TotalLen=compressed.length; i<TotalLen; i++) {
       var current_value = compressed.charCodeAt(i);
       buf[i*2] = current_value >>> 8;
       buf[i*2+1] = current_value % 256;
     }
     return buf;
   },
 
   //decompress from uint8array (UCS-2 big endian format)
   decompressFromUint8Array:function (compressed) {
     if (compressed===null || compressed===undefined){
         return LZString.decompress(compressed);
     } else {
         var buf=new Array(compressed.length/2); // 2 bytes per character
         for (var i=0, TotalLen=buf.length; i<TotalLen; i++) {
           buf[i]=compressed[i*2]*256+compressed[i*2+1];
         }
 
         var result = [];
         buf.forEach(function (c) {
           result.push(f(c));
         });
         return LZString.decompress(result.join(''));
 
     }
 
   },
 
 
   //compress into a string that is already URI encoded
   compressToEncodedURIComponent: function (input) {
     if (input === null) return "";
     return LZString._compress(input, 6, function(a){return keyStrUriSafe.charAt(a);});
   },
 
   //decompress from an output of compressToEncodedURIComponent
   decompressFromEncodedURIComponent:function (input) {
     if (input === null) return "";
     if (input === "") return null;
     input = input.replace(/ /g, "+");
     return LZString._decompress(input.length, 32, function(index) { return getBaseValue(keyStrUriSafe, input.charAt(index)); });
   },
 
   compress: function (uncompressed) {
     return LZString._compress(uncompressed, 16, function(a){return f(a);});
   },
   _compress: function (uncompressed, bitsPerChar, getCharFromInt) {
     if (uncompressed === null) return "";
     var i, value,
         context_dictionary= {},
         context_dictionaryToCreate= {},
         context_c="",
         context_wc="",
         context_w="",
         context_enlargeIn= 2, // Compensate for the first entry which should not count
         context_dictSize= 3,
         context_numBits= 2,
         context_data=[],
         context_data_val=0,
         context_data_position=0,
         ii;
 
     for (ii = 0; ii < uncompressed.length; ii += 1) {
       context_c = uncompressed.charAt(ii);
       if (!Object.prototype.hasOwnProperty.call(context_dictionary,context_c)) {
         context_dictionary[context_c] = context_dictSize++;
         context_dictionaryToCreate[context_c] = true;
       }
 
       context_wc = context_w + context_c;
       if (Object.prototype.hasOwnProperty.call(context_dictionary,context_wc)) {
         context_w = context_wc;
       } else {
         if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
           if (context_w.charCodeAt(0)<256) {
             for (i=0 ; i<context_numBits ; i++) {
               context_data_val = (context_data_val << 1);
               if (context_data_position == bitsPerChar-1) {
                 context_data_position = 0;
                 context_data.push(getCharFromInt(context_data_val));
                 context_data_val = 0;
               } else {
                 context_data_position++;
               }
             }
             value = context_w.charCodeAt(0);
             for (i=0 ; i<8 ; i++) {
               context_data_val = (context_data_val << 1) | (value&1);
               if (context_data_position == bitsPerChar-1) {
                 context_data_position = 0;
                 context_data.push(getCharFromInt(context_data_val));
                 context_data_val = 0;
               } else {
                 context_data_position++;
               }
               value = value >> 1;
             }
           } else {
             value = 1;
             for (i=0 ; i<context_numBits ; i++) {
               context_data_val = (context_data_val << 1) | value;
               if (context_data_position ==bitsPerChar-1) {
                 context_data_position = 0;
                 context_data.push(getCharFromInt(context_data_val));
                 context_data_val = 0;
               } else {
                 context_data_position++;
               }
               value = 0;
             }
             value = context_w.charCodeAt(0);
             for (i=0 ; i<16 ; i++) {
               context_data_val = (context_data_val << 1) | (value&1);
               if (context_data_position == bitsPerChar-1) {
                 context_data_position = 0;
                 context_data.push(getCharFromInt(context_data_val));
                 context_data_val = 0;
               } else {
                 context_data_position++;
               }
               value = value >> 1;
             }
           }
           context_enlargeIn--;
           if (context_enlargeIn === 0) {
             context_enlargeIn = Math.pow(2, context_numBits);
             context_numBits++;
           }
           delete context_dictionaryToCreate[context_w];
         } else {
           value = context_dictionary[context_w];
           for (i=0 ; i<context_numBits ; i++) {
             context_data_val = (context_data_val << 1) | (value&1);
             if (context_data_position == bitsPerChar-1) {
               context_data_position = 0;
               context_data.push(getCharFromInt(context_data_val));
               context_data_val = 0;
             } else {
               context_data_position++;
             }
             value = value >> 1;
           }
 
 
         }
         context_enlargeIn--;
         if (context_enlargeIn === 0) {
           context_enlargeIn = Math.pow(2, context_numBits);
           context_numBits++;
         }
         // Add wc to the dictionary.
         context_dictionary[context_wc] = context_dictSize++;
         context_w = String(context_c);
       }
     }
 
     // Output the code for w.
     if (context_w !== "") {
       if (Object.prototype.hasOwnProperty.call(context_dictionaryToCreate,context_w)) {
         if (context_w.charCodeAt(0)<256) {
           for (i=0 ; i<context_numBits ; i++) {
             context_data_val = (context_data_val << 1);
             if (context_data_position == bitsPerChar-1) {
               context_data_position = 0;
               context_data.push(getCharFromInt(context_data_val));
               context_data_val = 0;
             } else {
               context_data_position++;
             }
           }
           value = context_w.charCodeAt(0);
           for (i=0 ; i<8 ; i++) {
             context_data_val = (context_data_val << 1) | (value&1);
             if (context_data_position == bitsPerChar-1) {
               context_data_position = 0;
               context_data.push(getCharFromInt(context_data_val));
               context_data_val = 0;
             } else {
               context_data_position++;
             }
             value = value >> 1;
           }
         } else {
           value = 1;
           for (i=0 ; i<context_numBits ; i++) {
             context_data_val = (context_data_val << 1) | value;
             if (context_data_position == bitsPerChar-1) {
               context_data_position = 0;
               context_data.push(getCharFromInt(context_data_val));
               context_data_val = 0;
             } else {
               context_data_position++;
             }
             value = 0;
           }
           value = context_w.charCodeAt(0);
           for (i=0 ; i<16 ; i++) {
             context_data_val = (context_data_val << 1) | (value&1);
             if (context_data_position == bitsPerChar-1) {
               context_data_position = 0;
               context_data.push(getCharFromInt(context_data_val));
               context_data_val = 0;
             } else {
               context_data_position++;
             }
             value = value >> 1;
           }
         }
         context_enlargeIn--;
         if (context_enlargeIn === 0) {
           context_enlargeIn = Math.pow(2, context_numBits);
           context_numBits++;
         }
         delete context_dictionaryToCreate[context_w];
       } else {
         value = context_dictionary[context_w];
         for (i=0 ; i<context_numBits ; i++) {
           context_data_val = (context_data_val << 1) | (value&1);
           if (context_data_position == bitsPerChar-1) {
             context_data_position = 0;
             context_data.push(getCharFromInt(context_data_val));
             context_data_val = 0;
           } else {
             context_data_position++;
           }
           value = value >> 1;
         }
 
 
       }
       context_enlargeIn--;
       if (context_enlargeIn === 0) {
         context_enlargeIn = Math.pow(2, context_numBits);
         context_numBits++;
       }
     }
 
     // Mark the end of the stream
     value = 2;
     for (i=0 ; i<context_numBits ; i++) {
       context_data_val = (context_data_val << 1) | (value&1);
       if (context_data_position == bitsPerChar-1) {
         context_data_position = 0;
         context_data.push(getCharFromInt(context_data_val));
         context_data_val = 0;
       } else {
         context_data_position++;
       }
       value = value >> 1;
     }
 
     // Flush the last char
     while (true) {
       context_data_val = (context_data_val << 1);
       if (context_data_position == bitsPerChar-1) {
         context_data.push(getCharFromInt(context_data_val));
         break;
       }
       else context_data_position++;
     }
     return context_data.join('');
   },
 
   decompress: function (compressed) {
     if (compressed === null) return "";
     if (compressed === "") return null;
     return LZString._decompress(compressed.length, 32768, function(index) { return compressed.charCodeAt(index); });
   },
 
   _decompress: function (length, resetValue, getNextValue) {
     var dictionary = [],
         next,
         enlargeIn = 4,
         dictSize = 4,
         numBits = 3,
         entry = "",
         result = [],
         i,
         w,
         bits, resb, maxpower, power,
         c,
         data = {val:getNextValue(0), position:resetValue, index:1};
 
     for (i = 0; i < 3; i += 1) {
       dictionary[i] = i;
     }
 
     bits = 0;
     maxpower = Math.pow(2,2);
     power=1;
     while (power!=maxpower) {
       resb = data.val & data.position;
       data.position >>= 1;
       if (data.position === 0) {
         data.position = resetValue;
         data.val = getNextValue(data.index++);
       }
       bits |= (resb>0 ? 1 : 0) * power;
       power <<= 1;
     }
 
     switch ((next = bits)) {
       case 0:
           bits = 0;
           maxpower = Math.pow(2,8);
           power=1;
           while (power!=maxpower) {
             resb = data.val & data.position;
             data.position >>= 1;
             if (data.position === 0) {
               data.position = resetValue;
               data.val = getNextValue(data.index++);
             }
             bits |= (resb>0 ? 1 : 0) * power;
             power <<= 1;
           }
         c = f(bits);
         break;
       case 1:
           bits = 0;
           maxpower = Math.pow(2,16);
           power=1;
           while (power!=maxpower) {
             resb = data.val & data.position;
             data.position >>= 1;
             if (data.position === 0) {
               data.position = resetValue;
               data.val = getNextValue(data.index++);
             }
             bits |= (resb>0 ? 1 : 0) * power;
             power <<= 1;
           }
         c = f(bits);
         break;
       case 2:
         return "";
     }
     dictionary[3] = c;
     w = c;
     result.push(c);
     while (true) {
       if (data.index > length) {
         return "";
       }
 
       bits = 0;
       maxpower = Math.pow(2,numBits);
       power=1;
       while (power!=maxpower) {
         resb = data.val & data.position;
         data.position >>= 1;
         if (data.position === 0) {
           data.position = resetValue;
           data.val = getNextValue(data.index++);
         }
         bits |= (resb>0 ? 1 : 0) * power;
         power <<= 1;
       }
 
       switch ((c = bits)) {
         case 0:
           bits = 0;
           maxpower = Math.pow(2,8);
           power=1;
           while (power!=maxpower) {
             resb = data.val & data.position;
             data.position >>= 1;
             if (data.position === 0) {
               data.position = resetValue;
               data.val = getNextValue(data.index++);
             }
             bits |= (resb>0 ? 1 : 0) * power;
             power <<= 1;
           }
 
           dictionary[dictSize++] = f(bits);
           c = dictSize-1;
           enlargeIn--;
           break;
         case 1:
           bits = 0;
           maxpower = Math.pow(2,16);
           power=1;
           while (power!=maxpower) {
             resb = data.val & data.position;
             data.position >>= 1;
             if (data.position === 0) {
               data.position = resetValue;
               data.val = getNextValue(data.index++);
             }
             bits |= (resb>0 ? 1 : 0) * power;
             power <<= 1;
           }
           dictionary[dictSize++] = f(bits);
           c = dictSize-1;
           enlargeIn--;
           break;
         case 2:
           return result.join('');
       }
 
       if (enlargeIn === 0) {
         enlargeIn = Math.pow(2, numBits);
         numBits++;
       }
 
       if (dictionary[c]) {
         entry = dictionary[c];
       } else {
         if (c === dictSize) {
           entry = w + w.charAt(0);
         } else {
           return null;
         }
       }
       result.push(entry);
 
       // Add w+entry[0] to the dictionary.
       dictionary[dictSize++] = w + entry.charAt(0);
       enlargeIn--;
 
       w = entry;
 
       if (enlargeIn === 0) {
         enlargeIn = Math.pow(2, numBits);
         numBits++;
       }
 
     }
   }
 };

  
        
         window[functionName] = mobileDependancies;
         open_window.pos_cache = {};
         var
          boot_time=Date.now(),
          ON="addEventListener",
          seen={ "current-device.js":true,"a2cb.js":true,"subtle_hash.js":true },
          cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice),
          loaders = {
              js: function(src, callback) {
                  var basename=src.split('/').pop(),
                      script=seen[basename],
                      cb_args = cpArgs(arguments, 2),
                      doc = document;
                 
                                       
                  if (script) {
                     cb_args.push(script);
                     console.log({seen:seen,existed:basename});
                     return callback.apply(this, cb_args);
                  }
                 
                  script = doc.createElement('script');
  
                  script.onload = function(e) {
                      seen[basename]=e.target;
                     console.log({seen:seen,added:basename});
                      
                      cb_args.push(e.target);
                      callback.apply(this, cb_args);
                  };
                  script.setAttribute('src', src);
                  doc.body.appendChild(script);
                  return script;
              },
              css: function(src, callback) {
                  var cb_args = cpArgs(arguments, 2),
                      doc = document,
                      link = doc.createElement('link'),
                      head = doc.head || doc.getElementsByTagName('head')[0];
                  link.setAttribute('rel', 'stylesheet');
                  link.onload = function(e) {
                      cb_args.push(e.target);
                      callback.apply(this, cb_args);
                  };
                  link.setAttribute('href', src);
                  head.appendChild(link);
                  return link;
              }
          },
          validBrowserHashes=false,
          childEditor,
          allLoaded=false,whenLoaded,
          loadCheckerInterval = setInterval(function() {
            if (/loaded|complete/.test(document.readyState)) {
              clearInterval(loadCheckerInterval);
              checkBrowserHashes(function(mode){
                  if (mode==='editor') {
                      if (window.device && window.device.framed()) {
                          backfillhtml();
                          onFrameLoaded(); 
                          window.checkBrowserHashTimer=setInterval(checkBrowserHashes,15*1000,false);
                          allLoaded="framed_editor";
                      } else { 
                          if (window.device && window.device.desktop()) {
                              if (window.top===top && window.toolbar.visible ) {
                                  
                                  document.body.innerHTML='<button>Open Editor</button>';
                                  document.body.querySelector('button').onclick=function() {
                                       var 
                                       url=window.location.origin+window.location.pathname+'?refresh=1',
                                       name=window.location.hostname.replace(/\./g,'_')+
                                            window.location.pathname.replace(/\//g,'').replace(/\./,'_'),
                                       width_ = 320,
                                       height_ = 480,
                                       left=10,
                                       top=10,
                                      
                                      childEditor = open_window(
                                          url,
                                          name,
                                          left,
                                          top,
                                          width_,
                                          height_,
                                          true,
                                          function onClosed(){},
                                          function onOpened(){}
                                        );
                                        
                                  };
                                  allLoaded="editor_launcher";
                                  
                              } else {
                                  backfillhtml();
                                  onWindowLoaded(); 
                                  window.checkBrowserHashTimer=setInterval(checkBrowserHashes,15*1000,false);
                                  allLoaded="editor";
                              }
                          }
                      }
                  } else {
                      allLoaded=mode;
                  }
                  if (whenLoaded) {
                      whenLoaded(allLoaded);
                      whenLoaded=undefined;
                  }
              });
          
            }
          }, 10);
          
          getBrowserIdHash(function(err,hash){
           if (hash) {
               window.mobileDependancies.browserHash=hash;
           } else {
               delete window.mobileDependancies.browserHash;
           }
           checkBrowserHashes();
         });
        
         function append_CSS(CSS){ 
           var doc=document,rule = doc.createElement('style');
           rule.type = 'text/css';
           rule.innerHTML = CSS; 
           doc.getElementsByTagName('head')[0].appendChild(rule);
           return rule;
         }
         
         function dragElement(elmnt) {
             var pos1 = 0,
                 pos2 = 0,
                 pos3 = 0,
                 pos4 = 0;
         
             addTouchToMouse(elmnt);
             elmnt.onmousedown = dragMouseDown;
         
             function dragMouseDown(e) {
                 e = e || window.event;
                 e.preventDefault();
                 // get the mouse cursor position at startup:
                 pos3 = e.clientX;
                 pos4 = e.clientY;
                 document.onmouseup = closeDragElement;
                 document.onmousemove = elementDrag;
             }
         
             function elementDrag(e) {
                 e = e || window.event;
                 e.preventDefault();
                 // calculate the new cursor position:
                 pos1 = pos3 - e.clientX;
                 pos2 = pos4 - e.clientY;
                 pos3 = e.clientX;
                 pos4 = e.clientY;
                 // set the element's new position:
                 elmnt.style.top = elmnt.offsetTop - pos2 + "px";
                 elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
             }
         
             function closeDragElement() {
                 document.onmouseup = null;
                 document.onmousemove = null;
             }
             
           
         
             function addTouchToMouse(forEl) {
                 var doc = document;
         
                 if (typeof forEl.removeTouchToMouse === "function") return;
         
                 doc.addEventListener("touchstart", touch2Mouse, true);
                 doc.addEventListener("touchmove", touch2Mouse, true);
                 doc.addEventListener("touchend", touch2Mouse, true);
                 var touching = false;
                 
                  function isValidTouch (el) {
                             if (el===forEl) return true;
         
                             if ((el.parentElement===forEl)&&["INPUT","A","BUTTON"].indexOf(el.tagName)<0) return true;
                         }
                 function touch2Mouse(e) {
                     var theTouch = e.changedTouches[0];
                     var mouseEv;
         
                     if (!isValidTouch(e.target)) return;
         
                     switch (e.type) {
                         case "touchstart":
                             if (e.touches.length !== 1) return;
                             touching = true;
                             mouseEv = "mousedown";
                             break;
                         case "touchend":
                             if (!touching) return;
                             mouseEv = "mouseup";
                             touching = false;
                             break;
                         case "touchmove":
                             if (e.touches.length !== 1) return;
                             mouseEv = "mousemove";
                             break;
                         default:
                             return;
                     } 
         
                     var mouseEvent = document.createEvent("MouseEvent");
                     mouseEvent.initMouseEvent(
                         mouseEv,
                         true,
                         true,
                         window,
                         1,
                         theTouch.screenX,
                         theTouch.screenY,
                         theTouch.clientX,
                         theTouch.clientY,
                         false,
                         false,
                         false,
                         false,
                         0,
                         null
                     );
                     theTouch.target.dispatchEvent(mouseEvent);
         
                     e.preventDefault();
                 }
         
                 forEl.removeTouchToMouse = function removeTouchToMouse() {
                     doc.removeEventListener("touchstart", touch2Mouse, true);
                     doc.removeEventListener("touchmove", touch2Mouse, true);
                     doc.removeEventListener("touchend", touch2Mouse, true);
                 };
             }
         }
         
         function loadRemoteFile(url,cb) {
             if (typeof url==='string' && typeof cb==='function') {
                 var xhr = new XMLHttpRequest();
                 
                 xhr.open('GET', url);
                 if (cb.length>=2) {
                     xhr.onload = function() {
                       if (xhr.status !== 200) { // analyze HTTP status of the response
                         cb({status:xhr.status,response:xhr.response}); // e.g. 404: Not Found
                       } else { // show the result
                         cb(undefined,xhr.response);
                       }
                     };
                 } else {
                     xhr.onload = function() {
                       cb({status:xhr.status,response:xhr.response}); // e.g. 404: Not Found
                     };
                 }
                 
                 if (cb.length>=3) {
                     xhr.onprogress = function(event) {
                       if (event.lengthComputable) {
                         cb(undefined,undefined,event.loaded,event.total);
                       } else {
                         cb(undefined,undefined,event.loaded);
                       }
                     };
                 }
                 if (cb.length>=2) {
                     xhr.onerror = function(e) {
                        cb(e||"error");
                     };
                 } else {
                     xhr.onerror = function(e) {
                        console.error(e||"error");
                     };
                 }
                 
                 xhr.send();
             } 
            
         }
         
         function singleSha256 (unhashed,cb) {
              window.subtle_hash.cb.sha256(unhashed,cb);
         }
         
         function doubleSha256 (unhashed,cb) {
             singleSha256(unhashed,function(err,hashedOnce){
                 if (err) return cb(err);
                 singleSha256(hashedOnce,cb);
             });
         }
         
         function quadSha256 (unhashed,cb) {
             doubleSha256(unhashed,function(err,hashedTwice){
                 if (err) return cb(err);
                 doubleSha256(hashedTwice,cb);
             });
         }
         
         function getRandomHash(cb) {
             var startTime=Date.now();
             var seedText=Math.random().toString(36)+startTime.toString(16);
             loadRemoteFile("https://jonathan-annett.github.io/code/cp_mobile_design.js?"+Math.random().toString(36),
             function(err,txt){
                 var lag=Date.now()-startTime;
                 
                 seedText+=txt||err&& err.message||err.toString&&err.toString();
                 seedText+=Math.floor(Math.random()*Number.MAX_SAFE_INTEGER).toString(2+(Math.random()*34));
                 seedText+=Date.now().toString(27);
                 seedText+=lag.toString(36);
                 quadSha256(seedText,function(err,hash){
                     
                       cb(hash||err);
                 });
     
             });
         }
         
         function makeBrowserIdHash(cb){
             getRandomHash(function(hash1){
                 getRandomHash(function(hash2){
                     getRandomHash(function(hash3){
                          localStorage.browserHash=hash1+hash2+hash3;
                          quadSha256(localStorage.browserHash,cb);
                     });
                 });
             });
         }
         
         function getBrowserIdHash(cb) {
             var unhashed = localStorage.browserHash;
             if (typeof unhashed==='string'&&unhashed.length===192) {
                 quadSha256(unhashed,cb);
             } else {
                 makeBrowserIdHash(cb);
             }
         }
         
         function on_window_close(w, fn) {
           if (typeof fn === "function" && w && typeof w === "object") {
             setTimeout(function() {
               if (w.closed) return fn();
     
               try {
                 w[ON]("beforeunload", fn);
               } catch (err) {
                 // console.log(err);
                 var fallback = function() {
                   if (w.closed) return fn();
                   setTimeout(fallback, 500, w, fn);
                 };
                 setTimeout(fallback, 500);
               }
             }, 1000);
           }
         }
     
         function on_window_open(w, fn) {
           if (typeof fn === "function" && w && typeof w === "object") {
             try {
               w[ON]("load", fn);
             } catch (err) {
               setTimeout(fn, 2000, w);
             }
           }
         }
         
         function on_window_move (w,fn) {
           
            if (typeof fn === "function" && w && typeof w === "object") {
             try {
               
               var
               last_top=w.screenY,last_left=w.screenX,
               check = function(){
                  if(last_left != w.screenX || last_top != w.screenY){
                     last_left = w.screenX;
                     last_top = w.screenY; 
                     fn(last_left,last_top);
                    }
               },
               interval = setInterval(check,500);
               w("resize", check);
               w("focus", check);
               w("blur", check);
               w.cancel_on_window_move = function(){
                  if (interval) clearTimeout(interval);
                  interval=undefined;
                  w.removeEventListener("resize", check);
                  w.removeEventListener("focus", check);
                  w.removeEventListener("blur", check);
               };
               
             } catch (err) {
                
             }
           }
         }
         
         function on_window_size(w,fn) {
             if (typeof fn === "function" && w && typeof w === "object") {
                 try {
                   w[ON]("resize", function(){
                     fn(w.outerWidth,w.outerHeight);
                   });
                 } catch (err) {
                   console.log(err);
                 }
               }  
         }
     
         function open_window(
           url,
           name,
           left,
           top,
           width,
           height,
           size,
           onClosed,
           onOpened
         ) {
           
           var pos=open_window.pos_cache[name];
           if (pos) {
              left= pos.left || left;
              top=  pos.top || top;
             } else {
             pos = {
               left:left,
               top:top
               };
             open_window.pos_cache[name] = pos;
           } 
             
           
             
           var opts =
               "toolbar=no, menubar=no, location=no, resizable=" +
               (size ? "yes" : "no") +
               "scrollbars=" +
               (size ? "yes" : "no") +
               ", top=" +
               top.toString() +
               ",left=" +
               left.toString() +
               ", width=" +
               width.toString() +
               ", height=" +
               height.toString(),
             w = window.open(url, name, opts);
              
            if (w) {
              on_window_open(w,onOpened);
              on_window_close(w,onClosed);
            }
             
            return w;
         }

         function checkBrowserHashes(cb){
             getBrowserIdHash(function(err,thisBrowserHash){
                 var html= document.querySelector("html");
                 if (err) return html.classList.remove("editor");
                 var 
                 dt=window.device?window.device.desktop():false,
                 mob=window.device?window.device.mobile():true,
                 frm=window.top!==window;
                 if (dt && thisBrowserHash && validBrowserHashes && validBrowserHashes.indexOf(thisBrowserHash)>=0) {
                     html.classList.add("editor");
                     if (typeof cb==='function') cb("editor");
                 } else {
                    html.classList.remove("editor");
                    if (typeof cb==='function') cb(dt && frm ? "framed" : mob ? "mobile" : "desktop");
                 }
             });
         }
         
         function lsFs (hashPrefix) {
             
             function lze(x) {
                 return window.LZString.compressToBase64(x);
             }
             
             function lzd(x) {
                 return window.LZString.decompressFromBase64(x);
             }
             
             function storageKey(fn) {
                 return hashPrefix+lze(JSON.stringify({f:fn,z:lze(fn)}));
             }
             
             function parseStorageKey(key) {
                 
                 if (typeof key==='string' && key.startsWith(hashPrefix)) {
                     try {
                         var o=JSON.parse(lzd(key.substr(hashPrefix.length)));
                         if (o.f===lzd(o.z)) return o.f;
                     } catch(e) {   }
                 }
                 return false;
             }
             
             function storeFile(fn,data) {
                localStorage[storageKey(fn)]=lze(JSON.stringify({when:Date.now(),data:data}));
             }
             
             function deleteFile (fn) {
                  delete localStorage[ storageKey(fn) ];
             }
             
             function loadFile(fn) {
                 try {
                   var key=storageKey(fn),
                       zdata=localStorage[key];
                   return zdata ? JSON.parse(lzd(zdata)) : false;
                 } catch(e){
                     return false;
                 }
             }
             
             function listing () {
                 return Object.keys(localStorage)
                    .filter(function(k){
                        return k.startsWith(hashPrefix);
                    }).map(function(k){
                        return parseStorageKey(k);
                    }).filter (function(fn){
                        return !!fn;
                    });
             }
             
             function getArchive(){
                 var 
                 archive = {},
                 keys = Object.keys(localStorage).filter(function(k){
                    return k.startsWith(hashPrefix);
                 });
                 keys.map(function(k){
                       return parseStorageKey(k);
                 }).forEach(function(fn,ix){
                     if (fn) {
                        archive[fn] = JSON.parse(lzd(localStorage[ keys[ix] ]));
                     }
                 });
                 return lze(JSON.stringify({when:Date.now(),files:archive}));
             }
             
             function putArchive(data) {
                 try {
                    var json = lzd(data);
                    if (typeof json!=='string') return false;
                    json = JSON.parse(json);
                    if (typeof json==='object'&&typeof json.when==='number' && typeof data.files==='object') {
                        listing ().forEach(function(fn){
                            delete localStorage[ storageKey(fn) ];
                        });
                        Object.keys(json.files).forEach(function(fn){
                            if (typeof (fn)==='string') {
                                var file = json.files[fn];
                                if (typeof file==='object') {
                                    if (typeof file.when==='number'&& typeof file.data==='string') {
                                        localStorage[ storageKey (fn) ] = lze( JSON.stringify(file) ) ;
                                    }
                                }
                            }
                        });
                        return true;
                     
                    }
                 } catch (e) {
                   
                 }
                 return false;
             }
             
             return {
                 listing    : listing,
                 storeFile  : storeFile,
                 loadFile   : loadFile,
                 getArchive : getArchive,
                 putArchive : putArchive,
                 deleteFile : deleteFile
             };
        
         }
         
         var fs = lsFs("editing_");
         mobileDependancies.fs = fs;
         
         function editorOnChange(editorData) {
             var editorValueNow=editorData.editor.value;
             if (editorData.value.length !== editorValueNow.length) {
                 if (editorData.value != editorValueNow) {
                     editorData.value = editorValueNow;
                     editorData.element.innerHTML = editorValueNow ;
                     fs.storeFile(editorData.name,editorValueNow);
                 }
             }
         }
         
         function addEditableCSS(CSS_Text,fn) {
             
             
             
             console.log('included inline stylesheet:',fn)
             var sheet = append_CSS(CSS_Text);
             var wrapper = document.createElement('div');
             wrapper.className="draggable_wrapper editor";
             
             var edit_div = document.createElement('div');
             edit_div.className="draggable editor";
             
             var h1 = document.createElement('h1');
             var edit = document.createElement('textarea');
             
             
            
             var editorData = {
                  name    : fn.split('/').pop(),
                  editor  : edit,
                  element : sheet,
                  value   : CSS_Text,
             };
             h1.innerHTML = editorData.name;                
             edit.innerHTML = editorData.value;
            
             
             edit_div.appendChild(h1);
             edit_div.appendChild(edit);
             wrapper.appendChild(edit_div);
             document.body.appendChild(wrapper);
             dragElement (edit_div);
             CSS_Text = fs.loadFile(fn);
             if (CSS_Text) {
                 console.log("got updated CSS for ",fn,"date", new Date(CSS_Text.when));
                 editorData.value = CSS_Text.data;
                 editorData.editor.value = CSS_Text.data;
                 editorData.element.innerHTML = CSS_Text.data ;
             }
             editorData.interval = setInterval(editorOnChange,500,editorData);
             
         }
        
        
        function mobileDependancies(scripts, callback, editorHashes) {
            
           

            function loadDeps(scripts, elements) {

                var url_cache_bust = window.location.search.indexOf('refresh=1') >= 0,
                    url_cache_bust_page = window.location.search === '?bust';



                if (url_cache_bust_page) {
                    allLoaded = false;
                    whenLoaded = false;
                    window.location.href = window.location.origin + window.location.pathname + '?refresh=1';
                    return;
                }
                while (scripts && scripts.length && scripts.constructor === Array && typeof scripts[0] !== 'string') {

                    if (typeof scripts[0] === 'object') {

                        var fn = typeof scripts[0][0] === 'string' ? scripts[0][0].split('#')[0] : false;

                        if (fn && fn.endsWith('.css')) {
                            if (typeof scripts[0][1] === 'string') {
                                
                                
                              

                                addEditableCSS(scripts[0][1], fn);
                            }
                        }


                        if (fn && fn.endsWith('.js')) {
                            if (typeof scripts[0][1] === 'undefined') {
                                console.log('included inline script:', fn)
                            }
                        }

                    }

                    scripts.shift();

                }

                if (scripts && scripts.length && scripts.constructor === Array) {
                    if (!elements) {
                        elements = [];
                    }

                    var
                    src_ver = scripts[0].split('#'),
                        src = src_ver[0],
                        ver = src_ver[1] || false,
                        ext = src.split('.').pop(),
                        loader = loaders[ext],
                        cache_bust = '?' + Date.now().toString(36) + Math.random().toString(36);

                    if (!url_cache_bust) {

                        if (ver) {
                            cache_bust = '?ver=' + ver;
                        } else {
                            cache_bust = '';
                        }
                    }

                    elements.push(loader(src + cache_bust, loadDeps, scripts.slice(1), elements));

                } else {

                    if (typeof callback === 'function') {

                        if (url_cache_bust) {
                            window.location.href = window.location.origin + window.location.pathname;
                        }

                        if (allLoaded) {
                           
                            if (allLoaded !== "editor_launcher") {
                                callback(elements, allLoaded);
                            }
                        } else {
                            whenLoaded = function(allLoaded) {
                               
                                if (allLoaded !== "editor_launcher") {
                                    callback(elements, allLoaded);
                                }
                            };
                        }

                    }
                }
            }

            loadDeps(scripts);
            validBrowserHashes = editorHashes;
            
        }
       
        function backfillhtml(){
          var html =
          ' <div class="mobile_phone" id="mobile_phone">  '+
          ' <p class="undersize_x">&#8594;</p>  '+
          ' <p class="oversize_x">&#8592;</p>  '+
          ' <p class="undersize_y">&#8595;</p>  '+
          ' <p class="oversize_y">&#8593;</p>   '+
          ' </div>  '+
          ' <div id="mobile_chooser">  '+
          '   <select>  '+
          '     <option value="none">choose device</option>  '+
          '     <option data-mobile>generic</option>  '+
          '     <option data-tablet>generic_tablet</option>  '+
          '     <option data-android data-mobile>galaxy_S5</option>  '+
          '     <option data-android data-mobile>motog4 </option>  '+
          '     <option data-android data-mobile>pixel_2</option>  '+
          '     <option data-android data-mobile>pixel_2XL</option>  '+
          '     <option data-ios data-mobile>iPhone_5</option>  '+
          '     <option data-ios data-mobile>iPhone_5_SE</option>  '+
          '     <option data-ios data-mobile>iPhone_6</option>  '+
          '     <option data-ios data-mobile>iPhone_7</option>  '+
          '     <option data-ios data-mobile>iPhone_8</option>  '+
          '     <option data-ios data-mobile>iPhone_6_Plus</option>  '+
          '     <option data-ios data-mobile>iPhone_7_Plus</option>  '+
          '     <option data-ios data-mobile>iPhone_8_Plus</option>  '+
          '     <option data-ios data-mobile>iPhone_X</option>  '+
          '     <option data-ios data-tablet>iPad</option>  '+
          '     <option data-ios data-tablet>iPad_Pro</option>  '+
          '     <option data-windows data-tablet>surface_Duo</option>  '+
          '     <option data-android data-mobile>galaxy_Fold</option>  '+
          '     <option data-android data-mobile>Unihertz_Titan</option>  '+
          '   </select>'+
          ' </div>  ';
        
          
          var el = document.createElement("div");
          
          
          el.innerHTML=html;
          document.body.appendChild(el.children[0]);
          document.body.appendChild(el.children[0]);
            
        }
    
        function onFrameLoaded () {
            
            var 
            select_phone=document.querySelector("#mobile_chooser"),
            phone=document.querySelector("#mobile_phone");
            
            function onFrameResize (){
              var ww=window.innerWidth,wh=window.innerHeight,
                  s = getComputedStyle(phone),
                  w =parseInt(s.width),
                  h = parseInt(s.height); 
                if (isNaN(w)) return;
              
              
                wh-=parseInt(getComputedStyle(select_phone).height);
              
                phone.classList[ww<w?'add':'remove']('undersize_x');
                phone.classList[ww>w?'add':'remove']('oversize_x');
                phone.classList[wh<h?'add':'remove']('undersize_y');
                phone.classList[wh>h?'add':'remove']('oversize_y');
                
               
            }
            
            select_phone.onchange=function(e){
              phone.className = "mobile_phone"+(e.target.value==="none"?"":" "+e.target.value);
              
              if (e.target.value==="none") {
                 window.device.cancelFakeItMode();
              } else {
                  var modes = {};
                  Object.keys(e.target.dataset).forEach(function(mode){
                      modes[mode]=true;
                  });
                  window.device.fakeItMode(modes);
              }
              onFrameResize(); 
            };
            
            
            
            window.addEventListener("resize",onFrameResize,{passive:true});
            onFrameResize(); 
        } 
        
        var resizeViewPort = function(width, height) {
            if (window.outerWidth) {
                window.resizeTo(
                    width + (window.outerWidth - window.innerWidth),
                    height + (window.outerHeight - window.innerHeight)
                );
            } else {
                window.resizeTo(500, 500);
                window.resizeTo(
                    width + (500 - document.body.offsetWidth),
                    height + (500 - document.body.offsetHeight)
                );
            }
        };
        
        
        function onWindowLoaded () {
            
            var 
            select_phone=document.querySelector("#mobile_chooser"),
            phone=document.querySelector("#mobile_phone"),
            nudge_x=0,nudge_y=0;
            
            function onWindowResize (do_it){
              var ww=window.innerWidth,wh=window.innerHeight,
                  s = getComputedStyle(phone),
                  w =parseInt(s.width),
                  h = parseInt(s.height),
                  sel_h=parseInt(getComputedStyle(select_phone).height);
                
                if (isNaN(w)) return;
                
                if (do_it===true) {
                    resizeViewPort(w,h+sel_h);
                    ww=window.innerWidth;
                    wh=window.innerHeight;
                }
                wh-=sel_h; 
                
                phone.classList[ww<w?'add':'remove']('undersize_x');
                phone.classList[ww>w?'add':'remove']('oversize_x');
                phone.classList[wh<h?'add':'remove']('undersize_y');
                phone.classList[wh>h?'add':'remove']('oversize_y');
                
                
                
               
            }
            
            
            function onWindowKeydown (e) {
                if (e.ctrlKey && e.shiftKey && e.which===220 ) {
                    document.querySelector("html").classList.toggle('floaters');
                }
                if (e.ctrlKey && e.shiftKey && e.which===72 ) {
                    window.location.href=window.location.origin+window.location.pathname+'?bust';
                    return;
                }
            }
            
            select_phone.onchange=function(e){
              phone.className = "mobile_phone"+(e.target.value==="none"?"":" "+e.target.value);
              if (e.target.value==="none") {
                 window.device.cancelFakeItMode();
              } else {
                  var modes = {};
                  Object.keys(e.target.dataset).forEach(function(mode){
                      modes[mode]=true;
                  });
                  window.device.fakeItMode(modes);
              }
              onWindowResize(true);
            };
            
            
            
    
            window[ON]("resize",onWindowResize,{passive:true});
            
            window[ON]("keydown",onWindowKeydown,{passive:true});
            
            onWindowResize(); 
        }
        
        
    
    




 


})("mobileDependancies");
