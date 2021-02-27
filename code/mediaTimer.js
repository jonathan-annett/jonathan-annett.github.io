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



    function mediaTimerWrap(containerId, duration, autostart,playerId) {
        var updateInterval = 100;
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

        function decimalSecondsToString(seconds,places) {
            places=places||3;
            var min = Math.floor(seconds / 60);
            var sec = Math.floor(seconds) % 60;
            var frac = seconds - (min * 60 + sec);
            frac = frac === 0 ? ".000".substr(0,1+places) : (frac.toString() + "000").substr(1, 1+places);
            return min.toString() + ":" + twoDigits(sec) + frac;
        }

        function MSECtoString(ms,places) {
            return decimalSecondsToString(ms / 1000,places);
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
        
        var slideFrozen = false;
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
        function onTimeSlideChanged(e,ignore,ms) {
            ms = ms || rangeElem.value;
            textElem.value = MSECtoString(ms);
            elapsedElem.textContent = MSECtoString(ms,1);
            remainElem.textContent = MSECtoString(durationMsec - ms,1);
        }

        function onEditTimeCode() {
            var seconds = stringToDecimalSeconds(textElem.value, Number(rangeElem.value)),
                ms = clamp(seconds);

            rangeElem.value = ms;
            elapsedElem.textContent = MSECtoString(ms,1);
            remainElem.textContent  = MSECtoString(durationMsec - ms,1);
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
            var timerObj;
            checkEvery = checkEvery || 1000;
            var last,
                started = Date.now(),

                defaultGetElapsed = function() {
                    return Date.now() - started;
                },
                defaultSetElapsed = function(elapsed) {
                    started = Date.now() - elapsed;
                    return elapsed;
                };


            getElapsed = (typeof getElapsed === "function" ? getElapsed : defaultGetElapsed);
            setElapsed = (typeof setElapsed === "function" ? setElapsed : defaultSetElapsed);

            var 
            mouse_down=false,
            rangeElmMouseUp = function() {
                var ms = Number(rangeElem.value);
                setElapsed(ms,function(newMS){
                    console.log({ms,newMS});
                    rangeElem.value = newMS;
                    started = now_-ms;
                    last = now_-2000;
                });/*ignore returned value as it hasn't finsihed seeking*/
                var now_=Date.now();
                started = now_-ms;
                last = now_+2000;
                rangeElem.value = ms;
                mouse_down = false;
            },
            rangeElmMouseDn = function(e) {
                mouse_down = true;
                slideFrozen = true;
            },
            rangeElmMouseEnter= function(e) {
                slideFrozen = mouse_down;
            },
            rangeElmMouseLeave = function(e) {
              if (!mouse_down) {
                  slideFrozen = false;
              }
            },
            
            tmr,lastKnownPlayerElapsed,
            displayUpdateTimer = function() {
                var now_ = Date.now(),
                    elapsed = now_ - started;

                if (elapsed >= rangeElem.max) {
                    console.log("double checking endtime") ;
                    started = now_ - (elapsed = getElapsed());
                    last = now_;
                    if (elapsed >= rangeElem.max) {
                        console.log("playback has finished") ;
                        clearTimeout(tmr);
                        tmr = undefined;
                        return;
                    } else {
                       console.log("keep going") ;
                    }
                }
                
                if (!slideFrozen) {
                    rangeElem.value = elapsed;
                    onTimeSlideChanged(undefined, undefined, elapsed);
                    
                   
                    var updateIn = last ? now_ - last : 0;
    
                    if (!last || (updateIn >= checkEvery)) {
                        var newElapsed = getElapsed();
                        if (!last && lastKnownPlayerElapsed && lastKnownPlayerElapsed===newElapsed) {
                            console.log("player appears to have stopped");
                            clearTimeout(tmr);
                            tmr=undefined;
                           
                        } else {
                            lastKnownPlayerElapsed = newElapsed
                            console.log(updateIn,"msec since last check, checked elapsed(",elapsed,") against player (",newElapsed,")");
                            timerObj.seek(newElapsed);
                        }
                    } else {
                       // console.log("not frozen, setting", elapsed);
                    }
                 } else {
                  //   console.log("frozen, ignoring", elapsed);
                 }

            },
            
            restart = function() {
                rangeElem.value = 0;
                tmr = setInterval(displayUpdateTimer, updateInterval);
                rangeElem.addEventListener("touchstart", rangeElmMouseDn, impassive);
                rangeElem.addEventListener("touchend", rangeElmMouseUp, impassive);
                
                rangeElem.addEventListener("mouseenter", rangeElmMouseEnter, impassive);
                rangeElem.addEventListener("mousedown", rangeElmMouseDn, impassive);
                rangeElem.addEventListener("mouseup", rangeElmMouseUp, impassive);
                rangeElem.addEventListener("mouseleave", rangeElmMouseLeave, impassive);
            };

            timerObj = {
                seek: function(msec) {
                    var now_;
                    started = (now_ = Date.now()) - msec;
                    last = now_;
                    //console.log("seek",msec,"msec at",now_);
                },
                start: restart,
                stop: function() {
                    clearTimeout(tmr);
                    console.log("stopped");
                    rangeElem.removeEventListener("touchstart", rangeElmMouseDn);
                    rangeElem.removeEventListener("touchend", rangeElmMouseUp);
                    
                    rangeElem.removeEventListener("mouseenter", rangeElmMouseEnter);
                    rangeElem.removeEventListener("mousedown", rangeElmMouseDn);
                    rangeElem.removeEventListener("mouseleave", rangeElmMouseLeave);
                    rangeElem.removeEventListener("mouseup", rangeElmMouseUp);
                    
                },
                mute: function() {
                    slideFrozen = true;
                },
                unmute: function() {
                    slideFrozen = false;
                },
                
                attach: function (elapsed,dur,running,getter,setter,attachId) {
                    if ( playerId===attachId ) {
                        //already attached to this player
                        
                        if (running && !tmr) {
                            started=Date.now()-elapsed;
                            restart();
                            console.log("already attached to",attachId,"restarting display timer");
                        } else {
                            console.log("already attached to",attachId,running?"running":"not running",!!tmr?"timer active":"timer not active");
                        }
                        return;
                    }
                    console.log("attaching:",playerId,"-->",attachId);
                    playerId=attachId;
                    
                    if (tmr) {
                        clearInterval(tmr);
                        tmr = undefined;
                    }
                  
                    getElapsed = typeof getter === 'function' ? getter : defaultGetElapsed;
                    setElapsed = typeof setter === 'function' ? setter : defaultSetElapsed;
                    duration = dur;
                    durationMsec = Math.floor(duration * 1000);
                    rangeElem.value = Math.floor(elapsed*1000);
                    rangeElem.max = durationMsec;
                    onTimeSlideChanged();
                    if (running) {
                        started=Date.now()-elapsed;
                        restart();
                    }
                   
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
            return timerObj;
        }

        return createTimer(1000);
    }

     
})("mediaTimerWrap");