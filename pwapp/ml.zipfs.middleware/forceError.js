/* global ml  */
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

        ServiceWorkerGlobalScope: function forceError_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );


    function mware(event,middleware) {
       
       if (middleware.isLocalDomain(event,/force\-error\.js$/)) {
           return new Promise(function(resolve){
               return middleware.response500(resolve,new Error("Forced Error to Test Browser"));
           });
       } 
        
    }

});

