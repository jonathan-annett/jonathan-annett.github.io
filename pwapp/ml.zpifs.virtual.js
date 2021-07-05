/* global ml,self,caches,BroadcastChannel, Response,Headers  */
ml(0,ml(1),[
    
   
    
    ],function(){ml(2,ml(3),ml(4),

    {

        ServiceWorkerGlobalScope: function virtualDirLib(  ) {
            
            
            
            return function  (getEmbeddedZipFileResponse) {

                const virtualDirDB = {
                
                    
                };

                const lib = {
                    virtualDirQuery,
                    virtualDirEvent,
                    newVirtualDirs,
                    virtualDirResponseEvent,
                    virtualDirDB
                };
                
                
                
                function newVirtualDirs(newDirs) {
                     clearVirtualDirsCache();
            
                     virtualDirDB.virtualDirs    = newDirs;
                     virtualDirDB.virtualDirUrls = Object.keys(newDirs);
                     virtualDirDB.virtualDirZipBase = {};
                     virtualDirDB.virtualDirUrls.forEach(function(prefix){
                         const vd = newDirs[prefix];
                         
                         if (Array.isArray(vd)) {
                             virtualDirDB.virtualDirZipBase[prefix]=vd[vd.length-1];
                         } else {
                             
                             if(vd.alias_root && Array.isArray(vd.zips))  {
                                newDirs[prefix] = vd.zips.map(function(path){
                                    return path + vd.alias_root;
                                });
                                virtualDirDB.virtualDirZipBase[prefix]=vd.zips[vd.zips.length-1]+vd.alias_root;
                             }
                         }
                     });
                     virtualDirDB.cache = {};
                 
                    function clearVirtualDirsCache() {
                        if (virtualDirDB.cache) {
                            Object.keys (virtualDirDB.cache).forEach(function(u){
                                const previous = virtualDirDB.cache[u];
                                delete virtualDirDB.cache[previous.url];
                                delete virtualDirDB.cache[previous.fixup_url];
                                delete previous.response;
                                delete previous.url;
                                delete previous.fixup_url;
   
                            });
                            
                            delete virtualDirDB.cache;
                        }
                        
                    }
                }

                function virtualDirQuery (url) {
                   
                   const previous = virtualDirDB.cache && virtualDirDB.cache[url];
                   if (previous) {
                       return Promise.resolve(previous);
                   }
                   
                   if (virtualDirDB.virtualDirs && virtualDirDB.virtualDirUrls) {
                       // see if the url starts with one of the virtual directory path names
                       const prefix = virtualDirDB.virtualDirUrls.find(function (u){
                           return url.indexOf(u)===0;
                       });
                       
                       if (prefix) {
                               // pull in the list of replacement zips that are layered under this url
                               // (earlier entries replace later entries, so we loop until we get a hit inside the zip file
                                // this also has the effect of precaching the zip file's data for the unzip process
                                
                               return new Promise(function (resolve){
                                   const subpath = url.substr(prefix.length);
                                   const zipurlprefixes = virtualDirDB.virtualDirs[prefix].slice(0);
                                   const locateZipMetadata = function (i) {
                                       
                                       if (i<zipurlprefixes.length) {
                                           
                                           const fixup_url = zipurlprefixes[i]+subpath;
                                           
                                           getEmbeddedZipFileResponse(
                                               
                                               fixup_url,
                                               
                                               {virtual_prefix : prefix},
                                               
                                               function(err,response){
                                                   if (err||!response) return locateZipMetadata(i+1);
                                                   console.log("resolved vitualdir",url,"==>",fixup_url);
                                                   const entry = virtualDirDB.cache[url]={
                                                       fixup_url : fixup_url,
                                                       url: url,
                                                       response: response,
                                                       prefix : prefix
                                                   };
                                                   virtualDirDB.cache[fixup_url]=entry;
                                                   return resolve (entry);
                                               }
                                               
                                           );
                                                  
                                   
                                       } else {
                                           return resolve();
                                       }
                                       
                                   };
                                   
                                   return locateZipMetadata(0);
                               });
                       }
                   }
                   
                   return Promise.resolve();
                }
                
                function virtualDirEventLegacy (event) {
                   const url = event.fixup_url;
                   const previous = virtualDirDB.cache && virtualDirDB.cache[url];
                   if (previous) {
                       event.fixup_url      = previous.fixup_url;
                       event.cache_response = previous.response;
                       event.virtual_prefix = previous.prefix;
                       
                       return;
                   }
                   
                   if (virtualDirDB.virtualDirs && virtualDirDB.virtualDirUrls) {
                       // see if the url starts with one of the virtual directory path names
                       const prefix = virtualDirDB.virtualDirUrls.find(function (u){
                           return url.indexOf(u)===0;
                       });
                       
                       if (prefix) {
    
                           return new Promise(function(resolve,reject){
                               // pull in the list of replacement zips that are layered under this url
                               // (earlier entries replace later entries, so we loop until we get a hit inside the zip file
                                // this also has the effect of precaching the zip file's data for the unzip process
                               const subpath = url.substr(prefix.length);
                               const zipurlprefixes = virtualDirDB.virtualDirs[prefix].slice(0);
                               const locateZipMetadata = function (i) {
                                   
                                   if (i<zipurlprefixes.length) {
                                       const fixup_url = zipurlprefixes[i]+subpath;
                                       getEmbeddedZipFileResponse(fixup_url,{virtual_prefix:event.virtual_prefix},function(err,response){
                                           if (err||!response) return locateZipMetadata(i+1);
                                           console.log("resolved vitualdir",url,"==>",fixup_url);
                                           const entry = virtualDirDB.cache[url]={
                                               fixup_url : fixup_url,
                                               url: url,
                                               response: response,
                                               prefix : prefix
                                           };
                                           virtualDirDB.cache[fixup_url]=entry;
                                           
                                           
                                           event.fixup_url      = fixup_url;
                                           event.cache_response = response;
                                           event.virtual_prefix = prefix;
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
                
                
                function virtualDirEvent (event) {
                    
                   return new Promise(function(resolve){
                       
                       virtualDirQuery (event.fixup_url).then(function(entry){
                           if (entry) {
                               event.fixup_url      = entry.fixup_url;
                               event.cache_response = entry.response;
                               event.virtual_prefix = entry.prefix;
                           }
                           resolve();
                       });
                       
                   });
    
                }
                 function virtualDirResponseEvent (event) {
                   
                   if (event.cache_response) {
                       const response = event.cache_response.clone();
                       delete event.cache_response;
                       return Promise.resolve(response);
                   } else {
                       if (event.fixup_url.endsWith("/virtual.json")) {
                           const json = JSON.stringify(virtualDirDB,undefined,4);
                           return Promise.resolve(new Response(json, {
                             status: 200,
                             headers: new Headers({
                               'Content-Type'   : 'application/json',
                               'Content-Length' : json.length
                             })
                           }));
                       }
                   }
                     
                }

                return lib;
            }            
            
            
        } 
    }, {
        ServiceWorkerGlobalScope: [
            
        ] 
    }

    );


 

});

