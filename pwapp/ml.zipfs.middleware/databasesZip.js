/* global ml,BroadcastChannel  */
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
     
     
  function mware(event,middleware) {
        
        
         if ( middleware.isLocalDomain(event,/\/databases\.zip$/)) {
            
            const channelName = "channel_"+Math.random().toString(36)+".zip";
            
            return new Promise(function(resolve){
                
              
               const html = `
               
               <html>
               
               <body>
                standby...
                <div id="ready" style="display:none">
                   You can download the zip <a id = "downloadLink"></a> 
                </div>
                <script>
                
                var channelName = "${channelName}";
                
                ${
                    middleware.fnSrc(
                    function() {
                
                       
                       const channel = new BroadcastChannel(channelName );
                       
                       channel.onmessage = function (event) {

                                      createBlobDownloadLink (
                                        "path/databases.zip",
                                        document.body.querySelector("#downloadLink"),
                                        "here",
                                        event.data.blob  );
                                    
                                    document.querySelector("#ready").style.display="block";
                                  
                                  channel.close();
                                  
                        };

                      
                       
                       function createBlobDownloadLink(url,linkEl,linkText,blob ) {
                           
                           const data_link = URL.createObjectURL(blob);
                                   
                           if (linkEl){    
                               const link = document.createElement("a");
                               link.download = url.split('/').pop();
                               link.href = data_link;
                               link.appendChild(new Text(linkText||"Download data"));
                               link.addEventListener("click", function() {
                                   this.parentNode.removeChild(this);
                                   // remember to free the object url, but wait until the download is handled
                                   setTimeout(revoke, 500)
                               });
                               linkEl.appendChild(link);
                               
                               return revoke;
                           }
                           
                           
                           function revoke(){URL.revokeObjectURL(data_link);}
                           
                     
                       }
              
                         
                
                
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
                       
                       const channel = new BroadcastChannel(channelName );
                       const blob = new Blob([buffer], {type: "image/png"});
                                   
                       channel.postMessage({blob:blob});
                       
                         
                       channel.close();
                       

                   });
               });
                
            });
        }
        
    }

});

