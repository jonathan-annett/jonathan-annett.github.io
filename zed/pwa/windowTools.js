/*global self*/
(function(whoami,exports,Lib,libArgs){const n = Lib.name,x=whoami==="Window"&&exports[n]===undefined?Object.defineProperty(exports,n,{value:Lib.apply(this,libArgs),enumerable:true,configurable:true}):undefined;})(typeof self==="object"&&self.constructor.name||"Nobody",self,
   function wTools(setKey_,getKey) {
    
    
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
        open_windows = {
            meta_dirty : false,
        },
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
                    
                        on_window_move (win,resavePos);
                        
                        on_window_size (win,resavePos);
                    }
                    
                    events.open.forEach(
                        function(fn){ fn(win,wid,meta); }
                    );
                    
                    function resavePos() {
                        meta.lastTouch = Date.now();
                        open_windows.meta_dirty = true;
                        savePos(url,win.screenX,win.screenY,win.outerWidth,win.outerHeight);
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
            
            fs_api : function (wid){
                const meta = open_windows [wid];
                if (!meta.fs_api) {
                    
                    meta.fs_api = makeFullScreenApi(meta.win);
                    meta.fs_api.isMaximized = function () {
                        return   meta.win.screenX===0&&
                                 meta.win.screenY===0&&
                                 meta.win.outerWidth===screen.availWidth&&
                                 meta.win.outerHeight===screen.availHeight;
                                            
                    };
                    
                    meta.fs_api.restore = meta.fs_api.isMaximized() 
                        ? function(){}
                        : restoreCapturedState.bind(this,winRestoreCapture(meta));
                        
                    meta.fs_api.maximize = function () {
                        
                        if (!meta.fs_api.isMaximized()) {
                            meta.fs_api.restore = restoreCapturedState.bind(this,winRestoreCapture(meta));
                            meta.win.moveTo(0,0);
                            meta.win.resizeTo(screen.availWidth,screen.availHeight);
                        }

                    };
                   meta.fs_api.minimize = function () {
                       
                       if (!meta.fs_api.isMaximized()) {
                           meta.fs_api.restore = restoreCapturedState.bind(this,winRestoreCapture(meta));
                       }
                       meta.win.moveTo(0,0);
                       meta.win.resizeTo(300,32);
                       meta.win.moveTo(screen.availWidth-300,screen.availHeight-32);
                   };
                }
                    
                return meta.fs_api;
            },
            
            promise : {
                
               open : function (opt){
                    const {url, title,left,top, width,height} = opt;
                    
                    return new Promise( function(resolve,reject) {
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
                            
                                on_window_move (win,resavePos);
                                
                                on_window_size (win,resavePos);
                                
                                resolve(meta);
                            }
                            
                            events.open.forEach(
                                function(fn){ fn(win,wid,meta); }
                            );
                            
                            function resavePos() {
                                meta.lastTouch = Date.now();
                                open_windows.meta_dirty = true;
                                savePos(url,win.screenX,win.screenY,win.outerWidth,win.outerHeight);
                            }
                        }
        
                        function onClose(win,wid,meta){
                            events.close.forEach(function(fn){
                                fn(win,wid,meta);
                            });
                            open_windows.meta_dirty = true;
                            delete open_windows[wid];
                        }
                    
                });
            },
            
            
               close : function (wid) {
                   
                    return new Promise(function (resolve,reject){
                        
                        const meta = open_windows[wid];
                        if (meta) {
                            lib.on("close",onClose);
                            meta.win.close();
                             
                        } else {
                            reject();
                        }
                        
                        function onClose(win,wid_,meta) {
                            if (wid===wid_) {
                                lib.off("close",onClose);
                                return resolve();
                            }
                        }
                        
                    });
                   
                   
                    
                    
                   
               },
            
            
            },
            
            close : function (wid,cb) {
                const meta = open_windows[wid];
                if (meta) {
                    meta.win.close();
                    return typeof cb==='function'?cb(undefined,meta):meta;
                }
                const err = new Error("window "+wid+" not found");
                if (typeof cb==='function') {
                    return cb(err);
                }
                throw err;
            },
            
            getWindow : function(wid) {
                return open_windows [wid];
            },
            
            getMetaForURL : function(url) {
                return open_windows [ 
                    Object.keys(open_windows).find(
                          function (wid){
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
        
        function winRestoreCapture (meta) {
            const win = meta.win;
            const cmds = [
              meta,
              [ win.moveTo,   [0,0]   ],
              [ win.resizeTo, [win.outerWidth,win.outerHeight] ]
            ];
            if (!(win.screenX===0&&win.screenY===0)) {
               cmds.push([ win.moveTo,  [win.screenX,win.screenY]   ]);
            }
            return cmds;
        }
        
        function restoreCapturedState(cmds) {
            const 
            win=cmds[0].win,
            len=cmds.length;
            for(var i = 1; i < len; i++) {
                var x = cmds[i];
                x[0].apply(win,x[1]);
                x[1].splice(0,2);
                x.splice(0,2);
            }
            cmds[0].fs_api.restore=function(){};
            cmds.splice(0,len);
        }
        
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
                        return open_windows[wid];
                    }).sort (function(a,b){
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
        
        function on_window_close_poller (w,fn, interval) {
            if (w.closed) return fn();
            interval = interval || 500;
            setTimeout(on_window_close_poller, interval, w, fn, interval);
        }
        
        function on_window_close(w, fn) {
          if (typeof fn === "function" && w && typeof w === "object") {
            setTimeout(function() {
              if (w.closed) return fn(w);
        
              try {
                w[On]("beforeunload", function(){fn(w);});// this will throw for cross domain windows
              } catch (err) {
                on_window_close_poller(w,fn,500);
              }
            }, 1000);
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
              w[On]("load", function(){fn(w);});// this will throw for cross domain windows
            } catch (err) {
              //wait until 1 subfram exiss or 2 seconds, whatever happens first
              setTimeout(on_window_open_poller, 100, w, fn);
            }
          }
        }
        
        function on_window_move (w,fn) {
          
           if (typeof fn === "function" && w && typeof w === "object") {
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
              };
              
              w[On]("beforeunload",w.cancel_on_window_move);
              
            } catch (err) {
               
            }
          }
        }
        
        function on_window_size(w,fn) {
            if (typeof fn === "function" && w && typeof w === "object") {
                try {
                  w[On]("resize", function(){
                    fn(w.outerWidth,w.outerHeight);
                  });
                } catch (err) {
                  console.log(err);
                }
              }  
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
        
        function saveOpenWindows(cb,args,THIS){
            
            THIS = THIS || this;
            const metas = {};
            if (typeof cb==='function') {
                cb.apply(THIS,Array.isArray(args) ? args:[]);
            }
            delete open_windows.meta_dirty;
            Object.keys(open_windows).forEach(function(wid){
               const meta = open_windows[wid];
               if (meta.win.closed) {
                   delete open_windows[wid];
                   return;
               }
               const M = metas[wid]={win:{}};
                   if (!meta.cross) {
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
                        open_windows[wid].win = w;
                        open_windows[wid].lastTouch = Date.now();
                        open_windows[wid].url       = url;
                        
                        delete open_windows[opened_id];
                   } else {
                       open_windows[wid] = {
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
                   
                   on_window_close (w,saveOpenWindows.bind(this,onClosed,[w,wid,meta]));
                   
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
    
        
    },[
        function setKey(k,v,cb) {
            try { 
                 const json = JSON.stringify(v);
                 localStorage.setItem(k,json);
                 if (self.localforage) {
                     self.localforage.setItem(k,v,function(){});
                 }
                  //setTimeout(cb,0);
                 cb();
             } catch (e) {
                 //setTimeout(cb,0,e);
                 cb(e)
             }
        },
        function getKey(k,cb) {
            try {
               //setTimeout(cb,0,undefined,JSON.parse(localStorage.getItem(k)));
               cb (undefined,JSON.parse(localStorage.getItem(k)));
            } catch (e) {
               //setTimeout(cb,0,e);
               cb(e)
            }
        }
    ]
);