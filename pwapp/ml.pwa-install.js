/* global ml,qs,Headers,BroadcastChannel  */
ml(`
pwa                   | ml.pwa.js
Shell                 | shell/shell.js
FontAwesomeKitConfig  | https://kit.fontawesome.com/f16568395d.js
progressHandler       | ml.progressHandler.js
openWindowLib         | ml.openWindow.js

`,function(){ml(2,

    {
        Window: function pwaInstallLib( pwa,Shell ) {
            const lib = {}  ;
            
            const  
            [ html,keyPRE,                   runBtn,  openBtn,    update  ]   = 
            ["html","html .notbeta pre.key","#runBtn", "#openBtn", "#updateBtn"].map(qs);
            
            
            const 
            
            { open_url,on_window_close  } = ml.i.openWindowLib,
          
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
            
           
            qs("#show_shell",function (el) {
                
                el.checked = localStorage.show_install_shell !== '0';
                el.onchange =  function change(e) {
                   qs("html").classList[ el.checked ?"add":"remove"]("show_shell");
                   localStorage.show_install_shell = el.checked ? '1' : '0';
                };
                
                qs("html").classList[ el.checked ?"add":"remove"]("show_shell");
            
            });
            
            
            
           
            
           
            const shell = new Shell('#install-shell', {
                      user: 'serviceworker',
                      host: 'browser',
                      path: '/pwapp/',
                      style: 'default',
                      theme: 'dark',
                      responsive: true,
                      commands:[""]
            });
            
           
           
            
            runBtn.onclick = runClick ;
            openBtn.onclick = openClick ;
            
            editor_channel.onmessage=function(event) {
                 if (event.data && event.data.run) {
                   runClick() ;
                 }
                 if (event.data && event.data.open) {
                   openClick() ;
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
        
             
             function fixupLogHeight() {
                 if (fixupLogHeight.done) return;
                 fixupLogHeight.done=true;
                 const fakeSheet   = document.head.appendChild(document.createElement("style"));
                 const cssTextNode = document.createTextNode(`#install-shell {
                                                                        resize: both;
                                                                        height: calc(100% - ${
                                                                            qs("#install-shell").offsetTop
                                                                        }px);}`);
       
                 fakeSheet.type = 'text/css';
                 fakeSheet.appendChild(cssTextNode);
             }
             
             function logAreaHeightUsed () {
                 return [].reduce.call(
                     document.body.querySelectorAll("#install-shell > div.shell__content div.line"),
                     function (n,el) {
                         if (el.offsetHeight > 0) logAreaHeightUsed.last = el.offsetHeight;
                         return n+el.offsetHeight;
                     },
                     0
                );
             }
             
             function logAreaHeight () {
                
                 return qs("#install-shell").offsetHeight - qs("#install-shell > div.shell__status-bar");
             }
             
             
             function logFilenameInConsole(filename) {
                 const list = shell.options.commands[0].output;
                 list.push (filename);
                 shell.init();
                 const avail = logAreaHeight ();
                 let used = logAreaHeightUsed ();
                 while (used+logAreaHeightUsed.last>avail) {
                     list.splice(0,1);
                     qs("html").classList.add("scrolled");
                     shell.init();
                     used = logAreaHeightUsed ();
                 }
             }
             
              function runOrOpenClick(mode,cb) {
                  runBtn.disabled=true;
                  openBtn.disabled=true;
                  // we want the animation /progress bar on the screen for a least 5 seconds
                  const minTime = Date.now() + 5000  ;
                  
                  sessionStorage.running=((1000*60*2) + Date.now()).toString();
                  qs("#"+mode+"gif").style.display = "inline-block";
                  qs("html").classList.add("busy");
                  
                  shell.options.commands = [
                    {"input": "install pwapp", "output": [""]},
                  ];
                  shell.init();
                  fixupLogHeight();
                  
                  ml.i.progressHandler(0,1,"loadProgress","loadProgressText","installProgress").onfilename=logFilenameInConsole;
                  
                  pwa.start(function(){
                      betaTesterApproval().then(function(config){
                           const delay = qs("#show_shell").checked ? Math.max(minTime-Date.now()) : 10;
                           qs("html").classList.add("remove");
                           cb(delay,config);
                      });
                  });
              }
              
              function runClick() {
                  runOrOpenClick("run",function(delay,config){
                     setTimeout(location.replace.bind(location),  delay,config.root);    
                  });
              }
              
              function openClick() {
                  const win = open_url ('ml.loading.html',function(state){
                      switch(state) {
                          case "opened": {
                              return runOrOpenClick("open",function(delay,config){
                                 setTimeout(function(){
            
            
                                     win.location.replace(config.root);
                                     qs("#opengif").style.display = "inline-block";
                                     runBtn.disabled=true;
                                     openBtn.disabled=true;
                                     
                                     on_window_close(win,afterClosed);
                                     
                                 },  delay,config.root);   
                              });
                          }
                          case "closed": {
                              afterClosed();
                          }
                      }
                  });
                         
                  function afterClosed() {
                      qs("#opengif").style.display = "none";
                              runBtn.disabled=false;
                              openBtn.disabled=false;
                  }
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
             
            //*
            function progressHandler(complete,total,id,idtxt,channelName) {
               let expect_total = total;
               let outer = qs("#"+id),inner = qs(outer,"div"),status = qs("#"+idtxt),maxWidth = outer.offsetWidth, barHeight=outer.offsetHeight;
               updateBar();
               if (status) {
                  status.style= "position:relative;left:"+(maxWidth+2)+"px;top:-"+barHeight+"px;"; 
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
                        
           //*/
           
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
            ()=> ml.i.pwa,
            ()=> ml.i.Shell
        ]

    }

    );
 

});


 
 