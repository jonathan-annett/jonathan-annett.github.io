


/* global ml,self */
ml(0,ml(1),[  ],function(){ml(2,ml(3),ml(4),

    {   Window: function dbCommon(dbCommonLib) { return dbCommonLib ;},
        ServiceWorkerGlobalScope: function dbCommon(dbCommonLib) { return dbCommonLib ;}
    }, (()=>{  return {
        Window:                   [ () => dbCommonLib   ],
        ServiceWorkerGlobalScope: [ () => dbCommonLib   ]
    };
            
      function dbCommonLib (keyprefix) {
          
              
        const flushHybridCachedSyncWritesInterval = 1500;
        const keyprefix_length = keyprefix ? keyprefix.length : 0;
        const prefixes = !!keyprefix;
        const generalizeKey = typeof keyprefix === 'string' ? function (k){return keyprefix+k;} :
                         typeof keyprefix === 'function' ? keyprefix : function (k){return k;};
        
        const localizeKey = typeof keyprefix === 'string' ? function (k){return k.substring(keyprefix_length);} :
                          typeof keyprefix === 'function' ? function (k,x,y) {
                              return keyprefix(k,x,y,"generalize");
                          } : function (k){return k;};
        
        const filterKeys   = typeof keyprefix === 'string' ? function (k){return k.startsWith(keyprefix);} :
                          typeof keyprefix === 'function' ? function (k,index,arr) {
                              return keyprefix(k,index,arr,"filter");
                          } : function (k){return true;};
                          
                          
        const removedKeySuffix = '-@';
        
    
    
          const lib = {
              keyprefix,  keyprefix_length,
              prefixes,
              flushHybridCachedSyncWritesInterval,
              generalizeKey,
              localizeKey,
              filterKeys,
              removedKeySuffix
          };
          
          
         return lib;
      }
      
    })()

    );
    

});






