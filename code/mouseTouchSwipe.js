(function() {
  if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      "mouseSwipeEvents",
      "function"
    )
  )
    return;

  var ON = "addEventListener",
    OFF = "removeEventListener",
    swipe_events_hooked = [],
    active_swipes = {},
    fakeConsole = {
      log: function() {},
      info: function() {},
      warn: function() {},
      error: function() {}
    }, console = fakeConsole;

  window.mouseSwipeEvents = mouseSwipeEvents;
  window.mobileSwipeEvents = mobileSwipeEvents;
  window.touchSwipeEvents = mobileSwipeEvents;

  window.mouseSwipeTimeout = 5000;
  window.touchSwipeTimeout = 5000;
  window.mouseSwipeDelta = 1 / 4;
  window.touchSwipeDelta = 1 / 4;

  function defaultSwipeEventNames(ev) {
    return (
      ev || {
        up: "swipe-up",
        down: "swipe-down",
        left: "swipe-left",
        right: "swipe-right"
      }
    );
  }

  // some touch screen drivers send simultaous touch and pointer events.
  // in order to respond to either, some debouncing is required.

  function emitSwipe(
    o,
    swipe_type,
    e,
    swipeDelta,
    swipeTimeDelta,
    swipeDevice
  ) {
    var 
    absDelta = swipeDelta ? Math.abs(swipeDelta)    : undefined,
    velocity = absDelta   ? absDelta/swipeTimeDelta : 0;
    o.dispatchEvent(
      new CustomEvent(swipe_type, {
        bubbles: true,
        cancelable: true,

        // custom event data (legacy)
        detail: {
          clientX: e.clientX,
          clientY: e.clientY,
          swipeDelta: absDelta,
          swipeTimeDelta: swipeTimeDelta,
          swipeVelocity: velocity,
          

          shiftKey: e.shiftKey,
          ctrlKey: e.ctrlKey,
          altKey: e.altKey,
          swipeDevice: swipeDevice
        },

        // add coordinate data that would typically acompany a touch/click event
        clientX: e.clientX,
        clientY: e.clientY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        pageX  : e.pageX,
        pageY  : e.pageY,
        screenX: e.screenX,
        screenY: e.screenY
      })
    );
  }

   function logEvent(e, mode, clear) {
    var active = active_swipes[e.timeStamp],
      log = { mode: mode, type: e.type, x: e.screenX, y: e.screenY };
    console.log(e.timeStamp, mode, log);

    if (clear) {
      Object.keys(active_swipes).forEach(function(k) {
        var active = active_swipes[k],
          filtered = active.filter(function(log) {
            return log.mode !== mode;
          });
        if (filtered.length === 0) {
          active.splice(0, active.length);
          delete active_swipes[k];
        }
      });
    } else {
      if (active) {
        active.push(log);
      } else {
        active_swipes[e.timeStamp] = [log];
      }
    }
    return !!active;
  }
  
   function dragXclass(x) {
      var d = x<0?"left_":"right_";  
      return "drag_"+d+(x<0?0-x:x).toString();
    }
  
   function dragYclass(y) {
      var d = y<0?"up_":"down_";  
      return "drag_"+d+(y<0?0-y:y).toString();
    }
  
   function addDragXClass(el,dragState,x,in_drag) {
       if (in_drag) {
         el.classList.add(in_drag); 
       }
       if (dragState.x===x) return;
        
       el.classList.add(dragXclass(x)); 
       
       if(dragState.x!==undefined) {
           el.classList.remove(dragXclass(dragState.x));
       }
     
       dragState.x=x;
    }
  
   function removeDragXClass(el,dragState,in_drag) {
       if (in_drag) {
         el.classList.remove(in_drag); 
       }
       if(dragState.x===undefined) return;
       
       el.classList.remove(dragXclass(dragState.x));
       delete dragState.x;  
    }
    
    
   function addDragYClass(el,dragState,y,in_drag) {
       if (in_drag) {
         el.classList.add(in_drag); 
       }
       if (dragYclass===y) return;
       el.classList.add(dragYclass(y));
       
       if(dragState.y!==undefined) {
           el.classList.remove(dragYclass(dragState.y));
       }
       dragState.y=y;
    }
  
   function removeDragYClass(el,dragState,in_drag) {
       if (in_drag) {
         el.classList.remove(in_drag); 
       }
       if(dragState.y===undefined) return;
      
       el.classList.remove(dragYclass(dragState.y));
       delete dragState.y;
    }


  function mouseSwipeEvents(o, left, right, up, down, ev) {
    var 
    swipeDevice = "mouse",
    evs = defaultSwipeEventNames(ev),
    self,
    start = {},
        
        
      end = {},
      tracking = false,
      thresholdDistanceX = function() {
        return o.mouseSwipeThresholdX || o.clientWidth * window.mouseSwipeDelta;
      },
      thresholdDistanceY = function() {
        return (
          o.mouseSwipeThresholdY || o.clientHeight * window.mouseSwipeDelta
        );
      };
    
    var 
    par = o.parentElement,
    dragState={};
     

    function gestureStart(e) {
      logEvent(e, "mouse");

      tracking = true;
      /* Hack - would normally use e.timeStamp but it's whack in Fx/Android */
      start.t = Date.now();
      start.x = e.clientX;
      start.y = e.clientY;
      Object.keys(start).forEach(function(k) {
        end[k] = start[k];
      });
      
      if (self.enableDragX) addDragXClass(par,dragState,0,"in_drag_x"); 
      if (self.enableDragY) addDragYClass(par,dragState,0,"in_drag_y"); 
    }

    function gestureMove(e) {
      if (tracking) {
        e.preventDefault();
        end.x = e.clientX;
        end.y = e.clientY;
        if (self.enableDragX) addDragXClass(par,dragState,Math.floor((end.x-start.x) / self.xGranularity)*self.xGranularity);
        if (self.enableDragY) addDragYClass(par,dragState,Math.floor((end.y-start.y) / self.yGranularity)*self.yGranularity);
      } else {
      
        
      }
    }
    
    function swipeDeltaCheck(){
      var now = Date.now();
        var deltaTime = now - start.t;
       var deltaX = end.x - start.x;
          var deltaY = end.y - start.y;
          var t_y = thresholdDistanceY(),
            t_x = thresholdDistanceX(),
          result = {
            deltaTime : deltaTime
          };
          if (deltaX > t_x && Math.abs(deltaY) < t_y) {
            //emitSwipe(o, evs.right, e, deltaX, deltaTime, swipeDevice);
            result.direction = evs.right;
            result.delta = Math.abs(deltaX);
            result.velocity = result.delta / deltaTime;
          } else if (-deltaX > t_x && Math.abs(deltaY) < t_y) {
            //emitSwipe(o, evs.left, e, deltaX, deltaTime, swipeDevice);
            result.direction = evs.left;
            result.delta = Math.abs(deltaX);
            result.velocity = result.delta / deltaTime;
          } else if (deltaY > t_y && Math.abs(deltaX) < t_x) {
            //emitSwipe(o, evs.down, e, deltaY, deltaTime, swipeDevice);
            result.direction = evs.down;
            result.delta = Math.abs(deltaY);
            result.velocity = result.delta / deltaTime;
          } else if (-deltaY > t_y && Math.abs(deltaX) < t_x) {
            //emitSwipe(o, evs.up, e, deltaY, deltaTime, swipeDevice);
            result.direction =  evs.up;
            result.delta = Math.abs(deltaY);
            result.velocity = result.delta / deltaTime;
          }
    }

    function gestureEnd(e) {
      if (tracking) {
        logEvent(e, "mouse", true);
        if (self.enableDragX) removeDragXClass(par,dragState,"in_drag_x"); 
        if (self.enableDragY) removeDragYClass(par,dragState,"in_drag_y"); 
        
        tracking = false;
        var now = Date.now();
        var deltaTime = now - start.t;
        /* work out what the movement was */
        if (deltaTime > window.mouseSwipeTimeout) {
          /* gesture too slow */
          return;
        } else {
          var deltaX = end.x - start.x;
          var deltaY = end.y - start.y;
          var t_y = thresholdDistanceY(),
            t_x = thresholdDistanceX();
          if (deltaX > t_x && Math.abs(deltaY) < t_y) {
            emitSwipe(o, evs.right, e, deltaX, deltaTime, swipeDevice);
          } else if (-deltaX > t_x && Math.abs(deltaY) < t_y) {
            emitSwipe(o, evs.left, e, deltaX, deltaTime, swipeDevice);
          } else if (deltaY > t_y && Math.abs(deltaX) < t_x) {
            emitSwipe(o, evs.down, e, deltaY, deltaTime, swipeDevice);
          } else if (-deltaY > t_y && Math.abs(deltaX) < t_x) {
            emitSwipe(o, evs.up, e, deltaY, deltaTime, swipeDevice);
          }
        }
      }
    }

    if (left) o[ON](evs.left, left);
    if (right) o[ON](evs.right, right);
    if (up) o[ON](evs.up, up);
    if (down) o[ON](evs.down, down);

    self = {
      hooked: function() {
        return swipe_events_hooked.indexOf(self) > 0;
      },

      stop: function() {
        var ix = swipe_events_hooked.indexOf(self);
        if (ix > 0) {
          swipe_events_hooked.splice(ix, 1);
          o[OFF]("pointerdown", gestureStart);
          o[OFF]("pointermove", gestureMove);
          o[OFF]("pointerup", gestureEnd);
          o[OFF]("pointerleave", gestureEnd);
          o[OFF]("pointercancel", gestureEnd);
        }
      },
      start: function() {
        if (!self.hooked()) {
          o[ON]("pointerdown", gestureStart, false);
          o[ON]("pointermove", gestureMove, false);
          o[ON]("pointerup", gestureEnd, false);
          o[ON]("pointerleave", gestureEnd, false);
          o[ON]("pointercancel", gestureEnd, false);

          swipe_events_hooked.push(self);
        }
      },
      fakeConsole: fakeConsole,
      
      enableDragX : window.xDragGranularity!==false,
      enableDragY : window.yDragGranularity!==false,

      xGranularity : window.xDragGranularity||10,
      yGranularity : window.yDragGranularity||10 
    
  
      
    };
    self.start();
    return self;
  }

  function mobileSwipeEvents(o, left, right, up, down, ev) {
    var 
    swipeDevice = "touch",
    evs = defaultSwipeEventNames(ev),
    self,
    start = {},
    end = {},
    tracking = false,
    par = o.parentElement,
    dragState={}; 
    
    
    
    var thresholdDistanceX = function() {
        return o.mouseSwipeThresholdX || o.clientWidth * window.touchSwipeDelta;
      },
      thresholdDistanceY = function() {
        return (
          o.mouseSwipeThresholdY || o.clientHeight * window.touchSwipeDelta
        );
      };
    
    function gestureStart(e) {
      if (logEvent(e, "touch")) {
        console.log("double swipe detected in start!");
        e.preventDefault();
        tracking = false;
        return;
      }

      if (e.touches.length > 1) {
        tracking = false;
        return;
      } else {
        tracking = true;
        /* Hack - would normally use e.timeStamp but it's whack in Fx/Android */
        start.t = Date.now();
        start.x = e.targetTouches[0].clientX;
        start.y = e.targetTouches[0].clientY;
        Object.keys(start).forEach(function(k) {
          end[k] = start[k];
        });
        
        if (self.enableDragX) addDragXClass(par,dragState,0,"in_drag_x"); 
        if (self.enableDragY) addDragYClass(par,dragState,0,"in_drag_y"); 
      }
    }

    function gestureMove(e) {
      if (tracking) {
        e.preventDefault();
        end.x = e.targetTouches[0].clientX;
        end.y = e.targetTouches[0].clientY;
        if (self.enableDragX) addDragXClass(par,dragState,Math.floor((end.x-start.x) / self.xGranularity)*self.xGranularity);
        if (self.enableDragY) addDragYClass(par,dragState,Math.floor((end.y-start.y) / self.yGranularity)*self.yGranularity);
      }
    }

    function gestureEnd(e) {
      if (tracking) {
        tracking = false;
        if (self.enableDragX) removeDragXClass(par,dragState,"in_drag_x"); 
        if (self.enableDragY) removeDragYClass(par,dragState,"in_drag_y"); 

        if (logEvent(e, "touch")) {
          console.log("double swipe detected - in end!");
        }

        var now = Date.now();
        var deltaTime = now - start.t;
        /* work out what the movement was */
        if (deltaTime > window.touchSwipeTimeout) {
          /* gesture too slow */
          return;
        } else {
          var deltaX = end.x - start.x;
          var deltaY = end.y - start.y;
          var t_y = thresholdDistanceY(),
            t_x = thresholdDistanceX();
          if (deltaX > t_x && Math.abs(deltaY) < t_y) {
            emitSwipe(o, evs.right, e, deltaX, deltaTime, swipeDevice);
          } else if (-deltaX > t_x && Math.abs(deltaY) < t_y) {
            emitSwipe(o, evs.left, e, deltaX, deltaTime, swipeDevice);
          } else if (deltaY > t_y && Math.abs(deltaX) < t_x) {
            emitSwipe(o, evs.down, e, deltaY, deltaTime, swipeDevice);
          } else if (-deltaY > t_y && Math.abs(deltaX) < t_x) {
            emitSwipe(o, evs.up, e, deltaY, deltaTime, swipeDevice);
          }
        }
      }
    }

    if (left) o[ON](evs.left, left);
    if (right) o[ON](evs.right, right);
    if (up) o[ON](evs.up, up);
    if (down) o[ON](evs.down, down);

    self = {
      hooked: function() {
        return swipe_events_hooked.indexOf(self) > 0;
      },

      stop: function() {
        var ix = swipe_events_hooked.indexOf(self);
        if (ix > 0) {
          swipe_events_hooked.splice(ix, 1);
          o[OFF]("touchstart", gestureStart);
          o[OFF]("touchmove", gestureMove);
          o[OFF]("touchend", gestureEnd);
          console.log("touch events unhooked");
        }
      },
      start: function() {
        if (!self.hooked()) {
          o[ON]("touchstart", gestureStart);
          o[ON]("touchmove", gestureMove);
          o[ON]("touchend", gestureEnd);
          swipe_events_hooked.push(self);
          console.log("touch events hooked");
        }
      },
      fakeConsole: fakeConsole,
      
      enableDragX : window.xDragGranularity!==false,
      enableDragY : window.yDragGranularity!==false,

      xGranularity : window.xDragGranularity||10,
      yGranularity : window.yDragGranularity||10 
      
    };
    self.start();
    return self;
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
