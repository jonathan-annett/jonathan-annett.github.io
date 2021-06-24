/* global ml,self,caches,BroadcastChannel,JSZipUtils,JSZip,dbLocalForage,Response,Headers */
ml(0,ml(1),[
    
    'wTools         | windowTools.js',
    'sha1Lib        | sha1.js',
    'JSZipUtils@ServiceWorkerGlobalScope | https://cdnjs.cloudflare.com/ajax/libs/jszip-utils/0.1.0/jszip-utils.min.js',
    'JSZip@ServiceWorkerGlobalScope | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js',
    'dbLocalForage  | dbengine.localForage.js',

    
    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function main(wTools,sha1) {
            
            const lib = {

            };
            
            
            var [ 
                btnOpen, btnMax, btnMin, btnRestore,
            
                url, title,wleft,wtop,textarea,select] = [
                "#btnOpen", "#btnMax", "#btnMin", "#btnRestore",
                "#url", "#title","#left","#top","textarea","select"
                
            ].map(qs);
            
            btnOpen.onclick = function(){
                wTools.open(url.value,title.value,Number.parseInt(wleft.value)||0,Number.parseInt(wtop.value)||0);
            };
            
            btnMax.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).maximize();
                }
             };
            btnMin.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).minimize();
                }
            };
            btnRestore.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).restore();
                }
            };
            
            
            monitor();
            
            wTools.on("setKey",monitor);
            
            window.addEventListener("storage",monitor);
            
            var lastOpen="";
            
            function monitor(){
                var info={};
                var currentOpen = localStorage.getItem("windowTools.openWindows");
                if (currentOpen!==lastOpen) {
                    lastOpen=currentOpen;
                    if (currentOpen) {
                        const openWindows = JSON.parse(currentOpen);
                        const selected = select.value;
                        select.innerHTML = Object.keys(openWindows).map(function(wid){
                            const meta = openWindows[wid];
                            return '<option '+(selected===wid?'selected ':'')+'href="'+wid+'">'+meta.url+'</option>';
                        }).join("\n");
                    }                    
                    
                }
                Object.keys(localStorage).forEach(function(k){
                    
                    if (k.startsWith("windowTools.")){
                        info[k]=JSON.parse(localStorage.getItem(k));
                    }
                    
                });
                textarea.value = JSON.stringify(info,undefined,4);
            }
            
            // generic tools 
            
            function qs(d,q,f) {
                let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
                if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
                if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
                if (D+Q===O+S){
                   r = d.querySelector(q);
                   if (r&&typeof r+typeof f===O+FN) {
                        if (f.name.length>0) 
                           r.addEventListener(f.name,f);
                        else 
                           f(r);
                    }
                }
                return r;
            }
            
            ml(9,'./wtool.js');
            
            
            
            setTimeout(function(){
                
                sendMessage("ping",{hello:"world",when:new Date(),also:Math.random()},function(err,reply){
                   console.log({err,reply});  
                   
                   
                   sendMessage("unzip",{
                       url:"/zed/pwa/server-startup-main.zip",
                       file:"server-startup-main/package.json"},function(err,reply){
                      console.log({err,reply});  
                   });
                   
                });
                
                
                  
                
                
            },5000);
            
            
            
            function findWorker(cb) {

                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  let noerr;
                
                  if (!registrations.some(function(reg){
                      const worker = reg.controller || reg.active || reg.installing || reg.waiting;
                      if (worker) {
                          cb(noerr,worker);
                          return true;//break some
                      }
                  })){
                     cb(new Error("no worker found"));
                  }
                });
                
            }
             
            
            function sendMessage(cmd,data,cb) {
                const replyName        = "r"+Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-4);
                const sendChannel      = new MessageChannel();
                const replyChannel     = new BroadcastChannel(replyName);
                const timeout = 2000;
                const exitMsg=function(d){
                    let noerr;
                    replyChannel.close();
                    sendChannel.port1.close();
                    sendChannel.port2.close();
                    if (d.error) {
                       cb(d.error); 
                    } else {
                       cb(noerr,d);
                    }
                }
                let tmr = setTimeout(function(){exitMsg({error:"timeout"})},timeout);
                replyChannel.onmessage = function(e) {
                      clearTimeout(tmr);
                      exitMsg(e.data);
                };
                
                findWorker(function(err,worker){
                    if (err) return cb(err);
                    worker.postMessage({m:cmd,r:replyName,data:data},[sendChannel.port2]); 
                });
           }

            return lib;
        },

        ServiceWorkerGlobalScope: function main(wTools,sha1,JSZip) {
            
            
            const dbKeyPrefix       = 'zip-files-cache.';

            const {
                localForageKeyKiller,
                setForageKey,
                getForageKey,
                removeForageKey,
                getForageKeys,
                clearForage
            } = dbLocalForage(dbKeyPrefix);
            
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
                               file.date ? file.date.now().toString(36) : Math.random().toString(36).substr(2)
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
            
            
            function resolveSubzip(resolve,buffer,subzipurl,subpath) {
                     
                const parts      = subpath.split('.zip/');     
                const subzip     = parts.length>1;
                const path       = subzip ? parts[0]+'.zip' : parts[0];
                const subsubpath = subzip ? parts[1]        : false;
                     
                
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
                           return resolveSubzip(resolve,buffer,subzipurl+'/'+path  ,subsubpath);
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
            }
            
            
            function resolveZip (parts,ifnonematch) {
                
                const url       = parts[0]+'.zip', 
                      subzip    = parts.length>2, 
                      path      = subzip ? parts[1]+'.zip' : parts[1],
                      subpath   = subzip ? parts.slice(2).join('.zip/') : false,
                      subzipurl = subzip ? parts.slice(0,1).join('.zip/') + '.zip/' : false;
                      
                return new Promise(function (resolve){
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
            
            
            function resolveZipListing (url) {
                
                return new Promise(function (resolve){
                    
                    getZipObject(url,function(err,zip,zipFileMeta) {
                        
                        if (err || !zip || !zipFileMeta) {
                            return resolve(new Response('', {
                              status: 404,
                              statusText: 'Not found'
                          }));
                        }
                        
                        const uri=url.replace(/^http(s?):\/\//,'/');
                        
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
                                return '<li><a href="'+url+'/'+filename+'">'+ filename +'</li>';
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
            
        
                
                ml.register("activate",function(event){
                    
                    console.log("activate event");
                    
                });
                
                ml.register("messages",{
                    
                    ping:function(msg,cb){ 
                            
                            console.log(msg); 
                            return cb("pong");
                        
                    },
                    
                    unzip:function (msg,cb){
                        
                        
                       function catcher(err) {
                           cb( {error:err.message||err} ); 
                       }
                       
                       
                       function unzipper(response) {
                           
                           
                         if (!response.ok) {
                           return cb ({error:"HTTP error, status = " + response.status});
                         }
                         
                         response.arrayBuffer().then(function(buffer) {
                       
                            JSZip.loadAsync(buffer).then(function (zip) {
                               zip.file(msg.data.file).async("arraybuffer")
                                  .then(function(buffer){
                                      cb({buffer:buffer});
                                  });
                           }).catch(catcher);
                           
                           
                           
                         });
                         
                         
                       }
                      
                       if (msg.data && msg.data.url && msg.data.file) {
                           
                           
                           unzipFile(msg.data.url,msg.data.file,function(err,buffer){
                               
                               if (err) return cb( {error:err.message||err}); 
                               
                               return cb(buffer);
                           });
           
                       } 
                      
                        
                        
                    },
                        
                    
                });
                
                
                ml.register("fetch",fetchZipUrl);
                

        },

    }, {
        Window: [

            () => self.wTools,
            
            () => self.sha1Lib
           
        ],
        ServiceWorkerGlobalScope: [

            () => self.wTools,
            
            () => self.sha1Lib,
            
            () => self.JSZip
            
        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/
 

});

