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
ml(`

   editInZed             |  ml.zedhook.js

`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function editSourceCode_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );

    const isSourceCodeLink = /^(https\:\/\/)(.*)(\.html|\.css|\.js)(\:[0-9]+)?\:[0-9]+$/;
            
    function mware(event,middleware) {
                
        const editInZedHtml = ml.i.editInZed.zedhookHtml;
        
        if ( middleware.isLocalDomain(event,isSourceCodeLink)) {
            return new Promise(function(resolve){
                
                       const html  =  editInZedHtml (event.fixup_url);
                       
                       middleware.response200 (resolve,html,{
                           name          : event.fixup_url.replace(middleware.isLocal,''),
                           contentType   : 'text/html',
                           contentLength : html.length
                       });
            });
        } 
        
    }

});

