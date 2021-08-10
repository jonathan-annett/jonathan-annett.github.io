
/* global ml,self,caches, Response  */
ml(`

sha1Lib                                | ${ml.c.app_root}sha1.js
zipFSPaths                             | ${ml.c.app_root}ml.zipfs.paths.js 
zipFSResponseLib                       | ${ml.c.app_root}ml.zipfs.response.js 
    

`,function(){ml(2,

    {
        ServiceWorkerGlobalScope: function zipFSResolveLib(  ) {
            
           
            
            
            return function zipFSResolveLib (
                                            databases,
                                            getZipObject,
                                            getZipDirMetaTools,
                                            resolveZipListing, 
                                            resolveZipListing_HTML,
                                            resolveZipListing_Script
                                            ) {
                       
                       const sha1 = ml.i.sha1Lib.cb;
                       const console_log = ()=>{};
                       const {
                           
                           splitZipPaths,
                           testPathIsZip,
                           testPathIsZipMeta,
                       
                       }   = ml.i.zipFSPaths;
                       
                       const {
                           response304,
                           response200,
                           response500
                       } = ml.i.zipFSResponseLib;
                       
                      
                       const dir_meta_name  = 'dirmeta.hidden-json';
                       const dir_meta_empty = {"deleted":[],"hidden":["^\\.","/\\.hidden\\-json$/"]};
                       const dir_meta_empty_json = JSON.stringify(dir_meta_empty);
                       const dir_meta_empty_resp = {
                           status: 200,
                           headers : {
                               'Content-Type'   : 'application/json',
                               'Content-Length' : dir_meta_empty_json.length,
                           }
                       };
                       
                       
                       const lib = {
                           resolveZip,
                           resolveSubzip,
                           dir_meta_name,
                           dir_meta_empty_json,
                           dir_meta_empty
                       };   
                       
                       
                       
                       return lib;
                       
                       
                       function resolveSubzip(buffer,zip_url,path_in_zip,ifNoneMatch,ifModifiedSince,virtual_prefix) {
                           //ml.c.l({resolveSubzip:{ifNoneMatch,ifModifiedSince,zip_url,path_in_zip,virtual_prefix}});
                           const parts           = splitZipPaths(path_in_zip);//path_in_zip.split('.zip/');     
                           const subzip          = parts.length>1;
                           let   file_path       = parts[0];  //subzip ? parts[0]+'.zip' : parts[0];
                           let   subzip_url      = zip_url + file_path  ;
                           let   subzip_filepath = subzip ? parts.slice(1).join('/') : false;//parts.slice(0,2).join('.zip/') + '.zip' : false,
               
                           return new Promise(function(resolve,reject){     
                               
                               
                               return databases.zipMetadata.getItem(zip_url,function(err,zipFileMeta){
                                  
                                  getZipDirMetaTools(zip_url,undefined,zipFileMeta,function(tools){
                                     
                                      if (tools.isDeleted(file_path)) {
                                           return resolve(new Response('', {
                                              status: 404,
                                              statusText: 'Not found'
                                           }));
                                      }
                                      
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
                                              return resolve(new Response('', {
                                                  status: 404,
                                                  statusText: 'Not found'
                                              }));
                                          }
                                      }
                                      
                                      fileEntry.name = file_path;

                                      if (   !subzip             &&
                                              (
                                                  (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag)) ||
                                                  (ifModifiedSince &&  (safeDate(ifModifiedSince,fileEntry.date) <  fileEntry.date) )
                                              
                                              )
                                          ) {
                                              
                                          return response304 (resolve,fileEntry);
                                          
                                      }
                                      
                                      if (fileEntry.buffer) {
                                          // this is a small file that is stored uncompressed in metadata entry
                                          console_log("resolved",zip_url,path_in_zip,"to inline buffer");
                                          return response200 (resolve,fileEntry.buffer,fileEntry);
                                      }
                                      
                                      
                                      
                                      getZipObject(zip_url,buffer,function(err,zip,zipFileMeta){
                                          if (err)  throw err;
                                          
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
                  
                                             if (  testPathIsZip(path_in_zip)  ) {
                                                 return resolveZipListing (zip_url+"/"+path_in_zip,buffer,virtual_prefix).then(resolve).catch(reject);
                                             }
                                             
                                             
                                             if (  testPathIsZipMeta(path_in_zip)  ) {
                                                 return resolveZipListing_Script (zip_url+"/"+path_in_zip,buffer,virtual_prefix).then(resolve).catch(reject);
                                             }
                                             
                  
                                             if (subzip) {
                                                 return resolveSubzip(buffer,subzip_url ,subzip_filepath,ifNoneMatch,ifModifiedSince,virtual_prefix).then(resolve).catch(reject);
                                             }
                                             
                                             console_log("resolved",zip_url,path_in_zip,"to compressed buffer in zip");
                                             return response200 (resolve,buffer,fileEntry);
                                             
                                             
                                          });

                                      });
                                       
                                     
                                  });
                                     
                               });
                               
                               
                           });
                       }
                       
                       
                       
                       function resolveZip (parts,ifNoneMatch,ifModifiedSince,virtual_prefix) {
                           const zip_url           = parts[0],//parts[0]+'.zip', 
                                 subzip            = parts.length>2; 
                           let   file_path         = parts[1],                                           //subzip ? parts[1]+'.zip' : parts[1],
                                 subzip_url        = subzip ? parts.slice(0,2).join('/')    : false,      //parts.slice(0,2).join('.zip/') + '.zip' : false,
                                 subzip_filepath   = subzip ? parts.slice(2).join('/')     : false;       //parts.slice(2).join('.zip/')     : false
                                 
                           return new Promise(function (resolve,reject){
                               
                                 
                               return databases.zipMetadata.getItem(zip_url,function(err,zipFileMeta){
                                  
                                  getZipDirMetaTools(zip_url,undefined,zipFileMeta,function(tools){
                                      
                                        if (tools.isDeleted(file_path)) {
                                             return resolve(new Response('', {
                                                status: 404,
                                                statusText: 'Not found'
                                             }));
                                        }
                                        
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
                                        
                                        
                                        fileEntry.name = file_path;
                                       
                                        
                                        if (   !subzip             &&
                                                (
                                                    (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag)) ||
                                                    (ifModifiedSince &&  (safeDate(ifModifiedSince,fileEntry.date) <  fileEntry.date) )
                                                )
                                           ) {
                                            return response304 (resolve,fileEntry);
                                        }
                                        
                                        if (fileEntry.buffer) {
                                            // this is a small file that is stored uncompressed in metadata entry
                                            console_log("resolved",zip_url,file_path,"to inline buffer");
                                            return response200 (resolve,fileEntry.buffer,fileEntry);
                                        }
                                        
                                        
                                        getZipObject(zip_url,function(err,zip,zipFileMeta) {
                                            if (err)  throw err;
                                        
                                            const zip_fileobj = zip.file(file_path);
                                            
                                            if (!zip_fileobj) {
                                                if (file_path===dir_meta_name) {
                                                    return resolve(new Response(dir_meta_empty_json,dir_meta_empty_resp));
                                                } else {
                                                    throw new Error ('file not in zip!'); 
                                                }
                                            }
                                            
                                            zip_fileobj.async('arraybuffer').then(function(buffer){
                    
                                                    if (subzip) {
                                                        return resolveSubzip(buffer,subzip_url,subzip_filepath,ifNoneMatch,ifModifiedSince,virtual_prefix).then(resolve).catch(reject);
                                                    }
                                                    
                                                    if ( testPathIsZip(file_path) ) {
                                                        return resolveZipListing (zip_url+"/"+file_path,buffer,virtual_prefix).then(resolve).catch(reject);
                                                    }
                                                    
                                                    if ( testPathIsZipMeta(file_path) ) {
                                                        return resolveZipListing_Script (zip_url+"/"+file_path,buffer,virtual_prefix).then(resolve).catch(reject);
                                                    }
                                                    
                                                    console_log("resolved",zip_url,file_path,"to compressed buffer in zip");
                                                    return response200 (resolve,buffer,fileEntry);
                    
                                             });

                                             
                                        });
                                        
                                  });
                                  
                                  
                               });
                               
                               
                               /*
                               
                               getZipObject(zip_url,function(err,zip,zipFileMeta) {
                                    if (err)  throw err;
                                    
                                    
                                   getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                                       
                                       if (tools.isDeleted(file_path)) {
                                            return resolve(new Response('', {
                                               status: 404,
                                               statusText: 'Not found'
                                            }));
                                       }
                                       
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
                                       
                                       
                                       fileEntry.name = file_path;
                                      
                                       
                                       if (   !subzip             &&
                                               (
                                                   (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag)) ||
                                                   (ifModifiedSince &&  (safeDate(ifModifiedSince,fileEntry.date) <  fileEntry.date) )
                                               )
                                          ) {
                                           return response304 (resolve,fileEntry);
                                       }
                                       
                                       if (fileEntry.buffer) {
                                           // this is a small file that is stored uncompressed in metadata entry
                                           return response200 (resolve,fileEntry.buffer,fileEntry);
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
               
                                               if (subzip) {
                                                   return resolveSubzip(buffer,subzip_url,subzip_filepath,ifNoneMatch,ifModifiedSince,virtual_prefix).then(resolve).catch(reject);
                                               }
                                               
                                               if ( testPathIsZip(file_path) ) {
                                                   return resolveZipListing (zip_url+"/"+file_path,buffer,virtual_prefix).then(resolve).catch(reject);
                                               }
                                               
                                               if ( testPathIsZipMeta(file_path) ) {
                                                   return resolveZipListing_Script (zip_url+"/"+file_path,buffer,virtual_prefix).then(resolve).catch(reject);
                                               }
                                               
                                               return response200 (resolve,buffer,fileEntry);
               
                                        });
                                            
                                        
                                       
                                        
                                   });
                               });
                               
                               
                               */
                               
                           });
                       }
                       

                       function safeDate (d,def) {
                           const dt = new Date(d);
                           if (dt) return dt;
                           return def;
                       }
                       
                     
                   };
               
        } 
    }, {
        ServiceWorkerGlobalScope: [
        ]
        
    }

    );



 

});

