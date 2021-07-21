/* global ml,self,caches,BroadcastChannel, Response,Headers  */
ml([],function(){ml(2,

    {

        ServiceWorkerGlobalScope: function virtualDirLib(  ) {
            
            
            
            return function  (getEmbeddedZipFileResponse) {

                const virtualDirDB = {
                
                    
                };
                
                 const lib = {
                    virtualDirQuery,
                    virtualDirEvent,
                    newVirtualDirs,
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
                                virtualDirDB.virtualDirZipBase[prefix]={
                                    zip  : vd.zips[vd.zips.length-1],
                                    root : vd.alias_root
                                };
                             }
                         }
                     });
                     
                    function clearVirtualDirsCache() {
                        
                       

                        if (virtualDirDB.virtualDirZipBase) {
                            Object.keys(virtualDirDB.virtualDirZipBase).forEach(function(prefix){
                                delete virtualDirDB.virtualDirZipBase[prefix].zip;
                                delete virtualDirDB.virtualDirZipBase[prefix].root;
                                delete virtualDirDB.virtualDirZipBase[prefix];
                            });
                            delete virtualDirDB.virtualDirZipBase;
                        }
                    }
                }

                function virtualDirQuery (url) {
                   
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
                                   if (subpath === "/edit") {
                                      const fixup_url = virtualDirDB.virtualDirZipBase[prefix].zip;
                                      const entry = {
                                          fixup_url   : fixup_url,
                                          url         : url,
                                          prefix      : prefix
                                      };
                                      return resolve (entry);
                                   }
                                   const zipurlprefixes = virtualDirDB.virtualDirs[prefix].slice(0);
                                   const locateZipMetadata = function (i) {
                                       
                                       if (i<zipurlprefixes.length) {
                                           
                                           const fixup_url = zipurlprefixes[i]+subpath;
                                           
                                           getEmbeddedZipFileResponse(
                                               
                                               fixup_url,
                                               
                                               {virtual_prefix : prefix},
                                               
                                               function(err,response){
                                                   if (err||!response) return locateZipMetadata(i+1);
                                                   //console.log("resolved vitualdir",url,"==>",fixup_url);
                                                   const zip_root = virtualDirDB.virtualDirZipBase[prefix].root;
                                                   const entry = {
                                                       fixup_url   : fixup_url,
                                                       aliased_url : prefix + zip_root + url.substr(prefix.length),
                                                       url         : url,
                                                       response    : response,
                                                       prefix      : prefix
                                                   };
                                                   return resolve (entry);
                                               }
                                               
                                           );
                                                  
                                   
                                       } else {
                                           const zip_root = virtualDirDB.virtualDirZipBase[prefix].root;
                                           return resolve({aliased_url:prefix + zip_root + url.substr(prefix.length)});
                                       }
                                       
                                   };
                                   
                                   return locateZipMetadata(0);
                               });
                       }
                   }
                   
                   return Promise.resolve();
                }
                 
                function virtualDirEvent (event) {
                    
                   return new Promise(function(resolve){
                       
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
                       
                       virtualDirQuery (event.fixup_url).then(function(entry){
                           
                           if (entry&& entry.response) {
                               
                               const response = entry.response;
                               delete entry.fixup_url;
                               delete entry.response;
                               delete entry.prefix;
                               delete entry.aliased_url;
                               delete entry.url;
                               return resolve(response);
                               
                           } else {
                               if (entry ) {
                                    if (entry.aliased_url) {
                                       event.aliased_url = entry.aliased_url;
                                       delete entry.aliased_url;
                                    }
                                    if (entry.fixup_url) {
                                        event.fixup_url = entry.fixup_url;
                                        delete entry.fixup_url;
                                    }
                                        
                                    if (entry.prefix) {
                                        event.virtual_prefix  = entry.prefix;
                                        
                                        delete entry.prefix;
                                    }
                                    
                                    delete entry.url;
                               }
                           }
                           resolve();
                       });
                       
                   });
    
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

