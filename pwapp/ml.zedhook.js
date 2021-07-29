

/* global BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib, ErrorStackParser, fixupUrl  */
ml(`
    
    pwaWindow@Window                           | ml.pwa-win.js'
    sha1Lib@Window                             | sha1.js'
    StackFrame@ServiceWorkerGlobalScope        | stack-frame.js
    ErrorStackParser@ServiceWorkerGlobalScope  | error-stack-parser.js'
   
    `,function(){ml(2,

    {

        Window: function editInZed(findWorker,sendMessage,pwa,sha1,path ) {
            
            
            // the setTimeout is to give the module loader a chance to save the return value into self.
            setTimeout(function(){ 
                    if (["interactive","complete"].indexOf( window.document && window.document.readyState) >=0) {
                        setTimeout(onDOMContentLoaded,0);// see above.
                    } else {
                       window.addEventListener('DOMContentLoaded', onDOMContentLoaded);
                    }
            },0);
            
           editFileInZed.zedhookHtml = zedhookHtml;
           
           return editFileInZed;
           

           function onDOMContentLoaded (){
                  window.dispatchEvent( 
                      new CustomEvent( 'zedhookready',{  detail: {    } })
                  );
                  
           }
           
           function editFileInZed(url,urls,url_root,cb){
               if (typeof url_root==='function') {
                   cb   = url_root;  
                   url_root = location.href.substr(0,location.href.lastIndexOf("/"));
               }
             
               
               if (typeof urls==='function') {
                   cb   = urls; 
                   url_root = location.href.substr(0,location.href.lastIndexOf("/"));
                   urls = [url];
               }
             
              const fix_filename = function(u){ return u.indexOf(url_root) === 0 ? u.substr(url_root.length) : u; };
              
              const filename = fix_filename(url);
              
              const page_directory=['/.zedstate'].concat(urls.map(fix_filename));
               
              const modified_files = {};
               
              modified_files[filename]=1;
              
              zipFS_apiHook(filename).onunmount = onEditorClose;

                const pwaApi = {
                   
                   deleteFile       : function (file,cb) {
                         return cb();
                   },
                   
                   removeUpdatedURLContents  : function (file,cb) {
                      return pwa.removeUpdatedURLContents(
                          path.join(url_root,file),
                          //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                          function(err,msg){
                             if(cb)cb(err,msg); 
                          });
                   },
                   
                   updateURLContents : function (file,content,hash,cb) {
                       return pwa.updateURLContents(
                           path.join(url_root,file),
                           //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                           content,hash,
                           function(err,msg){
                               if(cb)cb(err,msg && msg.hash);
                           }
                       );
                   },
                   
                   fetchUpdatedURLContents : function (file,hash,cb) {
                       return pwa.fetchUpdatedURLContents(
                           path.join(url_root,file),hash,
                           function(err,msg){
                              if (err) return cb (err);
                              cb(undefined,msg.content,msg.updated,msg.hash);
                           }
                       );
                   },
                   

                };
                
                
               
                
                function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
               
                function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}
                
                function zipFS_apiHook (initial_path) {
                    
                    
                    
                    if (zipFS_apiHook.singleton) {
                        
                        return zipFS_apiHook.singleton.open(initial_path);
                        
                    }
                    
                    var zedstate;
                    const api_id = Math.random().toString(36).substr(-8),
                          api_call_event_name = 'zipFS_apiCall_'+api_id,
                          tags = {
                              
                              
                          },
                          leadingSlash = /^\//,
                          self = {},
                          fs_api = fsZipApi();
          
                    window.addEventListener(api_call_event_name,apiCall);
                    
                    
                    window.addEventListener('beforeunload',windowUnloading);
    
    
                    Object.defineProperties (self,{
                        open : { value : openFile }
                    });
                    
                    zipFS_apiHook.singleton = self;
                    return self.open(initial_path);
                    
                    
                    function windowUnloading () {
                        // invoked by browser when user closes BROWSER window
                        window.removeEventListener('beforeunload',windowUnloading);
                        window.removeEventListener(api_call_event_name,apiCall);
                        window.dispatchEvent( 
                            new CustomEvent( 'zipFS_apiHook',{  detail: {  api_id : api_id,  zipfs: url_root, unloading:true  } })
                        );
                         
                    }
                    
                    function openFile(file) {
                         initial_path = file;
                         if(page_directory.indexOf(file)<0) {
                             page_directory.push(file);
                         }
                         window.dispatchEvent( 
                             new CustomEvent( 'zipFS_apiHook',{  detail: {  api_id : api_id,  zipfs: url_root, file : initial_path  } })
                         );
                         return zipFS_apiHook.singleton;
                    }
                    
                    function fsZipApi() {
                        return {
                                   
                                   listFiles: function(reqId) { 
                                       window.dispatchEvent( 
                                           new CustomEvent( 'zipFS_'+reqId,{  detail: {  resolve : reqId, resolveData:page_directory.map(prependSlash) } })
                                       );
                                   },
                                   
                                   readFile: function(reqId,path) { 
                                       
                                       const filename = path.replace(leadingSlash,'/');
                                       const replyMsgId = 'zipFS_'+reqId;
                                       if (path === "/.zedstate") {
                                           
                                           getZedState(function(json){
                                               return window.dispatchEvent(
                                                   new CustomEvent('zipFS_'+reqId,{  
                                                       detail: {  
                                                           resolve : reqId, 
                                                           resolveData:json
                                                       }})
                                               );
                                           });
                                       }
                                       
                                       pwaApi.fetchUpdatedURLContents(filename,true,function (err,buffer,hash) {
                                          if (err) {
                                              return window.dispatchEvent( 
                                                  new CustomEvent( 'zipFS_'+reqId,{  detail: {  reject : reqId, resolveData:err.message||err }})
                                              );
                                          }
                                          tags[path] = hash;
                                          window.dispatchEvent( 
                                              new CustomEvent('zipFS_'+reqId,{  detail: {  resolve : reqId, resolveData:bufferToText(buffer) }})
                                          );
                                       });
                                       
                                   },
                                   
                                   writeFile: function(reqId,path,content) { 
                                       const filename = path.replace(leadingSlash,'');
                                       const replyMsgId = 'zipFS_'+reqId;
                                       
                                       
                                       
                                       if (path === "/.zedstate") {
                                           
                                           setZedState(content,function(){
                                              window.dispatchEvent( 
                                                  new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                              );
                                           });
                                       }
                                       
                                       pwaApi.updateURLContents(filename,content,true,function (err,hash) {
                                           
                                           if (err) {
                                               return window.dispatchEvent( 
                                                   new CustomEvent( replyMsgId,{  detail: {  reject : reqId, resolveData:err.message||err }})
                                               );
                                           }
                                           
                                           tags[path] = hash;
                                           window.dispatchEvent( 
                                               new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                           );
                                           
    
                                       });
                                        
                                       
                                   },
                                   
                                   deleteFile: function(reqId,path) { 
                                       const filename = path.replace(leadingSlash,'');
                                       const replyMsgId = 'zipFS_'+reqId;
                                       
                                       pwaApi.deleteFile(filename,function (err) {
                                           
                                           if (err) {
                                               return window.dispatchEvent( 
                                                   new CustomEvent( replyMsgId,{  detail: {  reject : reqId, resolveData:err.message||err }})
                                               );
                                           }
                                           
                                           window.dispatchEvent( 
                                               new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                           );
             
                                       });
                                       
                                       
                                       
                                   },
                   
                                  // watchFile: function(reqId) {},
                                   
                                  // unwatchFile: function(reqId) {},
                                   
                                   getCacheTag: function(reqId,path) { 
                                       
                                       
                                       const filename = path.replace(leadingSlash,'');
                                       const replyMsgId = 'zipFS_'+reqId;
                                       
                                        if (tags[path]) {
                                             return window.dispatchEvent( 
                                                 new CustomEvent(replyMsgId,{  detail: {  resolve : tags[path] }})
                                             );
                                        } else {
                                            
                                            pwaApi.readFileString(filename,true,function (err,data) {
                                                if (err) {
                                                   return window.dispatchEvent( 
                                                       new CustomEvent( replyMsgId,{  detail: {  resolve : '1' }})
                                                   );
                                                }
                                                
                                                tags[path] = data.hash;
                                                delete data.text;
                                                delete data.hash;
                                                
                                                return window.dispatchEvent( 
                                                    new CustomEvent( replyMsgId,{  detail: {  resolve : tags[path] }})
                                                );
                                            });
                                            
                                        }
                                   },
                                   
                                   getCapabilities: function(reqId) { },
                                   
                                   unmount : function (reqId) {
                                        // this zip file is being unmounted.
                                        
                                        if (self.onunmount) {
                                            self.onunmount();
                                        }
                                        const replyMsgId = 'zipFS_'+reqId;
                                        window.dispatchEvent( 
                                            new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                        );
                                        window.removeEventListener(api_call_event_name,apiCall);
                                        window.removeEventListener('beforeunload',windowUnloading);
                                        zedstate=undefined;
                                        initial_path=undefined;
                                        delete zipFS_apiHook.singleton;
                                        
                                        // pedantically releas each refrenceed object / function
                                        Object.keys(fs_api).forEach(function (fn){
                                            delete fs_api[fn];
                                        });
                                        
                                       
                                        
                                        Object.keys(self).forEach(function (fn){
                                            delete self[fn];
                                        });
                                   } 
                               };
                        
                        
                    }
    
                    function apiCall (event) {
                        
                        if (event.detail.closed) {
                            return window.removeEventListener(api_call_event_name,apiCall);   
                        }
    
                        const cmd     = Object.keys(event.detail.api_msg)[0];
                        const args    = event.detail.api_msg[cmd];
                        const handler = fs_api[cmd];
                        if (handler && args) {
                            handler.apply(this,[event.detail.request].concat(args));
                        }
                        
    
                    }
                    
                    function bufferToHash(path,buffer,cb) {
                        sha1(buffer,function(err,hash){
                            if (err) {
                                tags[path]=1;
                            } else {
                                tags[path]=hash;
                            }
                            const anchor = qs('a[data-filename="'+path.replace(leadingSlash,'')+'"]');
                            if (anchor) {
                                const sh = anchor.parentElement.querySelector('span.sha1');
                                if (sh) {
                                    sh.innerHTML=hash;
                                }
                            }
                            cb(hash);
                        });
                    }
                    
                    function bufferToTextAndHash(path,buffer,cb) {
                        bufferToHash(path,buffer,function(hash){
                            cb(bufferToText(buffer),hash);
                        })
                    }
                   
                    function prependSlash(x) { return "/"+x.replace(leadingSlash,'');}
                    
                    function removePrependedSlash (x) { return x.replace(leadingSlash,'') }
    
                    function getZedState(cb) {
                        if (!zedstate) {
                            zedstate = JSON.stringify({"session.current": [ '/'+initial_path.replace(leadingSlash,'')  ]});
                        }
                        return cb (zedstate);
                    } 
    
                    function setZedState (json,cb) {
                        zedstate = json;
                        cb();
                    }
                    
                }
                
                function onEditorClose () {
                    Object.keys(modified_files).forEach(function(file){
    
                        delete modified_files[file];
                    });
                    
                    if (typeof cb==='function') {
                        cb();
                    }
                }
                
            
               
                
            
           }

        },
        ServiceWorkerGlobalScope : function editInZed(path) {
            
              return {
                zedhookHtml      : zedhookHtml,
                zedhookErrorHtml : zedhookErrorHtml
            }
        }
    }, {
        Window: [
            
            ()=>self.pwaWindow.findWorker, 
            ()=>self.pwaWindow.sendMessage,
            ()=>self.pwaWindow,
            ()=>self.sha1Lib.cb,
            ()=>nodePath()
            
        ],
        ServiceWorkerGlobalScope: [
            ()=>nodePath()
        ],
        
    }

    );

