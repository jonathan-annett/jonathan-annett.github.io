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
         
      
*/

/*jshint -W054 */

ml(`
  
minify           |   ${ml.c.app_root}uglify-online/uglify/lib/minify.js
Dictionary       |   ${ml.c.app_root}uglify-online/uglify/lib/utils.js
AST_Token        |   ${ml.c.app_root}uglify-online/uglify/lib/ast.js
JS_Parse_Error   |   ${ml.c.app_root}uglify-online/uglify/lib/parse.js
TreeTransformer  |   ${ml.c.app_root}uglify-online/uglify/lib/transform.js
SymbolDef        |   ${ml.c.app_root}uglify-online/uglify/lib/scope.js
OutputStream     |   ${ml.c.app_root}uglify-online/uglify/lib/output.js
Compressor       |   ${ml.c.app_root}uglify-online/uglify/lib/compress.js
mangleStrings    |   ${ml.c.app_root}uglify-online/uglify/lib/propmangle.js


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
    }
    
   
    


});