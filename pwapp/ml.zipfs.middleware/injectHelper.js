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

        ServiceWorkerGlobalScope: function injectHelper_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );

   const indexPageBodyInject = '<iframe title="development helper" frameBorder="0" width="180" height="60" src="ml.pwa.dev.helper/helper.html" style="position:absolute;right:0;top:0;"></iframe>';
   const indexPageBodyInjected = new RegExp(regexpEscape(indexPageBodyInject),'');
   const indexPageBodyInjectAt = /<\/body\>/i;
   const indexPageBodyInjectReplace = indexPageBodyInject + '</body>';
   const github_zip_index     = /(?:\/)([a-zA-Z0-9\-\_\~]*)\.zip\/(\1)\/index\.html$/;
   const zip_index            = /\.zip\/index\.html$/;
   const generic_index        =  /\/index\.html$/;
   
    function mware(event,middleware) {
       
       const fixup_uri = event.fixup_url.replace(middleware.isLocal,'');

       let isIndexPage = github_zip_index.test(fixup_uri) ||  zip_index.test(fixup_uri);
       
       if (!isIndexPage && generic_index.test(fixup_uri)) {
           
           isIndexPage =  !! middleware.virtualDirDB.virtualDirUrls [ event.fixup_url.replace(event.fixup_url,'') ];
           
       }
       
       if (middleware.isLocalDomain(event) && isIndexPage ) {
           
           return new Promise(function(resolve){
               
               
               middleware.fetchDefaultResponse (event,"text",[
                      middleware.fetchVia.updatedURL,
                      middleware.fetchVia.virtualDir
                   ],function(html){
                   if (html) {
                       const localURL = fixup_uri;
                       
                       if (indexPageBodyInjectAt.test(html) && !indexPageBodyInjected.test(html)){
                           console.log("intercepted index html:", localURL);
                           html = html.replace(indexPageBodyInjectAt,indexPageBodyInjectReplace);
                       } else {
                           console.log("skipped index html:", localURL);
                       }
                       
                       middleware.response200 (resolve,html,{
                           name          : localURL,
                           contentType   : 'text/html',
                           contentLength : html.length
                       });
                       
                   } else {
                       resolve();
                   }
                   
               });
                      
           });
       } 
        
    }
    
    function regexpEscape(str) {
        return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
    }

});

