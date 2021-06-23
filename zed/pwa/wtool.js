/* global ml,self,caches,BroadcastChannel,JSZipUtils,JSZip */
ml(0,ml(1),[
    
    'wTools|windowTools.js',
    'JSZipUtils@ServiceWorkerGlobalScope | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
    'JSZip@ServiceWorkerGlobalScope | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js'
    
    
    ],function(){ml(2,ml(3),ml(4),

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
            
            
            
            setTimeout(function(){
                
                sendMessage("ping",{hello:"world",when:new Date(),also:Math.random()},function(err,reply){
                   console.log({err,reply});  
                   
                   
                   sendMessage("unzip",{
                       url:"/zed/server-startup-main.zip",
                       file:"server-startup-main/package.json"},function(err,reply){
                      console.log({err,reply});  
                   });
                   
                });
                
                
                  
                
                
            },5000);
            
            
            
            function findWorker() {return new Promise(function(resolve,reject){
                
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
             
            
            function sendMessage(cmd,data,cb) {
                return new Promise(function(resolve, reject) {
                    var messageChannel = new MessageChannel();
                    const replyName = "reply_"+Math.random().toString(36).substr(-8);
                    const channel = new BroadcastChannel(replyName);
                    
                     channel.onmessage = function(e) {
                          console.log('Received', e.data);
                          // Close the channel when you're done.
                          channel.close();
                          messageChannel.port1.close();
                          messageChannel.port2.close();
                          resolve(e.data);
                    };
                    
                    findWorker().then(function(worker){
                        worker.postMessage({m:cmd,r:replyName,data:data}, [messageChannel.port2]);
                        }).catch(cb);
                    }).then(function(x){cb(undefined,x)}).catch(cb);
            }

            return lib;
        },

        ServiceWorkerGlobalScope: function main(wTools) {
            const lib = "hello sw world";
            
        
                
                ml.register("activate",function(event){
                    
                    console.log("activate event");
                    
                });
                
                ml.register("messages",{
                    
                    ping:function(msg,cb){ 
                            
                            console.log(msg); 
                            return cb("pong");
                        
                    },
                    
                    unzip:function (msg,cb){
                        
                        
                       function catcher(err) {
                           cb( {error:err.message||err}); 
                       }
                       
                       
                       function unzipper(response) {
                           
                           
                         if (!response.ok) {
                           return cb ({error:"HTTP error, status = " + response.status});
                         }
                         
                         response.arrayBuffer().then(function(buffer) {
                       
                            JSZip.loadAsync(buffer).then(function (zip) {
                               zip.file(msg.data.file).async("arraybuffer")
                                  .then(function(buffer){
                                      cb({buffer:buffer});
                                  });
                           }).catch(catcher);
                           
                           
                           
                         });
                         
                         
                       }
                      
                       if (msg.data && msg.data.url && msg.data.file) {
                           
                           
                           fetch(msg.data.url)
                              .then(unzipper)
                                .catch(function(err){
                                    
                                        fetch(msg.data.url,{mode:'no-cors'})
                                       .then(unzipper)
                                       
                                }).catch(catcher);

                       } 
                      
                        
                        
                    },
                        
                    
                });
                
                
                ml.register("fetch",function(event){
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

            () => self.wTools,
            
            () => self.JSZip
        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/
 

});

