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
           const tag = "?stop-service-worker=";
           const ix = event.request.url.indexOf(tag);
           if ( ix>=0  ) {
               const park_url = 'https://'+location.hostname+event.request.url.substring(ix+tag.length);
               return new Promise(function(resolve){
                
                   
                   const html =  [
                       
                       
                      "<html>",
                      "<head>",
                        '<meta http-equiv="Refresh" content="0; URL='+park_url+'">',
                      "</head>",
                      
                      "<body><script>",
                      "location = "+JSON.stringify(park_url)+";",
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

