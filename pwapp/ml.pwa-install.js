/* global ml,qs,Headers,BroadcastChannel  */
ml(`
pwa                   | ml.pwa.js
Shell                 | shell/shell.js
progressHandler       | ml.progressHandler.js
openWindowLib         | ml.openWindow.js
dragSizeWindowLib     | ml.dragSizeWindow.js

`,function(){ml(2,

    {
        Window: function pwaInstallLib( pwa,Shell ) {
            const lib = {}  ;
            
            const  
            [ html, runBtn,  openBtn,    update  ]   = 
            ["html","#runBtn", "#openBtn", "#updateBtn"].map(qs);
            
            
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
            
            
            ml.i.dragSizeWindowLib.drag('#install-shell',[
                "#install-shell > div.shell__status-bar"   ,
                "#install-shell > div.shell__status-bar > div.status-bar__title" 
                //"#install-shell > div.shell__status-bar > div.status-bar__buttons"
                ]);
            fixupLogHeight();
            
           
           
            
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
                 
                 const backup = shell.options.commands;
                 shell.options.commands = [
                   {"input": "-", "output": ["-"]},
                 ];
                 shell.init();
                 
      
                 // wait for browser to update top 
                 const top = qs("#install-shell").offsetTop;
                 if (top!==0) {
                    
                     
                     const fakeSheet   = document.head.appendChild(document.createElement("style"));
                     const cssTextNode = document.createTextNode(`#install-shell {
                                                                            resize: both;
                                                                            height: calc(100% - ${top}px);}`);
           
                     fakeSheet.type = 'text/css';
                     fakeSheet.appendChild(cssTextNode);
                     fixupLogHeight.done=true;
                 }
                 shell.options.commands = backup;
                 shell.init();
                 if (!fixupLogHeight.done) setTimeout(fixupLogHeight,100);
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
                 fixupLogHeight();
                 return qs("#install-shell").offsetHeight - qs("#install-shell > div.shell__status-bar").offsetHeight;
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
                
                  
                  ml.i.progressHandler(0,1,"loadProgress","loadProgressText","installProgress").onfilename=logFilenameInConsole;
                  
                  pwa.start(function(){
                      betaTesterApproval().then(function(config){
                           const delay = sessionStorage.running? 1: qs("#show_shell").checked ? Math.max(minTime-Date.now()) : 1;
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
                                                  
                                                  if (localStorage.notbetapending==='1') {
                                                     
                                                      html.classList.add("notbetapending");
                                                      html.classList.remove("notbeta");
                                                      reject();
                                                      
                                                  } else {
                                                      html.classList.remove("notbetapending");
                                                      html.classList.add("notbeta");
                                                      register (config,hashedKeyHex,function(err){
                                                          if (!err) {
                                                              html.classList.add("notbetapending");
                                                              html.classList.remove("notbeta");
                                                              localStorage.notbetapending='1'
                                                          }
                                                          reject();
                                                      });
                                                  }
                                                  
                                              } else {
                                                  html.classList.add("beta");
                                                  html.classList.remove("notbetapending");
                                                  html.classList.remove("notbeta");
                                                  config.testerKey = keyAsHex;
                                                  delete localStorage.notbetapending;
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
                                          html.classList.add("notbeta");
                                          html.classList.remove("notbetapending");
                                          html.classList.remove("beta");
                                          delete localStorage.notbetapending;
                                          reject();
                                     });        
                                 });
                             }
                         } else {
                            reject();  
                         }
                         
                     }).catch(reject);
                     
                 });
                 
                 function validateEmail(inputText)
                 {
                     var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
                     const email = inputText.value.trim(); 
                     if(email.match(mailformat))
                     {
                        return email !== inputText.placeholder;
                     }
                     else
                     {
                        return false;
                     }
                 }
                 
                    
                 function register (config,hashedKeyHex,cb) {
                     
                     
                     //update this with your js_form selector
                     var form_id_js = "register_form";
                 
                     var data_js = {
                         "access_token": config.register_id
                     };
                 
                     function js_onSuccess() {
                        return cb ();
                        
                     }
                 
                     function js_onError(error) {
                         return cb (error);
                     }
                 
                     var sendButton = document.getElementById("js_send");
                     var register_email = document.querySelector("#" + form_id_js + " [name='register_email']");
                     function js_send() {
                         sendButton.value='Sending...';
                         sendButton.disabled=true;
                         var request = new XMLHttpRequest();
                         request.onreadystatechange = function() {
                             if (request.readyState == 4 && request.status == 200) {
                                 js_onSuccess();
                             } else
                             if(request.readyState == 4) {
                                 js_onError(request.response);
                             }
                         };
                 
                         data_js['subject'] = "Beta Tester Application "+location.href;
                         data_js['text'] = [
                             "Beta Tester Application",
                             "Site URL:"+location.href,
                             "Browser Hex Id:"+hashedKeyHex,
                             "Email Address Entered:"+register_email.value.trim(),
                             "Browser Info:"+browserMeta ()
                         ].join("\n");
                          
                         var params = toParams(data_js);
                 
                         request.open("POST", "https://postmail.invotes.com/send", true);
                         request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                 
                         request.send(params);
                 
                         return false;
                     }
                 
                     sendButton.onclick = js_send;
                     register_email.onchange = email_change;
                     register_email.onkeyup = email_change;
                     
                     sendButton.disabled=true;
                     
                     function email_change() {
                         sendButton.disabled=!validateEmail(register_email);
                     }
                     
                 
                     function toParams(data_js) {
                         var form_data = [];
                         for ( var key in data_js ) {
                             form_data.push(encodeURIComponent(key) + "=" + encodeURIComponent(data_js[key]));
                         }
                 
                         return form_data.join("&");
                     }
                 
                     var js_form = document.getElementById(form_id_js);
                     js_form.addEventListener("submit", function (e) {
                         e.preventDefault();
                     });
                     
                     
                 }
                 
                 
                 function browserMeta () {
                     
                     // Opera 8.0+
                     var isOpera = (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
                     
                     // Firefox 1.0+
                     var isFirefox = typeof InstallTrigger !== 'undefined';
                     
                     // Safari 3.0+ "[object HTMLElementConstructor]" 
                     var isSafari = /constructor/i.test(window.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window['safari'] || (typeof safari !== 'undefined' && window['safari'].pushNotification));
                     
                     // Internet Explorer 6-11
                     var isIE = /*@cc_on!@*/false || !!document.documentMode;
                     
                     // Edge 20+
                     var isEdge = !isIE && !!window.StyleMedia;
                     
                     // Chrome 1 - 79
                     var isChrome = !!window.chrome && (!!window.chrome.webstore || !!window.chrome.runtime);
                     
                     // Edge (based on chromium) detection
                     var isEdgeChromium = isChrome && (navigator.userAgent.indexOf("Edg") != -1);
                     
                     // Blink engine detection
                     var isBlink = (isChrome || isOpera) && !!window.CSS;
                     
                     
                      return JSON.stringify({
                         isFirefox  :       isFirefox,
                         isChrome  :        isChrome,
                         isSafari  :        isSafari,
                         isOpera  :         isOpera,
                         isIE  :            isIE,
                         isEdge  :          isEdge,
                         isEdgeChromium  :  isEdgeChromium,
                         isBlink  :         isBlink
                     });
                 }
                
                 
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


 
 