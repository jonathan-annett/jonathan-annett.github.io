
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`

    xStoreBase | ${ml.c.app_root}ml.xs.base.js

`,function(){ml(2,
    {
        Window: function memoryStore( lib  ) {
             
        
            return lib;
        },

        ServiceWorkerGlobalScope: function memoryStore( lib ) {

         
            return lib;
        } 
    }, {
        Window: [
           () => memoryStore
        ],
        ServiceWorkerGlobalScope: [
            () => memoryStore
        ],
        
    }

    );
    
    
    
     function memoryStore ( opts ) {
         
         const store={};
         
         const api = self.xStoreBase({
             __getItem,
             __setItem,
             
             __clear,
             __removeItem,
             __keys
         },opts);
         
         const setImmediate = api.setImmediate;
         
         return api;
         
         function __setItem(key,ser,cb){
             store[key]=ser;
             if (cb) {
                 setImmediate(cb);
             }
         }
         
         function __getItem(key,cb){
             if (cb) {
                     cb(store[key]);
             } else {
                 return store[key];
             }
         }
    
         function __removeItem(key,cb) {
             
                 delete  store[key];
                 if (cb) {
                     setImmediate(cb);
                 }
         }
         
        
         function __clear(cb) {
             Object.keys(store).forEach(function(k){
                 delete store[k];
             });
             if (cb) {
                 cb();
             }
         }
         
         function __keys(cb) {
             const k=Object.keys(store);
             if (cb) {
                setImmediate(cb,k);
             } else {
                return k; 
             }
         }
         
     }   

});

