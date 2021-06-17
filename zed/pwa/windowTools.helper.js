/*global self*/



window.windowToolsHelperStorageEvent = function windowToolsHelperStorageEvent(){
    
    const wid = window.wid;

    if (wid) {
        const positionKey    = "windowTools.cmd."+wid+".position";
        const positionReplyKey    = "windowTools.cmd."+wid+".position.reply";
        const positionArgs   = localStorage.getItem(positionKey);
        
        window.windowToolsHelperStorageEvent.checkTracking(wid); 

        const position = JSON.stringify(windowToolsHelperStorageEvent.winRestoreCapture ().slice(-2));

        if (positionArgs) {
            windowToolsHelperStorageEvent.restoreCapturedState(JSON.parse(positionArgs));
            localStorage.setItem(positionReplyKey,position);
            localStorage.removeItem(positionKey);
        } else {
            const reportPositionKey  = "windowTools.cmd."+wid+".reportPosition";
            const reportPositionArgs = localStorage.getItem(reportPositionKey);
            
               
            if (reportPositionArgs) {
               const reportPositionReplyKey  = "windowTools.cmd."+wid+".reportPosition.reply";
               localStorage.setItem(reportPositionReplyKey,position);
               localStorage.removeItem(reportPositionKey);
            } else {
                const closeKey  = "windowTools.cmd."+wid+".close";
                const closedKey = "windowTools.cmd."+wid+".closed";
                const closeArgs = localStorage.getItem(closeKey);
                self.removeEventListener('beforeunload',window.windowToolsHelperStorageEvent.before_unload);
                if (closeArgs) {
                    localStorage.setItem(closedKey,JSON.stringify(position));
                    localStorage.removeItem(closeKey);
                    window.close();
                        
                }
            }
        }
    }

};


window.windowToolsHelperStorageEvent.checkTracking = function(wid){
    const moveTrackingKey = "windowTools.cmd."+wid+".position.tracking";
    const moveTrackingUpdateKey = "windowTools.cmd."+wid+".position.tracking.update";
    const update = function (){
      localStorage.setItem(
          moveTrackingUpdateKey,
          JSON.stringify(
              window.windowToolsHelperStorageEvent.winRestoreCapture()
          )
      );
    };
    
    if ( !!localStorage.getItem(moveTrackingKey) ) {
        if (!window.cancel_on_window_move) {
            window.windowToolsHelperStorageEvent.on_window_move(update);
            window.windowToolsHelperStorageEvent.on_window_size(update);
        }
        
    } else {
        if (!!window.cancel_on_window_move) {
            window.cancel_on_window_move();
            window.cancel_on_window_size();
        }
    }
};        


window.windowToolsHelperStorageEvent.before_unload = function (){
    const wid = window.wid;
    if (wid) {
        const closedKey  = "windowTools.cmd."+wid+".closed";
        const position = window.windowToolsHelperStorageEvent.winRestoreCapture ().slice(-2);
        localStorage.setItem(closedKey,JSON.stringify(position));
        window.close();
    }
};

window.windowToolsHelperStorageEvent.winRestoreCapture = function() {
    const win = window;
    const cmds = [
      [ 0,   [0,0]   ],
      [ 1, [win.outerWidth,win.outerHeight] ]
    ];
    if (!(win.screenX===0&&win.screenY===0)) {
       cmds.push([ 0,  [win.screenX,win.screenY]   ]);
    }
    return cmds;
};

window.windowToolsHelperStorageEvent.restoreCapturedState = function (cmds) {
    const 
    win=window,
    fn=[win.moveTo,win.resizeTo],
    len=cmds.length;
    for(var i = 0; i < len; i++) {
        var x = cmds[i];
        fn[ x[0] ].apply(win,x[1]);
        x[1].splice(0,2);
        x.splice(0,2);
    }
    cmds.splice(0,len);
};

window.addEventListener('storage',      window.windowToolsHelperStorageEvent);
window.addEventListener('beforeunload', window.windowToolsHelperStorageEvent.before_unload);

