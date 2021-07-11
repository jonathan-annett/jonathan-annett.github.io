
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),`
    
   xStoreBase | ml.xs.base.js

    `,function(){ml(2,ml(3),ml(4),

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
    
    
    function httpsStore ( urls , isText, noCorsTest, cacheStore, ready ) {
        
        const api = ml.i.xStoreBase({

             getItemHash,
             __getItem,
             __keys,
             __canSync:false,
             __hashesKey:".__hashes"
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
         
         function getTextOrBuffer(cb) {
             return function (buffer) {
                 const text = isText ? new TextEncoder().encode(buffer) : buffer ;
                 return cb ? cb(text) : text;
             };
         }
         
         function __getItem(url,cb) {
             if (noCorsTest && noCorsTest.test(url)) {
                 return __getItem_normal(url,cb);
             }
             return __getItem_noCors(url,cb);
         }
         
         function getItemHash(url,cb) {
             if (hashes[url]){
                 
             }
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
             
             .then(getTextOrBuffer(function(textOrBuffer){
                 api.serLib.serialize(textOrBuffer,function(ser){
                    
                     hashes[url] = {
                         sha1 : sha1Hex(ser),
                         etag : mode === "nocors" ? false : response.headers.get('etag'),
                         last : mode === "nocors" ? false : response.headers.get('last-modified')
                     }
                     
                     if (mode==="cached" && cacheStore) {
                         cacheStore.__setItem(url,ser,function(){
                             cacheStore.setItem(".__hashes",hashes,function(){
                                 cb(ser);
                             });
                         });
                     } else {
                         cb(ser,hashes[url]);
                     }
                 });
             }))
             
             .catch(function(){
                 cb();
             });
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