const isLocal = new RegExp( '^'+regexpEscape(location.origin), '' );


const isSourceCodeLink = /^(https\:\/\/)(.*)(\.html|\.css|\.js)(\:[0-9]+)?\:[0-9]+$/;



    function zedhookHtml ( url ) {
        
        
        return [
            '<html>',
            
            '<head>',
            '</head>',
            
            
            '<body>',
            
            '<h1> Editing ' + url.split('/').pop()|| url,
            
            
            '</h1>',
            
            '<script src="ml.js"></script>',
            '<script src="ml.zedhook.js"></script>',
            '<script>',
            
            'var filename = '+JSON.stringify(url)+';',
            
            fnSrc((editInZed,filename)=>{
                window.addEventListener('zedhookready',function(){
                    editInZed(filename,function(){
                        //window.close();
                    });
                });
            }),
            
            '</script>',
            '</body>',
            
            '</html>',
            
        ].join('\n');
        
    }
    
    function zedhookErrorHtml (error) {
        
       self.ErrorStackParser = ml.i.ErrorStackParser;
       self.StackFrame       = ml.i.StackFrame;
       
       const stack = ErrorStackParser.parse( error );
       
       const urls  = stack.map(function (el){
           return {url : fixupUrl(el.fileName), line : el.lineNumber, col : el.columnNumber };
       }).filter(function (el){
           return isLocal.test(el.url);
       }).map(function (el) {
           switch (typeof el.line+typeof el.col ) {
               case 'numbernumber' : 
                   return el.url+':'+el.line+':'+el.col;
               case  'numberundefined' : return el.url+':'+el.line;
           }

           return el.url;
       });
       
       
       return [
           '<html>',
           
           '<head>',
           '</head>',
           
           
           '<body>',
           
           '<h1> Error: ' + error.message,
           
           
           '</h1>',
           
           '<h2>Stack:</h2>',
           '<pre>',
           
           error.stack,
           
           '</pre>',
           
           '<h2>Zed Links</h2>',
           
           urls.map(function(u){
               return '<a href="'+u+'">'+u.split('/').pop()+'</a>'
           }).join('<br>\n'),
           
           '<script src="ml.js"></script>',
           '<script src="ml.zedhook.js"></script>',
           '<script>',
           
           'var filenames = '+JSON.stringify(urls)+',filename=filenames[0];',
           
           fnSrc((editInZed,filename,filenames)=>{
               window.addEventListener('zedhookready',function(){
                   editInZed(filename,filenames,function(){
                       //window.close();
                   });
               });
           }),
           
           '</script>',
           '</body>',
           
           '</html>',
           
       ].join('\n')
       
    }
    
      
    function regexpEscape(str) {
        return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
    }
    

    
    function fnSrc(f,k,c) {
        f = f.toString();
        if (c) {
           f=f.replace(/(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/)|\/\/.*?[\r\n])[\r\n]*/,'');
        }
        return k?f:f.substring(f.indexOf("{")+1,f.lastIndexOf("}")-1);
    }
    
    function nodePath ( ) {
          // 'path' module extracted from Node.js v8.11.1 (only the posix part)
          // transplited with Babel
          
          // Copyright Joyent, Inc. and other Node contributors.
          //
          // Permission is hereby granted, free of charge, to any person obtaining a
          // copy of this software and associated documentation files (the
          // "Software"), to deal in the Software without restriction, including
          // without limitation the rights to use, copy, modify, merge, publish,
          // distribute, sublicense, and/or sell copies of the Software, and to permit
          // persons to whom the Software is furnished to do so, subject to the
          // following conditions:
          //
          // The above copyright notice and this permission notice shall be included
          // in all copies or substantial portions of the Software.
          //
          // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
          // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
          // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
          // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
          // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
          // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
          // USE OR OTHER DEALINGS IN THE SOFTWARE.
          
          'use strict';
          
          function assertPath(path) {
            if (typeof path !== 'string') {
              throw new TypeError('Path must be a string. Received ' + JSON.stringify(path));
            }
          }
          
          // Resolves . and .. elements in a path with directory names
          function normalizeStringPosix(path, allowAboveRoot) {
            var res = '';
            var lastSegmentLength = 0;
            var lastSlash = -1;
            var dots = 0;
            var code;
            for (var i = 0; i <= path.length; ++i) {
              if (i < path.length)
                code = path.charCodeAt(i);
              else if (code === 47 /*/*/)
                break;
              else
                code = 47 /*/*/;
              if (code === 47 /*/*/) {
                if (lastSlash === i - 1 || dots === 1) {
                  // NOOP
                } else if (lastSlash !== i - 1 && dots === 2) {
                  if (res.length < 2 || lastSegmentLength !== 2 || res.charCodeAt(res.length - 1) !== 46 /*.*/ || res.charCodeAt(res.length - 2) !== 46 /*.*/) {
                    if (res.length > 2) {
                      var lastSlashIndex = res.lastIndexOf('/');
                      if (lastSlashIndex !== res.length - 1) {
                        if (lastSlashIndex === -1) {
                          res = '';
                          lastSegmentLength = 0;
                        } else {
                          res = res.slice(0, lastSlashIndex);
                          lastSegmentLength = res.length - 1 - res.lastIndexOf('/');
                        }
                        lastSlash = i;
                        dots = 0;
                        continue;
                      }
                    } else if (res.length === 2 || res.length === 1) {
                      res = '';
                      lastSegmentLength = 0;
                      lastSlash = i;
                      dots = 0;
                      continue;
                    }
                  }
                  if (allowAboveRoot) {
                    if (res.length > 0)
                      res += '/..';
                    else
                      res = '..';
                    lastSegmentLength = 2;
                  }
                } else {
                  if (res.length > 0)
                    res += '/' + path.slice(lastSlash + 1, i);
                  else
                    res = path.slice(lastSlash + 1, i);
                  lastSegmentLength = i - lastSlash - 1;
                }
                lastSlash = i;
                dots = 0;
              } else if (code === 46 /*.*/ && dots !== -1) {
                ++dots;
              } else {
                dots = -1;
              }
            }
            return res;
          }
          
          function _format(sep, pathObject) {
            var dir = pathObject.dir || pathObject.root;
            var base = pathObject.base || (pathObject.name || '') + (pathObject.ext || '');
            if (!dir) {
              return base;
            }
            if (dir === pathObject.root) {
              return dir + base;
            }
            return dir + sep + base;
          }
          
          var posix = {
            // path.resolve([from ...], to)
            resolve: function resolve() {
              var resolvedPath = '';
              var resolvedAbsolute = false;
              var cwd;
          
              for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
                var path;
                if (i >= 0)
                  path = arguments[i];
                else {
                  if (cwd === undefined)
                    cwd = process.cwd();
                  path = cwd;
                }
          
                assertPath(path);
          
                // Skip empty entries
                if (path.length === 0) {
                  continue;
                }
          
                resolvedPath = path + '/' + resolvedPath;
                resolvedAbsolute = path.charCodeAt(0) === 47 /*/*/;
              }
          
              // At this point the path should be resolved to a full absolute path, but
              // handle relative paths to be safe (might happen when process.cwd() fails)
          
              // Normalize the path
              resolvedPath = normalizeStringPosix(resolvedPath, !resolvedAbsolute);
          
              if (resolvedAbsolute) {
                if (resolvedPath.length > 0)
                  return '/' + resolvedPath;
                else
                  return '/';
              } else if (resolvedPath.length > 0) {
                return resolvedPath;
              } else {
                return '.';
              }
            },
          
            normalize: function normalize(path) {
              assertPath(path);
          
              if (path.length === 0) return '.';
          
              var isAbsolute = path.charCodeAt(0) === 47 /*/*/;
              var trailingSeparator = path.charCodeAt(path.length - 1) === 47 /*/*/;
          
              // Normalize the path
              path = normalizeStringPosix(path, !isAbsolute);
          
              if (path.length === 0 && !isAbsolute) path = '.';
              if (path.length > 0 && trailingSeparator) path += '/';
          
              if (isAbsolute) return '/' + path;
              return path;
            },
          
            isAbsolute: function isAbsolute(path) {
              assertPath(path);
              return path.length > 0 && path.charCodeAt(0) === 47 /*/*/;
            },
          
            join: function join() {
              if (arguments.length === 0)
                return '.';
              var joined;
              for (var i = 0; i < arguments.length; ++i) {
                var arg = arguments[i];
                assertPath(arg);
                if (arg.length > 0) {
                  if (joined === undefined)
                    joined = arg;
                  else
                    joined += '/' + arg;
                }
              }
              if (joined === undefined)
                return '.';
              return posix.normalize(joined);
            },
          
            relative: function relative(from, to) {
              assertPath(from);
              assertPath(to);
          
              if (from === to) return '';
          
              from = posix.resolve(from);
              to = posix.resolve(to);
          
              if (from === to) return '';
          
              // Trim any leading backslashes
              var fromStart = 1;
              for (; fromStart < from.length; ++fromStart) {
                if (from.charCodeAt(fromStart) !== 47 /*/*/)
                  break;
              }
              var fromEnd = from.length;
              var fromLen = fromEnd - fromStart;
          
              // Trim any leading backslashes
              var toStart = 1;
              for (; toStart < to.length; ++toStart) {
                if (to.charCodeAt(toStart) !== 47 /*/*/)
                  break;
              }
              var toEnd = to.length;
              var toLen = toEnd - toStart;
          
              // Compare paths to find the longest common path from root
              var length = fromLen < toLen ? fromLen : toLen;
              var lastCommonSep = -1;
              var i = 0;
              for (; i <= length; ++i) {
                if (i === length) {
                  if (toLen > length) {
                    if (to.charCodeAt(toStart + i) === 47 /*/*/) {
                      // We get here if `from` is the exact base path for `to`.
                      // For example: from='/foo/bar'; to='/foo/bar/baz'
                      return to.slice(toStart + i + 1);
                    } else if (i === 0) {
                      // We get here if `from` is the root
                      // For example: from='/'; to='/foo'
                      return to.slice(toStart + i);
                    }
                  } else if (fromLen > length) {
                    if (from.charCodeAt(fromStart + i) === 47 /*/*/) {
                      // We get here if `to` is the exact base path for `from`.
                      // For example: from='/foo/bar/baz'; to='/foo/bar'
                      lastCommonSep = i;
                    } else if (i === 0) {
                      // We get here if `to` is the root.
                      // For example: from='/foo'; to='/'
                      lastCommonSep = 0;
                    }
                  }
                  break;
                }
                var fromCode = from.charCodeAt(fromStart + i);
                var toCode = to.charCodeAt(toStart + i);
                if (fromCode !== toCode)
                  break;
                else if (fromCode === 47 /*/*/)
                  lastCommonSep = i;
              }
          
              var out = '';
              // Generate the relative path based on the path difference between `to`
              // and `from`
              for (i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i) {
                if (i === fromEnd || from.charCodeAt(i) === 47 /*/*/) {
                  if (out.length === 0)
                    out += '..';
                  else
                    out += '/..';
                }
              }
          
              // Lastly, append the rest of the destination (`to`) path that comes after
              // the common path parts
              if (out.length > 0)
                return out + to.slice(toStart + lastCommonSep);
              else {
                toStart += lastCommonSep;
                if (to.charCodeAt(toStart) === 47 /*/*/)
                  ++toStart;
                return to.slice(toStart);
              }
            },
          
            _makeLong: function _makeLong(path) {
              return path;
            },
          
            dirname: function dirname(path) {
              assertPath(path);
              if (path.length === 0) return '.';
              var code = path.charCodeAt(0);
              var hasRoot = code === 47 /*/*/;
              var end = -1;
              var matchedSlash = true;
              for (var i = path.length - 1; i >= 1; --i) {
                code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                    if (!matchedSlash) {
                      end = i;
                      break;
                    }
                  } else {
                  // We saw the first non-path separator
                  matchedSlash = false;
                }
              }
          
              if (end === -1) return hasRoot ? '/' : '.';
              if (hasRoot && end === 1) return '//';
              return path.slice(0, end);
            },
          
            basename: function basename(path, ext) {
              if (ext !== undefined && typeof ext !== 'string') throw new TypeError('"ext" argument must be a string');
              assertPath(path);
          
              var start = 0;
              var end = -1;
              var matchedSlash = true;
              var i;
          
              if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
                if (ext.length === path.length && ext === path) return '';
                var extIdx = ext.length - 1;
                var firstNonSlashEnd = -1;
                for (i = path.length - 1; i >= 0; --i) {
                  var code = path.charCodeAt(i);
                  if (code === 47 /*/*/) {
                      // If we reached a path separator that was not part of a set of path
                      // separators at the end of the string, stop now
                      if (!matchedSlash) {
                        start = i + 1;
                        break;
                      }
                    } else {
                    if (firstNonSlashEnd === -1) {
                      // We saw the first non-path separator, remember this index in case
                      // we need it if the extension ends up not matching
                      matchedSlash = false;
                      firstNonSlashEnd = i + 1;
                    }
                    if (extIdx >= 0) {
                      // Try to match the explicit extension
                      if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                          // We matched the extension, so mark this as the end of our path
                          // component
                          end = i;
                        }
                      } else {
                        // Extension does not match, so our result is the entire path
                        // component
                        extIdx = -1;
                        end = firstNonSlashEnd;
                      }
                    }
                  }
                }
          
                if (start === end) end = firstNonSlashEnd;else if (end === -1) end = path.length;
                return path.slice(start, end);
              } else {
                for (i = path.length - 1; i >= 0; --i) {
                  if (path.charCodeAt(i) === 47 /*/*/) {
                      // If we reached a path separator that was not part of a set of path
                      // separators at the end of the string, stop now
                      if (!matchedSlash) {
                        start = i + 1;
                        break;
                      }
                    } else if (end === -1) {
                    // We saw the first non-path separator, mark this as the end of our
                    // path component
                    matchedSlash = false;
                    end = i + 1;
                  }
                }
          
                if (end === -1) return '';
                return path.slice(start, end);
              }
            },
          
            extname: function extname(path) {
              assertPath(path);
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              // Track the state of characters (if any) we see before our first dot and
              // after any path separator we find
              var preDotState = 0;
              for (var i = path.length - 1; i >= 0; --i) {
                var code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                      startPart = i + 1;
                      break;
                    }
                    continue;
                  }
                if (end === -1) {
                  // We saw the first non-path separator, mark this as the end of our
                  // extension
                  matchedSlash = false;
                  end = i + 1;
                }
                if (code === 46 /*.*/) {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1)
                      startDot = i;
                    else if (preDotState !== 1)
                      preDotState = 1;
                } else if (startDot !== -1) {
                  // We saw a non-dot and non-path separator before our dot, so we should
                  // have a good chance at having a non-empty extension
                  preDotState = -1;
                }
              }
          
              if (startDot === -1 || end === -1 ||
                  // We saw a non-dot character immediately before the dot
                  preDotState === 0 ||
                  // The (right-most) trimmed path component is exactly '..'
                  preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                return '';
              }
              return path.slice(startDot, end);
            },
          
            format: function format(pathObject) {
              if (pathObject === null || typeof pathObject !== 'object') {
                throw new TypeError('The "pathObject" argument must be of type Object. Received type ' + typeof pathObject);
              }
              return _format('/', pathObject);
            },
          
            parse: function parse(path) {
              assertPath(path);
          
              var ret = { root: '', dir: '', base: '', ext: '', name: '' };
              if (path.length === 0) return ret;
              var code = path.charCodeAt(0);
              var isAbsolute = code === 47 /*/*/;
              var start;
              if (isAbsolute) {
                ret.root = '/';
                start = 1;
              } else {
                start = 0;
              }
              var startDot = -1;
              var startPart = 0;
              var end = -1;
              var matchedSlash = true;
              var i = path.length - 1;
          
              // Track the state of characters (if any) we see before our first dot and
              // after any path separator we find
              var preDotState = 0;
          
              // Get non-dir info
              for (; i >= start; --i) {
                code = path.charCodeAt(i);
                if (code === 47 /*/*/) {
                    // If we reached a path separator that was not part of a set of path
                    // separators at the end of the string, stop now
                    if (!matchedSlash) {
                      startPart = i + 1;
                      break;
                    }
                    continue;
                  }
                if (end === -1) {
                  // We saw the first non-path separator, mark this as the end of our
                  // extension
                  matchedSlash = false;
                  end = i + 1;
                }
                if (code === 46 /*.*/) {
                    // If this is our first dot, mark it as the start of our extension
                    if (startDot === -1) startDot = i;else if (preDotState !== 1) preDotState = 1;
                  } else if (startDot !== -1) {
                  // We saw a non-dot and non-path separator before our dot, so we should
                  // have a good chance at having a non-empty extension
                  preDotState = -1;
                }
              }
          
              if (startDot === -1 || end === -1 ||
              // We saw a non-dot character immediately before the dot
              preDotState === 0 ||
              // The (right-most) trimmed path component is exactly '..'
              preDotState === 1 && startDot === end - 1 && startDot === startPart + 1) {
                if (end !== -1) {
                  if (startPart === 0 && isAbsolute) ret.base = ret.name = path.slice(1, end);else ret.base = ret.name = path.slice(startPart, end);
                }
              } else {
                if (startPart === 0 && isAbsolute) {
                  ret.name = path.slice(1, startDot);
                  ret.base = path.slice(1, end);
                } else {
                  ret.name = path.slice(startPart, startDot);
                  ret.base = path.slice(startPart, end);
                }
                ret.ext = path.slice(startDot, end);
              }
          
              if (startPart > 0) ret.dir = path.slice(0, startPart - 1);else if (isAbsolute) ret.dir = '/';
          
              return ret;
            },
          
            sep: '/',
            delimiter: ':',
            win32: null,
            posix: null
          };
          
          posix.posix = posix;
          
          return  posix;
    }

    
 

});



