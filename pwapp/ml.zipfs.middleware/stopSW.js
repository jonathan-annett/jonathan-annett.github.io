/* global ml,self  */
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

        ServiceWorkerGlobalScope: function stopSW_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );


    function mware(event,middleware) {
       
       if (middleware.isLocalDomain(event)) {
           const trigger_url = event.request.referrer.indexOf("?stop-service-worker")>=0 ? event.request.referrer : event.request.url;
           
           if (trigger_url.indexOf("?stop-service-worker")>=0  ) {
               return new Promise(function(resolve){
                
                   const park_url = trigger_url.replace(/\?.*/,'');
                
                   const html =  [
                      "<html><head></head><body><script>",
                      "location.replace("+JSON.stringify(park_url)+");",
                      "</script></body></html>"                                
                       
                       
                   ].join("\n");
                    
                   middleware.response200 (resolve,html,{
                       name          : event.fixup_url.replace(middleware.isLocal,''),
                       contentType   : 'text/html',
                       contentLength : html.length
                   });
                   
                   
                    self.registration.unregister() .then(function() { 
                        
                        throw "uninstalling";
                       
                    }) .catch(function() { 
                        
                        setTimeout(function(){
                            throw "uninistalled ("+event.fixup_url.replace(middleware.isLocal,'')+" invoked)";
                        },1000);
                      
                        
                    }); 
                    
               });
           }
       }
        
    }

});

