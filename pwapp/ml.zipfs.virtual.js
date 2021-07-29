/* global ml,self,caches,BroadcastChannel, Response,Headers  */
ml([],function(){ml(2,

    {

        ServiceWorkerGlobalScope: function virtualDirLib(  ) {
            
            
            
            return function  (getEmbeddedZipFileResponse,getZipDirMetaTools,getZipFileUpdates) {

                const virtualDirDB = {
                
                    
                };
                
                 const lib = {
                    virtualDirQuery   : virtualDirQuery,
                    virtualDirEvent   : virtualDirEvent,
                    newVirtualDirs    : newVirtualDirs,
                    virtualDirDB      : virtualDirDB,
                    virtualDirListing : virtualDirListing
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
                
                // returns a stringlist of all files in the zip (includes hidden files, but not deleted files)
                function virtualDirListing (url,cb) {
                    if (virtualDirDB.virtualDirUrls.indexOf(url)>=0) {
                        const dirs  = virtualDirDB.virtualDirs[url];
                        const base = virtualDirDB.virtualDirZipBase[url];
                        if (dirs&& base) {
                            const zip_root = base.root;
                            const trim = 0-base.root.length;
                            const zipData = dirs.map(function(u){
                                return { 
                                    zip_url            : u.slice(0,trim),
                                };
                            });
                            
                            const url_without_slash = url.replace(/\//,'');
                            const zip_root_without_slash = zip_root ? zip_root.replace(/\//,'') : '';
                            const virtual_prefix = zip_root &&  url_without_slash.endsWith(zip_root_without_slash) ? url_without_slash.slice(0,0-zip_root_without_slash.length) : url_without_slash ;
                            
                            
                            //asynchronously open all the zip files in this db
                            const getNextFileSet =  function (index) {
                                if (index<zipData.length) {
                                    const data = zipData[index];
                                    getZipDirMetaTools(data.zip_url,function(tools,zip,zipFileMeta){
                                        data.tools=tools;
                                        data.zip=zip;
                                        data.zipFileMeta=zipFileMeta;
                                        return getNextFileSet(index+1);
                                    });
                                } else {
                                     // merge the individiual file listings 
                                     // giving priority to those more recent zips (more recent zips have lower index) 
                                     // does not include files in older zips that have been deleted in newer zips.
                                     const listing = {};   
                                     zipData.forEach(function(data,ix){
                                         data.tools.allFiles(function(files){
                                             files.forEach(function(file){
                                                 if (!listing[file]) {
                                                     // not already listed
                                                     
                                                     // scan more recent zips for deleted entries, and omit this file if a newer zip
                                                     // has deleted this file by placing it's name in the deleted entry in 
                                                     // the dirmeta.hidden-json file
                                                     
                                                     if (!zipData.some(function(data,i){
                                                         return i <= ix && 
                                                             data.tools && 
                                                             data.tools.meta &&
                                                             data.tools.meta.deleted && 
                                                             !!data.tools.meta.deleted[file];
                                                     })){
                                                        const file_with_leading_slash = '/' + file;
                                                         listing[file]={
                                                          url_write  : virtual_prefix  + (zip_root && file_with_leading_slash.startsWith(zip_root) ? file_with_leading_slash.substr(zip_root.length) : file_with_leading_slash),
                                                          url_read   : data.zip_url    + file_with_leading_slash
                                                        };
                                                        
                                                     }
                                                 }
                                             });
                                         });
                                         
                                         
                                     });
                                     
                                     getZipFileUpdates(virtual_prefix+'/',function(err,edited_files){
                                        if (err) return cb(err);
                                        
                                        edited_files.forEach(function(file){
                                            if (listing[file]) {
                                                listing[file].updated  = true;
                                                listing[file].url_read = virtual_prefix +'/'+ file;
                                            } else {
                                                if (!zipData.some(function(data){
                                                      return data.tools && 
                                                             data.tools.meta &&
                                                             data.tools.meta.deleted && 
                                                             !!data.tools.meta.deleted[file];
                                                })){
                                                  const fn = virtual_prefix + '/'+(zip_root && file.startsWith(zip_root) ? file.substr(zip_root.length) : file);
                                                  listing[file] = {
                                                      url_write: fn,
                                                      url_read : fn,
                                                      updated  : true,
                                                      new_file : true
                                                  };  
                                                }
                                            }
                                        });
                                        
                                        cb( undefined,
                                            {
                                                url        : virtual_prefix+'/',
                                                alias_root : zip_root,
                                                files      : listing
                                            }
                                        );
                                     });
                                     
                                     
                                }
                            };
                            
                            // note - return to avoid the fall through to cb (error)
                            return getNextFileSet(0);
                        }
                    }
                    
                    cb(new Error (url+" is not a valid virtural directory"));
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
                           return resolve(new Response(json, {
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
                                        event.virtual_prefix = entry.prefix;
                                        delete entry.prefix;
                                    }
                                    
                                    delete entry.url;
                               } 
                               
                               resolve();
                           }
                          
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

