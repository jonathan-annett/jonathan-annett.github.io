
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),`
    
   xStoreBase | ml.xs.base.js

    `,function(){ml(2,

    {
        Window: function httpsStore( lib  ) {
             
        
            return lib;
        },

        ServiceWorkerGlobalScope: function httpsStore( lib ) {

         
            return lib;
        } 
    }, {
        Window: [
           () => httpsStore
        ],
        ServiceWorkerGlobalScope: [
            () => httpsStore
        ],
        
    }

    );
    
    
    function httpsStore ( urls , noCorsTest, cacheStore, ready  ) {
        
        const api = ml.i.xStoreBase({

             getItemHash,
             setItem,         // overides the default serilization, 
                              // because a) technically this is read only, 
                              //         b) to enable custom custom handlers __serialize & __deserialize
             __getItem,
             __keys,
             __canSync:false,
             __hashesKey:".__hashes",
             __serialize   : default__serialize,    // allow wrapping of buffer or converting to text etc
             __deserialize : default__deserialize   // allow unwrapping
         });
         
        
        const sha1Hex = api.serLib.sha1Hex;
        
         
         var hashes;
         
         if (cacheStore){
             // this is a cached web store, so pull in the cache index for speedy lookups.
             if (cacheStore.__canSync) {
                 // we can do it in sync mode - always fasster, and negates having to 
                 // defer callbacks to notify ready.
                 const hashesExist = cacheStore.keyExists(api.__hashesKey); 
                 hashes = hashesExist ? cacheStore.getItem(api.__hashesKey) : {};
                 if (!hashesExist) {
                     // probably first time, or someone trashed the index. 
                     // trash everything so we don't end up with orphaned cache data.
                     cacheStore.__clear();
                 }
                 // and if notifying, notify
                 if (ready) ready(api);
             } else {
                 
                 cacheStore.keyExists(api.__hashesKey,function(exists){
                     if (exists) {
                         // there's a cache index - pull it in now.
                         cacheStore.getItem(api.__hashesKey,function(h){
                             hashes = h;
                             if (ready) ready(api);
                         });
                     } else {
                         
                        // if there's no hashes index, dump any cached data, as we can't validate it/
                        cacheStore.__clear(function(){
                            // make an empty hash index
                            hashes = {};
                            if (ready) ready(api);
                        });
                      
                     }
                 }); 
             }
         }
         if (ready && !cacheStore) {
             // notify the api is ready
             ready(api);
         }
         
         // return api to immediate caller.
         return api;
         
         
         function default__serialize (serialize,url,buffer,cb) {
             serialize(buffer,cb);
         }
         
         
         function default__deserialize (deserialize,url,ser,cb) {
            deserialize(ser,cb);
         }
         
         function textBufferUnwrap(buffer,cb) {
            return cb (new TextEncoder().encode(buffer));
         }
         
         function textBufferWrap(text,cb) {
            return cb (new TextDecoder().decode(text));
         }
         
          
         function setItem(url,buffer,cb,getting) {
             
             api.__serialize (api.serLib.serialize,url,buffer,function(ser){
                 hashes[url] = {
                     sha1 : sha1Hex(ser)
                 };
                 
                 if (cacheStore) {
                     cacheStore.__setItem(url,ser,function(){
                         cacheStore.setItem(".__hashes",hashes,function(){
                             if (getting) {
                                cb(ser);
                             } else {
                                 cb();
                             }
                         });
                     });
                 } else {
                     if (getting) {
                        cb(ser,hashes[url]);
                     } else {
                        cb(); 
                     }
                 }
             });
         }
         
         
         function __getItem(url,cb) {
             if (noCorsTest && noCorsTest.test(url)) {
                 
                 return (cacheStore  ? __getItem_viaCache :  __getItem_normal)(url,cb);
             }
             return (cacheStore  ? __getItem_viaCache_noCors :  __getItem_noCors) (url,cb);
         }
         
         function getItemHash(url,cb) {
             const hash = hashes[url];
             if (hash){
                 return cb(hash);
             }
             __getItem(url,function(){
                 return cb(hashes[url]);
             });
    
         }
         
         function __getItem_viaCache(url,cb){
             if (cacheStore && hashes[url] && hashes[url].last || hashes[url].etag) {
                cacheStore.keyExists(url,function(exists){
                    if (!exists) {
                        return __getItem_normal(url,cb);
                    }
                    const options = { headers : {} };
                    if (hashes[url].last) {
                        options.headers['if-modified-since']=hashes[url].last;
                    }
                    if (hashes[url].etag) {
                        options.headers['if-none-match']=hashes[url].etag;
                    }
                    fetch(url,options)
                    
                    
                    .then(function(response){ 
                        if (response && response.status>=200 && response.status < 300) { 
                            return saveItemAndExit(url,response,"cached",cb);
                        }
                        // get the serialized data
                        cacheStore.__getItem(url,cb);
                    });
                    
                    
            
                })
             } else {
                return __getItem_normal(url,cb);
             }
         }
         
       
         function __getItem_normal(url,cb){
             // __getItem is a mandtory item, but expect serialzied data
             // so... we serialize the response data, so whoever calls this gets the correct format.
             // (we also override the non serialsized version - see above, to make it more efficent for direct calls)
             
              fetch(url).then(function(response){
                if (response && response.status>=200 && response.status < 300) { 
                    saveItemAndExit(url,response,"normal",cb);
                } else {
                   cb();  
                }
             }).catch(function(){
                 cb();
             }) ;
         
             
         }
         
         function saveItemAndExit(url,response,mode,cb){
             response.arrayBuffer()
             
             .then(function(buffer){
                 
                   setItem(url,buffer,cb,true);

             })
             
             .catch(function(){
                 cb();
             });
         }
         
         
         function __getItem_viaCache_noCors(url,cb){
             if (cacheStore && hashes[url] && hashes[url].last || hashes[url].etag) {
                cacheStore.keyExists(url,function(exists){
                    if (!exists) {
                        return __getItem_normal(url,cb);
                    }
                    fetch(url,{mode:'no-cors'})
                    
                    
                    .then(function(response){ 
                        if (response && response.status>=200 && response.status < 300) { 
                            return saveItemAndExit(url,response,"cached",cb);
                        }
                        // get the serialized data
                        cacheStore.__getItem(url,cb);
                    });
                    
                    
            
                })
             } else {
                return __getItem_normal(url,cb);
             }
         }
         
         function __getItem_noCors(url,cb){
             // __getItem is a mandtory item, but expect serialzied data
             // so... we serialize the response data, so whoever calls this gets the correct format.
             // (we also override the non serialsized version - see above, to make it more efficent for direct calls)
             fetch(url,{mode:'no-cors'}).then(function(response){
                if (response && response.status>=200 && response.status < 300) { 
                    saveItemAndExit(url,response,"nocors",cb);
                } else {
                   cb();  
                }
             }).catch(function(){
                 cb();
             }) ;
             
         }

         function __keys(cb) {
             const k=urls.slice();
             if (cb) {
                setImmediate(cb,k);
             } else {
                return k; 
             }
         }
        
    }
    
  

});

