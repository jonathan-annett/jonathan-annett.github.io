
/* global publishNamedFunction, importPublishedFunction, toResolver,localforage */
function w_load() {
    
    const sw_path    = "/zed/pwa/sw/background.sw.js";
    const config_url = "/zed/pwa/files.json";
    
 
    var 
    
    qs=document.querySelector.bind(document),
    installerProgress,
    
    [progress_message, html,keyPRE]   = ["#progress_message", "html","html .notbeta pre.key"].map(qs);
    
        
    betaTesterApproval().then(beta_site).catch(
       function(){
           console.log("site not available");
       }    
    ); 
    
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
   
    function downloadJSON(response) { return response.json(); }
    
    function getConfig() {
        return new Promise(function (resolve,reject){
            
            fetch(config_url)
              .then(downloadJSON)
                .then(resolve).catch(reject);
          
        });
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
    
    function updateInstallProgress(cb,msg){
        if (msg.files) {
           installerProgress =   qs("#progress_container");
           installerProgress.innerHTML= '<progress max="' + msg.files.length + '" value="0"> 0% </progress';
           installerProgress = installerProgress.children[0];
        } else {
            if (installerProgress && msg.downloaded) {
                installerProgress.progress = msg.downloaded;
            }
        }
        if (msg.url) {
            progress_message.innerHTML = msg.url;
        } 
        
    }
    
    

    function afterInstall(reg,cb) {
        
        const worker = reg.installing || reg.waiting || reg.active;
        
        publishNamedFunction(updateInstallProgress,worker).then (function(){
           console.log('updateInstallProgress imported ok');      
        });
        
        
        publishNamedFunction('updateDone',cb,worker).then (function(){
           console.log('updateDone imported ok');      
        });

        /*
        var api = zed_api();
        api.attach(messageReceiver(
            reg.installing || reg.waiting || reg.active ,
            'ZED',
            api.onMessage
        ));*/
        
        
    }
    
    function onNewServiceWorker(registration, callback) {
      if (registration.waiting) {
        // SW is waiting to activate. Can occur if multiple clients open and
        // one of the clients is refreshed.
        callback();
        return true;
      }
    
      function listenInstalledStateChange() {
        registration.installing.addEventListener('statechange', function(event) {
          if (event.target.state === 'installed') {
            // A new service worker is available, inform the user
            callback();
          }
        });
      }
    
      if (registration.installing) {
        listenInstalledStateChange();
        return true;
      }
    
      // We are currently controlled so a new SW may be found...
      // Add a listener in case a new SW is found,
      registration.addEventListener('updatefound', listenInstalledStateChange);
      return false;
    }
    
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
    
 
    function beta_site (betaTesterKey) {
        
        console.log("starting site for beta tester:",betaTesterKey);
        
        var sw_controllerchange_refreshing;
        function sw_controllerchange(event) {
          if (sw_controllerchange_refreshing) return; // prevent infinite refresh loop when you use "Update on Reload"
          sw_controllerchange_refreshing = true;
          console.log('Controller loaded');
          window.location.reload();
        }
        
        // When the user asks to refresh the UI, we'll need to reload the window
        navigator.serviceWorker.addEventListener('controllerchange',sw_controllerchange);
      
        navigator.serviceWorker.register( sw_path )
        .then(function (registration) {
            // Track updates to the Service Worker.
          if (!navigator.serviceWorker.controller) {
            // The window client isn't currently controlled so it's a new service
            // worker that will activate immediately
            afterInstall(registration,function(){
                html.classList.remove("beta");
                html.classList.remove("notbeta");
                window.boot_zed();
                
            });
            
            
            navigator.serviceWorker.ready.then(afterInstall);
            return;
          }
          
          registration.update();
      
          if (onNewServiceWorker(registration, function() {
              
            afterInstall(registration,function(){
                
                showRefreshUI(registration);
                window.boot_zed();
                
            });
            
            
          })===false) {
              html.classList.remove("beta");
              html.classList.remove("notbeta");
              window.boot_zed();
          }
           
        });
        
    } 
    
    

   
}


window.addEventListener('load', w_load);



