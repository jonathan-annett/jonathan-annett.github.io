
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`

   xStoreBase     | ml.xs.base.js
   localforage    | https://unpkg.com/localforage@1.9.0/dist/localforage.js
   
    `,function(){ml(2,ml(3),ml(4),

    {
        Window: function localForageStore( lib  ) {
             
        
            return lib;
        },

        ServiceWorkerGlobalScope: function localForageStore( lib ) {

         
            return lib;
        } 
    }, {
        Window: [
           () => localForageStore
        ],
        ServiceWorkerGlobalScope: [
            () => localForageStore
        ],
        
    }

    );
    
    function localForageStore ( lf , syncStore ) {
        const LF_AVAIL = !!ml.i.localForage;
        lf = lf || (LF_AVAIL ? ml.i.localForage : ml.i.memoryStore ( ) );
        let canSync = !!syncStore;
        let syncGetter = syncStore;
        if (!LF_AVAIL) {
            if (canSync) {
                syncStore = undefined;
                syncGetter = lf;
            }
        }
        const api = ml.i.xStoreBase({
            __canSync : canSync,
            __getItem,
            __setItem,
            __clear,
            __removeItem,
            __keys
        });
        
        if (syncStore) {
            // sync store is a memory copy of all keys, used to allow synchronous access when reading
            
            if (syncStore===true) {
                // if caller hasn't passed in an actual object, but instead said "true", make a memoryStore object
                syncStore = ml.i.memoryStore ( );
            }
            api.pullFrom(syncStore,false,swallow);
        }
        
        return api;

            function __setItem(key,ser,cb){
                if (syncStore) syncStore.__setItem(key,ser); 
                lf.setItem(key,ser).then(cb||swallow).catch(swallow);
            }
            
            function __getItem(key,cb){
               if (cb) {
                       lf.getItem(key).then(cb).catch(swallow);
               } else {
                   if (canSync) {
                       return syncGetter.getItem(key); 
                   } else {
                       throw new Error ('sync __getItem not supported');
                   }
               }
            }
            
            
           
           function __removeItem(key,cb) {
               if (syncStore) syncStore.removeItem(key); 
               lf.removeItem(key).then(cb||swallow).catch(swallow);
          }
           
          
           function __clear(cb) {
               if (syncStore) syncStore.clear(); 
               lf.clear().then(cb||swallow).catch(swallow);
           } 
           
           function __keys(cb) {
               if (cb) {
                  lf.keys().then(cb).catch(swallow);
               } else {
                   if (syncStore) return syncStore.keys(); 
                   throw new Error ('sync keys not supported');
               }
           }
           
           function swallow() {}
        
        
    }      

       
   

});

