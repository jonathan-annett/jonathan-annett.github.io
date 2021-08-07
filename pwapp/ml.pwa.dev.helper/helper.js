 (function (){
     /*global BroadcastChannel*/
       var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
       
       var 
       editor_url  = window.parent.location.href.replace(/\/$/,'')+'/edit',
       editor_channel_name = "ch_"+editor_url.replace(/\/|\:|\.|\-/g,''),
       editor_channel = new BroadcastChannel(editor_channel_name),
       editor_win,
       open_stylesheets={},
       open_iframes={},
       open_scripts={};
       
       if (sessionStorage.getItem(editor_channel_name)==='1') {
           //document.body.querySelector("#e").classList.add("editing");
           //editor_win = open_url (editor_url); 
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
               sessionStorage.removeItem('no_keyboard');
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
           
           
           if (event.data && event.data.get_htmls 
                          && event.data.get_htmls.urlprefix
                          && event.data.get_htmls.replyId ) {
               
               editor_channel.postMessage({
                   replyId: event.data.get_htmls.replyId,
                   result: get_htmls( event.data.get_htmls.urlprefix) 
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
           
           
           
           if (event.data && event.data.open_html 
                          && event.data.open_html.url
                          && event.data.open_html.withHTML
                          && event.data.open_html.replyId ) {
               
               editor_channel.postMessage({
                   replyId: event.data.open_html.replyId,
                   result: open_html( event.data.open_html.url,
                                            event.data.open_html.withHTML,
                                            event.data.open_html.replyId ) 
               });
               
           } 
           
           if (event.data && event.data.update_html
                          && event.data.update_html.url
                          && event.data.update_html.updatedHTML
                          && event.data.update_html.replyId ) {
               const url = event.data.update_html.url;
               const html = open_iframes[url];
               if (html) {
                   html.update(event.data.update_html.updatedHTML)
               }
           }
           
           
           if (event.data && event.data.close_html
                          && event.data.close_html.url ) {
               const url = event.data.close_html.url;
              
           }
           
           
           
           
           
           if (event.data && event.data.open_script 
                          && event.data.open_script.url
                          && event.data.open_script.withHTML
                          && event.data.open_script.replyId ) {
               
               editor_channel.postMessage({
                   replyId: event.data.open_script.replyId,
                   result: open_html( event.data.open_script.url,
                                            event.data.open_script.withJS,
                                            event.data.open_script.replyId ) 
               });
               
           } 
           
           if (event.data && event.data.update_script
                          && event.data.update_script.url
                          && event.data.update_script.updatedJS
                          && event.data.update_script.replyId ) {
               const url = event.data.update_script.url;
               const script = open_iframes[url];
               if (script) {
                   script.update(event.data.update_script.updatedJS)
               }
           }
           
           
           if (event.data && event.data.close_script
                          && event.data.close_script.url ) {
               const url = event.data.close_script.url;
              
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
            
            if (window.parent.opener) {
                window.parent.close();
            }
            
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
      result = [].map.call(window.top.document.head.querySelectorAll('link[rel="stylesheet"]'),function(x){
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
     
     const iframewins = [].slice.call(win.document.body.querySelectorAll('iframe'))
        
        .filter( 
            function(iframe){ return iframe.src.indexOf(urlprefix)===0}
        ).map (
            function (iframe) {return iframe.contentWindow;}
        ) ;
        
     iframewins.forEach(function(win) {
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


function get_htmls (urlprefix) {
    
    const 
    url_filter = function(x){ return x.indexOf(urlprefix)===0;},
    result = [window.top.document.location.href];
        
    get_docs(urlprefix,window.top).forEach(function(doc){
        result.push(doc.location.href);
    });
   
    return result.filter(url_filter).filter(function(x,i){
       return result.indexOf(x)===i;
    });
   
}

 
function open_html(url,withHTML,replyId) {
   
   if (url==="self" || url===window.top.location.href) {
       
       open_iframes[url] = {
           original : withHTML,
           html   : withHTML,
           update : function (updatedHTML) {
               
               if (open_iframes[url].timeout) {
                   clearTimeout(open_iframes[url].timeout);
               }
               
               document.querySelector("html").classList.add("restarting");
               open_iframes[url].html    = updatedHTML;
               open_iframes[url].timeout = setTimeout(function () {
                  window.top.location.reload();
               },5000);
               
           },
           close  : function (reload){
               if (open_iframes[url].timeout) {
                   clearTimeout(open_iframes[url].timeout);
                   delete open_iframes[url].timeout;
               }
               if (!reload) {
                   
                   if (open_iframes[url].original!==open_iframes[url].html) {
                       window.top.location.reload();
                   } else {
                       delete open_iframes[url].original; 
                       delete open_iframes[url].html; 
                       document.querySelector("html").classList.remove("restarting");
                   }
               } else {
                   
                   window.top.location.reload();
               }
           },
       };
       

   } else {
   
       get_docs(window.top.location.origin,window.top).some(function(doc){
           if (doc.location.href===url) {
               open_iframes[url] = {
                   doc    : doc,
                   original : withHTML,
                   html   : withHTML,
                   update : function (updatedHTML) {
                       
                       if (open_iframes[url].timeout) {
                           clearTimeout(open_iframes[url].timeout);
                       }
                       open_iframes[url].html    = updatedHTML;
                       open_iframes[url].timeout = setTimeout(function () {
                          open_iframes[url].doc.innerHTML = open_iframes[url].html;
                       },5000);
                       
                   },
                   close  : function (reload){
                       if (open_iframes[url].timeout) {
                           clearTimeout(open_iframes[url].timeout);
                           delete open_iframes[url].timeout;
                       }
                       if (reload) {
                          open_iframes[url].doc.innerHTML = open_iframes[url].original;  
                       }
                   },
               };
               return true;
           }
       });

   }   
   
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
              poller       : setTimeout(poll,1000),
              fakeSheet    : fakeSheet,
              sheet        : sheet,
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
              close  : function (reload){
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
 