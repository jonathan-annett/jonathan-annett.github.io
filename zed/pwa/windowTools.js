/*global self*/
(function(whoami,exports,Lib){const n = Lib.name,x=whoami==="Window"&&exports[n]===undefined?Object.defineProperty(exports,n,{value:Lib(),enumerable:true,configurable:true}):undefined;})(typeof self==="object"&&self.constructor.name||"Nobody",self,
   function wTools() {
    
            var On='addEventListener';
            
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
                     w.removeEventListener("resize", check);
                     w.removeEventListener("focus", check);
                     w.removeEventListener("blur", check);
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
            
            function loadPos(url) {
                const json = localStorage.getItem(storageName(url));
                if (json) {
                    try {
                        return JSON.parse(json);
                    } catch (e) {
                    }
                }
                return {
                    left : undefined,
                    top  : undefined
                }
            }
            
            function savePos(w,left,top) {
                const isWindow  = typeof w+typeof left+typeof top === 'objectundefinedundefined' && w.constructor.name==="Window";
                const storeName = storageName (isWindow ? w.location.href : w);
                const settings  = isWindow ? {left  : w.screenX, top : w.screenY} : typeof left+typeof top === 'numbernumber' ? { left : left, top: top }: false;
                if (typeof storeName+ typeof settings === 'stringobject' && storeName.length>0) {
                    localStorage.setItem( storeName, JSON.stringify(settings) );
                }
            }
            
            function open_window(
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
              
              var pos = loadPos( url );
              
              if (pos) {
                 left = pos.left || left;
                 top  =  pos.top  || top;
              } else {
                  savePos(url,left,top); 
              } 
                
               var opts =
                  "toolbar=no, menubar=no, location=no"+
                  ", resizable=" + (size ? "yes" : "no") +
                  ", scrollbars=" + (size ? "yes" : "no") +
                  (typeof top==='number'    ? ", top="    + top.toString()   : "" )+
                  (typeof left==='number'   ? ", left="   + left.toString()  : "" )+
                  (typeof width==='number'  ? ", width="  + width.toString() : "" )+
                  (typeof height==='number' ? ", height=" + height.toString(): "" ),
                  
                // if a name is specified, use that, otherwise make up a random name
                w = window.open(url, name||"w_"+windowId(), opts);
                
                // if a name was specified, and it was reactivated instead of opened, it will be located 
                // by getWindowId(w), otherwise, make up a new window id
                const opened_id = getWindowId(w)||windowId();
                open_window.open_windows[opened_id]={
                    win:w,
                    lastTouch : Date.now()
                }; 
                if (w) {
                  on_window_open  (w,onOpened);
                  on_window_close (w,onClosed);
                }
                
                try {
                    w.wid = opened_id;
                } catch (e) {
                    // this will fail if the window is cross origin.
                }
               
                return w;// return then actual window.
            }
            
            open_window.open_windows = {};
            
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
                return Object.keys(open_window.open_windows).find(function(wid){
                      if ( open_window.open_windows[wid].win===w ) {
                        
                         if (!cross_origin) {
                             try {
                                 // cache it for next time
                                 w.wid=wid;
                             } catch (e) {
                                 
                             }
                         }
                         
                         return w; 
                      }
                 });
            }
            
            var events = {
                open  : [],
                close : []
            }, 
            
            lib = {
                open : function ( url,
                                  name,
                                  left,
                                  top,
                                  width,
                                  height,
                                  size ) {
                    let w = open_window(
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
                          delete open_window.open_windows[wid];
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
                open2 : function ( url, title ) {
                    let w = open_window(
                      url,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      undefined,
                      function (w){
                          const wid = getWindowId(w)
                          events.closed.forEach(function(fn){
                              fn(w,wid);
                          });
                          delete open_window.open_windows[wid];
                      } ,
                      function (w){
                          const wid = getWindowId(w);
                          if (title) {
                              try {
                                  if (w.document.title!==title)
                                  w.document.title=title;
                              } catch(e) { /* cross origin */}
                          }
                          events.open.forEach(function(fn){
                              fn(w,wid);
                          });
                      } 
                    );
                    
                     
                },
                getWindow : function(wid) {
                    return open_window.open_windows [wid];
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
    
    }
);