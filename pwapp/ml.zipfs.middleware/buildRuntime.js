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
    const trigger_jszip_re       = /\/build\/ml\.sw\.runtime\.zip\.html$/;
    const trigger_jszip_min_re   = /\/build\/ml\.sw\.runtime\.zip\.min\.html$/;
    
    const trigger_jszip_boot_re        = /\/build\/ml\.jszip_boot\.html$/;
    const trigger_jszip_boot_min_re        = /\/build\/ml\.jszip_boot\.min\.html$/;
    
    

    function mware(event, middleware) {
        
        const deflate = ml.i.pako.deflate;
        const JSZip  = ml.i.JSZip;
        const fnSrc = middleware.fnSrc;
        const deflateOpts = {
            level: 9
        };        
        const storeBufferFunc = {
            deflate_base64 : bufferTob64,
            clear_text     : bufferToText,
            zip            : bufferToZip
        };
        const trigger_jszip_min = trigger_jszip_min_re.test(event.fixup_url);
        const default_buildmode= trigger_base64_re.test(event.fixup_url) ? "deflate_base64" : 
        trigger_jszip_re.test(event.fixup_url)||trigger_jszip_min  ? "zip" : 
        trigger_text_re.test(event.fixup_url)   ? "clear_text" : false;

        const newZip = default_buildmode === 'zip' ?  new JSZip() : false;
        
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
               },'application/javascript');
           },
           clear_text :function(middleware,dir_json,inflate_url,cb){
               return cb([
                '/* global ml,self,Response,Headers,BroadcastChannel  */',
                '/*jshint -W054 */',
                '(function(importScripts){',
                     fnSrc(ml, true),
                     fnSrc(startupCode),
                '})((function(dir){'+fnSrc(runtimeClearText)+'})('+dir_json+'));',
    
               ].join("\n"),'application/javascript');
           },
           zip : function(middleware,dir_json,inflate_url,cb){
               
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
                     HTML_Wrap_JSZip(db,js_zip_url,inflate_url, buffer, trigger_jszip_min, function(err,html){
                         
                       cb(html,'text/html');
                     
                     });
                  
                    
                    
               }).catch(cb);
           }
        };

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
                            
                            storeBufferFunc[buildmode] (url,buffer, function(data) {
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
                            function(source,contentType){
                               resolve(new Response(source, {

                                   status: 200,
                                   headers: new Headers({
                                       'Content-Type':   contentType,
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
        const zipboot_min = trigger_jszip_boot_min_re.test(event.fixup_url);
        if (zipboot_min||trigger_jszip_boot_re.test(event.fixup_url)) {
              return new Promise(function(resolve) {
                          
                    const db = middleware.databases.cachedURLS;
                    const js_zip_url = ml.c.app_root+'jszip.min.js';
                    const inflate_url = ml.c.app_root+'pako.inflate.min.js';
                    HTML_Wrap_JSZip(db,js_zip_url,inflate_url, undefined,zipboot_min, function(err,html){
                        
                                   
                        
              
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
            
         function bufferTob64(url,arrayBuffer, cb) {
             const compressed = deflate(arrayBuffer, deflateOpts);
             var blob = new Blob([compressed]);
     
             var reader = new FileReader();
             reader.onload = function(event) {
                 cb(event.target.result.substr('data:application/octet-stream;base64,'.length));
             };
     
             reader.readAsDataURL(blob);
         }
         
         function bufferToZip(url,arrayBuffer, cb) {
             const file = url.replace(/^http(s*):\/\//,'');
             newZip.file(file,arrayBuffer,{date : new Date(),createFolders: false });
             cb('');
         }

         function bufferToText(url,arraybuffer,cb){
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

         function HTML_Wrap_JSZip(db,js_zip_url,inflate_url,content_zip, minified, cb)  {
             
                    const  {
                        get_HTML_Escaped_Hash,
                        HTML_EscapeArrayBuffer,
                        HTML_UnescapeArrayBuffer,
                        compareBuffers
                    } = htmlEscapeLib(
                        typeof crypto==='object' && crypto,
                        typeof crypto==='object' && typeof crypto.subtle === "object" &&  crypto.subtle,
                        ml.i.pako);
                    
                      fetchURL(db, inflate_url, function(err, buffer) {
                          if (err) return cb (err);
                          
                          const inflate_src =new TextDecoder().decode(buffer);
                          fetchURL(db, js_zip_url, function(err, buffer) {
                              if (err) return cb (err);
                              
                              if (content_zip) {
                                  HTML_EscapeArrayBuffer (content_zip,function(content_html){
                                      const content_hash = get_HTML_Escaped_Hash (content_html);
                                      HTML_UnescapeArrayBuffer(content_hash,content_html,function(check){
                                          if (check!==content_html) return cb (new Error("qc check fails"));
                                           step2(content_hash,content_html);
                                      });
                                     
                                  });
                              } else {
                                  step2();
                              }
                              function step2(content_hash,content_html){
                                 HTML_EscapeArrayBuffer (buffer,function(jszip_src_html){
                                  const hash = get_HTML_Escaped_Hash (jszip_src_html);
                                  HTML_UnescapeArrayBuffer(hash,jszip_src_html,function(check){
                                      
                                      if (!compareBuffers(check,buffer)) return cb (new Error("qc check fails - jszip bundling"));
                                      
                                       const html = [
                                          '<html>',
                                          '<head>',
                                           '<style>archive{display:none;}</style>',
                                          '</head>',
                                          '<body>',
                                              
                                            '<script>',
                                                  inflate_src,
                                                  middleware.fnSrc (htmlUnescapeLib,true),
                                                  middleware.fnSrc (minified?minifiedOutput:uncompressedOutput)
                                                      .replace(/\$\{hash\}/g,hash)
                                                      .replace(/\$\{content_hash\}/g,content_hash||''),
                                              '</script>',
                                          '</body>',
                                          '<archive>',
                                          jszip_src_html,
                                          !!content_hash&& !!content_html && content_html,
                                          
                                           '</archive>',
                                        
                                          '</html>',
                                        ].join("\n");
                                       cb (undefined,html);
                                  });
                                 });
                              }
                          });
                      });
                  }
                  
       function uncompressedOutput(crypto,pako){
        (function(){
       const  {
           toString,
           get_HTML_Escaped_Hash,
           HTML_EscapeArrayBuffer,
           HTML_UnescapeArrayBuffer,
           decodeArrayBufferFromRawString,
           encodeArrayBufferToRawString
       } = htmlUnescapeLib(typeof crypto==='object'&&crypto.subtle,pako) ;
       
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
               }
               
               window.loadZipText= function(url,cb) {
                   window.loadZipBuffer(function(err,buffer){
                       if (err) return cb (err);
                       cb(undefined,new TextEncoder().encode(buffer));
                   });
               }
               
               window.loadZipBuffer= function(url,cb) {
                   if ( url in fake_internet) {
                      fake_internet[url](function(buffer){ cb (undefined,buffer);});
                   } else {
                      return cb(new Error("not found"));
                   }
               }
               
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
               }
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
           getArchive(function(html){
               HTML_UnescapeArrayBuffer ("${hash}",html,function(source,newhtml){
                    if (source) {
                        loadScript_imp(source,hash,function(exports,directory){
                            getArchive.cache=newhtml; 
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
          getArchive(function(html){
              HTML_UnescapeArrayBuffer (hash,html,function(zipBuffer,newhtml){
                   if (zipBuffer) {
                       getArchive.cache=newhtml;
                        
                       
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
           const el=document.querySelector("archive"),html=el&&el.innerHTML;
           if (html) {
               el.parentNode.removeChild(el);
              // return cb((getArchive.cache = html));
           } 
           const marker = '<archive>';
           var xhr = new XMLHttpRequest();
           xhr.responseType = 'arraybuffer'
           xhr.open('GET', document.baseURI, true);
           xhr.onreadystatechange = function () {
               if (xhr.readyState === 4) {
                   cb((getArchive.cache = toString(xhr.response)));
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
           const last  = removeScriptCommentNodes.cache.findIndex(function(el){return el.textContent===hash+':ab'});
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
            !function(){const n="object"==typeof crypto&&"object"==typeof crypto.subtle&&crypto.subtle,t={pako:pako},e={};function c(n,e,o){if(c.cache){if(c.cache[e])return}else c.cache={};const r=Object.keys(window),i={};!function(n,t,e,c){const o=document,r=o.body,i=o.createElement("script");i.onload=function(){c(void 0,i.exec.apply(void 0,e)),r.removeChild(i)},i.src="data:text/plain;base64,"+btoa(["document.currentScript.exec=function("+n.join(",")+"){",t,"};"].join("\n")),r.appendChild(i)}([],n,[],function(){c.cache[e]=!0,function(){const n=Object.keys(window);r.forEach(function(t){const e=n.indexOf(t);e>=0&&n.splice(e,1)}),r.push.apply(r,n),n.forEach(function(n){i[n]=window[n],t[n]=window[n]})}(),o(i,t)})}function o(n){if(o.cache)return n(o.cache);const t=document.querySelector("archive"),e=t&&t.innerHTML;if(e)return t.parentNode.removeChild(t),n(o.cache=e);var c=new XMLHttpRequest;c.open("GET",document.baseURI,!0),c.onreadystatechange=function(){4===c.readyState&&n(o.cache=c.responseText.substr(c.responseText.indexOf("<archive>")+"<archive>".length))},c.send(null)}function r(t,e,c){const o="function"==typeof c?c:function(n){return n},r={start:"\x3c!--ab:"+t+"--\x3e",end:"\x3c!--"+t+":ab--\x3e"};let i=e.indexOf(r.start);if(i<0)return o(null);const u=c?e.substr(0,i):0;if((i=(e=e.substr(i+r.start.length)).indexOf(r.end))<0)return o(null);const f=c?e.substring(i+r.end.length):0,s=function(){return function(n,t){const e=n.indexOf("\x3c!--");if(e<0)return null;const c=n.indexOf("--\x3e");if(c<e)return null;const o=n.substring(e+4,c),r=n.substr(c+3);t&&t(r);return o}(e,function(n){e=n})};if(0!==(e=e.substr(0,i)).indexOf("\x3c!--"))return o(null);const a=s().split(","),l=()=>Number.parseInt(a.shift(),36),h="\n"===e.charAt(0)?"/*"+s()+"*/":"",d=l();if(isNaN(d))return o(null);const p=l();if(isNaN(p))return o(null);const b=[];for(let n=0;n<p;n++)b.push(s());const y=b.join("--"),w=l(),g=l(),x=new Uint8Array(y.split("").map(n=>n.charCodeAt(0))).buffer,m=1===w?pako.inflate(x):x,v=1===w?function(n){n.byteLength;const t=function(n,t){if(n.byteLength<t)return[n];const e=[n.slice(0,t)];let c=t;for(;c+t<n.byteLength;)e.push(n.slice(c,c+t)),c+=t;return e.push(n.slice(c)),e}(n,16384),e=[];for(;t.length>0;)e.push(String.fromCharCode.apply(String,new Uint8Array(t.shift())));const c=e.join("");return e.splice(0,e.length),c}(m):y,O=""===h?m:new Uint8Array((h+v).split("").map(n=>n.charCodeAt(0))).buffer,N=function(){switch(g){case 1:return O;case 2:case 0:return 2===g?JSON.parse(v):h+v}};if(m.byteLength!==d)return o(null);if(!n)return c(N(),u+f);!function(t,e){n.digest("SHA-1",t).then(function(n){e(void 0,function(n){const t=[],e=new DataView(n);if(0===e.byteLength)return"";if(e.byteLength%4!=0)throw new Error("incorrent buffer length - not on 4 byte boundary");for(let n=0;n<e.byteLength;n+=4){const c=e.getUint32(n),o=c.toString(16),r=("00000000"+o).slice(-"00000000".length);t.push(r.substr(6,2)+r.substr(4,2)+r.substr(2,2)+r.substr(0,2))}return t.join("")}(n))}).catch(e)}(O,function(n,e){return c(e===t?N():null,u+f)})}!function(n,t){if(c.cache&&c.cache[n])return;o(function(e){r("${hash}",e,function(e,r){e&&c(e,n,function(e,c){o.cache=r,function n(t){if(!n.cache){for(var e=[],c=[document.body];c.length>0;)for(var o=c.pop(),r=0;r<o.childNodes.length;r++){var i=o.childNodes[r];i.nodeType===Node.COMMENT_NODE?e.push(i):c.push(i)}n.cache=e}const u=n.cache.findIndex(function(n){return n.textContent==="ab:"+t});const f=n.cache.findIndex(function(n){return n.textContent===t+":ab"});if(u<0||f<0)return null;const s=n.cache.splice(u,f+1);s.forEach(function(n){n.parentNode.removeChild(n)})}(n),t(e,c)})})})}("${hash}",function(n){console.log({exports:n,directory:t}),window.directory=t,function(n){const t="${content_hash}";0;o(function(c){r(t,c,function(t,c){t&&(o.cache=c,JSZip.loadAsync(t).then(function(t){t.folder("").forEach(function(n,c){if(!c.dir&&"."!==c.name.charAt(0)){const n="https://"+c.name;let o;Object.defineProperty(e,n,{get:function(r){delete e[n],e[n]=function(n){if(o)return n(o.slice());let t=10;const e=setInterval(function(){o&&(clearInterval(e),n(o.slice())),--t<0&&(clearInterval(e),n())},100)},t.file(c.name).async("arraybuffer").then(function(n){r((o=n).slice())})},enumerable:!0,configurable:!0})}}),n()}).catch(n))})})}(function(n){n||(window.loadZipScript=function(n,t){window.loadZipText(function(n,e){if(n)return t(n);c(e,t)})},window.loadZipText=function(n,t){window.loadZipBuffer(function(n,e){if(n)return t(n);t(void 0,(new TextEncoder).encode(e))})},window.loadZipBuffer=function(n,t){if(!(n in e))return t(new Error("not found"));e[n](function(n){t(void 0,n)})},window.prepareZipSync=function(n,t){if(void 0===n)return window.prepareZipSync(Object.keys(e),t);Promise.all(n.map(function(n){return new Promise(function(t){e[n](t)})})).then(function(e){const c={};n.forEach(function(n,t){c[n]=e[t]}),t(c)})})})})}();
         }

         function htmlUnescapeLib(subtle,pako) {
         
             function toBuffer(x){
                if (typeof x === 'string') {
                    return new TextEncoder().encode(x); 
                } else {
                    return x;
                } 
             }
              
             function toString(x){
                 if (typeof x !== 'string') {
                     return new TextDecoder().decode(x);
                 }  else {
                     return x;
                 }
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
                 while (bytesCopied < newByteLength) {
                     destArray[bytesCopied]=srcArray[bytesCopied];
                     bytesCopied++;
                 }
                 
               
                 return destArray.buffer;
             }
             
             function decodeUint16ArrayFromRawString(str) {
                 return new Uint16Array(str.split('').map((x)=>x.charCodeAt(0)));
             }
             
             function decodeArrayBufferFromRawString (str) {
                 const ui16    = decodeUint16ArrayFromRawString(str);
                 const oddEven = ui16[ui16.length-1];
                 if (oddEven<2) {
                    const storedByteLength = ( (ui16.length-1) * 2 ) - oddEven;
                    return arrayBufferTransfer(ui16.buffer,storedByteLength);
                 }
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
                 const format = getHdrVar();
                    
                 const stored       = decodeArrayBufferFromRawString(raw_stored);
                 const buffer       = pako.inflate(stored) ;
                 const bufferText   = toString( buffer )  ; 
                 const bufferToHash = comment === '' ? buffer : toBuffer(comment+bufferText);
                 
                 const getFormatted = function() {
                    
                     switch (format) {
                         case 1 : return bufferToHash;
                         case 2 :
                         case 0 :
                              
                             return format === 2 ? JSON.parse(bufferText) : comment+bufferText;
                     }
                 };
                 if (buffer.byteLength!==byteLength) return CB(null);
      
                 if (subtle && cb) {     
                     sha1SubtleCB( bufferToHash ,function(err,checkHash){
                           return cb(checkHash===hash?getFormatted():null,before+after); 
                     });
                 } else {
                      return cb ? cb(getFormatted(),before+after) : getFormatted(); 
                 }
                 function sha1SubtleCB(buffer,cb){ 
                         return subtle.digest("SHA-1", buffer)
                            .then(function(dig){cb(undefined,bufferToHex(dig));})
                              .catch(cb); 
                     
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
                      
             return {
                 toBuffer,
                 toString,
                 arrayBufferTransfer,
                 decodeUint16ArrayFromRawString,
                 decodeArrayBufferFromRawString,
                 get_HTML_Escaped_Hash,
                 HTML_UnescapeArrayBuffer
             };

         }
         
         function htmlEscapeLib(crypto,subtle,pako) {
             
             const {
                       toBuffer,
                       toString,
                       arrayBufferTransfer,
                       decodeUint16ArrayFromRawString,
                       decodeArrayBufferFromRawString,
                       get_HTML_Escaped_Hash,
                       HTML_UnescapeArrayBuffer
                   } = htmlUnescapeLib(subtle,pako);
      
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

             function encodeArrayBufferToRawString(ab) {
                 const storing    = ab.slice();
                 const byteLength = storing.byteLength;
                 const oddEven    = byteLength % 2;
                 const storedByteLength = oddEven === 0 ? byteLength + 2 : byteLength + 3;
                 
                 const storage = arrayBufferTransfer(storing, storedByteLength);
                 const storageView = new Uint16Array(storage);
                 storageView[storageView.length-1]=oddEven;
                 return encodeUint16ArrayToRawString(storageView);
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
             
             function HTML_EscapeArrayBuffer(ab,cb){
                 const ab_trimmed    = typeof ab==='string' ? ab.trim() : false;
                 const comment       = typeof ab==='string' && ab_trimmed.indexOf('/*')===0 ? ab_trimmed.substring(2,ab_trimmed.indexOf('*/')) : false;
                 const commentLength = comment ? comment.length+4 : 0;
                 const format        = typeof ab==='string' ? 0 : typeof ab ==='object' && typeof ab.byteLength !== 'undefined' ? 1 : 2;
                 const to_hash       = format !== 1 ? toBuffer(format === 0  ? (comment ? ab_trimmed : ab) : JSON.stringify(ab) ) : ab;
                 const to_store      = format !== 1 ? (format === 0 ? ( comment ? toBuffer(ab_trimmed.substr(commentLength)) : ab ) : to_hash ) :  ab;
                 const deflated      = ml.i.pako.deflate(to_store,{level:9});
                 
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
                                         HTML_EscapeComment([to_store.byteLength||to_store.length,deflate_splits.length,format].map(function(x){return x.toString(36);}).join(','))+
                                         (comment ? '\n'+HTML_EscapeComment(comment)+'\n' : '')+
                                         HTML_EscapeComment(deflate_splits)+
                                         markers.end;
    

                    return deflateHtml;
    
                 }
             }
             
             function compareBuffers(buf,buf2) {
                 const len = buf.byteLength;
                 if (len===buf2.byteLength) {
                     if (len > 0) {
                         const u81 = Uint8Array(buf),u82 = Uint8Array(buf2);
                         
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
              
             function arrayBufferEncodingTests() {

             
             function getRandomValues(array) {
                 const max_length = 1024 * 64;
                 if (array.length< max_length) return crypto.getRandomValues(array);
                 
                 let offset = 0,limit=array.byteLength-max_length;
                 while (offset<limit) {
                     crypto.getRandomValues(new Uint8Array (array.buffer,offset,max_length));
                     offset +=max_length;
                 }
                 const remain = array.byteLength-offset;
                 if (remain>0) {
                    crypto.getRandomValues(new Uint8Array (array.buffer,offset,remain));
                 }
             }
             
             function randomRoundTrip(size) {
                  const array = new Uint8Array (size);
                  const expectedStoredSize = ((size+(size % 2)) >> 1) + 1;
                  getRandomValues(array);
                  const buffer = array.buffer;
                  if (buffer.byteLength !== size) throw new Error("incorrect pre encoded buffer size");
                  
                  const encoded = encodeArrayBufferToRawString(buffer);
                  
                  if (encoded.length !== expectedStoredSize) throw new Error("incorrect encoded size");
                  
                  
                  
                  const decoded = decodeArrayBufferFromRawString(encoded);
                  if (decoded.byteLength !== size) throw new Error("incorrect decoded size");
                  const decodedArray = new Uint8Array(decoded);
                  
                  for (let i=0;i<size;i++) {
                      if (decodedArray[i]!==array[i]) throw new Error("byte mismatch at offset "+i);
                  }
                  
                  const html2 = HTML_EscapeArrayBuffer(buffer);
                  const hash2 = get_HTML_Escaped_Hash (html2);
                  const decoded2 = HTML_UnescapeArrayBuffer(hash2,html2);
                  const decodedArray2 = new Uint8Array(decoded2);
                  for (let i=0;i<size;i++) {
                      if (decodedArray2[i]!==array[i]) throw new Error("byte mismatch at offset "+i);
                  }
                  
                  
                  const str_test3 = "this is a string "+Math.random().toString();
                  const html3 = HTML_EscapeArrayBuffer(str_test3);
                  const hash3 = get_HTML_Escaped_Hash (html3);
                  const decoded3 = HTML_UnescapeArrayBuffer(hash3,html3);
                  
                   if (decoded3!==str_test3) throw new Error("string decode does not match");
                  
                  const str_test4 = "/*blah*/\nthis is a string with a leading comment"+Math.random().toString();
                 
                  const html4 = HTML_EscapeArrayBuffer(str_test4);
                  const hash4 = get_HTML_Escaped_Hash (html4);
                  const decoded4 = HTML_UnescapeArrayBuffer(hash4,html4);
                  if (decoded4!==str_test4) throw new Error("string decode does not match");

                  return true;
             }
             
             
             for (let i = 0; i < 16 ; i ++ ) {
                 // a few small blocks less than 8 bytes, both odd even lengths
                 randomRoundTrip(1);
                 randomRoundTrip(4);
                 randomRoundTrip(5);
                 randomRoundTrip(7);
                 
                 // a few blocks between 1 and 8192 blocks of odd and even lengths
                 randomRoundTrip(8);
                 randomRoundTrip(16);
                 randomRoundTrip(15);
                 randomRoundTrip(65532);
                 randomRoundTrip(65535);
                 randomRoundTrip(65536);
                 randomRoundTrip(16383);
                 randomRoundTrip(16385);
                 randomRoundTrip(16388);
                 // random chunk between 512 bytes and 512.5kb
                 randomRoundTrip( 512 + Math.trunc(Math.random() * 512 * 1024 ) );
                 console.log("passed",i+1,"tests...");
             }
             
         }
             
             return {
                 compareBuffers,
                 toBuffer,
                 toString,
                 arrayBufferTransfer,
                 decodeUint16ArrayFromRawString,
                 decodeArrayBufferFromRawString,
                 HTML_EscapeArrayBuffer,
                 get_HTML_Escaped_Hash,
                 HTML_UnescapeArrayBuffer,
                 encodeArrayBufferToRawString,
                 arrayBufferEncodingTests
             };

         }
         
       
       
       
         
    }
    
   
    


});