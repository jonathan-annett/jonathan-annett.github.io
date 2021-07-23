/* global ml,Headers,BroadcastChannel,Shell  */
ml(`pwa | ml.pwa.js`,function(){ml(2,

    {
        Window: function pwaInstallLib( pwa ) {
            const lib = {}  ;
            
            const  
            [ html,keyPRE,                   runhere,  update  ]   = 
            ["html","html .notbeta pre.key","#runBtn", "#updateBtn"].map(qs);
            
            
            const 
            editor_url  = window.parent.location.href.replace(/\/$/,'')+'/edit',
            editor_channel_name = "ch_"+editor_url.replace(/\/|\:|\.|\-/g,''),
            editor_channel = new BroadcastChannel(editor_channel_name);

            const refreshLimit = 10*1000;
            const sinceLast = sessionStorage.reloading_service_worker ? Date.now()-Number.parseInt(sessionStorage.reloading_service_worker,36) : refreshLimit;
            delete sessionStorage.reloading_service_worker;
            if (sinceLast >= refreshLimit) {
                if ('serviceWorker' in navigator) {
                    let abort = false;
                    setTimeout(function(){
                        // if the serice worker doesnt respond within 2 seconds, it's not running
                        // set the abort flag, so if we start it later, this callback gets ignored
                        abort = true;
                        delete sessionStorage.reloading_service_worker;
                    },2000);
                    navigator.serviceWorker.ready.then(function(){
                        // if the service worker is running, reload the page, which will be replaced by the one in the zip
                        if (!abort) {
                            sessionStorage.reloading_service_worker=Date.now().toString(36);
                            location.reload();
                        }
                    });
                }
            }
            
            runhere.onclick = runClick ;
            
            editor_channel.onmessage=function(event) {
                 if (event.data && event.data.run) {
                   runClick() ;
                }
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
             
              function runClick() {
                  
                  // we want the animation /progress bar on the screen for a least 5 seconds
                  const minTime = Date.now()+ 5000;
                  
                  sessionStorage.running=((1000*60*2) + Date.now()).toString();
                  qs("#rungif").style.display = "inline-block";
                  progressHandler(0,1,"loadProgress","loadProgressText","installProgress");
                  pwa.start(function(){
                      betaTesterApproval().then(function(config){
                           const delay = Math.max(minTime-Date.now());
                           setTimeout(location.replace.bind(location),delay,config.root);   
                      });
                  });
              }
              
              
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
             
            
            function progressHandler(complete,total,id,idtxt,channelName) {
               let expect_total = total;
               let outer = qs("#"+id),inner = qs(outer,"div"),status = qs("#"+idtxt),maxWidth = outer.offsetWidth, barHeight=outer.offsetHeight;
               updateBar();
               if (status) {
                  status.style= "position:relative;left:"+(maxWidth+2)+"px;top:-"+barHeight+"px;"; 
               }
               
               let shell = new Shell('#install-shell', {
                   user: 'browser',
                   host: 'local',
                   path: '/home/',
                   style: 'ubuntu',
                   theme: 'dark',
                   responsive: true,
                   commands:[
                              {"input": "install pwapp", "output": [""]},
                            ]
               });
               
               function logFilenameInConsole(filename) {
                   const list = shell.options.commands[0].output;
                   const last = list.pop();
                   list.push (last+(last===""?"":", ")+filename);
                   shell.init();
               }
               
               if (channelName) {
                   const channel = new BroadcastChannel(channelName);
                   channel.onmessage =function(e){
                       const msg = e.data;
                       if (msg && msg.setTotal) {
                           setTotal(msg.setTotal);
                       } 
                       else if (msg && msg.setComplete) {
                          setComplete(msg.setComplete);
                       }
                       else if (msg && msg.addToTotal) {
                          addToTotal(msg.addToTotal);
                          logFilenameInConsole(msg.filename||"(unknown file)");
                       }
                       else if (msg && msg.logComplete) {
                          logComplete(msg.logComplete);
                       }
                   };
               }
               return {
                   setTotal:setTotal,
                   setComplete:setComplete,
                   addToTotal:addToTotal,
                   updateBar : updateBar,
                   logComplete: logComplete
               };
              
               function setTotal(n) {
                   expect_total=n;
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
                 
                 inner.style.width = Math.floor(Math.min((complete/Math.max(total,expect_total)),1)*maxWidth)+"px";
                 if (status) {
                   status.textContent = complete+"/"+Math.max(total,expect_total);
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
                     hexCodes.push(
                         paddedValue.substr(6,2)+
                         paddedValue.substr(4,2)+
                         paddedValue.substr(2,2)+
                         paddedValue.substr(0,2)
                    );
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


 
 