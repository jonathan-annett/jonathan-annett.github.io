/* global ml,self,localforage, Rusha,dbLocalStorage,dbLocalForage, dbCommonLib */
ml(0,ml(1),[

'libEvents      | /zed/pwa/events.js',
'sha1Lib        | /zed/pwa/sha1.js',
'dbCommonLib    | /zed/pwa/dbengine.common.js ' ,
'dbLocalStorage | /zed/pwa/dbengine.localStorage.js',
'dbLocalForage  | /zed/pwa/dbengine.localForage.js',


],function(){ml(2,ml(3),ml(4),

    {
        Window:                   function dbengine(lib,evs,sha1) {return lib(evs,sha1);},
        ServiceWorkerGlobalScope: function dbengine(lib,evs,sha1) {return lib(evs,sha1);},
    }, (()=>{//                                      |   |
             //                                      |                     
            return {//                               V
                Window:                   [ ()=> hybridStorageEngine, ()=> self.libEvents, ()=>self.sha1Lib ],
                ServiceWorkerGlobalScope: [ ()=> hybridStorageEngine, ()=> self.libEvents, ()=>self.sha1Lib ],
            };
            

        function hybridStorageEngine (events,sha1) {
            
            return function (libMode,keyprefix) {
                 
                 const fromBuffertoSha1DigestBuffer = sha1; 
                 
                 var hybridLazyWriteTimeout;
                 
                 
                 
                    
                 const { keyprefix_length,
                         prefixes,
                         flushHybridCachedSyncWritesInterval,
                         generalizeKey,
                         localizeKey,
                         filterKeys,
                         removedKeySuffix } = dbCommonLib(keyprefix); 
                 
                 
                 const {
             
                         localStorageKeyKiller,
                         setLocalKey,
                         getLocalKey,
                         removeLocalKey,
                         getLocalKeys,
                         clearLocal
                         
                 } = dbLocalStorage(keyprefix);
                 
                 const {
                     
                     localForageKeyKiller,
                     setForageKey,
                     getForageKey,
                     removeForageKey,
                     getForageKeys,
                     clearForage
                     
                     
                 } = dbLocalForage(keyprefix)
                 
                 
                  
                switch (libMode){
                    case "localStorage" : return localStorageLib();
                    case "localforage"  : return localforageLib();
                    case "sw"           : return swHybridEngine();
                    case "hybrid"       : return hybridEngineLib();
                }
                
                const lib = hybridEngineLib();
                 
                Object.defineProperties(lib,{
                    
                    localStorage : {
                           value : localStorageLib(),
                           writable:false, 
                           enumerable:true, 
                           configurable:true 
                       },
                       
                    localforage : {
                          value : localforageLib(),
                          writable:false, 
                          enumerable:true, 
                          configurable:true 
                      },
                    
                    sw        : {
                        value : swHybridEngine(),
                        writable:false, 
                        enumerable:true, 
                        configurable:true 
                    }
            
                });
                
  
        
                return lib;
                
                function newEngine (mode,prefix) {
                    return hybridStorageEngine(events)(mode,prefix);
                }
                
                function dbProxy(engine) {
                    
           
                    
                    return function (prefix) {
                        
                        var 
                        changeHashes = {},
                        changeHashKeys = [],
                        ev = {}, cleanupEvents,eventNames = [
                            
                            "create", // new items only
                            "change", // new items, or when value changes
                            "set",    // new items, changes, or assigned (even if value doesn't change)
                            "get",    // when value is accessed
                            "remove"  // when value is removed
                            ];
                        
                        events(ev,eventNames);
                            
                    
                        const cb = engine.__sync ? undefined : function (){} ;
                        if (!!prefix) {
                            // supplying a prefix will create a proxied object under the current prefix.
                            // not supplying a prefix will create a proxied object over the entire engine.
                            if (typeof prefix+typeof keyprefix ==="stringstring") {
                                engine = newEngine(engine.__mode,keyprefix+prefix);
                                
                                Object.defineProperties(ev,{
    
                                    getKeys   : { value : engine.getKeys,   writable:false, enumerable:true,  configurable:true },
                                    clear     : { value : engine.clear,     writable:false, enumerable:true,  configurable:true },

                                }); 
                                
                                cleanupEvents = ev.removeAllEventTypes;
                                delete ev.removeAllEventTypes;
                                delete ev.addEventType;
                                delete ev.removeEventType;
                                
                                window.addEventListener('storage',doLocalStorageEvent);
                                
                            } else {
                                throw new Error ("unsupported prefix strategy");
                            }
                        }
                        
                        
                        function doRemove (property,cb) {
                            
                            if (ev.events.create.remove===0) {
                                delete changeHashes [property];
                                changeHashKeys = Object.keys(changeHashes);
                                engine.removeKey(property,cb);
                            } else {
                                engine.getKey(property,function(err,old){
                                    engine.removeKey(property,function(){
                                        if (!err) {
                                            ev.emitLibEvent("remove",property,changeHashes [property],old);
                                        }
                                        delete changeHashes [property];
                                        changeHashKeys = Object.keys(changeHashes);
                                        if (typeof cb==='function') {
                                            cb.apply(this,arguments);
                                        }
                                    });
                                });
                            }
                        }
                        
                        function doSet (property,value,cb) {
                            if (ev.events.create.length+ev.events.change.length+ev.events.set.length===0) {
                                
                                createChangeHash(value,function(err,hash){
                                     changeHashes [property]=hash;
                                     engine.setKey(property,value,cb);
                                });
                              
                            } else {
                                engine.getKey(property,function(err,old){
                                    createChangeHash(value,function(err,hash){
                                        changeHashes [property]=hash;
                                        engine.setKey(property,value,function(err){
                                            if (!err) {
                                                if (old) {
                                                    if (value!==old) {
                                                       ev.emitLibEvent("change",property,value,hash,old);
                                                    }
                                                } else {
                                                    ev.emitLibEvent("create",property,value,hash);
                                                    ev.emitLibEvent("change",property,value,hash);
                                                    changeHashKeys = Object.keys(changeHashes);
                                                }
                                                ev.emitLibEvent("set",property,value,hash);
                                            }
                                            if (typeof cb==='function') {
                                               cb.apply(this,arguments);
                                            }
                                        });
                                    });
                                });
                            }
                        }
                        
                        function doGet(property,value) {
                            if (ev.events.create.remove===0) {
                                return value;
                            } else {
                                ev.emitLibEvent("get",property,value,
                                function newValue(v){
                                   value=v;  
                                });
                                return value;
                            }
                        }
                        
                        function doLocalStorageEvent(e){
                            
                           engine.getKeys(function(err,keys){
                               if (err) return;
                               
                               const removedKeys = changeHashKeys.filter(function(k){ return keys.indexOf(k) <0 });
                               const newKeys     = keys.filter(function(k){ return changeHashKeys.indexOf(k) <0 });
                               
                               
                               
                               removedKeys.forEach(function(property){
                                   
                                   ev.emitLibEvent(
                                       "remove",
                                       property,
                                       changeHashes [property],
                                       undefined,
                                       true);
                                       
                                   delete changeHashes [property];
                               });

                               createChangeHashes (newKeys,engine,function(err,hashes){
                                   
                                   newKeys.forEach(function(property){
                                       engine.getKey(property,function(err,value){
                                           if (err) return;
                                           const hash = changeHashes[property] = hashes[property];
                                           ev.emitLibEvent("create",property,value,hash);
                                           ev.emitLibEvent("change",property,value,hash);
                                           
                                       });
                                   });
                                   
                               });
                               
                               let abort=false;
                               keys.filter(function(k){return newKeys.indexOf(k)<0}).some(function(property){
                                    engine.getKey(property,function(err,value){
                                        if (err) return (abort=err);

                                        compareChangeHash (value,changeHashes[property],function(err,changed,newHash){
                                            if (err) return (abort=err);
                                            
                                            if (changed) {
                                                 ev.emitLibEvent("change",property,value,newHash);
                                                 changeHashes[property]=newHash;
                                            }
                                        });
                                        
                                       
                                    });
                                    return !!abort;
                               });
                               if (abort) return cb(abort);
                               
                               changeHashKeys=keys;
                             
                           });
                        }
                        
                        
                        let createChangeHashMin = 20; 
                        function createChangeHash(v,cb) {
                            const jsonBuf = bufferFromText(JSON.stringify(v));
                            
                            if (jsonBuf.length <= createChangeHashMin ) {
                                return cb (undefined,jsonBuf);
                            }
                            
                            fromBuffertoSha1DigestBuffer(jsonBuf)
                              .then(function (buffer){
                                   
                                  cb(undefined,buffer);
                                  
                              })
                              .catch(cb);
                             
                            
    
                            function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
                            
                           
                           
                        
                        }
                        
                        function compareChangeHash (v,hash, cb) {
                            createChangeHash(v,function(err,newHash){
                               if (err) return cb(err);
                               return cb (undefined,hash=newHash,newHash);
                            });
                        }
                        
                        function createChangeHashes (keys,engine,cb) {
                            const hashes={};
                            let remain = keys.length;
                            if (remain ===0) return cb(undefined,hashes);
                            
                            keys.some(function(key,index) {
                                
                                engine.getKey(key,function(err,value){
                                    createChangeHash ( value, function (err,hash) {
                                        if (err) {
                                            cb(err);
                                            return true;
                                        }
                                        hashes[index]=hash;
                                        remain --;
                                        if (remain===0) {
                                            return cb(undefined,hashes);
                                        }
                                    });
                                });
                               
                            });
                        }
                        
                        engine.getKeys(function(err,keys){
                            if (err) return
                            createChangeHashes (keys,engine,function(err,hashes){
                                changeHashKeys = keys;
                                changeHashes = hashes;
                            });
                        });
                        
                        
                        
                        
                        function cleanupProxy() {
                             window.removeEventListener('storage',doLocalStorageEvent);
                             cleanupEvents();
                             eventNames.push("getKeys","clear");
                             while (eventNames.length>0) {
                                 delete ev[eventNames.pop()];
                             }
                        }
                        
                        return new Proxy({},{
                            get : function(target, property, receiver) {
                                
                                if (property==="_") return ev;
                                
                                return doGet(property, engine.getKey(property,cb));
                            },
                            set : function(target, property, value) {
                                if (value===null) {
                                    doRemove (property,cb);
                                } else {
                                    doSet (property,value,cb);
                                }
                                return true;
                            },
                            
                            deleteProperty: function (target, property) {
                                doRemove (property,cb)
                                return true;
                            },
                            
                            defineProperty: function(target, property, descriptor) {
                                return !(property.endsWith(removedKeySuffix) || typeof descriptor.value==='undefined');
                            },
                            
                            ownKeys: function(target) {
                                return engine.__sync ? engine.getKeys() : [];
                            },
                            
                            getOwnPropertyDescriptor : function (target, property) {
                                  const desc = {
                                    enumerable: true,
                                    configurable: true,
                                  };
                                  
                                  if ( engine.__sync ) {
                                      desc.value  = engine.getKey(property);
                                      if (!desc.value) return undefined;
                                  }
                                  
                                  return desc;
                            },
                            
                            has: function(target, property) {
                                return engine.__sync ? engine.getKeys()[property] : false;
                            }
                            
                        });
                        
                    };
                    
                       
                    
                  
                    
                    
                }
                
                
 
            
                // the "hybrid" set of wrappers around localStorage and localforage are
                // a  method of allowing a) synchronous data access in the browser if needed
                //                       b) letting service worker update localStorage
                //                       c) letting browser share data with service worker transparently.
            
                // the hybridXX_ (ending with an underscore) are called by service worker) (and internaly by the other non underscore functions)
                // the hybridXX  (without underscorce) are called by browser
                
                function hybridCache() {
                   return self.wToolsLib.hybridCache||(function(c){
                       self.wToolsLib.hybridCache=c;
                       return c;
                   }) ({ cache_id : self.wid, read:{},write : {} });
                }
                
                function hybridData(v){
                   return [v, typeof localforage==='undefined' ? 0 : Date.now()];
                }
                
                function setHybridKey_(k,v,cb) {
                    if (typeof cb !=='function') throw new Error('no callback supplied');
                    const hybrid = hybridData(v);
                    if (typeof localforage==='undefined') {
                        return cb(undefined,hybrid);
                    }
                    setForageKey(k,hybrid,function(err){
                        if (err) return cb(err);
                        cb(undefined,hybrid);
                    });
                    
                }
                
                function getHybridKey_(k,cb) {
                    if (typeof cb !=='function') throw new Error('no callback supplied');
                    if (typeof localforage==='undefined') {
                        return cb();
                    }
                    getForageKey(k,function(err,hybrid){
                        if (err) return cb(err);
                        if (hybrid===null) {
                           return cb();
                        }
                        
                        cb(undefined,hybrid[0],hybrid[1]);
                    });
                }
                
                function removeHybridKey_(k,cb) {
                    if (typeof cb !=='function') throw new Error('no callback supplied');
                    if (typeof localforage==='undefined') {
                        return cb(undefined,false);
                    }
                    
                    getForageKey(k,function(err,existingHybrid){
                        if (err) return cb(err);
                        if (!existingHybrid) {
                            return cb(undefined,false)
                        }
                        // save a null value to serve as a deletion flag should anyone read it 
                        // before deletions are resolved
                        setHybridKey_(k,null,function(deletedHybrid){
                           if (err) return cb (err);
                           // save a copy of the deleted record using same timestamp as deletion flag.
                           setForageKey(k+removedKeySuffix,[ existingHybrid, deletedHybrid[1] ],function(){
                              if (err) return cb (err);
                              cb(undefined,true);
                           });
                        });
                    });
                    
                }
                
                function getHybridKeys_(cb) {
                    if (typeof cb !=='function') throw new Error('no callback supplied');
                    if (typeof localforage==='undefined') {
                        return cb();
                    }
                    getForageKeys(cb);
                }
                
                function clearHybrid_(cb) {
                    if (typeof cb !=='function') throw new Error('no callback supplied');
                    if (typeof localforage==='undefined') {
                        return cb();
                    }        
                    
                    getHybridKeys_(function(err,localizedKeys){
                        // getHybridKeys_ removes any prefixes from the keys (the list is intended for end user consumption)
                        const notAlreadyDeleted = localizedKeys.filter(function(k){
                            if ( k.endsWith(removedKeySuffix) ) return false;
                            return localizedKeys.indexOf(k+removedKeySuffix) < 0;
                        }),proms=[], flag = hybridData(null),stamp=flag[1];
                        
                        notAlreadyDeleted.forEach(function(localizedKey){
                            // notAlreadyDeleted contains locallized keys (ie possibly without a prefix)
                            // so we need to generalize them using generalizeKey(), which will mangle or aadd needed prefix
                            proms.push(new Promise(function(resolve,reject){
                                const genkey = generalizeKey(localizedKey);
                                localforage.getItem(genkey).then (function(item){
                                 
                                   localforage.setItem(genkey,flag).then (function(){
                                       localforage.setItem(genkey+removedKeySuffix,[ item, stamp,"clear"]).then (function(){
                                           resolve();
                                       });
                                   });
                                });
                            }));
            
                        });
                        Promise.all(proms).then(function(){
                            cb();
                        }).catch (cb);
                        
                    });
                    
                }
                
               function hybridLazyWrite(cache,k,hybrid) {
                    cache.write[k]=hybrid;
                    switch(hybridLazyWriteTimeout) {
                        case true:return;
                        case undefined:break;
                        default:clearTimeout(hybridLazyWriteTimeout);
                    }
                    hybridLazyWriteTimeout=setTimeout(
                        function(){
                            hybridLazyWriteTimeout=true;
                            flushHybridCachedSyncWrites(function(){
                                hybridLazyWriteTimeout=undefined;
                            });
                        },
                        flushHybridCachedSyncWritesInterval
                    );
                    
                }
                
                function setHybridKey(k,v,keepInCache,cb) {
                    let cbok=typeof keepInCache==='function';
                    if (cbok) {
                        cb=keepInCache;keepInCache=false;
                    } else {
                        cbok=typeof cb==='function';keepInCache=keepInCache===true;
                    }
                    const cache=hybridCache();
                    if (!cbok) {
                        const hybrid=hybridData(v);
                        if (keepInCache) {
                            hybridLazyWrite(cache,k,cache.read[k]=hybrid);
                        } else {
                          delete cache.read[k];
                          hybridLazyWrite(cache,k,hybrid);
                        } 
                        return;
                    }
                    setHybridKey_(k,v,function(err,hybrid){
                        if (err) return cb(err);
                        delete cache.write[k];
                        if (keepInCache) {
                           cache.read[k]=hybrid;
                        } else {
                           delete cache.read[k];
                        }
                        setLocalKey(k,hybrid,cb);
                    });
                     
                }
                
                function getHybridKey(k,keepInCache,cb) {
                    let cbok=typeof keepInCache==='function';
                    if (cbok) {
                        cb=keepInCache;keepInCache=false;
                    } else {
                        cbok=typeof cb==='function';keepInCache=keepInCache===true;
                    }
                    
                    const cache=hybridCache();
                    const cachedWrite = cache.write[k];
                    if (cbok) {
                        
                        if (typeof localforage==='undefined') {
                            return getAsyncLocalOnly() ;
                        }
                        
                        
                        if (cachedWrite) {
                            // there is a cached (sync) update pending - we are going to flush that now
                            delete cache.write[k];
                            return getAsyncHybridWithLocalValueInWriteCache();
                            
                        } else {
                            const cachedRead = cache.read[k];
                            if (cachedRead) {
                                return getAsyncHybridWithLocalValueInReadCache(cachedRead);
                            } else {
                                // nothing is cached, so we can just go ahead and read this value.
                                return getAsyncHybridWhenNothingIsCached();
                            }
                        }
                        
                    } else {
                        if (cachedWrite) {
                            return getSyncWithLocalValueInWriteCache();
                        } else {
                            const cachedRead = cache.read[k];
                            if (cachedRead) {
                                return getSyncWithLocalValueInReadCache(cachedRead);
                            } else {
                                // nothing is cached, so we can just go ahead and read this value.
                                return getSyncWhenNothingIsCached();
                            }
                            
                        }
                    }
                    
            
                    
                    function updateLocalAndForage(data) {
                        setLocalKey(k,data,function(err){
                            
                           if (err) return cb(err);
                           setForageKey(k,data,function(){
                               removeForageKey(k+removedKeySuffix,function(){//make sure it's not flagged for deletion
                                 cb(undefined,data[0],data[1]);
                               });
                           });
                           
                        });
                    }
                    
                    function updateForageOnly(data) {
                       setForageKey(k,data,function(err){
                           removeForageKey(k+removedKeySuffix,function(){//make sure it's not flagged for deletion
                              if (err) return cb (err);
                              cb(undefined,data[0],data[1]);
                           });
                       });
                    }
                    
                    function updateLocal(data) {
                        setLocalKey(k,data,function(err){
                           if (err) return cb(err);
                           cb(undefined,data[0],data[1]);
                        });
                    }
                    
                    function updateOrRemoveLocal(hybrid) {
                        if (hybrid[0]===null) {
                            // localforage deleted the data - remove the delete flag and also anything in local/cache
                            return removeForageKey(k,function(){
                                removeForageKey(k+removedKeySuffix,function(){//make sure it's not flagged for deletion
                                    removeLocalKey(k,function(){
                                        delete cache.read[k];
                                        delete cache.write[k];
                                        return cb();
                                    });
                                });
                            });
                        } else {
                             // key was updated in localforage (so update localStorage)
                             return updateLocal(hybrid);
                        
                        }
                    }
                    
                    function getAsyncLocalOnly() {
                        
                        if (cachedWrite){
                            // data was written via sync since last check - save it to local now
                            delete cache.write[k];
                            return updateLocal(cachedWrite);
            
                        } else {
                            const cachedRead = cache.read[k];
                            if (cachedRead){
                                // data has been read/written with "keepInCache" flag, or recently read via sync - we can use it
                                // but we need to convert this to an asyc return via timeout.
                                setTimeout(cb,0,undefined,cachedRead[0],cachedRead[1]);
                            } else {
                                // there is nothing in either read or write cache for this key.
                                // 
                                return getLocalKey(k,function(err,local){
                                    if (err) return cb(err);
                                    if (keepInCache) {
                                        cache.read[k]=local;
                                    } else {
                                        delete cache.read[k];
                                    }
                                    cb(undefined,local[0],local[1]);
                                });
                            }
                        }
                    }
                    
                    function getAsyncHybridWhenNothingIsCached() {
                        
                        return getForageKey(k,function(err,hybrid){
                            if (err||!hybrid) {
                                // data did not exist in localforage
                                getLocalKey(k,function(err,local){
                                   if (err) return cb(err); // something is possibly wrong with json etc
                                   
                                   if (!local) {
                                       // key does not exist.
                                       return cb();
                                   }
                                   setForageKey(k,local,function(err){
                                       removeForageKey(k+removedKeySuffix,function(){//make sure it's not flagged for deletion
                                          if (err) console.log(err); // log, but otherwise ingore any errors in writing to localforage
                                          if (keepInCache) {
                                               cache.read[k]=local;
                                          }
                                          cb(undefined,local[0],local[1]);
                                       });
                                   });
                                });
                            } else {
                                getLocalKey(k,function(err,local){
                                    
                                   if (err||!local) {
                                       // nothing exists in localStorage, or it failed in some way (json etc)
                                       if (keepInCache) {
                                            cache.read[k]=hybrid;
                                       }
                                       if (err) {
                                           console.log("error reading localStorage, replacing with localstorage copy",err);
                                       }
                                       return updateLocal(hybrid);// we can fix that.!
            
                                   } else {
                                       
                                       if (local[1]>=hybrid[1]) {
                                           // local data is more current, update forage
                                           if (keepInCache) {
                                                cache.read[k]=local;
                                           }
                                           return updateForageOnly(local);
                                       }
                                       
                                       if (keepInCache) {
                                            cache.read[k]=hybrid;
                                       }
                                       
                                       return updateOrRemoveLocal(hybrid);
                                       
                                   }
                                });
                                    
                            }
                        });
                    }
                    
                    function getAsyncHybridWithLocalValueInReadCache(cachedRead){
                        return getForageKey(k,function(err,hybrid){
                            if (err||!hybrid) {
                                // no forage value exists, so update forage
                                return updateForageOnly(cachedRead);
                            } else {
                                if (hybrid[1]>=cachedRead[1]) {
                                    // forage value is newer than cached(local) - cache is out of date and replaces local data
                                    if (keepInCache) {
                                         cache.read[k]=hybrid;
                                    } else {
                                        delete cache.read[k];
                                    }
                                    return updateOrRemoveLocal(hybrid);
                                    
                                } else {
                                    // cachedRead (i e local) is more up to date.
                                    return updateForageOnly(cachedRead);
                                }
                            }
                        });
                    }
                    
                    function getAsyncHybridWithLocalValueInWriteCache() {
                        
                        return getForageKey(k,function(err,hybrid){
                            if (err||!hybrid) {
                                // no forage value exists, so cached updates local & forage
                                return updateLocalAndForage(cachedWrite);
                            } else {
                                if (cachedWrite[1]>=hybrid[1]) {
                                    // cached(local) value is newer than forage - cache replaces local and forage
                                    return updateLocalAndForage(cachedWrite);
                                } else {
                                    getLocalKey(k,function(err,local){
                                       
                                       if (err||!local) {
                                           // there was no local - so update local with forage
                                           return updateOrRemoveLocal(hybrid);
                                       } else {
                                           // the cache local update is newer than both local and forage
                                           if (cachedWrite[1]>=hybrid[1]) {
                                               return updateLocalAndForage(cachedWrite);
                                           }
                                            
                                           // was updated by forage (so update local)
                                           delete cache.read[k];
                                           return updateOrRemoveLocal(hybrid);
                                       }
                                    });
                                }
                                
                            }
                        });
                    }
                    
                    
                    function getSyncWhenNothingIsCached() {
                        const genkey = generalizeKey(k);
                        // sync request
                        const json = localStorage.getItem(genkey);
                        if (json) {
                            const local = JSON.parse(json); 
                            if (keepInCache) {
                                cache.read[k]=local;
                            }
                            return local[0];
                        }
                    }
                    
                    function getSyncWithLocalValueInReadCache(cachedRead) {
                        return cachedRead[0];
                    } 
                    
                    function getSyncWithLocalValueInWriteCache() {
                        if (keepInCache) {
                            cache.read[k]=cachedWrite;
                        }
                        return cachedWrite[0];
                    }
                    
                }
                
                function removeHybridKey(k,cb) {
                    const genkey = generalizeKey(k);
                    const cbok=typeof cb==='function',forageok=typeof localforage!=='undefined';
                    
                    if (cbok){
                        if (forageok) {
                           return removeForageKey(k,function(err,existed){
                               if (err) return cb(err);
                               return removeForageKey(k+removedKeySuffix,function(){
                                   localStorage.removeItem(genkey);
                                   return cb (undefined,existed);
                               });
                           });
                        } else {
                           return removeLocalKey(k,cb);
                        }
                    } else {
                        
                       const existed = !!localStorage.getItem(genkey);
                       if (existed) {
                            localStorage.removeItem(k);
                       }
                       
                       if (forageok) {
                          removeForageKey(k,function(err){
                              if (err) throw err;
                          });
                       } 
                       return existed;
                       
                    }
            
                }
                
                function flushHybridCachedSyncWrites(cb) {
                    
                    if (typeof cb !=='function') throw new Error('no callback supplied');
                    
                    const cache=hybridCache().write,keys = Object.keys(cache);
                    // keys in cache are already localized.
                    if(keys.length===0) return setTimeout(cb,0);
                    
                    Promise.all(keys.map(
                        function (key){
                            return new Promise(function(resolve){
                                // merely reading the key asyncronously will flush any write status
                                // out to localforage/localStorage
                                getHybridKey(key,function(err,x){
                                   resolve(err?null:x);
                                });
                            });
                        }
                    )).then(function(values){cb(undefined,values);});
                    
                    
                }
                
                
             
                // whilst nominally "non destructive", this call will result in keys being flagged for deleted by localforage
                // being removed from either localStorage, localforage or both (depending on timestamps)
                // if fixup is passed in, all surving keys that are in both places are opened and timestamps compared
                // if the localStorage copy is fresher it's copied to localforage (happens when a sync setItem call is made)
                // if the localforage  copy is fresher,it's copied to localStorage (happens when a service worker sets a key)
                // (note: if browser limits calls to async, it's better to never specify fixup, as this could be an expensive call)
                // setting or geetting via a browser callback autommatically deals with data being stale, as it checks both locations every time
                // hence, async calls are much slower, since sync calls are always cached.
                function getHybridKeys(fixup,cb) {
                    let cbok=typeof fixup==='function';
                    if (cbok) {
                        cb = fixup;fixup=false;
                    } else {
                        cbok=typeof cb==='function';fixup=fixup===true;
                    }
               
                    if (cbok) {
                        // before we do anything, flush any data values cached in memory out to storage
                        flushHybridCachedSyncWrites(function (err){
                            if (err) return cb(err);
                            
                            // next get a list of localforage keys - these are all localized, so any direct api storage access needs to pass the key through generalizeKey()
                            return getForageKeys(function(err,forKeys_){
                                if (err) return cb(err);
                                
                                // if there was no localforage keys returned -most likely localforage is not installed -
                                // return the list of existing localStorage keys, as that's all we can rationally do.
                                if (!forKeys_) return getLocalKeys (cb);
                                
                                const notFlagged = function(k){
                                   if (k.endsWith(removedKeySuffix)) return false;
                                };
                                const notDeleted = function(k,i,arr){
                                   return forKeys_.indexOf(k+removedKeySuffix) < 0;
                                };
                                const isDeleted = function(k,i,arr){
                                   return forKeys_.indexOf(k + removedKeySuffix) >= 0;
                                };
                                const removeForages=function (list,cb) {
                                    if (list.length===0) return cb(undefined,list);
                                    const proms = [];
                                    list.forEach(function (key){
                                        const genkey = generalizeKey(key);
                                        proms.push(localforage.removeItem(genkey));
                                        proms.push(localforage.removeItem(genkey+removedKeySuffix));
                                    });
                                    Promise.all(proms).then(function(){
                                        return cb (undefined,list)
                                    }).catch (cb);
                                };
                                const resolveCommonDeletes = function(commonDeleted,cb) {
                                   if (commonDeleted.length===0) {
                                       return cb (undefined,[]);
                                   } else {
                                       
                                       const localDeletes = commonDeleted.map(function(k){
                                          return {
                                              key:k,
                                              data:JSON.parse(localStorage.getItem(generalizeKey(k)))
                                          }
                                       });
                                       const keep = [];
                                       
                                       Promise.all(
                                           
                                           localDeletes.map(function(k){
                                                return localforage.getItem(generalizeKey(k));
                                           })
                                           
                                       ).then (function(forageDeletes) {
                                           
                                           
                                          const proms = [];
                                          localDeletes.forEach(function (local,index){
                                                const genkey = generalizeKey(local.key);
                                               if (forageDeletes[index][1] >= local.data[1]) {
                                                   
                                                   localStorage.removeItem(genkey);
                                                   proms.push(localforage.removeItem(genkey));
                                               } else {
                                                   proms.push(localforage.setItem(genkey,local.data));   
                                                   keep.push(local.key);
                                               }
                                               proms.push(localforage.removeItem(genkey+removedKeySuffix,function(){}));
                                               
                                          });
                                          
                                          if (proms.length>0) {
                                              
                                              Promise.all(proms).then (function(){
                                                  cb (undefined,keep);
                                              }).catch(function ignore(){});
                                              
                                          } else {
                                              cb (undefined,keep)
                                          }
                                           
                                       }).catch (cb);
                                       
                                       
                                   }  
                                };
                                
                                
                                // next, elliminate (for now) any flagged keys in the list of localforage keys
                                // flagged keys contain duplicates of items that have been removed by a service worker 
                                // (even items removed via the browser using a sync method will update localforage 
                                //  -albeit asychronously without a notification callback )
                                
                                const forage_keys = forKeys_.filter(notFlagged);
                                
                                // get localStorage keys (none of these will be flagged, as that only happens in localforage)
                                const local_keys = getLocStoreKeys();
                                
                                // determine forage keys not in local
                                const notInLocal =  forage_keys.filter(function(k){ return local_keys.indexOf(k)<0; });
                                // determine forage keys we can dispense with, or keep - if they are not in local, and have bene flagged for deletion, we can safely delete them without comparing  timstamps
                                const notLocalKeep = notInLocal.filter(notDeleted);
                                const notLocalCull = notInLocal.filter(isDeleted);
                                
                                // determine local keys not in forage
                                // these are keys that can't have been flagged as deleted so we can definately keep them
                                const notInForage =  local_keys.filter(function(k){ return forage_keys.indexOf(k)<0; });
                
                                // determine which keys exist in both locations 
                                const common = local_keys.filter(function(k){return forage_keys.indexOf(k)>=0});
                                // of keys that exist in both locations, determine which have been flagged as deleted by localforage
                                const commonDeleted    = common.filter(isDeleted);
                                const commonNotDeleted = common.filter(notDeleted);
                                
                                // now actually remove any items that are redundant in localforage
                                // these are keys that a) were never in localStorage, and b) have been flagged as deleted
                                removeForages(notLocalCull,function(err){
                                    if (err) return cb (err);
                                    // now compare the timestamps of items flagged for deletion and remove or keep them
                                    // - newer localStorage timestamps are kept, and the correct value saved in local forage
                                    // - newer localforage timestamps are removed from both locations
                                    resolveCommonDeletes(commonDeleted,function(err,commonKeep){
                                        if (err) return cb (err);
                                        // we got back a list of the keys that survived the timestamp comparison
                                        // now (finally), we can return the list of valid keys, sorted to caller
                                        return cb (
                                            undefined,
                                            notLocalKeep.concat(   // those were in localforage, and not in localStorage,and were not flagged for deletion
                                                notInForage,       // those that were never in localforage to begin with, so can't have been flagged 
                                                commonNotDeleted,  // those that were in both places, but not flagged 
                                                commonKeep         // those that were in both places, flagged, but a localStorage copy is newer
                                                ).sort());    
                                    });    
                                });
                
                            });
                            
                        });
                    } else {
                        
                        // since this is a synchronous call, all we can do is report the localStorage keys.
                        return getLocStoreKeys();
                    }
                    
                    function getLocStoreKeys() {
                        const keys = Object.keys(localStorage);
                        return prefixes ? keys.filter(filterKeys).map(localizeKey) : keys; 
                    }
            
                }
                
                function clearHybrid(cb) {
                    const cbok=typeof cb==='function';
                    clearLocal(function(err){
                        if (err) return errs(err);
                        clearForage(function(err){
                            if (err) return errs(err);
                            if (cbok) {
                                cb();
                            }
                        });
                    });
                    
                    function errs(err) {
                        if (cbok) {
                            return cb(err);
                        }
                        throw err;
                    }
                }
                
                function localStorageLib(){
                    const lib = {};
                    Object.defineProperties(lib,{
                        getKey    : { value : getLocalKey,    writable:false, enumerable:true,  configurable:true },
                        setKey    : { value : setLocalKey,    writable:false, enumerable:true,  configurable:true },
                        removeKey : { value : removeLocalKey, writable:false, enumerable:true,  configurable:true },
                        getKeys   : { value : getLocalKeys,   writable:false, enumerable:true,  configurable:true },
                        clear     : { value : clearLocal,     writable:false, enumerable:true,  configurable:true },
                        __sync    : { value : true,           writable:false, enumerable:false, configurable:true },
                        __mode    : { value : "localStorage", writable:false, enumerable:false, configurable:true },
                        
                    });
                    Object.defineProperties(lib,{
                        proxy   : { value : dbProxy(lib),   writable:false, enumerable:true, configurable:true },
                    })
                    return lib;
            
                }
                
                function localforageLib(){
                    const lib = {};
                    Object.defineProperties(lib,{
                        getKey    : { value : getForageKey,    writable:false, enumerable:true,  configurable:true },
                        setKey    : { value : setForageKey,    writable:false, enumerable:true,  configurable:true },
                        removeKey : { value : removeForageKey, writable:false, enumerable:true,  configurable:true },
                        getKeys   : { value : getForageKeys,   writable:false, enumerable:true,  configurable:true },
                        clear     : { value : clearForage,     writable:false, enumerable:true,  configurable:true },
                        __sync    : { value : false,           writable:false, enumerable:false, configurable:true },
                        __mode    : { value : "localforage",   writable:false, enumerable:false, configurable:true },
            
                    });
                    Object.defineProperties(lib,{
                        proxy   : { value : dbProxy(lib),   writable:false, enumerable:true, configurable:true },
                    })
                    
                    return lib;
            
                }
                
                function swHybridEngine() {
                    const lib = {};
                    Object.defineProperties(lib,{
                        getKey    : { value : getHybridKey_,    writable:false, enumerable:true, configurable:true  },
                        setKey    : { value : setHybridKey_,    writable:false, enumerable:true, configurable:true  },
                        removeKey : { value : removeHybridKey_, writable:false, enumerable:true, configurable:true  },
                        getKeys   : { value : getHybridKeys_,   writable:false, enumerable:true, configurable:true  },
                        clear     : { value : clearHybrid_,     writable:false, enumerable:true, configurable:true  },
                        __sync    : { value : false,            writable:false, enumerable:false, configurable:true },
                        __mode    : { value : "sw",             writable:false, enumerable:false, configurable:true },
            
                    });
                    Object.defineProperties(lib,{
                        proxy   : { value : dbProxy(lib),   writable:false, enumerable:true, configurable:true },
                    })
                    
                    
                    return lib;
            
                }
                
                function hybridEngineLib() {
                    const lib = {};
                    
                    Object.defineProperties(lib,{
                        getKey    : { value : getHybridKey,    writable:false, enumerable:true,  configurable:true },
                        setKey    : { value : setHybridKey,    writable:false, enumerable:true,  configurable:true },
                        removeKey : { value : removeHybridKey, writable:false, enumerable:true,  configurable:true },
                        getKeys   : { value : getHybridKeys,   writable:false, enumerable:true,  configurable:true },
                        clear     : { value : clearHybrid,     writable:false, enumerable:true,  configurable:true },
                        __sync    : { value : true,            writable:false, enumerable:false, configurable:true },
                        __mode    : { value : "hybrid",        writable:false, enumerable:false, configurable:true },
                
                    });
                    Object.defineProperties(lib,{
                        proxy   : { value : dbProxy(lib),   writable:false, enumerable:true, configurable:true },
                    })
                    
                    return lib;
                }
            
              }  
        }
        

      
    })()

    );

});
