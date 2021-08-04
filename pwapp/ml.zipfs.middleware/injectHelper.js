/* global ml  */
/*

  this middleware is not for production, but for development
  it looks for index.html files he root of a zip file, and injects an iframe to assist the inbuilt editor to 
  manipulate css and scripts in real time, for testing.
  as such, this entire middleware module is excluded the built app.
      
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
       
       let fixup_uri        = event.fixup_url.replace(middleware.isLocal,'');
       const might_be_index = generic_index.test(fixup_uri);
       // first look for index.htmls under the root of literal url (or aliased root in the case of zipped github repos) 
       // eg https://example.com/pwapp/somezipfile.zip/index.html
       // eg https://example.com/pwapp/zipped_repo-master.zip/zipped_repo-master/index.html
       let isIndexPage      = might_be_index && github_zip_index.test(fixup_uri) ||  zip_index.test(fixup_uri);
       
       if (!isIndexPage) {
           // ok so not one of those - now see if it's an index inthe root of a virtual dir url
           if (might_be_index) { 
               // if the url points directly to a file called index.html, remove it, so we get the dir name
               // then see if that is a virtual dir.
               isIndexPage = !! middleware.virtualDirDB.virtualDirs[ event.fixup_url.replace(generic_index,'') ] ;
           } else {
               // this url doesn' end in index.html, but if it points to an entry in virtualDirs, it's a virtual dir, so add the index.html
               isIndexPage = !! middleware.virtualDirDB.virtualDirs[ event.fixup_url.replace(/\/$/,'') ];
               if (isIndexPage) {
                   // append the index.html to the url
                   fixup_uri += '/index.html';
               }
           }
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
                       
                       // the url didn't resolve to an actual index.html file, so give up and let the next middleware have a go
                       
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

