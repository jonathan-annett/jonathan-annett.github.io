
/* global localforage,swivel,install_sw */

window.addEventListener('load', w_load);

function w_load() {
    
    const sw_path    = "/zed/pwa/sw/background.sw.js";
    const config_url = "/zed/pwa/files.json";
    
    var 
    
    installerProgress,
    
    [progress_message, html,keyPRE]   = ["#progress_message", "html","html .notbeta pre.key"].map(qs);
    
        
    betaTesterApproval().then(beta_site).catch(
       function(err){
           console.log("site not available",err);
       }    
    ); 
    
    
        
    function beta_site (betaTesterKey) {
        
        console.log("starting site for beta tester:",betaTesterKey);
        
        install_sw (sw_path, sw_afterinstall, sw_afterstart, sw_progress )
       
        function sw_afterstart(registration){

            html.classList.remove("beta");
            html.classList.remove("notbeta");
            window.boot_zed();

        }
         
        
        function sw_afterinstall(registration) {
          
                showRefreshUI(registration);
                //window.boot_zed();
        }
        
        
        function sw_progress(url,progress) {
            if (progress===0) {
                installerProgress =   qs("#progress_container");
                installerProgress.innerHTML= '<progress max="100" value="0"> 0% </progress';
                installerProgress = installerProgress.children[0];
            } else {
                if (installerProgress && progress) {
                    installerProgress.progress = progress;
                }
            }
            
            if (url) {
                progress_message.innerHTML = url;
            } 
            
            if (progress>100) {
                console.log("install complete");
                installerProgress.progress = 0;
                progress_message.innerHTML = "install compelete";
            }
        }
      
       
        function showRefreshUI(registration) {
        
            let load_new_version = qs("#load_new_version");
            load_new_version.disabled = false;
            const click = function () {
              load_new_version.removeEventListener('click', click);
              load_new_version.disabled = true;  
              if (registration.waiting) {
                  // let waiting Service Worker know it should became active
                  registration.waiting.postMessage('SKIP_WAITING');
              }
            };
            load_new_version.addEventListener('click', click);
        }
        
        
        

      
        
    } 

    
    
    /*
    function zed_api () {
        
        var On='addEventListener';
        
        function on_window_close(w, fn) {
          if (typeof fn === "function" && w && typeof w === "object") {
            setTimeout(function() {
              if (w.closed) return fn();
    
              try {
                w[On]("beforeunload", fn);
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
    
        function on_window_open(w, fn) {
          if (typeof fn === "function" && w && typeof w === "object") {
            try {
              w[On]("load", fn);
            } catch (err) {
              setTimeout(fn, 2000, w);
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
              w("resize", check);
              w("focus", check);
              w("blur", check);
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
          
          var pos=open_window.pos_cache[name];
          if (pos) {
             left= pos.left || left;
             top=  pos.top || top;
            } else {
            pos = {
              left:left,
              top:top
              };
            open_window.pos_cache[name] = pos;
          } 
            
          
            
          var opts =
              "toolbar=no, menubar=no, location=no, resizable=" +
              (size ? "yes" : "no") +
              "scrollbars=" +
              (size ? "yes" : "no") +
              ", top=" +
              top.toString() +
              ",left=" +
              left.toString() +
              ", width=" +
              width.toString() +
              ", height=" +
              height.toString(),
            w = window.open(url, name, opts);
             
           if (w) {
             on_window_open(w,onOpened);
             on_window_close(w,onClosed);
           }
            
           return w;
        }
        
        open_window.pos_cache = {};
        
        var api = {
           workerMessage :null, 
           openEditor : openEditor,
           onMessage : onMessage,
           attach: attach,
        };
       
       
       
       function openEditor(title, url, urlPostfix) {
           urlPostfix = urlPostfix || "";
           return new Promise(function(resolve, reject) {
               
               var win = open_window(
                 '/zed?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title) + urlPostfix, 
                 name,
                 0,
                 0,
                 1024,
                 768,
                 true,
                 undefined,
                 function(win) {
                     win.focus();
                     resolve(win);
                 }
               )
               
           });
       }
       
       function getOpenProjects () {
           return new Promise(function(resolve,reject){
                 api.workerMessage.send({
                     type : "ZED",
                     cmd  : "getOpenProjects"
                 }); 
           });
       }
       
      function openProject (title, url) {
           console.log("Going to open", title, url);
           if (openProjects[url]) {
               var win = openProjects[url].win;
               win.focus();
               win.contentWindow.zed.services.editor.getActiveEditor().focus();
           } else {
               openEditor(title, url);
           }
       }
       
      function registerWindow (title, url, win) {
           if(!url) {
               return;
           }
           openProjects[url] = {
               win: win,
               title: title,
               lastFocus: new Date()
           };
           win.contentWindow.addEventListener('focus', function() {
               openProjects[url].lastFocus = new Date();
           });
           win.onClosed.addListener(function() {
               delete openProjects[url];
               saveOpenWindows();
           });
           saveOpenWindows();
       }
       
       
       
      
       
       
        
       function getOpenProjects ( ) {
           return new Promise(function(resolve,reject){
               
               
               
           });
       
       }
       
       
        
       function attach(msg) {
           api.workerMessage=msg;
           return api;
       }
       
       function onMessage (msg){
           var fn = api[msg.cmd];
           if (typeof fn==='function') {
               const retval = fn.apply(this,Array.isArray(msg.args) ? msg.args : [ msg ]);
               if (retval && retval.send && api.workerMessage) {
                   api.workerMessage.send(retval);
               }
           }
       }
       
       
       return api;
       
        
        
    }
   */
   
  
    function betaTesterApproval() {
        
        if (!window.crypto) {
           return Promise.reject();
        }
        
        
        return new Promise(function(resolve,reject) {
            const hashAlgo = "SHA-256";
            const seedSize = 512;
            const localStorageKey = "betaTesterKey";
            
             getConfig().then(function(config){
                
                if (config && config.site && config.site.betaTesterKeys) {
                    const keyAsHex = localStorage[localStorageKey];
                    if (keyAsHex) {
                        const keyAsBuffer = bufferFromHex(keyAsHex);
                        
                        return window.crypto.subtle
                            .digest( hashAlgo, keyAsBuffer ).then (
                                
                                function(hashedKeyasBuffer) {
                                    
                                   const hashedKeyHex = bufferToHex(hashedKeyasBuffer);
                              
                                     if ( config.site.betaTesterKeys.indexOf(hashedKeyHex) < 0 ) {
                                         console.log("your beta tester approval code:",hashedKeyHex);
                                         html.classList.remove("beta");
                                         html.classList.add("notbeta");
                                         keyPRE.innerHTML=hashedKeyHex;
                                         reject();
                                     } else {
                                         html.classList.add("beta");
                                         html.classList.remove("notbeta");
                                         resolve(keyAsHex);
                                     }
                                     
                                }
                            ); 
                        
                    } else {
                        
                        var seed = new Uint32Array(seedSize);
                        window.crypto.getRandomValues(seed);
                        return window.crypto.subtle.digest(hashAlgo,seed).then(function(unhashedKey) {
                            const unhashedKeyHex = bufferToHex(unhashedKey);
                            return window.crypto.subtle.digest(hashAlgo,unhashedKey).then(function(hashedKey) {
                                 localStorage[localStorageKey] = unhashedKeyHex;
                                 html.classList.remove("beta");
                                 html.classList.add("notbeta");
                                 keyPRE.innerHTML=bufferToHex(hashedKey);
                                 reject();
                            });        
                        });
                    }
                } else {
                   reject();  
                }
                
            }).catch(reject);
            
        });
    }
    
    
    function getConfig() {
        return new Promise(function (resolve,reject){
            
            fetch(config_url)
              .then(downloadJSON)
                .then(filterConfigComments)
                  .then(resolve).catch(reject);


        });
    }
    
    function removeJSONArrayComments(txt) {
        return !txt.startsWith("<--");
    }
    
    function filterConfigComments (config) {
        config.site.files = config.site.files.filter(removeJSONArrayComments);
        config.site.betaTesterKeys = config.site.betaTesterKeys.filter(removeJSONArrayComments);
        return Promise.resolve(config);
    }
    
    
    
    // generic tools 

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
    
    function downloadJSON(response) { return response.json(); }

    function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
    
    function bufferToText(x) {return new TextEncoder("utf-8").decode(x);}
    
    
    function bufferToHex(buffer) {
        const padding = '00000000';
        const hexCodes = [];
        const view = new DataView(buffer);
        if (view.byteLength===0) return '';
        if (view.byteLength % 4 !== 0) throw new Error("incorrent buffer length - not on 4 byte boundary");
    
        for (let i = 0; i < view.byteLength; i += 4) {
            // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
            const value = view.getUint32(i);
            // toString(16) will give the hex representation of the number without padding
            const stringValue = value.toString(16);
            // We use concatenation and slice for padding
            const paddedValue = (padding + stringValue).slice(-padding.length);
            hexCodes.push(paddedValue);
        }
        // Join all the hex strings into one
        return hexCodes.join("");
    }
    
    function bufferFromHex (hex) {
        if (hex.length === 0) return new ArrayBuffer(0);
        if ((hex.length % 8) !== 0 ) throw new Error("incorrent hex length - need multiples of 8 digits");
        
        const ui32Array = [];
        for (let i =0; i < hex.length; i+=8) {
            ui32Array.push(Number.parseInt("0x"+hex.substr(i,8)));
        }
        return Uint32Array.from(ui32Array).buffer;
    }    

}





