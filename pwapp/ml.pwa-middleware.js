/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   'sha1Lib                                | sha1.js',
   'editInZed                              | ml.zedhook.js'
    
    ],function(){ml(2,ml(3),ml(4),

    {

        ServiceWorkerGlobalScope: function pwaMiddlewares(  ) {
            
            const sha1 = self.sha1Lib.cb;
            
            
            const isLocal = new RegExp( '^'+regexpEscape(location.origin), '' );
            
            
            const isSourceCodeLink = /^(https\:\/\/)(.*)(\.html|\.css|\.js)(\:[0-9]+)?\:[0-9]+$/;
            
            
            const editInZedHtml = self.editInZed.zedhookHtml;
            
            return middlewares;
            
            
            function regexpEscape(str) {
                return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
            }
            

             function middlewares (addMiddlewareListener,databases,response200,response500,fnSrc,fixupURL) {
                
                addMiddlewareListener (function (event) {
                    // !event.use_no_cors means url is for this domain name,
                    if (!event.use_no_cors &&  /\/databases\.zip$/.test(event.fixup_url)) {
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
                
                addMiddlewareListener (function (event) {
                    // !event.use_no_cors means url is for this domain name,
                    if (!event.use_no_cors &&  isSourceCodeLink.test(event.fixup_url)) {
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
                
                
                
                addMiddlewareListener (function (event) {
                    // !event.use_no_cors means url is for this domain name,
                    if (!event.use_no_cors &&  /force\-error\.js$/.test(event.fixup_url)) {
                        return new Promise(function(resolve){
                            return response500(resolve,new Error("Forced Error to Test Browser"));
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

