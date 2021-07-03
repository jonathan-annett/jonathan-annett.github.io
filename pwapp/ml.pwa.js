/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'swResponseZipLib@ServiceWorkerGlobalScope  | ml.zipfs.js',
    'pwaMessage@Window                          | ml.pwa-message.js'

    
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
                    
                    
                    deleted : function (msg,cb) {
                        const data = msg.data;
                        if (data.zip && (data.toggle||data.add||data.remove||data.test)) {
                            zipFS.getZipDirMetaTools(data.zip,function(tools) {
                                if (tools) {
                                    if (data.toggle) {
                                        tools.toggleDelete(data.toggle,cb);
                                    } else {
                                        if (data.add) {
                                            tools.deleteFile(data.toggle,cb);
                                        } else {
                                            if (data.remove) {
                                                tools.undeleteFile(data.toggle,cb);
                                            } else {
                                                if (data.test) {
                                                    cb (undefined,
                                                        tools.isDeleted(data.test) ? {deleted:data.test} : {undeleted:data.test} 
                                                    );
                                                }
                                            }
                                        }
                                    }
                                } else {
                                    cb({error:"could not access zip tools"});
                                }
                            });
                        } else {
                            cb({error:"needs zip + toggle/add/remove"});
                        }
                    },
                    
                    hidden : function (msg,cb) {
                                 const data = msg.data;
                                 if (data.zip && (data.toggle||data.add||data.remove||data.test)) {
                                     zipFS.getZipDirMetaTools(data.zip,function(tools) {
                                         if (tools) {
                                             if (data.toggle) {
                                                 tools.toggleHidden(data.toggle,cb);
                                             } else {
                                                 if (data.add) {
                                                     tools.hideFile(data.toggle,cb);
                                                 } else {
                                                     if (data.remove) {
                                                         tools.unhideFile(data.toggle,cb);
                                                     } else {
                                                         if (data.test) {
                                                             cb (undefined,
                                                                 tools.isHidden(data.test) ? {hidden:data.test} : {unhidden:data.test} 
                                                             );
                                                         }
                                                     }
                                                 }
                                             }
                                         } else {
                                             cb({error:"could not access zip tools"});
                                         }
                                     });
                                 } else {
                                     cb({error:"needs zip + toggle/add/remove"});
                                 }
                             },
                    
                    fetchUpdatedURLContents : function (msg,cb) {
                         zipFS.fetchUpdatedURLContents(msg.data.url,function(err,content, updated){
                             if (err) return cb({error:err.message||err});
                             cb({content:content,updated:updated});
                         });
                    },
                    
                    removeUpdatedURLContents : function (msg,cb) {
                        zipFS.removeUpdatedURLContents(msg.data.url,function(err){
                            if (err) return cb({error:err.message||err});
                            cb({});
                        });
                    },
                    
                    updateURLContents : function (msg,cb) {
                        const data = msg.data;
                        let contentBuffer = data.content;
                        switch (typeof contentBuffer) {
                            case 'string' : contentBuffer =  bufferFromText( contentBuffer) ; break;
                            case 'object' : 
                                if ([ArrayBuffer,Uint8Array,Uint16Array,Uint32Array ].indexOf(contentBuffer.constructor)<0) {
                                    contentBuffer =  bufferFromText( JSON.stringify(contentBuffer) ); 
                                }
                        }
                        
                        zipFS.updateURLContents(
                            data.url,
                            data.cacheDB||"updatedURLS",
                            contentBuffer,
                            function(err){
                                if (err) return cb({error:err.message||err});
                                cb({});
                            });
                        
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


 function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}

 function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}

});



