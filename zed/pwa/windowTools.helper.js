/*global self,localforage, ml*/
/*global multiLoad,__ml1,__ml2,__ml3,__ml4*/
//multiLoad(__ml1(),[],function(){__ml2(__ml3(),__ml4(),
ml(0,ml(1),['libEvents|/zed/pwa/events.js'],function(){ml(2,ml(3),ml(4),

  { 
      Window : function wToolsLib(events) {
        const cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);
        objectSetterHelpers();
        const On="addEventListener";
        const Off="removeEventListener";

        //const w=window;
        
        const keynames_  = "positionKey,positionReplyKey,reportPositionKey,reportPositionReplyKey,closeKey,closedKey,moveTrackingKey,moveTrackingUpdateKey,setWindowStateKey,getWindowStateKey,dbStorageKeyPrefix,dbStorageKeyPrefixLength,ping"; 
        const keynames=keynames_.split(",");
        
        setWid(window.wid || createWindowId() );

        const win_moveTo      = 0;
        const win_resizeTo    = 1;   
        const minimizedHeight = 30;
        const minimizedWidth  = 130;
        const minimizedLeft   = screen.availWidth  - minimizedWidth;
        const minimizedTop    = screen.availHeight - minimizedHeight;
        
        
        const maximizedHeight = screen.availHeight-4;
        const maximizedWidth  = screen.availWidth-4;
        const maximizedLeft   = 2;
        const maximizedTop    = 2;
        
        const maximizedPosition = [
            [ win_moveTo,    [ maximizedLeft,  maximizedTop ]     ],
            [ win_resizeTo,  [ maximizedWidth, maximizedHeight ]  ]
        ];

        const minimizedPosition = [
            [ win_moveTo,    [ minimizedLeft,minimizedTop ]   ],
            [ win_resizeTo,  [ minimizedWidth, minimizedHeight ]  ]
        ];
        
        var lib = {  };
        
        const {
            addLibEvent,
            removeLibEvent,           
            emitLibEvent,               
            emitLibEventwithHysteresis,
            removeAllEventTypes,
        } = events (lib,["maximized","minimized","restored","fullscreen","closed"]);

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
            
             api                 : readOnlyGetter(getApi.bind(this,lib,"api")),
             fs_api              : readOnlyValue(makeFullScreenApi(window.document.body)),
             wid                 : readWriteGetSetter(getWid,setWid),
             consts              : readOnlyGetter(getConsts.bind(this,lib,'consts')),
             storageKeys         : readOnlyGetter(getStorageKeys.bind(this,createKeyNames.bind(this,window.wid),lib,'storageKeys')),
             param               : readOnlyValue(getUrlParam.bind(this,window.location.href)),
             urlParams           : readOnlyGetter(getUrlVars.bind(this,window.location.href,lib,'urlParams')), 
             restoreStateStack   : readOnlyValue([]),
             windowState         : readOnlyGetter(getWindowState.bind(this,lib,'windowState')),
             
             
             
             on                  : readOnlyValue(addLibEvent),
             off                 : readOnlyValue(removeLibEvent),
             addEventListener    : readOnlyValue(addLibEvent),
             removeEventListener : readOnlyValue(removeLibEvent),
             
             getKeys             : readOnlyValue(typeof localforage==='undefined' ? getLocalKeys   : getForageKeys),
             getKey              : readOnlyValue(typeof localforage==='undefined' ? getLocalKey    : getForageKey),
             setKey              : readOnlyValue(typeof localforage==='undefined' ? setLocalKey    : setForageKey),
             removeKey           : readOnlyValue(typeof localforage==='undefined' ? removeLocalKey : removeForageKey),
             
             getDB               : readOnlyValue(getDB),
             setDB               : readOnlyValue(setDB),
             
             close               : readOnlyValue(window.close.bind(window)),
             
             ping                : readOnlyValue(doPing),
             
        });
        
        var remove_move_emitter = on_window_move (window,function () {
            emitLibEventwithHysteresis(100,'move',[window.screenX,window.screenY]);
        });
        
        var remove_size_emitter = on_window_size (window,function () {
            emitLibEventwithHysteresis(500,'size',[window.outerWidth,window.outerHeight]);
        });
        
         window[On]('storage',      storageEvent);
         window[On]('beforeunload', beforeunloadEvent);
         

        return lib;
        
        
        // setWid() assigns a new id for this window
        function setWid(id) {
            window.wid=id;
            setStorageKeyNamesForWid(id);
        }
         
        // getWid() returns the  value assigned to window.wid (it's the setter for lib.wid)
        function getWid() {
            return window.wid;
        }
        
        function setWid_returns (retval,returnKeys) {
            switch (typeof returnKeys) {
                
                case 'function' : return returnKeys(retval);
                
                case 'object': 
                    
                    if (Array.isArray(returnKeys)) {
                        
                       returnKeys.forEach(function(el,index) {
                           returnKeys[index]=retval[el];
                       });
                       
                       keynames.forEach(function(k){ delete retval[k]; });
                       
                    } else {
                        
                       keynames.forEach(function(k){ 
                           returnKeys[k]= retval[k];
                           delete retval[k]; 
                       });
                       
                    }
                return returnKeys;
            }
            return retval;
        }
        
        function createKeyNames (id,inside,named) {
            const keyPrefix = "windowTools@"+id+".";
            const sks = {};
            keynames.forEach(function (k) {
               sks.__readOnlyValue(k,keyPrefix+k);
            });
            return cloneReadOnly(sks,inside,named);
        }
        
        function setStorageKeyNamesForWid(id,returnKeys) {
            const retval = createKeyNames(id);
            return returnKeys ? setWid_returns (retval,returnKeys) : undefined;
        }

        
        // returns getIsMaximized() true/false indicating if this window is currently maximized (getter for lib.windowState.maximized)
        function getIsMaximized() { 
            return window.screenX===maximizedLeft&&
                   window.screenY===maximizedTop&&
                   window.outerWidth===maximizedWidth&&
                   window.outerHeight===maximizedHeight;
        }
        
        // setIsMaximized(true/false) lets you maximize/restore the window
        function setIsMaximized(v) {
           
            if (typeof v==="boolean") {
                const k=lib.storageKeys;
                const isTracking=!!localStorage.getItem(k.moveTrackingKey);
                if (v) {
                    if (!getIsMaximized()){
                        lib.restoreStateStack.push( lib.windowState.position );
                        lib.windowState.position = maximizedPosition; 
                        emitLibEvent('maximized');
                        
                    }
                    if ( isTracking ) {
                        localStorage.setItem(k.setWindowStateKey,'maximized');
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
                        localStorage.setItem(k.setWindowStateKey,'normal');
                    }
                }
            } else {
                throw new Error ("maximized should be boolean");
            }
        }
        
        // getIsMinimized() returns true/false indicating if this window is currently minimized (getter for lib.windowState.minimized)
        function getIsMinimized() {
            return window.screenX===minimizedLeft&&
                   window.screenY===minimizedTop&&
                   window.outerWidth===minimizedWidth&&
                   window.outerHeight===minimizedHeight;
        }
        
        // setIsMinimized(true/false) lets you minimize/restore the window
        function setIsMinimized(v) {
            if (typeof v==="boolean") {
                const k=lib.storageKeys,setWindowStateKey=k.setWindowStateKey ;
                
                const isTracking=!!localStorage.getItem(k.moveTrackingKey);
               if (v) {
                   if (!getIsMinimized()){
                       lib.restoreStateStack.push( lib.windowState.position );
                       lib.windowState.position = minimizedPosition ; 
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
            return window.fs_api.isFullscreen();
        }
        
        // setIsFullscreen(true/false) lets you enter/exit fullscreen
        function setIsFullscreen (v){
            if (typeof v==="boolean") {
               const k=lib.storageKeys,setWindowStateKey=k.setWindowStateKey ;
                
               const isTracking=!!localStorage.getItem(k.moveTrackingKey);
               if (v) {
                   if (!window.fs_api.isFullscreen()){
                       window.fs_api.enterFullscreen();
                       emitLibEvent('fullscreen',true);
                   }
                   if ( isTracking ) {
                       localStorage.setItem(setWindowStateKey,'fullscreen');
                   }
               } else {
                   if (window.fs_api.isFullscreen()){
                       window.fs_api.exitFullscreen();
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
        
        // getState() returns a string indicating window state
        function getState() { 
               return getIsFullscreen() ? 'fullscreen' :
                      getIsMaximized()  ? 'maximized'  : 
                      getIsMinimized()  ? 'minimized'  : 
                                          'normal'; 
        }
        
            // getState() takes a string to set window state
        function setState(v) {
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
        
        
        
        function doPing (cb) {
            if (typeof cb!=='function' || window.closed) return;
            setTimeout(cb,1,!window.closed);
        }
        
        
       

        
        
        // getVerboseState() returns a string indicating window state with verbose info
        function getVerboseState () { 
            const restore =  
            
                (  lib.restoreStateStack.length>0) ? 
                       (function(X){ return " (restores to "+X[1][0]+"x"+X[1][1]+" @ "+X[2][0]+","+X[2][1]+")" })
                       (lib.restoreStateStack.slice(-1)[0]
                ) : '' ;
            
            if (getIsMaximized()) return "maximized"+restore;
            if (getIsMinimized()) return "minimized"+restore;
            
            return "normal ("+window.outerWidth+"x"+window.outerHeight+" @ "+window.screenX+","+window.screenY+")"; 
            
        }
        
        // setVerboseState() takes a string to set window state
        function setVerboseState(v) {
            
            if (typeof v === 'string') {
                   const k=lib.storageKeys,setWindowStateKey=k.setWindowStateKey ;
                   const isTracking=!!localStorage.getItem(k.moveTrackingKey);
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
                        
                        lib.windowState.position = [
                          [  win_moveTo,   [ maximizedLeft,maximizedTop ] ],
                          [  win_resizeTo, [ width,height ]   ],
                          [  win_moveTo,   [ left,top ]       ],  
                        ];
                        
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
            
            if (window.wid) {
                const k=lib.storageKeys,
                    positionKey=k.positionKey,
                    closeKey=k.closeKey,
                    reportPositionKey=k.reportPositionKey,
                    ping=k.ping;
                const positionArgs   = localStorage.getItem(positionKey);
                
                checkTracking(); 
        
                const position = serializeWindowPosition (window,-2);
    
                if (positionArgs) {
                    parseWindowPosition(window,positionArgs);
                    localStorage.setItem(k.positionReplyKey,position);
                    localStorage.removeItem(positionKey);
                } else {
                    const reportPositionArgs = localStorage.getItem(reportPositionKey);
                    
                       
                    if (reportPositionArgs) {
                       localStorage.setItem(k.reportPositionReplyKey,position);
                       localStorage.removeItem(reportPositionKey);
                    } else {
                        const closeArgs = localStorage.getItem(closeKey);
                        if (closeArgs) {
                            beforeunloadEvent();
                            localStorage.removeItem(closeKey);
                            window.close();
                        }  else {
                             const pingArgs = localStorage.getItem(ping);
                             if (pingArgs) {
                                 localStorage.removeItem(ping);
                             }
                         }
                    }
                }
            }
        
        }
        
        // checkTracking() is called by storageEvent()
        function checkTracking(){
            if ( !!localStorage.getItem(lib.storageKeys.moveTrackingKey) ) {
                addLibEvent('move',updatePositionTracking);
                addLibEvent('size',updatePositionTracking);
            } else {
                removeLibEvent('move',updatePositionTracking);
                removeLibEvent('size',updatePositionTracking);
            }
        }
        
        // updatePositionTracking() is an event called in delayed reaction to move (100 ms) and size (500 ms)
        function updatePositionTracking (){
          const k = lib.storageKeys;
          localStorage.setItem(
              k.moveTrackingUpdateKey,lib.windowState.position
          );
          
          localStorage.setItem(k.setWindowStateKey,lib.windowState.state);
          
        }
        
        //beforeunloadEvent () is called by window.onbefore before the window is closed
        function beforeunloadEvent(){
            window[Off]('storage',      storageEvent);
            window[Off]('beforeunload', beforeunloadEvent);
            
            remove_move_emitter();remove_move_emitter=function(){};
            remove_size_emitter();remove_size_emitter=function(){};
            emitLibEvent('closed');
            // dump all events, (alllowing garbage collection of functions)
            
            
            removeAllEventTypes();
            
            const k = lib.storageKeys;
            if (!!localStorage.getItem(k.moveTrackingKey)) {
                localStorage.setItem(k.closedKey,serializeWindowPosition(window,-2));
            }
        }
    
        //  serializeWindowPosition() returns a JSON payload than can be passed into 
        //    parseWindowPosition() to restore the window location  
        
        function serializeWindowPosition (w,sliceFrom) {
            sliceFrom=sliceFrom||0;
            const cmds = [
              [ win_moveTo,   [maximizedLeft,maximizedTop]   ],
              [ win_resizeTo, [w.outerWidth,w.outerHeight] ]
            ];
            if (!(w.screenX===maximizedLeft&&w.screenY===maximizedTop)) {
               cmds.push([ win_moveTo,  [w.screenX,w.screenY]  ]);
            }
            return sliceFrom===0?cmds:cmds.slice(sliceFrom);
        }
    
        // parseWindowPosition() takes a JSON payload created by serializeWindowPosition() 
        // it restores the window position to how it was when serializeWindowPosition() was invoked
        function parseWindowPosition(w,cmds,capture){
            const 
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
        function on_window_move(w,fn) {
             
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
        function on_window_size(w,fn) {
            
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
        function createWindowId() {
            return[
             Math.random,
             function (){ return (createWindowId.last ? createWindowId.last + Math.random() : Math.random() ) },
             Math.random,
             Date.now,
             Math.random
            ].map(function(fn){
                return fn().toString(36).substr(-4);
            }).join('_');
        }
        
        // read only object property swizzler
        function cloneReadOnly(obj,inside,named,props) {
            if (typeof obj+typeof props==='objectobject') {
                Object.defineProperties(obj,props);
            }
            if (typeof obj+typeof inside+typeof named ==='objectobjectfunction') {
                
                try {
                    inside.__readOnlyValue(named,obj);
                } catch(e) {
                    
                }
            }
            return obj;
        }
        
        // used to get param strings passed to this window
        function getUrlParam(href,parameter, defaultvalue){
            if(href.indexOf(parameter) > -1){
                var result,ignore=href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                    if (!result&&key===parameter) {
                        result = value;
                    }
                });
                return result;
            }
            return defaultvalue;
        }
        
        // used to get all params passed to this window's url, as an object
        function getUrlVars(href,inside,named) {
            const props = {},ignore = href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                props[key]=readOnlyValue(decodeURIComponent(value));
            });
            return cloneReadOnly({},inside,named,props);
        }
        
        //internal func intened to be passed to Array.prototype.filter
        function filterLocalKeys(k) {
            return k.startsWith(lib.storageKeys.dbStorageKeyPrefix);
        }
        
        //internal func intened to be passed to Array.prototype.map
        function convertStorageToLocalKey(k) {
            return k.substr(lib.storageKeys.dbStorageKeyPrefixLength);
        }
        
        //internal func intened to be passed to Array.prototype.map (or used as key for localStorage/localforage getItem etc)
        function convertLocalToStorageKey(k) {
            return lib.storageKeys.dbStorageKeyPrefix+k;
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
        
        function readOnlyValue(v) {
            return {
                        value        : v,
                        writable     : false,
                        enumerable   : true,
                        configurable : true,
            };
        }
            
        function readOnlyGetter(getter) {
            return {
                        get          : getter,
                        enumerable   : true,
                        configurable : true,
            };
        }
    
        function readWriteGetSetter(getter,setter) {
            return {
                        get          : getter,
                        set          : setter,
                        enumerable   : true,
                        configurable : true,
            };
        } 
        
        function objectSetterHelpers() {
            if (!Object.prototype.__readOnlyValue)
              Object.defineProperty(Object.prototype,'__readOnlyValue',{value : 
        
                    function(k,v){
                        delete this[k];
                        Object.defineProperty(this,k,{
                                    value        : v,
                                    writable     : false,
                                    enumerable   : true,
                                    configurable : true,
                        });
                    },
                    
                    writable     : true,
                    enumerable   : false,
                    configurable : true,
            });
            if (!Object.prototype.__readOnlyGetter)
              Object.defineProperty(Object.prototype,'__readOnlyGetter',{value : 
        
                    function(k,g) {
                        delete this[k];
                        Object.defineProperty(this,k,{
                                    get          : g,
                                    enumerable   : true,
                                    configurable : true,
                        });
                    },
                    
                    writable     : true,
                    enumerable   : false,
                    configurable : true,
            });
            if (!Object.prototype.__readWriteGetSetter)
               Object.defineProperty(Object.prototype,'__readWriteGetSetter',{value : 
        
                    function(k,g,s) {
                        delete this[k];
                        Object.defineProperty(this,k,{
                                    get          : g,
                                    set          : s,
                                    enumerable   : true,
                                    configurable : true,
                        });
                    },
                    
                    writable     : true,
                    enumerable   : false,
                    configurable : true,
            });
        }
        
        function getConsts(inside,named){
            return cloneReadOnly({},inside,named,{    
                
                win_moveTo             : readOnlyValue (win_moveTo),
                win_resizeTo           : readOnlyValue (win_resizeTo),
                       
                minimizedHeight        : readOnlyValue (minimizedHeight),
                minimizedWidth         : readOnlyValue (minimizedWidth),
                minimizedLeft          : readOnlyValue (minimizedLeft),
                minimizedTop           : readOnlyValue (minimizedTop),
                       
                maximizedHeight        : readOnlyValue (maximizedHeight),
                maximizedWidth         : readOnlyValue (maximizedWidth),
                maximizedLeft          : readOnlyValue (maximizedLeft),
                maximizedTop           : readOnlyValue (maximizedTop),
                
                maximizedPosition      : readOnlyValue (maximizedPosition),
                minimizedPosition      : readOnlyValue (minimizedPosition),

           });
        }
        
        function getStorageKeys(getSKNames,inside,named){
           const sks={};  
           keynames.forEach(function(keyname) {
                sks.__readOnlyGetter(keyname,function() {
                   return getSKNames()[keyname];
                });
           });
           
           
           sks.__readOnlyValue('cleanupStorage',cleanupStorage);
           
           function cleanupStorage() {
               keynames.forEach(localStorage.removeItem.bind(localStorage));
           }
            
           return cloneReadOnly(sks,inside,named);
        }
        
        function getWindowState(inside,named){
           return cloneReadOnly({},inside,named,{
                maximized     : readWriteGetSetter(getIsMaximized,setIsMaximized),
                minimized     : readWriteGetSetter(getIsMinimized,setIsMinimized),
                fullscreen    : readWriteGetSetter(getIsFullscreen,setIsFullscreen),
                position      : readWriteGetSetter(serializeWindowPosition.bind(this,window),
                                                   parseWindowPosition.bind(this,window)),
                state         : readWriteGetSetter(getState ,setState),       
                verboseState  : readWriteGetSetter(getVerboseState,setVerboseState),
           });
        }
        
        function safeWrapNullCB(cb) {
            return typeof cb==='function' ? cb : function(e){if (e) throw e;};
        }
        
        
        function getApi (inside,named) {
            
            return cloneReadOnly({},inside,named,{
                
                dbEngine                 : readOnlyValue(dbEngine),
                filterLocalKeys          : readOnlyValue(filterLocalKeys),
                convertStorageToLocalKey : readOnlyValue(convertStorageToLocalKey),
                convertLocalToStorageKey : readOnlyValue(convertLocalToStorageKey),
                getUrlVars               : readOnlyValue(getUrlVars),
                getUrlParam              : readOnlyValue(getUrlParam),
                createWindowId           : readOnlyValue(createWindowId),
                makeFullScreenApi        : readOnlyValue(makeFullScreenApi),
                on_window_move           : readOnlyValue(on_window_move),
                on_window_size           : readOnlyValue(on_window_size),
                createKeyNames           : readOnlyValue(createKeyNames),
                cloneReadOnly            : readOnlyValue(cloneReadOnly),
                getConsts                : readOnlyValue(getConsts),
                getStorageKeys           : readOnlyValue(getStorageKeys),
                setPrimary               : readOnlyValue(setPrimary),
                cpArgs                   : readOnlyValue(cpArgs),
                readOnlyGetter           : readOnlyValue(readOnlyGetter),
                readOnlyValue            : readOnlyValue(readOnlyValue),
                readWriteGetSetter       : readOnlyValue(readWriteGetSetter),
                safeWrapNullCB           : readOnlyValue(safeWrapNullCB),
                
                On                       : readOnlyValue(On),
                Off                      : readOnlyValue(Off),
                

            });
        }

    },
      
 
      ServiceWorkerGlobalScope : function wToolsLib() {
          const lib = {};
          return lib;
      },
      
  },
  {
      Window                   : [ ()=>self.libEvents ],
      ServiceWorkerGlobalScope : [ ()=>self.libEvents ],
  }
  
);      



});


