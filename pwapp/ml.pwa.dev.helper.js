 (function (){
     /*global BroadcastChannel*/
       var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
       
       var 
       editor_url  = window.parent.location.href.replace(/\/$/,'')+'/edit',
       editor_channel_name = "ch_"+editor_url.replace(/\/|\:|\.|\-/g,''),
       editor_channel = new BroadcastChannel(editor_channel_name),
       editor_win;
       
       if (sessionStorage.getItem(editor_channel_name)==='1') {
           document.body.querySelector("#e").classList.add("editing");
           editor_win = open_url (editor_url); 
       }
       
       editor_channel.onmessage=function(event) {
           if (event.data && event.data.refresh) {
               window.parent.location.replace(window.parent.location.href);
           }
           
           if (event.data && event.data.stop) {
               if (editor_win) {
                   editor_win.close();
                   editor_win=undefined;
               }
               sessionStorage.removeItem(editor_channel_name);
               sessionStorage.removeItem('running');
               window.parent.location = 'stop';
           }
       }
       

        document.body.querySelector("#r").onclick = function(){
            if (editor_win) {
                editor_win.close();
                editor_win=undefined;
                
            }
            sessionStorage.removeItem(editor_channel_name);
            sessionStorage.removeItem('running');
            window.parent.location = 'stop';
        };
        document.body.querySelector("#e").onclick = function(){
            if (editor_win) {
                editor_win.close();
                editor_win=undefined;
            } else {
                editor_win = open_url (editor_url); 
                
            }
            
        };
        
        
 
 
 function open_url(file_url,win_name) {
     return open_window(
       file_url,
       file_url.replace(/\/|\:|\.|\-/g,''),
       0,
       0,
       1024,
       768,
       true,
       function onClosed(){
           editor_win=undefined;
           document.body.querySelector("#e").classList.remove("editing");
           sessionStorage.removeItem(editor_channel_name);
       },
       function onOpened(){
           document.body.querySelector("#e").classList.add("editing");
           sessionStorage.setItem(editor_channel_name,'1');
       }
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
 
 })();
 