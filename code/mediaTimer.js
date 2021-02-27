  (function(functionName) {
      if (scriptCheck(['cdpn.io', 'codepen.io'], 'jonathan-annett.github.io', functionName, 'object')) return;


      window[functionName] = mediaTimerWrap;

        function scriptCheck(e, o, t, n) {
            /* jshint ignore:start*/
            if ("object" != typeof window || t && typeof window[t] === n) return !1;
            var r = document.getElementsByTagName("script"),
                s = r[r.length - 1].src;
            
            return !!s.startsWith("https://" + o + "/") && (!(e.concat([o]).indexOf(location.hostname) >= 0) && (console.error("PLEASE DON'T LINK TO THIS FILE FROM " + o), console.warn("Please download " + s + " and serve it from your own server."), !0))
            /* jshint ignore:end*/
            
        } 



      function mediaTimerWrap(containerId, duration, autostart) {
          var durationMsec;
          var sliderDiv = document.getElementById(containerId);
          var rangeElem = sliderDiv.querySelectorAll("input");
          var textElem = rangeElem[1];
          rangeElem = rangeElem[0];
          var elapsedElem = sliderDiv.querySelectorAll("p");
          var remainElem = elapsedElem[1];
          elapsedElem = elapsedElem[0];
          var impassive = true;
          // create options object with a getter to see if its passive property is accessed
          Object.defineProperty && Object.defineProperty({}, "passive", {
              get: function() {
                  impassive = {
                      passive: false
                  };
              }
          });

          function decimalSecondsToMsec(seconds) {
              return Math.floor(seconds / 1000);
          }

          function twoDigits(x) {
              return (x < 10 ? "0" : "") + x.toString();
          }

          function decimalSecondsToString(seconds) {
              var min = Math.floor(seconds / 60);
              var sec = Math.floor(seconds) % 60;
              var frac = seconds - (min * 60 + sec);
              frac = frac === 0 ? ".000" : (frac.toString() + "000").substr(1, 4);
              return min.toString() + ":" + twoDigits(sec) + frac;
          }

          function MSECtoString(ms) {
              return decimalSecondsToString(ms / 1000);
          }

          function stringToDecimalSeconds(t, def) {
              try {
                  var parts = t.split(":");
                  var min = Number(parts[0].trim());
                  var sec = Number(parts[1].trim());
                  var res = Math.floor((min * 60 + sec) * 1000);
                  return isNaN(res) ? def : res;
              } catch (e) {
                  return def;
              }
          }
          /**
           * Lower range value
           */
          var Lower = 0;

          /**
           * Upper range value
           */
          var Upper = rangeElem.max;


          /**
           * Returns a number unchanged if it is in the Lower to Upper range.
           * Returns Lower value if the number is less than the Lower value.
           * Returns Upper value if the number is greater than the Upper value.
           */
          function clamp(n) {
              const n1 = Math.max(Lower, n);
              const n2 = Math.min(n1, Upper);
              return n2;
          }

          /**
           * Update textElem value to rangeElem value
           */
          //
          function onTimeSlideChanged() {
              var ms = rangeElem.value,
                  secStr = MSECtoString(ms);
              textElem.value = secStr;
              elapsedElem.textContent = secStr;
              remainElem.textContent = MSECtoString(durationMsec - ms);
          }

          function onEditTimeCode() {
              var seconds = stringToDecimalSeconds(textElem.value, Number(rangeElem.value)),
                  ms = clamp(seconds);

              rangeElem.value = ms;
              elapsedElem.textContent = MSECtoString(ms);
              remainElem.textContent = MSECtoString(durationMsec - ms);
          }

          /**
           * Update initial rangeElem value to Lower value
           */
          rangeElem.value = Lower;

          /**
           * Update initial textElem value to rangeElem value
           */
          textElem.value = MSECtoString(Lower);

          /**
           * Subscribe to rangeElem events
           */
          rangeElem.addEventListener("input", onTimeSlideChanged);

          /**
           * Subscribe to textElem events
           */
          textElem.addEventListener("input", onEditTimeCode);

          function createTimer(checkEvery, getElapsed, setElapsed) {
              checkEvery = checkEvery || 1000;
              var muted = false,
                  last,
                  start = Date.now(),

                  defaultGetElapsed = function() {
                      return Date.now() - start;
                  },
                  defaultSetElpased = function(elapsed) {
                      start = Date.now() - elapsed;
                      return elapsed;
                  };


              getElapsed = (typeof getElapsed === "function" ? getElapsed : defaultGetElapsed);
              setElapsed = (typeof setElapsed === "function" ? setElapsed : defaultSetElpased);

              var self,
              rangeElmMouseUp = function() {
                  start = Date.now() - setElapsed(rangeElem.value);
                  self.unmute();
              },
              tmr,
              restart = function() {
                  rangeElem.value = 0;
                  tmr = setInterval(function() {
                      var now_ = Date.now(),
                          elapsed = now_ - start;
                      if (muted) return;
                      if (elapsed > rangeElem.max) {
                          console.log("looks like the end..");
                          start = (now_ = Date.now()) - (elapsed = getElapsed());
                          last = now_;
                          if (elapsed > rangeElem.max) {
                              console.log("yes it's the end..");
                              clearTimeout(tmr);
                              tmr = undefined;
                              return;
                          } else {
                              console.log("nope not yet");
                          }
                      }
                      rangeElem.value = elapsed;
                      onTimeSlideChanged();
                      if (!last || now_ - last > checkEvery) {
                          self.seek(getElapsed());
                      }


                  }, 50);
                  rangeElem.addEventListener("touchstart", self.mute, impassive);
                  rangeElem.addEventListener("mouseenter", self.mute, impassive);
                  rangeElem.addEventListener("touchend", rangeElmMouseUp, impassive);
                  rangeElem.addEventListener("mouseleave", rangeElmMouseUp, impassive);
              };

              self = {
                  seek: function(seconds) {
                      var now_;
                      start = (now_ = Date.now()) - seconds;
                      last = now_;
                  },
                  start: restart,
                  stop: function() {
                      clearTimeout(tmr);
                      console.log("stopped");
                      rangeElem.removeEventListener("touchstart", self.mute);
                      rangeElem.removeEventListener("mouseenter", self.mute);
                      rangeElem.removeEventListener("touchend", rangeElmMouseUp);
                      rangeElem.removeEventListener("mouseleave", rangeElmMouseUp);
                  },
                  mute: function() {
                      muted = true;
                  },
                  unmute: function() {
                      muted = false;
                  }
              };

              durationMsec = (duration || 30) * 1000;
              rangeElem.max = durationMsec;


              if (autostart) { 
                  restart(); 
              }  else {
                  rangeElem.value = 0;
                  onTimeSlideChanged();
              }
              return self;
          }

          return createTimer(1000);
      }

       
  })("mediaTimerWrap");