/* global ml,Headers  */
ml(`pwa | ml.pwa.js`,function(){ml(2,

    {
        Window: function pwaInstallLib( pwa ) {
            const lib = {}  ;
            
            
             
            const  
            [ html,keyPRE,                   runhere,  update  ]   = 
            ["html","html .notbeta pre.key","#runBtn", "#updateBtn"].map(qs);
            
            
            runhere.onclick = function() {
                sessionStorage.running=((1000*60*2) + Date.now()).toString();
                qs("#rungif").style.display = "inline-block";
                pwa.start(function(){
                    betaTesterApproval().then(function(config){
                        location.replace(config.root);   
                    });
                });
            };
            
            
            
            [
                 "registered",
                 "activated"].forEach(function(x){
                 window.addEventListener('ml.pwa.'+x,function(){
                     
                     if ( canRunInBrowser() || canRunAsApp() ) {  
                         
                         betaTesterApproval().then(function(config){
                             
                            location.replace(config.root);   
            
                         }).catch(
                             
                            function(err){
                                console.log("site not available",err);
                            }    
                            
                         ); 
                       } else {
                           
                           delete sessionStorage.running;
            
                       }
                 });
             });
             
             function canRunAsApp() {
                 return !!window.matchMedia('(display-mode: standalone)').matches;
             }
             
             function canRunInBrowser() {
                 const runningTimeout = Number.parseInt(sessionStorage.running)||0;
                 const runInBrowser   = (runningTimeout > 0) && (runningTimeout<Date.now());
                 if (!!sessionStorage.running && !runInBrowser) {
                     delete sessionStorage.running;
                 }
                 return runInBrowser;
             }
             
             betaTesterApproval().then(function(config){
                 
                 if (canRunInBrowser() || canRunAsApp()  ) {  
                      pwa.start(function(){
                        location.replace(config.root);   
                      }); 
                 } else {
                     
                      if (config.root!==location.pathname) {
                          return pwa.unregister(config.root,function(){
                              console.log("unregistered service worker, restarting...");
                          });
                      }
                      
                     
                 }
             }).catch(
                function(err){
                    console.log("site not available",err);
                } 
             ); 
             
              
              
              function getConfig(cb) {
                  
                 
                  return new Promise(function (resolve,reject){
                       var configHeaders = new Headers();
                           configHeaders.append('pragma', 'no-cache');
                           configHeaders.append('cache-control', 'no-cache');
                  
                  
                      fetch("betakeys.json",{method:'GET',configHeaders})
                        .then(toJSON)
                            .then(resolve).catch(reject);
             
             
                  });
              }
              
            
            
            function progressHandler(complete,total,id,idtxt) {
               let outer = qs("#"+id),inner = qs(outer,"div"),status = qs("#"+idtxt),maxWidth = outer.offsetWidth, barHeight=outer.offsetHeight;
               update();
               if (status) {
                  status.style= "position:relative;left:"+(maxWidth+2)+"px;top:-"+barHeight+"px;"; 
               }
               return {
                   setTotal:setTotal,
                   setComplete:setComplete,
                   addToTotal:addToTotal,
                   updateBar : updateBar,
                   logComplete: logComplete
               };
              
               function setTotal(n) {
                   total=n;
               }
              
               function setComplete(n) {
                   complete=n;
               }
              
               function logComplete(n) {
                 complete += n;
                  updateBar();
               }
              
               function addToTotal (n) {
                   total+=n;
                   updateBar();
               }
              
               function updateBar (){
                 
                 inner.style.width = Math.floor(Math.min((complete/total),1)*maxWidth)+"px";
                 if (status) {
                   status.textContent = complete+"/"+total;
                 }
               }
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
                         
                         if (config && config.betaTesterKeys) {
                             const keyAsHex = localStorage[localStorageKey];
                             if (keyAsHex) {
                                 const keyAsBuffer = bufferFromHex(keyAsHex);
                                 
                                 return window.crypto.subtle
                                     .digest( hashAlgo, keyAsBuffer ).then (
                                         
                                         function(hashedKeyasBuffer) {
                                             
                                            const hashedKeyHex = bufferToHex(hashedKeyasBuffer);
                                       
                                              if ( config.betaTesterKeys.indexOf(hashedKeyHex) < 0 ) {
                                                  console.log("your beta tester approval code:",hashedKeyHex);
                                                  html.classList.remove("beta");
                                                  html.classList.add("notbeta");
                                                  keyPRE.innerHTML=hashedKeyHex;
                                                  reject();
                                              } else {
                                                  html.classList.add("beta");
                                                  html.classList.remove("notbeta");
                                                  config.testerKey = keyAsHex;
                                                  resolve(config);
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
             
             function toJSON(response) { return response.json(); }
             
             
             function fromBufferToHex(buffer){ 
                 return new Promise(function (resolve,reject){
                     try {
                         const hex = bufferToHex(buffer);
                         resolve(hex);
                     } catch (e) {
                         reject(e);
                     }
                 });
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
            
            return lib;
        }
    }, {
        Window: [
            ()=> ml.i.pwa
        ]

    }

    );
 

});


 
 