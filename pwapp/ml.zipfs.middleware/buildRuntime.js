/* global ml,Response,Headers  */
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
            return mware;
        }
    }, {
        ServiceWorkerGlobalScope: []
    }

    );

    const trigger_base64_re      = /\/build\/ml\.sw\.runtime\.b64\.js$/;
    const trigger_inflateText_re = /\/build\/ml\.sw\.runtime\.inflate\.js$/;
    const trigger_text_re        = /\/build\/ml\.sw\.runtime\.text\.js$/;
    
    const trigger_jszip_boot_re        = /\/build\/ml\.jszip_boot\.html$/;
    
    

    function mware(event, middleware) {
        
        const deflate = ml.i.pako.deflate;
        const fnSrc = middleware.fnSrc;
        const deflateOpts = {
            level: 9
        };        
        const storeBufferFunc = {
            deflate_base64 : bufferTob64,
            clear_text     : bufferToText
        };
        const getSourceTemplate = {
           deflate_base64 :function(middleware,dir_json,inflate_url,cb){
               const db = middleware.databases.cachedURLS;
               
               fetchURL(db, inflate_url, function(err, buffer) {
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
               });
           },
           clear_text :function(middleware,dir_json,inflate_url,cb){
               return cb([
                '/* global ml,self,Response,Headers,BroadcastChannel  */',
                '/*jshint -W054 */',
                '(function(importScripts){',
                     fnSrc(ml, true),
                     fnSrc(startupCode),
                '})((function(dir){'+fnSrc(runtimeClearText)+'})('+dir_json+'));',
    
               ].join("\n"));
           }
            
        };
        
        const default_buildmode= trigger_base64_re.test(event.fixup_url) ? "deflate_base64" : 
                                 trigger_text_re.test(event.fixup_url)   ? "clear_text" : false;
        
        if (!!default_buildmode) {
            
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

                        fetchURL(db, url, function(err, buffer) {

                            if (pako_re.test(url)) {
                                inflate_url = url.replace(pako_re, '/pako.inflate.min.js');
                            }
                            if (err || !buffer) return middleware.response500(resolve, err || new Error("could not fetch " + url));
                            
                            storeBufferFunc[buildmode] (buffer, function(data) {
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
                            
                            middleware,json,inflate_url,
                            function(source){
                               resolve(new Response(source, {

                                   status: 200,
                                   headers: new Headers({
                                       'Content-Type': 'application/javascript',
                                       'Content-Length': source.length
                                   })

                               }));
                            }    
                            
                        );

                      
                    }

                };

                getNextFile(default_buildmode,0);
            });
        }
        
        if (trigger_jszip_boot_re.test(event.fixup_url)) {
              return new Promise(function(resolve) {
                          
                    const db = middleware.databases.cachedURLS;
                    const js_zip_url = ml.c.app_root+'jszip.min.js';
                    const inflate_url = ml.c.app_root+'pako.inflate.min.js';
                    HTML_Wrap_JSZip(db,js_zip_url,inflate_url, function(err,html){
                        
                                   
                        
              
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
        
         function fetchURL(db, url, cb) {
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
            
         function bufferTob64(arrayBuffer, cb) {
             const compressed = deflate(arrayBuffer, deflateOpts);
             var blob = new Blob([compressed]);
     
             var reader = new FileReader();
             reader.onload = function(event) {
                 cb(event.target.result.substr('data:application/octet-stream;base64,'.length));
             };
     
             reader.readAsDataURL(blob);
         }
         
        
         
         function bufferToText(arraybuffer,cb){
             cb(new TextDecoder().decode(arraybuffer));
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
         
         
         function HTML_Wrap_JSZip(db,js_zip_url,inflate_url, cb)  {
                      fetchURL(db, inflate_url, function(err, buffer) {
                          if (err) return cb (err);
                          
                          const inflate_src =new TextDecoder().decode(buffer);
                          
                          fetchURL(db, js_zip_url, function(err, buffer) {
                              if (err) return cb (err);
                              
                              HTML_EscapeArrayBuffer (new TextDecoder().decode(buffer),function(jszip_src_html){
                                  
                                  const hash = get_HTML_Escaped_Hash (jszip_src_html);
                                  const html = [
                                     '<html>',
                                     '<head>',
                                      
                                     '</head>',
                                     '<body>',
                                         '<script>',
                                             inflate_src,
                                             middleware.fnSrc (uncompressedOutput).replace(/\$\{hash\}/g,hash),
                                         '</script>',
                                     '</bo'+'dy>',
                                     jszip_src_html,
                                     '</html>',
                                   ].join("\n");
                                  
                                  
                                  cb (undefined,html);
                                  
                                  
                              });
                          });
                      });
                  }
       function uncompressedOutput(crypto,pako){
        (function(){
       const SUBTLE = typeof crypto==='object' && typeof crypto.subtle === "object" &&  crypto.subtle;
       
       loadScript("${hash}",function(){
           console.log(window.JSZip);
       });
       
       function loadScript(hash,cb) {
           if (loadScript.cache) {
              if (loadScript.cache[hash]) {
                  return;
              }
           } else {
               loadScript.cache={};
           }
           getArchive(function(html){
               /*HTML_UnescapeArrayBuffer*/ DOM_fetchArrayBuffer ("${hash}",html,function(jszip_src,newhtml){
                    if (jszip_src) {
                        
                        compile_viascript_base64([],jszip_src,[],function(){
                              getArchive.cache=newhtml;
                              loadScript.cache[hash]=true;
                              cb();
                        });

                    }
               });
           });
       }
       
       function getArchive(cb){
           if (getArchive.cache)return cb(getArchive.cache);
           var xhr = new XMLHttpRequest();
           xhr.open('GET', document.baseURI, true);
           xhr.onreadystatechange = function () {
               if (xhr.readyState === 4) {
                   cb((getArchive.cache = xhr.responseText.substr(xhr.responseText.indexOf('</html>')+7)));
               }
           };
           xhr.send(null);
       }
       
       function compile_viascript_base64(args,src,arg_values,cb){
           
           const script = document.createElement("script");
           script.onload=function(){
               cb(undefined,script.exec.apply(undefined,arg_values) );
           };
           script.src = "data:text/plain;base64," + btoa([
               'document.currentScript.exec=function('+args.join(',')+'){',
               src,
               '};'
           ].join('\n'));
           document.body.appendChild(script);
       }

       function HTML_UnescapeArrayBuffer(hash,html,cb) {
           
           const CB = typeof cb==='function' ? cb : function(x){return x;};

           const markers = {start:'<!-\-ab:'+hash+'-\->',end:'<!-\-'+hash+':ab-\->'};
           
           let ix = html.indexOf(markers.start);
           if (ix<0) return CB(null);
           const before = cb?html.substr(0,ix):0;
           html = html.substr(ix+markers.start.length);
           ix = html.indexOf(markers.end);
           if (ix<0) return CB(null);
           const after = cb?html.substring(ix+markers.end.length):0;
           html = html.substr(0,ix);
           
           const getNext=function(){return HTML_UnescapeTag(html,function(remain){html=remain});};

           if (html.indexOf('<!-\-')!==0) return CB(null);
           
           const header = getNext().split(','),
                 getHdrVar=()=>Number.parseInt(header.shift(),36);
                 
           const comment = html.charAt(0)==='\n' ?  '/*'+getNext()+'*/' : '';
           
           const byteLength = getHdrVar();
           if (isNaN(byteLength)) return CB(null);
           const splitsCount =getHdrVar();
           if (isNaN(splitsCount)) return CB(null);
           
           const strs = [];
           for (let i =0;i<splitsCount;i++) {
               strs.push(getNext());
           }
           const raw_stored = strs.join('--');
           const mode   = getHdrVar();
           const format = getHdrVar();
              
           const stored = new Uint8Array(raw_stored.split('').map((x)=>x.charCodeAt(0))).buffer;
           const buffer = mode === 1 ? pako.inflate(stored) : stored;
           const bufferText   = mode === 1 ? encodeArrayBufferToRawString(buffer) : raw_stored ; 
           const bufferToHash = comment === '' ? buffer : new Uint8Array((comment+bufferText).split('').map((x)=>x.charCodeAt(0))).buffer;
           
           const getFormatted = function() {
              
               switch (format) {
                   case 1 : return bufferToHash;
                   case 2 :
                   case 0 :
                        
                       return format === 2 ? JSON.parse(bufferText) : comment+bufferText;
               }
           };
           if (buffer.byteLength!==byteLength) return CB(null);

           if (SUBTLE) {     
               sha1SubtleCB( bufferToHash ,function(err,checkHash){
                     return cb(checkHash===hash?getFormatted():null,before+after); 
               });
           } else {
                return cb(getFormatted(),before+after); 
           }
           function sha1SubtleCB(buffer,cb){ 
                   return SUBTLE.digest("SHA-1", buffer)
                      .then(function(dig){cb(undefined,bufferToHex(dig));})
                        .catch(cb); 
               
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
           
           function encodeArrayBufferToRawString(ab) {
               const bytesPerChunk = 1024 * 16;
               const len = ab.byteLength;
               const bufs = splitArrayBufferMaxLen(ab,bytesPerChunk);
               const chunks = [];
               while (bufs.length>0) {
                   chunks.push(String.fromCharCode.apply(String,new Uint8Array(bufs.shift())));
               }
               const result = chunks.join('');
               chunks.splice(0,chunks.length);
               return result;
           }

           function bufferToHex(buffer) {
               const padding = '00000000';
               const hexCodes = [];
               const view = new DataView(buffer);
               if (view.byteLength===0) return '';
               if (view.byteLength % 4 !== 0) throw new Error("incorrent buffer length - not on 4 byte boundary");
           
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
           
           function HTML_UnescapeTag(html,cb) {
               const starts = html.indexOf('<!-\-');
               if (starts<0) return null;
               const ends = html.indexOf('-\->');
               if (ends<starts) return null;
               
               const result  = html.substring(starts+4,ends);
               const remains = html.substr(ends+3);
               if (cb) cb(remains);
               return result;
           }
           
           
       }
       
       
       function DOM_fetchArrayBuffer(hash,html,cb) {
           const CB = typeof cb==='function' ? cb : function(x){return x;};
           
           if (!DOM_fetchArrayBuffer.cache) {
               var foundComments = [];
               var elementPath = [document.body];
               while (elementPath.length > 0) {
                   var el = elementPath.pop();
                   for (var i = 0; i < el.childNodes.length; i++) {
                       var node = el.childNodes[i];
                       el.isCodeComment = foundComments.length>0 && foundComments[foundComments.length-1] !== el.previousSibling;
                       if (node.nodeType === Node.COMMENT_NODE) {
                           foundComments.push(node);
                       } else {
                           elementPath.push(node);
                       }
                   }
               }
              DOM_fetchArrayBuffer.cache=foundComments.map(function(el){
                  const text =  el.isCodeComment ? [ el.textContent ] : el.textContent;
                  el.parentNode.removeChild(el);
                  return text;
              });
           }
           
           const first = DOM_fetchArrayBuffer.cache.indexOf('ab:'+hash);
           const last  = DOM_fetchArrayBuffer.cache.indexOf(hash+':ab');
           if (first<0||last<0) {
               return null;
           }
           const dataset = DOM_fetchArrayBuffer.cache.splice(first,last+1);
           dataset.shift();dataset.pop();
           const header = dataset.shift().split(',');
           const comment = Array.isArray(dataset[0]) ? '/*'+ dataset.shift()[0] + '*/' : '';
           const getHdrVar=()=>Number.parseInt(header.shift(),36);
           
           const byteLength = getHdrVar();
           if (isNaN(byteLength)) return CB(null);
           const splitsCount =getHdrVar();
           if (isNaN(splitsCount)) return CB(null);
           
           const strs = [];
           for (let j =0;j<splitsCount;j++) {
               strs.push( dataset.shift() );
           }
           const raw_stored = strs.join('--');
           const mode   = getHdrVar();
           const format = getHdrVar();
              
           const stored = new Uint8Array(raw_stored.split('').map((x)=>x.charCodeAt(0))).buffer;
           const buffer = mode === 1 ? pako.inflate(stored) : stored;
           const bufferText   = mode === 1 ? encodeArrayBufferToRawString(buffer) : raw_stored ; 
           const bufferToHash = comment === '' ? buffer : new Uint8Array((comment+bufferText).split('').map((x)=>x.charCodeAt(0))).buffer;
           
           const getFormatted = function() {
              
               switch (format) {
                   case 1 : return bufferToHash;
                   case 2 :
                   case 0 :
                        
                       return format === 2 ? JSON.parse(bufferText) : comment+bufferText;
               }
           };
           if (buffer.byteLength!==byteLength) return CB(null);

           if (SUBTLE) {     
               sha1SubtleCB( bufferToHash ,function(err,checkHash){
                     return cb(checkHash===hash?getFormatted():null); 
               });
           } else {
                return cb(getFormatted()||null); 
           }
           function sha1SubtleCB(buffer,cb){ 
                   return SUBTLE.digest("SHA-1", buffer)
                      .then(function(dig){cb(undefined,bufferToHex(dig));})
                        .catch(cb); 
               
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
           
           function encodeArrayBufferToRawString(ab) {
               const bytesPerChunk = 1024 * 16;
               const len = ab.byteLength;
               const bufs = splitArrayBufferMaxLen(ab,bytesPerChunk);
               const chunks = [];
               while (bufs.length>0) {
                   chunks.push(String.fromCharCode.apply(String,new Uint8Array(bufs.shift())));
               }
               const result = chunks.join('');
               chunks.splice(0,chunks.length);
               return result;
           }

           function bufferToHex(buffer) {
               const padding = '00000000';
               const hexCodes = [];
               const view = new DataView(buffer);
               if (view.byteLength===0) return '';
               if (view.byteLength % 4 !== 0) throw new Error("incorrent buffer length - not on 4 byte boundary");
           
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
           
            
           
           

       }
       
    })();
       }
       
       function minifiedOutput() {
            !function(){const n="object"==typeof crypto&&"object"==typeof crypto.subtle&&crypto.subtle;function t(n){if(t.cache)return n(t.cache);var e=new XMLHttpRequest;e.open("GET",document.baseURI,!0),e.onreadystatechange=function(){4===e.readyState&&n(t.cache=e.responseText.substr(e.responseText.indexOf("</html>")+7))},e.send(null)}!function e(r,c){if(e.cache){if(e.cache[r])return}else e.cache={};t(function(o){!function(t,e,r){const c="function"==typeof r?r:function(n){return n},o={start:"\x3c!--ab:"+t+"--\x3e",end:"\x3c!--"+t+":ab--\x3e"};let s=e.indexOf(o.start);if(s<0)return c(null);const u=r?e.substr(0,s):0;if(e=e.substr(s+o.start.length),(s=e.indexOf(o.end))<0)return c(null);const i=r?e.substring(s+o.end.length):0;e=e.substr(0,s);const f=function(){return function(n,t){const e=n.indexOf("\x3c!--");if(e<0)return null;const r=n.indexOf("--\x3e");if(r<e)return null;const c=n.substring(e+4,r),o=n.substr(r+3);t&&t(o);return c}(e,function(n){e=n})};if(0!==e.indexOf("\x3c!--"))return c(null);const a=f().split(","),l=()=>Number.parseInt(a.shift(),36),h=l();if(isNaN(h))return c(null);const b=l();if(isNaN(b))return c(null);const p=[];for(let n=0;n<b;n++)p.push(f());const d=p.join("--"),g=l(),y=l();if(0===g&&0===y&&!n)return d;if(0===g&&2===y&&!n)return JSON.parse(d);const x=new Uint8Array(d.split("").map(n=>n.charCodeAt(0))).buffer,w=1===g?pako.inflate(x):x,m=function(){switch(y){case 1:return w;case 2:case 0:const n=0===g?d:function(n){n.byteLength;const t=function(n,t){if(n.byteLength<t)return[n];const e=[n.slice(0,t)];let r=t;for(;r+t<n.byteLength;)e.push(n.slice(r,r+t)),r+=t;return e.push(n.slice(r)),e}(n,16384),e=[];for(;t.length>0;)e.push(String.fromCharCode.apply(String,new Uint8Array(t.shift())));const r=e.join("");return e.splice(0,e.length),r}(w);return 2===y?JSON.parse(n):n}};if(w.byteLength!==h)return c(null);if(!n)return r(m(),u+i);!function(t,e){n.digest("SHA-1",t).then(function(n){e(void 0,function(n){const t=[],e=new DataView(n);if(0===e.byteLength)return"";if(e.byteLength%4!=0)throw new Error("incorrent buffer length - not on 4 byte boundary");for(let n=0;n<e.byteLength;n+=4){const r=e.getUint32(n),c=r.toString(16),o=("00000000"+c).slice(-"00000000".length);t.push(o.substr(6,2)+o.substr(4,2)+o.substr(2,2)+o.substr(0,2))}return t.join("")}(n))}).catch(e)}(w,function(n,e){return r(e===t?m():null,u+i)})}("${hash}",o,function(n,o){n&&function(n,t,e,r){const c=document.createElement("script");c.onload=function(){r(void 0,c.exec.apply(void 0,e))},c.src="data:text/plain;base64,"+btoa(["document.currentScript.exec=function("+n.join(",")+"){",t,"};"].join("\n")),document.body.appendChild(c)}([],n,[],function(){t.cache=o,e.cache[r]=!0,c()})})})}("${hash}",function(){console.log(window.JSZip)})}();
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
         
         function encodeArrayBufferToRawString(ab) {
             const bytesPerChunk = 1024 * 16;
             const len = ab.byteLength;
             const bufs = splitArrayBufferMaxLen(ab,bytesPerChunk);
             const chunks = [];
             while (bufs.length>0) {
                 chunks.push(String.fromCharCode.apply(String,new Uint8Array(bufs.shift())));
             }
             const result = chunks.join('');
             chunks.splice(0,chunks.length);
             return result;
         }

         function decodeArrayBufferFromRawString (str) {
             return new Uint8Array(str.split('').map((x)=>x.charCodeAt(0))).buffer;
         }

         function HTML_EscapeComment(comment) {
            return Array.isArray(comment) ? HTML_EscapeComment(comment.join('-\-><!-\-'))  : '<!-\-'+comment+'-\->';
         }
         
         function HTML_EscapeTags(hash) {
             return {
                start:HTML_EscapeComment('ab:'+hash),
                end:HTML_EscapeComment(hash+':ab')
             };
         }
         
         function HTML_UnescapeTag(html,cb) {
             const starts = html.indexOf('<!-\-');
             if (starts<0) return null;
             const ends = html.indexOf('-\->');
             if (ends<starts) return null;
             
             const result  = html.substring(starts+4,ends);
             const remains = html.substr(ends+3);
             if (cb) cb(remains);
             return result;
         }
         
         function get_HTML_Escaped_Hash(html) {
             let hash,update=function(x){ html = x;  };
             while (!hash && html.length>0) {
                 hash = HTML_UnescapeTag(html,update) ;
                 if (hash.indexOf('ab:')===0) {
                     return hash.substr(3);
                 }
             }
         }
         
         function HTML_EscapeArrayBuffer(ab,cb){
             const ab_trimmed = typeof ab==='string' ? ab.trim() : false;
             const comment = typeof ab==='string' && ab_trimmed.indexOf('/*')===0 ? ab_trimmed.substring(2,ab_trimmed.indexOf('*/')) : false;
             const commentLength = comment ? comment.length+4 : 0;
             const format =  typeof ab==='string' ? 0 : typeof ab ==='object' && typeof ab.byteLength !== 'undefined' ? 1 : 2;
             const to_hash  = format !== 1 ? decodeArrayBufferFromRawString(format === 0  ? (comment ? ab_trimmed : ab) : JSON.stringify(ab) ) : ab;
             const to_store = format !== 1 ? (format === 0 ? ( comment ? decodeArrayBufferFromRawString(ab_trimmed.substr(commentLength)) : ab ) : to_hash ) :  ab;
             const deflated = ml.i.pako.deflate(to_store,{level:9});
             
             if (cb) {
                 ml.i.sha1Lib.cb(to_hash,function(err,hash){
                    return cb(esc(hash)); 
                 });
             } else {
                 const hash = ml.i.sha1Lib.sync(to_hash);
                 return esc(hash);
             }
             
             function esc(hash) {
                 
               const markers         = HTML_EscapeTags(hash);  
               const deflate_str     = encodeArrayBufferToRawString(deflated);
               const deflate_splits  = deflate_str.split (/\-\-/g);
              
               
               const deflateHtml =   markers.start + 
                                     HTML_EscapeComment([to_store.byteLength,deflate_splits.length,1,format].map(function(x){return x.toString(36);}).join(','))+
                                     (comment ? '\n'+HTML_EscapeComment(comment)+'\n' : '')+
                                     HTML_EscapeComment(deflate_splits)+
                                     markers.end;

               const clean_str     = encodeArrayBufferToRawString(to_hash);
               const clean_splits  = clean_str.split (/\-\-/g);         
                         
               const cleanHtml =   markers.start + 
                                   HTML_EscapeComment([to_hash.byteLength,clean_splits.length,0,format].map(function(x){return x.toString(36);}).join(','))+
                                   HTML_EscapeComment(clean_splits)+
                                   markers.end;
                                   
                                   
                return cleanHtml.length < deflateHtml.length ? cleanHtml : deflateHtml;

             }
         }
         
    }
    
   
    


});