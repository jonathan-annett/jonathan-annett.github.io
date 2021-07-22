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

        ServiceWorkerGlobalScope: function databasesZip_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [ ] 
    }

    );


    function mware(event,middleware) {
       
        if ( middleware.isLocalDomain(event,/\/databases\.zip$/)) {
            return new Promise(function(resolve){
               middleware.databases.toZip(function(err,buffer){
                   if (err) {
                       return middleware.response500(resolve,err);
                   }
                   middleware.sha1(buffer,function(err,hash){
                       if (err) {
                           return middleware.response500(resolve,err);
                       }
                       middleware.response200 (resolve,buffer,{
                           name          : event.fixup_url.replace(middleware.isLocal,''),
                           contentType   : 'application/zip',
                           contentLength : buffer.byteLength,
                           etag          : hash,
                       });
                   });
               });
                
            });
        }
        
    }

});

