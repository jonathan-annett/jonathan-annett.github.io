/*global self,localforage */

/*global multiLoad,__ml1,__ml2,__ml3,__ml4,ml*/
//multiLoad(__ml1(),['wToolsLib'],function(){__ml2( __ml3(), __ml4(),
ml(0,ml(1),['wToolsLib|/zed/pwa/windowTools.helper.js'],function(){ml(2,ml(3),ml(4),

  { 
      
    Window : function wTools(setKey_,getKey, wToolsLib ) {
        

                 const { 
                     On,Off,
                     cpArgs,
                     readOnlyValue, 
                     readOnlyGetter, 
                     readWriteGetSetter,
                     createWindowId,
                     safeWrapNullCB

                 } = wToolsLib.api.setPrimary().api;
         
              
                 var 
                 
                 
                 deltaWidth=0,
                 deltaHeight=0,
                 deltaLeft=0,
                 deltaTop=0,
                 saveIntervalId,saveInterval=10000;
                 const 
                 
                 events = {
                     open   : [],
                     close  : [],
                     setKey : [],
                 },
                 open_windows = (function () {
                     
                     const prev = getKey("windowTools.openWindows");
                     if (prev) {
                         delete prev.meta_dirty;
                         Object.keys(prev).forEach(
                           function (wid) {
                              const meta = prev[wid];
                              meta.win   = wToolsRemote(meta,wToolsLib,setKey,getKey);
                              meta.win.ping(function (stillAlive){
                                  if (stillAlive) return;
                                  
                                  delete open_windows [meta.wid];
                                  cleanupStorage(meta.wid);
                                  delete meta.win;
                                  nukeMeta(meta);
                                  prev.meta_dirty = true;
                              });
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
                                     appendScript(win,"wToolsLib|/zed/pwa/windowTools.helper.js",function(){
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
                     cb = safeWrapNullCB(cb);
                     setKey_(k,v,function(err){
                         if (err) {
                             if (typeof cb==='function') return cb (err);
                                                         throw err;
                         }
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
                    } else {
                        win.ml=ml; 
                    }
                    
                    
                    if (scriptUrl.indexOf("|")>0) return win.ml(5,win,[scriptUrl],cb,addCBEvents);

                    
                    let promise,scriptElement = win.document.createElement("script");
                    scriptElement.type = "text/javascript"; 
                    win.document.body.appendChild(scriptElement);
                    addCBEvents(scriptElement);
                    scriptElement.setAttribute("src", scriptUrl);
                    return promise;
                    
                    
                    function addCBEvents(scriptElement) {
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
                    } 
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
                   const wid = createWindowId();
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
                 
                 
                 function cleanupStorage(wid) {
                     
                     const keys = wToolsLib.api.getStorageKeys(wToolsLib.api.createKeyNames(wid));
                     
                     keys.cleanupStorage();
                     
                     nukeMeta ( keys );
                     
                 }
                 
                
                 function nukeMeta ( meta ) {
                     if (typeof meta === 'object') {
                         if (typeof meta.win === 'object') {
                             nuke(meta.win.consts);
                             nuke(meta.win.storageKeys);
                             nuke(meta.win.urlParams);
                             nuke(meta.win.restoreStateStack);
                             nuke(meta.win.windowState);
                             nuke(meta.win);
                         }
                         nuke(meta);
                     }
                     
                     function nuke(obj){
                            if (typeof obj === 'object') {
                                if (Array.isArray(obj)) {
                                   obj.forEach(nuke);   
                                } else {
                                    Object.keys(obj).forEach(function(k){
                                        delete obj[k];
                                    });
                                 }
                            }                 
                     }
                     
                 }
                  
                 
             },
      
    ServiceWorkerGlobalScope : function wTools(setKey_,getKey) {
          const lib = {}
          
          
          
          return lib;
    },
      
  },
  {
      Window : [
        () => setHybridKey,
        () => getHybridKey,
        () => self.wToolsLib,
        () => wToolsRemote
          
      ],
      ServiceWorkerGlobalScope : [
          () => setHybridKey_,
          () => getHybridKey_,
          () => wToolsRemote
            
        ],
    }
    
);      


/*

local imports - these functions are available to the other modules declared in this file

*/

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
    
    function setHybridKey_(k,v,cb) {
        
        const hybrid = [v, typeof localforage==='undefined' ? 0 : Math.random()+Date.now()];
        if (typeof localforage==='undefined') {
            return cb(undefined,hybrid);
        }
        setForageKey(k,hybrid,function(err){
            if (err) return cb(err);
            cb(undefined,hybrid);
        });
    }
    
    function setHybridKey(k,v,cb) {
        cb = safeWrapNullCB(cb);
        setHybridKey_(k,v,function(err,hybrid){
            if (err) return cb(err);
            setLocalKey(k,hybrid,cb);
        });
    }
    
    function getHybridKey_(k,cb) {
        if (typeof localforage==='undefined') {
            return cb();
        }
        getForageKey(k,function(err,hybrid){
            if (err) return cb(err);
            cb(undefined,hybrid[0]);
        });
    }
    
    function getHybridKey(k,cb) {
        if (typeof cb==='function') {
            if (typeof localforage==='undefined') {
                // ignore stamps, just return stored value
                return getLocalKey(k,function(err,local){
                    if (err) return cb(err);
                    cb(undefined,local[0]);
                });
            }
            return getForageKey(k,function(err,hybrid){
                if (err||!hybrid) {
                    getLocalKey(k,function(err,local){
                       if (err) return cb(err);
                       setForageKey(k,local,function(){
                          cb(undefined,local[0]);
                       });
                    });
                } else {
                    getLocalKey(k,function(err,local){
                       if (err||!local) {
                           setLocalKey(k,hybrid,function(err){
                               if (err) return cb(err);
                               return cb(undefined,hybrid[0]);
                           });
                           
                       } else {
                           
                           if (local[1]===hybrid[1]) {
                               return cb(undefined,local[0]);
                           }
                            
                           // was updated by forage (so update local)
                           setLocalKey(k,hybrid,function(){
                               return cb(undefined,hybrid[0]);
                           });
                       }
                    });
                }
            });
        }
        // sync request
        const local = localStorage.getItem(k);
        if (local) return JSON.parse(local)[0];
    }
    
    function safeWrapNullCB(cb) {
        return typeof cb==='function' ? cb : function(e){if (e) throw e;};
    }
    
    
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
            },5000);
            
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