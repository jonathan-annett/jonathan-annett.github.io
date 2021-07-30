
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`
 
        xStoreBase | ${ml.c.app_root}ml.xs.base.js

    `,function(){ml(2,

    {
        Window: function layeredStore( lib  ) {
             
        
            return lib;
        },

        ServiceWorkerGlobalScope: function layeredStore( lib ) {

         
            return lib;
        } 
    }, {
        Window: [
           () => layeredStore
        ],
        ServiceWorkerGlobalScope: [
            () => layeredStore
        ],
        
    }

    );
    
    
     function layeredStore(layers,writeablelayer) {
         const api = ml.i.xStoreBase({
             
             removedKeysTag : ".__meta_removed",
             
             __getItem,
             __setItem,
             
             __clear,
             __removeItem,
             __keys,
             keys,
             
             
             keyExists,
         });

         // modelled on Array.some() this is an async version that acts on layers array
         // func is the name of the function to call in layers[x] eg "__getItem"
         
         function layers_some(func,key,fn,cb) {
             
             const looper =(key===undefined?loop:loop_key);
             
             looper(0);
             
             function loop(i){
                 if (i<layers.length) {
                     layers[i][func](function(value){
                         if (fn(value,layers[i])) {
                             return cb();
                         }
                         loop(i+1);
                     })
                     
                 } else {
                     if (cb) return cb();
                 }
             }
             
             
             function loop_key(i){
                 if (i<layers.length) {
                     layers[i][func](key,function(value){
                         if (fn(value,layers[i])) {
                             return cb();
                         }
                         loop_key(i+1);
                     })
                     
                 } else {
                     if (cb) return cb();
                 }
             }
         }
         
         // get all keys from all layers, filtered to removed hidden and deleted files
         function keys (cb) {
             if (cb) {
                 if (writeablelayer) {
                     // there's a writable layer, if there's also a removed files list, filter the list against that
                     writeablelayer.keyExists(api.removedKeysTag,function(exists) {
                         _keys("keys",exists ? function(ks){
                               cb(ks.filter(function(k){
                                   return ks.indexOf(k)<0;
                               }));
                         }:cb);
                     });
                     
                 } else {
                     // not writable layer, so no extra filtering required.
                     return _keys("keys",cb);
                 }
             } else {
                 // pull in the list in sync mode.
                const ks = _keys("keys");
                if (writeablelayer && writeablelayer.keyExists(api.removedKeysTag)) {
                     const removed = writeablelayer.getItem(api.removedKeysTag);
                     return removed.length===0 ? ks : ks.filter(function(k){
                         return removed.indexOf(k)<0;
                     });
                } else {
                    return ks;
                }
             }
         }
         
         // all keys from all layers, with no filtering - may include deleted files.
         function __keys (cb) {
             return _keys("__keys",cb);
         }
         
         function _keys (x,cb) {
             if (cb) {
                 return _keys_CB(x,cb);
             } else {
                 return _keys_Sync(x);
             }
         }

         function _keys_CB(x,cb) {
             //collect a list of all keys in all layers.
             if (writeablelayer) {
                 writeablelayer[x](_keys_CB_inner);
             } else {
                 _keys_CB_inner([]);                    
             }
             function _keys_CB_inner(ks) {
                 // we abuse the async "some" here treating it like a forEach (never return true and ignore the result)
                 layers_some(
                     x,undefined,//undefined=== no key argument
                 
                     function(ks){//"some" async handler - doesn't return true, so loop continues to end
                         ks.forEach(function(key){
                            if (ks.indexOf(key)<0) {
                               ks.push(key);
                            }
                         });
                     },
                     function(){//"some completion handler, we don't care about the result"
                          cb(ks);
                     });
             }
         }
         
         function _keys_Sync(x) {
             
             const ks = writeablelayer ? writeablelayer[x]() : [];
             
             layers.forEach(function(api){
                 api[x]().forEach(function(key){
                     if (ks.indexOf(key)<0) {
                        ks.push(key);
                     }
                 });
             });
             return ks;
         }
         
         
         // we need a custom keyExists which checks all layers
         // this also exracts which layer the value is in (assuming it does in fact exist)
         
         function keyExists (key,cb) {
             if (cb) {
                 return keyExists_CB(key,cb);
             } else {
                 return keyExists_Sync(key);
             }
         }
         
         function keyExists_CB(key,cb) {
             if (writeablelayer) {
                 // we need to check a removed items list
                 const removed_keys_list = api.removedKeysTag;
                 writeablelayer.keyExists(removed_keys_list,function(exists){
                     if (exists) {
                         // the list exists - grab it and test for the key
                         writeablelayer.getItem(removed_keys_list,function(removed){
                             if (removed.indexOf(key)>=0) {
                                 //the key has been removed - so return not exists.
                                 return cb(false);
                             }
                             // proceed to see if the key exists in the layers
                             checkLayers();
                         });
                         
                         
                     } else {
                         // no list exists, so we can't check it.
                         // proceed to see if the key exists in the layers
                        checkLayers();
                     }
                     
                     
                     function checkLayers() {
                         // proceed to see if it exists in the writable layer
                         writeablelayer.keyExists(key,function(exists){
                             if (exists) return cb (true);
                             layers_some("keyExists",key,function(exists,api){
                                 if (exists) {
                                     // found the key, and the api, return them both via cb
                                     cb (true,api); 
                                 }
                                 return exists;// if found, this terminates the loop
                             },
                             function(exists){
                                 if (!exists) {
                                     // if we didn't find the key return via cb with false.
                                     cb (false); 
                                 }
                             });
                         });
                     }
                     
                     
                 })
             }  else {
                 // just scan each layer from the top and stop when and if we find it
                 layers_some(
                     "keyExists",key,
                     function(exists){
                         return exists;// stop looking when exists===true
                     },
                     cb// chains   --> cb(exists,api)
                 ); 
             }
         }
         
         function keyExists_Sync(key,cb) {
            if (writeablelayer) {
                 
            }  else {
                return layers.some(function(api){
                    if (api.keyExists(key)) {
                        if (cb) cb(api);// despite being syncronous, cb can be used to extract the layer api 
                        return true;
                    }
                });
            }
         }
         
         function __getItem(key,cb){
             if (cb) {
                  return __getItem_CB (key,cb);
             } else {
                 return __getItem_Sync(key);
             }
         }
         
         function __getItem_CB(key,cb){
             keyExists_CB(key,function(exists,API){
                if (!exists) {
                    // no point in proceeding any further
                    return cb (undefined);
                } 
                // ok if we get here, it's because keyExists_Sync returns true, meaning one of the layers
                // returned true to keyExists.
                // if API is undefined, it's because the value is in the writeablelayer
                API=API||writeablelayer;
                
                API.__getItem(key,cb);
             });
         }
         
         function __getItem_Sync(key,cb_){
            let API=writeablelayer;    
            if (!keyExists_Sync(key,function(api){API=api;})) {
                // no layers (writable or otherwise returned true to key exists
                // this means we can't return a value because it is not stored anywhere
                return undefined;
            }
            // ok if we get here, it's because keyExists_Sync returns true, meaning one of the layers
            // returned true to keyExists.
            // if that key was in the writable layer, API will remain set to writeablelayer, since 
            // the callback will not have been called.
            // if the key was in another layer, the callback will have updated API to point to that api.
            // either way, we can just use that API to fetch the item.
            return API.__getItem(key);
         }

         function __setItem(key,ser,cb) {
             if (cb) {
                 return __setItem_CB(key,ser,cb);
             } else {
                 return __setItem_Sync(key,ser);
             }
         }
         
         function __setItem_CB(key,ser,cb) {
            
            keyExists_CB(key,function(exists,API){
                if (!exists) {
                     // key doesn't exist anywhere, so 
                     // we can put it anywhere but first choice is layers[0], unless writable layer exists.
                     API = writeablelayer||layers[0];
                     return API.__setItem_Sync(key,ser,cb);
                }
                // if we get here its because the key exists, and API points to where it exists.
                // if however we have a writable layer, and the key is soomewere else, we need to use that layer instead
                API = writeablelayer || API; 
                return API.__setItem(key,ser,cb);
            });
         }
         
         function __setItem_Sync(key,ser) {
             
             let API=writeablelayer;    
             if (!keyExists_Sync(key,function(api){API=api;})) {
                 // key doesn't exist anywhere, so 
                // we can put it anywhere but first choice is layers[0], unless writable layer exists.
                API = writeablelayer||layers[0];
                API.__setItem_Sync(key,ser);
                return;
             }
             // if we get here its because the key exists, and API points to where it exists.
             // if however we have a writable layer, and the key is soomewere else, we need to use that layer instead
             API = writeablelayer || API; 
             return API.__setItem(key,ser);
         }

         function __removeItem(path,cb) {
             if (cb) {
                 return removeItem_CB(path,cb);
             }
             removeItem_Sync(path);
         }

         function removeItem_CB(key,cb) {
             const removed_keys_list = api.removedKeysTag;
                     
             if (writeablelayer) {
                 // only 1 layer is designated as writable.
                  // all other layers are read only
                 writeablelayer.removeItem(key,function(){
                      
                     // see if any of the read only layers contain the key
                     layers_some("keyExists",key,function(exists){
                         return exists;
                     },function(someExist){
                         if (someExist) {
                             // we need to add an entry to the removed_keys_list
                             writeablelayer.keyExists(removed_keys_list,function(exists){
                                 if (exists) {
                                      writeablelayer.getItem(removed_keys_list,function(removed){
                                          if (removed.indexOf(key)>=0) {
                                              return cb();
                                          }
                                          // add the key to list and we are done. 
                                          removed.push(key);
                                          writeablelayer.setItem(removed_keys_list,removed,cb);
                                      });
                                 } else {
                                      // add the key to list and we are done. 
                                      writeablelayer.setItem(removed_keys_list,[key],cb);
                                 }
                             });
                         
                         } else {
                             //the item does not exist in any layer, lets' make sure it's not listed in the
                             //removed keys list, as it does not need to be
                             
                             // we need to add an entry to the removed_keys_list
                             writeablelayer.keyExists(removed_keys_list,function(exists){
                                 if (exists) {
                                     writeablelayer.getItem(removed_keys_list,function(removed){
                                         if (removed.indexOf(key)<0) {
                                             // the  key is not in the list - we are done
                                             return cb();
                                         }
                                         // remove the key from the list 
                                         removed = removed.filter(function(k){
                                             return k!==key;
                                         });
                                         if (removed.length===0) {
                                             // no point in keeping an empty list
                                             writeablelayer.removeItem(removed_keys_list,cb);
                                         } else {
                                             // write the updated list and we are done
                                             writeablelayer.setItem(removed_keys_list,removed,cb);
                                         }
                                     });
                                 
                                 } else {
                                     // there is no list, so the key can't be in it - we are done.
                                     cb();
                                 }
                             });
                             
                         }
                         
                     });  
                 });
             } else {
                 // all layers are writable, so remove it from everywhere.
                layers_some("removeItem",key,function(){},cb); 
             }
         }

         function removeItem_Sync(key) {
             const removed_keys_list = api.removedKeysTag;
             
             if (writeablelayer) {
                 // first remove the key from the writable layer (if it's there)
                 writeablelayer.removeItem(key);
                 
                 // now see if the key is any of the read only layers
                 if (layers.some(function(api){
                     return api.keyExists(key);
                 })){
                     // we need add the key to the removed keys list list
                     if (writeablelayer.keyExists(removed_keys_list)) {
                         const removed = writeablelayer.getItem(removed_keys_list);
                         if (removed.indexOf(key)<0) { 
                             removed.push(key);
                             writeablelayer.setItem(removed_keys_list,removed); 
                         }
                     } else {
                         writeablelayer.setItem(removed_keys_list,[key]);                    
                     }
                 } else {
                    // we might as well check the key is NOT in the removed list, as it does not need to be.
                    if (writeablelayer.keyExists(removed_keys_list)) {
                        // the list exists, so we might need to to update it.
                        let removed = writeablelayer.getItem(removed_keys_list);
                        if (removed.indexOf(key)>=0) { 
                            // the key is in the list, so let's remove it.
                            removed =removed.filter(function(k){
                                 return k!==key;
                            });
                            if (removed.length===0) {
                                // no point in keeping an empty list
                                writeablelayer.removeItem(removed_keys_list);
                            } else {      
                                writeablelayer.setItem(removed_keys_list,removed);
                            }
                        }
                    } 
                 }
             } else {
                // all layers are writable, just remove it from everywhere
                layers.forEach(function(api){
                    api.removeItem(key);
                });
             }        
         }
         
         function __clear(cb) {
             if (cb) {
                 return clear_CB(cb);
             } else {
                 return clear_Sync();
             }
         }
         
         function clear_CB(cb) {
             if (writeablelayer) {
                 // only 1 layer is designated as writable.
                 // all other layers are read only
                return writeablelayer.clear(function(){
                    
                    _keys_CB("__keys",function(removed){
                        if (removed.length>0) {
                            // there is at least 1 key to pseudo-delete, so write the list, and we are done. 
                            removed.sort();
                            writeablelayer.setItem(api.removedKeysTag,removed,cb);
                        } else {
                            // no need to write an empty list (and we deleted any previous list when we issued writeablelayer.clear earlier)
                            // so we are done.
                            cb();
                        }
                    });
                });
             } else {
                // all layers are writable, so clear them all.
                layers_some("clear",undefined,function(){},cb); 
             }
             
         }
         
         function clear_Sync() {
             if (writeablelayer) {
                 // only 1 layer is designated as writable.
                 // remove everything in the writable layer
                 writeablelayer.clear();
                 
                 // get a list of keys in the other layers
                 
                 const removed = _keys_Sync("__keys");
                 if (removed.length>0) {
                    removed.sort();
                    writeablelayer.setItem(api.removedKeysTag,removed);
                 }
             } else {
                 
               // all layers are writable, kust clear them all
               layers.forEach(function(api){
                   api.clear();
               });
             }

         }

         return api;
     }    

});

