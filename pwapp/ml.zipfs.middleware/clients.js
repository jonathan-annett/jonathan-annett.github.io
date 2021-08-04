/* global ml,clients,Headers,Response  */
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

        ServiceWorkerGlobalScope: function clients_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );


    function mware(event,middleware) {
       //  /service-worker-clients.json
       if (middleware.isLocalDomain(event,/\/service\-worker\-clients\.json$/)) {
           return new Promise(function(resolve){
               
               clients.matchAll({includeUncontrolled:true,type:"all"}).then(function(clientList) {
                   const cs = [];
                   for (var i = 0 ; i < clientList.length ; i++) {
                       if (event.clientId !== clientList[i].id ) {
                           cs.push({
                               id:clientList[i].id,
                               type:clientList[i].type,
                               url:clientList[i].url
                           });
                       }
                   }
                   const json = JSON.stringify(cs,undefined,4);
                   resolve(new Response(json, {
                    
                       status: 200,
                       headers: new Headers({
                           'Content-Type': 'application/json',
                           'Content-Length': json.length
                       })
        
                   }));
                   
                
               });
               
           });
       } 
        
    }

});

