/* global ml,Response,Headers,crypto  */
/*

   middleware must either:
   
      return a promise that resolves to a response
      
      or
      
      return undefined if it can't handle the request (the default)
      
      or 
      
      return a promise that resolves to undefined, in the event that it's unknown at the point of return 
      if the request can be hanlded
      
      
      it should not reject unless a catastophic error occurs
      
      (ie don't resolve to a 404 error, unless there is absolutely no possibility of another middleware resolving the request)
         
      minify           |   ${ml.c.app_root}uglify-online/uglify/lib/minify.js
Dictionary       |   ${ml.c.app_root}uglify-online/uglify/lib/utils.js
AST_Token        |   ${ml.c.app_root}uglify-online/uglify/lib/ast.js
JS_Parse_Error   |   ${ml.c.app_root}uglify-online/uglify/lib/parse.js
TreeTransformer  |   ${ml.c.app_root}uglify-online/uglify/lib/transform.js
SymbolDef        |   ${ml.c.app_root}uglify-online/uglify/lib/scope.js
OutputStream     |   ${ml.c.app_root}uglify-online/uglify/lib/output.js
Compressor       |   ${ml.c.app_root}uglify-online/uglify/lib/compress.js
mangleStrings    |   ${ml.c.app_root}uglify-online/uglify/lib/propmangle.js


*/

/*jshint -W054 */

