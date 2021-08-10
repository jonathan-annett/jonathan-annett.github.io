/* global ml,self,caches, Response,Headers  */
ml(`

htmlFileMetaLib      | ${ml.c.app_root}ml.zipfs.dir.file.meta.js 
    
`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function virtualDirLib(  ) {
            
            const  { 
                fileIsEditable,
                fileIsImage,
                aceModeForFile,
                aceThemeForFile,
                mimeForFilename,
                aceModeHasWorker,
                
                editor_session_ext,
                syntax_json_ext
                
                
            } =  ml.i.htmlFileMetaLib; 

            
            return function  (getEmbeddedZipFileResponse,getZipDirMetaTools,getZipFileUpdates) {

                const virtualDirDB = { };
                
                 const lib = {
                    virtualDirQuery   : virtualDirQuery,
                    virtualDirEvent   : virtualDirEvent,
                    newVirtualDirs    : newVirtualDirs,
                    virtualDirDB      : virtualDirDB,
                    virtualDirListing : virtualDirListing,
                    addSyntaxInfo     : addSyntaxInfo
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
                
                // returns an object repesenting all files in a virtual dir 
                function virtualDirListing (url,databases,cb) {
                    
                    if (virtualDirDB.virtualDirUrls.indexOf(url)>=0) {
                        
                        const dirs  = virtualDirDB.virtualDirs[url];
                        const base  = virtualDirDB.virtualDirZipBase[url];
                        if (dirs&& base) {
                            const zip_root = base.root;
                            const trim = 0 - base.root.length;
                            const dirs_trimmed =  dirs.map(function(u){
                                return u.slice(0,trim);
                            });
                            const zipData = dirs_trimmed.map(function(u){
                                return { 
                                    zip_url            : u
                                };
                            });
                            
                            const url_without_leading_slash = url.replace(/^\//,'');
                            const zip_root_without_slash = zip_root ? zip_root.replace(/\//,'') : '';
                            const virtual_prefix = zip_root &&  url_without_leading_slash.endsWith(zip_root_without_slash) ? 
                                                                url_without_leading_slash.slice(0,0-zip_root_without_slash.length) : 
                                                                url_without_leading_slash;

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
                                     const syntax  = {};
                                     
                                     zipData.forEach(function(data,ix){
                                         data.tools.allFiles(function(files){
                                             files.forEach(function(file){
                                                 if (file.indexOf(zip_root_without_slash)!==0) return;
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
                                                         listing[file]=dirs_trimmed.indexOf(data.zip_url );
                                                     }
                                                 }
                                             });
                                         });
                                     });
                                     
                                     getZipFileUpdates(virtual_prefix+'/',function(err,edited_files){
                                        if (err) return cb(err);
                                        const alias_root = zip_root.replace(/^\//,'')+'/';
                                        
                                        edited_files.forEach(function(file){
                                            if (file.indexOf(zip_root_without_slash)!==0) return;
                                            
                                            file = alias_root+file;
                                            const ix = listing[file];
                                            if (typeof ix==='number') {
                                                if (ix >=0 ) {
                                                    // file is in zip, and has been updated.
                                                    listing[file] = 0 - (2 + ix);
                                                }
                                            } else {
                                                // file not in any zip
                                                listing[file] = -1;
                                            }
                                        });
                                        
                                        
                                        addSyntaxInfo(
                                            
                                            databases.updatedMetadata,{
                                               url        : virtual_prefix+'/',
                                               zips       : dirs_trimmed,
                                               alias_root : zip_root.replace(/^\//,'').replace(/\/$/,'') + '/',
                                               files      : listing,
                                            },
                                            
                                            base.root.length,
                                            
                                            function(dirData){
                                                
                                                cb( undefined,dirData);
                                                
                                            });

                                     });
                                     
                                }
                            };
                            
                            // note - return to avoid the fall through to cb (error)
                            return getNextFileSet(0);
                            
                        }
                        
                    }
                    
                    cb(new Error (url+" is not a valid virtural directory"));
                    
                }
                
                function addSyntaxInfo(db,dirData,trim0,cb) {
                    dirData.syntax = dirData.syntax || {};
                    const syntaxPromises=[];
                    const getSyntax = function(file){
                        syntaxPromises.push( new Promise(function(resolve){
                            db.getItem( dirData.url.replace(/\/$/,'') + "/"+ file.substr(trim0)+"." + syntax_json_ext,function(err,x){
                                if (err||!x) return resolve();
                                const info = JSON.parse(new TextDecoder().decode(x[0].buffer));
                                info.file = file;
                                resolve(info);
                            });
                        }));
                    };
                    Object.keys(dirData.files).forEach(getSyntax);
                    Promise.all(syntaxPromises).then(function(results){
                       results.forEach(function(info){
                           if (info){
                             dirData.syntax[  info.file ] = info;
                             delete info.file;
                           }
                       });
                       syntaxPromises.splice(0,syntaxPromises.length);
                       results.splice(0,results.length);
                       cb(dirData);
                   });
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
                                const entry = {
                                    url         : url,
                                    prefix      : prefix
                                };    
                               return new Promise(function (resolve){
                                   const subpath = url.substr(prefix.length);
                                   if (subpath === "/edit") {
                                      entry.fixup_url = virtualDirDB.virtualDirZipBase[prefix].zip;
                                      return resolve (entry);
                                   }
                                   
                                   if (subpath === "/") {
                                      entry.fixup_url = virtualDirDB.virtualDirZipBase[prefix].zip+'/index.html';
                                      return resolve (entry);
                                   }
                                   
                                   
                                   const zipurlprefixes = virtualDirDB.virtualDirs[prefix].slice(0);
                                   entry.aliased_url     = entry.prefix + 
                                                           virtualDirDB.virtualDirZipBase[prefix].root + 
                                                           url.substr(entry.prefix.length);
                                   const zipFileResponseOpts = { virtual_prefix : entry.prefix };
                                   
                                   const locateZipMetadata = function (i) {
                                       
                                       if (i<zipurlprefixes.length) {
                                           
                                           getEmbeddedZipFileResponse(
                                               zipurlprefixes[i]+subpath,
                                               zipFileResponseOpts,
                                               function (err,response){
                                                   if (err||!response) return locateZipMetadata(i+1);
                                                   //console.log("resolved vitualdir",url,"==>",fixup_url);
                                                   entry.fixup_url = zipurlprefixes[i]+subpath;
                                                   entry.response  = response;
                                                   return resolve (entry);
                                               }
                                           );
                                           
                                       } else {
                                           resolve(entry);
                                           
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
            
            
            
            function lengthyPromiseResolver(resolve,maxMsec) {
                let finalize = resolve;
                let timeout = setTimeout(onTimeout,maxMsec)
                return {
                    resolve : function (x){
                        clearTimeout(timeout);
                        finalize(x);
                    }
                };
                
                function onTimeout () {
                   timeout = setTimeout(onTimeout,maxMsec); 
                   finalize(new Promise(function(res){
                       finalize = res;
                   }));
                }
                
            }
            
            
        } 
    }, {
        ServiceWorkerGlobalScope: [
            
        ] 
    }

    );


 

});

