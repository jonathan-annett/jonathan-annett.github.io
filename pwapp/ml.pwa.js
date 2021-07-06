/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'swResponseZipLib@ServiceWorkerGlobalScope  | ml.zipfs.js',
    'pwaMessage@Window                          | ml.pwa-message.js',
    'sha1Lib                                    | sha1.js'
   

    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function pwa(findWorker,sendMessage) {
            
            
            const lib = {
               
               toggleDeleteFile : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                        zip    : zip_url,
                        toggle : file
                   });
               },
               
               deleteFile       : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                       zip : zip_url,
                       add : file
                   },cb);
               },
               
               unDeleteFile     : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                       zip    : zip_url,
                       remove : file
                   },cb);
               },
               
               isDeleted     : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                        zip    : zip_url,
                        test   : file
                   },cb);
               },
               
               writeFileString : function (zip_url,file,text,hash,cb) {
                   if (typeof hash==='function') {
                       cb   = hash;
                       hash = false;
                   }
                   sendMessage('writeFileString',{
                       zip    : zip_url,
                       file   : file,
                       text   : text,
                       hash   : hash
                   },cb);
               },
               
               readFileString : function (zip_url,file,hash,cb) {
                   if (typeof hash==='function') {
                       cb   = hash;
                       hash = false;
                   }
                    sendMessage('readFileString',{
                        zip    : zip_url,
                        file   : file,
                        hash   : hash
                    },cb);
               },
               
               isHidden : function (zip_url,file,cb) {
                   sendMessage('hidden',{
                       zip    : zip_url,
                       test   : file
                   },cb);
               },

               removeUpdatedURLContents  : function (url,cb) {
                  sendMessage('removeUpdatedURLContents',{
                     url    : url,
                  },cb);
               },
               
               updateURLContents : function (url,content,hash,cb) {
                   if (typeof hash ==='function') {
                       cb = hash;
                       hash=false;
                   }
                   sendMessage('updateURLContents',{
                       url     : url,
                       content : content,
                       hash    : hash
                   },cb);
               },
               
               fetchUpdatedURLContents : function (url,hash,cb) {
                   if (typeof hash ==='function') {
                       cb = hash;
                       hash=false;
                   }
                   sendMessage('fetchUpdatedURLContents',{
                       url    : url,
                       hash   : hash
                   },cb);
                   
               },
               
 
                newFixupRulesArray : newFixupRulesArray,
                start              : start,
                unregister         : noop,
                getPNGZipImage     : getPNGZipImage
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
            
            
            function getPNGZipImage(zip_url,mode,alias_url,imageEl,linkEl,linkText,cb) {
                
                if (typeof linkText==='function') {
                    cb = linkText;
                    linkText = undefined;
                }
                
                if (typeof linkEl==='function') {
                    cb = linkEl;
                    linkText = undefined;
                    linkEl = undefined;
                }
                
                
                if (typeof imageEl==='function') {
                    cb = imageEl;
                    imageEl = undefined;
                    linkText = undefined;
                    linkEl = undefined;
                }
                
                if (typeof alias_url==='function') {
                    cb = alias_url;
                    alias_url = undefined;
                    imageEl = undefined;
                    linkText = undefined;
                    linkEl = undefined;
                }
                 
                 
                if (typeof zip_url+typeof mode ==='stringstring' && 'stringundefined'.indexOf(typeof alias_url)>=0) {
                    if (imageEl||linkEl||linkText||cb) {
                        return sendMessage("getPNGZipImage",{
                            zip_url:zip_url,
                            mode:mode,
                            alias_url:alias_url},function(err,data){
                            
                            if (typeof cb==='function') cb(data.link);
                            
                            if (linkEl){    
                                const link = document.createElement("a");
                                link.download = zip_url.split('/').pop().replace(/\.zip$/,'-'+data.hash+ ".png");
                                link.href = data.link;
                                link.appendChild(new Text(linkText||"Download data"));
                                link.addEventListener("click", function() {
                                    this.parentNode.removeChild(this);
                                    // remember to free the object url, but wait until the download is handled
                                    setTimeout(revoke, 500)
                                });
                                linkEl.appendChild(link);
                            }
                            if (imageEl) {
                                imageEl.src = data.link;
                                if (!linkEl) {
                                   imageEl.onload = revoke;
                                }
                            }
                            
                           
                            
                            if (!imageEl && ! linkEl) {
                                revoke();
                            }
                            
                            function revoke(){URL.revokeObjectURL(data.link);}
                        });
                    }
                }
                
                throw vew Error ("incorrect arugments to getPNGZipImage");
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
                            eventName:ml.pwa.activated,
                            eventData:1
                        });
                    }
                    self.clients.claim();
                    
                });
                
                ml.register("messages",{
                    
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
                     
                             
                    writeFileString : function (msg,cb) {
                        const data = msg.data;
                        if (data.zip && data.file && data.text) {
                            zipFS.getZipDirMetaTools(data.zip,function(tools) {
                                if (tools) {
                                     if (data.hash) {
                                         tools.writeFileString(data.file,data.text,data.hash,cb);
                                     } else {
                                         tools.writeFileString(data.file,data.text,cb);
                                     }
                                } else {
                                    cb({error:"could not access zip tools"});
                                }
                            });
                        } else {
                            cb({error:"needs zip + toggle/add/remove"});
                        }
                    
                    },
                    
                    readFileString : function (msg,cb) {
                        const data = msg.data;
                        if (data.zip && data.file) {
                            zipFS.getZipDirMetaTools(data.zip,function(tools) {
                                if (tools) {
                                    if (data.hash) {
                                       tools.readFileString(data.file,data.hash,cb);
                                    } else {
                                       tools.readFileString(data.file,cb);
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
                        if (data.zip ) {
                            
                            
                            zipFS.createPNGZipFromZipUrl(
                                
                                data.zip_url,data.mode,data.alias_url,
                                
                                function(err,buffer,hash){
                                    //https://stackoverflow.com/a/57824019/830899
                                    const blob = new Blob([buffer], {type: "image/png"});
                                    const url = URL.createObjectURL(blob);
                                    cb({link:url,hash:hash});

                            });
                            
                            
                            
                        } else {
                            cb({error:"needs zip + toggle/add/remove"});
                        }
                    },
                    
                    
              
                    
                    fetchUpdatedURLContents : function (msg,cb) {
                         zipFS.fetchUpdatedURLContents(msg.data.url,function(err,content, updated){
                             if (err) return cb({error:err.message||err});
                             
                             if (msg.data.hash) {
                                 sha1(content,function(err,hash){
                                     cb({hash:hash,content:content,updated:updated});
                                 });
                             } else {
                                cb({content:content,updated:updated});
                             }
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
                                if (data.hash) {
                                    sha1(contentBuffer,function(err,hash){
                                        cb({hash:hash})
                                    });
                                } else {
                                    cb({});
                                }
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



