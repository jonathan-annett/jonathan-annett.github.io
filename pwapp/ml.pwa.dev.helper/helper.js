 (function (){
     /*global BroadcastChannel*/
       var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
       
       var 
       editor_url  = window.parent.location.href.replace(/\/$/,'')+'/edit',
       editor_channel_name = "ch_"+editor_url.replace(/\/|\:|\.|\-/g,''),
       editor_channel = new BroadcastChannel(editor_channel_name),
       editor_win,
       open_stylesheets={};
       
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
               const p = (window.parent.opener||window.parent);
               
               if (window.parent.opener) {
                   p.setTimeout ( p.ml.i.openWindowLib.close_all_urls,10);
               }
               p.setTimeout (p.location.replace,50,p.location.pathname.replace(/\/$/,'') +'/stopping?stop-service-worker='+p.location.pathname);
               
               
           }
           
           
           if (event.data && event.data.get_stylesheets 
                          && event.data.get_stylesheets.urlprefix
                          && event.data.get_stylesheets.replyId ) {
               
               editor_channel.postMessage({
                   replyId: event.data.get_stylesheets.replyId,
                   result: get_stylesheets( event.data.get_stylesheets.urlprefix) 
               });
               
           } 
           
           if (event.data && event.data.get_scripts 
                          && event.data.get_scripts.urlprefix
                          && event.data.get_scripts.replyId ) {
               
               editor_channel.postMessage({
                   replyId: event.data.get_scripts.replyId,
                   result: get_scripts( event.data.get_scripts.urlprefix) 
               });
               
           } 
           
           
           
           
           
           if (event.data && event.data.open_stylesheet 
                          && event.data.open_stylesheet.url
                          && event.data.open_stylesheet.withCSS
                          && event.data.open_stylesheet.replyId ) {
               
               editor_channel.postMessage({
                   replyId: event.data.open_stylesheet.replyId,
                   result: open_stylesheet( event.data.open_stylesheet.url,
                                            event.data.open_stylesheet.withCSS,
                                            event.data.open_stylesheet.replyId ) 
               });
               
           } 
           
           if (event.data && event.data.update_stylesheet
                          && event.data.update_stylesheet.url
                          && event.data.update_stylesheet.updatedCSS
                          && event.data.update_stylesheet.replyId ) {
               const url = event.data.update_stylesheet.url;
               const sheet = open_stylesheets[url];
               if (sheet){
                   sheet.update(event.data.update_stylesheet.updatedCSS);
               }
           }
           
           
           if (event.data && event.data.close_stylesheet
                          && event.data.close_stylesheet.url ) {
               const url = event.data.close_stylesheet.url;
               const sheet = open_stylesheets[url];
               if (sheet){
                   sheet.close(event.data.close_stylesheet.reload);
               }
           }
       };
       
       document.body.querySelector("#r").onclick = function(){
            if (editor_win) {
                editor_win.close();
                editor_win=undefined;
                
            }
            sessionStorage.removeItem(editor_channel_name);
            sessionStorage.removeItem('running');
            const p = (window.parent.opener||window.parent);
               
            p.location = p.location.pathname.replace(/\/$/,'') +'/stopping?stop-service-worker='+p.location.pathname;
        };
       document.body.querySelector("#e").onclick = function(){
            if (editor_win) {
                editor_win.close();
                editor_win=undefined;
            } else {
                editor_win = open_url (editor_url); 
            }
            
        };
        
        
 function get_stylesheets (urlprefix) {
     const 
      url_filter = function(x){ return x.indexOf(urlprefix)===0;},
      result = [].map.call(window.top.document.body.querySelectorAll('link[rel="stylesheet"]'),function(x){
          return x.href;}).filter(url_filter);
          
  
      get_docs(urlprefix,window.top).forEach(function(doc){
          [].push.apply(
              result,
              [].map.call( doc.body.querySelectorAll('link[rel="stylesheet"]'), function(x){ return x.href; }).filter(url_filter)
          );
     });
     
     return result.filter(function(x,i){
         return result.indexOf(x)===i;
     });
     

 }
 
 function get_docs (urlprefix,win,result) {
     
     if (!result) return get_docs (urlprefix,win,[]);
     
     const iframewins = [].map.call(win.document.body.querySelectorAll('iframe'))
        
        .filter( 
            function(iframe){ return iframe.src.indexOf(urlprefix)===0}
        ).map (
            function (iframe) {return iframe.contentWindow;}
        ) ;
        
     iframewins.foreach(function(win) {
        result.push(win.document);
        const childDocs = get_docs(urlprefix,win);
        [].push.apply(result,childDocs.splice(0,childDocs.length));
     });
     
     return result;
 }
 
     function get_scripts (urlprefix) {
     
     const 
     url_filter = function(x){ return x.indexOf(urlprefix)===0;},
     result = [].map.call(window.top.document.body.querySelectorAll('script'),function(x){
         return x.src;}).filter(url_filter);
         
     [].push.apply(
         result,
         [].map.call(
             window.top.document.head.querySelectorAll('script'),
             function(x){ return x.src;
          }).filter(url_filter)
     );
    
      
     if (window.top.ml) {
        [].push.apply(
             result,
             window.top.ml.H.filter(url_filter)
         );
     }
     
     get_docs(urlprefix,window.top).forEach(function(doc){
         [].push.apply(
             result,
             [].map.call( doc.body.querySelectorAll('script'), function(x){ return x.src; }).filter(url_filter)
         );
    });
    
    return result.filter(function(x,i){
        return result.indexOf(x)===i;
    });
    
 }
 
 function open_stylesheet(url,withCSS,replyId) {
    
    return [].slice.call(window.top.document.head.querySelectorAll('link[rel="stylesheet"]')).some(function(el){
        
        if (el.href.indexOf(url)!==0) return false;
          const sheet = el;
          const sheet_parent = sheet.parentNode;
          const fakeSheet   = sheet_parent.insertBefore(window.top.document.createElement("style"),sheet);
          const cssTextNode = window.top.document.createTextNode(withCSS);

          sheet_parent.removeChild(sheet);
          
          fakeSheet.type = 'text/css';
          if (fakeSheet.styleSheet){
             // This is required for IE8 and below.
             fakeSheet.styleSheet.cssText = withCSS;
          } else {
             fakeSheet.appendChild(cssTextNode);
          }    
          open_stylesheets[url] = {
              poller : setTimeout(poll,1000),
              fakeSheet:fakeSheet,
              sheet : sheet,
              sheet_parent : sheet_parent,
              update : function (updatedCSS) {
                  
                  if (open_stylesheets[url].poller) {
                      clearTimeout(open_stylesheets[url].poller);
                      open_stylesheets[url].poller=undefined;
                  }
                  
                  if (fakeSheet.styleSheet){
                     // This is required for IE8 and below.
                     fakeSheet.styleSheet.cssText = updatedCSS;
                  } else {
                     cssTextNode.textContent = updatedCSS;
                  }
                  withCSS=updatedCSS;
                  open_stylesheets[url].poller = setTimeout(poll,1000);
              },
              close : function (reload){
                  if (open_stylesheets[url].poller) {
                      clearTimeout(open_stylesheets[url].poller);
                      open_stylesheets[url].poller=undefined;
                  }
                  
                  if (reload) {
                      var link = window.top.document.createElement('link'); 
                
                      // set the attributes for link element
                      link.rel = 'stylesheet'; 
                    
                      link.type = 'text/css';
                    
                      link.href = url; 

                      sheet_parent.insertBefore(link,fakeSheet);
                      sheet_parent.removeChild(fakeSheet);
                  } else {
                      sheet_parent.insertBefore(sheet,fakeSheet);
                      sheet_parent.removeChild(fakeSheet);
                      
                  }
                  delete open_stylesheets[url].poller;
                  delete open_stylesheets[url].fakeSheet;
                  delete open_stylesheets[url].sheet_parent;
                  delete open_stylesheets[url].sheet;
                  delete open_stylesheets[url];
              },
          };
        
        return true;
        
        function poll() {
            
           open_stylesheets[url].poller = setTimeout(poll,1000);
           
           if (fakeSheet.styleSheet){
              // This is required for IE8 and below.
              if (fakeSheet.styleSheet.cssText !== withCSS) {
                 withCSS = fakeSheet.styleSheet.cssText; 
                 editor_channel.postMessage({css_changed:{css:withCSS,url:url},replyId:replyId});
              }
           } else {
              if (cssTextNode.textContent !== withCSS) {
                withCSS = cssTextNode.textContent; 
                editor_channel.postMessage({css_changed:{css:withCSS,url:url},replyId:replyId});
              }
           }
          
        }
        
    });
 }
 
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
 