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
sha1Lib               |  sha1.js
`,function(){ml(2,

    {

        ServiceWorkerGlobalScope: function databasesZip_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [ ] 
    }

    );

    const sha1 = ml.i.sha1Lib.cb;
    
    const responses = {};
    
    function mware(event,middleware) {
        
        
        if ( middleware.isLocalDomain(event)) {
            
            if ( responses [ event.request.url ] ) {
                return responses [ event.request.url ] 
            }
            
        }
        
       
        if ( middleware.isLocalDomain(event,/\/databases\.zip$/)) {
            
            const url = event.request.url+Math.random().toString(36);
            
            return new Promise(function(resolve){
                
              
               const html = `
               
               <html>
               
               <body>
                standby...
                <div id="ready" style="display:none">
                   You can download the zip <a href="${uri}.zip">here</a> 
                </div>
                <script>
                
                var uri = "${uri}";
                ${
                    middleware.fnSrc(
                    function() {
                
                       function checkReady(cb) {
                           
                           fetch(url,{method:"HEAD"}).then(function(response){
            
                                    if (response.ok) {
                                        cb();
                                    } else {
                                        setTimeout (checkReady,5000,cb);
                                    }
            
                            }).catch(function(){
                                 setTimeout (checkReady,5000,cb);
                             });
                           
                       }
                       
                       
                       
                       checkReady(function(){
                       
                           document.querySelector("#ready").style.display="block";
                       
                       });
                         
                
                
                    }
                    )

                }
                
                </script>
               </body>

               </html>  `;
               
               
               middleware.response200 (resolve,html,{
                   name          : event.fixup_url.replace(middleware.isLocal,''),
                   contentType   : 'text/html',
                   contentLength : html.length,
               });
               
                
                
               middleware.databases.toZip(function(err,buffer){
                   if (err) {
                       return middleware.response500(resolve,err);
                   }
                   sha1(buffer,function(err,hash){
                       if (err) {
                           return middleware.response500(resolve,err);
                       }
                       
                       responses [url+".zip"] = function (event,middleware) {
                           
                           return new Promise(function(resolve){
                               
                               middleware.response200 (resolve,buffer,{
                                   name          : event.fixup_url.replace(middleware.isLocal,''),
                                   contentType   : 'application/zip',
                                   contentLength : buffer.byteLength,
                                   etag          : hash,
                               });
                               
                               
                               setTimeout(function(){
                                  delete responses [url+".zip"] 
                               },60*1000);
                           
                           });
                           
                       }
                       
                       responses [url] = function (event,middleware) {
                           const json = "true";
                           
                           return new Promise(function(resolve){
                               middleware.response200 (resolve,json,{
                                   name          : event.fixup_url.replace(middleware.isLocal,''),
                                   contentType   : 'application/json',
                                   contentLength : json.length
                                   
                               });
                               
                               setTimeout(function(){
                                  delete responses [url];
                               },60*1000);
                               
                               // kill the link in 2 hours 
                               setTimeout(function(){
                                  delete responses [url+".zip"] 
                               },2 * 60 * 60*1000);
                               
                           });
                           
                       }
                   });
               });
                
            });
        }
        
    }

});

