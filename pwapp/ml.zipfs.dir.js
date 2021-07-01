/* global zip_url_base,parent_link*/

var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
 
window.addEventListener('DOMContentLoaded', onDOMContentLoaded);

function onDOMContentLoaded (event){

    const showHidden=document.querySelector("h1 input.hidden_chk");
    if (showHidden) {
        showHidden.onchange = function() {
            qs("ul").classList[showHidden.checked?"remove":"add"]("hide_hidden");
        };
    }
    
    const showPaths=qs("h1 input.fullpath_chk");
    if (showPaths) {
        showPaths.onchange = function() {
           qs("ul").classList[showPaths.checked?"remove":"add"]("hide_full_path");
        };
    }
    
    
    const inputModal = qs("#inputModal");
    
    qs("div.modal-content span.close",function click(){
        inputModal.style.display = "none";
    });
    // When the user clicks anywhere outside of the modal, close it
    window.onclick = function(event) {
      if (event.target == inputModal) {
        inputModal.style.display = "none";
        }
    }
    
    const filename_input = qs("#newfilename",function keydown(e){
        if (e.keyCode===27) {
            inputModal.style.display = "none";
        } else {
           if (e.keyCode===13) {
               inputModal.style.display = "none";
               let filename = filename_input.value.trim();
               if (filename.length >0) {
                   const file_url = zip_url_base + filename;
                   updateURIContent(file_url,'\n',function(){
                       qs("ul",function(el){
                           let newid="li_"+Math.random().toString(36).substr(-8);
                           el.innerHTML=html_file_item(newid,filename);
                           addViewClick(qs("#"+newid+" a span.normal"));
                           addOpenZipViewClick(qs("#"+newid+" a span.zipfile"));
                           
                           let edBtn = qs("#"+newid+" a span.editinzed");
                           if (edBtn) {
                               addEditClick(edBtn);
                               edBtnClick({target:edBtn,preventDefault(){}});
                           }
                           
                       })
                   });
               }
           }
        }
    });
    
    qs("h1 a.download",function click(){
        
    });
    
    qs("h1 a.newfile",function click(){
        inputModal.style.display = "block";
    });
        
    [].forEach.call(document.querySelectorAll("li a span.editinzed"),addEditClick);
    
    [].forEach.call(document.querySelectorAll("li a span.normal"),addViewClick);
    
    [].forEach.call(document.querySelectorAll("li a span.zipfile"),addOpenZipViewClick);
    
}

function addEditClick (el) {
    if (el) {
      el.addEventListener("click",edBtnClick);
      el.parentElement.addEventListener("click",edBtnClick);
    }
}

function addViewClick (el) {
    if (el) {
        el.addEventListener("click",viewBtnClick);
        el.parentElement.addEventListener("click",viewBtnClick);
    }
}

function addOpenZipViewClick (el) {
    if (el) {
        el.addEventListener("click",openZipBtnClick);
        el.parentElement.addEventListener("click",openZipBtnClick);
    }
}


function updateURIContent(file_url,content,cb) {
    
   var update = new XMLHttpRequest();
   update.open('PUT', file_url, true);
   
   update.setRequestHeader('Content-type', 'text/plain');
   
   update.onreadystatechange = function() { 
       if(update.readyState === XMLHttpRequest.DONE) {
         if (typeof cb==='function') {
             var status = update.status;
            cb (undefined,(status === 0 || (status >= 200 && status < 400))); 
            cb=undefined;
         }
       }
   };
   update.onerror = function(err) { 
       if (typeof cb==='function') {
           cb(err);
           cb=undefined;
       }
   };
   
   update.send(new Blob([content], {type: 'text/plain'})); 
}

function html_file_item (id,filename){
    
    
    const linkit=function(uri,disp,a_wrap){ 
        a_wrap=a_wrap||['<a href="'+uri+'">','</a>'];
        const split=(disp||uri).split("/");
        if (split.length===1) return a_wrap.join(disp||uri);
        const last = split.pop();
        if (split.length===1) return split[0]+'/'+ a_wrap.join(last);
        return split.join("/")+'/'+ a_wrap.join(last);
    };

   const full_uri = zip_url_base+"/"+filename,
         basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
   const edited_attr  = ' data-balloon-pos="right" aria-label="'            + basename + ' has been edited locally"';
   const edit_attr    = ' data-balloon-pos="down-left" aria-label="Open '       + basename + ' in zed"'; 
   const zip_attr     = ' data-balloon-pos="down-left" aria-label="...explore ' + basename + ' contents" "' ;
   const is_hidden    = false;
   const is_deleted   = false;
   const is_editable  = true;
   const is_zip       = false;
   const is_edited    = true;
   
   const edited       = is_edited ? '<span class="edited"'+edited_attr+'>&nbsp;&nbsp;&nbsp;</span>' : '';
   const cls = is_deleted ? ["deleted"] : [];
   if (is_edited)  cls.push("edited");
   if (is_hidden)  cls.push("hidden");
   const li_class     = cls.length===0 ? '' : ' class="'+cls.join(' ')+'"';
   
   const zedBtn =   is_editable   ? [ '<a'+edit_attr+ ' data-filename="' + filename + '"><span class="editinzed">&nbsp;</span>',  '</a>' + edited ] 
                  : is_zip        ? [ '<a'+zip_attr+  ' href="'+zip_url_base+'/' + filename + '"><span class="zipfile">&nbsp;</span>',    '</a>' + edited ]   
                  :                 [ '<a data-filename="'               + filename + '"><span class="normal">&nbsp;</span>',     '</a>' + edited ] ;
   
   return '<li id="'+id+'" '+li_class+'><span class="full_path">' + parent_link +'/</span>' +linkit(full_uri,filename,zedBtn) + '</li>';
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
                        
                        updateURIContent(file_url,detail.content,function(){
                            li.classList.add("edited");
                        });
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

function qs(d,q,f) {
    let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
    if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
    if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
    if (D+Q===O+S){
       r = d.querySelector(q);
       if (r&&typeof r+typeof f===O+FN) {
            if (f.name.length>0) 
               r.addEventListener(f.name,f);
            else 
               f(r);
        }
    }
    return r;
}
