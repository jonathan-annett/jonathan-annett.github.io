/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`

sha1Lib               |  sha1.js
databasesZip_mware    |  ml.zipfs.middleware/databasesZip.js
editSourceCode_mware  |  ml.zipfs.middleware/editSourceCode.js
forceError_mware      |  ml.zipfs.middleware/forceError.js
injectHelper_mware    |  ml.zipfs.middleware/injectHelper.js
stopSW_mware          |  ml.zipfs.middleware/stopSW.js
    
`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function pwaMiddlewares(  ) {
            
            const sha1 = self.sha1Lib.cb;
            
            
              
           /*
           const isSourceCodeLink = /^(https\:\/\/)(.*)(\.html|\.css|\.js)(\:[0-9]+)?\:[0-9]+$/;
            
            const isIndexPageLink  = /\/index\.html$/;
            
            const indexPageBodyInject = '<iframe frameBorder="0" width="180" height="60" src="ml.pwa.dev.helper.html" style="position:absolute;right:0;top:0;"></iframe>';
            const indexPageBodyInjected = new RegExp(regexpEscape(indexPageBodyInject),'');
            const indexPageBodyInjectAt = /<\/body\>/i;
            const indexPageBodyInjectReplace = indexPageBodyInject + '</body>';
    
           */
           
            const mware_names = [
                                   "databasesZip",
                                   "editSourceCode",
                                   "forceError",
                                   "injectHelper",
                                   "stopSW"
                                ];
                                
            const mware_modnames  = mware_names.map(function(n){ return n+"_mware";});
           
            
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
                 urls_with_helpers,
                 defaultMiddlewareChain) {
                     
                const isLocal = new RegExp( '^'+regexpEscape(location.origin), '' );
            

                // !event.use_no_cors means url is for this domain name,
                const isLocalDomain = function(event, re) {
                    return !event.use_no_cors && ( !re || re.test(event.fixup_url) );
                };
                
                const middleware_tools = {addMiddlewareListener,
                                    databases,
                                    response200,
                                    response500,
                                    fnSrc,
                                    urls_with_helpers,
                                    defaultMiddlewareChain,
                                    isLocalDomain,isLocal,
                                    fetchDefaultResponse};
                mware_modnames.forEach(function(n){
                    const mod = ml.i[n];
                    addMiddlewareListener(function(event){
                        return mod(event,middleware_tools);
                    });
                });
                /*
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
                
                // hot link error messages to editor
                addMiddlewareListener (function (event) {
                    // !event.use_no_cors means url is for this domain name,
                    
                    const fixup_uri = event.fixup_url.replace(isLocal,'');
                    
                    if (isLocalDomain(event) && urls_with_helpers.indexOf(fixup_uri)>=0 ) {
                        return new Promise(function(resolve){
                            
                            
                            fetchDefaultResponse (event,"text",function(html){
                                if (html) {
                                    const localURL = fixup_uri;
                                    
                                    if (indexPageBodyInjectAt.test(html) && !indexPageBodyInjected.test(html)){
                                        console.log("intercepted index html:", localURL);
                                        html = html.replace(indexPageBodyInjectAt,indexPageBodyInjectReplace);
                                    } else {
                                        console.log("skipped index html:", localURL);
                                    }
                                    
                                    response200 (resolve,html,{
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
                });
                
                */
                function fetchDefaultResponse(event,mode,cb) {
                    
                    const alternates = defaultMiddlewareChain;
                    
                    const fetch_response = function(index) {
                        
                        if (index < alternates.length) {
                            const prom = alternates[index](event);
                            if (prom) {
                                prom.then(function(res){
                                    if (res) {
                                       res[mode]().then(cb);
                                    } else {
                                       fetch_response(index+1);
                                    }
                                }).catch (function(e) {
                                    fetch_response(index+1);
                                });
                                
                            }  else {
                                fetch_response(index+1);
                            }
                        } else {
                            cb ();
                        }
                    };
                    
                    fetch_response(0);
                    
                }
            }
            
            
            
            
            
            
        } 
    }, {
        ServiceWorkerGlobalScope: [
            
        ] 
    }

    );


 

});

