(function(functionName) {
    /*
  MIT License
Copyright (c) 2021 Jonathan Annett
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  
  */

    if (
    scriptCheck(
    ["cdpn.io", "codepen.io"],
        "jonathan-annett.github.io",
    functionName,
        "function")) return;

    window[functionName] = mobileDependancies;

    function scriptCheck(e, o, t, n) {
        /* jshint ignore:start*/
        if ("object" != typeof window || t && typeof window[t] === n) return !1;
        var r = document.getElementsByTagName("script"),
            s = r[r.length - 1].src;
        
        return !!s.startsWith("https://" + o + "/") && (!(e.concat([o]).indexOf(location.hostname) >= 0) && (console.error("PLEASE DON'T LINK TO THIS FILE FROM " + o), console.warn("Please download " + s + " and serve it from your own server."), !0))
        /* jshint ignore:end*/
        
    } 
    
    function append_CSS(CSS){ 
      var doc=document,rule = doc.createElement('style');
      rule.type = 'text/css';
      rule.innerHTML = CSS; 
      doc.getElementsByTagName('head')[0].appendChild(rule);
      return rule;
    }
    
    
    
    function dragElement(elmnt) {
        var pos1 = 0,
            pos2 = 0,
            pos3 = 0,
            pos4 = 0;
    
        addTouchToMouse(elmnt);
        elmnt.onmousedown = dragMouseDown;
    
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();
            // get the mouse cursor position at startup:
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;
            document.onmousemove = elementDrag;
        }
    
        function elementDrag(e) {
            e = e || window.event;
            e.preventDefault();
            // calculate the new cursor position:
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;
            // set the element's new position:
            elmnt.style.top = elmnt.offsetTop - pos2 + "px";
            elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
        }
    
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
        
      
    
        function addTouchToMouse(forEl) {
            doc = document;
    
            if (typeof forEl.removeTouchToMouse === "function") return;
    
            doc.addEventListener("touchstart", touch2Mouse, true);
            doc.addEventListener("touchmove", touch2Mouse, true);
            doc.addEventListener("touchend", touch2Mouse, true);
            var touching = false;
            
             function isValidTouch (el) {
                        if (el===forEl) return true;
    
                        if ((el.parentElement===forEl)&&["INPUT","A","BUTTON"].indexOf(el.tagName)<0) return true;
                    }
            function touch2Mouse(e) {
                var theTouch = e.changedTouches[0];
                var mouseEv;
    
                if (!isValidTouch(e.target)) return;
    
                switch (e.type) {
                    case "touchstart":
                        if (e.touches.length !== 1) return;
                        touching = true;
                        mouseEv = "mousedown";
                        break;
                    case "touchend":
                        if (!touching) return;
                        mouseEv = "mouseup";
                        touching = false;
                        break;
                    case "touchmove":
                        if (e.touches.length !== 1) return;
                        mouseEv = "mousemove";
                        break;
                    default:
                        return;
                } 
    
                var mouseEvent = document.createEvent("MouseEvent");
                mouseEvent.initMouseEvent(
                    mouseEv,
                    true,
                    true,
                    window,
                    1,
                    theTouch.screenX,
                    theTouch.screenY,
                    theTouch.clientX,
                    theTouch.clientY,
                    false,
                    false,
                    false,
                    false,
                    0,
                    null
                );
                theTouch.target.dispatchEvent(mouseEvent);
    
                e.preventDefault();
            }
    
            forEl.removeTouchToMouse = function removeTouchToMouse() {
                doc.removeEventListener("touchstart", touch2Mouse, true);
                doc.removeEventListener("touchmove", touch2Mouse, true);
                doc.removeEventListener("touchend", touch2Mouse, true);
            };
        }
    }
    
    function loadRemoteFile(url,cb) {
        if (typeof url==='string' && typeof cb==='function') {
            var xhr = new XMLHttpRequest();
            
            xhr.open('GET', url);
            if (cb.length>=2) {
                xhr.onload = function() {
                  if (xhr.status !== 200) { // analyze HTTP status of the response
                    cb({status:xhr.status,response:xhr.response}); // e.g. 404: Not Found
                  } else { // show the result
                    cb(undefined,xhr.response);
                  }
                };
            } else {
                xhr.onload = function() {
                  cb({status:xhr.status,response:xhr.response}); // e.g. 404: Not Found
                };
            }
            
            if (cb.length>=3) {
                xhr.onprogress = function(event) {
                  if (event.lengthComputable) {
                    cb(undefined,undefined,event.loaded,event.total);
                  } else {
                    cb(undefined,undefined,event.loaded);
                  }
                };
            }
            if (cb.length>=2) {
                xhr.onerror = function(e) {
                   cb(e||"error");
                };
            } else {
                xhr.onerror = function(e) {
                   console.error(e||"error");
                };
            }
            
            xhr.send();
        } 
       
    }
    
    var startTime=Date.now();
    loadRemoteFile("https://jonathan-annett.github.io/README.md",function(err,txt){
        var lag=Date.now()-startTime;
        if (!err && txt) {
            console.log(txt,lag);
        }
    });
    
     
    
     function mobileDependancies(scripts,callback,elements,scr) {
     //question: what is this?
     //answer: a way of refreshing the cache on mobile devices to enable development
     //not intended for production, as it's pretty heavy on bandwidth and slow to load a page
     //
     
       var
       url_cache_bust=window.location.search.indexOf('refresh=1')>=0,
       url_cache_bust_page=window.location.search==='?bust',
       
       cpArgs = Array.prototype.slice.call.bind (Array.prototype.slice),
           loaders = {
             js : function( src, callback ) {
               var cb_args=cpArgs(arguments,2),
                   doc=document,
                   script = doc.createElement( 'script' );
   
               script.onload=function(e){
                 cb_args.push(e.target);
                 callback.apply(this,cb_args);
               };
               script.setAttribute( 'src', src );
               doc.body.appendChild( script );
               return script;
             },
             css : function ( src, callback ) {
               var cb_args=cpArgs(arguments,2),
                   doc=document,
                   link = doc.createElement('link'),
                   head = doc.head || doc.getElementsByTagName('head')[0];
               link.setAttribute( 'rel', 'stylesheet' );
               link.onload=function(e){
                 cb_args.push(e.target);
                 callback.apply(this,cb_args);
               };
               link.setAttribute( 'href', src );
               head.appendChild(link);
               return link;
             }
     };
     
     
     if (url_cache_bust_page) {
         
         window.location.href=window.location.origin+window.location.pathname+'?refresh=1';
         return ;
     }
     
     var editorOnChange = function(editorData) {
          var editorValueNow=editorData.editor.value;
          if (editorData.value.length !== editorValueNow.length) {
              if (editorData.value != editorValueNow) {
                  editorData.value = editorValueNow;
                  console.log('changed');
                  editorData.element.innerHTML = editorValueNow ;
              }
          }
      };
     
     while (scripts && scripts.length && scripts.constructor===Array && typeof scripts[0] !== 'string' ) {
     
        if (typeof scripts[0] ==='object') {
           
            var fn=typeof scripts[0][0]==='string'?scripts[0][0].split('#')[0]:false;
           
            if (fn && fn.endsWith('.css') ) {
                if (typeof scripts[0][1]==='string' ) {
                    console.log('included inline stylesheet:',fn)
                    var sheet = append_CSS(scripts[0][1]);
                    var wrapper = document.createElement('div');
                    wrapper.className="draggable_wrapper";
                    
                    var edit_div = document.createElement('div');
                    edit_div.className="draggable";
                    
                    var h1 = document.createElement('h1');
                    var edit = document.createElement('textarea');
                    
                    
                    h1.innerHTML = fn.split('/').pop();
                    var editorData = {
                         editor : edit,
                         element  : sheet,
                         value  : scripts[0][1],
                    };
                                     
                    edit.innerHTML = editorData.value;
                   
                    
                    edit_div.appendChild(h1);
                    edit_div.appendChild(edit);
                    wrapper.appendChild(edit_div);
                    document.body.appendChild(wrapper);
                    
                    editorData.interval = setInterval(editorOnChange,500,editorData);
                     
                    
                    dragElement (edit_div);
                    
                    
                }
            }
            
            
            if (fn && fn.endsWith('.js') ) {
                if (typeof scripts[0][1]==='undefined' ) {
                    console.log('included inline script:',fn)
                }
            }
            
        }
        
        scripts.shift();
        
     }
   
     if (scripts && scripts.length && scripts.constructor===Array) {
       if (!elements) {
         elements=[]; 
       }
   
       var 
       src_ver=scripts[0].split('#'),
       src=src_ver[0],
       ver=src_ver[1]||false,
       ext=src.split('.').pop(),
       loader = loaders[ext],
       cache_bust='?'+Date.now().toString(36)+Math.random().toString(36);
       
       if (!url_cache_bust) {
         
         if (ver) {
           cache_bust='?ver='+ver;
         } else {
           cache_bust='';
         }
       }
     
       elements.push(loader(src+cache_bust,mobileDependancies,scripts.slice(1),callback,elements));
   
     } else {
       
       if (typeof callback==='function') {
         
          if (url_cache_bust) {
            window.location.href=window.location.origin+window.location.pathname;
         }  
         callback(elements);
         
       }
     }
    }
   
    function backfillhtml(){
      var html =
      ' <div class="mobile_phone" id="mobile_phone">  '+
      ' <p class="undersize_x">&#8594;</p>  '+
      ' <p class="oversize_x">&#8592;</p>  '+
      ' <p class="undersize_y">&#8595;</p>  '+
      ' <p class="oversize_y">&#8593;</p>   '+
      ' </div>  '+
      ' <div id="mobile_chooser">  '+
      '   <select>  '+
      '     <option>choose device</option>  '+
      '     <option>generic </option>  '+
      '     <option>galaxy_S5</option>  '+
      '     <option>motog4 </option>  '+
      '     <option>pixel_2</option>  '+
      '     <option>pixel_2XL</option>  '+
      '     <option>iPhone_5</option>  '+
      '     <option>iPhone_5_SE</option>  '+
      '     <option>iPhone_6</option>  '+
      '     <option>iPhone_7</option>  '+
      '     <option>iPhone_8</option>  '+
      '     <option>iPhone_6_Plus</option>  '+
      '     <option>iPhone_7_Plus</option>  '+
      '     <option>iPhone_8_Plus</option>  '+
      '     <option>iPhone_X</option>  '+
      '     <option>iPad</option>  '+
      '     <option>iPad_Pro</option>  '+
      '     <option>surface_Duo</option>  '+
      '     <option>galaxy_Fold</option>  '+
      '   </select>'+
      ' </div>  ';
    
      
      var el = document.createElement("div");
      
      
      el.innerHTML=html;
      document.body.appendChild(el.children[0]);
      document.body.appendChild(el.children[0]);
        
    }

    function onWindowLoaded () {
        
        
        var targ ={
          w : 100,
          h : 100
        },
        select_phone=document.querySelector("#mobile_chooser"),
        phone=document.querySelector("#mobile_phone");
        
        function onWindowResize (){
          var ww=window.innerWidth,wh=window.innerHeight,
              s = getComputedStyle(phone),
              w =parseInt(s.width),
              h = parseInt(s.height); 
            if (isNaN(w)) return;
          
          
            wh-=parseInt(getComputedStyle(select_phone).height);
          
            phone.classList[ww<w?'add':'remove']('undersize_x');
            phone.classList[ww>w?'add':'remove']('oversize_x');
            phone.classList[wh<h?'add':'remove']('undersize_y');
            phone.classList[wh>h?'add':'remove']('oversize_y');
            
           
        }
        
        select_phone.onchange=function(e){
          phone.className = "mobile_phone"+(e.target.value==="none"?"":" "+e.target.value);
          onWindowResize(); 
        };
        
        
        
        window.addEventListener("resize",onWindowResize,{passive:true});
        onWindowResize(); 
    }

    
    var everythingLoaded = setInterval(function() {
      if (/loaded|complete/.test(document.readyState)) {
        clearInterval(everythingLoaded);
        backfillhtml();
        
        onWindowLoaded(); // this is the function that gets called when everything is loaded
      }
    }, 10);

 


})("mobileDependancies");
