



/* global ml,self, JSZipUtils,JSZip,dbLocalForage,Response,Headers */
ml(0,ml(1),[ 
    
    'sha1Lib                             | sha1.js',
    'JSZipUtils@ServiceWorkerGlobalScope | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
    'JSZip@ServiceWorkerGlobalScope      | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js',
    'dbLocalForage                       | dbengine.localForage.js',

    
    ],function(){ml(2,ml(3),ml(4),

    {   Window: function swResponseZipLib(lib) { return lib ;},
        ServiceWorkerGlobalScope: function swResponseZipLib(lib) { return lib ;}
    }, (()=>{  return {
        Window:                   [ () => rzipLib   ],
        ServiceWorkerGlobalScope: [ () => rzipLib   ]
    };
            
      function rzipLib (dbKeyPrefix) {
          
          
       
         const {
              
              localForageKeyKiller,
              setForageKey,
              getForageKey,
              removeForageKey,
              getForageKeys,
              clearForage
              
         } = dbLocalForage(dbKeyPrefix);
          
         const lib = {
             
             fetchZipUrl : fetchZipUrl,
             
             unzipFile : unzipFile
             
         };
                          
         const openZipFileCache = { };
          
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
         
         function zipmetadatakey(url) {
             return url+"/.meta";
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
                            setMetadataForBuffer(buffer,etag,cb);
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
                   }).catch(cb);
             }
             
             function getBufferFromResponse(response) {
                 
                 
               if (!response.ok) {
                 return cb (new Error("HTTP error, status = " + response.status));
               }
               
               response.arrayBuffer().then(function(buffer) {
                   
                   createETagForResponse(response,buffer,function(err,etag){
                       
                       setMetadataForBuffer(buffer,etag,function(err,buffer,zipFileMeta){
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
        
             function setMetadataForBuffer(buffer,etag,cb/*function(err,buffer,zipFileMeta){}*/) {
                 if (!etag) etag = Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-6);
                 const zipFileMeta = {etag};
                 
                   setForageKey(zipmetadatakey(url),zipFileMeta,function(err){
                       
                         if (err) return cb(err);
                         
                         cb(undefined,buffer,zipFileMeta);
                         
                   });
             }
             
         }
         
         function addFileMetaData(zip,zipFileMeta){
            if (typeof zipFileMeta.files==='object') {
                return zipFileMeta;
            }
            zipFileMeta.files={};
            zip.folder("").forEach(function(relativePath, file){
                if (!file.dir) {
                   zipFileMeta.files[file.name]={
                       date:file.date,
                       etag:zipFileMeta.etag+
                            file.date ? file.date.getTime().toString(36) : Math.random().toString(36).substr(2)
                   };
                }
            });
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
        
                         setForageKey(zipmetadatakey(url),addFileMetaData(zip,zipFileMeta),function(err){
                             
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
         
         function resolveSubzip(buffer,subzipurl,subpath) {
             
             const parts      = subpath.split('.zip/');     
             const subzip     = parts.length>1;
             const path       = subzip ? parts[0]+'.zip' : parts[0];
             const subsubpath = subzip ? parts[1]        : false;
                  
              
             return new Promise(function(resolve,reject){     
                 
                 getZipObject(subzipurl,buffer,function(err,zip,zipFileMeta){
                     if (err)  throw err;
                     
        
                     const fileEntry = zipFileMeta.files[subpath];
                     if (!fileEntry) {
                         new Response('', {
                             status: 404,
                             statusText: 'Not found'
                         });
                     }
                     
                    
                     const update_needed = fileEntry.contentType==='undefined' || typeof fileEntry.contentLength==='undefined';
                               
                     zip.file(path).async('arraybuffer').then(function(buffer){
                        
                        if (subpath.endsWith('.zip')) {
                            return resolveZipListing (subzipurl+"/"+subpath,buffer).then(resolve).catch(reject);
                        }
                        
                        
                        if (update_needed) {
                            // first request for this file, so we need to save 
                            // contentLength and type in buffer
                            // (they are needed for later 304 responses)
                            
                            fileEntry.contentType    = mimeForFilename(path);
                            fileEntry.contentLength  = buffer.byteLength;
                            
                            if (zipFileMeta.updating) {
                                clearTimeout(zipFileMeta.updating);
                            }
                            console.log("updating zip entry",subzipurl,path);
                            
                            zipFileMeta.updating = setTimeout(function(){
                                // in 10 seconds this and any other metadata changes to disk
                                delete zipFileMeta.updating;
                                setForageKey(zipmetadatakey(subzipurl),zipFileMeta,function(){
                                    console.log("updated zip entry",subzipurl);
                                });
                                
                            },10*10000);
                            
                        }
                        
                        if (subzip) {
                            return resolveSubzip(buffer,subzipurl+'/'+path  ,subsubpath).then(resolve).catch(reject);
                        }
                        
                        resolve( new Response(
                                    buffer, {
                                            status: 200,
                                            statusText: 'Ok',
                                            headers: new Headers({
                                              'Content-Type'   : fileEntry.contentType,
                                              'Content-Length' : fileEntry.contentLength,
                                              'ETag'           : fileEntry.etag
                                            })
                                    })
                        );
                        
                     });
                     
                    
                 });
             
             });
         }
         
         function resolveZip (parts,ifnonematch) {
             
             const url       = parts[0]+'.zip', 
                   subzip    = parts.length>2, 
                   path      = subzip ? parts[1]+'.zip' : parts[1],
                   subpath   = subzip ? parts.slice(2).join('.zip/') : false,
                   subzipurl = subzip ? parts.slice(0,1).join('.zip/') + '.zip/' : false;
                   
             return new Promise(function (resolve,reject){
                 getZipObject(url,function(err,zip,zipFileMeta) {
                     
                     if (err)  throw err;
                     
                     const fileEntry = zipFileMeta.files[path];
                     if (!fileEntry) {
                         new Response('', {
                             status: 404,
                             statusText: 'Not found'
                         })
                     }
                     
                    
                     
                     const update_needed = fileEntry.contentType==='undefined' || typeof fileEntry.contentLength==='undefined';
                     
                     
                     if (!update_needed      && 
                         !subzip             &&
                         ifnonematch         && 
                         
                         ifnonematch === fileEntry.etag) {
                         return resolve( 
                             
                             new Response('', {
                                     status: 304,
                                     statusText: 'Not Modifed',
                                     headers: new Headers({
                                       'Content-Type'   : fileEntry.contentType,
                                       'Content-Length' : fileEntry.contentLength,
                                       'ETag'           : fileEntry.etag
                                     })
                                 })
                         );
                     }
                     
                     zip.file(path).async('arraybuffer').then(function(buffer){
                             
                             if (update_needed) {
                                 // first request for this file, so we need to save 
                                 // contentLength and type in buffer
                                 // (they are needed for later 304 responses)
                                 
                                 fileEntry.contentType    = mimeForFilename(path);
                                 fileEntry.contentLength  = buffer.byteLength;
                                 
                                 if (zipFileMeta.updating) {
                                     clearTimeout(zipFileMeta.updating);
                                 }
                                 console.log("updating zip entry",url,path);
                                 
                                 zipFileMeta.updating = setTimeout(function(){
                                     // in 10 seconds this and any other metadata changes to disk
                                     delete zipFileMeta.updating;
                                     setForageKey(zipmetadatakey(url),zipFileMeta,function(){
                                         console.log("updated zip entry",url);
                                     });
                                     
                                 },10*10000);
                                 
                             }
                             
                             if (subzip) {
                                 return resolveSubzip(resolve,buffer,subzipurl,subpath);
                             }
                             
                             if (path.endsWith('.zip')) {
                                 return resolveZipListing (url+"/"+path,buffer).then(resolve).catch(reject);
                             }
                             
                             resolve( new Response(
                                         buffer, {
                                                 status: 200,
                                                 statusText: 'Ok',
                                                 headers: new Headers({
                                                   'Content-Type'   : fileEntry.contentType,
                                                   'Content-Length' : fileEntry.contentLength,
                                                   'ETag'           : fileEntry.etag
                                                 })
                                         })
                             );
                             
                          });
                            
                 });
             });
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
                     
                     const urify = '/'+/^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                     const uri= urify.exec(url)[2];
                     const url_split = url.split('.zip/');
                     const parent_link = url.split('.zip/').map(function(x,i,a){
                            const u = (i===0?urify.exec(url)[x]:x); 
                            if (i==a.length-1) return u;
                            return '<a href="'+a.slice(0,i-1)+'.zip">'+u+'.zip</a>/'
                        }).join('') ;
                     
                    
                     const html = [ 
                     '<html>',
                     '<head>',
                     '<title>files in '+uri+'</title>',
                     '</head>',
                     '<body>',
                     '<h1>files in '+uri+'</h1>',
                     '<div>',
                     '<ul>'
                     
                     ].concat (
                         
                         Object.keys(zipFileMeta.files).map(function(filename){
                             return '<li>'+parent_link+'/<a href="'+url+'/'+filename+'">'+ filename +'</a></li>';
                         }),
                         
                     [
                         
                         '</ul>',
                         '</div>',
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
                                 })
                             })
                     );
                     
        
        
                 });
                 
             });
         }    
         
         function fetchZipUrl(event) {
             
             const url         = event.request.url, parts = url.split('.zip/');
             const ifnonematch = event.request.headers.get('if-none-match');
             
             if (parts.length>1) {
                 // this is a url in the format http://example.com/path/to/zipfile.zip/path/to/file/in/zip.ext
                 
                 event.respondWith( resolveZip (parts,ifnonematch) ); 
                 return true;
             } else {
             
                 if (event.request.url.endsWith('.zip')) {
                     // this is a url pointing to a possibly existing zip file
                     // we don't let you download the zip. we do however give you the file list when you ask for a zip
                     // which provides links to each file inside
                     event.respondWith( resolveZipListing ( url, ifnonematch ) ); 
                     return true;
                 }
             }
             
             return false;
         }
             
         return lib;
      }
      
    })()

    );
    

});






