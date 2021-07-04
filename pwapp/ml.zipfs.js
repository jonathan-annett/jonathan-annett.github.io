/* global ml,self, JSZipUtils,JSZip,Response,Headers,BroadcastChannel */

ml(0,ml(1),[ 
    
    'sha1Lib                                | sha1.js',
    'zipFSListingLib                        | ml.zipfs.dir.sw.js',
    'JSZipUtils@ServiceWorkerGlobalScope    | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
    'JSZip@ServiceWorkerGlobalScope         | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js',
    'ml_db_Lib@ServiceWorkerGlobalScope     | ml.db.js',
    'zipUpWriteLib@ServiceWorkerGlobalScope | ml.zipfs.fetch.updated-write.js'
   

    ],function(){ml(2,ml(3),ml(4),

    {   
        Window: function swResponseZipLib() {
        
                const lib = {
        
                };
                
               
               return lib;

        },
        
        ServiceWorkerGlobalScope: function swResponseZipLib (sha1,fnSrc, listingLib,ml_db) {
        
        
        return function (dbKeyPrefix) {
            
            
             const databaseNames = ["updatedURLS","openZips","zipMetadata","cachedURLS","offsiteURLS"];
             const databases     = ml_db (databaseNames);
            
             const {
                       updateURLContents,
                       fetchUpdatedURLContents,
                       removeUpdatedURLContents,
                       fixupKeys
                   } = self.zipUpWriteLib(databases,processFetchRequestInternal,mimeForFilename);

             const lib = {
                 processFetchRequest      : processFetchRequest,
                 newFixupRulesArray       : newFixupRulesArray,
                 
                 fetchUpdatedURLContents  : fetchUpdatedURLContents,
                 updateURLContents        : updateURLContents,
                 removeUpdatedURLContents : removeUpdatedURLContents,
                 
                 getZipDirMetaTools       : getZipDirMetaToolsExternal
             };
             
             const { resolveZipListing }  =  listingLib( getZipObject,getZipFileUpdates,getZipDirMetaTools,fileisEdited ); 
                              
             const openZipFileCache = { };
             
             const virtualDir = {
             
                 
             };
              
             
             
             const dir_meta_name  = '.dirmeta.json';
             const dir_meta_empty = {"deleted":[],"hidden":["^\\."]};
             const dir_meta_empty_json = JSON.stringify(dir_meta_empty);
             const dir_meta_empty_resp = {
                 status: 200,
                 headers : {
                     'Content-Type'   : 'application/json',
                     'Content-Length' : dir_meta_empty_json.length,
                 }
             };
             
             const emptyBuffer = new ArrayBuffer();
             
             const emptyBufferStatus = emptyBufferStatusWithType('text/plain');
             
             function emptyBufferStatusWithType(t) {
                 return {
                            status: 200,
                            headers : {
                                'Content-Type'   : t,
                                'Content-Length' : 0,
                            }
                        };
             }
             
             function fetchLocalJson(path,cb) {
                 fetch(path).then(function(response){
                    response.json().then(function(x){return cb(undefined,x)}).catch(cb); 
                 }).catch(cb);
             }

             function processFetchRequestInternal(event,cb) {
                  const querySplit  = event.request.url.indexOf('?');
                  event.fixup_url   = querySplit < 0 ? event.request.url : event.request.url.substr(0,querySplit);
                  event.fixup_query = querySplit < 0 ? '' : event.request.url.substr(querySplit);
                  
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
                             cb(undefined,response);
 
                         }).catch (function(err){
                             
                             chain.splice(0,chain.length);
                             cb(err);
                         });
                        
                      } else {
                          next(chain.shift()); 
                      }
                      
                  };
                  
                  next(chain.shift()); 
             }
             
             
             function processFetchRequest(event) {
                event.respondWith(
                    new Promise(function(resolve,reject){
                        processFetchRequestInternal(event,function(err,response){
                            if (err) return reject (err);
                            resolve(response);
                        });
                    })
                );
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
                         
                          event.fixup_url   = url;
                          event.use_no_cors = url.indexOf(location.origin)!==0;
                          event.shouldCache = url.indexOf(location.origin)===0 ||  event.request.referrer && event.request.referrer.indexOf(location.origin)===0;
                        
                          if (event.use_no_cors) {
                               event.cacheDB = databases.offsiteURLS;
                               event.fetchBuffer  = function(cb) { 
                                  return fetchBufferViaNoCors(event.request,event.fixup_url,cb);
                               };
                               event.toFetchUrl   = function(db) { 
                                   return function (resolve,reject) {
                                       return toFetchUrl (db||event.cacheDB,url,false,resolve,event.fetchBuffer);
                                   };
                               };
                          } else {
                               event.cacheDB = databases.cachedURLS;
                               event.fetchBuffer = function(cb) { 
                                   return fetchBuffer(event.fixup_url,cb);
                               };
                               event.toFetchUrl   = function(db) { 
                                   return function (resolve,reject) {
                                     return toFetchUrl (db||event.cacheDB,url,false,resolve,event.fetchBuffer);
                                   };
                               };
                          }

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
                     case "GET"    : return  db.keyExists(url,true) ? new Promise ( event.toFetchUrl(databases.updatedURLS) ) : undefined;
                     case "PUT"    : return new Promise ( toUpdateUrl );
                     case "DELETE" : return new Promise ( toRemoveUrl );
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
                 
                 function toRemoveUrl (resolve,reject) {
                        
                    let inzip   = event.request.headers.get('x-is-in-zip') ===  '1';
                    
                    
                    removeUpdatedURLContents (url,function(){
                        
                        
                        if (inzip) {
                            
                            const zip_url_split = url.lastIndexOf('.zip/')+4;
                            const zip_url     = url.substr(0,zip_url_split);
                            const file_in_zip = url.substr(zip_url_split+1);
                            
                            getZipObject(zip_url,function(err,zip,zipFileMeta){
                                
                                if (err)  throw err;
                                 
                                getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                                    
                                    tools.deleteFile(file_in_zip,okStatus);
                                    tools.notify({deleteFile:file_in_zip});
                                });
                                
                            });
                            
                        } else {
                            okStatus();
                        }
                        
                    }); 
                    
                    
                    
                    function okStatus() {
                          resolve(new Response('ok', {
                            status: 200,
                            statusText: 'Ok',
                            headers: new Headers({
                              'Content-Type'   : 'text/plain',
                              'Content-Length' : 2
                            })
                        }));
                    }
                 
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
                 
                 switch (event.request.method) {
                     case "GET"    : return new Promise ( event.toFetchUrl() );
                 }

             }

             function defaultFetchEvent(event) {
                 const url = event.fixup_url;
                 
                 return new Promise(
                     
                     function(resolve,reject) {
                         

                         event.fetchBuffer(function(err,buffer,status,ok,headers,response){
                             if (err) return reject(err);
                             
                             if (status===0 && buffer.byteLength===0) {
                                 
                                 return fetch(url,{mode:'no-cors'}).then(resolve).catch(reject);
                                 
                             }
                             
                             if (ok && event.cacheDB) {
                                    updateURLContents (url,event.cacheDB,buffer,{status:status,headers:headers},function(){
                                       resolve(new Response (buffer,{status:status,headers:headers}));
                                    });
                                    
                             } else {
                                 console.log("not caching",url,"status",status,"from",event.request.referrer,headers);
                                 resolve(response);
                             }
                         });

                     }
                  );
                 
             }
             
             function getBufferFromResponse(cb) {
                   return function (response) {
                       response.clone().arrayBuffer().then(function(buffer) {
                           
                           const headers = {};
                           
                           for(var key of response.headers.keys()) {
                              headers[key.toLowerCase()]=response.headers.get(key);
                           }
                           cb(undefined,buffer,response.status,response.ok,headers,response);
                       });
                   };
                   
             }

             function fetchBuffer(url,cb) {
                 
                fetch(url)
                 .then(getBufferFromResponse(cb))
                   .catch(cb);
             }
             
             function fetchBufferViaNoCors(request,url,cb) {
                 
                fetch(request)
                 .then(getBufferFromResponse(cb))
                  .catch(function(){
                      
                      fetch(url,{mode:'no-cors',referrer:'about:client',referrerPolicy:'no-referrer'})
                        .then(getBufferFromResponse(cb))
                         .catch(cb);
                  
                      
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
             
             
             function getZipFileUpdates(url,cb) {
                 url = url.endsWith('.zip/') ? url : url.endsWith('.zip') ? url +"/" : false;
                 if (url) {
                     const len = url.length;
                     
                     databases.updatedURLS.getKeys(function(err,keys){
                        if (err) return cb (err);
                        return cb (undefined,keys.filter(function(u){
                            return u.indexOf(url)===0;
                        }).map(function(u){
                            return u.substr(len);
                        }));
                     });
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
                     .then(getBuffer)
                       .catch(function(err){
                           
                            fetch(url,{mode:'no-cors'})
                               .then(getBuffer)
                               .catch(function(err){
                                   
                                    fetch(url+"?r="+Math.random().toString(36).substr(-8),{
                                        mode:'no-cors',
                                        headers:{
                                            'if-none-match':Math.random().toString(36).substr(-8),
                                            'if-modified-since':new Date( Date.now() - ( 5 * 365 * 24 * 60 * 60 * 1000) ).toString()
                                        }
                                        
                                    },'')
                                       .then(getBuffer)
                                       .catch(cb);
                                       
                                       
                               });
                               
                       }).catch(cb);
                 }
                 
                 function getBuffer(response) {
                     
                     
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
                     
                       const saveTools = zipFileMeta.tools; 
                       if (saveTools) {
                           delete zipFileMeta.tools;
                       }
                       databases.zipMetadata.setItem(url,zipFileMeta,function(err){
                             if (err) return cb(err);
                             
                             if (saveTools) {
                                 zipFileMeta.tools = saveTools;
                             }
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
            
                             const saveTools = zipFileMeta.tools; 
                             if (saveTools) {
                                 delete zipFileMeta.tools;
                             }
                             databases.zipMetadata.setItem(url,addFileMetaData(zip,zipFileMeta,url),function(err){
                                 
                                if (err) return cb(err);
            
                                if (saveTools) {
                                    zipFileMeta.tools= saveTools;
                                }
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
             
             
             function getZipDirMetaToolsExternal(zip_url,cb) {
                 getZipObject(zip_url,function(err,zip,zipFileMeta){
                     if (err) return cb(err);
                     getZipDirMetaTools(zip_url,zip,zipFileMeta,cb);
                 });
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
                         
                        getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                                
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
                             
                             const zip_fileobj = zip.file(file_path);
                             
                             if (!zip_fileobj) {
                                 // url refers to a file NOT in the zip
                                 if (file_path===dir_meta_name) {
                                     // this zip doesn't have any custom meta, and this url points to the implied meta json file for the zip
                                     // the meta json file has things like deleted files, extra files, hidden file rules.
                                     // this enbables the editor to "update" files that don't exist yet, or remove files that
                                     // are no longer needed, without immedately modifying the server based zip. 
                                     // since there is nothing defined, we return a default empty meta record.
                                     return resolve(new Response(dir_meta_empty_json,dir_meta_empty_resp));
                                 } else {
     
                                     throw new Error ('file not in zip!'); 
                                 }
                             }
                             
                             zip_fileobj.async('arraybuffer').then(function(buffer){
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
                                        const saveTools = zipFileMeta.tools; 
                                        if (saveTools) {
                                            delete zipFileMeta.tools;
                                        }
                                        databases.zipMetadata.setItem(zip_url,zipFileMeta,function(){
                                            if (saveTools) {
                                                zipFileMeta.tools = saveTools; 
                                            }
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
                         getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                             
                            
                             
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
                             
                             
                             const zip_fileobj = zip.file(file_path);
                             
                             if (!zip_fileobj) {
                                 if (file_path===dir_meta_name) {
                                     return resolve(new Response(dir_meta_empty_json,dir_meta_empty_resp));
                                 } else {
                                     throw new Error ('file not in zip!'); 
                                 }
                             }
                             
                             zip_fileobj.async('arraybuffer').then(function(buffer){
                                     
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
                                             const saveTools = zipFileMeta.tools; 
                                             if (saveTools) {
                                                 delete zipFileMeta.tools;
                                             }
                                             databases.zipMetadata.setItem(zip_url,zipFileMeta,function(){
                                                 zipFileMeta.tools = saveTools;
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
                 });
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
             
             function getZipDirMetaTools(url,zip,zipFileMeta,cb) {
                 if (zipFileMeta.tools) {
                     return cb(zipFileMeta.tools);
                 }
                 const meta_url = url+'/'+dir_meta_name;
                 if (zipFileMeta.files[dir_meta_name]) {
                     const meta = zip.file(dir_meta_name);
                     if (meta) {
                        meta.async('string').then(function(json){
                           cb (getTools(JSON.parse(json)));
                        });
                     } else {
                         
                         toFetchUrl (databases.updatedURLS,meta_url,true,function(buffer){
                             if (buffer) {
                                 cb (getTools(JSON.parse(bufferToText(buffer))));
                             } else {
                                 cb (getTools());
                             }
                            
                         });
                         
                     }
                     
                     
                     
                 } else {
                     cb (getTools());
                 }
                 
                 function getTools(meta) {
                     if (!meta) {
                         meta = JSON.parse(dir_meta_empty_json);
                     }
                     const notifications = {};
                     const notificationIds = [];
                     const regexps = (meta && meta.hidden ? meta : dir_meta_empty).hidden.map(function(src){return new RegExp(src);});
                     zipFileMeta.tools = {
                             
                             isHidden : isHidden ,
                             
                             isDeleted : isDeleted,
                             
                             filterFileList : function ( files ) {
                                const deleted=meta.deleted||[];
                                return files.filter(function(file){
                                    return deleted.indexOf(file)< 0;
                                }); 
                             },
                             
                             deleteFile : function (file_name,cb) {
                                 meta.deleted = meta.deleted || [];
                                 const msgReply = {deleted:file_name};
                                 if (meta.deleted.indexOf(file_name) < 0 ) {
                                     meta.deleted.push (file_name);
                                     updateURLContents(
                                         meta_url,
                                         databases.updatedURLS,
                                         bufferFromText(JSON.stringify(meta)),
                                         function () {
                                             if (cb)cb(msgReply);
                                             if (notificationIds.length) {
                                                 if (isHidden(file_name)) {
                                                     msgReply.hidden=file_name;
                                                 } else {
                                                     msgReply.unhidden=file_name;
                                                 } 
                                                 toolsNotify(msgReply);
                                             }
                                         }
                                     );
                                 } else {
                                     if (cb)cb(msgReply);
                                     if (notificationIds.length) {
                                          if (isHidden(file_name)) {
                                              msgReply.hidden=file_name;
                                          } else {
                                              msgReply.unhidden=file_name;
                                          }
                                          toolsNotify(msgReply);
                                     }
                                 }
                             },
                             
                             undeleteFile : function (file_name,cb) {
                                 meta.deleted = meta.deleted || [];
                                 const ix = meta.deleted.indexOf(file_name);
                                 const msgReply= {undeleted:file_name};
                                 if (ix >= 0 ) {
                                     meta.deleted.splice (ix,1);
                                     updateURLContents(
                                         meta_url,
                                         databases.updatedURLS,
                                         bufferFromText(JSON.stringify(meta)),
                                         function () {
                                             if (cb)cb(msgReply);
                                             
                                             if (notificationIds.length) {
                                                 if (isHidden(file_name)) {
                                                     msgReply.hidden=file_name;
                                                 } else {
                                                     msgReply.unhidden=file_name;
                                                 }
                                                 toolsNotify(msgReply);
                                             }
                                         }
                                     );
                                 } else {
                                     if (cb)cb(msgReply);
                                     if (notificationIds.length) {
                                          if (isHidden(file_name)) {
                                              msgReply.hidden=file_name;
                                          } else {
                                              msgReply.unhidden=file_name;
                                          }
                                          toolsNotify(msgReply);
                                     }
                                 }
                             },
                             
                             toggleDelete : function (file_name,cb) {
                                meta.deleted = meta.deleted || [];
                                const ix = meta.deleted.indexOf(file_name);
                                const msgReply={};
                                if (ix >= 0 ) {
                                    meta.deleted.splice (ix,1);
                                    msgReply.undeleted = file_name;
                                } else {
                                    meta.deleted.push (file_name);
                                    msgReply.deleted = file_name;
                                }
                                
                                updateURLContents(
                                    meta_url,
                                    databases.updatedURLS,
                                    bufferFromText(JSON.stringify(meta)),
                                    function () {
                                        if (cb)cb(msgReply);
                                        if (notificationIds.length) {
                                            if (isHidden(file_name)) {
                                                msgReply.hidden=file_name;
                                            } else {
                                                msgReply.unhidden=file_name;
                                            }
                                            toolsNotify(msgReply);
                                        }
                                    }
                                );
                            },
                            
                             hideFile : function (file_name,cb) {
                                 meta.hidden = meta.deleted || [];
                                 if (meta.hidden.indexOf(file_name) < 0 ) {
                                     meta.hidden.push (file_name);
                                     updateURLContents(
                                         meta_url,
                                         databases.updatedURLS,
                                         bufferFromText(JSON.stringify(meta)),
                                         function () {
                                             cb({hidden:file_name});
                                         }
                                     );
                                 } else {
                                     cb();
                                 }
                             },
                             
                             unhideFile : function (file_name,cb) {
                                 meta.hidden = meta.hidden || [];
                                 const ix = meta.hidden.indexOf(file_name);
                                 const msgReply = {unhidden:file_name}
                                 if (ix >= 0 ) {
                                     meta.hidden.splice (ix,1);
                                     updateURLContents(
                                         meta_url,
                                         databases.updatedURLS,
                                         bufferFromText(JSON.stringify(meta)),
                                         function () {
                                             if (cb)cb(msgReply);
                                             if (notificationIds.length)
                                                  toolsNotify(msgReply);
                                         }
                                     );
                                 } else {
                                     if (cb)cb(msgReply);
                                     if (notificationIds.length)
                                        toolsNotify(msgReply);
                                 }
                             },
                             
                             toggleHidden : function (file_name,cb) {
                                meta.hidden = meta.hidden || [];
                                const ix = meta.hidden.indexOf(file_name);
                                const msgReply={};
                                if (ix >= 0 ) {
                                    meta.hidden.splice (ix,1);
                                    msgReply.unhidden = file_name;
                                } else {
                                    meta.hidden.push (file_name);
                                    msgReply.hidden = file_name;
                                }
                                updateURLContents(
                                    meta_url,
                                    databases.updatedURLS,
                                    bufferFromText(JSON.stringify(meta)),
                                    function () {
                                        if (cb)cb(msgReply);
                                        if (notificationIds.length)
                                           toolsNotify(msgReply);
                                    }
                                );
                            },
                            
                             registerForNotifications : function (cb) {
                                 const notificationId = "changes_"+Date.now().toString(36).substr(-6)+'_'+Math.random().toString(36).substr(-8);
                                 
                                 const channel = new BroadcastChannel(notificationId);
                                 notifications[notificationId]=channel;
                                 notificationIds.splice.apply(notificationIds,[0,notificationIds.length].concat(Object.keys(notifications)));
                                 cb({notificationId:notificationId}); 
                             },
                             
                             
                             writeFileString : function (file,text,hash,cb) {
                                 if (typeof hash==='function') {
                                     cb=hash;
                                     hash=false;
                                 }
                                 const buffer = bufferFromText(text);
                                 updateURLContents (url+'/'+file,databases.updatedURLS,buffer,function(err){
                                    if (err) return cb ({error:err.message||err});
                                    if (hash) {
                                       sha1(buffer,function(err,hash){
                                           if (err) return cb ({error:err.message||err});
                                           cb (hash);
                                           toolsNotify({writeFileString:file,hash,length:text.length});
                                       });
                                    } else {
                                       cb();
                                       toolsNotify({writeFileString:file,length:text.length});
                                    }
                                 });
                             },
                             
                             readFileString : function (file,hash,cb) {
                                 if (typeof hash==='function') {
                                     cb=hash;
                                     hash=false;
                                 }
                                 fetchUpdatedURLContents(url+'/'+file,function(err,buffer){
                                     if (err) return cb ({error:err.message||err});
                                     const text = bufferToText(buffer);
                                     if (hash) {
                                        sha1(buffer,function(err,hash){
                                            if (err) return cb ({error:err.message||err});
                                            cb ({text,hash});
                                            if (notificationIds.length)
                                               toolsNotify({readFileString:file,hash,length:text.length});
                                        });
                                     } else {
                                        cb(text);
                                        if (notificationIds.length)
                                           toolsNotify({readFileString:file,length:text.length});
                                     }
                                 }) 
                             },
                             
                             unregisterForNotifications : function (notificationId,cb) {
                                 delete notifications[notificationId];
                                 notificationIds.splice.apply(notificationIds,[0,notificationIds.length].concat(Object.keys(notifications)));
                                 cb({}); 
                             },
                             
                             notify : toolsNotify
             
                     };
                     
                     return zipFileMeta.tools;
                     
                     function toolsNotify(msg) {
                         notificationIds.forEach(function(notificationId){
                             notifications[notificationId].postMessage(msg);
                         });
                     }
                     
                     function isDeleted (file_name) {
                         return meta.deleted && meta.deleted.indexOf(file_name)>=0;
                     }
                     
                     function isHidden (file_name) {
                        if (meta.deleted) { 
                            if (meta.deleted.indexOf(file_name)>=0) return true;
                        }
                        
                        return regexps.some(function(re){ 
                            return re.test(file_name);
                        });
                     }
                 }
                 
                 function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}

                 function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}

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
             
 
           function toFetchUrl (db,url,raw,resolve,bufferFetcher) {
               
               if (typeof raw==='function') {
                   resolve=raw;
                   raw=false;
               }
               
               // resolve to cached url response, or undefined if that url is not cached.
               // (will refresh the cache if online and etag has changed)
               db.getItem(url,function(err,args){
                   
                   if (err||!Array.isArray(args)) {
                       // item is not cached, so resolve undefined.
                       resolve();
                   } else {
                       // inspect cache header to see cache can be compared
                       const hdrs = fixupKeys(args[1].headers);
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
                           
                           bufferFetcher = bufferFetcher || function(cb) { return fetchBuffer(url,cb) ; };
                           
                           bufferFetcher(function(err,buffer,status,ok,headers,response){
                                if (!err && response && response.status===200) {
                                   
                                    updateURLContents (url,db,buffer,{status:200,headers:headers},function(){
                                        // we got an updated buffer
                                        if (raw) return resolve(buffer);// caller wants buffer not response
                                        return resolve(response);
                                    });
                                        

                               } else {
                                   // if server reports someething other than 200, return from cache
                                   doCache() ;
                               }
                               
                           });

                       } else {
                           // there's no cache info so no point in checking server for update, use local cache.
                           doCache();
                       }
                   }
                   
                   
                   function doCache() { 
                      if (raw) return resolve(args[0]);
                      resolve(new Response(args[0],{status:200,headers:new Headers(args[1])}));
                   }
               });

           }
             
            
           


             return lib;
             
          };

        }
        
    }, (()=>{  return {
        
       
        
        Window: [  ],

        ServiceWorkerGlobalScope: [ 
            () => self.sha1Lib.cb,  
            () => fnSrc, 
            () => self.zipFSListingLib, 
            () => self.ml_db_Lib ]
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




