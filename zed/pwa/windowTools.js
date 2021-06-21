/*global self,ml*/
ml(0,ml(1),[
    'wToolsLib | /zed/pwa/windowTools.helper.js',
    'dbengine  | /zed/pwa/dbengine.js',
    'wToolsRem | /zed/pwa/windowTools.remote.js'
],function(){ml(2,ml(3),ml(4),

  { 
      
    Window : function wTools(dbengine, wToolsLib ) {
                 const db      = dbengine("hybrid");
                 const setKey_ = db.setKey;
                 const getKey  = db.getKey;
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
                                     appendScript(win,"wToolsLib|/zed/pwa/windowTools.helper.js",function(err,wToolsLibx){
                                         if (err) throw err;
                                         console.log(wToolsLibx,win.wToolsLib);
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
                        win.ml=ml.bind(win); 
                    }
                    
                    
                    if (scriptUrl.indexOf("|")>0) { 
                        
                       let [mod,url] = scriptUrl.split("|");
                       return win.ml(6,win,mod,url,addCBEvents.bind(this,function(err){
                          
                           if (err) {
                               console.log("script error via ml:",err);
                               return cb (err);
                           } else {
                               console.log("script",url,"loaded, runniing now, expecting:",mod);
                           }
                           
                       }),
                        function(m){
                            console.log("got",mod,"from",url,"into",win.location.href,":",typeof m);
                            cb(undefined,m);
                            
                        });
                    } 
                    
                    let promise,scriptElement = win.document.createElement("script");
                    scriptElement.type = "text/javascript"; 
                    win.document.body.appendChild(scriptElement);
                    addCBEvents(cb,scriptElement);
                    scriptElement.setAttribute("src", scriptUrl);
                    return promise;
                    
                    
                    function addCBEvents(cb,scriptElement) {
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
      
    ServiceWorkerGlobalScope : function wTools(dbengine,wToolsLib) {
          const lib = {};
          
          const db = dbengine ("sw"); 
          
          return lib;
    },
      
  },
  (function(){
      
      return {
          Window : [
            () => self.dbengine,
            () => self.wToolsLib,
            () => self.wToolsRemote
              
          ],
          ServiceWorkerGlobalScope : [
            () => self.dbengine,
            () => self.wToolsRemote
                
          ],
        };
        
       

  })(),
  0
    
);      


   
    
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