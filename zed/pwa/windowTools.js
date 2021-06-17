/*global self*/
(function(whoami,exports,Lib,libArgs){const n = Lib.name,x=whoami==="Window"&&exports[n]===undefined?Object.defineProperty(exports,n,{value:Lib.apply(this,libArgs),enumerable:true,configurable:true}):undefined;})(typeof self==="object"&&self.constructor.name||"Nobody",self,
   function wTools(setKey_,getKey) {
    
        const 
        
        On     = 'addEventListener',
        Off    = 'removeEventListener',
        events = {
            open  : [],
            close : [],
            setKey   : [],
        },
        open_windows = {},
        lib = {
            open : function ( url,
                              name,
                              left,
                              top,
                              width,
                              height,
                              size ) {
                let w = openWindow(
                  url,
                  name,
                  left,
                  top,
                  width,
                  height,
                  size,
                  function (w){
                      const wid = getWindowId(w)
                      events.closed.forEach(function(fn){
                          fn(w,wid);
                      });
                      delete open_windows[wid];
                  } ,
                  function (w){
                      const wid = getWindowId(w);
                      events.open.forEach(function(fn){
                          fn(w,wid);
                      });
                  } 
                );
                
               return getWindowId(w);
            },
            open2 : function ( url, title,left,top ) {
                let w = openWindow(
                  url,
                  undefined,
                  left,
                  top,
                  undefined,
                  undefined,
                  undefined,
                  onClose,
                  onOpen 
                );
                
                const wid  = getWindowId(w);
                const meta = open_windows[wid];
                
                function onOpen(win,wid,meta){
                    
                    
                    if (!meta.cross) {
                        
                        if (title) {
                            if (win.document.title!==title)
                            win.document.title=title;
                        }
                    
                        on_window_move (win,function(left,top){
                            savePos(url,left,top);
                        });
                    
                    }
                    
                    events.open.forEach(function(fn){
                        fn(win,wid,meta);
                    });
                }
                
                
                function onClose(win,wid,meta){
                    events.close.forEach(function(fn){
                        fn(w,wid,meta);
                    });
                    savePos(w);
                    delete open_windows[wid];
                } 
                 
            },
            
            getWindow : function(wid) {
                return open_windows [wid];
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
              }
        };
         
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
              };
              
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
        
        function savePos(w,left,top,cb) {
            cb = typeof cb==='function'?cb:function(storeName){console.log(storeName,"updated")};
            const isWindow  = typeof w+typeof left+typeof top === 'objectundefinedundefined' && w.constructor.name==="Window";
            const storeName = storageName (isWindow ? w.location.href : w);
            const settings  = isWindow ? {left  : w.screenX, top : w.screenY} : typeof left+typeof top === 'numbernumber' ? { left : left, top: top }: false;
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
                  M[key]=meta[key];
               });
           });
           
            setKey ( 
               "windowTools.openWindows",
               metas,
               function(){
                   
                   if (typeof cb==='function') {
                       return cb.apply(THIS,Array.isArray(args) ? args:[]);
                   }
                   
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
          const doOpen = function () {
                 
              var opts =
                 "toolbar=no,menubar=no,location=no"+
                 ",resizable=" + (size ? "yes" : "no") +
                 ",scrollbars=" + (size ? "yes" : "no") +
                 (typeof top==='number'    ? ",top="    + top+",screenY="    + top    : "" )+
                 (typeof left==='number'   ? ",left="   + left+",screenX="   +  left  : "" )+
                 (typeof width==='number'  ? ",width="  + width  : "" )+
                 (typeof height==='number' ? ",height=" + height : "" ),
                 
               // if a name is specified, use that, otherwise make up a random name
               w = window.open(url, name||"w_"+wid, opts);
               if (w) {
                   // if a name was specified, and it was reactivated instead of opened, it will be located 
                   // by getWindowId(w), otherwise, make up a new window id
                   const opened_id = getWindowId(w)||windowId();
                   const meta = open_windows[opened_id] = {
                       win       : w,
                       lastTouch : Date.now(),
                       cross     : false
                   }; 
                   
                   try {
                       w.wid = opened_id;
                   } catch (e) {
                       meta.cross=true;
                   }

                   on_window_open  (w,function(){
                      if (!meta.cross && typeof left+typeof top==='numbernumber' && (w.screenX!==left || w.screenY!==top) ) {
                         w.moveTo(left,top);
                      }
                      
                      if (!meta.cross && typeof width+typeof height==='numbernumber' && (w.outerWidth!==width || w.outerHeight!==height) ) {
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
                   left = pos.left || left;
                   top  = pos.top  || top;
                   doOpen();
                } else {
                   savePos(url,left,top,doOpen); 
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