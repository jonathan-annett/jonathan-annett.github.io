/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, swResponseZipLib  */
ml([],function(){ml(2,

    {
        Window: function openWindowLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        }
    }, {
        Window: [
            ()=> openWindowLib ()
        ]

    }

    );


    function openWindowLib () {
        
        const lib = {
            open_url         : open_url,
            close_all_urls   : close_all_urls,
            open_window      : open_window,
            on_window_close  : on_window_close,
            on_window_open   : on_window_open
        }  ;
        
        
        var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
        
        var open_urls = [];
        
        function open_url(file_url,cb) {
            return open_window(
              file_url,
              file_url.replace(/\/|\:|\.|\-/g,''),
              0,
              0,
              1024,
              768,
              true,
              function onClosed(w){ 
                  const ix = open_urls.indexOf(w);
                  if (ix>=0) open_urls.splice(ix,1);
                  if (cb) cb ("closed",w);
              },
              function onOpened(w){ 
                  open_urls.push(w); 
                  if (cb) cb ("opened",w);
              }
            );
        }
        
        
        
        function close_all_urls  ( delay ) {
            
            if (delay) return  setTimeout(close_all_urls,delay);
            
            open_urls.slice().forEach(function(w){
                try {
                  w.close();
                } catch (e) {
                }
            });
            
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
          // sync return is a string refering to future open window.
              var opts =
                 "toolbar=no,menubar=no,location=no"+
                 ",resizable=" + (size ? "yes" : "no") +
                 ",scrollbars=" + (size ? "yes" : "no") +
                 (typeof top==='number'    ? ",top="    + (top-deltaTop).toString()+     ",screenY="    + top    : "" )+
                 (typeof left==='number'   ? ",left="   + (left-deltaLeft).toString()+   ",screenX="   +  left  : "" )+
                 (typeof width==='number'  ? ",width="  + (width-deltaWidth).toString()   : "" )+
                 (typeof height==='number' ? ",height=" + (height-deltaHeight).toString() : "" );
                 
               // if a name is specified, use that, otherwise make up a random name
               const w = window.open(url, name, opts);
               
               on_window_close(w,onClosed);
               on_window_open(w,onOpened);
               
               return w;
        }
        
        function on_window_close(w, fn) {
          if (typeof fn === "function" && w && typeof w === "object") {
            setTimeout(function() {
              if (w.closed) return fn(w);
        
              try {
                w.addEventListener("beforeunload",unloading);
              } catch (err) {
                // console.log(err);
                var fallback = function() {
                  if (w.closed) return fn(w);
                  setTimeout(fallback, 500);
                };
                setTimeout(fallback, 500);
              }
              function unloading(){
                  w.removeEventListener("beforeunload",unloading);
                  fn(w);
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
              w.addEventListener("load", function(){fn(w);});// this will throw for cross domain windows
            } catch (err) {
              //wait until 1 subfram exiss or 2 seconds, whatever happens first
              setTimeout(on_window_open_poller, 100, w, fn);
            }
          }
        }
        
       
        
        return lib;
    }

 

});

