
function w_load() {
    
    const sw_path    = "/zed/pwa/sw/background.pwa.js";
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
    
    
    function installerMsg(cb,msg){
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
        
        if (msg.done && cb) {
            cb();
        }
    }
    
    function messageReceiver(worker,NAME,cb) {
        
        if (!worker) return;
        
        // app.js - somewhere in our main app
        const messageChannel = new MessageChannel();
        
        // First we initialize the channel by sending
        // the port to the Service Worker (this also
        // transfers the ownership of the port)
        worker.postMessage({
          type: NAME ,
        }, [messageChannel.port2]);
        
        // Listen to the response
        messageChannel.port1.onmessage = (event) => {
          // Print the result
          cb(event.data.msg);
        };
        
        return {
            done : function () {
               
            }
        }
    }
    
    function afterInstall(reg,cb) {
        
        console.log("installed");
        messageReceiver(
            reg.installing || reg.waiting || reg.active ,
            'UPDATE',
            installerMsg.bind(this,cb)
        );
        
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
    
    //function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
    //function bufferToText(x) {return new TextEncoder("utf-8").decode(x);}
    
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



