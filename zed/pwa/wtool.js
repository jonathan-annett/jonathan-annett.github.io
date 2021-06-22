/* global ml,self,caches */
ml(0,ml(1),['wTools|windowTools.js'],function(){ml(2,ml(3),ml(4),

    {

        Window: function main(wTools) {
            
            const lib = {

            };
            
            
            var [ 
                btnOpen, btnMax, btnMin, btnRestore,
            
                url, title,wleft,wtop,textarea,select] = [
                "#btnOpen", "#btnMax", "#btnMin", "#btnRestore",
                "#url", "#title","#left","#top","textarea","select"
                
            ].map(qs);
            
            btnOpen.onclick = function(){
                wTools.open(url.value,title.value,Number.parseInt(wleft.value)||0,Number.parseInt(wtop.value)||0);
            };
            
            btnMax.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).maximize();
                }
             };
            btnMin.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).minimize();
                }
            };
            btnRestore.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).restore();
                }
            };
            
            
            monitor();
            
            wTools.on("setKey",monitor);
            
            window.addEventListener("storage",monitor);
            
            var lastOpen="";
            
            function monitor(){
                var info={};
                var currentOpen = localStorage.getItem("windowTools.openWindows");
                if (currentOpen!==lastOpen) {
                    lastOpen=currentOpen;
                    if (currentOpen) {
                        const openWindows = JSON.parse(currentOpen);
                        const selected = select.value;
                        select.innerHTML = Object.keys(openWindows).map(function(wid){
                            const meta = openWindows[wid];
                            return '<option '+(selected===wid?'selected ':'')+'href="'+wid+'">'+meta.url+'</option>';
                        }).join("\n");
                    }                    
                    
                }
                Object.keys(localStorage).forEach(function(k){
                    
                    if (k.startsWith("windowTools.")){
                        info[k]=JSON.parse(localStorage.getItem(k));
                    }
                    
                });
                textarea.value = JSON.stringify(info,undefined,4);
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
            
            ml(9,'./wtool.js');
            
            
            
            setInterval(function(){
                
                sendMessage("hello",function(err,reply){
                   console.log({err,reply});  
                });
                
                
            },5000);
            
            
            
            function findWorker() {return asPromise(arguments,function(resolve,reject){
                
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  
                  if (!registrations.some(function(reg){
                      const worker = reg.controller || reg.active || reg.installing || reg.waiting;
                      if (worker) {
                          resolve(worker);
                          return true;
                      }
                  })){
                      
                     reject(new Error("no worker found"));
                  }
                });
                
            });}
             
            
            function sendMessage(message,cb) {
              // This wraps the message posting/response in a promise, which will
              // resolve if the response doesn't contain an error, and reject with
              // the error if it does. If you'd prefer, it's possible to call
              // controller.postMessage() and set up the onmessage handler
              // independently of a promise, but this is a convenient wrapper.
                return new Promise(function(resolve, reject) {
                var messageChannel = new MessageChannel();
                const pingName = "reply_"+Math.random().toString(36).substr(-8);
                const channel = new BroadcastChannel(pingName);
                
                 channel.onmessage = function(e) {
                      console.log('Received', e.data);
                      // Close the channel when you're done.
                      channel.close();
                      messageChannel.close();
                      resolve(e.data);
                };
                
                // This sends the message data as well as transferring
                // messageChannel.port2 to the service worker.
                // The service worker can then use the transferred port to reply
                // via postMessage(), which will in turn trigger the onmessage
                // handler on messageChannel.port1.
                // See
                // https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
                
                findWorker().then(function(worker){
                    worker.postMessage({message:message,pingChannel:pingName}, [messageChannel.port2]);
                    }).then(function(x){cb(undefined,x)}).catch(cb);
                }).catch(cb);
            }

            return lib;
        },

        ServiceWorkerGlobalScope: function dep3() {
            const lib = "hello sw world";
            
        
                
                ml(8,"activate",function(event){
                    console.log("activate event");
                    
                });
                
                ml(8,"message",function(event){
                  
                    
                    if (event.data.pingChannel){ 
                        
                        const channel = new BroadcastChannel(event.data.pingChannel);
                        
                        // Send a message on "my_bus".
                        channel.postMessage('pong');
                        
                        // Listen for messages on "my_bus".
                        channel.onmessage = function(e) {
                              console.log('Received', e.data);
                              // Close the channel when you're done.
                              channel.close();
                        };
                        
                        
                    }                
                });
                
                
                ml(8,"fetch",function(event){
                    console.log("fetch event:",event.request.url);
                    event.respondWith(fetch(event.request));
                });
                

            return lib;
        },

    }, {
        Window: [

            () => self.wTools
           
        ],
        ServiceWorkerGlobalScope: [

            () => self.wTools
        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/
 

});

