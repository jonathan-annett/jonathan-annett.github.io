
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   'xStoreBase | ml.xs.base.js'
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function cachedStoreWrapper( lib  ) {
             
        
            return lib;
        },

        ServiceWorkerGlobalScope: function cachedStoreWrapper( lib ) {

         
            return lib;
        } 
    }, {
        Window: [
           () => cachedStoreWrapper
        ],
        ServiceWorkerGlobalScope: [
            () => cachedStoreWrapper
        ],
        
    }

    );
    
    
             
     function cachedStoreWrapper(source,cache){
         
         
         const api = ml.i.xStoreBase({
             __getItem,
             __setItem,
             getItemHash,
             
             __clear,
             __removeItem,
             __keys
         });
         
         
         function __keys (cb) {
             return source.__keys(cb);
         }
         
         if (api.canSync) {
             preloadCache ();
         } else {
             preloadCache(function(){
                 
             });
         }
         
         const hashes = {};
         
         function __clear (cb) {
             Object.keys(hashes).forEach(function(k){delete hashes[k];});
             if (cb) {
                cache.clear(function(){
                   source.clear(cb);
                });
             } else {
                 cache.clear();
                 source.clear();
             }
         }
         
         function __removeItem (key,cb) {
             if (cb) {
                 cache.removeItem(key,function(){
                     source.removeItem(key,function(){
                         delete hashes[key];
                         cb();
                     })
                 })
             } else {
                cache.removeItem(key);
                source.removeItem(key);
                delete hashes[key];
             }
         }
         
         function preloadCache (cb) {
             if (cb) {
                 
             } else {
                 // any items without a hash are by definition not cached.
                 // by fetching every hash, we quickly ignore those already cached, 
                 // and those not cached will be copied to the chache. 
                 source.keys().forEach(function(k){getItemHash(k)});
             }
         }
         
         function getItemHash (key,cb) {
             
             let result = hashes[key];
             if (result) {
                 return cb?cb(result):result;
             }
             if (cb) {
                 //calling __getItem will cache and hash it, we just ignore the data result.
                 return __getItem(key,function(){
                     return cb (hashes[key]);
                 });
             } else {
                 //calling __getItem will hash it, we just ignore the data result.
                 __getItem(key);
                 return hashes[key];
             }
            
         }
         
         function __getItem (key,cb) {
            if (cb) {
                return __getItem_CB(key,cb);
            }  else {
                return __getItem_Sync(key);
            }
         }
         
         function __getItem_CB (key,cb) {
             cache.keyExists(key,function(exists){
                 if (exists) {
                     return cache.__getItem(key,exit);
                 }  
                 source.keyExists(key,function(exists){
                     if (exists) {
                         return source.__getItem(key,exit);
                     }  
                     return cb();
                 });
                 
             });
             
             function exit(ser) {
                 hashes[key]=api.sha1Hex(ser);
                 cb(ser);
             }
         }
         
         function __getItem_Sync (key) {
             let ser = cache.keyExists(key) && cache.__getItem(key);
             if (ser) return exit(ser);
             ser = source.keyExists(key) && source.__getItem(key);
             if (ser) {
                 cache.__setItem(key,ser);
                 return exit(ser);
             }
             
             
             function exit(ser) {
                 hashes[key]=api.sha1Hex(ser);
                 return ser;
             }
         }
         
         
         function __setItem(key,ser,cb) {
             if (cb) {
                 return __setItem_CB(key,ser,cb);
             }  else {
                 return __setItem_Sync(key,ser);
             }
         }
         
         function __setItem_CB (key,ser,cb) {
             cache.__setItem(key,ser,function(){
                 source.__setItem(key,ser,cb);
             });
         }
         
         function __setItem_Sync (key,ser) {
             cache.__setItem(key,ser);
             source.__setItem(key,ser);
         }
         
     }
    

});

