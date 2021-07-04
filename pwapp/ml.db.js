/* global ml,localforage  */
ml(0,ml(1),[
    
   'localforage     | https://unpkg.com/localforage@1.9.0/dist/localforage.js'
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function ml_db_Lib( lib ) {
        

            return lib;
        },

        ServiceWorkerGlobalScope: function ml_db_Lib( lib ) {

    
            return lib;
        } 
    }, {
        Window: [
            ()=>dbLib
        ],
        ServiceWorkerGlobalScope: [
            ()=>dbLib
        ],
        
    }

    );
    
    function dbLib(databaseNames) {
        const databases = {};
        databaseNames.forEach(defineDB);
        return databases;
        
        function defineDB(name) {
            // since these dbs are used by a single instance (the service worker)
            // and may be dumped from memory at any moment, a few optimizations are made
            // 1. they are created on "first touch" (ie on demand by first caller)
            // 2. keys are kept in memory, so denials are quick (no need to hit the datastore to find out the key doesnt exist
            // 3. keys are updated whenever a set or remove takes place
            // (note - if the keys aren't ready on the first read)
            Object.defineProperty(databases,name,{
               get : function () {
                   const 
                   
                   db         = localforage.createInstance({name:name});
                   let keys;
                    
                   // on first call, go ahead and get keys from localforage
                   db.keys(function(err,ks){
                       if(!err&&ks) keys=ks;
                   });
                   
                   const DB = {
                           getItem   : function(k,cb) {
                       
                          if (keys) {
                              
                              if (keys.indexOf(k)<0) {
                                  return cb (undefined,null);
                              }
                              
                              return db.getItem(k,function(err,v){
                                  cb(err,v) ;
                              });
                              
                          } else {
                              // keys not ready key, just get item
                             return db.getItem(k,function(err,v){
                                      //report to caller
                                      cb(err,v) ;
                                      // now are keys ready yet?
                                      if (!keys){
                                          // no -try to  get them again
                                          db.keys(function(err,ks){
                                              if(!err&&ks) keys=ks;
                                          });
                                      }
                             });
                            
                          }
                         
                       },
                           setItem   : function(k,v,cb) {
                          return db.setItem(k,v,function(err){
                              if (err) return cb(err);
                              if (keys) {
                                  if( keys.indexOf(k)<0) keys.push(k);
                                  cb() ;
                              } else {
                                  
                                  db.keys(function(err,ks){
                                      if (err) return cb(err);
                                      keys=ks;
                                      if( keys.indexOf(k)<0) keys.push(k);
                                      cb() ;
                                  });
                              }
                          });
                       },
                           removeItem   : function(k,cb) {
                          return db.removeItem(k,function(err){
                              if (err) return cb(err);
                              
                              if (keys) {
                                const i = keys.indexOf(k);
                                if (i>=0) keys.splice(i,1); 
                                cb() ;
                              } else {
                                  db.getKeys(function(err,ks){
                                      if(!err&&ks) keys=ks;
                                      cb() ;
                                  });
                              }
                          });
                       },
                           getKeys   : function (cb) {
                           
                           if (keys) return cb (undefined,keys);
                           
                           db.keys(function(err,ks){
                               if (err) return cb(err);
                               cb(undefined,keys=ks);
                           });
                           
                       },
                           keyExists : function (k,d) {
                           if (keys) return keys.indexOf(k)>=0;
                           return d;
                       },
                           allKeys   : function (k,d) {
                           return keys||[];
                       }
                   };
                   
                   // for next request, caller will be given the object by value
                   // instead of calling this getter.
                   delete databases[name];
                   Object.defineProperty(databases,name,{
                       value : DB,
                       writable : false,
                       configurable:true,
                       enumerable:true
                   });
                   // this caller gets the object directly as a return from this getter function
                   return DB;
               },
               configurable:true,
               enumerable:true
            });
        }
        
        
        
    }

});

