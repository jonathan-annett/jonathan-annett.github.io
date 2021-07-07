/* global ml,localforage,self  */
ml(0,ml(1),[
    
   'localforage                         | https://unpkg.com/localforage@1.9.0/dist/localforage.js',
   'sha1Lib                             | gone-sha1.js',
   'JSZipUtils@ServiceWorkerGlobalScope | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
   'JSZip@ServiceWorkerGlobalScope      | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js',
    
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
    
    function dbLib(databaseNames,getZipObject) {
        
        const databases = {};
        const sha1Sync  = self.sha1Lib.sync;
        const sha1CB    = self.sha1Lib.cb;
        const JSZip     = self.JSZip; 
        
        databaseNames.forEach(defineDB);
        
        
        Object.defineProperties( databases,{
        
            toZip   : { value : function (names,cb) {
                
            if (typeof names === 'function') {
                cb=names;
                names = undefined;
            }
            
            names = names || Object.keys(databases).filter(dbNameFilter);
            
            const zip = new JSZip();
            
            nextDB(0);
            
            function nextDB(i){
                if (i< names.length) {
                    const dbname = names [ i ];
                    databases[ dbname  ].toZip(function (err,dbzip){
                        if (err) return cb(err);
                        
                        zip.file(dbname+'.zip',dbzip,{date : new Date(),createFolders: false });
                        nextDB(i+1);                               
                    });
                } else {
                    
                    zip.generateAsync({
                        type: "arraybuffer",
                        compression: "DEFLATE",
                        compressionOptions: {
                            level: 9
                        },
                        platform : 'UNIX'
                    }/*,function updateCallback(metadata) {
                          console.log("progression: " + metadata.percent.toFixed(2) + " %");
                          if(metadata.currentFile) {
                              console.log("current file = " + metadata.currentFile);
                          }
                      }*/).then(function (buffer) {
                         cb(undefined,buffer);
                    }).catch(cb);
                    
                    
                }
             }
        },enumberable:false,configurable:true,writable:true},
        
            fromZip : { value : function (zip,cb) {
            
            const zipext = /\.zip$/;
            
            zip.folder("").forEach(function(relativePath, file){
                
                if (!file.dir && zipext.test(file.name)) {
                    
                   const dbName =  file.name.replace(zipext,'');
                   
                   const zip_fileobj = zip.file(file.name)
                   
                   zip_fileobj.async('arraybuffer').then(function(buffer){
                       
                       JSZip.loadAsync(buffer).then(function (zip) {
                           
                           if (!databases[dbName]) {
                                defineDB(dbName);
                           }
                           
                           databases[dbName].fromZip(zip,function(err){
                               if (err) return cb (err);
                           });
                           
                       
                       }).catch(cb);
                       
                       
                   }).catch(cb);
                   
                } else {
                    databaseNames = Object.keys(databases).filter(dbNameFilter);
                    
                    cb(undefined,databases);   
                }
            });
            
            
        },enumberable:false,configurable:true,writable:true},
        
            fromURL : { value : function (url,cb) {
                if (getZipObject) {
                    getZipObject(url,function(err,zip){
                        if (err) return  cb (err);
                        databases.fromZip(zip,cb);
                    });
                }
            },enumberable:false,configurable:true,writable:true}
        });
        
        
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
                           getItem    : function (k,cb) {
                           
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
                           setItem    : function (k,v,cb) {
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
                           removeItem : function (k,cb) {
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
                           getKeys    : function (cb) {
                               
                               if (keys) return cb (undefined,keys);
                               
                               db.keys(function(err,ks){
                                   if (err) return cb(err);
                                   cb(undefined,keys=ks);
                               });
                               
                           },
                           keyExists  : function (k,d) {
                               if (keys) return keys.indexOf(k)>=0;
                               return d;
                           },
                           allKeys    : function (k,d) {
                               return keys||[];
                           },
                           toZip      : function (cb) {
                               
                               const zip = new JSZip();
                               
                               DB.getKeys(function(_,keys){
                                  if (keys) {
                                      
                                      keys.sort(); 
                                      const threshold = (sha1Sync('x').length * 2) +4;
                                      const header = {
                                          hash      : '',
                                          threshold : threshold,
                                          keys      : {},
                                          values    : {},
                                      };
                                      
                                      
                                     DB.getSerializer(function(toString){
                                         
                                  

                                        nextKey(0); 
                                        
                                        function nextKey(i) {
                                            if (i<keys.length) {
                                                const key = keys[i];
                                                DB.getItem(key,function(_,value){
                                                   toString(value,function(str){
                                                      header.hash+=str;
                                                      if (str.length<threshold) {
                                                          header.keys[key]=str;
                                                          nextKey(i+1);
                                                      } else {
                                                       
                                                          sha1CB(str,function(_,datahash){
                                                               if (!header.values[datahash]) {
                                                                    header.values[datahash]=1;
                                                                    zip.file(datahash,str,{date : new Date(),createFolders: false });
                                                               }
                                                               header.keys[key]=datahash;
                                                               nextKey(i+1);
                                                          });   
                                                      }
                                                   });
                                                });
                                            } else {
                                                finalize();
                                            }
                                        }
                                        
                                        function finalize() {
                                            delete header.values;
                                            sha1CB(header.hash,function(_,hash){
                                                header.hash = hash;
                                                zip.file('keys.json',JSON.stringify(header),{date : new Date(),createFolders: false });
                                                
                                                
                                                zip.generateAsync({
                                                    type: "arraybuffer",
                                                    compression: "DEFLATE",
                                                    compressionOptions: {
                                                        level: 9
                                                    },
                                                    platform : 'UNIX'
                                                }/*,function updateCallback(metadata) {
                                                      console.log("progression: " + metadata.percent.toFixed(2) + " %");
                                                      if(metadata.currentFile) {
                                                          console.log("current file = " + metadata.currentFile);
                                                      }
                                                  }*/).then(function (buffer) {
                                                     cb(undefined,buffer)
                                                }).catch(cb);
                                            });

                                            
                                        }
                                        
                                 

                                     })
                                       
                                    
                                    
                                  }   
                                  
                                  
                                
                               });
                           },
                           
                           fromZip    : function (zip,cb) {
                               
                               
                               const zip_fileobj = zip.file('keys.json');
                               if (!zip_fileobj) {
                                   return cb (new Error("can't find keys.json in zip"));
                               }
                               
                               
                              DB.getDeserializer(function(fromString){
                                    
                                    zip_fileobj.async('string').then(function(json){
                                        try {
                                            
                                           (function (header){
                                                const threshold = header.threshold;
                                                keys = Object.keys(header.keys);
                                                
                                                db.clear().then (function () {
                                                    
                                                    
                                                    nextKey(0);/*>>>*/function nextKey(i) {
                                                        
                                                        if (i < keys.length) {
                                                        
                                                              const key  = keys[i];
                                                              const hash = header.keys[key];
                                                                   
                                                          
                                                              if (hash.length < threshold) {
                                                                  fromString(hash,saveValue);
                                                                  DB.setItem(key,hash); 
                                                              } else {
                                                                  const value_fileobj = zip.file(hash);
                                                                  if (!value_fileobj) {
                                                                      return cb (new Error("can't find data"));
                                                                  }
                                                                  value_fileobj.async('string').then(function(str){
                                                                      fromString(str,saveValue);
                                                                  }).catch (cb);
                                                                   
                                                              }
                                                         } else { 
                                                             cb(); 
                                                         }
                                                         
                                                          function saveValue(value) {
                                                              // if (err) return cb (err);
                                                             
                                                               DB.setItem(keys[i],value,function(err){
                                                                   if (err) return cb (err);
                                                                   nextKey(i+1);
                                                               });
                                                          }

                                                    }
                                                    
                                                   
                                                    
                                                }).catch(cb) ;
                                                
                                                
                                                
                                                

                                         
                                           })(JSON.parse(json));

                                        } catch (err) {
                                            return cb (err);
                                        }
                                    });

                               });
                               
                               
                          
                               
                           },
                           
                           
                           getSerializer : function (cb) {
                               
                                   db.getSerializer().then(function(lf){
                                       
                                        const lf_serialize = lf.serialize;
                                        
                                        return cb(function (x,cb) {
                                        
                                            return serialize(x,cb);
                                            
                                            function seralizeObject(o,cb) {
                                                  const keys = Object.keys(o);
                                                  const promises = keys.map(function(k){
                                                                  
                                                      return new Promise(function(resolve) {
                                                          serialize(o[k],function(str){
                                                              resolve(str);
                                                          }); 
                                                      });
                                                      
                                                  });
                                                  Promise.all(promises).then(function(strs){
                                                     const obj = {};
                                                     keys.forEach(function(k,i){
                                                         obj[k]=strs[i]
                                                     });
                                                     return cb(JSON.stringify(obj));
                                                  });
                                                 
                                            }
                                            
                                            function serializeArray(a,cb) {
                                                const promises = a.map(function(el){
                                                    
                                                    return new Promise(function(resolve) {
                                                        serialize(el,function(str){
                                                            resolve(str);
                                                        }); 
                                                    });
                                                    
                                                });
                                                
                                                Promise.all(promises).then(function(strs){
                                                    return cb(JSON.stringify(strs));
                                                });
                                            }
                                            
                                            function serialize(x,cb) {
                                                
                                                 
                                                if (typeof x === "object")  {
                                                        if (Array.isArray(x)) {
                                                            return serializeArray (x,cb);
                                                        }
                                                        
                                                        if (x.constructor === ArrayBuffer || (x.buffer && x.buffer.constructor === ArrayBuffer) ) {
                                                            return lf_serialize (x,cb);
                                                        }
                                                        
                                                        return seralizeObject (x,cb);
        
                                                } else {
                                                    return lf_serialize (x,cb);
                                                }
                                                
                                            }
                                       
                                       
                                       });
                                   
                               });
                               
                           },
                           getDeserializer : function (cb) {
                               
                               
                                var isArray     = /^\[/;
                                var isObject    = /^\{/;
                                db.getSerializer().then(function(lf){
                                    
                                     const lf_serialize = lf.deserialize;
                                     
                                     return cb(function (str,cb) {
                                         
                                         return deserialize (str,cb) ;
                                         
                                         function deserializeArray(str,cb) {
                                             const a = JSON.parse(str);
                                             const promises = a.map(function(str){
                                                 
                                                 return new Promise(function(resolve) {
                                                     deserialize(str,function(el){
                                                         resolve(el);
                                                     }); 
                                                 });
                                                 
                                             });
                                             
                                             Promise.all(promises).then(function(values){
                                                 return cb(values);
                                             });
                                         }
                                         
                                         function deserializeObject(str,cb) {
                                             const o = JSON.parses(str);
                                             const keys = Object.keys(o);
                                             const promises = keys.map(function(k){
                                                             
                                                 return new Promise(function(resolve) {
                                                     deserialize(o[k],function(value){
                                                         resolve(value);
                                                     }); 
                                                 });
                                                 
                                             });
                                             Promise.all(promises).then(function(values){
                                                const obj = {};
                                                keys.forEach(function(k,i){
                                                    obj[k]=values[i]
                                                });
                                                return cb(obj);
                                             });
                                         }
                                         
                                         function deserialize (str,cb) {
                                             
                                             switch (true) {
                                                 case isArray.test(str)     : return deserializeArray(str,cb);
                                                 case isObject.test(str)    : return deserializeObject(str,cb);
                                             }
                                             
                                             return lf_serialize(str,cb);
                                         }
                                     
                                     });
                                  
                                });
                           }
                   };
                   
                   
                   
                   /*
                   Array
                   ArrayBuffer
                   Blob
                   Float32Array
                   Float64Array
                   Int8Array
                   Int16Array
                   Int32Array
                   Number
                   Object
                   Uint8Array
                   Uint8ClampedArray
                   Uint16Array
                   Uint32Array
                   String
                   
                   */
                   
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
        
        
        function dbNameFilter (name){ return ['toZip','fromZip','fromURL'].indexOf( name ) < 0; }
        
        
        
    }

});

