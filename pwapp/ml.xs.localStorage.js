
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),`

    xStoreBase | ml.xs.base.js

`,function(){ml(2,ml(3),ml(4),
    {
        Window: function localStorageStore( lib  ) {
             
        
            return lib;
        },

        ServiceWorkerGlobalScope: function localStorageStore( lib ) {

         
            return lib;
        } 
    }, {
        Window: [
           () => localStorageStore
        ],
        ServiceWorkerGlobalScope: [
            () => localStorageStore
        ],
        
    }

    );
    
    
       
     function localStorageStore ( ls ) {
         
         
         ls = ls || (typeof localStorage !=='undefined' ? localStorage : self.memoryStore ( ) );
         
         const api = self.xStoreBase({
             __getItem,
             __setItem,
             __clear,
             __removeItem,
             __keys
         });

         return api;
         
         
         function __setItem(key,ser,cb){
             ls.setItem(key,ser)
             if (cb) {
                 setImmediate(cb);
             }
         }
         
         function __getItem(key,cb){
             if (cb) {
                     cb(ls.getItem(key));
             } else {
                 return ls.getItem(key);
             }
         }
         
        function __removeItem(key,cb) {
            ls.removeItem(key);
            if (cb) {
                setImmediate(cb);
            }
        }
            
               
        function __clear(cb) {
            ls.clear();
            if (cb) setImmediate(cb);
        } 
        
        function __keys(cb) {
            const k=Object.keys(ls);
            if (cb) {
               setImmediate(cb,k);
            } else {
               return k;   
            }
        }

     }      


});

