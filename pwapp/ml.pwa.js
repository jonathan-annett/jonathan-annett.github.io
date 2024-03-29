/* global ml,self,caches, swResponseZipLib  */
ml(`  
              
              swResponseZipLib@ServiceWorkerGlobalScope  | ${ml.c.app_root}ml.zipfs.js
              pwaMessage@Window                          | ${ml.c.app_root}ml.pwa-message.js
              sha1Lib                                    | ${ml.c.app_root}sha1.js
                
`,
              
    function(){ml(2,

    {

        Window: function pwa(findWorker,sendMessage) {
            
            const lib_file_count  = 38;
            const lib_load_name   = 'pwa';
            const lib_load_script = './ml.pwa.js';
            
            const lib = {
                newFixupRulesArray : newFixupRulesArray,
                start              : start,
                unregister         : noop,
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
                
                
                ml(9,lib_load_name,lib_load_script,lib_file_count,function(result){
                    
                    window.dispatchEvent(
                        new CustomEvent( 'ml.pwa.registered',{ detail: result })
                    );
                    
                    const persistent=true;
                    sendMessage("onCustomEvents",{},persistent,function(err,e){
                        if (err) return console.log(err);
                        
                        findWorker(function(err,worker){
                            window.dispatchEvent(
                                new CustomEvent( e.eventName,{ detail: {data:e.eventData,worker:worker} })
                            );
                        });
                        
                    });
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
                const sha1 = self.sha1Lib.cb; 
               
                ml.register("activate",function(event){
                    
                    if (dispatchCustomEvent) {
                        
                        dispatchCustomEvent({
                            eventName:'ml.pwa.activated',
                            eventData:1
                        });
                    }
                    self.clients.claim();
                    
                });
                
                ml.register("messages",{
                    
                    
                    /*
                    
                    functions in here respond when called by sendMessage (in ml.pwa-message.js), based on their name.
                    they are passed a single object (the data argument passed in to sendMessage), and should call cb with a response.
                    optionally, if an immediate response is available, they can just return it, and it will be sent.
                    in that case don't call cb
                    
                    persistent callbacks (ie event listners can be created bby the caller to sendMessage by passing persitent as true )
                    
                    in those cases, an immediate response as well as calling cb 1 or more times is permitted.
                    
                    (basically, if persistent is not true, send message dumps the unique reply channel name so any replies will be ignored)
                    
                    whenever cb is called with data, a one time broacast channel is made to handle the single reply
                    this is in keeping with being able to to be dumped from memory a any moment 
                    
                    if a function here retains cb for future callbacks, it can call it again later
                    
                     onCustomEvents is simplistic an example of this.
                    
                    
                    */
                    
                    ping : function(msg,cb){ 
                            
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
                                                    cb (tools.isDeleted(data.test) ? {deleted:data.test} : {undeleted:data.test});
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
                                                     cb (tools.isHidden(data.test) ? {hidden:data.test} : {unhidden:data.test} );
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
                     
                    getPNGZipImage : function (msg,cb) {
                        const data = msg.data;
                        if (data.zip_url ) {
                            
                            
                            zipFS.createPNGZipFromZipUrl(
                                
                                data.zip_url,data.mode,data.alias_url,
                                
                                function(err,buffer,hash){
                                    //https://stackoverflow.com/a/57824019/830899
                                    const blob = new Blob([buffer], {type: "image/png"});
                                   
                                    cb({blob:blob,hash:hash});

                            });
                            
                            
                            
                        } else {
                            cb({error:"needs zip_url"});
                        }
                    },
                    
                    fetchUpdatedURLContents : function (msg,cb) {
                         zipFS.fetchUpdatedURLContents(msg.data.url,msg.data.db||"updatedURLS",function(err,content, updated, hash){
                             if (err) return cb({error:err.message||err});
                             
                             if (msg.data.hash && !hash) {
                                 sha1(content,function(err,hash){
                                     cb({hash:hash,content:content,updated:updated,url:msg.data.url});
                                 });
                             } else {
                                cb({hash:hash,content:content,updated:updated,url:msg.data.url});
                             }
                         });
                    },
                    
                    removeUpdatedURLContents : function (msg,cb) {
                        zipFS.removeUpdatedURLContents(msg.data.url,msg.data.db||"updatedURLS",function(err){
                            if (err) return cb({error:err.message||err});
                            cb({url:msg.data.url});
                        });
                    },
                    
                    getUpdatedURLs : function (msg,cb) {
                       const regexTest = new RegExp (msg.regexTest,'');
                       zipFS.getUpdatedURLs(regexTest,msg.data.db||"updatedURLS",function(err,urls){
                           if (err) return cb({error:err.message||err});
                            cb({urls:urls});
                       });
                   },
                    
                    fixupUrl : function (msg,cb) {
                                   
                           const url = msg.data.url;
                           if (url) {
                               zipFS.fixupUrl (url,function(request){
                                    if (request) {
                                        cb(request);
                                    } else {
                                        cb({error:"not found"});
                                    }
                               });
                            }
                        
                    },
            
                    virtualDirQuery : function (msg,cb) {
                        
                        const url = msg.data.url;
                        if (url) {
                        
                            zipFS.virtualDirQuery (url).then(function(entry){
                            
                                if (entry&& entry.response) {
                                    
                                    entry.response.arrayBuffer().then(function(buffer){
                                        entry.buffer = buffer;
                                        delete entry.response;
                                        cb({entry:entry,url:url});
                                    });
                                    
                                } else {
                                  if (entry) {
                                      cb({entry:entry,url:url});
                                  } else {
                                      cb({error:url+" not found"});
                                  }
                                }
                                
                            }).catch(function(err){
                                if (err) {
                                   cb({error:err.message||err});
                                } else {
                                    cb({error:"undefined error"});
                                }
                            });
                     }
                     
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
                            data.cacheDB||data.db||"updatedURLS",
                            contentBuffer,
                            function(err,hash){
                                if (err) return cb({error:err.message||err});
                                if (data.hash ) {
                                    if (hash) {
                                        return cb({hash:hash,url:data.url});
                                    }
                                    sha1(contentBuffer,function(err,hash){
                                        cb({hash:hash,url:data.url})
                                    });
                                } else {
                                    cb({url:data.url});
                                }
                            }
                        );
                    },

                    newFixupRulesArray : function(msg,cb) {
                        if (Array.isArray(msg.rules)){
                            zipFS.newFixupRulesArray(msg.rules);
                            cb("ok");
                        } else {
                            cb({error:"not an array"});
                        }
                    },

                    registerForNotifications :function (msg,cb) {
                        const data = msg.data;
                        if (data.zip ) {
                            zipFS.getZipDirMetaTools(data.zip,function(tools) {
                                if (tools) {
                                    tools.registerForNotifications(cb);
                                } else {
                                    cb({error:'no tools for zip:'+data.zip});
                                }
                            });
                        } else {
                            cb({error:'need a zip'});
                        }
                    },
                    
                    unregisterForNotifications :function (msg,cb) {
                        const data = msg.data;
                        if (data.zip&&data.notificationId) {
                            zipFS.getZipDirMetaTools(data.zip,function(tools) {
                                if (tools) {
                                    tools.unregisterForNotifications(msg.notificationId,cb);
                                } else {
                                    cb({error:'no tools for zip:'+data.zip});
                                }
                            });
                        } else {
                            cb({error:'need a zip & notificationId'});
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
                    
                    getServiceWorkerUrls : function (msg,cb) {
                        // returns a list of urls that the service worker loaded in order to boot, in the order they were loaded by ml.sw.js
                        // *does not include ml.sw.js itself
                        
                        return ml.H.slice(0);
                        
                        
                    },
                    
                    getServiceWorkerModules : function (msg,cb) {
                        // returns a list of modules and their respective urls loaded by ml.sw.js
                        const retval = {};
                        Object.keys(ml.h).forEach(function(u){
                            Object.keys(ml.h[u].e).forEach(function(m){
                                retval[m]=u;
                            });    
                        });
                        return retval ;
                    }

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



