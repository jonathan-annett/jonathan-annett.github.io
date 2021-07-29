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

ml([],function(){ml(2,

    {

        ServiceWorkerGlobalScope: function virtualDir_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );
    
    
    const virtual_json_re    = /\/virtual\.json$/;
    const virtual_listing_re = /\/virtual\-listing\.json$/
    const virtual_index_re   = /\/virtual\-index\.json$/;
    const virtual_sw_loaded_re = /\/virtual\-sw\-loaded\.json$/;           
   
    const mwares = [
        
         { 
              re : virtual_json_re,
              fn :function (event,middleware,resolve) {
                  const json = JSON.stringify(middleware.virtualDirDB,undefined,4);
                  resolve(new Response(json, {
                    status: 200,
                    headers: new Headers({
                      'Content-Type'   : 'application/json',
                      'Content-Length' : json.length
                    })
                  }));
                  return true;
              },
              
          
            
        },
        
         { 
              re : virtual_listing_re,
              fn :function (event,middleware,resolve) {
                   const zip_url = event.fixup_url.replace(virtual_listing_re,'');
                   middleware.virtualDirListing(zip_url,function(err,listingData){
                       if (err) {
                           console.log(err);
                       } else {
                           if  (listingData) {
                               const json = JSON.stringify(listingData,undefined,4);
                               return resolve(new Response(json, {
                                 status: 200,
                                 headers: new Headers({
                                   'Content-Type'   : 'application/json',
                                   'Content-Length' : json.length
                                 })
                               }));
                           }
                       }
                       resolve();
                   });
                   
                   return true;
              },
              
          
            
        },
        
         { 
              re : virtual_index_re,
              fn :function (event,middleware,resolve) {
                const result = JSON.parse(JSON.stringify(middleware.virtualDirDB));
                const nextVirtualDir = function(index) {
                    
                    if (index < result.virtualDirUrls.length) {
                        const virtualDirUrl = result.virtualDirUrls[index];
                        middleware.virtualDirListing(virtualDirUrl,function(err,listingData){
                            if (err) {
                                console.log(err);
                            } else {
                                if  (listingData) {
                                    result.virtualDirZipBase[virtualDirUrl].files = listingData.files;
                                }
                            }
                            nextVirtualDir(index+1);
                        });
                    } else  {
                        const json = JSON.stringify(result,undefined,4);
                        resolve(new Response(json, {
                          status: 200,
                          headers: new Headers({
                            'Content-Type'   : 'application/json',
                            'Content-Length' : json.length
                          })
                        }));
                    }
                };
                nextVirtualDir(0);
                return true;   
              },
              
              
            
        },
        
         { 
               re : virtual_sw_loaded_re,
               fn :function (event,middleware,resolve) {
                 const result = {
                     "url": location.origin+'/service-worker',
                     "files": {
                         
                     }
                 };
                
                 ml.H.forEach(function(u){
                    const h = ml.h[u];
                    if (h && h.e) {
                        result.files[u] = {
                            url_read  : u,
                            url_write : u
                        };
                    }
                 });
                 
                 const deflate            = ml.i.pako.deflate;
                 const deflateOpts        = { level: 9 };
                 const db                 = middleware.databases.cachedURLS;
                 const pako_re = /\/pako\.js$/;
                 let inflate_url;
                 const getNextFile = function(index){ 
                     
                     if (index < ml.H.length) {
                         
                        const url = ml.H[index];

                        fetchURL(db,url,function(err,buffer) {
                            
                             if (pako_re.test(url)) {
                                 inflate_url = url.replace(pako_re,'/pako.inflate.min.js');
                             }
                             if (err|| !buffer) return middleware.response500(resolve,err||new Error("could not fetch "+url));
                                 bufferTob64(deflate(buffer,deflateOpts),function(b64){
                                      result.files[ url ] = b64;
                                      getNextFile(index+1);
                              });
                           
                         });
                         
                     } else {
                         
                         const json = JSON.stringify(result,undefined,4); 
                         
                         if (inflate_url){
                             fetchURL(db,inflate_url,function(err,buffer) {
                                 const source = [
                                     '/* global ml,Response,Headers,BroadcastChannel  */',
                                     '(function(module){',
                                     '  (function(exports){'+new TextDecoder().decode(buffer)+'})(module.exports);',
                                     '  (function(inflate,dir,importScripts){',
                                     
                                         middleware.fnSrc(ml,true),
                                         
                                         middleware.fnSrc(function(dir,pako,self,importScripts,inflate){
                                             
                                             function inflateb64 (b64) {
                                                 const 
                                                 binary_string = window.atob(b64),
                                                 len = binary_string.length,
                                                 bytes = new Uint8Array(len);
                                                 
                                                 for (let i = 0; i < len; i++) {
                                                     bytes[i] = binary_string.charCodeAt(i);
                                                 }
                                                 return inflate(bytes.buffer);
                                             } 
                                             
                                             function getSrc(url) {
                                                 return !!dir[url] && inflateb64(dir[url]);
                                             }
                                             
                                             function getScript(bound_this,url) {
                                                 return new Function (['bound_self','__filename','__dirname'],
                                                 [
                                                     'return function(){',
                                                         getSrc(url),
                                                     '};'
                                                 ].join('\n').bind(bound_this,url,url)
                                                );
                                             }
                                             
                                             function fakeImportScripts(self,scripts) {
                                                scripts = typeof scripts === 'string' ? [ scripts] :scripts;   
                                                scripts.forEach(function(url){
                                                    const fn = getScript(self,url);
                                                    fn();
                                                }); 
                                                
                                             }
                                             importScripts = fakeImportScripts.bind(undefined,self);
                                             // async load 1-callback per module to pull in tools that bootstrap the amd loader
                                             self.ml=ml;
                                             ml.register=ml.bind(self,8);
                                             ml(9,self);
                                              
                                             
                                         }),
                                    '  })(module.exports.inflate,{,'+json+')',
                                    '})({exports:{}});'

                                  ].join('\n');
                                  
                                  resolve(new Response(source,{
                                      
                                    status: 200,
                                    headers: new Headers({
                                      'Content-Type'   : 'application/javascript',
                                      'Content-Length' : source.length
                                    })
                                    
                                  }));
                             });
                         }
                         
                         
                     }
                     
                 }; 
                 
                 getNextFile (0);

                 return true;   
                 
                 
                 function fetchURL(db,url,cb) {
                     db.getItem(url,function(err,args){
                         if (err||!args) {
                             
                             return fetch(url,{mode:'no-cors'}).then(function(response){
                                if (!err && response.ok) {
                                   
                                    response.arrayBuffer().then(function(buffer){
                                        middleware.updateURLContents (url,db,buffer,function(){
                                            cb(undefined,buffer);
                                        });
                                    }).catch(cb);
                                    
                                }  else {
                                   cb(err||new Error('could not fetch '+url));
                                }
                             }).catch(cb); 
                             
                         }
                         
                         cb(undefined,args[0]);
                     });
                 }
                 
                 function bufferTob64 (arrayBuffer,cb) {
                     var blob = new Blob([arrayBuffer]);
                     
                     var reader = new FileReader();
                     reader.onload = function(event){
                        cb( event.target.result.substr('data:application/octet-stream;base64,'.length) );
                     };
                     
                     reader.readAsDataURL(blob);
                 } 
                 
               },
               
               
             
         },
        
    ];


    function mware(event,middleware) {
        
       return new Promise(function(resolve){
           
           if (!mwares.some(function(x){
               if (x.re.test(event.fixup_url)) {
                   return x.fn(event,middleware,resolve);
               }
           })) {
               
               middleware.virtualDirQuery (event.fixup_url).then(function(entry){
                   
                   if (entry&& entry.response) {
                       
                       const response = entry.response;
                       delete entry.fixup_url;
                       delete entry.response;
                       delete entry.prefix;
                       delete entry.aliased_url;
                       delete entry.url;
                       return resolve(response);
                       
                   } else {
                       
                       if (entry ) {
                           
                            if (entry.aliased_url) {
                               event.aliased_url = entry.aliased_url;
                               delete entry.aliased_url;
                            }
                            
                            if (entry.fixup_url) {
                                event.fixup_url = entry.fixup_url;
                                delete entry.fixup_url;
                            }
                                
                            if (entry.prefix) {
                                event.virtual_prefix = entry.prefix;
                                delete entry.prefix;
                            }
                            
                            delete entry.url;
                       } 
                       
                       resolve();
                   }
                  
               });
           }
           
           /*
           if (virtual_json_re.test(event.fixup_url)) {
               const json = JSON.stringify(middleware.virtualDirDB,undefined,4);
               return resolve(new Response(json, {
                 status: 200,
                 headers: new Headers({
                   'Content-Type'   : 'application/json',
                   'Content-Length' : json.length
                 })
               }));
           }
           
           if (virtual_listing_re.test(event.fixup_url)) {
               
               const zip_url = event.fixup_url.replace(virtual_listing_re,'');
               return middleware.virtualDirListing(zip_url,function(err,listingData){
                   if (err) {
                       console.log(err);
                   } else {
                       if  (listingData) {
                           const json = JSON.stringify(listingData,undefined,4);
                           return resolve(new Response(json, {
                             status: 200,
                             headers: new Headers({
                               'Content-Type'   : 'application/json',
                               'Content-Length' : json.length
                             })
                           }));
                       }
                   }
                   resolve();
               });
              
           }
           
           
            middleware.virtualDirQuery (event.fixup_url).then(function(entry){
               
               if (entry&& entry.response) {
                   
                   const response = entry.response;
                   delete entry.fixup_url;
                   delete entry.response;
                   delete entry.prefix;
                   delete entry.aliased_url;
                   delete entry.url;
                   return resolve(response);
                   
               } else {
                   
                   if (entry ) {
                       
                        if (entry.aliased_url) {
                           event.aliased_url = entry.aliased_url;
                           delete entry.aliased_url;
                        }
                        
                        if (entry.fixup_url) {
                            event.fixup_url = entry.fixup_url;
                            delete entry.fixup_url;
                        }
                            
                        if (entry.prefix) {
                            event.virtual_prefix = entry.prefix;
                            delete entry.prefix;
                        }
                        
                        delete entry.url;
                   } 
                   
                   resolve();
               }
              
           });
           */
       });
        
    }

});

