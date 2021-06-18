/*global self */
/*global self,localforage*/

(function (B,O0,T){
    let boot = function(d) {d = d.filter(function(x){ return !B[x];});
       if (d.length){ console.log(d); return setTimeout(boot,10,d); }
       T();
    };boot(O0);
})(self,['wToolsLib'],function (){
    
    
(function(L,o,a,d){let u,n=a[L]&&a[L].name,x=n&&o[n]===u?Object.defineProperty(o,n,{value:a[L].apply(this,d[L].map(function (f){return f();})),enumerable:!0,configurable:!0}):u;})(typeof self==="object"&&self.constructor.name||"x",self,
  { 
    Window : function wTools(setKey_,getKey, wToolsLib ) {
        

                 const { 
                     minimizedHeight,
                     minimizedWidth,
                     minimizedLeft,
                     minimizedTop,
                     maximizedHeight,
                     maximizedWidth,
                     maximizedLeft,
                     maximizedTop,
                     
                     win_moveTo,
                     win_resizeTo,
                     maximizedPosition,maximizedPositionJSON,
                     minimizedPosition,minimizedPositionJSON,
                     
                     
                     
                     windowId
                     
                 } = wToolsLib.setPrimary();
         
                 const getMaximizedPosition = function (win) { return [
                     win,
                     [ win.moveTo,    [ maximizedLeft,  maximizedTop ]   ],
                     [ win.resizeTo,  [ maximizedWidth, maximizedHeight ]  ]
                     
                 ];};
                 
                 const getIsMaximized = function (win) { 
                     return win.screenX===maximizedLeft&&
                            win.screenY===maximizedTop&&
                            win.outerWidth===maximizedWidth&&
                            win.outerHeight===maximizedHeight;
         
                 };
                 
                 const getMinimizedPosition = function (win) { return [
                     win,
                     [ win.moveTo,    [ minimizedLeft,  minimizedTop ]   ],
                     [ win.resizeTo,  [ minimizedWidth, minimizedHeight ]  ]
                     
                 ];};
                 
                 const getIsMinimized = function (win) { 
                     return win.screenX===minimizedLeft&&
                            win.screenY===minimizedTop&&
                            win.outerWidth===minimizedWidth&&
                            win.outerHeight===minimizedHeight;
                 };
              
                 var 
                 
                 
                 deltaWidth=0,
                 deltaHeight=0,
                 deltaLeft=0,
                 deltaTop=0,
                 saveIntervalId,saveInterval=10000;
                 const 
                 
                 On     = 'addEventListener',
                 Off    = 'removeEventListener',
                 events = {
                     open   : [],
                     close  : [],
                     setKey : [],
                 },
                 open_windows = (function () {
                     
                     const json = localStorage.getItem("windowTools.openWindows");
                     if (json) {
                         const prev = JSON.parse(json);
                         delete prev.meta_dirty;
                         Object.keys(prev).forEach(
                           function (wid) {
                              const meta = prev[wid];
                              meta.win   = wToolsRemote(meta,wToolsLib);
                           }
                         );
                         return prev;
                     }
                     
                     return {    };
                 })(),
                 
                 lib = {
                     
                     open : function ( url, title,left,top, width,height ) {
                         
                         const wid = openWindow(
                           url,
                           undefined,
                           left,
                           top,
                           width,
                           height,
                           undefined,
                           onClose,
                           onOpen 
                         );
                         
                         function onOpen(win,wid,meta){
                             
                             if (!meta.cross) {
                                 
                                 if (title) {
                                     if (win.document.title!==title)
                                     win.document.title=title;
                                 }
                                 
                                 if (win.wToolsLib) {
                                     meta.win = win.wToolsLib;
                                     meta.win.on('move',resavePos);
                                     meta.win.on('size',resavePos);
                                 } else {
                                     appendScript(win,"/zed/pwa/windowTools.helper.js",function(){
                                         meta.win = win.wToolsLib;
                                         meta.win.on('move',resavePos);
                                         meta.win.on('size',resavePos);
                                     }); 
                                 }
                             

                             }
                             
                             events.open.forEach(
                                 function(fn){ fn(win,wid,meta); }
                             );
                             
                             function resavePos() {
                                 meta.lastTouch = Date.now();
                                 open_windows.meta_dirty = true;
                                 savePos(url,meta.win.left,meta.win.top,meta.win.width,meta.win.height);
                             }
                         }
         
                         function onClose(win,wid,meta){
                             events.close.forEach(function(fn){
                                 fn(win,wid,meta);
                             });
                             open_windows.meta_dirty = true;
                             delete open_windows[wid];
                         }
                         
                         return wid;
                          
                     },
                     
                     close : function (wid,cb) {
                         const meta = open_windows[wid];
                         if (meta) {
                             if (typeof cb==='function') {
                                 meta.win.on('close',cb);
                             }
                             return meta.win.close();
                         }
                         const err = new Error("window "+wid+" not found");
                         if (typeof cb==='function') {
                             return cb(err);
                         }
                         throw err;
                     },
                     
                     getMeta : function(wid) {
                         return open_windows [wid];
                     },
                     
                     getMetaForURL : function(url) {
                         return open_windows [ 
                             Object.keys(open_windows).find(
                                   function (wid){
                                       if (wid==="meta_dirty") return false;
                                       return open_windows[wid].url === url;
                                   }    
                             )
                        ];
                     },
                     
                     getMetaForWindow : function(win) {
                         const tagged = open_windows[win.wid];
                         if (tagged) return tagged;
                         const located = open_windows [ 
                             Object.keys(open_windows).find(
                                   function (wid){
                                       if (wid==="meta_dirty") return false;
                                       return open_windows[wid].win === win;
                                   }    
                             )
                        ];
                        if (located) {
                            located.win.wid = located.wid;
                            return located;
                        }
                     },
                     
                     on : function (e,fn) {
                         const handlers = events[e];
                         if (typeof e==='string'&& Array.isArray(handlers) && typeof fn==='function') {
                             handlers.push(fn);
                         }
                     },
                     
                     off : function (e,fn) {
                           const handlers = events[e];
                           if (typeof e==='string'&& Array.isArray(handlers) && typeof fn==='function') {
                               let i = handlers.indexOf(fn);
                               while (i>=0) {
                                   handlers.splice(i,1);
                                   i = handlers.indexOf(fn);
                               }
                           }
                       },
                       
                     setDB : function ( setter, getter ) {
                         if (typeof setter+typeof getter==='functionfunction') {
                             if (setter.length===3 && getter===2) {
                               setKey_ = setter;
                               getKey  = getter;
                             } else {
                                if (setter.length===2 && getter===1) {
                                  setKey_ = function (k,v,cb) { 
                                     
                                      cb(); 
                                      try {
                                          setter(k,v);
                                      } catch (e) {
                                          return cb(e);
                                      }
                                      cb();
                                      
                                  },
                                  getKey  = function (k,cb) {
                                      var result;
                                      try {
                                          result = getter(k);
                                      } catch (e) {
                                          cb(e);
                                      }
                                      cb(undefined,result);
                                  };
                                } 
                             }
                         }
                         
                     }
                 };
                 
         
                 
                 Object.defineProperties(lib,{
                     
                     openWindow : {
                         value      : openWindow,
                         configurable : true,
                         writable     : false,
                         enumerable   : true
                     },
                     
                     history : {
                         get : function () {
                             return Object.keys(open_windows).map(function (wid) {
                                 if (wid==="meta_dirty") return null;
                                 return open_windows[wid];
                             }).filter(
                                 function (x) { return x!==null;}
                             ).sort (function(a,b){
                                   return a.lastTouch - b.lastTouch;
                             }) ;
                         }
                     },
                     
                     savePollInterval : {
                         get : function () {
                             return saveInterval;
                         },
                         set : function (v) {
                             saveInterval = v;
                             clearInterval (saveIntervalId);
                             saveIntervalId = (
                                saveInterval===0 ? undefined : setInterval(checkSaveMetaPoller,saveInterval)
                              );
                               
                         }
                     }
                 });
                 
                 saveIntervalId = setInterval(checkSaveMetaPoller,saveInterval);
                 
                 function checkSaveMetaPoller() {
                     if (open_windows.meta_dirty) {
                       saveOpenWindows();
                     }
                 }
                  
                 return lib;
                 
                 function setKey(k,v,cb) {
                     setKey_(k,v,function(err){
                         if (err) return cb (err);
                         events.setKey.forEach(function(fn){
                             fn(k,v);
                         });
                         cb ();
                     });
                 }
                  
                     
                 function storageName (url) {
                     return typeof name==='string' ? "windowTools.pos@"+url : false; 
                 }
                 
                 function loadPos(url,cb) {
                     getKey(storageName(url),function(err,v){
                         if (err) return cb ({
                             left   : undefined,
                             top    : undefined,
                             width  : undefined,
                             height : undefined
                         });
                         cb(v);
                     })
                 }
                 
                 function savePos(w,left,top,width,height,cb) {
                     cb = typeof cb==='function'?cb:function(storeName){};
                     const isWindow  = typeof w+typeof left+typeof top === 'objectundefinedundefined' && w.constructor.name==="Window";
                     const storeName = storageName (isWindow ? w.location.href : w);
                     const settings  = isWindow ? {left  : w.screenX, top : w.screenY, width: w.outerWidth, height: w.outerHeight} : typeof left+typeof top+typeof width+typeof height === 'numbernumbernumbernumber' ? { left : left, top: top, width:width, height : height }: false;
                     if (typeof storeName+ typeof settings === 'stringobject' && storeName.length>0) {
                         setKey(
                             storeName,
                             settings,
                             function () {
                                 cb(storeName);
                             }
                         );
                     } else {
                         cb(storeName);
                     }
                 }
                 
                 
                 function appendScript(win,scriptUrl,cb) {
                    if (typeof win==='string') {
                        cb=scriptUrl;
                        scriptUrl=win;
                        win=window;
                    }
                    let promise,scriptElement = win.document.createElement("script");
                    scriptElement.type = "text/javascript"; 
                    win.document.body.appendChild(scriptElement);
                    if (typeof cb==='function') {
                        scriptElement.addEventListener('load',function(){
                            return cb (undefined,scriptElement);
                        });
                        scriptElement.addEventListener('error',cb);
                    } else {
                        promise = new Promise(function(resolve,reject){
                            scriptElement.addEventListener('load',function(){
                               resolve(scriptElement); 
                            });
                            scriptElement.addEventListener('error',reject);
                        });  
                    }
                    scriptElement.setAttribute("src", scriptUrl);
                    return promise;
                 }
                 
                 function saveOpenWindows(cb,args,THIS){
                     
                     THIS = THIS || this;
                     const metas = {};
                     if (typeof cb==='function') {
                         cb.apply(THIS,Array.isArray(args) ? args:[]);
                     }
                     delete open_windows.meta_dirty;
                     Object.keys(open_windows).forEach(function(wid){
                         if (wid==="meta_dirty") return;
                        const meta = open_windows[wid];
                        if (meta.win!=="remote") {
                            if (meta.win.closed) {
                                delete open_windows[wid];
                                return;
                            }
                        }
                        const M = metas[wid]={win:{}};
                            if (!meta.cross&&meta.win!=="remote") {
                            try {
                                M.win.title  = meta.win.document.title;
                                M.win.left   = meta.win.screenX;
                                M.win.top    = meta.win.screenY;
                                M.win.width  = meta.win.outerWidth;
                                M.win.height = meta.win.outerHeight;
                            } catch (e) {
                                meta.cross=true;
                            }
                        }
                        Object.keys(meta).forEach(function(key){
                           if (key==="win") return;
                           if (key==="fs_api") return;
                           M[key]=meta[key];
                        });
                    });
                    
                     setKey ( 
                        "windowTools.openWindows",
                        metas,
                        function(){
                            
                            
                        }
                     );
                 }
                 
                 function openWindow(
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
                   // sync return is a string refering to future open window.
                   const wid = windowId();
                   const doOpen = function (pos) {
                         left   = pos.left   || left;
                         top    = pos.top    || top;
                         width  = pos.width  || width;
                         height = pos.height || height;
                          
                       var opts =
                          "toolbar=no,menubar=no,location=no"+
                          ",resizable=" + (size ? "yes" : "no") +
                          ",scrollbars=" + (size ? "yes" : "no") +
                          (typeof top==='number'    ? ",top="    + (top-deltaTop).toString()+     ",screenY="    + top    : "" )+
                          (typeof left==='number'   ? ",left="   + (left-deltaLeft).toString()+   ",screenX="   +  left  : "" )+
                          (typeof width==='number'  ? ",width="  + (width-deltaWidth).toString()   : "" )+
                          (typeof height==='number' ? ",height=" + (height-deltaHeight).toString() : "" ),
                          
                        // if a name is specified, use that, otherwise make up a random name
                        w = window.open(url, name||"w_"+wid, opts);
                        if (w) {
                            // if a name was specified, and it was reactivated instead of opened, it will be located 
                            // by getWindowId(w), otherwise, make up a new window id
                            const opened_id = getWindowId(w)||wid;
                            
                            if (wid!==opened_id) {
                                 open_windows[wid] = open_windows[opened_id];
                                 open_windows[wid].wid = wid;
                                 open_windows[wid].win = w;
                                 open_windows[wid].lastTouch = Date.now();
                                 open_windows[wid].url       = url;
                                 
                                 delete open_windows[opened_id];
                            } else {
                                open_windows[wid] = {
                                    wid       : wid,
                                    win       : w,
                                    url       : url,
                                    lastTouch : Date.now(),
                                    cross     : false,
                                }; 
                            }
                            const meta = open_windows[wid];
                            
                            try {
                                w.wid = wid;
                            } catch (e) {
                                meta.cross=true;
                            }
         
                            on_window_open  (w,function(){
                               if (!meta.cross && typeof left+typeof top==='numbernumber' && (w.screenX!==left || w.screenY!==top) ) {
                                  deltaTop=w.screenY-top;
                                  deltaLeft=w.screenX-left;
                                  console.log("delta top",deltaTop);
                                  console.log("delta left",deltaLeft);
                                  w.moveTo(left,top);
                               }
                               
                               if (!meta.cross && typeof width+typeof height==='numbernumber' && (w.outerWidth!==width || w.outerHeight!==height) ) {
                                  deltaWidth=w.outerWidth-width;
                                  deltaHeight=w.outerHeight-height;
                                  console.log("delta width",deltaWidth);
                                  console.log("delta height",deltaHeight);
                                  w.resizeTo(width,height);
                               }
                               saveOpenWindows(onOpened,[w,wid,meta]);
                            });
                            

                        } else {
                            saveOpenWindows();  
                        }
         
                   };
                   loadPos( url, function (pos){
                         
                         if (pos) {
                            doOpen(pos);
                         } else {
                            savePos(url,left,top,width,height,function (){doOpen({left,top,width,height});}); 
                         }
                        
                   } );
                   return wid;
                 }
                 
         
                 function getWindowId(w){
                     
                     let cross_origin=false;
                     try {
                         const wid = w.wid;
                         if (typeof wid==='string') {
                             return wid;
                         }
                     } catch ( e ) {
                         cross_origin = true;
                         // cross origin 
                     }
                     
                     // ok so do it the hard way
                     return Object.keys(open_windows).find(function(wid){
                           if (wid==="meta_dirty") return;
                           const meta = open_windows[wid];
                           if ( meta.win===w ) {
                             
                              if (!meta.cross) {
                                  try {
                                      // cache it for next time
                                      w.wid=wid;
                                  } catch (e) {
                                      meta.cross=true;
                                  }
                              }
                              
                              return true; 
                           }
                      });
                 }
                 
             },
      
    ServiceWorkerGlobalScope : function wTools(setKey_,getKey) {
          const lib = {}
          
          
          
          return lib;
    },
      
  },
  {
      Window : [
        () => setLocalKey,
        () => getLocalKey,
        () => self.wToolsLib,
        () => wToolsRemote
          
      ],
      ServiceWorkerGlobalScope :[
          () => setForageKey,
          () => getForageKey,
          () => wToolsRemote
            
        ],
    }
);      


    function setLocalKey(k,v,cb) {
        try { 
             const json = JSON.stringify(v);
             localStorage.setItem(k,json);
             if (self.localforage) {
                 self.localforage.setItem(k,v,function(){});
             }
             cb();
         } catch (e) {
             cb(e)
         }
    }
    
    function getLocalKey(k,cb) {
        try {
           cb (undefined,JSON.parse(localStorage.getItem(k)));
        } catch (e) {
           cb(e)
        }
    }
    
    function setForageKey(k,v,cb) {
         self.localforage.setItem(k,v).then(function(){
             cb();
         }).catch(cb);
    }
    
    
    function getForageKey(k,cb) {
        self.localforage.getItem(k).then(function(v){
            cb(undefined,v);
        }).catch(cb);
    }
    
    function wToolsRemote(meta,wToolsLib) {
        
        const On="addEventListener";
        const Off="removeEventListener";
        var cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);
        
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
        
        setWid(meta.wid);
        
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
            minimizedHeight,
            minimizedWidth,
            minimizedLeft,
            minimizedTop,
            maximizedHeight,
            maximizedWidth,
            maximizedLeft,
            maximizedTop,
            
            win_moveTo,
            win_resizeTo,
            maximizedPosition,maximizedPositionJSON,
            minimizedPosition,minimizedPositionJSON,
            
            
            
            windowId
            
        } = wToolsLib;
        
        
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
    
        } = wToolsLib.dbEngine(filterLocalKeys,convertStorageToLocalKey,convertLocalToStorageKey);
        
         var lib = {
             win_moveTo              : win_moveTo,
             win_resizeTo            : win_resizeTo,
             stringifyWindowPosition : stringifyWindowPosition,
             parseWindowPosition     : parseWindowPosition,
             on                      : addLibEvent,
             off                     : removeLibEvent,
             param                   : getUrlParam,
             
             
             storageKeys : {},
             windowState : {
                 
             },
             
             
             restoreStateStack : []
         };
         
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
                  value       : doClose,
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
            
         return lib;
         
         
         // getWid() returns the  value assigned to window.wid (it's the setter for lib.wid)
         function getWid() {
             return meta.wid;
         }
     
         // setWid() used to assign a new window id (also updates the storageKeys for this window (it's the getter for lib.wid)
         function setWid(id) {
             meta.wid=id;
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
             const json = localStorage.getItem(moveTrackingUpdateKey);
             if (json) {
                 localStorage.removeItem(moveTrackingUpdateKey);
                 parseWindowPosition(json,capture);
                 return json;
             }
         }
         
         // returns getIsMaximized() true/false indicating if this window is currently maximized (getter for lib.windowState.maximized)
         function getIsMaximized() {
             refreshPosition();
             return meta.left===maximizedLeft&&
                    meta.top===maximizedTop&&
                    meta.width===maximizedWidth&&
                    meta.height===maximizedHeight;
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
             refreshPosition();
             return meta.left===minimizedLeft&&
                    meta.top===minimizedTop&&
                    meta.width===minimizedWidth&&
                    meta.height===minimizedHeight;
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
             return localStorage.getItem(setWindowStateKey)==="fullscreen";
         }
         
         // setIsFullscreen(true/false) lets you enter/exit fullscreen
         function setIsFullscreen (v){
             // can't set fullscreen remotely
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
             
             return "normal ("+meta.width+"x"+meta.height+" @ "+meta.left+","+meta.top+")"; 
             
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
         
         
        //  stringifyWindowPosition() returns a JSON payload than can be passed into 
        //    parseWindowPosition() to restore the window location  
         function stringifyWindowPosition (sliceFrom) {
             // we basically proxy the change tracked updates from the remote window.
             // there are a few optumisations however....
             sliceFrom = sliceFrom||0;
             const capture = [ null, null ];
             const json = refreshPosition();
             // if refreshPosition is a strig, its the latest json payload updating the co-ods
             // unless caller wants an abreviated slice, that's exactly what is being asked for,
             if ( (typeof json==='string') && ( sliceFrom === 0) ) return json;
             
             // either data hasn't changed, or caller wants a slice, so restringify
             
             const cmds = [
               [ win_moveTo,   [maximizedLeft,maximizedTop]   ],
               [ win_resizeTo, [meta.width,meta.height] ]
             ];
             if (!(meta.left===maximizedLeft&&meta.top===maximizedTop)) {
                cmds.push([ win_moveTo,  [ meta.left, meta.top  ]  ]);
             }
             return JSON.stringify(cmds.slice(sliceFrom));
         }
     
         // parseWindowPosition() takes a JSON payload created by stringifyWindowPosition() 
         // it restores the window position to how it was when stringifyWindowPosition() was invoked
         function parseWindowPosition(json,capture){
             const 
             w={},
             cmds =JSON.parse(json),
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
             localStorage.setItem(closeKey,'1');
         }
          
         
    }
    
    
    function on_window_open_poller (w,fn, interval) {
        if (w.closed) return ;
        
        if (w.length>1) {
            return fn (w);
        }
        if (interval) {
            return setTimeout(fn, interval, w);   
        }
        return setTimeout(on_window_open_poller, 400, w, fn, 1500);
    }
    
    function on_window_open(w, fn) {
      if (typeof fn === "function" && w && typeof w === "object") {
        
        try {
          w.addEventListener("load", function(){fn(w);});// this will throw for cross domain windows
        } catch (err) {
          //wait until 1 subfram exiss or 2 seconds, whatever happens first
          setTimeout(on_window_open_poller, 100, w, fn);
        }
      }
    }
    


});