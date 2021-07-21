/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`

sha1Lib     | sha1.js
editInZed   | ml.zedhook.js
    
`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function pwaMiddlewares(  ) {
            
            const sha1 = self.sha1Lib.cb;
            
            
            const isLocal = new RegExp( '^'+regexpEscape(location.origin), '' );
            
            
            const isSourceCodeLink = /^(https\:\/\/)(.*)(\.html|\.css|\.js)(\:[0-9]+)?\:[0-9]+$/;
            
            const isIndexPageLink  = /\/index\.js$/;
            
            const editInZedHtml = self.editInZed.zedhookHtml;
            
            return middlewares;
            
            
            function regexpEscape(str) {
                return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
            }
            

             function middlewares (
                 addMiddlewareListener,
                 databases,
                 response200,
                 response500,
                 fnSrc,
                 fetchFileFromCacheEvent,  
                 defaultFetchEvent) {
                
                // !event.use_no_cors means url is for this domain name,
                const isLocalDomain = function(event, re) {
                    return !event.use_no_cors && ( !re || re.test(event.fixup_url) );
                };
                
                // /databases.zip download the databases as a zip file -
                addMiddlewareListener (function (event) {
                   
                    if ( isLocalDomain(event,/\/databases\.zip$/)) {
                        return new Promise(function(resolve){
                           databases.toZip(function(err,buffer){
                               if (err) {
                                   return response500(resolve,err);
                               }
                               sha1(buffer,function(err,hash){
                                   if (err) {
                                       return response500(resolve,err);
                                   }
                                   response200 (resolve,buffer,{
                                       name          : event.fixup_url.replace(isLocal,''),
                                       contentType   : 'application/zip',
                                       contentLength : buffer.byteLength,
                                       etag          : hash,
                                   });
                               });
                           });
                            
                        });
                    }
                    
                });
                
                // hot link error messages to editor
                addMiddlewareListener (function (event) {
                    if ( isLocalDomain(event,isSourceCodeLink)) {
                        return new Promise(function(resolve){
                            
                                   const html  =  editInZedHtml (event.fixup_url);
                                   
                                   response200 (resolve,html,{
                                       name          : event.fixup_url.replace(isLocal,''),
                                       contentType   : 'text/html',
                                       contentLength : html.length
                                   });
                        });
                    } 
                });
            
                // 
                addMiddlewareListener (function (event) {
                    if (isLocalDomain(event,/force\-error\.js$/)) {
                        return new Promise(function(resolve){
                            return response500(resolve,new Error("Forced Error to Test Browser"));
                        });
                    } 
                });
                
                
                // /databases.zip download the databases as a zip file -
                addMiddlewareListener (function (event) {
                    // !event.use_no_cors means url is for this domain name,
                    if (isLocalDomain(event,/\/stop$/)) {
                        return new Promise(function(resolve){
                         
                            const park_url = event.fixup_url.replace(/\/stop$/,'');
                         
                            const html =  [
                               "<html><head></head><body><script>",
                               "location.replace("+JSON.stringify(park_url)+");",
                               "</script></body></html>"                                
                                
                                
                            ].join("\n");
                             
                            response200 (resolve,html,{
                                name          : event.fixup_url.replace(isLocal,''),
                                contentType   : 'text/html',
                                contentLength : html.length
                            });
                            
                            
                             self.registration.unregister() .then(function() { 
                                 
                                 throw "uninstalling";
                                
                             }) .catch(function() { 
                                 
                                 setTimeout(function(){
                                     throw "uninistalled ("+event.fixup_url.replace(isLocal,'')+" invoked)";
                                 },1000);
                               
                                 
                             }); 
                             
                        });
                    }
                    
                }); 
                
                //<iframe width="560" height="315" src="https://css-tricks.com"></iframe>
                
                
                // hot link error messages to editor
                addMiddlewareListener (function (event) {
                    // !event.use_no_cors means url is for this domain name,
                    if (isLocalDomain(event,isIndexPageLink)) {
                        return new Promise(function(resolve){
                            
                            fetchFileFromCacheEvent(event).then(function(response){
                                
                                response.text().then(function(html){
                                    
                                    const localURL = event.fixup_url.replace(isLocal,'');
                                    
                                    console.log("intercepted index html:", localURL);
                                    
                                    response200 (resolve,html,{
                                        name          : localURL,
                                        contentType   : 'text/html',
                                        contentLength : html.length
                                    });
    
                                    
                                });
                                
                               
                            });
                           
                                   
                        });
                    } 
                });
            }
            

            
        } 
    }, {
        ServiceWorkerGlobalScope: [
            
        ] 
    }

    );


 

});

