
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   'serializerLib | ml.xs.serializer.js'
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function xStoreBase( lib ) {
            return lib;
        },

        ServiceWorkerGlobalScope: function xStoreBase( lib ) {
            return lib;
        } 
    }, {
        Window: [
            ()=>xStoreBase
        ],
        ServiceWorkerGlobalScope: [
            ()=>xStoreBase
        ],
        
    }

    );
    
    
    
    function merge(a,b) {
        if (typeof a==='object') {
            if (typeof b==='object') {
                Object.keys(b).forEach(function(k){
                    if (!a[k]) {
                        a[k]=b[k];
                    }
                });
                
            } 
            return a;
        } else {
            return b;
        }
    }
    
    
    
          
    // all store variants are based on this (they call this quasi constructor to add common methods)
    // the api object should have been populated with these primitives:
    // __getItem(key,cb) - reads a string, optionally asynchronously. user to get serialized data
    // __setItem(key,value,cb) - writes a string. used to store serilized data
    // __keys(cb) - returns unfiltered keys
    // __removeItem - removes a previously stored key/value
    // clear - removes all stored keys
    
    // any of the followin methods not defined in api are replaced with generic versions
    // getItem, setItem - end user version of the primitives, but with actual values. 
    // key(cb) - filtered value of __keys (via __keysFilter see below) - removes hidden keys
    // __keysFilter - default hides keys beginning with ".__"
    
    function xStoreBase(baseApi,thisApi) {
        
        const serLib = self.serializerLib();
        const { serialize,deserialize,sha1Hex,sha1 } = serLib;
        
        const api = merge(baseApi,thisApi);
        
        api.__persistent   = api.__persistent   || false,
        api.serLib         = api.serLib         || serLib;
        api.getItem        = api.getItem        || getItem;
        api.setItem        = api.setItem        || setItem;
        api.removeItem     = api.removeItem     || removeItem;
        api.clear          = api.clear          || clear;
        api.setSerialized  = api.setSerialized  || setSerialized;
        api.getSerialized  = api.getSerialized  || getSerialized;
        api.getKeyX        = api.getKeyX        || getKeyX;
        api.setKeyX        = api.setKeyX        || setKeyX;
        api.getItemHash    = api.getItemHash    || getItemHash;
        api.sha1Hex        = api.sha1Hex        || sha1Hex;
        api.sha1           = api.sha1           || sha1;
        api.keyExists      = api.keyExists      || keyExists;
        api.keys           = api.keys           || keys;
        api.__keysFilter   = api.__keysFilter   || __keysFilter; 
        api.setImmediate   = api.setImmediate   || serLib.setImmediate;
        api.clearImmediate = api.clearImmediate || serLib.clearImmediate;
        
        const persistentCache = api.__persistent ? {} : undefined;
        
        
        if (!!api.__setItem && !!api.__clear && !!api.__removeItem ) {
             api.__readOnly = false ;
        } else {
            if (!api.__setItem || !api.__clear || !api.__removeItem || !api.__getItem || !api.__keys  ) {
                throw new Error ("missing implementation");
            } else {
                api.__readOnly = true ;
            }
        }

        api.pushTo        = function(db,merge,cb) {return ls_pushpull(api,db,merge,cb);};
        api.pullFrom      = function(db,merge,cb) {return ls_pushpull(db,api,merge,cb);};
        
        
        
        function __keysFilter (k) {
            return k.indexOf('.__')<0;
        }
        
        function keys (cb){
            if (cb) {
                api.__keys(function(ks){
                    cb(ks.filter(api.__keysFilter));
                });
            } else {
               return api.__keys().filter(api.__keysFilter);
            }
        }
        
        
        function keyExists (key,cb) {
            if (cb) {
                api.__keys(function(keys){
                    cb(keys.indexOf(key)>=0);
                })
            } else {
                return api.__keys().indexOf(key)>=0;
            }
        }

        function ls_pushpull(from_,to_,merge,cb) {
            if (typeof merge==='function') {
                cb=merge;merge=false;
            }
            from_.getSerialized(function(ser){
               to_.setSerialized(ser,merge,cb);
            });
        }
        
        function setItem(key,value,cb) {
            
             if (persistentCache) {
                persistentCache[key]=value;
             }
             
             if (api.__readOnly) {
                 return cb ? cb () : cb;
             }       
             serialize(value,function(ser){
                 return api.__setItem(key,ser,cb);
             });
         }
         
        function getItem(key,opts,cb) {
             if (typeof opts==='function') {
                 cb   = opts;
                 opts = !!persistentCache ? { unique : false } : { unique : true };
             }
             
             if (cb) {
                 if (!opts.unique && persistentCache && persistentCache[key]){
                     return cb(persistentCache[key]);
                 } 
                 api.__getItem(key,function(ser){
                     deserialize(ser,function(result){
                         if (!opts.unique && persistentCache){
                             persistentCache[key]=result;
                         }
                         cb(result);
                     });
                 });
             } else {
                if (!opts.unique && persistentCache && persistentCache[key]){
                    return persistentCache[key];
                } 
                const result = deserialize(api.__getItem(key));
                if (!opts.unique && persistentCache){
                    persistentCache[key]=result;
                }
                return result;
             }
         }
         
        function removeItem (key,cb) {
            if (persistentCache) {
               delete persistentCache[key];
            }
            if (api.__readOnly) {
                 
                 return cb ? cb () : cb;
            } 
            return api.__removeItem(key,cb);
         }
         
          
         function clear (cb) {
              if (persistentCache) {
                 Object.keys(persistentCache).forEach(function(key){
                    delete persistentCache[key];
                 });
              }
              if (api.__readOnly) {
                  return cb ? cb () : cb;
              } 
              return api.__clear(cb);
          }
          
         
         
         function getItemHash(key,cb){
             if (persistentCache && !!persistentCache[key]) {
                 
                 if (cb) {
                     serialize(persistentCache[key],function(ser){
                         cb(api.sha1Hex(ser)); 
                     });
                 } else {
                     return api.sha1Hex(serialize(persistentCache[key])); 
                 }
                 
             } else {
                 
                 if (cb) {
                     api.__getItem(key,function(ser){
                        cb(api.sha1Hex(ser)); 
                     });
                 } else {
                     return api.sha1Hex(api.__getItem(key));
                 }
                 
             }
         }
         
         function getKeyX(keys,x,cb){
             const values = keys.slice();
             function next(i) {
                 if (i<keys.length) {
                     api[x](keys[i],function(value){
                         values[i]=value;
                         setImmediate(next,i+1);
                     });
                 } else {
                     setImmediate(cb,values);
                 }
             }
             setImmediate(next,0);
         }
         
         function setKeyX(keys,values,x,cb){
             function next(i) {
                 if (i<keys.length) {
                     api[x](keys[i],values[i],function(){
                         setImmediate(next,i+1);
                     });
                 } else {
                     setImmediate(cb,values);
                 }
             }
             setImmediate(next,0)
         }
         
         function getSerialized(cb) {
              if (cb) {
                  
                  api.keys(function(ks) {
                     getKeyX(ks,"__getItem",function(values){
                         
                         setImmediate(cb, wrap(ks.map(formatSerialized.bind(api,values))) );
                         /*
                         ks.forEach(function(k,ix){ 
                            data.push(JSON.stringify(k)+':['+values[ix].replace(/\n/g, ',\n' )+']');
                         });
                         setImmediate(cb,'{'+data.join(',\n')+'}');*/
                     });
                  });
                  
                 
              } else {
                  const ks = api.keys();
                  const data = ks.map(formatSerialized.bind(api,ks.map(getItemSync)));
                  return wrap(data);
                  /*
                  ks.forEach(function(k){ 
                     data.push(JSON.stringify(k)+':['+api.__getItem(k).replace(/\n/g, ',\n' )+']');
                  });
                  return'{'+data.join(',\n')+'}';*/
              }
              
              function formatSerialized(values,k,ix){ 
                 return JSON.stringify(k)+':['+values[ix].replace(/\n/g, ',\n' )+']';
              }
              
              function wrap(data) {
                  return'{'+data.join(',\n')+'}';
              }
              
              
              function getItemSync(key) {
                  return api.__getItem(key);
              }
              
             
         }
         
         function setSerialized(ser,merge,cb) {
             
             if (typeof merge==='function') {
                 cb=merge;merge=false;
             }
             
             if (api.__readOnly) {
                 return cb ? cb () : cb;
             } 
             const ser_items = JSON.parse(ser);
             const newKeys   = Object.keys(ser_items);
             const notInDataSet = function (k) {return newKeys.indexOf(k)<0;};
             const newValueForKey = function(k){return ser_items[k]};
             newKeys.forEach(function(key){
                 ser_items[key] = ser_items[key].replace(/\,\n/g, '\n' );
             });
             
             if (cb) {
                  const newValues = newKeys.map(newValueForKey);
                  if (!merge) {
                     // this is not a merge, so we may need to cull a few keys 
                     // first pull in all the keys
                     api.keys(function(ks) {
                         // trash each existing key that won't be in the final set
                         api.getKeyX(ks.filter(notInDataSet),"removeItem",function(){
                             // overwrite/create each key that is in the datatset
                             api.setKeyX(newKeys,newValues,"__setItem",cb);
                         });
                     });
                     
                  } else {
                      // overwrite/create each key that is in the datatset
                      api.setKeyX(newKeys,newValues,"__setItem",cb);
                  }
                  
             } else {
                 // api supports sync (or caller thinks so!) 
                 // so we can do things a little snappier
                 if (!merge) {
                     // trash each existing key that won't be in the final set
                     api.keys().filter(notInDataSet).forEach(function(key){
                        api.removeItem(key);
                     });
                 }
                 // overwrite/create each key that is in the datatset
                 newKeys.forEach(function(key){
                     api.__setItem(key,newValueForKey(key));
                 });
             }
             
         }
         
         return api;
    }
  

 

});

