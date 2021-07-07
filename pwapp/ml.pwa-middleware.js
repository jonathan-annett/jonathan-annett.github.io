/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   'sha1Lib                                | sha1.js',

    
    ],function(){ml(2,ml(3),ml(4),

    {

        ServiceWorkerGlobalScope: function pwaMiddlewares(  ) {
            
            const sha1 = self.sha1Lib.cb;
            
            
            const isLocal = new RegExp( '^'+regexpEscape(location.origin), '' );
            
            
            const isSourceCodeLink = /^(https\:\/\/)(.*)(\.html|\.css|\.js)(\:[0-9]+)?\:[0-9]+$/;
            
            
            return middlewares;
            
            
            function regexpEscape(str) {
                return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
            }
            

             function middlewares (addMiddlewareListener,databases,response200,response500,fnSrc) {
                
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
                                const html  =  [
                                    '<html>',
                                    
                                    '<head>',
                                    '</head>',
                                    
                                    
                                    '<body>',
                                    
                                    '<h1> Editing ',
                                    
                                    event.fixup_url,
                                    
                                    
                                    '</h1>',
                                    
                                    '<script src="ml.js"></script>',
                                    '<script src="ml.zedhook.js"></script>',
                                    '<script>',
                                    
                                    'var filename = '+JSON.stringify(event.fixup_url)+';',
                                    
                                    fnSrc((editInZed,filename)=>{
                                        
                                        window.addEventListener('zedhookready',function(){
                                            editInZed(filename,function(){
                                                window.close();
                                            });
                                        });

                                    }),
                                    
                                    '</script>',
                                    '</body>',
                                    
                                    '</html>',
                                    
                                ].join('\n')
                                
                                
                                
                                   response200 (resolve,html,{
                                       contentType   : 'text/html',
                                       contentLength : html.length
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

