/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'swResponseZipLib@ServiceWorkerGlobalScope  | ml.zipfs.js',

    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function main(wTools) {
            
            const lib = {

            };
            
            
          
         
            
            ml(9,'./ml.pwa.js',function(result){
                
                window.dispatchEvent(
                    new CustomEvent( 'ml.pwa.registered',{ detail: result })
                );
                
                const persistent=true;
                sendMessage("onCustomEvents",{},function(err,e){
                    if (err) return console.log(err);
                    
                    findWorker(function(err,worker){
                        window.dispatchEvent(
                            new CustomEvent( e.eventName,{ detail: {data:e.eventData,worker:worker} })
                        );
                    });
                    
                },persistent);

            });
         
           
       
  
            
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
             
            
            function sendMessage(cmd,data,cb,persistent) {
                const replyName        = "r"+Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-4);
                const sendChannel      = new MessageChannel();
                const replyChannel     = new BroadcastChannel(replyName);
                const timeout = 2000;
                const exitMsg=function(d){
                    let noerr;
                    if (!persistent) {
                       replyChannel.close();
                    }
                    sendChannel.port1.close();
                    sendChannel.port2.close();
                    if (d.error) {
                       cb(d.error); 
                    } else {
                       cb(noerr,d);
                    }
                }
                let tmr = persistent ? undefined : setTimeout(function(){exitMsg({error:"timeout"})},timeout);
                replyChannel.onmessage = function(e) {
                      if(!persistent)clearTimeout(tmr);
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
            
                let dispatchCustomEvent;
            
                ml.register("activate",function(event){
                    
                    if (dispatchCustomEvent) {
                        
                        dispatchCustomEvent({
                            eventName:ml.pwa.activated,
                            eventData:1
                        });
                    }
                    self.clients.claim();
                    
                });
                
                ml.register("messages",{
                    
                    ping:function(msg,cb){ 
                            
                            console.log(msg); 
                            return cb("pong");
                        
                    },
                    
                    onCustomEvents :function(msg,cb){ 
                        dispatchCustomEvent = cb;    
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


 

});



