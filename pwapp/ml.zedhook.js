/* global BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib, ErrorStackParser, fixupUrl  */
ml(0,ml(1),[
    
    'pwaWindow@Window                           | ml.pwa-win.js',
    'sha1Lib@Window                             | sha1.js',
    'ErrorStackParser@ServiceWorkerGlobalScope  | error-stack-parser.js',
    'StackFrame@ServiceWorkerGlobalScope        | stack-frame.js'
   
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function editInZed(findWorker,sendMessage,pwa,sha1 ) {
            
            
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
              
              const page_directory=['.zedstate'].concat(urls.map(fix_filename));
               
              const modified_files = {};
               
              modified_files[filename]=1;
              
              zipFS_apiHook(filename).onunmount = onEditorClose;

                const pwaApi = {
                   
                   deleteFile       : function (file,cb) {
                         return cb();
                   },
                   
                   removeUpdatedURLContents  : function (file,cb) {
                      return pwa.removeUpdatedURLContents(
                          url_root+'/'+file,
                          //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                          function(err,msg){
                             if(cb)cb(err,msg); 
                          });
                   },
                   
                   updateURLContents : function (file,content,hash,cb) {
                       return pwa.updateURLContents(
                           url_root+'/'+file,
                           //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                           content,hash,
                           function(err,msg){
                               if(cb)cb(err,msg && msg.hash);
                           }
                       );
                   },
                   
                   fetchUpdatedURLContents : function (file,hash,cb) {
                       return pwa.fetchUpdatedURLContents(
                           url_root+'/'+file,hash,
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
                                       
                                       const filename = path.replace(leadingSlash,'');
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
                            zedstate = JSON.stringify({"session.current": [ '/'+initial_path  ]});
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
                
               
                
            
           }

        },
        ServiceWorkerGlobalScope : function editInZed() {
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
            ()=>self.sha1Lib.cb
            
        ],
        ServiceWorkerGlobalScope: [
            
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
                        window.close();
                    });
                });
            }),
            
            '</script>',
            '</body>',
            
            '</html>',
            
        ].join('\n');
        
    }
    
    function zedhookErrorHtml (error) {
       
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
                       window.close();
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
    
 

});



