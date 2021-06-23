


/* global ml,self */
ml(0,ml(1),[  ' dbCommonLib | dbengine.common.js '  ],function(){ml(2,ml(3),ml(4),

    {   // module construtor definition
        Window:                   function dbLocalStorage(lib) {return lib;},
        
        ServiceWorkerGlobalScope: function dbLocalStorage(lib) { return lib;},
    }, (()=>{  return {
        // module import resolver
        Window:                   [ ()=>localStorageLib ],
        ServiceWorkerGlobalScope: [ ()=>localStorageLib ],

    };
      
      function localStorageLib ( keyprefix ) {
          
          const { keyprefix_length,
                  prefixes,
                  flushHybridCachedSyncWritesInterval,
                  generalizeKey,
                  localizeKey,
                  filterKeys,
                  removedKeySuffix } = self.dbCommonLib(keyprefix); 
          
          
          const lib = {
              
              localStorageKeyKiller,
              setLocalKey,
              getLocalKey,
              removeLocalKey,
              getLocalKeys,
              clearLocal
              
              
          };
          
          return lib;
          
          function localStorageKeyKiller (key) {
               return localStorage.removeItem(key);
          }

          function setLocalKey(k,v,cb) {
              // this function is localforage-agnostic, and can be called synchronusly or async (can supply a callback)
              // this function is also cache-agnostic. data WILL be written to localStorage as a result of this call
              const cbok=typeof cb==='function';
              const syncAsync=function(){
                  try { 
                       const json = JSON.stringify(v);
                       localStorage.setItem(generalizeKey(k),json);
                       return cbok ? cb() : cb;
                   } catch (e) {
                       if (cbok) return cb(e)
                       throw e;
                   }
              };
              return cbok?setTimeout(syncAsync,0):syncAsync();
          }
          
          function getLocalKey(k,cb) {
              // this function is localforage-agnostic, and can be called synchronusly or async (can supply a callback)
              // this function is also cache-agnostic. data WILL be read from localStorage as a result of this call
              
              
              const cbok = typeof cb==='function';
              const syncAsync=function(){
                  try {
                    //note: JSON.parse(null) returns null, so no need to check for no data scenario
                    const data=JSON.parse(localStorage.getItem(generalizeKey(k)));
                    return cbok ? cb(undefined,data) : data;
                  } catch (e) {
                    if (cbok) return cb(e);
                    throw e;
                  }
              };              
              return cbok?setTimeout(syncAsync,0):syncAsync();
          }
          
          function removeLocalKey(k,cb) {
              
              // this function is localforage-agnostic, and can be called synchronusly or async (you can supply a callback)
              // this function is also cache-agnostic. existing data WILL be removed from localStorage as a result of this call
              
              const cbok=typeof cb==='function';
              const genkey=generalizeKey(k);
              const syncAsync=function(){
                  try { 
                       const existed=!!localStorage.getItem(genkey);
                       if (existed) {
                           localStorage.removeItem(genkey);
                       }
                       return cbok ? cb(undefined,existed) : existed;
                   } catch (e) {
                       if (cbok) return cb(e)
                       throw e;
                   }
              };
              return cbok?setTimeout(syncAsync,0):syncAsync();
          }
          
          function getLocalKeys (cb) {
              // this function is localforage-agnostic, and can be called synchronusly or async (can supply a callback)
              // this function is also cache-agnostic. keys returned will be actual keys from localStorage as a result of this call
              const cbok=typeof cb==='function';
              const syncAsync=function(){
                  const keys = Object.keys(localStorage);
                  const retkeys = prefixes ? keys.filter(filterKeys).map(localizeKey) : keys;
                  return cbok ? cb (retkeys) : retkeys;
              };
              return cbok ? setTimeout(syncAsync,0) : syncAsync();        
          }
          
          function clearLocal(cb) {
              const cbok=typeof cb==='function';
              const syncAsync=function(){
                  if (prefixes) {
                     Object.keys(localStorage).filter(filterKeys).forEach(localStorageKeyKiller); 
                  } else {
                     localStorage.clear();
                  }
                  return cbok ? cb () : undefined;
              };
              return cbok ? setTimeout(syncAsync,0) : syncAsync();           
          }

      }
      
    })()

    );
    

});




