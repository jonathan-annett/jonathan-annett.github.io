


/* global ml,self,localforage  */
ml(0,ml(1),[ 
    
    'dbCommonLib | dbengine.common.js ',
    'localforage | https://unpkg.com/localforage@1.9.0/dist/localforage.js'
    
    ],function(){ml(2,ml(3),ml(4),

    {   // module construtor definition
        Window:                   function dbLocalForage(lib) {return lib;},
        
        ServiceWorkerGlobalScope: function dbLocalForage(lib) { return lib;},
    }, (()=>{  return {
        // module import resolver
        Window:                   [ ()=>localForageLib],
        ServiceWorkerGlobalScope: [ ()=>localForageLib],

    };
      
      function localForageLib ( keyprefix ) {
          
          const { keyprefix_length,
                  prefixes,
                  flushHybridCachedSyncWritesInterval,
                  generalizeKey,
                  localizeKey,
                  filterKeys,
                  removedKeySuffix } = self.dbCommonLib(keyprefix); 
          
          
          const lib = {
              
              localForageKeyKiller,
              setForageKey,
              getForageKey,
              removeForageKey,
              getForageKeys,
              clearForage
              
              
          };
          
          return lib;
          
          function localForageKeyKiller  (key) {
              return localforage.removeItem(key);
          }
  
          
          function setForageKey(k,v,cb) {
              // this function is localStorage-agnostic, and MUST be called asynchronusly (you MUST supply a callback)
              // this function is also cache-agnostic. data WILL be written to localforage as a result of this call
              if (typeof cb !=='function') throw new Error('no callback supplied');
              self.localforage.setItem(generalizeKey(k),v).then(function(){
                   cb();
               }).catch(cb);
          }
          
          function getForageKey(k,cb) {
              // this function is localStorage-agnostic, and MUST be called asynchronusly (you MUST supply a callback)
              // this function is also cache-agnostic. data WILL be read from localforage as a result of this call
              if (typeof cb !=='function') throw new Error('no callback supplied');
              
              self.localforage.getItem(generalizeKey(k)).then(function(v){
                  cb(undefined,v);
              }).catch(cb);
          }
      
          function removeForageKey(k,cb) {
              // this function is localStorage-agnostic, and MUST be called asynchronusly (you MUST supply a callback)
              // this function is also cache-agnostic. existing data WILL be removed from localforage as a result of this call
              const genkey = generalizeKey(k);
              if (typeof cb !=='function') throw new Error('no callback supplied');
              self.localforage.getItem(genkey).then(function(v){
                  
                  return v===null ? cb(undefined,false) : self.localforage.removeItem(genkey).then(function(){
                      cb(undefined,true);
                  }).catch(cb) ;
                  
              }).catch(cb);
          }
          
          function getForageKeys(cb) {
              // this function is localStorage-agnostic, and MUST be called asynchronusly (you MUST supply a callback)
              // this function is also cache-agnostic. keys returned will be actual keys from localforage as a result of this call
              if (typeof cb !=='function') throw new Error('no callback supplied');
              localforage.keys().then(function(keys) {
                  // An array of all the key names, localized (ie no prefixes and/or demangled)
                  cb(undefined,keys.filter(filterKeys).map(localizeKey));
              }).catch(cb);
      
          }
          
          function clearForage(cb) {
              const cbok=typeof cb==='function';
              const syncAsync=function(){
                  
                  const promise = prefixes ? Promise.all(Object.keys(localStorage).filter(filterKeys).map(localForageKeyKiller))
                                           : localforage.clear();
                                           
                  promise.then(function() {
                          if (cbok) cb();
                  }).catch(function(err) {
                      if (cbok) cb(err); else throw err;
                  });
                  
              };
              return cbok ? setTimeout(syncAsync,0) : syncAsync();             
          }
     

      }
      
    })()

    );
    

});




