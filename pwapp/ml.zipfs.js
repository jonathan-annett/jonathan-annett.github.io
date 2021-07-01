/* global ml,self, JSZipUtils,JSZip,localforage,Response,Headers,BroadcastChannel */

ml(0,ml(1),[ 
    
    'sha1Lib       | sha1.js',
    'JSZipUtils    | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
    'JSZip         | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js',
    'localforage   | https://unpkg.com/localforage@1.9.0/dist/localforage.js'

    ],function(){ml(2,ml(3),ml(4),

    {   
        Window: function swResponseZipLib() {
        
                const lib = {
        
                };
                
               
               return lib;
                
                
                
        },
        
        ServiceWorkerGlobalScope: function swResponseZipLib (sha1,fnSrc) {
        
        
        return function (dbKeyPrefix) {

              
             const lib = {
                 processFetchRequest      : processFetchRequest,
                 newFixupRulesArray       : newFixupRulesArray,
                 fetchUpdatedURLEvent     : fetchUpdatedURLEvent,
                 updateURLContents        : updateURLContents,
                 removeUpdatedURLContents : removeUpdatedURLContents
             };
                              
             const openZipFileCache = { };
             
             const virtualDir = {
             
                 
             };

             const databases = {};
             defineDB("updatedURLS"); 
             defineDB("openZips");
             defineDB("zipMetadata");
             defineDB("cachedURLS");
             
             
             const dir_meta_name = '.dirmeta.json';
             const dir_meta_empty_json = '{"deleted":{},"added":{}}';
             const dir_meta_empty_resp = {
                 status: 200,
                 statusText: 'Not found',
                 headers : {
                     'Content-Type'   : 'application/json',
                     'Content-Length' : dir_meta_empty_json.length,
                 }
             };
             
             function fetchLocalJson(path,cb) {
                 fetch(path).then(function(response){
                    response.json().then(function(x){return cb(undefined,x)}).catch(cb); 
                 }).catch(cb);
             }
             
             
             
             
             
            

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
             
             function processFetchRequest(event) {
                 
                     event.respondWith(new Promise(function(resolve,reject){
                              event.fixup_url = event.request.url;
                              const chain = [ 
                                  
                                  //  these are "middleware vectors" in the form of function(event){ /* url resolution code*/ }
                                  
                                  //  each handler must return either a Promise, or undefined.
                                  //  if they return a promise, the request is deemed be "possibly handled"
                                  //  if the returned promise resolves to a response, then the request is "handled" and we are done - 
                                  //  the response resolved by the promise is used to satisfy the request.
                                  //  handlers that can't return response for the request must resolve() ie resolve undefined, rather
                                  //  than reject - reject can be used for serious errors that would prevent other handlers fullfilling the 
                                  //  request - like a missing or malformed url
                                  
                                  //  if the hadndler doesn't return a promise, or if the returned promise doesn't resolve to a response
                                  //  otherwise, the next handler is invoked until one of them returns a promise that resolves to 
                                  //  a valid response object
                                  
                                  //  for the purpose of this discussion "valid" means it is an object
                                  
                                  //  any of these handlers are free to modify the "fixup_url" property of the event object
                                  //  subsequent handlers use that url to resolve the response
                                  //  for diganostic reasons, and collision detection, event.request.url is left untainted to contain the actual url
                                  //  for the request, otherwise the handler is to treat "event.fixup_url" as the url being requested. )
                                  
                                  
                                  fixupUrlEvent,            // sets event.fixup_url according to rules defined in fstab.json
                                                            // these rules do things like append index.html to the root path
                                                            // and convert partial urls into complete urls, with respect to the referrer
                                                            
                                  virtualDirEvent,          // if event.fixup_url is inside a virtal modifies event.fixup_url, 
                                                            // to point to the endpoint inside it's container zip, and saves saves the 
                                                            // potential response in event.cache_response. (potential, because it may 
                                                            // have been updated, if the site is in local edit mode.
                                                            
                                  fetchUpdatedURLEvent,     // if event.fixup_url has been updated, resolve with updated content
                                                            // production sites don't include this middleware vector.
                                  
                                  
                                  virtualDirResponseEvent,  // if the virtual file wasn't updated resolves to the cache_response
                                   
                                  // we get here the url isn't inside a virtual dir  
                                   
                                  fetchFileFromZipEvent,   
                                  fetchFileFromCacheEvent,
                                  defaultFetchEvent  
                              ];
                              
                              
                          const next = function (handler) {
                              if (!handler) {
                                  console.log("could not find for",event.fixup_url,"from",event.request.referrer); 
                                  return ;
                              }
                              
                              console.log("trying",handler.name,"for",event.fixup_url,"from",event.request.referrer);
                              const promise = handler(event);
                              
                              if (promise) {
                                 promise.then(function(response){
                                     if (!response) return next(chain.shift()); 
                                         
                                     console.log(handler.name,"returned a response for",event.fixup_url,"from",event.request.referrer); 
                                     chain.splice(0,chain.length);
                                     resolve(response);
         
                                 }).catch (function(err){
                                     
                                     chain.splice(0,chain.length);
                                     reject(err);
                                 });
                                
                              } else {
                                  next(chain.shift()); 
                              }
                              
                          };
                          
                          next(chain.shift()); 
                         
                         

                  }));
             }
             
             function cleanupOld() {
                 if (virtualDir.virtualDirFoundUrls) {
                     const watershed = Date.now - (  60 * 60 * 1000);// keeps stuff for an hour
                     Object.keys (virtualDir.virtualDirFoundUrls).forEach(function(u){
                         const previous = virtualDir.virtualDirFoundUrls[u];
                        
                         if (previous && previous.when < watershed) {
                             delete virtualDir.virtualDirFoundUrls[previous.url];
                             delete virtualDir.virtualDirFoundUrls[previous.fixup_url];
                             delete previous.response;
                             delete previous.url;
                             delete previous.fixup_url;
                             delete previous.when;
                         }
                         
                     });
                     
                     
                     console.log("finished cleaning up cached files older than 60 mins.")
                 }
                 
                 setTimeout(cleanupOld,60*1000);
             }
             
             function fixupUrlEvent (event) {
                 
                  let url = event.fixup_url;
                      
                      if (fixupUrlEvent.rules) {
                          const referrer = event.request.referrer;
                          const basepath = referrer === '' ? location.origin : 
                          
                            ( referrer.lastIndexOf('.') > referrer.lastIndexOf('/') ) 
                               ? referrer.substr(0,referrer.lastIndexOf("/"))
                               : referrer;  
                               
                          console.log("referrer",referrer,"--> basepath",basepath);
                          const rules = fixupUrlEvent.rules(basepath);
                          const enforce = function(x){
                              if (x.replace&&x.replace.test(url)) { 
                                  url = url.replace(x.replace,x.with);
                                  return true;
                              } else {
                                  if (x.match && x.addPrefix && x.match.test(url)) { 
                                      url = x.addPrefix + url;
                                      return true;
                                  }
                              }
                           };
                           
                          while ( rules.some( enforce ) );
                         
                          event.fixup_url = url;
                          return ;
                      }
                      
                      return new Promise (function (resolve,reject){

                          fetchLocalJson("fstab.json",function(err,arr){
                               if (err) return reject(err);
                               newFixupRulesArray(arr);
                               fixupUrlEvent(event);
                               resolve();
                          });
                          
                      });

             }
             
             function newFixupRulesArray(arr) {
                 const source = arr.filter(function(x){
                      if (x.virtualDirs) {
                          virtualDir.virtualDirs = x.virtualDirs;
                          virtualDir.virtualDirUrls = Object.keys(x.virtualDirs);
                          virtualDir.virtualDirFoundUrls = {};
                          
                          cleanupOld();
                          delete x.virtualDirs;
                          return false;
                      }
                      
                      return true;
                  });
                  arr.splice(0,arr.length);
                  const json = JSON.stringify(source);
                  const regexs = function (x,k) {
                     if (x[k]) {
                         x[k]= new RegExp(x[k],x.flags||'');
                     }
                  };
                  const replacements = function (x,k) {
                      if (x[k]) {
                         x[k] = x[k].replace(/\$\{origin\}/g,location.origin);
                      }
                  };
                  const rules_template = source.map(function(x){
                       regexs(x,'match');   
                       regexs(x,'replace'); 
                       replacements(x,'with');
                       replacements(x,'addPrefix');
                       return x;
                  });
                  source.splice(0,source.length);
                  fixupUrlEvent.rules = function (baseURI) {
                      const replacements = function (dest,src,k) {
                          if (src[k]) {
                             dest[k] = src[k].replace(/\$\{base\}/g,baseURI);
                          }
                      };
                      const rules = JSON.parse(json);
                      const text_reps = function(x,i){
                         replacements(rules_template[i],x,'with');
                         replacements(rules_template[i],x,'addPrefix');
                         return x;
                      };
                      rules.forEach(text_reps);
                      return rules_template;
                 }
             }
             
             function virtualDirEvent (event) {
                const url = event.fixup_url;
                const previous = virtualDir.virtualDirFoundUrls[url];
                if (previous) {
                    previous.when = Date.now();
                    event.fixup_url = previous.fixup_url;
                    event.cache_response = previous.response;
                    return;
                }
                
                if (virtualDir.virtualDirs && virtualDir.virtualDirUrls) {
                    // see if the url starts with one of the virtual directory path names
                    const prefix = virtualDir.virtualDirUrls.find(function (u){
                        return url.indexOf(u)===0;
                    });
                    
                    if (prefix) {

                        return new Promise(function(resolve,reject){
                            // pull in the list of replacement zips that are layered under this url
                            // (earlier entries replace later entries, so we loop until we get a hit inside the zip file
                             // this also has the effect of precaching the zip file's data for the unzip process
                            const subpath = url.substr(prefix.length);
                            const zipurlprefixes = virtualDir.virtualDirs[prefix].slice(0);
                            const locateZipMetadata = function (i) {
                                
                                if (i<zipurlprefixes.length) {
                                    const fixup_url = zipurlprefixes[i]+subpath;
                                    getEmbeddedZipFileResponse(fixup_url,function(err,response){
                                        if (err||!response) return locateZipMetadata(i+1);
                                        console.log("resolved vitualdir",url,"==>",fixup_url);
                                        const entry = virtualDir.virtualDirFoundUrls[url]={
                                            fixup_url : fixup_url,
                                            url: url,
                                            response: response,
                                            when:Date.now()
                                        };
                                        virtualDir.virtualDirFoundUrls[fixup_url]=entry;
                                        
                                        
                                        event.fixup_url = fixup_url;
                                        event.cache_response = response;
                                        
                                        return resolve ();
                                    });
                                           
                            
                                } else {
                                    return resolve();
                                }
                                
                            };
                            
                            locateZipMetadata(0);
                        
                        }); 
                    }
                }
             }

             function fetchUpdatedURLEvent(event) {
                 const url = event.fixup_url;
                 const db  = databases.updatedURLS;
                 
                 switch (event.request.method) {
                     case "GET"    : return  db.keyExists(url,true) ? new Promise ( toFetchUrl.bind(this,db,url) ) : undefined;
                     case "UPDATE" : return new Promise ( toUpdateUrl );
                 }
                 
                 
                 function toUpdateUrl (resolve,reject) {
                        
                     event.request.arrayBuffer().then(function(buffer){
                        updateURLContents (url,databases.updatedURLS,buffer,function(){
                            resolve(new Response('ok', {
                                status: 200,
                                statusText: 'Ok',
                                headers: new Headers({
                                  'Content-Type'   : 'text/plain',
                                  'Content-Length' : 2
                                })
                            }));
                        }); 
                     });
                     
                 }

             }
             
             
             function virtualDirResponseEvent (event) {
                
                if (event.cache_response) {
                    const response = event.cache_response.clone();
                    delete event.cache_response;
                    return Promise.resolve(response);
                }
                  
             }


             function fetchFileFromZipEvent (event) {
                const url = event.fixup_url;
                return  doFetchZipUrl(event.request,url);
             }
             
             function fetchFileFromCacheEvent(event) {
                 const url = event.fixup_url;
                 switch (event.request.method) {
                     case "GET"    : return new Promise ( toFetchUrl.bind(this,databases.cachedURLS,url) );
                 }

             }

             function defaultFetchEvent(event) {
                 const url = event.fixup_url;
                 
                 return new Promise(
                     
                     function(resolve,reject) {
                         
                         const shouldCache = url.indexOf(location.origin)===0 ||  event.request.referrer && event.request.referrer.indexOf(location.origin)===0;
                         
                         fetchBufferViaCorsIfNeeded(url,function(err,buffer,status,ok,headers){
                             if (err) return reject(err);
                             
                             if (status===0 && buffer.byteLength===0) {
                                 
                                 return fetch(url,{mode:'no-cors'}).then(resolve).catch(reject);
                                 
                             }
                             
                             if (ok) {
                                    const db = databases.cachedURLS;
                                    updateURLContents (url,db,buffer,{status:status,headers:headers},function(){
                                       //toFetchUrl (db,url,resolve,reject)
                                       resolve(new Response (buffer,{status:status,headers:headers}));
                                    });
                                    
                             } else {
                                 console.log("not caching",url,"status",status,"from",event.request.referrer,headers);
                                 resolve(new Response (buffer,{status:status,headers:headers}));
                             }
                         });

                     }
                  )
                 
             }

             function fetchBufferViaCorsIfNeeded(url,cb) {
                 
                 fetch(url).then(getBufferFromResponse)
                   .catch(function(err){
                       
                        fetch(url,{mode:'no-cors'})
                           .then(getBufferFromResponse)
                           .catch(function(err){
                               
                                fetch(url+"?r="+Math.random().toString(36).substr(-8),{
                                    mode:'no-cors',
                                    headers:{
                                        'if-none-match':Math.random().toString(36).substr(-8),
                                        'if-modified-since':new Date( Date.now() - ( 5 * 365 * 24 * 60 * 60 * 1000) ).toString()
                                    }
                                    
                                },'')
                                   .then(getBufferFromResponse)
                                   .catch(cb);
                                   
                                   
                           });
                           
                   }).catch(cb);
                   
                   
                   
                   function getBufferFromResponse(response) {
                         
                         response.arrayBuffer().then(function(buffer) {
                             
                             const headers = {};
                             
                             for(var key of response.headers.keys()) {
                                headers[key.toLowerCase()]=response.headers.get(key);
                             }
                             cb(undefined,buffer,response.status,response.ok,headers);
                         });
                         
                   }
                       
             }
             
             function limitZipFilesCache(count,cb) {
                 const keys = Object.keys(openZipFileCache);
                 if (keys.length<=count) return cb();
                 keys.sort(function(a,b){
                     return openZipFileCache[a].touched - openZipFileCache[b].touched;
                 }).slice(0,keys.length-count).forEach(function(key){
                     delete openZipFileCache[key];
                 });
                 return cb();
             }
             
             function zipbufferkey(url) {
                 return url;
             }
             
             function modifyURLprotocol(protocol,url) {
                 return url.replace(/^http(s?)\:\/\//,protocol+'://');
             }
             
             function full_URL(base,url) {
                 
                 if (typeof url==='string') {
                     if (url.length===0) return base;
                 
                     switch (url[0]) {
                         case '/' : return base+url;
                         case 'h' : if (/^http(s?)\:\/\//.test(url)) return url; break;
                         case '.' : if ( url.substr(0,2)==='./') {
                             return base + url.substr(1);
                         }
                     }

                     return base + url;
                 }
                 
             }
             
             function getZipFile(url,buffer,cb/*function(err,buffer,zipFileMeta){})*/) {
                 
                 if (typeof buffer==='function') {
                     cb=buffer;buffer=undefined;
                 } else {
                     if (buffer) {
                         // this is a subzip,so the buffer is not stored in forage
                         // we do however store the metadata for it
                         
                         return databases.zipMetadata.getItem(url,function(err,zipFileMeta){
                             
                              if (zipFileMeta) {
                                 return cb(undefined,buffer,zipFileMeta);
                              }
                              // 
                             sha1(buffer,function(err,etag){
                                setMetadataForBuffer(buffer,etag,undefined,cb);
                             });
                              
                               
                         });
                     }
                 }
                 
                 databases.openZips.getItem(url,function(err,buffer){
                     
                     if (err || ! buffer) return download();                    
                     
                     databases.zipMetadata.getItem(url,function(err,zipFileMeta){
                         if (err || ! zipFileMeta) return download();                    
                         cb(undefined,buffer,zipFileMeta);
                     });
                     
                 });
                 
                 function download() {
                     
                     fetch(url)
                     .then(getBufferFromResponse)
                       .catch(function(err){
                           
                            fetch(url,{mode:'no-cors'})
                               .then(getBufferFromResponse)
                               .catch(function(err){
                                   
                                    fetch(url+"?r="+Math.random().toString(36).substr(-8),{
                                        mode:'no-cors',
                                        headers:{
                                            'if-none-match':Math.random().toString(36).substr(-8),
                                            'if-modified-since':new Date( Date.now() - ( 5 * 365 * 24 * 60 * 60 * 1000) ).toString()
                                        }
                                        
                                    },'')
                                       .then(getBufferFromResponse)
                                       .catch(cb);
                                       
                                       
                               });
                               
                       }).catch(cb);
                 }
                 
                 function getBufferFromResponse(response) {
                     
                     
                   if (!response.ok) {
                     return cb (new Error("HTTP error, status = " + response.status));
                   }
                   
                   response.arrayBuffer().then(function(buffer) {
                       
                       createETagForResponse(response,buffer,function(err,etag){
                           
                           setMetadataForBuffer(buffer,etag,safeDate(response.headers.get('Last-Modified'),new Date()),function(err,buffer,zipFileMeta){
                               if (err) return cb(err);
                               databases.openZips.setItem(url,buffer,function(err){
                                   
                                 if (err) return cb(err);
                                 cb(undefined,buffer,zipFileMeta);
                                 
                               });
                           });
                          
                          
                       });
            
                   }).catch(cb); 
                   
                   
                 }
                 
                 function createETagForResponse(response,buffer,cb/*function(err,etag){}*/) {
                     const actualEtag = response.headers.get('Etag');
                     if (typeof actualEtag==='string' && actualEtag.length>0) {
                         return cb(undefined,actualEtag.replace(/(^W)|([\/-_\s\\])/g,''));
                     }
                     sha1(buffer,cb);
                 }
            
                 function setMetadataForBuffer(buffer,etag,date,cb/*function(err,buffer,zipFileMeta){}*/) {
                     if (!etag) etag = Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-6);
                     const zipFileMeta = {
                         etag,
                         date:date||new Date()
                     };
                     
                       databases.zipMetadata.setItem(url,zipFileMeta,function(err){
                           
                             if (err) return cb(err);
                             
                             cb(undefined,buffer,zipFileMeta);
                             
                       });
                 }
                 
             }
             
             function addFileMetaData(zip,zipFileMeta,zipurl){
                if (typeof zipFileMeta.files==='object') {
                    return zipFileMeta;
                }
                zipFileMeta.files={};
                const root_dirs = [],root_files=[];
                
                let dir_meta_found =false;
                zip.folder("").forEach(function(relativePath, file){
                    if (!file.dir) {
                        
                       if (file.name.indexOf("/")<0) {
                           if (file.name.charAt(0)!=='.') {
                               root_files.push(file.name);
                           }
                       }
                       zipFileMeta.files[file.name]={
                           date:file.date,
                           etag:zipFileMeta.etag+
                                file.date ? file.date.getTime().toString(36) : Math.random().toString(36).substr(2)
                       };
                       
                       if (file.name=== dir_meta_name) {
                           dir_meta_found=true;
                       }
                    } else {
                        const slash=file.name.indexOf("/");
                        if ((slash<0)||(slash===file.name.lastIndexOf("/"))) {
                            const root = file.name.split("/")[0];
                            if (root_dirs.indexOf(root)<0) {
                               root_dirs.push(root);
                            }
                        }
                    }
                });
                if (root_dirs.length===1&&root_files.length===0 ) {
                    if (zipurl.endsWith("/"+root_dirs[0]+".zip")) {
                        zipFileMeta.alias_root = root_dirs[0]+'/'; 
                        //console.log({alias_root:zipFileMeta.alias_root});
                    }
                } else {
                   root_files.splice(0,root_files.length);
                }
                
                root_dirs.splice(0,root_dirs.length);
                
                if (!dir_meta_found) {
                    zipFileMeta.files[dir_meta_name]={
                        date:zipFileMeta.date,
                        etag:zipFileMeta.etag+ Math.random().toString(36).substr(2)
                    };
                }
                return zipFileMeta;
            }
             
             function getZipObject(url,buffer,cb/*function(err,zip,zipFileMeta){})*/) {
                 if (typeof buffer==='function') {
                     cb=buffer;buffer=undefined;
                 }
                 const entry = openZipFileCache[url];
                 if (entry) {
                     // file is already open.
                     entry.touch=Date.now();
                     return cb (undefined,entry.zip,entry.metadata);
                 }
                 
                 getZipFile(url,buffer,function(err,buffer,zipFileMeta){
                     if (err) return cb(err);
                     
                     JSZip.loadAsync(buffer).then(function (zip) {
                         
                         limitZipFilesCache(9,function(){
                             
                             openZipFileCache[url] = {
                                 touched    : Date.now(),
                                 zip        : zip,
                                 metadata   : zipFileMeta
                             };
                             
                             if (zipFileMeta.files) {
                                 // file has been opened once before
                                 return cb (undefined,zip,zipFileMeta);
                             }
                             
                             // this is the first time the file was opened.
                             // so we need to read the directory and save it into localforage
                             // this also "invents" etags for each file inside
                             // we do this once, on first open.
            
                             databases.zipMetadata.setItem(url,addFileMetaData(zip,zipFileMeta,url),function(err){
                                 
                                if (err) return cb(err);
            
                                return cb (undefined,zip,zipFileMeta);
                                
                             });
            
                         });
                     }).catch(cb);
            
                 });
                 
             }
             
             function mimeForFilename(filename) {
                 //lsauer.com , lo sauer 2013
                 //JavaScript List of selected MIME types
                 //A comprehensive MIME List is available here: https://gist.github.com/lsauer/2838503
                 const lastDot = filename.lastIndexOf('.');
                 return (lastDot<0) ? false : {
                   'a'      : 'application/octet-stream',
                   'ai'     : 'application/postscript',
                   'aif'    : 'audio/x-aiff',
                   'aifc'   : 'audio/x-aiff',
                   'aiff'   : 'audio/x-aiff',
                   'au'     : 'audio/basic',
                   'avi'    : 'video/x-msvideo',
                   'bat'    : 'text/plain',
                   'bin'    : 'application/octet-stream',
                   'bmp'    : 'image/x-ms-bmp',
                   'c'      : 'text/plain',
                   'cdf'    : 'application/x-cdf',
                   'csh'    : 'application/x-csh',
                   'css'    : 'text/css',
                   'dll'    : 'application/octet-stream',
                   'doc'    : 'application/msword',
                   'dot'    : 'application/msword',
                   'dvi'    : 'application/x-dvi',
                   'eml'    : 'message/rfc822',
                   'eps'    : 'application/postscript',
                   'etx'    : 'text/x-setext',
                   'exe'    : 'application/octet-stream',
                   'gif'    : 'image/gif',
                   'gtar'   : 'application/x-gtar',
                   'h'      : 'text/plain',
                   'hdf'    : 'application/x-hdf',
                   'htm'    : 'text/html',
                   'html'   : 'text/html',
                   'jpe'    : 'image/jpeg',
                   'jpeg'   : 'image/jpeg',
                   'jpg'    : 'image/jpeg',
                   'js'     : 'application/x-javascript',
                   'json'   : 'application/json',
                   'ksh'    : 'text/plain',
                   'latex'  : 'application/x-latex',
                   'm1v'    : 'video/mpeg',
                   'man'    : 'application/x-troff-man',
                   'me'     : 'application/x-troff-me',
                   'mht'    : 'message/rfc822',
                   'mhtml'  : 'message/rfc822',
                   'mif'    : 'application/x-mif',
                   'mov'    : 'video/quicktime',
                   'movie'  : 'video/x-sgi-movie',
                   'mp2'    : 'audio/mpeg',
                   'mp3'    : 'audio/mpeg',
                   'mp4'    : 'video/mp4',
                   'mpa'    : 'video/mpeg',
                   'mpe'    : 'video/mpeg',
                   'mpeg'   : 'video/mpeg',
                   'mpg'    : 'video/mpeg',
                   'ms'     : 'application/x-troff-ms',
                   'nc'     : 'application/x-netcdf',
                   'nws'    : 'message/rfc822',
                   'o'      : 'application/octet-stream',
                   'obj'    : 'application/octet-stream',
                   'oda'    : 'application/oda',
                   'pbm'    : 'image/x-portable-bitmap',
                   'pdf'    : 'application/pdf',
                   'pfx'    : 'application/x-pkcs12',
                   'pgm'    : 'image/x-portable-graymap',
                   'png'    : 'image/png',
                   'pnm'    : 'image/x-portable-anymap',
                   'pot'    : 'application/vnd.ms-powerpoint',
                   'ppa'    : 'application/vnd.ms-powerpoint',
                   'ppm'    : 'image/x-portable-pixmap',
                   'pps'    : 'application/vnd.ms-powerpoint',
                   'ppt'    : 'application/vnd.ms-powerpoint',
                   'pptx'    : 'application/vnd.ms-powerpoint',
                   'ps'     : 'application/postscript',
                   'pwz'    : 'application/vnd.ms-powerpoint',
                   'py'     : 'text/x-python',
                   'pyc'    : 'application/x-python-code',
                   'pyo'    : 'application/x-python-code',
                   'qt'     : 'video/quicktime',
                   'ra'     : 'audio/x-pn-realaudio',
                   'ram'    : 'application/x-pn-realaudio',
                   'ras'    : 'image/x-cmu-raster',
                   'rdf'    : 'application/xml',
                   'rgb'    : 'image/x-rgb',
                   'roff'   : 'application/x-troff',
                   'rtx'    : 'text/richtext',
                   'sgm'    : 'text/x-sgml',
                   'sgml'   : 'text/x-sgml',
                   'sh'     : 'application/x-sh',
                   'shar'   : 'application/x-shar',
                   'snd'    : 'audio/basic',
                   'so'     : 'application/octet-stream',
                   'src'    : 'application/x-wais-source',
                   'swf'    : 'application/x-shockwave-flash',
                   't'      : 'application/x-troff',
                   'tar'    : 'application/x-tar',
                   'tcl'    : 'application/x-tcl',
                   'tex'    : 'application/x-tex',
                   'texi'   : 'application/x-texinfo',
                   'texinfo': 'application/x-texinfo',
                   'tif'    : 'image/tiff',
                   'tiff'   : 'image/tiff',
                   'tr'     : 'application/x-troff',
                   'tsv'    : 'text/tab-separated-values',
                   'txt'    : 'text/plain',
                   'ustar'  : 'application/x-ustar',
                   'vcf'    : 'text/x-vcard',
                   'wav'    : 'audio/x-wav',
                   'wiz'    : 'application/msword',
                   'wsdl'   : 'application/xml',
                   'xbm'    : 'image/x-xbitmap',
                   'xlb'    : 'application/vnd.ms-excel',
                   'xls'    : 'application/vnd.ms-excel',
                   'xlsx'    : 'application/vnd.ms-excel',
                   'xml'    : 'text/xml',
                   'xpdl'   : 'application/xml',
                   'xpm'    : 'image/x-xpixmap',
                   'xsl'    : 'application/xml',
                   'xwd'    : 'image/x-xwindowdump',
                   'zip'    : 'application/zip'
                 }[filename.substr(lastDot+1)];
             }
             
             function response304 (resolve,fileEntry) {
                 console.log("returning 304",fileEntry);
                 return resolve( new Response('', {
                             status: 304,
                             statusText: 'Not Modifed',
                             headers: new Headers({
                               'Content-Type'   : fileEntry.contentType,
                               'Content-Length' : fileEntry.contentLength,
                               'ETag'           : fileEntry.etag,
                               'Cache-Control'  : 'max-age=3600, s-maxage=600',
                               'Last-Modified'  : fileEntry.date.toString(),
                             })
                }));
             }
             
             function response200 (resolve,buffer,fileEntry) {
                 console.log("returning 200",fileEntry.name);
                 return resolve( new Response(
                                    buffer, {
                                            status: 200,
                                            statusText: 'Ok',
                                            headers: new Headers({
                                              'Content-Type'   : fileEntry.contentType,
                                              'Content-Length' : fileEntry.contentLength,
                                              'ETag'           : fileEntry.etag,
                                              'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                              'Last-Modified'  : fileEntry.date.toString(),
                                            })
                                    })
                );
                        
             }
             
             function resolveSubzip(buffer,zip_url,path_in_zip,ifNoneMatch,ifModifiedSince) {
                 console.log({resolveSubzip:{ifNoneMatch,ifModifiedSince,zip_url,path_in_zip}});
                 const parts           = path_in_zip.split('.zip/');     
                 const subzip          = parts.length>1;
                 let   file_path       = subzip ? parts[0]+'.zip' : parts[0];
                 let   subzip_url      = zip_url + file_path  ;
                 let   subzip_filepath = subzip ? parts.slice(1).join('.zip/') : false;
                      
                  
                 return new Promise(function(resolve,reject){     

                     getZipObject(zip_url,buffer,function(err,zip,zipFileMeta){
                         if (err)  throw err;
                         
            
                         let fileEntry = zipFileMeta.files[file_path];
                         if (!fileEntry) {
                             if (zipFileMeta.alias_root) {
                                 fileEntry = zipFileMeta.files[zipFileMeta.alias_root+file_path];
                                 if (fileEntry) {
                                     file_path  = zipFileMeta.alias_root+file_path;
                                     subzip_url = zip_url + file_path;
                                     subzip_filepath = zipFileMeta.alias_root + subzip_filepath;
                                 }
                             }
                             if (!fileEntry) {
                                 
                                 if (file_path===dir_meta_name) {
                                     console.log("returning default dir meta for ",zip_url,path_in_zip);
                                     return resolve(new Response(dir_meta_empty_json,dir_meta_empty_resp));
                                 }

                                 console.log("returning 404",zip_url,path_in_zip);
                                 return resolve(new Response('', {
                                     status: 404,
                                     statusText: 'Not found'
                                 }));
                             }
                         }
                         
                        
                         const update_needed = fileEntry.contentType==='undefined' || typeof fileEntry.contentLength==='undefined';
                        
                         
                        
                         if (   !update_needed      && 
                                !subzip             &&
                                 (
                                     (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag)) ||
                                     (ifModifiedSince &&  (safeDate(ifModifiedSince,fileEntry.date) <  fileEntry.date) )
                                 
                                 )
                             ) {
                                 
                             return response304 (resolve,fileEntry);
                             
                         }
                        
                                   
                         zip.file(file_path).async('arraybuffer').then(function(buffer){
                            if (update_needed) {
                                // first request for this file, so we need to save 
                                // contentLength and type in buffer
                                // (they are needed for later 304 responses)
                                
                                fileEntry.contentType    = mimeForFilename(file_path);
                                fileEntry.contentLength  = buffer.byteLength;
                                
                                if (zipFileMeta.updating) {
                                    clearTimeout(zipFileMeta.updating);
                                }
                                console.log("updating zip entry",zip_url,file_path);
                                
                                zipFileMeta.updating = setTimeout(function(){
                                    // in 10 seconds this and any other metadata changes to disk
                                    delete zipFileMeta.updating;
                                    databases.zipMetadata.setItem(zip_url,zipFileMeta,function(){
                                        console.log("updated zip entry",zip_url);
                                    });
                                    
                                },10*10000);
                                
                            }
                            
                            if (path_in_zip.endsWith('.zip')) {
                                return resolveZipListing (zip_url+"/"+path_in_zip,buffer).then(resolve).catch(reject);
                            }
                           
                            
                            if (subzip) {
                                return resolveSubzip(buffer,subzip_url ,subzip_filepath,ifNoneMatch,ifModifiedSince).then(resolve).catch(reject);
                            }
                            
                            
                            return response200 (resolve,buffer,fileEntry);
                            
                            
                         });
                         
                        
                     });
                 
                 });
             }
             
             function safeDate (d,def) {
                 const dt = new Date(d);
                 if (dt) return dt;
                 return def;
             }
             
             function resolveZip (parts,ifNoneMatch,ifModifiedSince) {
                 console.log({resolveZip:{ifNoneMatch,ifModifiedSince,parts}});
                 const zip_url           = parts[0]+'.zip', 
                       subzip            = parts.length>2; 
                 let   file_path         = subzip ? parts[1]+'.zip' : parts[1],
                       subzip_url        = subzip ? parts.slice(0,2).join('.zip/') + '.zip' : false,
                       subzip_filepath   = subzip ? parts.slice(2).join('.zip/')     : false;
                       
                 return new Promise(function (resolve,reject){
                     
                     getZipObject(zip_url,function(err,zip,zipFileMeta) {
                         
                         if (err)  throw err;
                         
                         let fileEntry = zipFileMeta.files[file_path];
                         if (!fileEntry) {
                             if (zipFileMeta.alias_root) {
                                 fileEntry = zipFileMeta.files[ zipFileMeta.alias_root+file_path ];
                                 if (fileEntry) {
                                     file_path  = zipFileMeta.alias_root+file_path;
                                     subzip_url = zip_url + file_path;
                                     subzip_filepath = zipFileMeta.alias_root + subzip_filepath;
                                 }
                             }
                             
                             if (!fileEntry) {
                                 return resolve(new Response('', {
                                     status: 404,
                                     statusText: 'Not found'
                                 }));
                             }
                         }
                        
                         
                         const update_needed = fileEntry.contentType==='undefined' || typeof fileEntry.contentLength==='undefined';

                         if (   !update_needed      && 
                                !subzip             &&
                                 (
                                     (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag)) ||
                                     (ifModifiedSince &&  (safeDate(ifModifiedSince,fileEntry.date) <  fileEntry.date) )
                                 )
                            ) {
                             return response304 (resolve,fileEntry);
                         }
                         
                         zip.file(file_path).async('arraybuffer').then(function(buffer){
                                 
                                 if (update_needed) {
                                     // first request for this file, so we need to save 
                                     // contentLength and type in buffer
                                     // (they are needed for later 304 responses)
                                     
                                     fileEntry.contentType    = mimeForFilename(file_path);
                                     fileEntry.contentLength  = buffer.byteLength;
                                     
                                     if (zipFileMeta.updating) {
                                         clearTimeout(zipFileMeta.updating);
                                     }
                                     console.log("updating zip entry",zip_url,file_path);
                                     
                                     zipFileMeta.updating = setTimeout(function(){
                                         // in 10 seconds this and any other metadata changes to disk
                                         delete zipFileMeta.updating;
                                         databases.zipMetadata.setItem(zip_url,zipFileMeta,function(){
                                             console.log("updated zip entry",zip_url);
                                         });
                                         
                                     },10*10000);
                                     
                                 }
                                 
                                 if (subzip) {
                                     return resolveSubzip(buffer,subzip_url,subzip_filepath,ifNoneMatch,ifModifiedSince).then(resolve).catch(reject);
                                 }
                                 
                                 if (file_path.endsWith('.zip')) {
                                     return resolveZipListing (zip_url+"/"+file_path,buffer).then(resolve).catch(reject);
                                 }
                                 
                                 return response200 (resolve,buffer,fileEntry);
                                 
                              });
                              
                     });
                 });
             }
             
             function fileIsEditable (filename) {
                 const p = filename.lastIndexOf('.');
                 return p < 1 ? false:["js","json","css","md","html","htm"].indexOf(filename.substr(p+1))>=0;
             }
             
             function regexpEscape(str) {
                 return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
             }
             
             function fileisEdited (url) {
                 if (url.endsWith('.zip')) {
                     const re = new RegExp(  "^"+ regexpEscape(url+"/"),'g');
                     return databases.updatedURLS.allKeys().some(re.test.bind(re));
                 } else {
                    return databases.updatedURLS.keyExists( url, false );
                 }
             }
             
             function resolveZipListing (url,buffer) {
                 
                 return new Promise(function (resolve){
                     
                     getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                         
                         if (err || !zip || !zipFileMeta) {
                             
                             return resolve ();
                         }
                         
                         const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                         const uri= urify.exec(url)[2];
                         const uri_split = uri.split('.zip/').map(function (x,i,a){
                             return i===a.length-1?'/'+x:'/'+x+'.zip';
                         });
                         
                         const top_uri_res = uri_split.map(function(uri){ 
                             return new RegExp( regexpEscape(uri+"/"),'g');
                         });
                         
                         const cleanup_links = function(str) {
                             top_uri_res.forEach(function(re){
                                 str = str.replace(re,'/');
                             });
                             return str;
                         };
                          

                         const uri_full_split = uri_split.map(function(x,i,a){
                             return a.slice(0,i+1).join("");
                         });
                         
                         var parent_link="";
                         const linkit=function(uri,disp,a_wrap){ 
                             a_wrap=a_wrap||['<a href="'+uri+'">','</a>'];
                             const split=(disp||uri).split("/");
                             if (split.length===1) return a_wrap.join(disp||uri);
                             const last = split.pop();
                             if (split.length===1) return split[0]+'/'+ a_wrap.join(last);
                             return split.join("/")+'/'+ a_wrap.join(last);
                         };
                         const boldit=function(uri,disp){
                             const split=(disp||uri).split("/");
                             if (split.length===1) return '<b>'+(disp||uri)+'</b>';
                             const last = split.pop();
                             if (split.length===1) return split[0]+'/<b>'+last+'</b>';
                             return split.join("/")+'/<b>'+last+'</b>';
                         };
                         
                         
                         parent_link = uri_full_split.map(function(href,i,a){
                             const parts = href.split('/.zip');
                             const disp  = parts.length===1?undefined:parts.pop();
                             const res = (href.endsWith(uri)?boldit:linkit) (href,disp);
                             return res;
                         }).join("");
                         
                         
                         parent_link = cleanup_links(parent_link);
                        
                         const updated_prefix = url + "/" ;
                                 
                         let   hidden_files_exist = false;
                         const html_details = Object.keys(zipFileMeta.files).map(function(filename){

                                 const full_uri = "/"+uri+"/"+filename,
                                       basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
                                 const edited_attr  = ' data-balloon-pos="right" aria-label="'            + basename + ' has been edited locally"';
                                 const edit_attr    = ' data-balloon-pos="down-left" aria-label="Open '       + basename + ' in zed"'; 
                                 const zip_attr     = ' data-balloon-pos="down-left" aria-label="...explore ' + basename + ' contents" "' ;
                                 const is_hidden    = basename.indexOf('.')===0;
                                 const is_editable  = fileIsEditable(filename);
                                 const is_zip       = filename.endsWith(".zip");
                                 const is_edited    = fileisEdited( updated_prefix+filename );
                                 
                                 const edited       = is_edited ? '<span class="edited"'+edited_attr+'>&nbsp;&nbsp;&nbsp;</span>' : '';
                                 const li_class     = is_edited ? (is_hidden ? ' class="hidden edited"': ' class="edited"' ) : ( is_hidden ? ' class="hidden"' : '');

                                 const zedBtn =   is_editable   ? [ '<a'+edit_attr+ ' data-filename="' + filename + '"><span class="editinzed">&nbsp;</span>',  '</a>' + edited ] 
                                                : is_zip        ? [ '<a'+zip_attr+  ' href="/'+uri+'/' + filename + '"><span class="zipfile">&nbsp;</span>',    '</a>' + edited ]   
                                                :                 [ '<a data-filename="'               + filename + '"><span class="normal">&nbsp;</span>',     '</a>' + edited ] ;
                                 
                                 if (is_hidden) hidden_files_exist = true;
                                 return '<li'+li_class+'><span class="full_path">' + parent_link +'/</span>' +linkit(full_uri,filename,zedBtn) + '</li>';
                              });
                         
                         const html = [
                             
                         '<!DOCTYPE html>',
                         '<html>',
                         '<!-- url='+url+' -->',
                         '<!-- uri='+uri+' -->',
                         
                         '<!-- parent_link='+parent_link+' -->',

                         '<head>',
                           '<title>files in '+uri+'</title>',
                           '<script>var zip_url_base='+JSON.stringify('/'+uri)+'</script>',
                           '<script src="ml.js"></script>',
                           '<script src="ml.zipfs.dir.js"></script>',
                           '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/balloon-css/1.2.0/balloon.min.css" integrity="sha512-6jHrqOB5TcbWsW52kWP9TTx06FHzpj7eTOnuxQrKaqSvpcML2HTDR2/wWWPOh/YvcQQBGdomHL/x+V1Hn+AWCA==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                           '<link rel="stylesheet" href="ml.zipfs.dir.css"/>',
                           '</style>',
                         '</head>',
                         '<body class="disable-select">',
                         
                         '<h1> files in '+uri,
                         
                         '<span>show full path</span><input class="fullpath_chk" type="checkbox">',
                         
                         
                         hidden_files_exist ? '<span>show hidden files</span><input class="hidden_chk" type="checkbox">' : '' ,
                         
                         
                         '</h1>',

                         
                         '<div>',
                         '<ul class="hide_hidden hide_full_path">'
                         
                         ].concat (html_details,
                         [
                             
                             '</ul>',
                             '</div>',
                             
                            
                             '</body>',
                             '</html>'
                         ]).join('\n');

                         return resolve( 
                             
                             new Response(
                                    html, {
                                             status: 200,
                                             statusText: 'Ok',
                                             headers: new Headers({
                                               'Content-Type'   : 'text/html',
                                               'Content-Length' : html.length,
                                               'ETag'           : zipFileMeta.etag,
                                               'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                               'Last-Modified'  : zipFileMeta.date.toString() } )
                                 })
                        );

                     });
                     
                 });

             }
             
             function getEmbeddedZipFileResponse(url,options,cb) {
                 
                 if (typeof options == 'function') {
                     cb      = options;
                     options = {};
                 }
                 const {ifNoneMatch,ifModifiedSince, showListing} = options;
                     
                 //const url             = request.url; 
                 const parts           = url.split('.zip/');

                 if (parts.length>1) {
                     // this is a url in the format http://example.com/path/to/zipfile.zip/path/to/file/in/zip.ext
                     
                     return resolveZip (parts,ifNoneMatch,ifModifiedSince)
                     
                            .then(function(response){
                                if (response && response.status===200) {
                                    return cb(undefined,response);
                                }  else {
                                    return cb ();
                                }
                            })
                            
                            .catch(cb); 
                     
                 } else {
                 
                     if (showListing && url.endsWith('.zip')) {
                         
                         // this is a url pointing to a possibly existing zip file
                         // we don't let you download the zip. we do however give you the file list when you ask for a zip
                         // which provides links to each file inside
                         return resolveZipListing ( url )
                         
                                  .then(function(response){
                                         if (response && response.status===200) {
                                             return cb(undefined,response);
                                         }  else {
                                             return cb ();
                                         }
                                     })
                                     
                                  .catch(cb); 
                         
                     } else {
                         
                          return cb ();
                          
                          
                     }
                     
                 }
             }
             
             function doFetchZipUrl(request,url) {
                     
                 //const url             = request.url; 
                 const parts           = url.split('.zip/');
                 const ifNoneMatch     = request.headers.get('If-None-Match');
                 const ifModifiedSince = request.headers.get('If-Modified-Since');
                 
                 
                 if (parts.length>1) {
                     // this is a url in the format http://example.com/path/to/zipfile.zip/path/to/file/in/zip.ext
                     
                     return resolveZip (parts,ifNoneMatch,ifModifiedSince) ; 
                     
                 } else {
                 
                     if (request.url.endsWith('.zip')) {
                         // this is a url pointing to a possibly existing zip file
                         // we don't let you download the zip. we do however give you the file list when you ask for a zip
                         // which provides links to each file inside
                         return resolveZipListing ( url ) ; 
                     }
                 }
             }
             
             function internalErrorEvent (event) {
                 event.respondWith( Promise.resolve(new Response('', {
                                                    status: 500,
                                                    statusText: 'Internal Error. WTF did you do?',
                                                    headers: new Headers({
                                                      'Content-Length' : 0
                                                    })}))); 
             }
             
             
             function toReturnAnError (resolve) {
                 
                 resolve(new Response('', {
                 status: 500,
                 statusText: 'Internal Error. WTF did you do?',
                 headers: new Headers({
                   'Content-Length' : 0
                 })}));
                 
             }
             
            /* 
             
             function toFetchUpdatedZip(resolve,reject) {
                
                
                databases.updatedURLS.getKeys(function(err,keys){
                    
                   const relevantURLs = keys.filter(function(k){
                       return k.indexOf(url)===0;
                   });
                   
                   if (relevantURLs.length===0) {
                       resolve(new Response('', {
                           status: 404,
                           statusText: 'Not Found',
                           headers: new Headers({
                             'Content-Type'   : 'text/plain',
                             'Content-Length' : 0
                           })
                       }));
                   }
                   
                   const zip = new JSZip();
                   
                   const loop = function (i) {
                       
                      if (i < relevantURLs.length) {
                          
                          const file_url  = relevantURLs[i],
                                file_name = file_url.substr(url.length);
                          
                          databases.updatedURLS.getItem(file_url,function(err,args){
                              
                              if (err) return reject(err);
                              
                              zip.file(
                                  file_name, 
                                  args[0],{
                                      date : args[1].date
                                  }).then (function () {
                                      loop(i+1);
                                  });
                              
                          });
                          
                      }  else {
                          
                          zip.generateAsync({type:"arraybuffer"}).then(function (buffer) {
                              
                              resolve(new Response(buffer,{
                                  status:200,
                                  headers : new Headers({
                                      'Content-Type'   : mimeForFilename('x.zip'),
                                      'Content-Length' : buffer.byteLength
                                  })
                              }));
                              
                          });
                      }
                      
                   };
                   loop (0);
                    
                });
                
             }
             
             
           */
           
           
           
           
           function toFetchUrl (db,url,resolve) {
               // resolve to cached url response, or undefined if that url is not cached.
               // (will refresh the cache if online and etag has changed)
               db.getItem(url,function(err,args){
                   
                   if (err||!Array.isArray(args)) {
                       resolve();
                   } else {
                       
                       const hdrs=fixupKeys(args[1].headers);
                       const etag = hdrs.etag;
                       const lastModified = hdrs['last-modified'];
                       
                      
                       
                       if (etag||lastModified) {
                           
                          const getHeaders = {};
                          if (etag) {
                              getHeaders['if-none-match']= etag;
                          }
                          
                          if (lastModified) {
                              getHeaders['if-modified-since']= lastModified.toString();
                          }
                           
                           fetch(url, { headers: getHeaders })
                           
                           
                           .then(function(response){ 
                               if (response && response.status===200) {
                                   response.clone().arrayBuffer().then(function(buffer){
                                       
                                       const headers = {};
                                       for(var key of response.headers.keys()) {
                                          headers[key.toLowerCase()]=response.headers.get(key);
                                       }
                                       updateURLContents (url,db,buffer,{status:200,headers:headers},function(){
                                          return resolve(response);
                                       });
                                       
                                   });
                              }
                              
                              doCache() ;
                           })
                           
                           .catch(doCache);
                           
                       
                       }
                      
                   }
                   
                   
                   function doCache() { 
                      resolve(new Response(args[0],{status:200,headers:new Headers(args[1])}));
                   }
               });

           }
             
            
            function fixupKeys(db) {
                if (db) {
                    Object.keys(db).forEach(function(key){
                        const newkey=key.toLowerCase();
                        if (newkey===key) return;
                        db[newkey]=db[key]
                        delete db[key];
                    });
                }
                return db;
            }
            
             
             function updateURLContents(url,db,responseData,responseState,cb) {
                 
                 if (typeof responseState==='function') {
                     cb            = responseState;
                     responseState = undefined;
                 }
                 
                 if (typeof db==='string') {
                     db = databases[db];
                 }
                 
                 url = full_URL(location.origin,url);
                 
                 getPayload(function(payload){
                     fixupKeys(payload[1].headers);
                     db.setItem(url,payload,cb);
                 });

                 function getPayload (cb) {
                     if (responseState) return cb ([responseData,responseState]);
                     
                     sha1(responseData,function(err,hash){
                         cb([
                             responseData,
                             {
                                status : 200,
                                headers:{     'Content-Type'   : mimeForFilename(url),
                                   'Content-Length' : responseData.byteLength || responseData.length,
                                   'ETag'           : hash,
                                   'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                   'Last-Modified'  : new Date().toString()
                                }
                                 
                             }
                         ]);
                     });
                 }
             }
             
             function removeUpdatedURLContents(url,cb) {
                 url = full_URL(location.origin,url);
                 databases.updatedURLS.removeItem(url,cb);
             }
             
             
             
             return lib;
             
          };

        }
        
    }, (()=>{  return {
        
        
        Window: [  ],

        ServiceWorkerGlobalScope: [ () => self.sha1Lib.cb,  () =>fnSrc    ]
    };
      
      
      
      
      function fnSrc(f,k,c) {
          f = f.toString();
          if (c) {
             f=f.replace(/(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/)|\/\/.*?[\r\n])[\r\n]*/,'');
          }
          return k?f:f.substring(f.indexOf("{")+1,f.lastIndexOf("}")-1);
      }
      

    })()

    );
    

});




