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
zipFSResponseLib                       | ${ml.c.app_root}ml.zipfs.response.js 
    
`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function virtualDir_mware(  ) {
          return getMWare();
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );
    
    function getMWare() {
    
        const virtual_json_re    = /\/virtual\.json$/;
        const virtual_listing_re = /\/virtual\-listing\.json$/
        const virtual_index_re   = /\/virtual\-index\.json$/;
        
        const { response200_JSON } =  ml.i.zipFSResponseLib;
        
        const mwares = [
            
             { 
                  re : virtual_json_re,
                  fn :function (event,middleware,resolve) {
                      response200_JSON(resolve,middleware.virtualDirDB);
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
                                   return response200_JSON(resolve,listingData);
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
                            return response200_JSON(resolve,result);
                        }
                    };
                    nextVirtualDir(0);
                    return true;   
                  },
    
            } 
            
        ];

        return mware;
        
        function mware(event,middleware) {
            
           return new Promise(function(resolve){
               
               if (!mwares.some(function(x){
                   if (x.re.test(event.fixup_url)) {
                       return x.fn(event,middleware,resolve);
                   }
               })) {
                   
                   middleware.virtualDirQuery (event.fixup_url).then(function(entry){
                       
                       if (entry&& entry.response) {
                           //console.log("resolved virtualDirQuery in middleware for",event.fixup_url,"after",Date.now()-event.startedAt,"msec");
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
    
           });
            
        }
        
    }

});

