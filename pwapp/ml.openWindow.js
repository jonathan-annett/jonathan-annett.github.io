/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
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
            open_html        : open_html,
            open_url         : open_url,
            open_window      : open_window,
            on_window_close  : on_window_close,
            on_window_open   : on_window_open
        }  ;
        
        
        var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
        
        
        function open_url(file_url,cb) {
            return open_window(
              file_url,
              file_url.replace(/\/|\:|\.|\-/g,''),
              0,
              0,
              1024,
              768,
              true,
              function onClosed(w){ if (cb) cb ("closed",w);},
              function onOpened(w){ if (cb) cb ("opened",w);}
            );
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
              if (w.closed) return fn();
        
              try {
                w.addEventListener("beforeunload", fn);
              } catch (err) {
                // console.log(err);
                var fallback = function() {
                  if (w.closed) return fn();
                  setTimeout(fallback, 500, w, fn);
                };
                setTimeout(fallback, 500);
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

