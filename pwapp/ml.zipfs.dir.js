/* global zip_url_base*/

var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
 
window.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function onDOMContentLoaded (event){

    const showHidden=document.querySelector("h1 input.hidden_chk");
    if (showHidden) {
        showHidden.onchange = function() {
            document.querySelector("ul").classList[showHidden.checked?"remove":"add"]("hide_hidden");
        };
    }
    
    const showPaths=document.querySelector("h1 input.fullpath_chk");
    if (showPaths) {
        showPaths.onchange = function() {
            document.querySelector("ul").classList[showPaths.checked?"remove":"add"]("hide_full_path");
        };
    }
    
    
        
    [].forEach.call(document.querySelectorAll("li a span.editinzed"),addEditClick);
    
    [].forEach.call(document.querySelectorAll("li a span.normal"),addViewClick);
    
    [].forEach.call(document.querySelectorAll("li a span.zipfile"),addOpenZipViewClick);
    
}

function addEditClick (el) {
    el.addEventListener("click",edBtnClick);
    el.parentElement.addEventListener("click",edBtnClick);
}

function addViewClick (el) {
    el.addEventListener("click",viewBtnClick);
    el.parentElement.addEventListener("click",viewBtnClick);
}

function addOpenZipViewClick (el) {
    el.addEventListener("click",openZipBtnClick);
    el.parentElement.addEventListener("click",openZipBtnClick);
}


function edBtnClick(e){
    e.preventDefault();
    const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
    const li = btn.parentElement;
    const filename = '/'+btn.dataset.filename.replace(/(^\/)/,'');
    const file_url = zip_url_base + filename;
    if (!e.shiftKey) {
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function reqListener () {
            var content = this.responseText;
            li.classList.add("editing");
            editInZed(filename,content,function(detail){
              
                if (detail.closed ) {
                    li.classList.remove("editing");
                } else {
              
                    if (detail.content) {
                        content = detail.content;
                        li.classList.add("edited");
                        var update = new XMLHttpRequest();
                        update.open('UPDATE', file_url, true);
                        
                        update.setRequestHeader('Content-type', 'text/plain');
                        
                        update.onreadystatechange = function() { 
                        };
                        update.onerror = function() { 
                        };
                        
                        update.send(new Blob([content], {type: 'text/plain'}));
                    }
                }
                
            });
        });
        oReq.open("GET", file_url);
        oReq.send();
    } else {
        
        open_url(file_url);
    }
}

function editInZed(filename,content,cb) {
    
    
    window.dispatchEvent(
        new CustomEvent( 'editinzed',{ detail: {filename,content} })
    );
    window.addEventListener('editinzed_callback',editInZedCallback);
    
    function editInZedCallback (event){
        
        if (event.detail.filename===filename) {
            
            if (event.detail.closed) {
                window.removeEventListener('editinzed_callback',editInZedCallback);
                console.log(filename,"closed");
                cb(event.detail);
            } else {
                if (typeof event.detail.content==='string') {
                    if (event.detail.content!==content) {
                         event.detail.previousContent=content;
                         cb(event.detail);
                         content = event.detail.content;
                    }
                }
            }
        }

    }
    
    
    
}

function viewBtnClick(e){
        e.preventDefault();
        const btn      = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
        const filename = '/'+btn.dataset.filename.replace(/(^\/)/,'');
        const file_url = zip_url_base + filename;
        
        open_url(file_url);

}

function openZipBtnClick(e){
       if (!e.shiftKey) {
           return;
       }
       
        e.preventDefault();
        const link      = e.target.href ? e.target : e.target.parentElement ;
        open_url(link.href);
        
       
}

function open_url(file_url) {
    return open_window(
      file_url,
      file_url.replace(/\/|\:|\.|\-/g,''),
      0,
      0,
      1024,
      768,
      true,
      function onClosed(){},
      function onOpened(){}
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