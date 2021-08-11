/* global ml,self,caches, Response,Headers  */
ml(`

htmlFileMetaLib      | ${ml.c.app_root}ml.zipfs.dir.file.meta.js 
zipFSResolveLib      | ${ml.c.app_root}ml.zipfs.resolve.js 
    
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
                syntax_json_ext,
                
                
            } =  ml.i.htmlFileMetaLib; 

            const dir_meta_name  = ml.i.zipFSResolveLib.dir_meta_name;
            
            
            return function  (getEmbeddedZipFileResponse,getZipDirMetaTools,getZipFileUpdates) {

                const virtualDirDB = { };
                
                 const lib = {
                    virtualDirQuery   : virtualDirQuery,
                    newVirtualDirs    : newVirtualDirs,
                    virtualDirDB      : virtualDirDB,
                    virtualDirListing : virtualDirListing,
                    addEditorInfo     : addEditorInfo
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
                
                
                function isolateSingleZipUrls(url,listing) {
                    const url_split = url.split('/');
                    let alias_url   = '';
                    let zip_url     = url;
                    
                    if (url_split.length > 2) {
                        const test = url_split.pop().replace(/\.zip$/,'/');
                        const files = Object.keys(listing);
                        const count = files.reduce(function(n,fn){
                            if (fn===dir_meta_name) return n+1;
                            return fn.indexOf(test)===0?n+1:n;
                        },0);
                        if (count===files.length) {  
                            zip_url = url_split.join('/')+'/';
                            alias_url = test;
                        }
                    }
                    return {
                        alias_url,
                        zip_url
                    };
                }
                
                //
                function singleZipListing (url,databases,cb) {
                    
                    const url_without_leading_slash = url.replace(/^\//,'');
                    const zip_root_without_slash =  '';
                   
                                      
                    const listing = {};   
                   
                    getZipDirMetaTools(url,function(tools,zip,zipFileMeta){
                            tools.allFiles(function(files){
                                
                                files.forEach(function(file){
                                    if (file.indexOf(zip_root_without_slash)!==0) return;
                                    if (!listing[file]) {
                                        // not already listed
                                        
                                        // scan more recent zips for deleted entries, and omit this file if a newer zip
                                        // has deleted this file by placing it's name in the deleted entry in 
                                        // the dirmeta.hidden-json file
                                        
                                        if (    tools.meta &&
                                                tools.meta.deleted && 
                                                !!tools.meta.deleted[file]) {
                                                    return ;
                                                }
                                            listing[file]=0;
                                        }
                                    
                                });
                                
                                
                                getZipFileUpdates('/',function(err,edited_files){
                                   if (err) return cb(err);
                                   
                                   edited_files.forEach(function(file){
                                       if (file.indexOf(zip_root_without_slash)!==0) return;
                                       
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
                                   
                                   const {alias_url , zip_url } = isolateSingleZipUrls(url,listing);

                                   addEditorInfo(
                                       
                                       databases.updatedMetadata,{
                                          url        : zip_url,
                                          zips       : [ url ],
                                          alias_root : alias_url,
                                          files      : listing,
                                       },
                                       
                                       //base.root.length,
                                       
                                       function(dirData){
                                           
                                           cb( undefined,dirData);
                                           
                                       });

                                });
                            });

                    });
                                    
                }                  
                                     
          
                
                // returns an object repesenting all files in a virtual dir 
                function virtualDirListing (url,databases,cb) {
                    
                    if (/\.zip$/.test(url)) {
                        return singleZipListing(url,databases,cb);
                    }
                    
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
                                     const editor  = {};
                                     
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
                                        
                                        
                                        addEditorInfo(
                                            
                                            databases.updatedMetadata,{
                                               url        : virtual_prefix+'/',
                                               zips       : dirs_trimmed,
                                               alias_root : zip_root.replace(/^\//,'').replace(/\/$/,'') + '/',
                                               files      : listing,
                                            },
                                            
                                            //base.root.length,
                                            
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
                
                function addEditorInfo(db,dirData,cb) {
                    
                    const trim0          = dirData.alias_root.length;
                    dirData.editor       = dirData.editor || {};
                    const editorPromises = [];
                    const getSyntax = function(file){
                        editorPromises.push( new Promise(function(resolve){
                            db.getItem( dirData.url.replace(/\/$/,'') + "/"+ file.substr(trim0)+"." + syntax_json_ext,function(err,x){
                                if (err||!x) return resolve();
                                const info = JSON.parse(new TextDecoder().decode(x[0].buffer));
                                info.file = file;
                                resolve(info);
                            });
                        }));
                    };
                    
                    Object.keys(dirData.files).forEach(getSyntax);
                    
                    Promise.all(editorPromises).then(function(results){
                       results.forEach(function(info){
                           if (info){
                             dirData.editor[  info.file ] = info;
                             delete info.file;
                           }
                       });
                       editorPromises.splice(0,editorPromises.length);
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
                                      entry.zip_filter  = virtualDirDB.virtualDirZipBase[prefix].root;
                                      entry.zip_filter = entry.zip_filter.replace(/^\//,'')+'/';
                                      
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
                 

                return lib;
            }            
            

        } 
    }, {
        ServiceWorkerGlobalScope: [
            
        ] 
    }

    );


 

});

