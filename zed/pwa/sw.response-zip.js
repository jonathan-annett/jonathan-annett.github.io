/* global ml,self, JSZipUtils,JSZip,dbLocalForage,Response,Headers,BroadcastChannel */

ml(0,ml(1),[ 
    
    'sha1Lib       | sha1.js',
    'JSZipUtils    | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
    'JSZip         | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js',
    'dbLocalForage | dbengine.localForage.js',
    'wTools                                     | windowTools.js',
    
    ],function(){ml(2,ml(3),ml(4),

    {   
        Window: function main(wTools) {
        
                const lib = {
        
                };
                
                
                const cmdChannel     = new BroadcastChannel("sw.response.cmds");
                
                cmdChannel.onmessage = function(e) {
                    switch  (e.data.cmd) {
                        
                        case "open" : 
                            const wid = wTools.open(e.data.url,e.data.title||e.data.url,Number.parseInt(e.data.left)||0,Number.parseInt(e.data.top)||0);
                            cmdChannel.postMessage({id:e.data.id,wid:wid});
                            break;
                            
                        case "close" :
                            
                            wTools.open(e.data.wid,function(err,state){
                                cmdChannel.postMessage({id:e.data.id,wid:wid,error:err,state:state});  
                            });
                            
                            break;
                            
                    }
                };
                
                
                
        },
        
        ServiceWorkerGlobalScope: function swResponseZipLib (sha1) {
        
        
        return function (dbKeyPrefix) {
              
             const {
                  
                  localForageKeyKiller,
                  setForageKey,
                  getForageKey,
                  removeForageKey,
                  getForageKeys,
                  clearForage
                  
             } = dbLocalForage(dbKeyPrefix);
             
             const updatedUrlKey  = modifyURLprotocol.bind(this,"update");
             const zipmetadatakey = modifyURLprotocol.bind(this,"meta");
              
             const lib = {
                 fetchZipEvent            : fetchZipEvent,
                 unzipFile                : unzipFile,
                 fetchUpdatableZipURL     : fetchUpdatableZipURL,
                 updateURLContents        : updateURLContents,
                 removeUpdatedURLContents : removeUpdatedURLContents
             };
                              
             const openZipFileCache = { };
             
             var updatedUrls ;
             
             function openUrl(url,cb) {
                 
                 const cmdChannel     = new BroadcastChannel("cmds");
                 const msgId = "r_"+Math.random().toString(36).substr(-8);
                 
                 cmdChannel.onmessage = function (e) {
                     if (e.data.id === msgId) {
                         delete e.data.id;
                         cmdChannel.close();
                         cb(e.data);
                     }
                 };
                 
                 cmdChannel.postMessage({cmd:"open",url:url,id:msgId});

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
                         return getForageKey(zipmetadatakey(url),function(err,zipFileMeta){
                             
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
                 
                 getForageKey(zipbufferkey(url),function(err,buffer){
                     
                     if (err || ! buffer) return download();                    
                     
                     getForageKey(zipmetadatakey(url),function(err,zipFileMeta){
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
                                       
                                       
                               })
                               
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
                               setForageKey(zipbufferkey(url),buffer,function(err){
                                   
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
                     
                       setForageKey(zipmetadatakey(url),zipFileMeta,function(err){
                           
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
                zip.folder("").forEach(function(relativePath, file){
                    if (!file.dir) {
                        
                       if (file.name.indexOf("/")<0) root_files.push(file.name);
                    
                       zipFileMeta.files[file.name]={
                           date:file.date,
                           etag:zipFileMeta.etag+
                                file.date ? file.date.getTime().toString(36) : Math.random().toString(36).substr(2)
                       };
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
                        console.log({alias_root:zipFileMeta.alias_root});
                    }
                } else {
                   root_files.splice(0,root_files.length);
                }
                
                root_dirs.splice(0,root_dirs.length);
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
            
                             setForageKey(zipmetadatakey(url),addFileMetaData(zip,zipFileMeta,url),function(err){
                                 
                                if (err) return cb(err);
            
                                return cb (undefined,zip,zipFileMeta);
                                
                             });
            
                         });
                     }).catch(cb);
            
                 });
                 
             }
             
             function unzipFile(url,path,format,cb/*function(err,buffer){})*/) {
                 
                 if (typeof format==='function') {
                     cb=format;
                     format="arraybuffer";
                 }
                 
                 getZipObject(url,function(err,zip) {
                     if (err) return cb(err);
                     zip.file(path).async(format)
                        .then(function(buffer){
                            cb(undefined,buffer);
                        });
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
                                     (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag))
                                           ||
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
                                    setForageKey(zipmetadatakey(zip_url),zipFileMeta,function(){
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
                            
                            
                            return response200 (resolve,buffer,fileEntry)
                            
                            
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
                                     (ifNoneMatch     &&  (ifNoneMatch     === fileEntry.etag))
                                           ||
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
                                         setForageKey(zipmetadatakey(zip_url),zipFileMeta,function(){
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
                                 
                                 return response200 (resolve,buffer,fileEntry)
                                 
                              });
                                
                     });
                 });
             }
             
             function fileIsEditable (filename) {
                 const p = filename.lastIndexOf('.');
                 return p < 1 ? false:["js","json","css","md","html","htm"].indexOf(filename.substr(p+1))>=0;
             }
             
             function resolveZipListing (url,buffer) {
                 
                 return new Promise(function (resolve){
                     
                     getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                         
                         if (err || !zip || !zipFileMeta) {
                             return resolve(new Response('', {
                               status: 404,
                               statusText: 'Not found'
                           }));
                         }
                         
                         const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                         const uri= urify.exec(url)[2];
                         const uri_split = uri.split('.zip/').map(function (x,i,a){return i===a.length-1?'/'+x:'/'+x+'.zip'});
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
                         
                          if (uri_split.length===1) {
                              const xx = uri_split[0].split("/"),yy=xx.pop();
                              parent_link = xx.join("/")+'/<b>'+yy+'</b>' ;
                          } 
                          parent_link += uri_split.map(function(e,i,a){
                              
                                  if (i===0) return '';
                                  const href = a.slice(0,i).join('');
                                  const prev_href = a.slice(0,i-1).join('');
                                  const disp = href.substr(prev_href.length);
                                  return (i<a.length-1 ?linkit : boldit)(href,disp);
                              }) .join("/");
                              
                              
                          parent_link=parent_link.replace(/\/\//g,'/');
           
                         
                        
                         const html = [ 
                         '<html>',
                         '<head>',
                           '<title>files in '+uri+'</title>',
                           
                           '<script>',
                            fnSrc(
                                
                                function ml(x,L,o,a,d,s){
                                    if (!ml.h){ml.h={};ml.H=[];ml.d={};ml.f={};}//create history db if none exists
                                    let
                                    C=console,//shortcut for console
                                    z,
                                    // "t" contains an array of types - object,function,string,undefined
                                    // used for comparisions later
                                    t=[C,ml,'',z,x].map((G)=>typeof G),
                                    l=location,O=l.origin,
                                    X=t[4]===t[2]?/^[a-zA-Z0-9\-\_\$]*$/.test(x)?'I':'L':x,//X =: L= x is filename, I= x is keyword, otherwise x
                                    // "c" contains initial parameter parser(wraps for argument calls eg ml(1), ml(2), and 
                                    // any constants/worker functions they need. also contains some code used later by z
                                    // note that z doubles as a proxy for "undefined" in the type array "t" above 
                                    c = {// holder for "constants", also a few holds outer scope commands, common functions
                                        //c.r = regex:splits "mod | /url" --> [ "mod | url" ,"mod","", /url"] or null
                                        //c.r = regex:splits "mod@Window | /url" --> [ "mod | url" ,"mod","Window", /url"] or null
                                        r:(u)=>/([A-z0-9\_\$]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(u),
                                        //c.b=document base
                                        b:O+/([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],
                                        c:(u)=>u.startsWith(c.b),
                                        //c.R=shortcut to replace keyword
                                        R:'replace',
                                        f:'forEach',
                                        w:'serviceWorker',
                                        n:'navigator',
                                        d:"document",
                                        //c.B=rebase  paths that start with ./subpath/file.js or subpath/file.js
                                        B:(u,r)=>(r=/^\//)&&/^(http(s?)\:\/\/)/.test(u)?u:r.test(u)?u[c.R](r,O+'/'):c.b+u[c.R](/^(\.\/)/,''),
                                
                                        // ml(1)->c[1] = resolve to self or an empty object - becomes exports section
                                        
                                        1:()=>c[4]()||{},
                                        
                                        
                                        // ml(2)-->c[2](L,o,a,d,e,r) 
                                        
                                        // L = "Window", "ServiceWorkerGlobalScope" (result of ml(1)--> c[1]
                                        // o = exports (ie self ie window)
                                        // a = dictionary of dependants per window type
                                        // d = array of loaded dependants 
                                        // e = unuused argument doubles as a variable
                                        // D = constant
                                        2:(L,o,a,d,e,D)=>{
                                                D="defined";//define a constant
                                                e= a[L] && a[L].name; //evaluate name of import
                                                e=typeof e+typeof o[e]===t[2]+t[3]? (//valdidate nameed import is a function
                                                   c.S(ml.h[ ml.d[e].h ].e,e, //
                                                     c.S(o,e,a[L].apply(this, d[L].map(c.x))) // do the import
                                                    )&&c.l(D+":",e)||c.l(D+" empty:",e) ) : c.l("ready:",e);
                                                  
                                               if (!ml.i){  
                                                   ml.i=new Proxy({},{
                                                       get:(t,p)=>c.I(x=p),
                                                       ownKeys:()=>c.k(ml.d),
                                                       getOwnPropertyDescriptor:(t,p)=>!!ml.d[p]&&c.P(c.I(p)),
                                                       has:(t,p)=>!!ml.d[p]
                                                   });
                                               }
                                            
                                        },
                                        //c.P property descriptor
                                        P:(v)=>1&&{value: v,enumerable: !0,configurable: !0},
                                        //c.S set key value in obj, returning value
                                        S:(o,k,v)=>{Object.defineProperty(o,k,c.P(v));return v;},
                                        // ml(3)->c[1] = resolve to whatever self is (Window,ServiceWorkerGlobalScope or Object if self was not assigned)
                                        3:()=>c[4]().constructor.name || "x",
                                        
                                        // ml(1)->c[1] = resolve to self or undefined
                                        4:()=>typeof self === t[0] && self,
                                        
                                        //c.x = map iterator to execure every function in an array of functions
                                        //      (used to resolve each loaded module)
                                        x:(f)=>f(),
                                        //c.l = console.log shortcut
                                        l:C.log.bind(C),
                                        //c.L = loader hoist function (called when first argument to ml is a string)
                                        L:(S,R,t,w)=>{
                                            // ml("/path/to/mod.js",function(mod){...}) 
                                            //   ==>  x="/path/to/mod.js", L=function(mod){ /* do something with mod*/ }
                                            // ml("/path/to/mod.js",function(mod){...},window,"modName") 
                                            //   ==>  x="/path/to/mod.js", L=function(mod){ /* do something with mod*/ } o=window,a="modName"
                                            R=c.r(x);
                                            w=R?c[4]():!!o;
                                            S=w?o:{};  // S=dummy self, contains "t" temporarily
                                                   // R=holder for S.t between deletion and return
                                            R=R||[x,'t',0,x];// [fullurl,tempname,ignored,url]
                                            t=a||R[1];
                                            return ml(
                                                0,S,[
                                                t+"@T|"+R[3]],
                                                ()=>ml(  2,'T',S,
                                                        {T:L},
                                                        {T:[(x)=>{ R=S[t];
                                                                  if (!w) delete S[t];
                                                                  x=t&&ml.d[t];
                                                                  if(x)ml.h[ x.h ].e[t]=R;
                                                                  return R;
                                                                 }
                                                           ]}),
                                                'T'
                                            );
                                        },
                                        //c.I = import query
                                        I:(M,I)=>(M=ml.d[x])&&(I=ml.h[ M.h ])&&I.e[x],
                                        k:(o)=>Object.keys(o)
                             
                                    };
                                    // here X will be 5 if first arg(x) is a string, ie a file name to be loaded. otherwise X will be x
                                    z=typeof c[X]===t[1]?c[X](L,o,a,d,s):c;// if c[X] resolves to a function, execute it, putting result in z, otherwise set z to c
                                    
                                    if (z!==c)return z;// if z === c it's because c[X] was not a function, so we need to loook further, otherwise exit
                                        
                                    z = {
                                       F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),// F:t[1] = use fetch, F:false,  = don't use fetch
                              
                                       //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
                                       //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
                                       0:()=>z.l(o),
                                       
                                       t:(n)=>Math.min(100,ml.t=(ml.t?ml.t*2:1)),
                                       //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
                                       l:(u)=>{
                                             u = u.map(z.u).filter(z.y);
                                             return u.length?setTimeout(z.l, z.t(u.length), u)&&c.l("pending...",u):a();
                                       },
                                
                                       //z.u = map iterator z.l
                                       u:(x,R,U,N)=>{
                                             R=c.r(x);
                                             if (!R) {
                                                 if (L[x]) return !1;
                                                 
                                                 return x;
                                                 
                                                 //if(ml.d[x]) return !1;
                                                 
                                                 //if(ml.h[x]) return !1;
                                                 
                                                 //return x;
                                             } else {
                                                 // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                                                if ((N=R[2])&&N!==(d||c[3]())) return !1; 
                                             }
                                             N=R[1];
                                             U=c.B(R[3]);
                                             if(c.c(U))ml.d[N]={h:U};
                                             z.T(window,"script",(s)=>{
                                                z.p(U,s.setAttribute.bind(s,"src"),s);    
                                             });
                                             return N;
                                       },
                                       
                                       //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
                                       y:(x)=>!!x,
                                         
                                       //z.s = create and append empty script element
                                       s:(d,S,C)=>{s = z.E(d,S);s.type = "text/java"+S;C(z.A(d,s));},
                                       //z.s = create empty script in it's own empty iframe
                                       S:(w,s,C,D)=>{D=z.f(w[c.d],()=>z.s(D.contentWindow[c.d],s,C));},
                                       T:(w,s,C)=>z.s(w[c.d],s,C),
                                       //z.E = create script element
                                       E:(d,S)=>d.createElement(S),
                                       //z.A = append element x to document d
                                       A:(d,x)=>d.body.appendChild(x),
                                       //z.f = create hidden iframe
                                       f:(d,i,l)=>{ i=z.E(d,"iframe");
                                                  i.style.display="none";
                                                  i.src="ml.html";
                                                  i.onload=l;
                                                  return z.A(d,i);},
                             
                             
                             
                                       //document.getElementById('targetFrame').contentWindow.targetFunction();
                                       
                                     
                             
                                       
                                              
                                       //z.U() = history as an array of urls
                                       
                                       U:()=>c.k(ml.h),
                                       
                                       
                                       //z.p = prefetch script to bust cache, and then load call l() which assigns url to src attribute of script element
                                       p:(u,l,s/*vars->*/,r,L,V,R)=>{//u = url, l() = load script, r=randomId, C= load script with version, R=call V with r
                                           r=z.r();//prepare a random version number (in case we need it)
                                           L=(v)=>l(z.V(u,v));                  // load script with version
                                           V=(v)=>L(z.v(u,v,s));                   // save version v in history, load script with version
                                           R=()=>V(r);                           // save random verison in history, load scipt with random version
                                           return (ml.h[u] ?                     // does url exist in history? 
                                                     !1// V(ml.h[u].v)                  //yes = load script using version from history
                                                    : ml.H.push(u) && ( typeof fetch===z.F ?    // did Gretchen make fetch happen ? 
                                                          fetch(u,{method: 'HEAD'}) // yes= fetch header and 
                                                            .then((h)=>V(z.e(h,r))) // use etag as version, or random if no etag
                                                            .catch(R)                               // if fetch(HEAD) fails,use random version
                                                        : R())                     // Gretchen didn't make fetch happen. so random.
                                                  );
                                       },
                                       //z.e = resolve to etag in r.header or d (default)
                                       e:(r,d)=>r.headers.get("Etag")[c.R](/[\"\/\\\-]*/g,'')||d,
                                       
                                       //z.r() = a random id generator
                                       r:()=>Math.random().toString(36).substr(-8),
                                        
                                       
                                       V:(u,v)=>z.F?u+"?v="+v:u,// if using fetch,  append v=version
                                       v:(u,v,s)=>(ml.h[u]={v:v,s:s,e:{}}),
                                       8:(m,c)=>{
                                           
                                       },
                                       9:(L)=>L&& c.w in self[c.n] && self[c.n][c.w].register('./ml.sw.js?ml=' + encodeURIComponent(L))
                                    };
                                    return z[x]&&z[x](L,o,a,d,s);
                                }
                             
                                
                                
                                ,true),
                           '</script>',
                           
                           
                           
                           '<style>',
                           'a,a:visited,a:link {',
                           '    color:navy;',
                           '    cursor:pointer;',
                           '}',
                           'a span {',
                           '    display:inline-block;',
                           '    cursor:pointer;',
                           '    width:16px;',
                           '    height: 16px;',
                           '    position:relative;',
                           '    top: 4px;',
                           '    left: 6px;',
                           '    margin-left: -6px;',
                           '}',
                     
                           'a span.editinzed {',
                           '    background: url(data:image/png;base64,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TUw6Y29tLmFkb2JlLnhtcAAAAAAAPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iWE1QIENvcmUgNS40LjAiPgogICA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPgogICAgICA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIgogICAgICAgICAgICB4bWxuczp0aWZmPSJodHRwOi8vbnMuYWRvYmUuY29tL3RpZmYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6ZGM9Imh0dHA6Ly9wdXJsLm9yZy9kYy9lbGVtZW50cy8xLjEvIgogICAgICAgICAgICB4bWxuczpleGlmPSJodHRwOi8vbnMuYWRvYmUuY29tL2V4aWYvMS4wLyIKICAgICAgICAgICAgeG1sbnM6eG1wPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvIj4KICAgICAgICAgPHRpZmY6UmVzb2x1dGlvblVuaXQ+MTwvdGlmZjpSZXNvbHV0aW9uVW5pdD4KICAgICAgICAgPHRpZmY6Q29tcHJlc3Npb24+NTwvdGlmZjpDb21wcmVzc2lvbj4KICAgICAgICAgPHRpZmY6WFJlc29sdXRpb24+MzAwPC90aWZmOlhSZXNvbHV0aW9uPgogICAgICAgICA8dGlmZjpPcmllbnRhdGlvbj4xPC90aWZmOk9yaWVudGF0aW9uPgogICAgICAgICA8dGlmZjpZUmVzb2x1dGlvbj4zMDA8L3RpZmY6WVJlc29sdXRpb24+CiAgICAgICAgIDxkYzp0aXRsZT4KICAgICAgICAgICAgPHJkZjpBbHQ+CiAgICAgICAgICAgICAgIDxyZGY6bGkgeG1sOmxhbmc9IngtZGVmYXVsdCI+WmVkPC9yZGY6bGk+CiAgICAgICAgICAgIDwvcmRmOkFsdD4KICAgICAgICAgPC9kYzp0aXRsZT4KICAgICAgICAgPGV4aWY6UGl4ZWxYRGltZW5zaW9uPjg4NjwvZXhpZjpQaXhlbFhEaW1lbnNpb24+CiAgICAgICAgIDxleGlmOkNvbG9yU3BhY2U+MTwvZXhpZjpDb2xvclNwYWNlPgogICAgICAgICA8ZXhpZjpQaXhlbFlEaW1lbnNpb24+ODg2PC9leGlmOlBpeGVsWURpbWVuc2lvbj4KICAgICAgICAgPHhtcDpDcmVhdGVEYXRlPjIwMTMtMTEtMTNUMDg6MjE6NDM8L3htcDpDcmVhdGVEYXRlPgogICAgICAgICA8eG1wOk1vZGlmeURhdGU+MjAxMy0xMS0xM1QwOToxMTowNDwveG1wOk1vZGlmeURhdGU+CiAgICAgICAgIDx4bXA6Q3JlYXRvclRvb2w+UGl4ZWxtYXRvciAzLjA8L3htcDpDcmVhdG9yVG9vbD4KICAgICAgPC9yZGY6RGVzY3JpcHRpb24+CiAgIDwvcmRmOlJERj4KPC94OnhtcG1ldGE+CgYDpzkAAASFSURBVDgRTVRdaFxFFP7mzt17d7NJGknTbNPGJBWKJTaFxuanVRRREW2pNRgCKhStFKwo9qEvBdv4IOibIPggtK8S0bVFgtWHCLEPhsYqITa01KYmm91uNmZ3k+7u/R2/uTHFC+fO3JlzvvOd78wdgc1HKcGpgBChXjJvqKc4eV4o1cON7XARqjwW1Hrwh7TVFe8l69codExJvIqQcSr6jl7nlbH5Ebup+uWs+oGm5ALtLu027Q7tJu1nWtrz5WX/G3yvHnsQv0EIJvTkP1byhno79NTnaBQWSnRdVf5GIvowv9DeCa6UpImkeEWuB8/ikn8iOCq+BkhKKZaoKQ+LQP7pn4AlvxQBA5zQoUOMmYzNOpQgJi2qLBeGKCoPSdOGS2EMNRQcNr/VWFo3NF4vHaiYyUllUx2XLgYsptKKbph20gzJl+kh1wmyGHJJOCIhbdSClUDKQRwRt0ztW36o8RwSsLEKhyTsuOPCdqqwqvdh3S8jvlaEWfoH5sJfqPQcwJ19/TCtAEZV2WGVFBrNZlkJz7K446Lju+sHFeRkbK1kmCu50FxdNmQhC5nPQOTuwircglz8G6gAISNq+/ch99FXyDY+ChQi2gFkTCLw1iFUv3j8iafPyXtz58NbOd2AiLHWTbXwo2UX7pUqmM/kdCHoPvQMtvlFBE3NWHvhLEod/fDjca1GIOsgEy7eNbFW6EFDCmFfJ8UhnsFmMTgmJTLZHAYOHcBnr78Gt+bg008+xsT0dY0NXPkJ2P8G8ORRoO0RhdQu0r/fY8Kq267MGOB7gFdjXSFMacD1fGpUxgfvv4e+vj74vo/WVCuuXr2KRDIJ1+FBcNch8Rs7fxPJ4GHdgG08WaFSnsNBn5eo6TwsEjWngtbtbUilUgiCgEdMoaurC9VKlYVIuK6ru8z8ilwcJBOWHpUphMjW1dVFQZqFDtZjQ0M9pqamMD4+jqGhIXiehwsXLmB0dBR79+7FzMxMVPnAwAAGBge51sN/Uy2L7u7uD2dnZ0cJ6nd2dppJlmPbNkzTZPYQCwsLGGRAtVpFOp1Gb28vpqencezYMQwPD2PPnj1oamoKmpubJZO+I06ePDkYj8cnFxcX5dzcXEjwB/+1phCLxSJ27e3t2L17d6ThmTNnMDIygpaWFl1RwColq1ojkb5ItHw+f5mgR+bn551SqWQXCgVwDdlsFktLS8hkMuAemAynTp3C6dOnoSup1dhEtmbr1q1WsVi8uHPnzjcjQAq+n5u/EDThOPxNAEvr6Hpu1AQ6Y2VlBcvLy+jo6AADIzDDMBwC24zNU6KDra2tt8XY2JikFgHZHCfgRTqBoDwTiDGRoburjWVFphPR9J3p19fXW1pb7r28Y8eOSxMTEybvz+hi1YuKOh5nI76gyHHNivPo+tJgm4+eSynNLVu2gD6rJPBWW1tbWienzwbY/0FZVi+7NUqwFxmkE0bHSAPqzuuHOnsEShP8PMFuPAAjqchDs9Ogunx2bpoxh9mIQ+Vy+TnOe7iX4qjILMP57xx/JNA1rmk5eKEh1Bj6+1/Hdl6rDQRngQAAAABJRU5ErkJggg)',
                           '                left center;',
                           '    background-repeat: no-repeat;',
                           '    background-size: 10px 10px;',
                            '}',
                           
                           'a span.zipfile {',
                           '    background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pg0KPCEtLSBHZW5lcmF0b3I6IEFkb2JlIElsbHVzdHJhdG9yIDE5LjAuMCwgU1ZHIEV4cG9ydCBQbHVnLUluIC4gU1ZHIFZlcnNpb246IDYuMDAgQnVpbGQgMCkgIC0tPg0KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJDYXBhXzEiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgeG1sbnM6eGxpbms9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkveGxpbmsiIHg9IjBweCIgeT0iMHB4Ig0KCSB2aWV3Qm94PSIwIDAgNDggNDgiIHN0eWxlPSJlbmFibGUtYmFja2dyb3VuZDpuZXcgMCAwIDQ4IDQ4OyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8Zz4NCgk8Zz4NCgkJPHBhdGggZD0iTTQ3Ljk4NywyMS45MzhjLTAuMDA2LTAuMDkxLTAuMDIzLTAuMTc4LTAuMDUzLTAuMjY0Yy0wLjAxMS0wLjAzMi0wLjAxOS0wLjA2My0wLjAzMy0wLjA5NA0KCQkJYy0wLjA0OC0wLjEwNC0wLjEwOS0wLjIwMi0wLjE5My0wLjI4NWMtMC4wMDEtMC4wMDEtMC4wMDEtMC4wMDEtMC4wMDEtMC4wMDFMNDIsMTUuNTg2VjEwYzAtMC4wMjItMC4wMTEtMC4wNDEtMC4wMTMtMC4wNjMNCgkJCWMtMC4wMDYtMC4wODgtMC4wMjMtMC4xNzMtMC4wNTEtMC4yNTdjLTAuMDExLTAuMDMyLTAuMDE5LTAuMDYzLTAuMDM0LTAuMDk0Yy0wLjA0OS0wLjEwNi0wLjExLTAuMjA3LTAuMTk2LTAuMjkzbC05LTkNCgkJCWMtMC4wODYtMC4wODYtMC4xODctMC4xNDgtMC4yOTQtMC4xOTZjLTAuMDMtMC4wMTQtMC4wNi0wLjAyMi0wLjA5MS0wLjAzMmMtMC4wODUtMC4wMy0wLjE3Mi0wLjA0Ny0wLjI2My0wLjA1Mg0KCQkJQzMyLjAzOSwwLjAxLDMyLjAyMSwwLDMyLDBIN0M2LjQ0OCwwLDYsMC40NDgsNiwxdjE0LjU4NmwtNS43MDcsNS43MDdjMCwwLTAuMDAxLDAuMDAxLTAuMDAyLDAuMDAyDQoJCQljLTAuMDg0LDAuMDg0LTAuMTQ0LDAuMTgyLTAuMTkyLDAuMjg1Yy0wLjAxNCwwLjAzMS0wLjAyMiwwLjA2Mi0wLjAzMywwLjA5NGMtMC4wMywwLjA4Ni0wLjA0OCwwLjE3My0wLjA1MywwLjI2NA0KCQkJQzAuMDExLDIxLjk2LDAsMjEuOTc4LDAsMjJ2MTljMCwwLjU1MiwwLjQ0OCwxLDEsMWg1djVjMCwwLjU1MiwwLjQ0OCwxLDEsMWgzNGMwLjU1MiwwLDEtMC40NDgsMS0xdi01aDVjMC41NTIsMCwxLTAuNDQ4LDEtMVYyMg0KCQkJQzQ4LDIxLjk3OCw0Ny45ODksMjEuOTYsNDcuOTg3LDIxLjkzOHogTTQ0LjU4NiwyMUg0MnYtMi41ODZMNDQuNTg2LDIxeiBNMzguNTg2LDlIMzNWMy40MTRMMzguNTg2LDl6IE04LDJoMjN2OA0KCQkJYzAsMC41NTIsMC40NDgsMSwxLDFoOHY1djVIOHYtNVYyeiBNNiwxOC40MTRWMjFIMy40MTRMNiwxOC40MTR6IE00MCw0Nkg4di00aDMyVjQ2eiBNNDYsNDBIMlYyM2g1aDM0aDVWNDB6Ii8+DQoJCTxwb2x5Z29uIHBvaW50cz0iMTQuNTgyLDI3Ljc2NiAxOC4zNTYsMjcuNzY2IDE0LjMxLDM2LjMxNyAxNC4zMSwzOCAyMC42LDM4IDIwLjYsMzYuMTY0IDE2LjU3MSwzNi4xNjQgMjAuNiwyNy42MTMgMjAuNiwyNS45NjQgDQoJCQkxNC41ODIsMjUuOTY0IAkJIi8+DQoJCTxyZWN0IHg9IjIyLjQzNiIgeT0iMjUuOTY0IiB3aWR0aD0iMi4wNCIgaGVpZ2h0PSIxMi4wMzYiLz4NCgkJPHBhdGggZD0iTTMyLjU0MiwyNi43MmMtMC4zMjMtMC4yNzctMC42ODgtMC40NzMtMS4wOTctMC41ODZjLTAuNDA4LTAuMTEzLTAuODA1LTAuMTctMS4xOS0wLjE3aC0zLjMzMlYzOGgyLjAwNnYtNC44MjhoMS40MjgNCgkJCWMwLjQxOSwwLDAuODI3LTAuMDc0LDEuMjI0LTAuMjIxYzAuMzk3LTAuMTQ3LDAuNzQ4LTAuMzc0LDEuMDU0LTAuNjhjMC4zMDYtMC4zMDYsMC41NTMtMC42ODgsMC43MzktMS4xNDgNCgkJCWMwLjE4Ny0wLjQ1OSwwLjI4LTAuOTk0LDAuMjgtMS42MDZjMC0wLjY4LTAuMTA1LTEuMjQ3LTAuMzE0LTEuN0MzMy4xMzIsMjcuMzY0LDMyLjg2NiwyNi45OTgsMzIuNTQyLDI2LjcyeiBNMzEuMjU5LDMxLjAwNQ0KCQkJYy0wLjMwNiwwLjMzNC0wLjY5NywwLjUwMS0xLjE3MywwLjUwMUgyOC45M3YtMy44MjVoMS4xNTZjMC40NzYsMCwwLjg2NywwLjE0NywxLjE3MywwLjQ0MmMwLjMwNiwwLjI5NSwwLjQ1OSwwLjc2NSwwLjQ1OSwxLjQxMQ0KCQkJQzMxLjcxOCwzMC4xOCwzMS41NjUsMzAuNjcsMzEuMjU5LDMxLjAwNXoiLz4NCgk8L2c+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8Zz4NCjwvZz4NCjxnPg0KPC9nPg0KPGc+DQo8L2c+DQo8L3N2Zz4NCg==");',
                           '                left center;',
                           '    background-repeat: no-repeat;',
                           '    background-size: 10px 10px;',
                           '}',
                           
                           'a span.normal {',
                           '    background: url("data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iVVRGLTgiPz4NCjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCI+DQo8cGF0aCBkPSJNODMuMDEyLDE3LjVjMC0wLjUyNy0wLjI3MS0wLjk5LTAuNjgyLTEuMjU4TDY2LjQ3NywyLjYzN2MtMC4xNS0wLjEyOS0wLjMyNC0wLjIxMS0wLjUwNS0wLjI3MUM2NS43MDksMi4xNDEsNjUuMzczLDIsNjUsMiBIMTguNUMxNy42NzEsMiwxNywyLjY3MSwxNywzLjV2OTNjMCwwLjgyOCwwLjY3MSwxLjUsMS41LDEuNWg2M2MwLjgyOCwwLDEuNS0wLjY3MiwxLjUtMS41VjE4YzAtMC4wNjctMC4wMTEtMC4xMy0wLjAyLTAuMTk1IEM4My4wMDEsMTcuNzA3LDgzLjAxMiwxNy42MDQsODMuMDEyLDE3LjV6IE0yMCw5NVY1aDQ0djEyLjVjMCwwLjgyOSwwLjY3MiwxLjUsMS41LDEuNUg4MHY3NkgyMHoiLz4NCjxwYXRoIGQ9Ik02OSwzMUgzMWMtMC41NTIsMC0xLTAuNDQ4LTEtMXMwLjQ0OC0xLDEtMWgzOGMwLjU1MywwLDEsMC40NDgsMSwxUzY5LjU1MywzMSw2OSwzMXoiLz4NCjxwYXRoIGQ9Ik02OSw0NUgzMWMtMC41NTIsMC0xLTAuNDQ4LTEtMXMwLjQ0OC0xLDEtMWgzOGMwLjU1MywwLDEsMC40NDgsMSwxUzY5LjU1Myw0NSw2OSw0NXoiLz4NCjxwYXRoIGQ9Ik02OSw1N0gzMWMtMC41NTIsMC0xLTAuNDQ3LTEtMXMwLjQ0OC0xLDEtMWgzOGMwLjU1MywwLDEsMC40NDcsMSwxUzY5LjU1Myw1Nyw2OSw1N3oiLz4NCjxwYXRoIGQ9Ik02OSw3MUgzMWMtMC41NTIsMC0xLTAuNDQ3LTEtMXMwLjQ0OC0xLDEtMWgzOGMwLjU1MywwLDEsMC40NDcsMSwxUzY5LjU1Myw3MSw2OSw3MXoiLz4NCjwvc3ZnPg0K");',
                           '                left center;',
                           '    background-repeat: no-repeat;',
                           '    background-size: 10px 10px;',
                            '}',

                           '</style>',
                         '</head>',
                         '<body>',
                         
                         '<h1>files in '+uri+'</h1>',
                         '<div>',
                         '<ul>'
                         
                         ].concat (
                             
                             Object.keys(zipFileMeta.files).map(function(filename){
                                 const zedBtn =   fileIsEditable(filename)   ? ['<a data-filename="'+filename+'"><span class="editinzed">&nbsp;</span>',  '</a>'] 
                                                : filename.endsWith(".zip")  ? ['<a href="/'+uri+'/'+filename+'"><span class="zipfile">&nbsp;</span>',    '</a>']   
                                                :                              ['<a data-filename="'+filename+'"><span class="normal">&nbsp;</span>',     '</a>'] ;
                                 return '<li>' + parent_link +'/' +linkit("/"+uri+"/"+filename,filename,zedBtn) + '</li>';
                              }),
                             
                         [
                             
                             '</ul>',
                             '</div>',
                             '<script>',
                             'var zip_url_base='+JSON.stringify('/'+uri)+';',
                             fnSrc(injectFN),
                             '</script>',
                             '</body>',
                             '</html>'
                         ]).join('\n');

                         return resolve( 
                             
                             new Response(html, {
                                     status: 200,
                                     statusText: 'Ok',
                                     headers: new Headers({
                                       'Content-Type'   : 'text/html',
                                       'Content-Length' : html.length,
                                       'ETag'           : zipFileMeta.etag,
                                       'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                       'Last-Modified'  : zipFileMeta.date.toString(),
                                  
                                   
                                     })
                                 })
                         );
                         
            
            
                     });
                     
                 });
                 
function injectFN(zip_url_base){
    
    [].forEach.call(document.querySelectorAll("li a span.editinzed"),addEditClick);
    
    [].forEach.call(document.querySelectorAll("li a span.normal"),addViewClick);

    function addEditClick (el) {
        el.addEventListener("click",edBtnClick);
        el.parentElement.addEventListener("click",edBtnClick);
    }
    
    function addViewClick (el) {
        el.addEventListener("click",viewBtnClick);
        el.parentElement.addEventListener("click",viewBtnClick);
    }
    
    function edBtnClick(e){
        e.preventDefault();
        const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
        const filename = '/'+btn.dataset.filename.replace(/^\//,'');
        const file_url = zip_url_base + filename;
        var oReq = new XMLHttpRequest();
        oReq.addEventListener("load", function reqListener () {
            var content = this.responseText;
            editInZed(filename,content,function(detail){
              
                console.log({detail});
                if (!detail.closed && detail.content) {
                    content = detail.content;
                    
                    var update = new XMLHttpRequest();
                    update.open('UPDATE', file_url, true);
                    
                    update.setRequestHeader('Content-type', 'text/plain');
                    
                    update.onreadystatechange = function() {//Call a function when the state changes.
                    }
                    update.onerror = function() {//Call a function when the state changes.
                    }
                    
                    update.send(new Blob([content], {type: 'text/plain'}));
                }
                
            });
        });
        oReq.open("GET", file_url);
        oReq.send();
    }
    
    function editInZed(filename,content,cb) {
        
        
        window.dispatchEvent(
            new CustomEvent( 'editinzed',{ detail: {filename,content} })
        );
        window.addEventListener('editinzed_callback',editInZedCallback);
        
        function editInZedCallback (event){
            
            if (event.detail.filename===filename) {
                
                if (event.detail.closed) {
                    window.removeEventListener('editinzed_callback',editInZedCallback);
                    console.log(filename,"closed");
                    cb(event.detail);
                } else {
                    if (typeof event.detail.content==='string') {
                        if (event.detail.content!==content) {
                             event.detail.previousContent=content;
                             cb(event.detail);
                             content = event.detail.content;
                        }
                    }
                }
            }

        }
        
        
        
    }

    function viewBtnClick(e){
        if (!e.shiftKey) {
            e.preventDefault();
            const btn      = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
            const filename = '/'+btn.dataset.filename.replace(/^\//,'');
            const file_url = zip_url_base + filename;
            
            window.wTools.open(file_url,file_url,0,0);
        }        

    }
    
    function viewInZed(filename,cb) {
        
        
        window.dispatchEvent(
            new CustomEvent( 'viewinzed',{ detail: {filename} })
        );
        window.addEventListener('viewinzed_callback',viewInZedCallback);
        
        function viewInZedCallback (event){
            
            if (event.detail.filename===filename) {
                
                if (event.detail.closed) {
                    window.removeEventListener('viewinzed_callback',viewInZedCallback);
                    console.log(filename,"closed");
                    cb(event.detail);
                }
            }

        }
        
        
        
    }

    function viewInZedCallback () {
        
    }

    ml(0,ml(1),[
        'wTools | /zed/pwa/windowTools.js'
        ],()=>{ml(2,ml(3),ml(4),
            { Window: function () { } }, 
            { Window: [  ] }
        );
    });
    
    

    
}
                 
                
             }
             function fnSrc(f,k) {
                     f = f.toString();
                     return k?f:f.substring(f.indexOf("{")+1,f.lastIndexOf("}")-1);
                 }
             function doFetchZipUrl(request) {
                     
                 const url             = request.url, parts = url.split('.zip/');
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
             
             function fetchZipEvent(event) {
                const promise = doFetchZipUrl(event.request);
                if (promise) {
                    event.respondWith( promise ); 
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
             
             //note - this also lets you proxy any url, not just zip file contents.
             function fetchUpdatableZipURL(event){
                 const 
                 
                 url    =  full_URL(location.origin,event.request.url),
                 method = event.request.method,
                 methodPromiseRecipies = {
                     GET    : toFetchUrl,
                     POST   : toReturnAnError,
                     UPDATE : toUpdateUrl
                 },
                 nextHandlers = {
                     GET    : fetchZipEvent,
                     POST   : internalErrorEvent,
                     UPDATE : updateEvent,
                 },
                 toProcessRequest = methodPromiseRecipies[method];
                 
                 if (!updatedUrls) {
                      // first time, we need to do some async setup...
                      // when this setup is complete, the promise "toProcessRequest" will be fullfilled
                      return getCacheList ();
                 } 

                 if(updatedUrls[url]) {
                     // obviously not the first time, (ie prevous line did not return)
                     // so we can respond with a new promise to process the request
                     
                    return event.respondWith (/* A */ new Promise( toProcessRequest ) );

                 } else {
                     return nextHandlers[method](event) ;
                 }
                 
                 function getCacheList ( ) {
                     // the task of fetching the list happens out of band
                     // so we need to tell the event to wait for it
                     // next time we'll have a cached list to let us syncrononously 
                     // determine if the there is a replacment response for a given url.
                     
                     return event.respondWith (
                         
                         new Promise(function(resolve,reject) {
                             
                             loadUpdatedURLList (function(updatedUrls){
                                 
                                // ok now we have a list for next time, 
                                // let's see if this url is in the list and if so, fetch it
                                // otherwise punt the request via doFetchZipUrl to fetch.
                                // since we are aloread inside a pending promise , we need to manually handle them
                                
                                if(updatedUrls[url]) {
                                    
                                    return toProcessRequest(resolve,reject);
                                    
                                } else {
                                    
                                    const promise = doFetchZipUrl(event.request);
                                    if (promise) return promise.then(resolve).catch(reject);
                                    return fetch(event.request).then(resolve).catch(reject);
                                    
                                }
                            
                             });
                         })
                         
                     );
                 }
                 
                 function updateEvent(event) {
                     return event.respondWith (/* A */ new Promise( toUpdateUrl ) );
                     
                 }
                 
                 function toUpdateUrl (resolve,reject) {
                        
                     event.request.arrayBuffer().then(function(buffer){
                        updateURLContents (url,buffer,function(){
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
                 
                 function toReturnAnError (resolve) {
                     
                     resolve(new Response('', {
                     status: 500,
                     statusText: 'Internal Error. WTF did you do?',
                     headers: new Headers({
                       'Content-Length' : 0
                     })}));
                     
                 }
                 
                 function toFetchUrl (resolve,reject) {
                     
                         
                         getForageKey(updatedUrlKey(url),function(err,args){
                             if (err||!Array.isArray(args)) {
                                 const promise = doFetchZipUrl(event.request);
                                 if (promise) return promise.then(resolve).catch(reject);
                                 return fetch(event.request).then(resolve).catch(reject);
                             } else {
                                 resolve(new Response(args[0],args[1]));
                             }
                         });
                         
                      
                 }
                 
                 
             }
             
             function updateURLContents(url,responseData,responseState,cb) {
                 
                 if (typeof responseState==='function') {
                     cb            = responseState;
                     responseState = undefined;
                 }
                 
                  if (!updatedUrls) {
                     loadUpdatedURLList (saveUrlContents);
                 } else {
                     saveUrlContents();
                 }
                 
                 function saveUrlContents() {
                     
                     url = full_URL(location.origin,url);
                     getPayload(function(payload){
                         setForageKey(updatedUrlKey(url),payload,function(err){
                            if (err) return cb(err);
                            updatedUrls[url]=true;
                            cb();
                         });
                     });

                 }
                 
                 
                 function getPayload (cb) {
                     if (responseState) return cb ([responseData,responseState]);
                     
                     sha1(responseData,function(err,hash){
                         cb([
                             responseData,
                             {
                               'Content-Type'   : mimeForFilename(url),
                               'Content-Length' : responseData.byteLength || responseData.length,
                               'ETag'           : hash,
                               'Cache-Control'  : 'max-age=3600, s-maxage=600',
                               'Last-Modified'  : new Date().toString()
                             }
                         ]);
                     });
                 }
             }
             
             function removeUpdatedURLContents(url,cb) {
                 
                  if (!updatedUrls) {
                     loadUpdatedURLList (removeUrlContents);
                 } else {
                     removeUrlContents();
                 }
                 
                 function removeUrlContents() {
                     url = full_URL(location.origin,url);
                     removeForageKey(updatedUrlKey(url),function(err){
                        if (err) return cb(err);
                        delete updatedUrls[url];
                        cb();
                     });
                 }

             }
             
             function loadUpdatedURLList ( cb ) {
                getForageKeys(function(err,keys){
                   updatedUrls={};
                   keys.filter(function(k){
                       return /^update\:\/\//.test(k);
                   }).forEach(function(k){
                       updatedUrls[k]=true;
                   });
                   cb(updatedUrls);
                });
             }
             
             return lib;
          };

        }

    }, (()=>{  return {
        
        
        Window: [ () => self.wTools ],

        ServiceWorkerGlobalScope: [ () => self.sha1Lib.cb, () => self.wTools   ]
    };
            
      
      
    })()

    );
    

});




