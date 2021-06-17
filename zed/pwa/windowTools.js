/*global self,windowToolsHelperStorageEvent,windowToolsHelperBeforeUnloadEvent */
(function(whoami,exports,Lib,libArgs){const n = Lib.name,x=whoami==="Window"&&exports[n]===undefined?Object.defineProperty(exports,n,{value:Lib.apply(this,libArgs),enumerable:true,configurable:true}):undefined;})(typeof self==="object"&&self.constructor.name||"Nobody",self,
   function wTools(setKey_,getKey) {

        if ( typeof windowToolsHelperStorageEvent === 'function' ) {
            windowToolsHelperStorageEvent.disable();
            return windowToolsHelperStorageEvent;
        }
        
        const minimizedHeight = 30;
        const minimizedWidth  = 130;
        const minimizedLeft   = screen.availWidth-minimizedWidth;
        const minimizedTop    = screen.availHeight-minimizedHeight;
        
        
        const maximizedHeight = screen.availHeight-4;
        const maximizedWidth  = screen.availWidth-4;
        const maximizedLeft   = 2;
        const maximizedTop    = 2;
        
        
        const win_moveTo = 0;
        const win_resizeTo = 1;
        
        
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
                var tracking = [];
                Object.keys(prev).forEach(
                  function (wid) {
                     const meta = prev[wid];
                     meta.win = "remote";
                     const moveTrackingKey = "windowTools.cmd."+wid+".position.tracking";
                     tracking.push(wid);
                     localStorage.setItem(moveTrackingKey,'1');
                  }
                );
                if (tracking.length) {
                    
                    window.addEventListener('storage',function(){
                       tracking.forEach(function(wid){
                           const meta = open_windows[wid];
                           const moveTrackingUpdateKey = "windowTools.cmd."+wid+".position.tracking.update";
                           const json = localStorage.getItem(moveTrackingUpdateKey);
                           if (json) {
                                localStorage.removeItem(moveTrackingUpdateKey);
                                if (meta) {
                                    decodeRemotePos(json,function(err,left,top,width,height){
                                        if (err) return;
                                        meta.left   = left;
                                        meta.top    = top;
                                        meta.width  = width;
                                        meta.height = height;
                                        
                                        savePos(meta.url,left,top,width,height);
                                        open_windows.meta_dirty=true;
                                    });
                                }
                           }
                       });
                       
                       
                        
                    });
                    
                }
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
                    
                        on_window_move (win,resavePos);
                        
                        on_window_size (win,resavePos);
                        
                        appendScript(win,"/zed/pwa/windowTools.helper.js"); 
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
            
            isFullscreen: function (wid) {
               const meta = open_windows[wid];
               if (meta) { 
                  if (meta.win==="remote") {
                      return !!localStorage.getItem("windowTools.cmd."+wid+".fullscreen");
                  } else {
                      return meta.win.fs_api.isFullscreen();
                  }
               }
            },
            
            exitFullscreen: function (wid) {
               const meta = open_windows[wid];
               if (meta) { 
                  if (meta.win==="remote") {
                      return !!localStorage.setItem("windowTools.cmd."+wid+".exitFullscreen",'1');
                  } else {
                      return meta.win.fs_api.exitFullscreen();
                  }
               }
            },
            
            enterFullscreen: function (wid) {
               const meta = open_windows[wid];
               if (meta) { 
                  if (meta.win==="remote") {
                      return !!localStorage.setItem("windowTools.cmd."+wid+".enterFullscreen",'1');
                  } else {
                      return meta.win.fs_api.enterFullscreen();
                  }
               }
            },
            
            isMaximized :function (wid) {
                
                const meta = open_windows[wid];
                if (meta) { 
                   if (meta.win==="remote") {
                       remoteMaximize(wid,function(err,restoreInfo){
                           if (restoreInfo) {
                              meta.restore=restoreInfo;
                           }
                       });
                   } else {
                       return getIsMaximized(meta.win);
                   }
                }
                  
                
            },
            
            maximize: function (wid) {
                
                
                
                const meta = open_windows[wid];
                if (meta) { 
                   if (meta.win==="remote") {
                       remoteMaximize(wid,function(err,restoreInfo){
                           if (restoreInfo) {
                              meta.restore=restoreInfo;
                           }
                       });
                   } else {
                       maximize(wid,function(err,restoreInfo){
                            if (restoreInfo) {
                               meta.restore=restoreInfo;
                            }
                        });
                    }
                }
                
            },
            
            minimize: function (wid) {
                const meta = open_windows[wid];
                if (meta) { 
                   if (meta.win==="remote") {
                       remoteMinimize(wid,function(err,restoreInfo){
                                              if (restoreInfo) {
                                                 meta.restore=restoreInfo;
                                              }
                                          });
                   } else {
                       minimize(wid,function(err,restoreInfo){
                            if (restoreInfo) {
                                meta.restore=restoreInfo;
                            }
                        });
                    }
                }
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
                    if (meta.win==="remote") {
                       remoteClose (wid,savePos,cb);
                       
                    } else {
                       meta.win.close();
                       return typeof cb==='function'?cb(undefined,meta):meta;
                    }
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
        
        function appendScript(win,script) {
           let myScript = document.createElement("script");
           myScript.setAttribute("src", script);
           win.document.body.appendChild(myScript);
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
        
        
  

      
      function captureWinPosition (meta,cb) {
          const win = meta.win;
          const cmds = [
            meta,
            [ win.moveTo,   [0,0]   ],
            [ win.resizeTo, [win.outerWidth,win.outerHeight] ]
          ];
          if (!(win.screenX===0&&win.screenY===0)) {
             cmds.push([ win.moveTo,  [win.screenX,win.screenY]   ]);
          }
          return typeof cb==='function'?cb(cmds):cmds;
      }
      

      function restoreCapturedState(cmds,cb) {
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
          if (typeof cb==='function') cb();
      }
      
      
      function stringifyWindowPosition (meta,cb) {
        const CB=function (err,left,top,width,height){
            if (err) return cb (err);
            
            meta.left   = left;
            meta.top    = top;
            meta.width  = width;
            meta.height = height;

            const cmds = [
              meta,
              [ 0,   [0,0]   ],
              [ 1, [meta.width,meta.height] ]
            ];
            if (!(meta.left===0&&meta.top===0)) {
               cmds.push([ 0,  [meta.left,meta.top]  ]);
            }
            return cb(JSON.stringify(cmds));
        };
        if (meta.win==="remote") {
            remoteGetPosition(meta.wid,CB);
        } else {
            CB(undefined,
               meta.win.screenX,
               meta.win.screenY,
               meta.win.outerWidth,
               meta.win.outerHeight
            );
        }
        
    }
    
      function parseWindowPosition(json,meta,cb){
            const win=meta.win;
            if (win==="remote") {
                  restoreRemotePosition(meta.wid,json,cb);          
            } else {
                const 
                cmds =JSON.parse(json),
                fn=[win.moveTo,win.resizeTo],
                len=cmds.length;
                for(var i = 0; i < len; i++) {
                    var x = cmds[i];
                    fn[ x[0] ].apply(win,x[1]);
                    x[1].splice(0,2);
                    x.splice(0,2);
                }
                cb();
            }
        
      }
      
      
      
      function decodeRemotePos(json,cb) {
          let left,top,width,height;
          try{
              JSON.parse(json).forEach(function(x){
                  switch (x[0]) {
                     case win_moveTo://"moveTo" : 
                        left = x[1][0];
                        top  = x[1][1];
                        break;
                     case win_resizeTo://"resizeTo":
                        width  = x[1][0];
                        height = x[1][1];
                      break;
                  }
              });
              cb(undefined,left,top,width,height);
          } catch(e) {
              cb(e);
          }
      }
      
      function remoteClose(wid,cb) {
          const meta = open_windows[wid];
          if (!meta) return;
          
          const closeKey  = "windowTools.cmd."+wid+".close";
          const closedKey = "windowTools.cmd."+wid+".closed";
         
          self.addEventListener('storage',waitClosed);
          var tmrId;
          function waitClosed(force) {
               
               const json = localStorage.getItem(closedKey);
               if (json) {
                   
                  if (tmrId) {
                      clearTimeout(tmrId);
                      tmrId=undefined;
                  } 
                  self.removeEventListener('storage',waitClosed);
                  localStorage.removeItem(closedKey);
                  decodeRemotePos(json,function(err,left,top,width,height){
                      savePos(meta.url,left,top,width,height,function(){
                          delete open_windows[wid];
                          open_windows.meta_dirty = true;
                          if (typeof cb==='function') cb();
                      });
                  });
               }
               if (force===true) {
                   throw new Error("remote close failed");
               }
          }
          
          localStorage.setItem(closeKey,"1");
          
          tmrId = setTimeout(function(){
              clearTimeout(tmrId);
              tmrId = undefined;
              waitClosed(true);
          },5000);
      
      }
      
      
      function restoreRemotePosition ( wid,json_cmd,  cb){
          const meta = open_windows[wid];
          if (!meta) return;
          
          const positionKey    = "windowTools.cmd."+wid+".position";
          const positionReplyKey    = "windowTools.cmd."+wid+".position.reply";
          
          self.addEventListener('storage',waitMoved);
          
      
          var tmrId;
          function waitMoved(timeout) {
               const json = localStorage.getItem(positionReplyKey);
               if (json) {
                   
                  if (tmrId) {
                      clearTimeout(tmrId);
                      tmrId=undefined;
                  } 
                  self.removeEventListener('storage',waitMoved);
                  
                  decodeRemotePos(json,function(err,left,top,width,height){
                      if (err) return cb (err);
                      meta.lastTouch = Date.now();
                      open_windows.meta_dirty = true;
                      savePos(meta.url,left,top,width,height,function () {
                          cb (undefined,left,top,width,height);
                      });
                  });
               }
               if (timeout===true) {
                   return cb( new Error("restoreRemotePosition timed out"));
               }
          }
          
          localStorage.setItem(positionKey,json_cmd);
          
          tmrId = setTimeout(function(){
              clearTimeout(tmrId);
              tmrId = undefined;
              waitMoved(true);
          },5000);
      }
          
     function remoteReposition(wid,left,top,width,height,cb) {
        
        if (!open_windows[wid]) return cb (new Error("window "+wid+" not found"));
        
        const cmd = [
            [ 0,   [0,0] ],
            [ 1, [width,height] ]
        ];
        
        if (!( left===0 && top ===0 )) {
            cmd.add ([ 0,   [left,top] ]);
        }
        
        restoreRemotePosition ( wid,JSON.stringify(cmd),  cb)
    }

    
     function remoteGetPosition(wid,cb) {
         
         const meta = open_windows[wid];
         if (!meta) return;
     
         const reportPositionKey  = "windowTools.cmd."+wid+".reportPosition";
         const reportPositionReplyKey  = "windowTools.cmd."+wid+".reportPosition.reply";
         
        self.addEventListener('storage',waitPosition);
        
    
        var tmrId;
        function waitPosition(timedout) {
             
             const json = localStorage.getItem(reportPositionReplyKey);
             if (json) {
                if (tmrId) {
                    clearTimeout(tmrId);
                    tmrId=undefined;
                } 
                self.removeEventListener('storage',waitPosition);
                localStorage.removeItem(reportPositionReplyKey);  
                decodeRemotePos(json,cb);
             }
             if (timedout===true) {
                 throw new Error("remote close failed");
             }
        }
        
        localStorage.setItem(reportPositionKey,'1');
        
        tmrId = setTimeout(function(){
            clearTimeout(tmrId);
            tmrId = undefined;
            waitPosition(true);
        },5000);
    
    }
    
     function remoteMaximize (wid,cb) {
         
         const meta = open_windows[wid];
         if (!meta) return;
         
         
         remoteReposition(
             wid,0,0,screen.availWidth,screen.availHeight,
             function (err,prevLeft,prevTop,prevWidth,prevHeight) {
                 if ( 0===prevLeft&&
                      0===prevTop&&
                      screen.availWidth===prevWidth&&
                      screen.availHeight===prevHeight
                   ) return cb ();// was already maximized
                 
                 // send previous position back as restore command
                 cb (undefined,[
                    [ win_moveTo,  [ 0,0 ]                 ],
                    [ win_resizeTo,[ prevWidth,prevHeight] ],
                    [ win_moveTo,  [ prevLeft,prevTop]     ]
                ]);
             });
     } 
     
     
             
     function maximize (wid,cb) {
        
        const meta = open_windows[wid];
        if (!meta) return;
        
        
        const 
        
        prevLeft  = meta.win.screenX,
        prevTop   = meta.win.screenY,
        prevWidth = meta.win.outerWidth,
        prevHeight= meta.win.outerHeight;
        
        restoreCapturedState(getMaximizedPosition(meta.win));
        
        if ( 0===prevLeft &&
             0===prevTop  &&
             screen.availWidth===prevWidth&&
             screen.availHeight===prevHeight
          ) return cb ();// was already maximized
        
        // send previous position back as restore command
        cb (undefined,[
           [ win_moveTo,  [ 0,0 ]                 ],
           [ win_resizeTo,[ prevWidth,prevHeight] ],
           [ win_moveTo,  [ prevLeft,prevTop]     ]
       ]);
    } 
        
             
     function minimize (wid,cb) {
         
         const meta = open_windows[wid];
         if (!meta) return;
         
         
         const 
         
         prevLeft  = meta.win.screenX,
         prevTop   = meta.win.screenY,
         prevWidth = meta.win.outerWidth,
         prevHeight= meta.win.outerHeight;
         
         restoreCapturedState(getMinimizedPosition(meta.win));
         
         if ( minimizedLeft   === prevLeft &&
              minimizedTop    === prevTop &&
              minimizedWidth  === prevWidth&&
              minimizedHeight === prevHeight
           ) return cb ();// was already maximized
         
         // send previous position back as restore command
         cb (undefined,[
            [ win_moveTo,  [ 0,0 ]                 ],
            [ win_resizeTo,[ prevWidth,prevHeight] ],
            [ win_moveTo,  [ prevLeft,prevTop]     ]
        ]);
     }     
         
     function remoteMinimize (wid,cb) {
         
         const meta = open_windows[wid];
         if (!meta) return;
         
         const 
         
         newLeft   = screen.availWidth-minimizedWidth,
         newTop    = screen.availHeight-minimizedHeight;

         remoteReposition(
             wid,newLeft,newTop,minimizedWidth,minimizedHeight,
             function (err,prevLeft,prevTop,prevWidth,prevHeight) {
                 if ( newLeft         === prevLeft&&
                      newTop          === prevTop&&
                      minimizedWidth  === prevWidth&&
                      minimizedHeight === prevHeight
                   ) return cb ();// was already maximized
                 
                 // send previous position back as restore command
                 cb (undefined,[
                     
                    [ win_moveTo,   [0,0]                  ],
                    [ win_resizeTo, [prevWidth,prevHeight] ],
                    [ win_moveTo,   [prevLeft,prevTop]     ]
                    
                ]);
             });
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