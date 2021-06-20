/* global ml,self */
ml(0,ml(1),["localforage | https://unpkg.com/localforage@1.9.0/dist/localforage.js"],function(){ml(2,ml(3),ml(4),

    {
        Window:                   function wToolsRem(lib) {return lib;},
        ServiceWorkerGlobalScope: function wToolsRem(lib) {return lib;},
    }, (()=>{  return{
        Window:                   [ () => wToolsRemote     ],
        ServiceWorkerGlobalScope: [ () => wToolsRemote     ],
    };
      
      function wToolsRemote(meta,wToolsLib,setKey,getKey) {
          
          const 
          
          lib = { },
          
          { On,Off, cpArgs, readOnlyValue, readOnlyGetter, readWriteGetSetter } = wToolsLib.api;
          
         
          
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
      
          } = wToolsLib.api.dbEngine(filterLocalKeys,convertStorageToLocalKey,convertLocalToStorageKey);
          
            
            setWid(meta.wid);
           
           Object.defineProperties(lib,{
                //api: not implemented
                
                //fs_api: not implemented
                
                wid                 : readWriteGetSetter(getWid,setWid),
                consts              : readOnlyValue(wToolsLib.consts),
                
                storageKeys         : readOnlyGetter(wToolsLib.api.createKeyNames.bind (this,meta.wid,lib,'storageKeys')),
                param               : readOnlyValue(wToolsLib.api.getUrlParam.bind(this,meta.url)),
                
                urlParams           : readOnlyGetter(wToolsLib.api.getUrlVars.bind(this,meta.url,lib,'urlParams')), 
                restoreStateStack   : readOnlyValue([]),
                windowState         : readOnlyGetter(getWindowState.bind(this,lib,'windowState')),
                on                  : readOnlyValue(addLibEvent),
                off                 : readOnlyValue(removeLibEvent),
                addEventListener    : readOnlyValue(addLibEvent),
                removeEventListener : readOnlyValue(removeLibEvent),
                
                //dbEngine : not implemented
                
                getKeys             : readOnlyValue(typeof localforage==='undefined' ? getLocalKeys : getForageKeys),
                getKey              : readOnlyValue(typeof localforage==='undefined' ? getLocalKey : getForageKey),
                setKey              : readOnlyValue(typeof localforage==='undefined' ? setLocalKey : setForageKey),
                removeKey           : readOnlyValue(typeof localforage==='undefined' ? removeLocalKey : removeForageKey),
                getDB               : readOnlyValue(getDB),
                setDB               : readOnlyValue(setDB),
                close               : readOnlyValue(doClose),
                ping                : readOnlyValue(doPing),
                
           });
          
          
           
           return lib;
           
           
           // getWid() returns the  value assigned to window.wid (it's the setter for lib.wid)
           function getWid() {
               return meta.wid;
           }
       
           // setWid() used to assign a new window id (also updates the storage key names for this window (it's the getter for lib.wid)
           // setWid() assigns a new id for this window
           function setWid(id) {
               meta.wid=id;
               delete lib.storageKeys;
               Object.defineProperty (lib,'storageKeys',readOnlyGetter(wToolsLib.api.createKeyNames.bind (this,id,lib,'storageKeys')));
           }
            
           
           
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
           
           
           function refreshPosition(capture) {
               const moveTrackingUpdateKey=lib.storageKeys.moveTrackingUpdateKey;
                   
               const pos = getKey(moveTrackingUpdateKey);
               if (pos) {
                   localStorage.removeItem(moveTrackingUpdateKey);
                   parseWindowPosition(pos,capture);
                   return pos;
               }
           }
           
           // returns getIsMaximized() true/false indicating if this window is currently maximized (getter for lib.windowState.maximized)
           function getIsMaximized() {
               refreshPosition();
               const c = lib.consts;
               return  meta.left===c.maximizedLeft&&
                       meta.top===c.maximizedTop&&
                       meta.width===c.maximizedWidth&&
                       meta.height===c.maximizedHeight;
       
           }
           
           // setIsMaximized(true/false) lets you maximize/restore the window
           function setIsMaximized(v) {
              
               if (typeof v==="boolean") {
                   const c = lib.consts,k=lib.storageKeys;
                   const isTracking=!!getKey(k.moveTrackingKey);
                   if (v) {
                       if (!getIsMaximized()){
                           lib.restoreStateStack.push( lib.windowState.position );
                           lib.windowState.position = c.maximizedPositionJSON; 
                           emitLibEvent('maximized');
                           
                       }
                       if ( isTracking ) {
                           setKey(k.setWindowStateKey,'maximized');
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
                           setKey(k.setWindowStateKey,'normal');
                       }
                   }
               } else {
                   throw new Error ("maximized should be boolean");
               }
           }
           
           // getIsMinimized() returns true/false indicating if this window is currently minimized (getter for lib.windowState.minimized)
           function getIsMinimized() {
              refreshPosition();
              const c = lib.consts;
              return meta.left===c.minimizedLeft&&
                      meta.top===c.minimizedTop&&
                      meta.width===c.minimizedWidth&&
                      meta.height===c.minimizedHeight;
           }
           
           // setIsMinimized(true/false) lets you minimize/restore the window
           function setIsMinimized(v) {
               if (typeof v==="boolean") {
                   const c = lib.consts,k=lib.storageKeys;
                   const isTracking=!!getKey(k.moveTrackingKey);
                  if (v) {
                      if (!getIsMinimized()){
                          lib.restoreStateStack.push( lib.windowState.position );
                          lib.windowState.position = c.minimizedPositionJSON ; 
                          emitLibEvent('minimized');
                      }
                      if ( isTracking ) {
                          setKey(k.setWindowStateKey,'minimized');
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
                          setKey(k.setWindowStateKey,'normal');
                      }
                  } 
               } else {
                   throw new Error ("minimized should be boolean");
               }
           }
           
           
           // getIsFullscreen() returns true/false indicating if this window is currently fullscreen (getter for lib.windowState.fullscreen)
           function getIsFullscreen (){
               return getKey(lib.storageKeys.setWindowStateKey)==="fullscreen";
           }
           
           // setIsFullscreen(true/false) lets you enter/exit fullscreen
           function setIsFullscreen (v){
               // can't set fullscreen remotely
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
           
           
           // getVerboseState() returns a string indicating window state with verbose info
           function getVerboseState () { 
               const restore =  
               
                   (  lib.restoreStateStack.length>0) ? 
                          (function(X){ return " (restores to "+X[1][0]+"x"+X[1][1]+" @ "+X[2][0]+","+X[2][1]+")" })
                          (lib.restoreStateStack.slice(-1)[0]
                   ) : '' ;
               
               if (getIsMaximized()) return "maximized"+restore;
               if (getIsMinimized()) return "minimized"+restore;
               
               return "normal ("+meta.width+"x"+meta.height+" @ "+meta.left+","+meta.top+")"; 
               
           }
           
           // setVerboseState() takes a string to set window state
           function setVerboseState(v) {
               
               if (typeof v === 'string') {
                      const c = lib.consts,k=lib.storageKeys;
                      const isTracking=!!getKey(k.moveTrackingKey);
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
                             [  c.win_moveTo,   [ c.maximizedLeft,c.maximizedTop ] ],
                             [  c.win_resizeTo, [ width,height ]   ],
                             [  c.win_moveTo,   [ left,top ]       ],  
                           ];
                           
                           if ( isTracking ) {
                               setKey(k.setWindowStateKey,lib.windowState.state);
                           }
                          
                      }
                      
       
               } else {
                   throw new Error ("verboseState should be string");  
       
               }
       
           }
               
           
               
               
           // used to get param strings passed to this window
           function getUrlParam(parameter, defaultvalue){
               if(meta.url.indexOf(parameter) > -1){
                   var result,ignore=meta.url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
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
               var vars = {},ignore = meta.url.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
                   vars[key] = value;
               });
               return vars;
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
           
           
          //  serializeWindowPosition() returns a JSON payload than can be passed into 
          //    parseWindowPosition() to restore the window location  
           function serializeWindowPosition (sliceFrom) {
               // we basically proxy the change tracked updates from the remote window.
               // there are a few optumisations however....
               sliceFrom = sliceFrom||0;
               const capture = [ null, null ];
               const json = refreshPosition();
               // if refreshPosition is a strig, its the latest json payload updating the co-ods
               // unless caller wants an abreviated slice, that's exactly what is being asked for,
               if ( (typeof json==='string') && ( sliceFrom === 0) ) return json;
               
               // either data hasn't changed, or caller wants a slice, so restringify
               const c = lib.consts,k=lib.storageKeys;
                   
               const cmds = [
                 [ c.win_moveTo,   [c.maximizedLeft,c.maximizedTop]   ],
                 [ c.win_resizeTo, [meta.width,meta.height] ]
               ];
               if (!(meta.left===c.maximizedLeft&&meta.top===c.maximizedTop)) {
                  cmds.push([ c.win_moveTo,  [ meta.left, meta.top  ]  ]);
               }
               return cmds.slice(sliceFrom);
           }
       
           // parseWindowPosition() takes a JSON payload created by serializeWindowPosition() 
           // it restores the window position to how it was when serializeWindowPosition() was invoked
           function parseWindowPosition(cmds,capture){
               const 
               w={},
               fn=[w_moveTo,w_resizeTo],
               len=cmds.length;
               for(var i = 0; i < len; i++) {
                   var x = cmds[i];
                   if (capture) capture[ x[0] ] = x[1];
                   fn[ x[0] ].apply(w,x[1]);
                   x[1].splice(0,2);
                   x.splice(0,2);
               }
               
               function w_moveTo (left,top){
                   meta.left = left;
                   meta.top = top;
               }
               
               function w_resizeTo (width,height) {
                   meta.width=width;
                   meta.height=height;
               }
           }
           
           
           function doClose(){
               setKey(lib.storageKeys.closeKey,'1');
           }
            
            
          function doPing (cb) {
              
              if (typeof cb!=='function') return;
              
              const 
              
              ping = lib.storageKeys.ping,
              tmr = setTimeout(function(){
                  window.removeEventListener('storage',CB);
                  cb(false);
              },500);
              
              localStorage.removeItem(ping);
              window.addEventListener('storage',CB);
              setKey(ping,'1');
              
              function CB() {
                  if (setKey(ping==='1')) return ;
                  clearTimeout(tmr);
                  window.removeEventListener('storage',CB);
                  cb(true);
              }
              
                
           }
           
           
          
            
            //////
            
            
            function getWindowState(inside,named){
               return wToolsLib.api.cloneReadOnly({},inside,named,{
                   
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
                       get        : serializeWindowPosition,
                       set        : parseWindowPosition,
                       enumerable : false
                   },
                   state  : {
                       get        : getState ,
                       set        : setState,       
                       enumerable : false
                   },
                   
                  verboseState  : {
                       get        : getVerboseState,
                       set        : setVerboseState,
                       enumerable : false
                  }
               
               });
            }
           
      }
      
    })()

    );

});
