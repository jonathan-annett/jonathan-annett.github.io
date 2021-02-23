(function(){
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
  
  */
 
   if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      "motionTrack",
      "function"
    )
  )
    return;

    window.motionTrack=motionTrack;

    function motionTrack(whatToTrack) {
      var WHAT = typeof whatToTrack === "string" ? [whatToTrack] : whatToTrack,
        ON  = "addEventListener",
        OFF = "remove" + ON.substr(3),
        MENU= "contextmenu",
        X   = "clientX",
        T   = "touches",
        gran = 1,
        MODES = WHAT.map(function (w) {
          t = w === "touch";
          return {
            t: t,
            w: w,
            d: t ? "touchstart" : w + "down",
            m: w + "move",
            u: t ? "touchend" : w + "up"
          };
        });

      function trackX(el, inDragClass,minusPrefix,plusPrefix,contextClass) {
        el = typeof el === "string" ? document.querySelector(el) : el;
        var
          impassive={passive:false},
          cl=function(cb){
            var l = el&&el.classList||false;
            if(l) cb(l);
          },
          add=function(c,c2){
             if (!c) return;
             if (typeof c2==='number') c+=""+c2;
             cl(function(l){ if(!l.contains(c)) l.add(c); });
          },
          remove=function(c,c2){
             if (!c) return;
             if (typeof c2==='number') c+=""+c2;
             cl(function(l){ l.remove(c); });
          },
          toggle=function(c,c2){
             if (!c) return;
             if (typeof c2==='number') c+=""+c2;
             cl(function(l){ l.toggle(c); });
          },
          dn = function (x) {
            //add(inDragClass);
            //add(plusPrefix,0);
            remove(contextClass);
          },
          mv  = function (x,lastX) {
            add(inDragClass);
            if (lastX!==undefined) {
              if(lastX<0) {
                 remove(minusPrefix,0-lastX);
              } else {
                 remove(plusPrefix,lastX);
              }
            }
           if(x!==undefined) {
             if(x<0) {
                 add(minusPrefix,0-x);
              } else {
                 add(plusPrefix,x);
              }
           }
          },
          up  = function (x,lastX) {
             if (lastX!==undefined) {
              if(lastX<0) {
                 remove(minusPrefix,0-lastX);
              } else {
                 remove(plusPrefix,lastX);
              }
            }
            if(x!==undefined) { 
             if(x<0) {
                 remove(minusPrefix,0-x);
              } else {
                 remove(plusPrefix,x);
              } 
            }
            remove(inDragClass);
          },
          bound_dn={},
          dn_ = function (TOUCH,DOWN, MOVE, UP, e) {
            var mv_,
                up_,
                t = e[T],
                valid = t ?( t.length === 1 ) : (e.button===0);
            if (valid) {
              var 
              E = valid ? (!!t ? t[0] : e) : {},
              start = E[X],
              last=0,
              delta = function (e, cb) {
                e.preventDefault();
                var t = e[T],
                  E = t ? (t.length >= 1 ? t[0] : {}) : e,
                  x = E[X],
                  u,
                  now = (x === u) ? last : (Math.floor((x - start) / gran)) * gran;
                if (now === last) {
                  return now;
                }

                if ((typeof cb === "function") && (now!==undefined) ) {
                  cb(now,last);
                  last = now;
                } else {
                  return now;
                }
              };

                el[OFF](DOWN,bound_dn[DOWN]); 
                e.preventDefault();
                el[ON]( MOVE,    (mv_ = function (e) {
                    delta(e, mv);
                  }),   impassive );
                el[ON](  UP,   (up_ = function (e) {
                    var valid= !e.touches||e.touches.length===0;
                    if (valid) {
                      el[OFF](UP, up_);
                      el[OFF](MOVE, mv_);
                      up(delta(e),last);
                      el[ON](DOWN,bound_dn[DOWN],impassive); 
                    }
                  }),  impassive  );
                dn(0);
            } else {
              if (e.button===2) {
                var mnu;
                el[ON](MENU,(mnu=function(e){
                  e.preventDefault();
                  el[OFF](MENU,mnu);
                  toggle(contextClass);
                }),impassive);
              }
            }
          };

        MODES.forEach(function (m) {
          (function (TOUCH, WHAT, DOWN, MOVE, UP) {

            if (el && typeof el[ON] === "function") {
              bound_dn[DOWN]=dn_.bind(this,TOUCH,DOWN,MOVE,UP); 
              el[ON](DOWN,bound_dn[DOWN],impassive); 
            }

          })(m.t, m.w, m.d, m.m, m.u);
        });
      }

      return {
        x: trackX
      };
    }


function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
      s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      (!(e.concat([o]).indexOf(location.hostname) >= 0) &&
        (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
        console.warn(
          "Please download " + s + " and serve it from your own server."
        ),
        !0))
    );
  }

})();
