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


    function mware(event,middleware) {
       
       return new Promise(function(resolve){
           
           if (event.fixup_url.endsWith("/virtual.json")) {
               const json = JSON.stringify(middleware.virtualDirDB,undefined,4);
               return resolve(new Response(json, {
                 status: 200,
                 headers: new Headers({
                   'Content-Type'   : 'application/json',
                   'Content-Length' : json.length
                 })
               }));
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
           
       });
        
    }

});