window.windowToolsHelperStorageEvent.disable= function () {
    window.removeEventListener('storage',      window.windowToolsHelperStorageEvent);
    window.removeEventListener('beforeunload', window.windowToolsHelperStorageEvent.before_unload);
} 

window.windowToolsHelperStorageEvent.on_window_move = function (fn) {
      const w=window;
      const On="addEventListener";
      const Off="removeEventListener";
      if (typeof fn === "function") {
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
         w[On]("resize", check);
         w[On]("focus", check);
         w[On]("blur", check);
         w.cancel_on_window_move = function(){
            if (interval) clearTimeout(interval);
            interval=undefined;
            w[Off]("resize", check);
            w[Off]("focus", check);
            w[Off]("blur", check);
            w[Off]("beforeunload",w.cancel_on_window_move);
            delete w.cancel_on_window_move;
         };
         
         w[On]("beforeunload",w.cancel_on_window_move);
         
       } catch (err) {
          
       }
     }
};

window.windowToolsHelperStorageEvent.on_window_size = function (fn) {
   if (typeof fn === "function") {
       try {
         const wrap = function(){
            fn(window.outerWidth,window.outerHeight);
         };
         window.addEventListener("resize", wrap);
         window.cancel_on_window_size = function(){
            window.removeEventListener("resize", wrap);
            delete window.cancel_on_window_size;
         };
         
       } catch (err) {
         console.log(err);
       }
     }  
};
       
    



window.fs_api = makeFullScreenApi(window.document.body);

function makeFullScreenApi(element, cb) {
  var notify = function(evs, isFs) {
      evs.forEach(function(fn) {
        fn(element, isFs);
      });
    },
    fs_api = {
      isFullscreen: function() {
        return false;
      },
      exitFullscreen: function() {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if (document.webkitCancelFullScreen) {
          document.webkitCancelFullScreen();
        } else if (document.msExitFullscreen) {
          document.msExitFullscreen();
        }
      },
      __events: {
        enter: [],
        exit: [],
        toggle: []
      },
      on: function(e, f) {
        var fns = fs_api.__events[e];
        if (
          typeof f === "function" &&
          typeof fns === "object" &&
          fns.constructor === Array &&
          fns.indexOf(f) < 0
        ) {
          fns.push(f);
        }
      }
    },
    setNotifiers = function(ev, flag) {
      fs_api.isFullscreen = function() {
        return !!document[flag];
      };
        document.addEventListener(
          ev,
          function() {
            var isFs = fs_api.isFullscreen();
            notify(isFs ? fs_api.__events.enter : fs_api.__events.exit, isFs);
            notify(fs_api.__events.toggle, isFs);
          },
          false
        );
    };

  if (element.requestFullscreen) {
    fs_api.enterFullscreen = function() {
      var attempts = 0,
        fallback = 50;
      var tryit = function() {
        element.requestFullscreen().catch(function(err) {
          if (attempts++ < 3) {
            fallback *= 2;
            setTimeout(tryit, fallback);
          }
        });
      };
      tryit();
    };
    setNotifiers("fullscreenchange", "fullscreen");
  } else if (element.msRequestFullscreen) {
    fs_api.enterFullscreen = function() {
      return element.msRequestFullscreen();
    };
    setNotifiers("msfullscreenchange", "msFullscreenElement");
  } else if (element.mozRequestFullScreen) {
    fs_api.enterFullscreen = function() {
      return element.mozRequestFullScreen();
    };
    setNotifiers("mozfullscreenchange", "mozFullScreen");
  } else if (element.webkitRequestFullscreen) {
    fs_api.enterFullscreen = function() {
      return element.webkitRequestFullscreen();
    };
    setNotifiers("webkitfullscreenchange", "webkitIsFullScreen");
  } else {
    fs_api.enterFullscreen = console.log.bind(
      console,
      "Fullscreen API is not supported"
    );
    fs_api.exitFullscreen = fs_api.enterFullscreen;
  }
  if (typeof cb === "function") cb(fs_api);
  return fs_api;
}
