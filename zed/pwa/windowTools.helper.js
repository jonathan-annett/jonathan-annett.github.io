/*global self,localforage*/
(function(L,o,a,d){let u,n=a[L]&&a[L].name,x=n&&o[n]===u?Object.defineProperty(o,n,{value:a[L].apply(this,d[L]),enumerable:!0,configurable:!0}):u;})(typeof self==="object"&&self.constructor.name||"x",self,
  { 
      Window : function wToolsLib() {
        const On="addEventListener";
        const Off="removeEventListener";
        var cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);

        const w=window;
        
        var positionKey;             
        var positionReplyKey;        
        var reportPositionKey;       
        var reportPositionReplyKey;
        
        var closeKey;                
        var closedKey;  
        var moveTrackingKey;        
        var moveTrackingUpdateKey;
        
        var setWindowStateKey;
        var getWindowStateKey;
        
        var dbStorageKeyPrefix,dbStorageKeyPrefixLength;

        setWid(w.wid || windowId() );

        const win_moveTo      = 0;
        const win_resizeTo    = 1;   
        const minimizedHeight = 30;
        const minimizedWidth  = 130;
        const minimizedLeft   = screen.availWidth-minimizedWidth;
        const minimizedTop    = screen.availHeight-minimizedHeight;
        
        
        const maximizedHeight = screen.availHeight-4;
        const maximizedWidth  = screen.availWidth-4;
        const maximizedLeft   = 2;
        const maximizedTop    = 2;
        
        const maximizedPosition = [
            [ win_moveTo,    [ maximizedLeft,  maximizedTop ]   ],
            [ win_resizeTo,  [ maximizedWidth, maximizedHeight ]  ]
        ];
        
        const maximizedPositionJSON = JSON.stringify(maximizedPosition);
        
        const minimizedPosition = [
            
            [ win_moveTo,    [ minimizedLeft,minimizedTop ]   ],
            [ win_resizeTo,  [ minimizedWidth, minimizedHeight ]  ]
            
        ];
        const minimizedPositionJSON = JSON.stringify(minimizedPosition);

        const libEvents = {
            
            move       : [],
            size       : [],
            minimized  : [],
            maximized  : [],
            restored   : [],
            fullscreen : [],
            closed     : [],
            state      : []
        };
        const Hysteresis={};   
        
        var lib = {
            setPrimary              : setPrimary,
            win_moveTo              : win_moveTo,
            win_resizeTo            : win_resizeTo,
            fs_api                  : w.fs_api,
            stringifyWindowPosition : stringifyWindowPosition,
            parseWindowPosition     : parseWindowPosition,
            windowId                : windowId,
            on                      : addLibEvent,
            off                     : removeLibEvent,
            param                   : getUrlParam,
            
            
            dbEngine                : dbEngine,
            
            
            consts : {
                
                win_moveTo              : win_moveTo,
                win_resizeTo            : win_resizeTo,
                minimizedHeight         : minimizedHeight,
                minimizedWidth          : minimizedWidth,
                minimizedLeft           : minimizedLeft,
                minimizedTop            : minimizedTop,
                maximizedHeight         : maximizedHeight,
                maximizedWidth          : maximizedWidth,
                maximizedLeft           : maximizedLeft,
                maximizedTop            : maximizedTop,
            
                maximizedPosition       : maximizedPosition,
                minimizedPosition       : minimizedPosition,
                
                maximizedPositionJSON   : maximizedPositionJSON,
                minimizedPositionJSON   : minimizedPositionJSON,
            },
            storageKeys : {},
            windowState : {
                
            },
            
            
            restoreStateStack : []
        };

        const {
            setForageKey   ,
            getForageKey   ,
            removeForageKey   ,
            getForageKeys     ,
            setLocalKey       ,
            getLocalKey       ,
            removeLocalKey    ,
            getLocalKeys      ,
            getDB   ,
            setDB 

        } = dbEngine(filterLocalKeys,convertStorageToLocalKey,convertLocalToStorageKey);

        
        Object.defineProperties(lib,{
             wid : {
                 get : getWid,
                 set : setWid,
                 enumerable : true
             },
             urlParams : {
                 get : getUrlVars,
                 enumerable : true
             },
             getKeys :  {
                 value : typeof localforage==='undefined' ? getLocalKeys : getForageKeys,
                 writable    : false,
                 enumerable  : true,
                 configurage :true,
             },
             getKey :  {
                 value : typeof localforage==='undefined' ? getLocalKey : getForageKey,
                 writable    : false,
                 enumerable  : true,
                 configurage :true,
             },
             setKey :  {
                 value : typeof localforage==='undefined' ? setLocalKey : setForageKey,
                 writable    : false,
                 enumerable  : true,
                 configurage :true,
             },
             
             removeKey : {
                 value       : typeof localforage==='undefined' ? removeLocalKey : removeForageKey,
                 writable    : false,
                 enumerable  : true,
                 configurage :true,
             },
             getDB :  {
                 value       : getDB,
                 writable    : false,
                 enumerable  : true,
                 configurage :true,
             },
             setDB : {
                 value       : setDB,
                 writable    : false,
                 enumerable  : true,
                 configurage : true,
             },
             
             close : {
                value       : w.close.bind(w),
                writable    : false,
                enumerable  : true,
                configurage : true,                 
                 
             }
        });
        
        Object.defineProperties(lib.storageKeys,{
            positionKey             : { get : function () {return positionKey;},            enumerable : true},
            positionReplyKey        : { get : function () {return positionReplyKey;},       enumerable : true},
            reportPositionKey       : { get : function () {return reportPositionKey;},      enumerable : true},
            reportPositionReplyKey  : { get : function () {return reportPositionReplyKey;}, enumerable : true},
            closeKey                : { get : function () {return closeKey;},               enumerable : true},
            closedKey               : { get : function () {return closedKey;},              enumerable : true},
            
            moveTrackingKey         : { get : function () {return moveTrackingKey;},        enumerable : true},
            moveTrackingUpdateKey   : { get : function () {return moveTrackingUpdateKey;},  enumerable : true},
            
            setWindowStateKey       : { get : function () {return setWindowStateKey;},      enumerable : true},
            getWindowStateKey       : { get : function () {return getWindowStateKey;},     enumerable : true},
        
            dbStorageKeyPrefix      : { get : function () {return dbStorageKeyPrefix;},     enumerable : true},

        });
        
        Object.defineProperties(lib.windowState,{
             maximized : {
                 get        : getIsMaximized,
                 set        : setIsMaximized,
                 enumerable : true
             },
             minimized : {
                 get        : getIsMinimized,
                 set        : setIsMinimized,
                 enumerable : true
             },
             
             fullscreen : {
                 
                 get        : getIsFullscreen,
                 set        : setIsFullscreen,
                 enumerable : true
             },
             
             position : {
                 get        : stringifyWindowPosition,
                 set        : parseWindowPosition,
                 enumerable : false
             },
             state  : {
                 get        : getWindowState ,
                 set        : setWindowState,       
                 enumerable : false
             },
             
            verboseState  : {
                 get        : getVerobseState,
                 set        : setVerobseState,
                 enumerable : false
            }
        });
        
       
        
        var remove_move_emitter = on_window_move (function () {
            emitLibEventwithHysteresis(100,'move',[w.screenX,w.screenY]);
        });
        
        var remove_size_emitter = on_window_size (function () {
            emitLibEventwithHysteresis(500,'size',[w.outerWidth,w.outerHeight]);
        });
        
         w[On]('storage',      storageEvent);
         w[On]('beforeunload', beforeunloadEvent);
         w.fs_api = makeFullScreenApi(w.document.body);

        return lib;
            
        // add a handler for THIS window - move,size,minimized,maximized, restored, fulscreen(true/false),state, closed
        function addLibEvent (e,fn) {
            if (typeof e==='string'+typeof fn==='stringfunction') {
                const fns = libEvents[e];
                if (Array.isArray(fns)) {
                    if ( fns.indexOf(fn) < 0 ) {
                        fns.push(fn);
                    }
                }
            }
        }
        
        // remove previously added handler for THIS window
        function removeLibEvent (e,fn) {
           if (typeof e==='string'+typeof fn==='stringfunction') {
               const fns = libEvents[e];
               if (Array.isArray(fns)) {
                   const ix = fns.indexOf(fn);
                   if (ix >=0 ) {
                      fns.splice(ix,1);
                   }
               }
           }
        }
        
        // emit an event for this window
        function emitLibEvent (e) {
            if (typeof e==='string') {
                const fns = libEvents[e], args = cpArgs(arguments,1);
                if (Array.isArray(fns)) {
                    fns.forEach(function(fn) {
                        fn.apply(this,args);
                    });
                }
            }
        }
        
        // emit an event for this window, after h msec (replaces any pending events issued via emitLibEventwithHysteresis() for "e")
        function emitLibEventwithHysteresis (h,e) {
            if (typeof e==='string') {
                const fns = libEvents[e];
                if (Array.isArray(fns)) {
                    
                    if (Hysteresis[e]) {
                        clearTimeout(Hysteresis[e]);
                    }
                    const args = cpArgs(arguments,2);
                    Hysteresis[e] = setTimeout(
                      function () {
                          delete Hysteresis[e];
                          fns.forEach(function(fn) {
                              fn.apply(this,args);
                          });
                      },h);
                }
            }
        }
            
        // setWid() used to assign a new window id (also updates the storageKeys for this window (it's the getter for lib.wid)
        function setWid(id) {
            w.wid=id;
            positionKey             = "windowTools.cmd."+id+".position";
            positionReplyKey        = "windowTools.cmd."+id+".position.reply";
            reportPositionKey       = "windowTools.cmd."+id+".reportPosition";
            reportPositionReplyKey  = "windowTools.cmd."+id+".reportPosition.reply";
            closeKey                = "windowTools.cmd."+id+".close";
            closedKey               = "windowTools.cmd."+id+".closed";
            moveTrackingKey         = "windowTools.cmd."+id+".position.tracking";
            moveTrackingUpdateKey   = "windowTools.cmd."+id+".position.tracking.update";
            
            setWindowStateKey       = "windowTools.cmd."+id+".position.tracking.state";
            getWindowStateKey       = "windowTools.cmd."+id+".position.tracking.getState";
            
            dbStorageKeyPrefix      = "windowTools.cmd."+id+".db.kvStore.";
            dbStorageKeyPrefixLength = dbStorageKeyPrefix.length;
            
        }
         
        // getWid() returns the  value assigned to window.wid (it's the setter for lib.wid)
        function getWid() {
            return w.wid;
        }
        
        // returns getIsMaximized() true/false indicating if this window is currently maximized (getter for lib.windowState.maximized)
        function getIsMaximized() { 
            return w.screenX===maximizedLeft&&
                   w.screenY===maximizedTop&&
                   w.outerWidth===maximizedWidth&&
                   w.outerHeight===maximizedHeight;
        }
        
        // setIsMaximized(true/false) lets you maximize/restore the window
        function setIsMaximized(v) {
           
            if (typeof v==="boolean") {
                const isTracking=!!localStorage.getItem(moveTrackingKey);
                if (v) {
                    if (!getIsMaximized()){
                        lib.restoreStateStack.push( lib.windowState.position );
                        lib.windowState.position = maximizedPositionJSON; 
                        emitLibEvent('maximized');
                        
                    }
                    if ( isTracking ) {
                        localStorage.setItem(setWindowStateKey,'maximized');
                    }
                } else {
                    let emit=false;
                    while (getIsMaximized()) {
                        const json = lib.restoreStateStack.pop();
                        if (typeof json==='string') {
                            emit=true;
                            lib.windowState.position = json;
                        } else {
                            break;
                        }
                    }
                    if (emit) emitLibEvent('restored');
                    
                    if ( isTracking) {
                        localStorage.setItem(setWindowStateKey,'normal');
                    }
                }
            } else {
                throw new Error ("maximized should be boolean");
            }
        }
        
        // getIsMinimized() returns true/false indicating if this window is currently minimized (getter for lib.windowState.minimized)
        function getIsMinimized() {
            return w.screenX===minimizedLeft&&
                   w.screenY===minimizedTop&&
                   w.outerWidth===minimizedWidth&&
                   w.outerHeight===minimizedHeight;
        }
        
        // setIsMinimized(true/false) lets you minimize/restore the window
        function setIsMinimized(v) {
            if (typeof v==="boolean") {
                const isTracking=!!localStorage.getItem(moveTrackingKey);
               if (v) {
                   if (!getIsMinimized()){
                       lib.restoreStateStack.push( lib.windowState.position );
                       lib.windowState.position = minimizedPositionJSON ; 
                       emitLibEvent('minimized');
                   }
                   if ( isTracking ) {
                       localStorage.setItem(setWindowStateKey,'minimized');
                   }
               } else {
                   let emit=false;
                   while (getIsMinimized()) {
                       
                       const json = lib.restoreStateStack.pop();
                       if (typeof json==='string') {
                           emit=true;
                           lib.windowState.position = json;
                       } else {
                           break;
                       }
                   }
                   if (emit) emitLibEvent('restored');
                   if ( isTracking ) {
                       localStorage.setItem(setWindowStateKey,'normal');
                   }
               } 
            } else {
                throw new Error ("minimized should be boolean");
            }
        }
        
        
        // getIsFullscreen() returns true/false indicating if this window is currently fullscreen (getter for lib.windowState.fullscreen)
        function getIsFullscreen (){
            return w.fs_api.isFullscreen();
        }
        
        // setIsFullscreen(true/false) lets you enter/exit fullscreen
        function setIsFullscreen (v){
            if (typeof v==="boolean") {
               const isTracking=!!localStorage.getItem(moveTrackingKey);
               if (v) {
                   if (!w.fs_api.isFullscreen()){
                       w.fs_api.enterFullscreen();
                       emitLibEvent('fullscreen',true);
                   }
                   if ( isTracking ) {
                       localStorage.setItem(setWindowStateKey,'fullscreen');
                   }
               } else {
                   if (w.fs_api.isFullscreen()){
                       w.fs_api.exitFullscreen();
                       emitLibEvent('fullscreen',false);
                   }
                   if ( isTracking ) {
                       localStorage.setItem(setWindowStateKey,lib.windowState.state);
                   }
               } 
            } else {
                throw new Error ("fullscreen should be boolean");
            }
        }
        
        // getWindowState() returns a string indicating window state
        function getWindowState() { 
               return getIsFullscreen() ? 'fullscreen' :
                      getIsMaximized()  ? 'maximized'  : 
                      getIsMinimized()  ? 'minimized'  : 
                                          'normal'; 
        }
        
        
        // getWindowState() takes a string to set window state
        function setWindowState(v) {
            if (typeof v === 'string') {
                switch (v) {
                    case "fullscreen" : 
                        if (getIsMaximized()) setIsMaximized(false);
                        if (getIsMinimized()) setIsMinimized(false);
                        return  setIsFullscreen(true);
                   case "maximized" : 
                       if (getIsFullscreen()) setIsFullscreen(false);
                       if (getIsMinimized()) setIsMinimized(false);
                       return  setIsMaximized(true);
                   case "minimized" : 
                       if (getIsFullscreen()) setIsFullscreen(false);
                       if (getIsMaximized())  setIsMaximized(false);
                       return  setIsMinimized(true);
                   default:
                       if (getIsFullscreen()) setIsFullscreen(false);
                       if (getIsMaximized())  setIsMaximized(false);
                       if (getIsMinimized())  setIsMinimized(false);
                }
            } else {
                  throw new Error ("state should be string");  
            }
        }
        
        
        // getVerobseState() returns a string indicating window state with verbose info
        function getVerobseState () { 
            const restore =  
            
                (  lib.restoreStateStack.length>0) ? 
                       (function(X){ return " (restores to "+X[1][0]+"x"+X[1][1]+" @ "+X[2][0]+","+X[2][1]+")" })
                       (lib.restoreStateStack.slice(-1)[0]
                ) : '' ;
            
            if (getIsMaximized()) return "maximized"+restore;
            if (getIsMinimized()) return "minimized"+restore;
            
            return "normal ("+w.outerWidth+"x"+w.outerHeight+" @ "+w.screenX+","+w.screenY+")"; 
            
        }
        
        // setVerobseState() takes a string to set window state
        function setVerobseState(v) {
            
            if (typeof v === 'string') {
                   const isTracking=!!localStorage.getItem(moveTrackingKey);
                   if (["maximized","minimized","fullscreen"].some(function(state){
                       if (  v===state || v.replace(/\s/g,'').startsWith( state+"(" ) ){
                           lib.windowState.state = state;
                           return true;
                       }
                       
                   })) return ;
                   
                   if (v==="normal") {
                       lib.windowState.state = v;
                       return ;
                   }
                   
                   if ( v.replace(/\s/g,'').startsWith( "normal(" ) ){
                        const parts = v.split ('@').map(function(x,index){
                            const subparts = x.split('(')[1].split(')')[0].trim().split(index===0?"x":",");
                            
                            return [ Number.parseInt(subparts[0]),Number.parseInt(subparts[1]) ];
                        });
                        
                        const [ [width,height] , [left, top] ] = parts;
                        
                        if ( isNaN(width) || isNaN(height) || isNaN(left) || isNaN(top)) {
                            // ignore garbage co-ords
                            lib.windowState.state = "normal";
                            return;
                        }
                        
                        lib.windowState.position = JSON.stringify([
                          [  win_moveTo,   [ maximizedLeft,maximizedTop ] ],
                          [  win_resizeTo, [ width,height ]   ],
                          [  win_moveTo,   [ left,top ]       ],  
                        ]);
                        
                        if ( isTracking ) {
                            localStorage.setItem(setWindowStateKey,lib.windowState.state);
                        }
                       
                   }
                   
    
            } else {
                throw new Error ("verboseState should be string");  
    
            }
    
        }
            
        //storageEvent () is called by window.onstorage whenever storage changes
        function storageEvent (){
            
            if (w.wid) {
                const positionArgs   = localStorage.getItem(positionKey);
                
                checkTracking(); 
        
                const position = stringifyWindowPosition (-2);
    
                if (positionArgs) {
                    parseWindowPosition(positionArgs);
                    localStorage.setItem(positionReplyKey,position);
                    localStorage.removeItem(positionKey);
                } else {
                    const reportPositionArgs = localStorage.getItem(reportPositionKey);
                    
                       
                    if (reportPositionArgs) {
                       localStorage.setItem(reportPositionReplyKey,position);
                       localStorage.removeItem(reportPositionKey);
                    } else {
                        const closeArgs = localStorage.getItem(closeKey);
                        if (closeArgs) {
                            beforeunloadEvent();
                            localStorage.removeItem(closeKey);
                            w.close();
                        }
                    }
                }
            }
        
        }
        
        // checkTracking() is called by storageEvent()
        function checkTracking(){
            if ( !!localStorage.getItem(moveTrackingKey) ) {
                addLibEvent('move',updatePositionTracking);
                addLibEvent('size',updatePositionTracking);
            } else {
                removeLibEvent('move',updatePositionTracking);
                removeLibEvent('size',updatePositionTracking);
            }
        }
        
        // updatePositionTracking() is an event called in delayed reaction to move (100 ms) and size (500 ms)
        function updatePositionTracking (){
            
          localStorage.setItem(
              moveTrackingUpdateKey,lib.windowState.position
          );
          
          localStorage.setItem(setWindowStateKey,lib.windowState.state);
          
        }
        
        //beforeunloadEvent () is called by window.onbefore before the window is closed
        function beforeunloadEvent(){
            w[Off]('storage',      storageEvent);
            w[Off]('beforeunload', beforeunloadEvent);
            
            remove_move_emitter();remove_move_emitter=function(){};
            remove_size_emitter();remove_size_emitter=function(){};
            emitLibEvent('closed');
            // dump all events, (alllowing garbage collection of functions)
            Object.keys(libEvents).forEach(function(e){
                const fns = libEvents[e];
                fns.splice(0,fns.length);
                delete libEvents[e];
            });
            
            if (!!localStorage.getItem(moveTrackingKey)) {
                localStorage.setItem(closedKey,stringifyWindowPosition(-2));
            }
        }
    
        //  stringifyWindowPosition() returns a JSON payload than can be passed into 
        //    parseWindowPosition() to restore the window location  
        
        function stringifyWindowPosition (sliceFrom) {
            const cmds = [
              [ win_moveTo,   [maximizedLeft,maximizedTop]   ],
              [ win_resizeTo, [w.outerWidth,w.outerHeight] ]
            ];
            if (!(w.screenX===maximizedLeft&&w.screenY===maximizedTop)) {
               cmds.push([ win_moveTo,  [w.screenX,w.screenY]  ]);
            }
            return JSON.stringify(cmds.slice(sliceFrom||0));
        }
    
        // parseWindowPosition() takes a JSON payload created by stringifyWindowPosition() 
        // it restores the window position to how it was when stringifyWindowPosition() was invoked
        function parseWindowPosition(json,capture){
            const 
            cmds =JSON.parse(json),
            fn=[w.moveTo,w.resizeTo],
            len=cmds.length;
            for(var i = 0; i < len; i++) {
                var x = cmds[i];
                if (capture) capture[ x[0] ] = x[1];
                fn[ x[0] ].apply(w,x[1]);
                x[1].splice(0,2);
                x.splice(0,2);
            }
        }
      
        // disables the local window tracking and returns lib
        // used by windowTools.js to get access to the common functions and constants
        function setPrimary () {
            beforeunloadEvent();
            return lib;
        } 
        
        
        // internal function to track window movements
        // returns a function that will remove the handler.
        function on_window_move(fn) {
             
              if (typeof fn === "function") {
               try {
                 
                 var
                 last_top=w.screenY,last_left=w.screenX,
                 interval = setInterval(check,500);
                 
                 w[On]("resize", check);
                 w[On]("focus", check);
                 w[On]("blur", check);
                
                 
                 w[On]("beforeunload",cancel);
                 return cancel;
                 
               } catch (err) {
                  
               }
             }
             
             function check(){
                 if(last_left != w.screenX || last_top != w.screenY){
                    last_left = w.screenX;
                    last_top = w.screenY; 
                    fn(last_left,last_top);
               }
             }
             
             function cancel(){
                if (interval) clearTimeout(interval);
                interval=undefined;
                w[Off]("resize", check);
                w[Off]("focus", check);
                w[Off]("blur", check);
                w[Off]("beforeunload",cancel);
             }
             
             
        }
        
        // internal function to track window resizing
        // returns a function that will remove the handler.
        function on_window_size(fn) {
            
            if (typeof fn === "function") {
               try {
                   w[On]("resize", wrap);
                   w[On]("beforeunload",cancel);
                   return cancel;
               } catch (err) {
                   console.log(err);
               }
             }  
             
             function wrap(){
                fn(w.outerWidth,w.outerHeight);
             }
             
             function cancel(){
                w[Off]("resize", wrap);
                w[Off]("beforeunload",cancel);
             }
             
        }
               
               
        // polyfillish function returns object with: isFullscreen() enterFullscreen() exitFullscreen() methods
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
        
        // makes a quasi-guid to id the window
        function windowId() {
            return[
             Math.random,
             function (){ return (windowId.last ? windowId.last + Math.random() : Math.random() ) },
             Math.random,
             Date.now,
             Math.random
            ].map(function(fn){
                return fn().toString(36).substr(-4);
            }).join('_');
        }
        
        
        // used to get param strings passed to this window
        function getUrlParam(parameter, defaultvalue){
            if(w.location.href.indexOf(parameter) > -1){
                var result,ignore=w.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                    if (!result&&key===parameter) {
                        result = value;
                    }
                });
                return result;
            }
            return defaultvalue;
        }
        
        // used to get all params passed to this window's url, as an object
        function getUrlVars() {
            var vars = {},ignore = w.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                vars[key] = value;
            });
            return vars;
        }
        
        //internal func intened to be passed to Array.prototype.filter
        function filterLocalKeys(k) {
            return k.startsWith(dbStorageKeyPrefix);
        }
        
        //internal func intened to be passed to Array.prototype.map
        function convertStorageToLocalKey(k) {
            return k.substr(dbStorageKeyPrefixLength);
        }
        
        //internal func intened to be passed to Array.prototype.map (or used as key for localStorage/localforage getItem etc)
        function convertLocalToStorageKey(k) {
            return dbStorageKeyPrefix+k;
        }
        

        
        function dbEngine(filterLocalKeys,convertStorageToLocalKey,convertLocalToStorageKey) {
            
            return {
                
                // localforage api changeout for wToolsLib.setKey(key,value,lib.setKey(key,value,function(err){...})
                setForageKey    : function setForageKey(key,value,cb) {
                                      localforage.setItem(convertLocalToStorageKey(key),encodeNulls(value))
                                      .then (function(){
                                          cb();
                                      }).catch(cb);
                                  },
                
                // localforage api changeout for wToolsLib.getKey(key,defaultValue,function(err,value){...})
                getForageKey    : function getForageKey(key,defaultValue,cb) {
                                      localforage.getItem(convertLocalToStorageKey(key))
                                      .then (function(value){
                                          if (value===null) {
                                             cb(new Error ("key "+key+" not found"));
                                          } else {
                                             cb(undefined,decodeNulls(value));
                                          }
                                      }).catch(cb);
                                  },
                
                // localforage api changeout for wToolsLib.removeKey(key,function(err,existed){...})
                removeForageKey : function removeForageKey(key,cb) {
                                      try {
                                          const skey = convertLocalToStorageKey(key);
                                          
                                          localforage.getItem(skey).then (function(value){
                                              
                                              const existed=value!==null;
                                              
                                              if (existed) {
                                                  
                                                 localforage.removeItem(skey).then(function(){
                                                     
                                                    cb(undefined,true);
                                                        
                                                 }).catch(cb);
                                                    
                                              } else {
                                                  
                                                 cb(undefined,false);
                                                 
                                              }
                              
                                                 
                                          }).catch(cb);
                                          
                                      } catch (e) {
                                          cb(e);
                                      }
                                  },
                
                // localforage api changeout for wToolsLib.getKeys(function(err,keys){...})
                getForageKeys   : function getForageKeys(cb) {
                                      localforage.keys().then(function(keys){
                                         cb(undefined,keys.filter(filterLocalKeys).map(convertStorageToLocalKey) );
                                      }).catch(cb);
                                  },
                
                // localStorage api changeout for wToolsLib.setKey(key,value,function(err){...})
                setLocalKey    : function setLocalKey(key,value,cb) {
                                     try {
                                         const json = JSON.stringify(encodeNulls(value));
                                         localStorage.setItem(convertLocalToStorageKey(key),json);
                                         cb();
                                     } catch (e) {
                                         cb(e);//most likely a circular value
                                     }
                                 },
                   
                // localStorage api changeout for wToolsLib.getKey(key,defaultValue,function(err,value){...})              
                getLocalKey    : function getLocalKey(key,defaultValue,cb) {
                                     const json = localStorage.getItem(convertLocalToStorageKey(key));
                                     if (json) {
                                         try {
                                            cb(undefined,decodeNulls(JSON.parse(json)));
                                         } catch (e) {
                                            cb(e);
                                         }
                                     } else {
                                         cb(new Error ("key "+key+" not found"));
                                     }
                                 },
                                 
                // localStorage api changeout for wToolsLib.removeKey(key,function(err,existed){...})                 
                removeLocalKey : function removeLocalKey(key,cb) {
                                     try {
                             
                                         const skey = convertLocalToStorageKey(key);
                                         const existed = !! localStorage.getItem(skey);
                                         if (existed) {
                                            localStorage.removeItem(skey);
                                         }
                                         cb(undefined,existed);
                                         
                                     } catch (e) {
                                         cb(e);
                                     }
                                 },
                                 
                // localStorage api changeout for wToolsLib.getKeys(function(err,keys){...})                 
                getLocalKeys   : function getLocalKeys(cb) {
                                     try {
                                         cb(undefined,Object.keys(localStorage).filter(filterLocalKeys).map(convertStorageToLocalKey));
                                     } catch (e) {
                                        cb(e);  
                                     }
                                 },
                
                // handler for wToolsLib.getDB(function(err,db){...})
                getDB : function getDB (cb) {
                            
                            if (typeof cb==='function') {
                                
                                const db = {};
                                
                                lib.getKeys(function(keys){
                    
                                   let outstanding = keys.length;
                                   if (outstanding===0) {
                                       return cb(undefined,db);
                                   }
                                   
                                   let done=false,getter = function(k,cb) {
                                      // this forces the first iteration to by async, for localStorage
                                      // all others happen syncronously (means done will be true by the time iteration 0 executes)
                                      getter = lib.getKey;
                                      setTimeout(getter,0,k,cb);
                                   },abort_when_done=false;
                                   
                                   keys.some(function(key){
                                       if (!abort_when_done) {
                                           getter(key,function(key,err,value){
                                              if (err) {
                                                  abort_when_done=true;
                                                  cb (err);
                                                  return; 
                                              }
                                              outstanding--;
                                              db[key] = err ? undefined : value;
                                              if (done&& outstanding===0) {
                                                  abort_when_done = true;
                                                  cb(undefined,db);
                                              }
                                           });
                                       }
                                       return abort_when_done;
                                   }); 
                                   
                                   done=true;
                                });
                                
                            }
                            
                        },
                
                // handler for wToolsLib.setDB(db,function(err){...})
                setDB : function setDB (db,cb) {
                            
                              if (typeof db+ typeof cb==='objectfunction') {
                                  
                                  const setItems = Object.keys(db);
                                  const removeItems = [];
                                  
                                  lib.getKeys(function(existingKeys){
                                      
                                      existingKeys.forEach(function(key){
                                         if (setItems.indexOf(key)<0) 
                                            removeItems.push(key);
                                      });
                                      
                                      
                                  });
                                  
                                  let outstanding = setItems.length + removeItems.length;
                                  if (outstanding ===0) {
                                      return cb ();
                                  }
                                  
                                  let done=false,
                                  setter = function(k,v,cb) {
                                     setter = lib.setKey;
                                     setTimeout(setter,0,k,v,cb);
                                  },
                                  remover = function(k,cb) {
                                     remover = lib.removeKey;
                                     setTimeout(remover,0,k,cb);
                                  },
                                  abort_when_done=false,
                                  terminator = function(err){
                                       if (err) {
                                           cb (err);
                                           abort_when_done = true;
                                           return;
                                       }
                                       outstanding--;
                                       if (done&& outstanding===0) {
                                           abort_when_done = true;
                                           cb();
                                       }
                                  };
                                  
                                  setItems.some(function(key){
                                      setter(key,db[key],terminator);
                                      return abort_when_done;
                                  });
                                  
                                  removeItems.some(function(key){
                                      remover(key,terminator); 
                                      return abort_when_done;
                                  });
                                  
                                  done=true;
                              
                              }
                        },

            };
    
            // encode null and undefined to allow those values to be stored (nb this is not recursive)
            function encodeNulls(x) {
                if (x===undefined) {
                    //     undefined  <<< same number of bytes as "undefined"
                    return [[["U"]]];
                }
                if (x===undefined) {
                    //        null
                    return [[["N"]]];
                }
                return x;
            }
            
            // decode values encoded by encodeNulls()
            function decodeNulls(x) {
                if (Array.isArray(x) && x.length===1) {
                    let xx = x[0];
                    if (Array.isArray(xx) && xx.length===1) {
                        let xxx = xx[0];
                        if (Array.isArray(xxx) && xxx.length===1 && xxx[0]==='U') {
                            return;
                        }
                        if (Array.isArray(xxx) && xxx.length===1 && xxx[0]==='N') {
                            return null;
                        }
                    }
                }
                return x;
            }
            
            
       
            
            
        }
    
        

    },
      
 
      ServiceWorkerGlobalScope : function wToolsLib() {
          const lib = {}
          
          
          
          return lib;
      },
      
  },
  {
      Window : [],
      ServiceWorkerGlobalScope : [],
  }
);


