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
    
    //inject subtle_hash
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
    
    //inject current-device
    (function(exports,module){'use strict';
     /*based on https://github.com/matthewhudson/current-device/blob/master/src/index.js*/
   
    exports.__esModule = true;
    
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
    
    // Orientation Handling
    // --------------------
    
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
                              
    /*
    custom options added by Jonathan Annett
    */                         
                              
     function isFramed () {
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
    }  
      
    if ( isFramed () )
      addClass("framed");
                              
    device.framed = function () {
      return hasClass("framed");
    };
                               
    
    exports.default = device;
    module.exports = exports['default'];})({},{exports:{}})
    
    
  
        
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
         
         function editorOnChange(editorData) {
             var editorValueNow=editorData.editor.value;
             if (editorData.value.length !== editorValueNow.length) {
                 if (editorData.value != editorValueNow) {
                     
                     if ( editorData.storageTimeout ) {
                         clearInterval(editorData.storageTimeout);
                         delete editorData.storageTimeout;
                     }
                     editorData.value = editorValueNow;
                     console.log('changed');
                     editorData.element.innerHTML = editorValueNow ;
                     if (editorData.storageHash) {
                         editorData.storageTimeout = setTimeout(function() {
                             delete editorData.storageTimeout;
                             localStorage[editorData.storageHash] = window.LZString.compressToEncodedURIComponent (editorData.value);
                             
                         },10*1000);
                     } else {
                         singleSha256(editorData.name,function(err,hash){
                             if (!err && hash) {
                                 editorData.storageHash = "editing_"+hash;
                                 localStorage[editorData.storageHash] = window.LZString.compressToEncodedURIComponent (editorData.value);
                             }
                         });
                         
                     }
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
             
             editorData.interval = setInterval(editorOnChange,500,editorData);
              
             
             dragElement (edit_div);
             
             
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
                                
                                
                                if (!window.LZString) {
                                    if (scripts.indexOf("lz-string.js")<0) {
                                        if (!seen["lz-string.js"]) {
                                            scripts.push("lz-string.js");
                                        }
                                    }
                                    
                                }

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
          '     <option>choose device</option>  '+
          '     <option>generic </option>  '+
          '     <option>galaxy_S5</option>  '+
          '     <option>motog4 </option>  '+
          '     <option>pixel_2</option>  '+
          '     <option>pixel_2XL</option>  '+
          '     <option>iPhone_5</option>  '+
          '     <option>iPhone_5_SE</option>  '+
          '     <option>iPhone_6</option>  '+
          '     <option>iPhone_7</option>  '+
          '     <option>iPhone_8</option>  '+
          '     <option>iPhone_6_Plus</option>  '+
          '     <option>iPhone_7_Plus</option>  '+
          '     <option>iPhone_8_Plus</option>  '+
          '     <option>iPhone_X</option>  '+
          '     <option>iPad</option>  '+
          '     <option>iPad_Pro</option>  '+
          '     <option>surface_Duo</option>  '+
          '     <option>galaxy_Fold</option>  '+
          '     <option>Unihertz_Titan</option>  '+
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
              onWindowResize(true);
            };
            
            
            
    
            window[ON]("resize",onWindowResize,{passive:true});
            
            window[ON]("keydown",onWindowKeydown,{passive:true});
            
            onWindowResize(); 
        }
        
        
    
    




 


})("mobileDependancies");