ml(`
  

`, function() {
    ml(2,

    {

        ServiceWorkerGlobalScope: function buildRuntime_mware() {
            return getMware();
        }
    }, {
        ServiceWorkerGlobalScope: []
    }

    );
    
function getMware () {

    const trigger_base64_re      = /\/build\/ml\.sw\.runtime\.b64\.js$/;
    const trigger_inflateText_re = /\/build\/ml\.sw\.runtime\.inflate\.js$/;
    const trigger_text_re        = /\/build\/ml\.sw\.runtime\.text\.js$/;
    
    const trigger_jszip_re       = /\/build\/ml\.sw\.runtime\.zip\.html$/;
    const trigger_jszip_min_re   = /\/build\/ml\.sw\.runtime\.zip\.min\.html$/;
    
    const trigger_jszip2_re       = /\/build\/ml\.sw\.runtime\.zip\.js$/;
    const trigger_jszip2_min_re   = /\/build\/ml\.sw\.runtime\.zip\.min\.js$/;
    
    const trigger_jszip2_wrap_re       = /\/build\/ml\.sw\.runtime\.zip\.js\.html$/;
    const trigger_jszip2_wrap_min_re   = /\/build\/ml\.sw\.runtime\.zip\.min\.js\.html$/;
    
    
    const trigger_jszip_boot_re        = /\/build\/ml\.jszip_boot\.html$/;
    const trigger_jszip_boot_min_re    = /\/build\/ml\.jszip_boot\.min\.html$/;
    
    const deflate = ml.i.pako.deflate;
    const JSZip  = ml.i.JSZip;
    const deflateOpts = {  level: 9  };  
    
    const getSourceTemplate = {
        
       deflate_base64 :function(middleware,opts,cb){
           const db = middleware.databases.cachedURLS;
           const fnSrc = middleware.fnSrc;
           const { dir_json,inflate_url } = opts;
           fetchURL(db, inflate_url, middleware, function(err, buffer) {
               return cb([
                '/* global ml,self,Response,Headers,BroadcastChannel  */',
                '/*jshint -W054 */',
                
                '(function(importScripts){',
                     fnSrc(ml, true),
                     fnSrc(startupCode),
                '})((function(inflate,dir){'+fnSrc(runtimeBase64)+'})(',
               '(function(module){',
               '(function(exports){' + new TextDecoder().decode(buffer) + '})(module.exports);',
               'return module.exports.inflate;',
               '})({exports:{}}),'+dir_json+'));'
    
            ].join("\n"));
           },'application/javascript');
       },
       
       clear_text :function(middleware,opts,cb){
           const fnSrc = middleware.fnSrc;
           const { dir_json,inflate_url } = opts;
           return cb([
            '/* global ml,self,Response,Headers,BroadcastChannel  */',
            '/*jshint -W054 */',
            '(function(importScripts){',
                 fnSrc(ml, true),
                 fnSrc(startupCode),
            '})((function(dir){'+fnSrc(runtimeClearText)+'})('+dir_json+'));',

           ].join("\n"),'application/javascript');
       },
       
        zip : function(middleware,opts,cb){
            
            const { dir_json,inflate_url,newZip,trigger_jszip_min } = opts;
            newZip.generateAsync({
                type: "arraybuffer",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                },
                platform : 'UNIX'
            }/*,function updateCallback(metadata) {
                  console.log("progression: " + metadata.percent.toFixed(2) + " %");
                  if(metadata.currentFile) {
                      console.log("current file = " + metadata.currentFile);
                  }
              }*/).then(function (buffer) {
                  
                  
                  const db = middleware.databases.cachedURLS;
                  const js_zip_url = ml.c.app_root+'jszip.min.js';
                  const inflate_url = ml.c.app_root+'pako.inflate.min.js';
                  HTML_Wrap_JSZip(db,middleware,js_zip_url,inflate_url, buffer, trigger_jszip_min, function(err,htmlBuffer){
                      
                    cb(htmlBuffer,'text/html');
                  
                  });
               
                 
                 
            }).catch(cb);
        },
        
        zip_js : function(middleware,opts,cb){
            const { dir_json,inflate_url,newZip,trigger_jszip_min } = opts;
            newZip.generateAsync({
                type: "arraybuffer",
                compression: "DEFLATE",
                compressionOptions: {
                    level: 9
                },
                platform : 'UNIX'
            }/*,function updateCallback(metadata) {
                  console.log("progression: " + metadata.percent.toFixed(2) + " %");
                  if(metadata.currentFile) {
                      console.log("current file = " + metadata.currentFile);
                  }
              }*/).then(function (buffer) {
                  
                  
                  const db = middleware.databases.cachedURLS;
                  const js_zip_url = ml.c.app_root+'jszip.min.js';
                  const inflate_url = ml.c.app_root+'pako.inflate.min.js';
                  JS_Wrap_JSZip(db,middleware,js_zip_url,inflate_url, buffer, trigger_jszip_min, function(err,jsBuffer){
                      
                    cb(jsBuffer,'application/javascript');
                  
                  });
               
                 
                 
            }).catch(cb);
        }
        
    };
    
     
    
      const storeBufferFunc = {
            deflate_base64 : bufferTob64,
            clear_text     : bufferToText,
            zip            : bufferToZip,
            zip_js         : bufferToZip
     };
     
         
     return mware;
     
     function mware(event, middleware) {
          if (trigger_jszip2_wrap_re.test(event.fixup_url) || trigger_jszip2_wrap_min_re.test(event.fixup_url)) {
            return mware_impl1(event, middleware);
          }

          const trigger_jszip_min  = trigger_jszip_min_re.test(event.fixup_url);
          const trigger_jszip2_min = trigger_jszip2_min_re.test(event.fixup_url);
          const default_buildmode  = trigger_base64_re.test(event.fixup_url) ? "deflate_base64" : 
                                     trigger_jszip_re.test(event.fixup_url)||trigger_jszip_min  ? "zip" : 
                                     trigger_jszip2_re.test(event.fixup_url)||trigger_jszip2_min  ? "zip_js" : 
                                     trigger_text_re.test(event.fixup_url)   ? "clear_text" : false;
  
           if (!!default_buildmode) {
              return mware_impl2(event, middleware, default_buildmode, trigger_jszip_min);
           }
           
           const zipboot_min = trigger_jszip_boot_min_re.test(event.fixup_url);
           if (zipboot_min||trigger_jszip_boot_re.test(event.fixup_url)) {
               mware_impl3(event, middleware,zipboot_min);
           }
     }

    function mware_impl1(event, middleware) {
        
        const html = [
                        '<html>',
                        '<head>',
                        '</head>',
                        '<body>',
                        '<script src="'+event.fixup_url.replace(/\.js\.html$/,'.js')+'"></script>',
                        '</body>',
                        '</html>'].join('\n');
                        
        return Promise.resolve(new Response(html, {
            
               status: 200,
               headers: new Headers({
                   'Content-Type': 'text/html',
                   'Content-Length': html.length
               })

           }));

    }
    
   
    function mware_impl2(event, middleware, default_buildmode,trigger_jszip_min ) {

        const newZip = ["zip","zip_js"].indexOf(default_buildmode)>=0 ?  new JSZip() : false;
        
        return new Promise(function(resolve) {
            const result = { };

            ml.H.forEach(function(u) {
                const h = ml.h[u];
                if (h && h.e) {
                    result[u] = {
                        url_read: u,
                        url_write: u
                    };
                }
            });

            const db = middleware.databases.cachedURLS;
            const pako_re = /\/pako\.js$/;
            let inflate_url;
            const getNextFile = function(buildmode,index) {

                if (index < ml.H.length) {

                    const url = ml.H[index];

                    fetchURL(db, url, middleware, function(err, buffer) {

                        if (pako_re.test(url)) {
                            inflate_url = url.replace(pako_re, '/pako.inflate.min.js');
                        }
                        if (err || !buffer) return middleware.response500(resolve, err || new Error("could not fetch " + url));
                        
                        storeBufferFunc[buildmode] ({url,buffer,newZip}, function(data) {
                            result[url] = data;
                            getNextFile(buildmode,index + 1);
                        });

                    });

                } else {

                    const json = JSON.stringify(result, undefined, 4);
                    
                    if (!inflate_url) {
                        console.log("inflate not available, falling back to clear_text build mode");
                        return getNextFile(buildmode,"clear_text",0);
                    }
                    
                    return getSourceTemplate[buildmode](
                        
                        middleware,
                        { json, inflate_url, newZip, trigger_jszip_min },
                        function(source,contentType){
                           resolve(new Response(source, {

                               status: 200,
                               headers: new Headers({
                                   'Content-Type':   contentType,
                                   'Content-Length': source.length || source.byteLength
                               })

                           }));
                        }    
                        
                    );

                  
                }

            };

            getNextFile(default_buildmode,0);
        });
        
    }
    
    function mware_impl3(event, middleware,zipboot_min) {
        return new Promise(function(resolve) {
                  
            const db = middleware.databases.cachedURLS;
            const js_zip_url = ml.c.app_root+'jszip.min.js';
            const inflate_url = ml.c.app_root+'pako.inflate.min.js';
            HTML_Wrap_JSZip(db,middleware,js_zip_url,inflate_url, undefined,zipboot_min, function(err,html){
                if (err || !html) return middleware.response500(resolve, err || new Error("could not fetch " + event.fixup_url));
                resolve(new Response(html, {
                    status: 200,
                    headers: new Headers({
                        'Content-Type': 'text/html',
                        'Content-Length': html.length
                    })
                }));
            });
            
        });
    }
    
    
    function startupCode (self,ml) {
       self.ml = ml;
       ml.register = ml.bind(self, 8);
       ml(9, self);
    }
    
    function runtimeBase64(dir, pako, self, importScripts, inflate) {
        return importScripts_b64.bind(undefined, self);
        
        function inflateModule(url) {
            if (dir[url]){
                const
                bstr = atob(dir[url]),
                len = bstr.length,
                bytes = new Uint8Array(len);
    
                for (let i = 0; i < len; i++) {
                    bytes[i] = bstr.charCodeAt(i);
                }
                return new Function(
                    ['bound_self', 'ml', '__filename', '__dirname'],
                    new TextDecoder().decode(inflate(bytes.buffer))
                );
            } else {
                return function(){};
            }
        }

        function getScript(bound_this, url) {
            return inflateModule(url).bind(bound_this, bound_this, ml, url, url.replace(/\/[a-zA-Z0-9\-\_\.~\!\*\'\(\)\;\:\@\=\+\$\,\[\]]*$/, '/'));
        }

        function importScripts_b64(self, scripts) {
            scripts = typeof scripts === 'string' ? [scripts] : scripts;
            scripts.forEach(function(url) {
                const fn = getScript(self, ml.c.B(url));
                fn();
            });

        }
        
       
        
        
    }

    function runtimeClearText(dir, pako, self, importScripts) {
        return importScripts_clearText.bind(undefined, self);
        function inflateModule(url) {
            if (dir[url]){
                return new Function(
                    ['bound_self', 'ml', '__filename', '__dirname'],
                    dir[url]
                );
            } else {
                return function(){};
            }
        }

        function getScript(bound_this, url) {
            return inflateModule(url).bind(bound_this, bound_this, ml, url, url.replace(/\/[a-zA-Z0-9\-\_\.~\!\*\'\(\)\;\:\@\=\+\$\,\[\]]*$/, '/'));
        }
 
        function importScripts_clearText(self, scripts) {
            scripts = typeof scripts === 'string' ? [scripts] : scripts;
            scripts.forEach(function(url) {
                const fn = getScript(self, ml.c.B(url));
                fn();
            });

        }
        

    }
    
    
    function fetchURL(db, url, middleware, cb) {
           db.getItem(url, function(err, args) {
               if (err || !args) {
   
                   return fetch(url, {
                       mode: 'no-cors'
                   }).then(function(response) {
                       if (!err && response.ok) {
   
                           response.arrayBuffer().then(function(buffer) {
                               middleware.updateURLContents(url, db, buffer, function() {
                                   cb(undefined, buffer);
                               });
                           }).
                           catch (cb);
   
                       } else {
                           cb(err || new Error('could not fetch ' + url));
                       }
                   }).
                   catch (cb);
   
               }
   
               cb(undefined, args[0]);
           });
       }
       
   
    function HTML_Wrap_JSZip(db,middleware,js_zip_url,inflate_url,content_zip, minified, cb)  {

         const  encoder = arrayBufferEncoder( typeof crypto==='object' && crypto, ml.i.pako );
         const  decoder = arrayBufferDecoder( typeof crypto==='object' && crypto, ml.i.pako );
       
         fetchURL(db, inflate_url, middleware, function(err, buffer) {
             if (err) return cb (err);
             
             const inflate_src =new TextDecoder().decode(buffer);

             fetchURL(db, js_zip_url, middleware, function(err, buffer) {
                 if (err) return cb (err);

                 if (content_zip) {
                     
                     encoder.html(undefined,content_zip,function(archive_stream,content_hash,offset,byteLength){
                         archive_stream.offset=0;
                         decoder.html(archive_stream,content_hash,function(err,check,hash){
                             if (err) return cb (err);
                             if (!compareBuffers(check,content_zip)) return cb (new Error("qc check fails - jszip bundling"));
                             
                              archive_stream.offset=offset+byteLength;
                              step2(archive_stream,content_hash);
                         });
                     });
                     
                    
                 } else {
                     step2();
                 }
                 function step2(archive_stream,content_hash){
                     
                    encoder.html(archive_stream,buffer,function(archive_stream,hash,offset,byteLength){
                        
                          archive_stream.offset=0;
                          decoder.html(archive_stream,hash,function(err,check,hash){
                              if (err) return cb (err);
                             
                              if (!compareBuffers(check,buffer)) return cb (new Error("qc check fails - jszip bundling"));
                              
                               const html_stream = decoder.bufferReadWriteStream();
                              
                               html_stream.write.apply(undefined, [
                                  '<html>',
                                  '<head>',
                                   '<style>archive{display:none;}</style>',
                                  '</head>',
                                  '<body>',
                                      
                                    '<script>',
                                          inflate_src,
                                          middleware.fnSrc (arrayBufferDecoder,true),
                                          
                                          minified ? middleware.fnSrc (minifiedOutput).replace (/.*\/\//,'') : middleware.fnSrc (uncompressedOutput)
                                              .replace(/\$\{hash\}/g,hash)
                                              .replace(/\$\{content_hash\}/g,content_hash||''),
                                      '</script>',
                                  '</body>',
                                  '<archive>',
                                  archive_stream,
                                   '</archive>',
                                  '</html>',
                                ]) ;  
                                cb (undefined,html_stream.buffer);
                              
                          });
                          
                        
                     });
                 }
             });
         });
         
     }
     
     function JS_Wrap_JSZip(db,middleware,js_zip_url,inflate_url,content_zip, minified, cb)  {

        const  encoder = arrayBufferEncoder( typeof crypto==='object' && crypto, ml.i.pako );
        const  decoder = arrayBufferDecoder( typeof crypto==='object' && crypto, ml.i.pako );
      
        fetchURL(db, inflate_url, middleware, function(err, buffer) {
            if (err) return cb (err);
            
            const inflate_src =new TextDecoder().decode(buffer);

            fetchURL(db, js_zip_url, middleware, function(err, buffer) {
                if (err) return cb (err);

                if (content_zip) {
                    
                    encoder.js(undefined,content_zip,function(archive_stream,content_hash,offset,byteLength){
                        archive_stream.offset=0;
                        decoder.js(archive_stream,content_hash,function(err,check,hash){
                            if (err) return cb (err);
                            if (!compareBuffers(check,content_zip)) return cb (new Error("qc check fails - jszip bundling"));
                            
                             archive_stream.offset=offset+byteLength;
                             step2(archive_stream,content_hash);
                        });
                    });
                    
                   
                } else {
                    step2();
                }
                function step2(archive_stream,content_hash){
                    
                   encoder.js(archive_stream,buffer,function(archive_stream,hash,offset,byteLength){
                       
                         archive_stream.offset=0;
                         decoder.js(archive_stream,hash,function(err,check,hash){
                             if (err) return cb (err);
                            
                             if (!compareBuffers(check,buffer)) return cb (new Error("qc check fails - jszip bundling"));
                             
                                const js_stream = decoder.bufferReadWriteStream();
                             
                                js_stream.write.apply(undefined, [
                                 '(function(){\n\n',
                                 
                                         inflate_src,
                                         middleware.fnSrc (arrayBufferDecoder,true),
                                         minified ? middleware.fnSrc (minifiedOutput)
                                             .replace(/.*\/\//,'') : middleware.fnSrc (uncompressedOutput)
                                             .replace(/\$\{hash\}/g,hash)
                                             .replace(/\$\{content_hash\}/g,content_hash||''),
                                             
                                             'function getArchive(cb) {\n',
                                             '  return cb(decoder.bufferReadStream(getArchive).buffer);\n',
                                             archive_stream, 
                                             '\n}',
                                 '\n\n})();',
                               ]) ;  
                               
                               cb (undefined,js_stream.buffer);
                             
                         });
                         
                       
                    });
                }
            });
        });
        
    }
 
    
    function arrayBufferDecoder(crypto,pako) {
        
        
        const javascriptCommentData = [ '/*',' */',   '*/', ' *//*',   '/*',   '*/',  16 ];
        const htmlCommentData       = [ '<!--','-->', '--', '--><!--', '<!--', '-->', 16 ];
        
        return {
            javascriptCommentData : javascriptCommentData,
            htmlCommentData       : htmlCommentData,
            html                  : htmlCommentDecode,
            js                    : javascriptCommentDecode,
            bufferToHex           : bufferToHex,
            bufferReadWriteStream : bufferReadWriteStream,
            bufferReadStream      : bufferReadStream,
            arrayBuffer_indexOf   : arrayBuffer_indexOf
        };
        
        function commentDecode(
               stream,
               hash,
               commentStartTag,
               commentEndTag,
               replace_this,
               with_this,
               cb) {
             
             stream.seek(0);
             const outputStream = bufferReadWriteStream();
             if (stream.seek(commentStartTag+hash) < stream.byteLength) {
                 const byteLengths = stream.read();
                 const [licenseLength,compLength,unCompLength] = byteLengths.splice(0,3);
                 const joiner   = new TextEncoder().encode(replace_this).buffer;
                 const joinerSkip = with_this.length;
                 
                 stream.offset += licenseLength;
                 byteLengths.forEach(function(byteLength,ix){
                     if (ix>0) {
                         stream.offset += joinerSkip;
                         outputStream.writeBuffer(joiner);
                     }
                     outputStream.writeBuffer( stream.readBuffer(byteLength) );
                 });
                 try {
                     
                     if (outputStream.byteLength===compLength) {
                         const buffer = pako.inflate(outputStream.buffer);
                         if (buffer.byteLength === unCompLength) {
                             return crypto.subtle.digest("SHA-1", buffer).then(function(digest){
                                 if (bufferToHex(digest)===hash) {
                                     cb (undefined,buffer,hash);
                                 } else {
                                     cb (new Error("integrity check fails"));
                                 }
                             });
                         } else {
                             cb (new Error("uncompresed length incorrect"));
                         }
                     } else {
                         cb (new Error("compressed length incorrect"));
                     }
                  
                 } catch (e) {
                     cb(e);
                 }
             }
        }
        
        function arrayBuffer_indexOf(buffer,str) {
            if (typeof buffer==='string') return buffer.indexOf(str);
            const bufAsArray = new Uint8Array (buffer.buffer||buffer);
            const strArray   = new TextEncoder().encode(str);
            const limit2=strArray.byteLength, limit = (bufAsArray.byteLength-limit2)+1;
            if (limit<0) return -1;
            for (let i = 0;i<limit;i++){
                let j,c = 0;
                for (j=0;j<limit2;j++) {
                    if (bufAsArray[i+j]===strArray[j]) {
                        c++;
                    } else {
                        break;
                    }
                }
                if (c===limit2) {
                    return i;
                }
            }
           return -1; 
        }
        
        function arrayBufferTransfer(oldBuffer, newByteLength) {
            const 
            srcArray  = new Uint8Array(oldBuffer),
            destArray = new Uint8Array(newByteLength),
            copylen = Math.min(srcArray.buffer.byteLength, destArray.buffer.byteLength),
            floatArrayLength   = Math.trunc(copylen / 8),
            floatArraySource   = new Float64Array(srcArray.buffer,0,floatArrayLength),
            floarArrayDest     = new Float64Array(destArray.buffer,0,floatArrayLength);
            
            floarArrayDest.set(floatArraySource);
                
            let bytesCopied = floatArrayLength * 8;
            
        
            // slowpoke copy up to 7 bytes.
            while (bytesCopied < copylen) {
                destArray[bytesCopied]=srcArray[bytesCopied];
                bytesCopied++;
            }
            
          
            return destArray.buffer;
        }
        
        function splitArrayBufferMaxLen (ab,maxLen) {
            if (ab.byteLength<maxLen) return [ab];
            
            const result  = [ ab.slice(0,maxLen)  ];
            let start = maxLen;
            while (start+maxLen <ab.byteLength) {
                result.push( ab.slice(start,start+maxLen));
                start += maxLen;
            }
            result.push( ab.slice(start) );
            return result;
        }
        
        function encodeUint16ArrayToRawString(ui16) {
            const bytesPerChunk = 1024 * 16;
            const bufs = splitArrayBufferMaxLen(ui16,bytesPerChunk);
            const chunks = [];
            while (bufs.length>0) {
                chunks.push(String.fromCharCode.apply(String,new Uint16Array(bufs.shift())));
            }
            const result = chunks.join('');
            chunks.splice(0,chunks.length);
            return result;
        }
        
       
        function bufferReadStream(inp) {
        
            const str = typeof inp==='function' ? inp.toString(): typeof inp==='string' ? inp : false;
            const forBuffer = inp ? new Uint16Array(str.split('').map((x)=>x.charCodeAt(0))).buffer : inp.buffer||inp;
            
            if (!forBuffer|| forBuffer.constructor !== ArrayBuffer) {
               throw new Error ("expecting typed array,ArrayBuffer, function, or string as argument");
            }
        
            const storedLength = forBuffer.byteLength;
            let offset = 0;
            const obj = {};
            Object.defineProperties(obj,{
                readBuffer : {
                    value : function (bytesToRead) {
                        if (bytesToRead === undefined) {
                            bytesToRead = storedLength-offset;
                        } else {
                            if (offset+bytesToRead > storedLength) { 
                                bytesToRead = storedLength - offset;
                            }
                        }
                        if (bytesToRead===0) {
                            return new ArrayBuffer();
                        }
                        const result = forBuffer.slice(offset,offset+bytesToRead);
                        offset += bytesToRead;
                        return result;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                readUtf8String : {
                    value : function (bytesToRead) {
                        const delimiter = bytesToRead;
                        if (typeof delimiter ==='string') {
                            bytesToRead = storedLength - offset;
                            const seekArea = forBuffer.slice(offset,storedLength);
                            let index = arrayBuffer_indexOf(seekArea,delimiter);
                            if (index<0) {
                                // delimiter not found, return from offset to end of stream
                                offset=storedLength;
                                return new TextDecoder().decode(seekArea);
                            }
                            // return delimited area (including delimiter)
                            index  += delimiter.length;
                            // point to next byte after delimter
                            offset += index;
                            return new TextDecoder().decode(seekArea.slice(0,index));
                        } else {
                            // read specified number of bytes and decode via utf8
                            return new TextDecoder().decode(obj.readBuffer(bytesToRead));
                        }
                    },
                    enumerable:true,
                    configurable:true
                },
                
                readUtf16String : {
                    value : function (charsToRead) {
                        const bytesToRead = charsToRead * 2;
                        const u16 = new Uint16Array(obj.readBuffer(bytesToRead));
                        return encodeUint16ArrayToRawString(u16);
                    },
                    enumerable:true,
                    configurable:true
                },
                
                read : {
                    value : function (byteLength,into) {
                        
                        const 
                        
                        key    = byteLength,
                        result = (typeof byteLength==='number') ? obj.readBuffer(byteLength) : JSON.parse(obj.readUtf8String("\n"));
                        
                        if (typeof key+typeof into==='stringobject') {
                            into[key]=result;
                        }
                        
                        return result;
                    }  
                },
         
         
                buffer : {
                    get : function () {
                        return forBuffer;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                utf8String : {
                    get : function () {
                        return new TextDecoder().decode(  obj.buffer );
                    },
                    set : function () {
                    },
                    enumerable:true,
                    configurable:true
                },
                
                utf16String : {
                    get : function () {
                        const utf16Length = Math.trunc(storedLength / 2 ) + (storedLength % 2);
                        const u16 = new Uint16Array(forBuffer,0, (utf16Length*2) <= forBuffer.byteLength ? utf16Length : utf16Length-1);
                        return encodeUint16ArrayToRawString(u16);
                    },
                    set : function () {
                    },
                    enumerable:true,
                    configurable:true
                },
                
                byteLength :  {
                    get : function () {
                        return storedLength;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                seek : {
                    value : function (newOffset,mode) {
                        const delimiter = typeof newOffset+ typeof mode==='stringundefined' ? newOffset : false;
                        if (delimiter) {
                            obj.readUtf8String(delimiter);
                            return offset;
                        } else {
                            if (typeof newOffset !=='number') throw new Error("expecting numeric offset as first argument");
                            switch (mode) {
                                case undefined: {
                                    if (newOffset<0) {
                                       offset =  storedLength + newOffset;
                                    } else {
                                       offset = newOffset;
                                    }
                                     
                                    if ( (offset > storedLength) || (offset < 0)) {
                                        throw new Error ("invalid offset in seek");
                                    }
                                    return offset;
                                }
                                case "fromStart" : {
                                    if (newOffset < 0) throw new Error ("invalid offset in seek");
                                    return obj.seek(newOffset);
                                    
                                }
                                case "fromEnd" : {
                                     if (newOffset < 0) throw new Error ("invalid offset in seek");
                                    return obj.seek(0-newOffset);
                                }
                                case "fromHere":
                                case "relative" : {
                                    const seekTo = offset+newOffset;
                                    if (seekTo < 0) throw new Error ("invalid offset in seek");
                                    return obj.seek(seekTo);
                                }
                            }
                        }
                    },
                    enumerable:true,
                    configurable:true
                },
                
                offset : {
                    get : function () {
                       return offset;   
                    },
                    set : function(value) {
                        obj.seek(value,"fromStart");
                    }
                    
                }
            });
            
            return obj;
        }
        
        function bufferReadWriteStream(forBuffer) {
        
            function arrayBuffer_write_x(intoBuffer, atByteOffset, dataToWrite, modulus,ArrayViewClass) {
                if (!intoBuffer  || intoBuffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as first argument");
                if (atByteOffset % modulus !== 0) throw new Error("Invalid offset: expecting multple of "+modulus+" bytes to match "+ArrayViewClass.name);
                if (!dataToWrite || dataToWrite.constructor !== ArrayViewClass) throw new Error ("expecting data to be "+ArrayViewClass.name);
                
                const targetIndex         = atByteOffset  / modulus;
                const sourceArrayLength   = dataToWrite.length;
                const minimumTargetLength = targetIndex + sourceArrayLength;
                const minumumTargetByteLength = minimumTargetLength * modulus;
                if (intoBuffer.byteLength < minumumTargetByteLength) {
                    throw new Error ("Insufficent space in target ArrayBuffer");
                }
                const targetView = new ArrayViewClass(intoBuffer,atByteOffset,sourceArrayLength);
                targetView.set(dataToWrite);
                console.log("wrote",dataToWrite.length * modulus,"bytes of",ArrayViewClass.name,"into offset",atByteOffset,"of target ArrayBuffer");
            }
            
            const arrayTypes = [Float64Array,Uint32Array,Uint16Array,Uint8Array];
            
            function resolveBuffer(x){ return x && x.buffer && x.buffer.constructor === ArrayBuffer && x.buffer || x;}
            function arrayBuffer_write(intoBuffer, atByteOffset, bufferToWrite, fromByteOffset, bytesToWrite) {
                intoBuffer = resolveBuffer(intoBuffer);
                bufferToWrite = resolveBuffer(bufferToWrite);
                
                
                if (!intoBuffer     || intoBuffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as first argument");
                if (typeof atByteOffset !== 'number') throw new Error ("expecting numeric bytes offset as second argument"); 
                if (!bufferToWrite  || bufferToWrite.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as third argument");
                fromByteOffset = fromByteOffset||0;
                bytesToWrite   = bytesToWrite || (bufferToWrite.byteLength - fromByteOffset);
              
                if (bytesToWrite===0) return;
                
                const spaceAvailable = intoBuffer.byteLength - atByteOffset;
                
                if (bytesToWrite > spaceAvailable) throw new Error ("insufficient space in target arrayBuffer");
                
                if (bytesToWrite < 8) {
                    // don't mess around looking for matching array sizes, this is so small there is nothing to be gained.
                    const arrayToWrite  =  new Uint8Array(bufferToWrite,fromByteOffset,bytesToWrite);
                    return arrayBuffer_write_x(intoBuffer, atByteOffset, arrayToWrite, 1,Uint8Array);
                }
                
                let 
                index = 0,
                modulus = 8;
                
                while (index < 4) {
                    const elementsToWrite = Math.trunc(bytesToWrite / modulus);
                    if (elementsToWrite> 0) {
                        
                        const ArrayClass = arrayTypes[index];
                        if ( atByteOffset   % modulus ===0 && 
                             fromByteOffset % modulus === 0) {
                            
                            
                                if (bytesToWrite % modulus === 0 ) {
                                   const arrayToWrite = new ArrayClass(bufferToWrite,fromByteOffset,elementsToWrite);
                                   return arrayBuffer_write_x(intoBuffer, atByteOffset,arrayToWrite, modulus,ArrayClass);
                                }
                                
                                const canWriteBytes   = elementsToWrite * modulus;
                                
                                const arrayToWrite  =  new ArrayClass(bufferToWrite,fromByteOffset,elementsToWrite);
                                arrayBuffer_write_x(intoBuffer, atByteOffset, arrayToWrite, modulus,ArrayClass);
                            
                               
                                return arrayBuffer_write(
                                     intoBuffer,    atByteOffset + canWriteBytes, 
                                     bufferToWrite, fromByteOffset + canWriteBytes,
                                     bytesToWrite - canWriteBytes
                                ); 
                            
                         
                        }
                    }
                    index ++;
                    modulus = modulus /2 ;
                    // eventually  we will reach Uint8Array, which can deal with any offset criteria.
                }
                
            }
            
            let extended = false;
            let storedLength = 0;
            let offset = 0;
            
            if (forBuffer) {
                storedLength = forBuffer.byteLength;
                offset = storedLength;
            } else {
                extended = true;
                forBuffer = new Uint8Array(128).buffer;
            }
        
            const obj = {};
            Object.defineProperties(obj,{
                
                writeBuffer : {
                    value : function (buffer,bytesToWrite) {
                        if (!buffer  || buffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as first argument");
                        bytesToWrite = bytesToWrite || buffer.byteLength;
                        const minLength = offset + bytesToWrite;
                        if (storedLength < minLength) {
                            storedLength = minLength;
                            if (forBuffer.byteLength < minLength) {
                                extended  = true;
                                forBuffer = arrayBufferTransfer(forBuffer,minLength + Math.trunc(minLength / 2));
                                console.log("extended underlying arraybuffer to",forBuffer.byteLength,"bytes,virtual buffer is now",storedLength,"bytes");
                            }
                        }
                        arrayBuffer_write(forBuffer,offset,buffer,0,bytesToWrite);
                        offset += buffer.byteLength;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                readBuffer : {
                    value : function (bytesToRead) {
                        if (bytesToRead === undefined) {
                            bytesToRead = storedLength-offset;
                        } else {
                            if (offset+bytesToRead > storedLength) { 
                                bytesToRead = storedLength - offset;
                            }
                        }
                        if (bytesToRead===0) {
                            return new ArrayBuffer();
                        }
                        const result = forBuffer.slice(offset,offset+bytesToRead);
                        offset += bytesToRead;
                        return result;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                readUtf8String : {
                    value : function (bytesToRead) {
                        const delimiter = bytesToRead;
                        if (typeof delimiter ==='string') {
                            bytesToRead = storedLength - offset;
                            const seekArea = forBuffer.slice(offset,storedLength);
                            let index = arrayBuffer_indexOf(seekArea,delimiter);
                            if (index<0) {
                                // delimiter not found, return from offset to end of stream
                                offset=storedLength;
                                return new TextDecoder().decode(seekArea);
                            }
                            // return delimited area (including delimiter)
                            index  += delimiter.length;
                            // point to next byte after delimter
                            offset += index;
                            return new TextDecoder().decode(seekArea.slice(0,index));
                        } else {
                            // read specified number of bytes and decode via utf8
                            return new TextDecoder().decode(obj.readBuffer(bytesToRead));
                        }
                    },
                    enumerable:true,
                    configurable:true
                },
                
                readUtf16String : {
                    value : function (charsToRead) {
                        const bytesToRead = charsToRead * 2;
                        const u16 = new Uint16Array(obj.readBuffer(bytesToRead));
                        return encodeUint16ArrayToRawString(u16);
                    },
                    enumerable:true,
                    configurable:true
                },
                
                writeUtf8String : {
                    value : function (str,length) {
                        const buf = new TextEncoder().encode(str.substr(0,length)).buffer;
                        return obj.writeBuffer (buf);
                    },
                    enumerable:true,
                    configurable:true
                },
                
                clear : {
                    value : function () {
                        offset = 0;
                        storedLength = 0;
                        extended = true;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                buffer : {
                    get : function () {
                        return extended ? forBuffer.slice(0,storedLength) : forBuffer.buffer||forBuffer;
                    },
                    set : function (buffer) {
                        if (!buffer  || buffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as argument");
                        forBuffer = buffer;
                        offset    = forBuffer.length;
                        extended  = false;
                        storedLength = offset;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                utf8String : {
                    get : function () {
                        return new TextDecoder().decode(  obj.buffer );
                    },
                    set : function (value) {
                        obj.buffer = new TextEncoder().encode(value).buffer;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                utf16String : {
                    get : function () {
                        const utf16Length = Math.trunc(storedLength / 2 ) + (storedLength % 2);
                        const u16 = new Uint16Array(forBuffer,0, (utf16Length*2) <= forBuffer.byteLength ? utf16Length : utf16Length-1);
                        return encodeUint16ArrayToRawString(u16);
                    },
                    set : function () {
                        throw new Error ("not supported");
                    },
                    enumerable:true,
                    configurable:true
                },
                
                byteLength :  {
                    get : function () {
                        return storedLength;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                seek : {
                    value : function (newOffset,mode) {
                        const delimiter = typeof newOffset+ typeof mode==='stringundefined' ? newOffset : false;
                        if (delimiter) {
                            obj.readUtf8String(delimiter);
                            return offset;
                        } else {
                            if (typeof newOffset !=='number') throw new Error("expecting numeric offset as first argument");
                            switch (mode) {
                                case undefined: {
                                    if (newOffset<0) {
                                       offset =  storedLength + newOffset;
                                    } else {
                                       offset = newOffset;
                                    }
                                    
                                    if (offset < 0) throw new Error ("invalid offset in seek");
                                    if (offset > storedLength) {
                                        if (offset > forBuffer.byteLength) {
                                            extended  = true;
                                            forBuffer = arrayBufferTransfer(forBuffer,offset + Math.trunc(offset / 2));
                                            console.log("extended underlying arraybuffer to",forBuffer.byteLength,"bytes,virtual buffer is now",offset,"bytes");
            
                                        }
                                        storedLength = offset;
                                    }
                                    return offset;
                                }
                                case "fromStart" : {
                                    if (newOffset < 0) throw new Error ("invalid offset in seek");
                                    return obj.seek(newOffset);
                                    
                                }
                                case "fromEnd" : {
                                     if (newOffset < 0) throw new Error ("invalid offset in seek");
                                    return obj.seek(0-newOffset);
                                }
                                case "fromHere":
                                case "relative" : {
                                    const seekTo = offset+newOffset;
                                    if (seekTo < 0) throw new Error ("invalid offset in seek");
                                    return obj.seek(seekTo);
                                }
                            }
                        }
                    },
                    enumerable:true,
                    configurable:true
                },
                
                offset : {
                    get : function () {
                       return offset;   
                    },
                    set : function(value) {
                        obj.seek(value,"fromStart");
                    }
                    
                },
                
                truncate : {
                    value : function () {
                        storedLength = offset;
                    },
                    enumerable:true,
                    configurable:true
                },
                
                write : {
                    
                    value : function () {
                        [].slice.call(arguments).forEach(function(x){
                            if (typeof x==='object'&& x.constructor === ArrayBuffer ) {
                                obj.writeBuffer(x);
                            } else {
                                 if (typeof x==='object'&& x.buffer && x.buffer.constructor === ArrayBuffer ) {
                                     obj.writeBuffer(x.buffer);
                                 } else {
                                     if (typeof x==='string') {
                                          obj.writeUtf8String(x);
                                     } else {
                                         if (typeof x==='number'||(typeof x==='object'&&([Object,String,Date,Array].indexOf(x.constructor)>=0))) {
                                             obj.writeUtf8String(JSON.stringify(x)+"\n");
                                         }
                                     }
                                 }
                             }
                            
                        });
                    }
                },
                
                
                read : {
                    value : function (byteLength,into) {
                        
                        const 
                        
                        key    = byteLength,
                        result = (typeof byteLength==='number') ? obj.readBuffer(byteLength) : JSON.parse(obj.readUtf8String("\n"));
                        
                        if (typeof key+typeof into==='stringobject') {
                            into[key]=result;
                        }
                        
                        return result;
                    }  
                },
         
                
            });
            
            return obj;
        }
        
        function bufferToHex(buffer) {
            const padding = '00000000';
            const hexCodes = [];
            const view = new DataView(buffer);
            if (view.byteLength===0) return '';
        
            for (let i = 0; i < view.byteLength; i += 4) {
                // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
                const value = view.getUint32(i);
                // toString(16) will give the hex representation of the number without padding
                const stringValue = value.toString(16);
                // We use concatenation and slice for padding
                const paddedValue = (padding + stringValue).slice(-padding.length);
                hexCodes.push(
                    paddedValue.substr(6,2)+
                    paddedValue.substr(4,2)+
                    paddedValue.substr(2,2)+
                    paddedValue.substr(0,2)
               );
            }
            // Join all the hex strings into one
            return hexCodes.join("");
        }
        
        function javascriptCommentDecode(stream,hash,cb) {
            const args =  [stream,hash].concat(javascriptCommentData.slice(0,5));
            args[6]=cb;
            return commentDecode.apply(undefined,args);
            //commentDecode(stream,hash,'/* \n',' */\n',  '*/',' */\n/*', cb);
        }
        
        function htmlCommentDecode(stream,hash,cb) {
            const args =  [stream,hash].concat(htmlCommentData.slice(0,5));
            args[6]=cb;
            return commentDecode.apply(undefined,args);
        }
    
    }
    
    function arrayBufferEncoder(crypto,pako) {
        
        const {
                  javascriptCommentData, 
                  htmlCommentData,       
                  bufferToHex,           
                  bufferReadWriteStream, 
                  bufferReadStream,
                  arrayBuffer_indexOf,   
        } = arrayBufferDecoder();
        
            
        return {
            html                  : htmlCommentEncode,
            js                    : javascriptCommentEncode
        };
        
        function commentEncode (
            stream,
            buffer,
            commentStartTag,
            commentEndTag,
            replace_this,
            with_this,
            licenceStart,
            licenseEnd,
            licenceStartLimit,
            cb) {
                
                
            let licenceText = '';
            
            if (licenceStart && licenseEnd) {
                const ix = arrayBuffer_indexOf(buffer,licenceStart);
                const ix_lic_start = ix +  licenceStart.length;
                if (ix >= 0 && (licenceStartLimit===false || (ix_lic_start < licenceStartLimit))) {
                    const ix_lic_end = arrayBuffer_indexOf(buffer,licenseEnd);
                    if (ix_lic_end >= ix_lic_start) {
                       licenceText =  arrayBuffer_substring(ix_lic_start,ix_lic_end);
                    }
                }
            }
            
            stream = stream || bufferReadWriteStream();
            
            crypto.subtle.digest("SHA-1", buffer).then(function(digest){
                
                const deflated = pako.deflate(buffer,{level:9});
                
                const parts = arrayBuffer_split(deflated,replace_this);
                
                const offset = stream.offset;
                const joiner   = new TextEncoder().encode(with_this).buffer;
                const hash =  bufferToHex(digest);
                
                stream.writeUtf8String(commentStartTag);
                stream.write(
                    hash,[
                    licenceText.length,
                    deflated.buffer.byteLength,
                    buffer.byteLength].concat(parts.map(function(x){return x.byteLength;})));
                
                
                    
                stream.writeUtf8String(licenceText);
        
                
                parts.forEach(function(part,ix) {
                    if (ix>0) {
                        stream.writeBuffer(joiner);  
                    }
                    stream.writeBuffer(part.buffer||part);
                });
                
                stream.writeUtf8String(commentEndTag);
              
                const byteLength = stream.offset - offset;
                cb (stream,hash,offset,byteLength);
                
                
            });
            
        }
        
        function arrayBuffer_split(buffer,str) {
            let nextIndex = arrayBuffer_indexOf(buffer,str);
            if (nextIndex<0) return [ buffer ];
            
            const result = [ buffer.slice (0,nextIndex) ]  ;
            buffer = buffer.slice (nextIndex+str.length);
            
            nextIndex = arrayBuffer_indexOf(buffer,str);
            while (nextIndex >=0) {
                result.push (buffer.slice (0,nextIndex));
                buffer = buffer.slice (nextIndex+str.length);
                nextIndex = arrayBuffer_indexOf(buffer,str);
            }
            
            result.push(buffer);
            return result;
        }
        
        
        function arrayBuffer_substring(buffer,start,end) {
            if (typeof buffer==='string') return buffer.substring(start,end);
            const bufAsArray = new Uint8Array (buffer.buffer||buffer);
            return new TextDecoder().decode(bufAsArray.slice(start,end));
        }
        
    
        
    
        function javascriptCommentEncode(stream,buffer,cb) {
            return commentEncode.apply(undefined,[stream,buffer].concat(javascriptCommentData).concat([cb]));
        }
        
        function htmlCommentEncode(stream,buffer,cb) {
            return commentEncode.apply(undefined,[stream,buffer].concat(htmlCommentData).concat([cb]));
        }
        
        
    
    }
    
    
    function compareBuffers(buf,buf2) {
        const len = buf.byteLength;
        if (len===buf2.byteLength) {
            if (len > 0) {
                const u81 = new Uint8Array(buf),u82 = new Uint8Array(buf2);
                
                for (let i=0;i<len;i++) {
                    if (u81[i]!==u82[i]) {
                        return false;
                    }
                }
                
            }  
            return true;
        }
        return false;
    }
    
                
   function uncompressedOutput(crypto,pako){
        (function(){
            
       const decoder = arrayBufferDecoder(typeof crypto==='object'&&crypto,pako) ;
       
       const directory = {
           pako:pako
       };
       const fake_internet = {
           
       };
       
       loadScript("${hash}",function(exports){
           
           console.log({exports,directory});
           window.directory=directory;
           mountZip(function(err){
               if (err) return;
               
               
                
               window.loadZipScript= function(url,cb) {
                   
                   window.loadZipText(function(err,text){ 
                       if (err) return cb (err);
                        loadScript_imp(text,cb);
                   });
               };
               
               window.loadZipText= function(url,cb) {
                   window.loadZipBuffer(function(err,buffer){
                       if (err) return cb (err);
                       cb(undefined,new TextEncoder().encode(buffer));
                   });
               };
               
               window.loadZipBuffer= function(url,cb) {
                   if ( url in fake_internet) {
                      fake_internet[url](function(buffer){ cb (undefined,buffer);});
                   } else {
                      return cb(new Error("not found"));
                   }
               };
               
               // fetch every url and return it as an map
               // also after calling this, every request will happen synchronously
               window.prepareZipSync = function ( urls ,cb ){
                   if (urls === undefined) {
                       return window.prepareZipSync(Object.keys(fake_internet),cb);
                   } else {
                       Promise.all(urls.map(function(url){
                           return new Promise(function (resolve){
                               fake_internet[url](resolve);
                           });
                       })).then(function (buffers) {
                           const dir = {};
                           urls.forEach(function(url,ix){
                              dir[url]=buffers[ix];
                           });
                           cb (dir); 
                       });
                   }
               };
           });
           
       });
       
       function loadScript_imp(source,key,cb) {
           if (loadScript_imp.cache) {
              if (loadScript_imp.cache[key]) {
                  return;
              }
           } else {
               loadScript_imp.cache={};
           }
           
           const initialKeys=Object.keys(window);
           const exports={};
           
            compile_viascript_base64([],source,[],function(){
                  loadScript_imp.cache[key]=true;
                  fetchUpdatedKeys();
                  cb(exports,directory);
            });
           
               function fetchUpdatedKeys() {
                   const newKeys = Object.keys(window);
                   initialKeys.forEach(function(el) {
                      const ix = newKeys.indexOf(el);
                      if (ix>=0) newKeys.splice(ix,1);
                   });
                   initialKeys.push.apply(initialKeys,newKeys);
                   newKeys.forEach(function(key){
                       exports[key]=window[key];
                       directory[key]=window[key];
                   });
               }
           
       }
       
       function loadScript(hash,cb) {
           if (loadScript_imp.cache) {
              if (loadScript_imp.cache[hash]) {
                  return;
              }
           }
           getArchive(function(htmlBuffer){
               const stream = decoder.bufferReadWriteStream(htmlBuffer);
               stream.seek(0);
               decoder.html(stream,hash,function(err,source){
                    if (err) return ;//cb (err);
                              
                    if (source) {
                        loadScript_imp(new TextDecoder().decode(source),hash,function(exports,directory){
                            removeScriptCommentNodes(hash);
                            cb(exports,directory);
                        });
                        
                    }
               });
           });
       }
        
       function mountZip(cb) {
          const hash = "${content_hash}";
          if (hash==='') return ;
          getArchive(function(htmlBuffer){
              const stream = decoder.bufferReadWriteStream(htmlBuffer);
              stream.seek(0);
              decoder.html(stream,hash,function(err,zipBuffer){
                   if (zipBuffer) {

                       
                       JSZip.loadAsync(zipBuffer).then(function (zip) {
                           
                           zip.folder("").forEach(function(relativePath, file){
                               if (!file.dir) {
                                
                                  
                               
                                  if (file.name.charAt(0)!=='.') {
                                      const url = "https://"+file.name; 
                                      let data;
                                     Object.defineProperty(
                                      fake_internet,
                                      url , {
                                          get : function(){return function (cb){
                                              delete fake_internet[url];
                                              fake_internet[url] = function (cb) {
                                                  if (data) {
                                                      return cb(data.slice());
                                                  }
                                                  // the following (kluge) is to deal with
                                                  // the improbable, but possible situation where the same
                                                  // url is requested twice and the second request occurs before the zip
                                                  // has extracted the contentd - wait up to 1 second for the zip to finish
                                                  let remain = 10;
                                                  const id = setInterval(function(){
                                                      if (data) {
                                                          clearInterval(id);
                                                          cb(data.slice());
                                                      }
                                                      if (--remain<0) {
                                                          clearInterval(id);
                                                          cb ();
                                                      }
                                                  },100);
                                              };
                                              zip.file(file.name).async('arraybuffer').then(function(buffer){
                                                 data=buffer; 
                                                 cb(data.slice());
                                              });
                                          };},
                                          enumerable   : true,
                                          configurable : true
                                      });
                                         
                                      
                                      
                                  }
                              
                                  
                               }
                           });
                           
                           cb();
                          
                       
                       }).catch(cb);
                       
                   }
              });
          });
          
       }
       
       function getArchive(cb){
           if (getArchive.cache)return cb(getArchive.cache);
           var xhr = new XMLHttpRequest();
           xhr.responseType = 'arraybuffer';
           xhr.open('GET', document.baseURI, true);
           xhr.onreadystatechange = function () {
               if (xhr.readyState === 4) {
                   cb((getArchive.cache = xhr.response));
               }
           };
           xhr.send(null);
        
       }
       
       function compile_viascript_base64(args,src,arg_values,cb){
           const doc=document,bdy=doc.body;
           const script = doc.createElement("script");
           script.onload=function(){
               cb(undefined,script.exec.apply(undefined,arg_values) );
               bdy.removeChild(script);
           };
           script.src = "data:text/plain;base64," + btoa([
               'document.currentScript.exec=function('+args.join(',')+'){',
               src,
               '};'
           ].join('\n'));
           bdy.appendChild(script);
       }
       
       function removeScriptCommentNodes(hash) {
            if (!removeScriptCommentNodes.cache) {
               var foundComments = [];
               var elementPath = [document.body];
               while (elementPath.length > 0) {
                   var el = elementPath.pop();
                   for (var i = 0; i < el.childNodes.length; i++) {
                       var node = el.childNodes[i];
                       if (node.nodeType === Node.COMMENT_NODE) {
                            foundComments.push(node);
                       } else {
                           elementPath.push(node);
                       }
                   }
               }
              removeScriptCommentNodes.cache=foundComments;
           }
           
           const first = removeScriptCommentNodes.cache.findIndex(function(el){return el.textContent==='ab:'+hash;});
           const last  = removeScriptCommentNodes.cache.findIndex(function(el){return el.textContent===hash+':ab';});
           if (first<0||last<0) {
               return null;
           }
           const nodes = removeScriptCommentNodes.cache.splice(first,last+1);

           nodes.forEach(function(node){
               node.parentNode.removeChild(node);
           });
           

       }
       
         })();
    }
       
     function minifiedOutput() {
      // !function(){const n="object"==typeof crypto&&"object"==typeof crypto.subtle&&crypto.subtle,t={pako:pako},e={};function c(n,e,o){if(c.cache){if(c.cache[e])return}else c.cache={};const r=Object.keys(window),i={};!function(n,t,e,c){const o=document,r=o.body,i=o.createElement("script");i.onload=function(){c(void 0,i.exec.apply(void 0,e)),r.removeChild(i)},i.src="data:text/plain;base64,"+btoa(["document.currentScript.exec=function("+n.join(",")+"){",t,"};"].join("\n")),r.appendChild(i)}([],n,[],function(){c.cache[e]=!0,function(){const n=Object.keys(window);r.forEach(function(t){const e=n.indexOf(t);e>=0&&n.splice(e,1)}),r.push.apply(r,n),n.forEach(function(n){i[n]=window[n],t[n]=window[n]})}(),o(i,t)})}function o(n){if(o.cache)return n(o.cache);const t=document.querySelector("archive"),e=t&&t.innerHTML;if(e)return t.parentNode.removeChild(t),n(o.cache=e);var c=new XMLHttpRequest;c.open("GET",document.baseURI,!0),c.onreadystatechange=function(){4===c.readyState&&n(o.cache=c.responseText.substr(c.responseText.indexOf("<archive>")+"<archive>".length))},c.send(null)}function r(t,e,c){const o="function"==typeof c?c:function(n){return n},r={start:"\x3c!--ab:"+t+"--\x3e",end:"\x3c!--"+t+":ab--\x3e"};let i=e.indexOf(r.start);if(i<0)return o(null);const u=c?e.substr(0,i):0;if((i=(e=e.substr(i+r.start.length)).indexOf(r.end))<0)return o(null);const f=c?e.substring(i+r.end.length):0,s=function(){return function(n,t){const e=n.indexOf("\x3c!--");if(e<0)return null;const c=n.indexOf("--\x3e");if(c<e)return null;const o=n.substring(e+4,c),r=n.substr(c+3);t&&t(r);return o}(e,function(n){e=n})};if(0!==(e=e.substr(0,i)).indexOf("\x3c!--"))return o(null);const a=s().split(","),l=()=>Number.parseInt(a.shift(),36),h="\n"===e.charAt(0)?"/*"+s()+"*/":"",d=l();if(isNaN(d))return o(null);const p=l();if(isNaN(p))return o(null);const b=[];for(let n=0;n<p;n++)b.push(s());const y=b.join("--"),w=l(),g=l(),x=new Uint8Array(y.split("").map(n=>n.charCodeAt(0))).buffer,m=1===w?pako.inflate(x):x,v=1===w?function(n){n.byteLength;const t=function(n,t){if(n.byteLength<t)return[n];const e=[n.slice(0,t)];let c=t;for(;c+t<n.byteLength;)e.push(n.slice(c,c+t)),c+=t;return e.push(n.slice(c)),e}(n,16384),e=[];for(;t.length>0;)e.push(String.fromCharCode.apply(String,new Uint8Array(t.shift())));const c=e.join("");return e.splice(0,e.length),c}(m):y,O=""===h?m:new Uint8Array((h+v).split("").map(n=>n.charCodeAt(0))).buffer,N=function(){switch(g){case 1:return O;case 2:case 0:return 2===g?JSON.parse(v):h+v}};if(m.byteLength!==d)return o(null);if(!n)return c(N(),u+f);!function(t,e){n.digest("SHA-1",t).then(function(n){e(void 0,function(n){const t=[],e=new DataView(n);if(0===e.byteLength)return"";if(e.byteLength%4!=0)throw new Error("incorrent buffer length - not on 4 byte boundary");for(let n=0;n<e.byteLength;n+=4){const c=e.getUint32(n),o=c.toString(16),r=("00000000"+o).slice(-"00000000".length);t.push(r.substr(6,2)+r.substr(4,2)+r.substr(2,2)+r.substr(0,2))}return t.join("")}(n))}).catch(e)}(O,function(n,e){return c(e===t?N():null,u+f)})}!function(n,t){if(c.cache&&c.cache[n])return;o(function(e){r("${hash}",e,function(e,r){e&&c(e,n,function(e,c){o.cache=r,function n(t){if(!n.cache){for(var e=[],c=[document.body];c.length>0;)for(var o=c.pop(),r=0;r<o.childNodes.length;r++){var i=o.childNodes[r];i.nodeType===Node.COMMENT_NODE?e.push(i):c.push(i)}n.cache=e}const u=n.cache.findIndex(function(n){return n.textContent==="ab:"+t});const f=n.cache.findIndex(function(n){return n.textContent===t+":ab"});if(u<0||f<0)return null;const s=n.cache.splice(u,f+1);s.forEach(function(n){n.parentNode.removeChild(n)})}(n),t(e,c)})})})}("${hash}",function(n){console.log({exports:n,directory:t}),window.directory=t,function(n){const t="${content_hash}";0;o(function(c){r(t,c,function(t,c){t&&(o.cache=c,JSZip.loadAsync(t).then(function(t){t.folder("").forEach(function(n,c){if(!c.dir&&"."!==c.name.charAt(0)){const n="https://"+c.name;let o;Object.defineProperty(e,n,{get:function(r){delete e[n],e[n]=function(n){if(o)return n(o.slice());let t=10;const e=setInterval(function(){o&&(clearInterval(e),n(o.slice())),--t<0&&(clearInterval(e),n())},100)},t.file(c.name).async("arraybuffer").then(function(n){r((o=n).slice())})},enumerable:!0,configurable:!0})}}),n()}).catch(n))})})}(function(n){n||(window.loadZipScript=function(n,t){window.loadZipText(function(n,e){if(n)return t(n);c(e,t)})},window.loadZipText=function(n,t){window.loadZipBuffer(function(n,e){if(n)return t(n);t(void 0,(new TextEncoder).encode(e))})},window.loadZipBuffer=function(n,t){if(!(n in e))return t(new Error("not found"));e[n](function(n){t(void 0,n)})},window.prepareZipSync=function(n,t){if(void 0===n)return window.prepareZipSync(Object.keys(e),t);Promise.all(n.map(function(n){return new Promise(function(t){e[n](t)})})).then(function(e){const c={};n.forEach(function(n,t){c[n]=e[t]}),t(c)})})})})}();
     }
     
     
     
     function bufferTob64(opts, cb) {
         const compressed = deflate(opts.buffer, deflateOpts);
         var blob = new Blob([compressed]);
 
         var reader = new FileReader();
         reader.onload = function(event) {
             cb(event.target.result.substr('data:application/octet-stream;base64,'.length));
         };
 
         reader.readAsDataURL(blob);
     }
     
     function bufferToZip(opts, cb) {
         const file = opts.url.replace(/^http(s*):\/\//,'');
         opts.newZip.file(file,opts.buffer,{date : new Date(),createFolders: false });
         cb('');
     }

     function bufferToText(opts,cb){
         cb(new TextDecoder().decode(opts.buffer));
     }
    
}

});