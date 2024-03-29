/* global ml,self, JSZipUtils,JSZip,Response,Headers,BroadcastChannel,performance */

ml(` 
    
    sha1Lib                                | ${ml.c.app_root}sha1.js
    JSZip@ServiceWorkerGlobalScope         | ${ml.c.app_root}jszip.min.js
    ml_db_Lib@ServiceWorkerGlobalScope     | ${ml.c.app_root}ml.db.js
    zipUpWriteLib@ServiceWorkerGlobalScope | ${ml.c.app_root}ml.fetch.updated-write.js
    zipFSListingLib                        | ${ml.c.app_root}ml.zipfs.dir.sw.js
    virtualDirLib@ServiceWorkerGlobalScope | ${ml.c.app_root}ml.zipfs.virtual.js
    zipPNGLib@ServiceWorkerGlobalScope     | ${ml.c.app_root}ml.zipfs.png.js
    pwaMiddlewares                         | ${ml.c.app_root}ml.zipfs.middleware/index.js
    editInZed@ServiceWorkerGlobalScope     | ${ml.c.app_root}ml.zedhook.js
    fsTable                                | ${ml.c.app_root}fstab.json
    htmlFileMetaLib                        | ${ml.c.app_root}ml.zipfs.dir.file.meta.js 
    zipFSPaths                             | ${ml.c.app_root}ml.zipfs.paths.js 
    zipFSResponseLib                       | ${ml.c.app_root}ml.zipfs.response.js 
    zipFSResolveLib                        | ${ml.c.app_root}ml.zipfs.resolve.js 
   

    `,function(){ml(2,

    {   
        Window: function swResponseZipLib() {
        
                const lib = {
        
                };
                
               
               return lib;

        },
        
        ServiceWorkerGlobalScope: function swResponseZipLib (sha1,fnSrc) {
        
        
        const console_log = ()=>{}

        
        return function () {
            
            
             const databaseNames = [
                 "updatedURLS",
                 "updatedMetadata",
                 "openZips","zipMetadata",
                 "cachedURLS",
                 "offsiteURLS",
                 "deletedZipURLs"];
             const databases     = ml.i.ml_db_Lib (databaseNames,getZipObject);
             
             
             const registeredMiddleware = [];
             
             
             const {
                 // import these items
                 virtualDirDB,
                 
                 virtualDirQuery,
                 newVirtualDirs,
                 virtualDirListing,
                 addEditorInfo
                 // from ...
             } = ml.i.virtualDirLib( 
                 // which needs these items...
                 getEmbeddedZipFileResponse,
                 getZipDirMetaToolsExternal,
                 getZipFileUpdates
             );
             
             const {
                 
                 splitZipPaths,
                 testPathIsZip,
                 testPathIsZipMeta,
             
             }   = ml.i.zipFSPaths;
             
             
             const {  mimeForFilename } =  ml.i.htmlFileMetaLib;
            
             const {   // import these items...
                       updateURLContents,        fetchUpdatedURLContents,
                       removeUpdatedURLContents, fixupKeys,
                       getUpdatedURLs
                       // from...
                   } = ml.i.zipUpWriteLib (
                       // which needs  these items
                       databases, fetchInternalBuffer,
                       virtualDirQuery, mimeForFilename

                   );
            
            
            const {
                response304,
                response200,
                response500
            } = ml.i.zipFSResponseLib;           

            const {
                // import these items...
                resolveZipListing_HTML,
                resolveZipListing_Script,
                
                resolveZipDownload,
                getUpdatedZipFile,
                getZipFileUpdatedFiles
                // from
            }  =  ml.i.zipFSListingLib( {
                // whch needs these items...
                databases,
                getZipObject,
                fetchUpdatedURLContents,
                getZipFileUpdates,
                getZipDirMetaTools,
                fileisEdited,
                response200,
                getUpdatedURLs,
                virtualDirListing,
                addEditorInfo
            });
             
            const {
                    //import these items ...  
                     resolvePngZipDownload,
                     
                     createPNGZipFromZipUrl,
                     extractBufferFromPng

                     // from...
  
                  } = ml.i.zipPNGLib (
                      // which needs these items..
                      getUpdatedZipFile,
                      response200);
            
            
            const {
                resolveZip,
                resolveSubzip,
                dir_meta_name,
                dir_meta_empty,
                dir_meta_empty_json
            } = ml.i.zipFSResolveLib(
                databases,
                getZipObject,
                getZipDirMetaTools,
                resolveZipListing_HTML,
                resolveZipListing_Script);
                      
                      
                      
            const lib = {
                // export these items.
                processFetchRequest      : processFetchRequest,
                newFixupRulesArray       : newFixupRulesArray,
                
                fetchUpdatedURLContents  : fetchUpdatedURLContents,
                updateURLContents        : updateURLContents,
                removeUpdatedURLContents : removeUpdatedURLContents,
                
                getZipDirMetaTools       : getZipDirMetaToolsExternal,
                
                getUpdatedZipFile        : getUpdatedZipFile,
                
                createPNGZipFromZipUrl   : createPNGZipFromZipUrl,
                extractBufferFromPng     : extractBufferFromPng,
                
                
                getZipObject             : getZipObject,
                
                addMiddlewareListener    : addMiddlewareListener,
                
                removeMiddlewareListener : removeMiddlewareListener,
                
                virtualDirQuery          : virtualDirQuery,
                
                fixupUrl                 : fixupUrlEventInternal
     

            };          
             
                              
            const openZipFileCache = { };
             
             
            const fixupLog = function(){};//console.info.bind(console); 

            
             const emptyBuffer = new ArrayBuffer();
             
             const emptyBufferStatus = emptyBufferStatusWithType('text/plain');
             

             const defaultMiddlewareChain = [ // additional handlers handle loaded into registeredMiddleware                        
                        
                        
                       fetchFileFromZipEvent,    // this handles directly addressed zip urls (not virtual, but an explicit fetch from 
                                                 // inside a specific zip file)
                                               
  
                       fetchFileFromCacheEvent,  // for offline mode (or online, and file not modified), fetch the url from a cache
                                                 // database. fixupUrlEvent will have decided which database to used based on
                                                 // the domain - local urls are inside databases.cachedURLS. ohers are in databases.offsiteURLS
                                                 // we don't use the normal caches database here, as we utilize serialization to to intialize
                                                 // the database on site install.
                       
                       defaultFetchEvent         // last but not least... if url has not been cached, download and cache it.
                   ];
  
             const pwaMiddlewareOpts = { databases,
                                         response200,
                                         response500,
                                         fnSrc,
                                         virtualDirDB,
                                         virtualDirQuery,
                                         getZipObject,
                                         getZipDirMetaTools,
                                         removeUpdatedURLContents,
                                         updateURLContents,
                                         defaultMiddlewareChain,
                                         virtualDirListing,
                                         addEditorInfo                       
                 
                 
             };
             
             ml.i.pwaMiddlewares(addMiddlewareListener,pwaMiddlewareOpts);

             self.fixupUrl = function (url) {
                 
                 const url_in = url;
                 let url_out = url_in;
                  if (fixupUrlEvent.rules) {
                      
                      if (fixupUrlEvent.eventCache) {
                          const previous = fixupUrlEvent.eventCache[url_in];
                          if ( previous ) {
                              return previous.fixup_url;
                          }
                      }
                      
                      const baseURI = location.origin ; 
                      const baseURI_Rules = fixupUrlEvent.rules(baseURI);
                      check_rules(baseURI_Rules);
                  }
                  
                  return url_out;
                  
                  function check_rules(rules ) {
                      
                      return rules.forEach(checkRulesGroup);
                      
                      function checkRulesGroup(group){
                          while ( group.some( enforceRule ) );
                      }
                  }
                  
                  function enforceRule (x){
                     if (x.replace&&x.replace.test(url_out)) { 
                         const before = url_out;
                         url_out = url_out.replace(x.replace,x.with);
                         fixupLog(before,">>>==replace[",x.replace,"]/with[",x.with,"]==>>>",url_out);
                         return true;
                     } else {
                         if (x.match && x.addPrefix && x.match.test(url_out)) { 
                             const before = url_out;
                             url_out = x.addPrefix + url_out;
                             fixupLog(before,">>>==match[",x.match,"]/addPrefix[",x.addPrefix,"]==>>>",url_out);
                             return true;
                         }
                     }
                  }

             };
             
             const bypass = /\/fstab\.json$/;
             ml.c.fetch = function (url) {
    
                 return bypass.test(url) ?  fetch(url) : new Promise(function(resolve,reject){
                     
                     fetchInternal(url,function(err,response){
                         if (err) return reject(err);
                         resolve(response);
                     });
                 });
             };
             
           
             return lib;
             
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
             
             function queryToObject(q) {
                 var
                 i = 0,
                 retObj = {},
                 pair = null,
                 qArr = q.substr(1).split('&');
              
                 for (; i < qArr.length; i++){
                     pair = qArr[i].split('=');
                     retObj[pair[0]] = decodeURIComponent(pair[1]);
                 }
              
                 return retObj;
             }

             function removeMiddlewareListener (fn) {
                  const ix = registeredMiddleware.indexOf(fn);
                  if (ix>=0) {
                       registeredMiddleware.splice(ix,1);
                   }
               }       

             function processFetchRequestInternal(event,cb) {
                  event.startedAt = Date.now();
                  const querySplit  = event.request.url.indexOf('?');
                  event.fixup_url   = querySplit < 0 ? event.request.url : event.request.url.substr(0,querySplit);
                  event.fixup_query = querySplit < 0 ? '' : event.request.url.substr(querySplit);
                  event.fixup_params = queryToObject.bind(this,event.fixup_query);
                  
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
                      
                      
                      fixupUrlEvent            // sets event.fixup_url according to rules defined in fstab.json
                                                // these rules do things like append index.html to the root path
                                                // and convert partial urls into complete urls, with respect to the referrer
                       
                                
                    ].concat( registeredMiddleware, defaultMiddlewareChain );
 
                  
                  const next = function (handler) {
                      if (!handler) {
                          //ml.c.l("could not find for",event.fixup_url,"from",event.request.referrer); 
                          return ;
                      }
                      
                      fixupLog("trying",handler.name,"for",event.fixup_url,"from",event.request.referrer);
                      const promise = handler(event);
                      let timeout;
                      if (promise) {
                         timeout = setTimeout (handleResponseTimeout,15000);
                         promise.then(waitForResponse).catch(handleResponseError);

                      } else {
                          next(chain.shift()); 
                      }
                      
                      function handleResponseError(err) {
                          chain.splice(0,chain.length);
                          cb(err);
                      }
                      
                      function handleResponseTimeout(){
                          timeout = undefined;
                          response500 (function(response){
                              cb(undefined,response);
                          },"middleware "+handler.name+" did not respond within 5 seconds");
                          
                      }
                      function waitForResponse(response){
                             if (timeout) {
                                 clearTimeout(timeout);
                                 timeout = undefined;
                             }
                             if (!response) return next(chain.shift()); 
                             
                             fixupLog(handler.name,"returned a response for",event.fixup_url,"from",event.request.referrer); 
                             chain.splice(0,chain.length);
                             cb(undefined,response);
 
                         }
                  };
                  
                  next(chain.shift()); 
             }

             function fetchInternal(url,cb) {
                 const fakeEvent = {
                     fixup_url: url,
                     request : {
                         url      : url,
                         referrer : '',
                         headers  : {
                             get : function () {}
                         }
                     },
                 };
                 processFetchRequestInternal(fakeEvent,cb);
             }
             
             function fetchInternalBuffer(url,cb){
                  fetchInternal(url,function(err,response){
                        if(err) {
                           return cb(err);
                        }
                        response.arrayBuffer().then(function(buffer){
                            return cb (undefined,buffer);
                        });
                  });    
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

             function fixupUrlEvent (event) {
                  const stamp = performance.now();
                  const url_in = event.fixup_url;
                  let url_out = url_in;
                      
                  if (fixupUrlEvent.rules) {
                      
                      if (fixupUrlEvent.eventCache) {
                          const previous = fixupUrlEvent.eventCache[url_in];
                          if ( previous ) {
                              Object.keys(previous).forEach(function(k){
                                  event[k]=previous[k];
                              });
                              fixupLog("reused previous url rulesmap: ",url_in,"-->",event.fixup_url,"details:",previous,performance.now()-stamp,"ms");
                              return addEvents();
                          }
                      } else {
                          fixupLog("creating fixupUrlEvent.eventCache");
                          fixupUrlEvent.eventCache={};
                      }
                      
                      const referrer = event.request.referrer;
                      const baseURI = referrer === '' ? location.origin : 
                      
                        ( referrer.lastIndexOf('.') > referrer.lastIndexOf('/') ) 
                           ? referrer.substr(0,referrer.lastIndexOf("/"))
                           : referrer;  
                           
                      //fixupLog("referrer",referrer,"--> baseURI",baseURI);
                      const baseURI_Rules = fixupUrlEvent.rules(baseURI);
                      fixupLog("preflighting url with rules:",baseURI_Rules);
                      check_rules(baseURI_Rules);
                     
                      const cache       = fixupUrlEvent.eventCache[url_in] = {};
                      event.fixup_url   = cache.fixup_url   = url_out;
                      event.use_no_cors = cache.use_no_cors = url_out.indexOf(location.origin)!==0;
                      event.shouldCache = cache.shouldCache = url_out.indexOf(location.origin)===0 ||  event.request.referrer && event.request.referrer.indexOf(location.origin)===0;
                      event.cacheDB     = cache.cacheDB     = event.use_no_cors ? "offsiteURLS" : "cachedURLS" ;

                      fixupLog("defined url rulesmap: ",url_in,"-->",event.fixup_url,"details:",cache,performance.now()-stamp,"ms");
                      return addEvents() ;

                  } else {
                      return createRules();
                  }
                  
                  function addEvents() {
                      if (event.use_no_cors) {
                           event.fetchBuffer  = function(hdrs,cb) { 
                               if (typeof hdrs === 'function' ) {
                                   cb = hdrs; 
                                  return fetchBufferViaNoCors(event.request,event.fixup_url,cb);
                               } else {
                                  return fetchBufferViaNoCors(event.request,event.fixup_url,hdrs,cb);  
                               }
                           };
                           event.toFetchUrl   = function(db) { 
                               return function (resolve) {
                                  // return toFetchUrl (db||databases[event.cacheDB],event.fixup_url,false,resolve,event.fetchBuffer);
                                   
                                   db = db || databases[event.cacheDB];
                                   if (db.ready()) {
                                       proceed ();
                                   } else {
                                       db.getKeys(proceed);
                                   }
                                   
                                   function proceed () {
                                       const url = event.fixup_url && db.keyExists (event.fixup_url,false) ? event.fixup_url : false;
                                       if (url) {            
                                          return toFetchUrl (db, url, false, resolve,event.fetchBuffer);
                                       } else {
                                           resolve ();
                                       }
                                   }
                               };
                               
                               
                               
                           };
                      } else {
                           event.fetchBuffer = function(hdrs,cb) { 
                               if (typeof hdrs === 'function' ) {
                                  cb = hdrs; 
                                  return fetchBuffer(event.fixup_url,cb);
                               } else {
                                   return fetchBuffer(event.fixup_url,hdrs,cb);
                               }
                           };
                           event.toFetchUrl   = function(db) { 
                               return function (resolve) {
                                 db = db || databases[event.cacheDB];
                                 if (db.ready()) {
                                     proceed ();
                                 } else {
                                     db.getKeys(proceed);
                                 }
                                 
                                 function proceed () {
                                     const url = event.aliased_url && db.keyExists (event.aliased_url,false) ? event.aliased_url
                                                  : event.fixup_url && db.keyExists (event.fixup_url,false) ? event.fixup_url : false;
                                     if (url) {            
                                        return toFetchUrl (db, url, false, resolve,event.fetchBuffer);
                                     } else {
                                         resolve ();
                                     }
                                 }
                                 
                               };
                           };
                      }
                  }
                  
                  function check_rules(rules ) {
                      
                      return rules.forEach(checkRulesGroup);
                      
                      function checkRulesGroup(group){
                          while ( group.some( enforceRule ) );
                      }
                  }
                  
                  function enforceRule (x){
                     if (x.replace&&x.replace.test(url_out)) { 
                         const before = url_out;
                         url_out = url_out.replace(x.replace,x.with);
                         fixupLog(before,">>>==replace[",x.replace,"]/with[",x.with,"]==>>>",url_out);
                         return true;
                     } else {
                         if (x.match && x.addPrefix && x.match.test(url_out)) { 
                             const before = url_out;
                             url_out = x.addPrefix + url_out;
                             fixupLog(before,">>>==match[",x.match,"]/addPrefix[",x.addPrefix,"]==>>>",url_out);
                             return true;
                         }
                     }
                  }
                  
                  function createRules() {
                      return new Promise (function (resolve,reject){
                             fixupLog("downloading fstab.json");
                             ml.i.fsTable(function(err,arr) {
                                 
                               if (err) return reject(err);
                               newFixupRulesArray(arr);
                               
                               fixupLog("downloaded and parsed fstab.json",performance.now()-stamp,"ms");
                                
                               
                               fixupUrlEvent(event);
                               
                               
                               checkVirtualZipCache(0,resolve);
                               
                             });
                          
                      });
                      
                      function checkVirtualZipCache(index,cb) {
                          
                          return checkVirt(0);
                         
                          function checkVirt(index) {
                             if (index < virtualDirDB.virtualDirUrls.length) {
                                 const db_url = virtualDirDB.virtualDirUrls[index];
                                 checkurls(db_url,virtualDirDB.virtualDirs[db_url],function(){
                                     checkVirt(index+1);
                                 });
                                
                             } else {
                                 console.log("all zips for all virtual dirs are now cached");
                                 cb();
                             }
                             
                          }
                          
                          function checkurls(db_url,urls,cb) {
                              
                              return check(0);
                              
                              function check(index) {
                                  if (index<urls.length) {
                                      const url = urls[index].replace(/\.zip\/.*$/,'.zip');
                                      return databases.zipMetadata.getItem(url,function(err,zipFileMeta){
                                           if (err||!zipFileMeta) return downloadZip(url);     
                                           return databases.openZips.getItem(url,function(err,buffer){
                                                if (err||!buffer) return downloadZip(url);        
                                                check(index+1);
                                           });
                                      });
                                  } else {
                                      console_log("all zips for virtual dir",db_url,"are cached");
                                      cb();
                                  }
                              }
                              
                              function downloadZip(url){
                                  console.log("precaching",url,"as part of virtual dir",db_url);
                                  getZipObject(url,function(){
                                      console_log("precached",url,"as part of virtual dir",db_url)
                                      check(index+1);
                                  });
                              }
                              
                          }
                          
                         
                          
                      }
                      
                     
                      
                  }

             }
             
            
             
             function fixupUrlEventInternal(url,cb) {
                 const fakeEvent = {
                     fixup_url: url,
                     request : {
                         url      : url,
                         referrer : '',
                         headers  : {
                             get : function () {}
                         }
                     },
                 },CB=function(){
                    delete fakeEvent.request.url;
                    delete fakeEvent.request.referrer;
                    delete fakeEvent.request.headers.get;
                    delete fakeEvent.request.headers;
                    delete fakeEvent.request;
                    delete fakeEvent.fetchBuffer;
                    delete fakeEvent.toFetchUrl;
                    
                    cb(fakeEvent); 
                 };
                 
                 const promise = fixupUrlEvent(fakeEvent);
                 if (promise) return promise.then(CB);
                 CB();
             }

             function fetchFileFromZipEvent (event) {
                 const params    = event.fixup_params();
                 if (params.virtual_prefix) {
                     event.virtual_prefix = params.virtual_prefix;
                 }
                 return  doFetchZipUrl(event.request,event.fixup_url,params,event.virtual_prefix,event.zip_filter);
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
                                    updateURLContents (url,databases[event.cacheDB],buffer,{status:status,headers:headers},function(){
                                       resolve(new Response (buffer,{status:status,headers:headers}));
                                    });
                                    
                             } else {
                                 //console.log("not caching",url,"status",status,"from",event.request.referrer,headers);
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

             function fetchBuffer(url,headers,cb) {
                if (typeof headers==='function')  {
                    cb = headers;
                    fetch(url)
                     .then(getBufferFromResponse(cb))
                       .catch(cb);
                   
                } else {
                    fetch(url,{headers:headers})
                      .then(getBufferFromResponse(cb))
                         .catch(cb);
                }
             }
             
             function fetchBufferViaNoCors(request,url,hdrs,cb) {
                
                if (typeof hdrs==='function') {
                    cb=hdrs;
                    hdrs= false;
                }
                 
                (hdrs?fetch(request,{headers:hdrs}):fetch(request))
                 .then(getBufferFromResponse(cb))
                  .catch(function(){
                      
                      const opts = {mode:'no-cors',referrer:'about:client',referrerPolicy:'no-referrer'};
                      
                      fetch(url,opts)
                        .then(getBufferFromResponse(cb))
                         .catch(cb);
                  
                      
                  });
                
             }

             function prepareRules(baseURI,template,rulesJson) {
                const stamp = performance.now();
                if (!prepareRules.cache) {
                    prepareRules.cache={};
                }
                
                let result = prepareRules.cache[baseURI];
                if (!result) {
                    result = (prepareRules.cache[baseURI]=recurse(template,JSON.parse(rulesJson)));
                    fixupLog("prepared rules for",baseURI,result,performance.now()-stamp,"ms");
                }
                return result;

                function recurse(template,rules) {
                    if (Array.isArray(template)) {
                        return template.map(function(temp,ix){
                            return recurse(temp,rules[ix]);
                        });
                    }
                   
                    replacements(template,rules,'with');
                    replacements(template,rules,'addPrefix');
                    return template;
                }
                
                function replacements(dest,src,k) {
                    if (src[k]) {
                       dest[k] = src[k].replace(/\$\{base\}/g,baseURI);
                    }
                }
                
            }
             
             function newFixupRulesArray(arr) {
                 
                  fixupUrlEventClearCached();

                  // extract virtualdirs and remove comments from source array
                  const source = removeComments(arr).filter(function(x){
                     
                      if (x.virtualDirs) {
                          newVirtualDirs(x.virtualDirs);
                          delete x.virtualDirs;
                          return false;
                      }
                      
                      return true;
                  });
                  const json = JSON.stringify(source);
                  const rules_template = parseTemplate(source);
                  fixupLog("parsed rules_template",rules_template);
                  fixupUrlEvent.rules = function (baseURI) {
                      return prepareRules(baseURI,rules_template,json);
                  };

                 function isCommentFilter(el) { return typeof el !== 'string';}
                 function removeComments(arr) {
                     return (Array.isArray(arr)) ? arr.filter(isCommentFilter).map(removeComments): arr;
                 }

                 function parseTemplate(source) {
                     
                     if (Array.isArray(source)) {
                         return source.map(parseTemplate);
                     } else {
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
                         
                         regexs(source,'match');   
                         regexs(source,'replace'); 
                         replacements(source,'with');
                         replacements(source,'addPrefix');
                         return source;
                     }
                 }
                 
             }
             
             function fixupUrlEventClearCached() {
                 if (fixupUrlEvent.eventCache) {
                      
                     Object.keys(fixupUrlEvent.eventCache).forEach(function(k){
                         const cache = fixupUrlEvent.eventCache[k];
                         Object.keys(cache).forEach(function(k){
                             delete cache[k];
                         });
                         delete fixupUrlEvent.eventCache[k];
                     });
                        
                     fixupLog("cleared fixupUrlEvent.eventCache");
                          
                     delete fixupUrlEvent.eventCache;
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
                 url = url.endsWith('.zip/') ? url : url.endsWith('.zip') ? url +"/" : url.replace(/\/$/,'')+'/';
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
                             sha1(buffer,function(err,hash){
                                setMetadataForBuffer(url,buffer,hash,undefined,cb);
                             });
                              
                               
                         });
                     }
                 }
                 
                 databases.openZips.getItem(url,function(err,buffer){
                     
                     if (err || ! buffer) {
                         // the url is not mentioned in the openZips database, so this must be the first time
                         // so download it...
                         return download();                    
                     }
                     // retreive the stored metadata for this zip
                     databases.zipMetadata.getItem(url,function(err,zipFileMeta){
                         if (err || ! zipFileMeta) {
                             // ok so there is not metadata stored, start over and download the file again
                             return download();
                         }
                         cb(undefined,buffer,zipFileMeta);
                     });
                     
                 });
                 
                 
                
                 
                 function download() {
                     
                     const real_url = getRealUrl(url);
                     
                     if (real_url===url) {
                         
                         fetch(url)
                           .then(getBuffer)
                           .catch(function (){
                               downloadNoCors(url);
                            }).catch(cb);
                       
                     } else {
                         downloadNoCors(real_url);
                     }

                 }
                 
                 
                 function downloadNoCors(url) {
                     
                     return fetch(url,{mode:'no-cors'}).then(getBuffer).catch(cb);
                 }
                 
                 function getRealUrl(url) {
                     const prefix = 'https://';
                     const re1 =  /(?:^https:\/\/.*)(?:https-zip-mirror@)(.*)(?:@\.zip)/;
                     const re2 =  /(?:^https:\/\/.*)(?:https-zip-mirror@)(.*\.zip)/;
                     const match1 = re1.exec(url)
                     if (match1) {
                         return prefix+match1[1];
                     }
                     const match2 = re2.exec(url)
                     if (match2) {
                         return prefix+match2[1];
                     }
                     
                     return url;
                 }
                 
                 function getBuffer(response) {


                     if (!response.ok) {
                         return cb(new Error("HTTP error, status = " + response.status));
                     }

                     response.arrayBuffer().then(function(buffer) {

                         sha1(buffer,function(err,hash){

                             setMetadataForBuffer(
                                 url,
                                 buffer, 
                                 hash, 
                                 safeDate(response.headers.get('Last-Modified'),new Date()), 
                                 function(err, buffer, zipFileMeta) {
                                 
                                     if (err) return cb(err);
                                     
                                     databases.openZips.setItem(url, buffer, function(err) {
    
                                         if (err) return cb(err);
                                         
                                         cb(undefined, buffer, zipFileMeta);
    
                                     });
                                 
                                }
                            );


                         });

                     }).catch(cb);


                 }
                 
                 
               
             }
         
             function setMetadataForBuffer(url,buffer,hash,date,cb/*function(err,buffer,zipFileMeta){}*/) {
                 
                   const zipFileMeta = {
                       etag:hash,
                       date:date||new Date()
                   };
                 
                   // since we are saving the returned object into the database, 
                   // we don't want to store the tools object, so temporarily remove it
                   // (localforage would recurse into it otherwise, and we don't need to store it)
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
          
             function addFileMetaData(zip,zipFileMeta,zipurl,cb){
                 
                //const keep_in_meta_size_threshold = 1024 * 4;
                // if a file is less than 4 kb keep it uncompressed in the header, along with it's hash
                 
                if (typeof zipFileMeta.files==='object') {
                    // this zip already has the per-file meta data object
                    return cb(zipFileMeta);
                }
                
                
                zipFileMeta.files={};
                
                const root_dirs = [],root_files=[],promises = [/*holds promises to decompress/hash/preload each file*/];
                
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
                           contentType : mimeForFilename(file.name)
                       };
                       
                       if (file.name=== dir_meta_name) {
                           dir_meta_found=true;
                       }
                       
                       promises.push(new Promise(function(resolve){
                           zip.file(file.name).async("arraybuffer").then(function(buffer){
                               sha1(buffer,function(err,hash){
                                   zipFileMeta.files[file.name].contentLength = buffer.byteLength;
                                   zipFileMeta.files[file.name].etag = hash;
                                   //if (buffer.byteLength<=keep_in_meta_size_threshold) {
                                //       zipFileMeta.files[file.name].buffer=buffer;
                                 //  }
                                   resolve();
                               });
                           });
                       }));
                       
                    } else {
                       // const slash=file.name.indexOf("/");
                        //if ((slash<0)||(slash===file.name.lastIndexOf("/"))) {
                            const root = file.name.split("/")[0];
                            if (root_dirs.indexOf(root)<0) {
                               root_dirs.push(root);
                            }
                    //    }
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
                        date:zipFileMeta.date
                    };
                }
                
                Promise.all(promises).then(function(results){
                   results.splice(0,results.length);
                   promises.splice(0,promises.length);
                   cb(zipFileMeta);
                });
            }

             function getZipObject(url,buffer,cache,cb/*function(err,zip,zipFileMeta){})*/) {
                 if (typeof cache==='function') {
                     cb=cache;cache=true;
                 }
                 
                 if (typeof buffer==='function') {
                     cb=buffer;buffer=undefined;cache=true;
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
                             
                             if (cache) {
                                 openZipFileCache[url] = {
                                     touched    : Date.now(),
                                     zip        : zip,
                                     metadata   : zipFileMeta
                                 };
                             } else {
                                 return cb (undefined,zip);
                             }
                             
                             if (zipFileMeta.files) {
                                 // file has been opened once before
                                 return cb (undefined,zip,zipFileMeta);
                             }
                             
                             // this is the first time the file was opened.
                             // so we need to read the directory and save it into localforage
                             // this also "invents" etags for each file inside
                             // we do this once, on first open.
            
                            
                             // add metadata for each file (if not already added)
                             // this includes buffers for smaller files.
                             addFileMetaData(zip,zipFileMeta,url,function(zipFileMeta){
                                 
                                 const saveTools = zipFileMeta.tools; 
                                 if (saveTools) {
                                     delete zipFileMeta.tools;
                                 }
                                 
                                 databases.zipMetadata.setItem(url,zipFileMeta,function(err){
                                     
                                    if (err) return cb(err);
                
                                    if (saveTools) {
                                        zipFileMeta.tools= saveTools;
                                    }
                                    return cb (undefined,zip,zipFileMeta);
                                    
                                 });
                                 
                             });
            
                         });
                         
                     }).catch(cb);
            
                 });
                 
             }

             function getZipDirMetaToolsExternal(zip_url,cb) {
                
                 getZipObject(zip_url,function(err,zip,zipFileMeta){
                     
                     if (err) return cb(err);
                     
                     getZipDirMetaTools(zip_url,zip,zipFileMeta,cb);
                     
                 });
                 
             }

             function safeDate (d,def) {
                 const dt = new Date(d);
                 if (dt) return dt;
                 return def;
             }
             
             function regexpEscape(str) {
                 return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
             }
             
             function fileisEdited (url) {
                 if ( testPathIsZip(url) ) {
                     const re = new RegExp(  "^"+ regexpEscape(url+"/"),'g');
                     return databases.updatedURLS.allKeys().some(re.test.bind(re));
                 } else {
                    return databases.updatedURLS.keyExists( url, false );
                 }
             }
             
             function getZipDirMetaTools(url,zip,zipFileMeta,cb) {
                 
                 if (zipFileMeta.tools) {
                     return cb(zipFileMeta.tools,zip,zipFileMeta);
                 }
                 
                 const meta_url = url+'/'+dir_meta_name;
                 if (zipFileMeta.files[dir_meta_name]) {
                     
                     const meta = zip && zip.file(dir_meta_name);
                     if (meta) {
                         
                        meta.async('string').then(function(json){
                           cb (getTools(JSON.parse(json)),zip,zipFileMeta);
                        });
                        
                     } else {
                         
                         toFetchUrl (databases.updatedURLS,meta_url,true,function(buffer){
                             if (buffer) {
                                 cb (getTools(JSON.parse(bufferToText(buffer))),zip,zipFileMeta);
                             } else {
                                 cb (getTools(),zip,zipFileMeta);
                             }
                            
                         });
                         
                     }
                     
                     
                     
                 } else {
                     cb (getTools(),zip,zipFileMeta);
                 }
                 
                 function getTools(meta) {
                     
                     if (!meta) {
                         meta = JSON.parse(dir_meta_empty_json);
                     }
                     
                     const notifications = {};
                     
                     const notificationIds = [];
                     
                     const regexps = (meta && meta.hidden ? meta : dir_meta_empty).hidden.map(function(src){return new RegExp(src);});
                     
                     zipFileMeta.tools = {
                         
                             meta : meta,
                             
                             regexps  : function () {
                                const regexps = (meta && meta.hidden ? meta : dir_meta_empty).hidden.map(function(src){return new RegExp(src);});
                                return regexps;
                             },
                             
                             //metaSrc() creates a simulated meta.tools environment for the browser
                             metaSrc : function () {
                                 return [
                                     
                                    "var regExps = ["+zipFileMeta.tools.regexps().map(function(re){
                                                         return 'new RegExp("'+re.source+'","'+re.flags+'")';
                                                     }).join(',\n')+"];",
                                      
                                    "var meta = "+JSON.stringify(
                                        {
                                            deleted : meta.deleted,
                                        },undefined,4
                                     ) +";",
                                     
                                     "meta.tools = {",
                                        "       isDeleted : function (file,cb) {",
                                        "           if (cb) {",          
                                        "               return pwa.isDeleted(full_zip_uri,file,cb);",
                                        "           } else {",
                                        "               return isDeleted(file);",
                                        "           }",
                                                        isDeleted.toString(),
                                        "        },",
                                        "       isHidden : function (file,cb) {",
                                        "           if (cb) {",          
                                        "               return pwa.isHidden(full_zip_uri,file,function(err,msg){",
                                        "                    const el = find_li(file);",
                                        "                    if (el) {",
                                        "                        if (msg.hidden) {",
                                        "                             el.classList.add('hidden');",
                                        "                        } else {",
                                        "                             el.classList.remove('hidden');",
                                        "                        }",
                                        "                    }",
                                        "                    if(cb)cb(msg.hidden);",
                                        "                });",
                                        "           } else {",
                                        "               return isHidden(file);",
                                        "           }",
                                                     isHidden.toString(),
                                        "       }",
                                        "};"
                                     

                                 ].join("\n\n");
                             },
                             
                             isHidden : isHidden ,
                             
                             isDeleted : isDeleted,
                                
                             filterFileList : function ( files ) {
                                const deleted=meta.deleted||[];
                                return files.filter(function(file){
                                    return deleted.indexOf(file)< 0;
                                }); 
                             },
                             
                             allFiles : function (cb) {
                                 // get all files currently in the zip, regardless of weather they are "deleted" or not.
                                 cb(Object.keys(zipFileMeta.files));
                             },
                             
                             files : function (cb) {
                                 // get all files currently in the zip, and are not flagged as deleted
                                 
                                 cb(
                                     
                                     
                                     zipFileMeta.tools.filterFileList(Object.keys(zipFileMeta.files))
                                       .filter(function(file){
                                           return !isHidden(file);
                                       })
                                     
                                );
                             },
                             
                             editedFiles : function (cb) {
                                 // get files that are in the updated files list
                                 getZipFileUpdates(url,function(err,files){
                                    if (err) return cb([]);
                                    // and have not been deleted.
                                   cb(
                                       
                                       zipFileMeta
                                         .tools
                                           .filterFileList(files)
                                             .filter(function(file){
                                               return !isHidden(file);
                                             })
                                       
                                   )
                                 });
                             },
                             
                             hiddenFiles : function (cb) {
                                 const hidden=meta.hidden?meta.hidden.slice():[];
                                 cb(hidden);
                             },
                             
                             deletedFiles : function (cb) {
                                 const deleted=meta.deleted?meta.deleted.slice():[];
                                 cb(deleted);
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
                 const {ifNoneMatch,ifModifiedSince, showListing,virtual_prefix,virtual_zip_filter } = options;
                     
                 //const url             = request.url; 
                 const parts           = splitZipPaths(url);//url.split('.zip/');  

                 if (parts.length>1) {
                     // this is a url in the format http://example.com/path/to/zipfile.zip/path/to/file/in/zip.ext
                     
                     return resolveZip (parts,ifNoneMatch,ifModifiedSince,virtual_prefix,virtual_zip_filter)
                     
                            .then(function(response){
                                if (response && response.status===200) {
                                    return cb(undefined,response);
                                }  else {
                                    return cb ();
                                }
                            })
                            
                            .catch(cb); 
                     
                 } else {
                 
                     if (showListing &&  testPathIsZip(url) ) {
                         
                         // this is a url pointing to a possibly existing zip file
                         // we don't let you download the zip. we do however give you the file list when you ask for a zip
                         // which provides links to each file inside
                         return resolveZipListing_HTML ( url,undefined,virtual_prefix,virtual_zip_filter )
                         
                                  .then(function(response){
                                         if (response && response.status===200) {
                                             return cb(undefined,response);
                                         }  else {
                                             return cb ();
                                         }
                                     })
                                     
                                  .catch(cb); 
                         
                     } else {
                         
                          if (showListing &&  testPathIsZipMeta(url) ) {
                              
                              // this is a url pointing to a possibly existing zip file
                              // we don't let you download the zip. we do however give you the file list when you ask for a zip
                              // which provides links to each file inside
                              return resolveZipListing_Script ( url,undefined,virtual_prefix,virtual_zip_filter )
                              
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
             }
             
             function doFetchZipUrl(request,url,params,virtual_prefix,virtual_zip_filter) {
                     
                 //const url             = request.url; 
                 const parts           = splitZipPaths(url);//url.split('.zip/');
                 const ifNoneMatch     = request.headers.get('If-None-Match');
                 const ifModifiedSince = request.headers.get('If-Modified-Since');
                 
                 
                 if (parts.length>1) {
                     // this is a url in the format http://example.com/path/to/zipfile.zip/path/to/file/in/zip.ext
                     
                     return resolveZip (parts,ifNoneMatch,ifModifiedSince,virtual_prefix,virtual_zip_filter) ; 
                     
                 } else {
                 
                     if ( testPathIsZip(url) ) {
                         // this is a url pointing to a possibly existing zip file
                         // we don't let you download the zip. we do however give you the file list when you ask for a zip
                         // which provides links to each file inside
                         
                         if (params.download) {
                             return resolveZipDownload( url, params.download, virtual_prefix  );
                         }
                         return resolveZipListing_HTML ( url,undefined,virtual_prefix,virtual_zip_filter  ) ; 
                     }
                     
                     if ( testPathIsZipMeta(url) ) {
                         // this is a url pointing to a possibly existing zip file
                         // we don't let you download the zip. we do however give you the file list when you ask for a zip
                         // which provides links to each file inside
                         return resolveZipListing_Script ( url,undefined,virtual_prefix,virtual_zip_filter  ) ; 
                     }
                     
                     
                     if (url.endsWith('.zip.png')) {
                         
                         // this creates an inline png zip file (but it won't save)

                         return resolvePngZipDownload( url.replace(/\.zip\.png$/,'.zip') , params.download || 'files', virtual_prefix  );
                         
                        
                     }
                 }
                 
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
                           
                           bufferFetcher = bufferFetcher || function(hdrs,cb) { return fetchBuffer(url,hdrs,cb) ; };
                           
                           bufferFetcher(getHeaders,function(err,buffer,status,ok,headers,response){
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
        
             function addMiddlewareListener (fn) {
               if (registeredMiddleware.indexOf(fn)<0) {
                   registeredMiddleware.push(fn);
               }
           }

          };

        }
        
    }, (()=>{  return {
        
       
        
        Window: [  ],

        ServiceWorkerGlobalScope: [ 
            () => ml.i.sha1Lib.cb,  
            () => fnSrc]
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



