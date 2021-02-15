(function(){
 if (typeof window!=='object') 
    return;
 if (typeof window.mouseSwipeEvents==='function') 
    return;
  
  var  ON = "addEventListener",
      OFF= "removeEventListener";

 window.mouseSwipeEvents = mouseSwipeEvents;
 window.mobileSwipeEvents = mobileSwipeEvents;
 window.touchSwipeEvents  = mobileSwipeEvents;
 
 window.mouseSwipeTimeout=300;
 window.touchSwipeTimeout=200;
 window.mouseSwipeDelta= 1/4;
 window.touchSwipeDelta= 1/4;
  
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
 
  function emitSwipe(o, swipe_type, e , swipeDelta, swipeTimeDelta, swipeDevice) {
    o.dispatchEvent(
      new CustomEvent(swipe_type, {
        bubbles: true,
        cancelable: true,

        // custom event data (legacy)
        detail: {
          clientX: e.clientX,
          clientY: e.clientY,
          swipeDelta : swipeDelta ? Math.abs(swipeDelta) : undefined,
          swipeTimeDelta :  swipeTimeDelta,
         
           shiftKey : e.shiftKey,
           ctrlKey : e.ctrlKey,
           altKey : e.altKey,
           swipeDevice : swipeDevice
       
      
        },
       
        shiftKey : e.shiftKey,
        ctrlKey : e.ctrlKey,
        altKey : e.altKey,
       

        // add coordinate data that would typically acompany a touch/click event
        clientX: e.clientX,
        clientY: e.clientY,
        offsetX: e.offsetX,
        offsetY: e.offsetY,
        pageX: e.pageX,
        pageY: e.pageY,
        screenX: e.screenX,
        screenY: e.screenY
      })
    );
  }

  function mouseSwipeEvents(o, left, right, up, down, ev) {
    var swipeDevice = 'mouse';
    var evs = defaultSwipeEventNames(ev);

    var start = {},
      end = {},
      tracking = false,
      thresholdDistanceX = function(){
        return o.mouseSwipeThresholdX ||  (o.clientWidth* mouseSwipeDelta) ;
      },
      thresholdDistanceY = function(){
        return o.mouseSwipeThresholdY || (o.clientHeight * mouseSwipeDelta);
      };
    function gestureStart(e) {
      tracking = true;
      /* Hack - would normally use e.timeStamp but it's whack in Fx/Android */
      start.t = Date.now();
      start.x = e.clientX;
      start.y = e.clientY;
      Object.keys(start).forEach(function (k) {
        end[k] = start[k];
      });
    }

    function gestureMove(e) {
      if (tracking) {
        e.preventDefault();
        end.x = e.clientX;
        end.y = e.clientY;
      }
    }

    function gestureEnd(e) {
      if (tracking) {
        tracking = false;
        var now = Date.now();
        var deltaTime = now - start.t;
         /* work out what the movement was */
        if (deltaTime > mouseSwipeTimeout) {
          /* gesture too slow */
          return;
        } else {
          var deltaX = end.x - start.x;
          var deltaY = end.y - start.y;
          var t_y= thresholdDistanceY(),t_x=thresholdDistanceX();
          if (
            deltaX > t_x &&
            Math.abs(deltaY) < t_y
          ) {
            emitSwipe(o, evs.right, e, deltaX, deltaTime,swipeDevice );
          } else if (
            -deltaX > t_x &&
            Math.abs(deltaY) < t_y
          ) {
            emitSwipe(o, evs.left, e, deltaX, deltaTime,swipeDevice );
          } else if (
            deltaY > t_y &&
            Math.abs(deltaX) < t_x
          ) {
            emitSwipe(o, evs.down, e, deltaY, deltaTime,swipeDevice );
          } else if (
            -deltaY > t_y &&
            Math.abs(deltaX) < t_x
          ) {
            emitSwipe(o, evs.up, e, deltaY, deltaTime,swipeDevice );
          }
        }
      }
    }

    o[ON]("pointerdown", gestureStart, false);
    o[ON]("pointermove", gestureMove, false);
    o[ON]("pointerup", gestureEnd, false);
    o[ON]("pointerleave", gestureEnd, false);
    o[ON]("pointercancel", gestureEnd, false);
    if (left) o[ON](evs.left, left);
    if (right) o[ON](evs.right, right);
    if (up) o[ON](evs.up, up);
    if (down) o[ON](evs.down, down);
  }

  function mobileSwipeEvents(o, left, right, up, down, ev) {
    var swipeDevice = 'touch';
    var evs = defaultSwipeEventNames(ev);

    var start = {};
    var end = {};
    var tracking = false;
    var 
      thresholdDistanceX = function(){
        return o.mouseSwipeThresholdX ||  (o.clientWidth* touchSwipeDelta) ;
      },
      thresholdDistanceY = function(){
        return o.mouseSwipeThresholdY || (o.clientHeight * touchSwipeDelta);
      };
    function gestureStart(e) {
      if (e.touches.length > 1) {
        tracking = false;
        return;
      } else {
        tracking = true;
        /* Hack - would normally use e.timeStamp but it's whack in Fx/Android */
        start.t = Date.now();
        start.x = e.targetTouches[0].clientX;
        start.y = e.targetTouches[0].clientY;
        Object.keys(start).forEach(function (k) {
          end[k] = start[k];
        });
      }
    }

    function gestureMove(e) {
      if (tracking) {
        e.preventDefault();
        end.x = e.targetTouches[0].clientX;
        end.y = e.targetTouches[0].clientY;
      }
    }

    function gestureEnd(e) {
      tracking = false;
      var now = Date.now();
      var deltaTime = now - start.t;
      /* work out what the movement was */
      if (deltaTime > touchSwipeTimeout) {
        /* gesture too slow */
        return;
      } else {
        
        var deltaX = end.x - start.x;
        var deltaY = end.y - start.y;
        var t_y= thresholdDistanceY(),t_x=thresholdDistanceX();
        if (
          deltaX > t_x &&
          Math.abs(deltaY) < t_y
        ) {
          emitSwipe(o, evs.right, e, deltaX, deltaTime,swipeDevice );
        } else if (
          -deltaX > t_x &&
          Math.abs(deltaY) < t_y
        ) {
          emitSwipe(o, evs.left, e, deltaX, deltaTime,swipeDevice );
        } else if (
          deltaY > t_y &&
          Math.abs(deltaX) < t_x
        ) {
          emitSwipe(o, evs.down, e, deltaY, deltaTime,swipeDevice );
        } else if (
          -deltaY > t_y &&
          Math.abs(deltaX) < t_x
        ) {
          emitSwipe(o, evs.up, e, deltaY, deltaTime,swipeDevice );
        }
      }
    }
    
    if (left) o[ON](evs.left, left);
    if (right) o[ON](evs.right, right);
    if (up) o[ON](evs.up, up);
    if (down) o[ON](evs.down, down); 

    var 
    events_hooked = false,
    self= {
       hooked : function() {
         return events_hooked;
       },
      
         
       stop : function(){
         if (events_hooked) {
             o[OFF]("touchstart", gestureStart); 
             o[OFF]("touchmove", gestureMove);
             o[OFF]("touchend", gestureEnd);
             
               events_hooked = false;
         }
       },
      start : function(){
         if (!events_hooked) {
           
             o[ON]("touchstart", gestureStart); 
             o[ON]("touchmove", gestureMove);
             o[ON]("touchend", gestureEnd);
           
            events_hooked = true;
         }
       }
    };
    self.start();
    return self;

  }
  
})();
