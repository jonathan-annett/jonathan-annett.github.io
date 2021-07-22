/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`

databasesZip_mware    |  ml.zipfs.middleware/databasesZip.js
editSourceCode_mware  |  ml.zipfs.middleware/editSourceCode.js
forceError_mware      |  ml.zipfs.middleware/forceError.js
injectHelper_mware    |  ml.zipfs.middleware/injectHelper.js
stopSW_mware          |  ml.zipfs.middleware/stopSW.js
updatedURL_mware      |  ml.zipfs.middleware/updatedURL.js
virtualDir_mware      |  ml.zipfs.middleware/virtualDir.js

`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function pwaMiddlewares(  ) {
            
           
            
            
              
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
                                   "stopSW",
                                   
                                   "updatedURL",
                                   "virtualDir"
                                ];
                                
            const mware_modnames  = mware_names.map(function(n){ return n+"_mware";});
            
            
                                   
            
            return middlewares;
            
            
             function middlewares (addMiddlewareListener,middleware_tools) {
                     
                middleware_tools.isLocal = new RegExp( '^'+regexpEscape(location.origin), '' );
                middleware_tools.regexpEscape = regexpEscape;

                // !event.use_no_cors means url is for this domain name,
                middleware_tools.isLocalDomain = function(event, re) {
                    return !event.use_no_cors && ( !re || re.test(event.fixup_url) );
                };
                middleware_tools.fetchDefaultResponse = fetchDefaultResponse;
                
                middleware_tools.mware_names = mware_names;
                
                middleware_tools.mware_handlers = mware_modnames.map(function(n){
                    const mod = ml.i[n];
                    return function(event){
                        return mod(event,middleware_tools);
                    };
                });
                
                middleware_tools.fetchVia = {};
                
                mware_names.forEach(function(nm,ix){
                    const fn = middleware_tools.mware_handlers[ix];
                    middleware_tools.fetchVia[nm] = fn;
                    addMiddlewareListener(fn);
                });

                function fetchDefaultResponse(event,mode,before,cb) {
                    
                    if (typeof before==='function') {
                        cb=before; before = [];
                    }
                    
                    const alternates = before.concat(middleware_tools.defaultMiddlewareChain);
                    
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
                
                function regexpEscape(str) {
                    return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
                }
                
            }
            
            
            
            
            
            
        } 
    }, {
        ServiceWorkerGlobalScope: [
            
        ] 
    }

    );


 

});

