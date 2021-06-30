/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'swResponseZipLib@ServiceWorkerGlobalScope  | /zed/pwa/sw.response-zip.js',

    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function main(wTools) {
            
            const lib = {

            };
         
            
            ml(9,'./wtool.js');
            
            
            
            setTimeout(function(){
                
                sendMessage("ping",{hello:"world",when:new Date(),also:Math.random()},function(err,reply){
                   console.log({err,reply});  
                   
                   
                 
                });
                
                
                  
                
                
            },5000);
            
            
            
            function findWorker(cb) {

                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  let noerr;
                
                  if (!registrations.some(function(reg){
                      const worker = reg.controller || reg.active || reg.installing || reg.waiting;
                      if (worker) {
                          cb(noerr,worker);
                          return true;//break some
                      }
                  })){
                     cb(new Error("no worker found"));
                  }
                });
                
            }
             
            
            function sendMessage(cmd,data,cb) {
                const replyName        = "r"+Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-4);
                const sendChannel      = new MessageChannel();
                const replyChannel     = new BroadcastChannel(replyName);
                const timeout = 2000;
                const exitMsg=function(d){
                    let noerr;
                    replyChannel.close();
                    sendChannel.port1.close();
                    sendChannel.port2.close();
                    if (d.error) {
                       cb(d.error); 
                    } else {
                       cb(noerr,d);
                    }
                }
                let tmr = setTimeout(function(){exitMsg({error:"timeout"})},timeout);
                replyChannel.onmessage = function(e) {
                      clearTimeout(tmr);
                      exitMsg(e.data);
                };
                
                findWorker(function(err,worker){
                    if (err) return cb(err);
                    worker.postMessage({m:cmd,r:replyName,data:data},[sendChannel.port2]); 
                });
           }

            return lib;
        },

        ServiceWorkerGlobalScope: function main(swRespZip) {
            
                ml.register("activate",function(event){
                    
                    console.log("activate event");
                    self.clients.claim();
                    
                });
                
                ml.register("messages",{
                    
                    ping:function(msg,cb){ 
                            
                            console.log(msg); 
                            return cb("pong");
                        
                    },

                });
                   
                const dbKeyPrefix       = 'zip-files-cache.';
       
                
                ml.register("fetch",swRespZip(dbKeyPrefix).processFetchRequest);
                

        },

    }, {
        Window: [

        ],
        ServiceWorkerGlobalScope: [

            () => self.swResponseZipLib
            
        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/
 

});



