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
                  
                 const json = JSON.stringify(result); 
                 
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
           };
           
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

