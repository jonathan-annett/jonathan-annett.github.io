/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'swResponseZipLib@ServiceWorkerGlobalScope  | ml.zipfs.js',
    'pwaMessage@Window                          | ml.pwa-message-js'

    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function pwa(findWorker,sendMessage) {
            
            const lib = {
                newFixupRulesArray:newFixupRulesArray,
                start:start,
                unregister:noop
            };
            
            function noop(arg,cb) {
              if (typeof arg==='function') {
                  cb=arg;
              }
              if (typeof cb==='function') {
                  setTimeout(cb,1);
              } 
            }
            let stopped = false;
            function start(cb) {
                
                lib.start=noop;
                
                
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
                    lib.unregister=unregister;
                    noop(cb);
                });
            }
            
            function unregister(path,cb) {
                 stopped=true;
                 lib.unregister=noop;
                 sendMessage("unregister",{path:path},cb);
            }
           
            function newFixupRulesArray(rules,cb) {
                sendMessage("newFixupRulesArray",{rules:rules},cb);
            }

          
            return lib;
        },

        ServiceWorkerGlobalScope: function pwa(swRespZip) {
            
                let dispatchCustomEvent;
                const dbKeyPrefix = 'zip-files-cache.';
                
                const zipFS = swRespZip(dbKeyPrefix);
                
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
                    
                    newFixupRulesArray : function(msg,cb) {
                        if (Array.isArray(msg.rules)){
                            zipFS.newFixupRulesArray(msg.rules);
                            cb("ok");
                        } else {
                            cb({error:"not an array"});
                        }
                    },
                    unregister : function(msg,cb) {
                        ml.register("activate",function(event){
                            
                            event.waitUntil(
                                
                                new Promise(function(resolve) { 
                                    
                                    setTimeout(function(){
                                       
                                        self.registration.unregister()
                                          .then(self.clients.matchAll)
                                               .then(function(clients) {
                                                   
                                                   clients.forEach(function(client){ client.navigate(msg.path || client.url);})
                                                   
                                                });
                                        resolve();        
                                    },500);
                                })

                            );
                            
                        });
                        ml.register("message",function(){});
                        ml.register("fetch",function(){});
                        
                        setTimeout(cb,10,{});
                    },

                });
                   
               
       
                
                ml.register("fetch",zipFS.processFetchRequest);
                

        },

    }, {
        Window: [
            
            ()=>self.pwaMessage.findWorker, 
            ()=>self.pwaMessage.sendMessage
            
        ],
        ServiceWorkerGlobalScope: [

            () => self.swResponseZipLib
            
        ],
    }

    );


 

});



