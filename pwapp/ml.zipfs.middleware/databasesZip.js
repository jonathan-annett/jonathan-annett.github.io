/* global ml,BroadcastChannel,channelName  */
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

sha1Lib                                    |  sha1.js
progressHandler                            |  ml.progressHandler.js
databasesZipHtml@ServiceWorkerGlobalScope  |  ml.zipfs.middleware/databasesZip.html

`,function(){ml(2,

    {
        Window : function databasesZip_mware(  ) {
            
            
            if (["interactive","complete"].indexOf( window.document && window.document.readyState) >=0) {
                onDOMContentLoaded();
            } else {
               window.addEventListener('DOMContentLoaded', onDOMContentLoaded);
            }
            
            function onDOMContentLoaded (){
                
            const channel = new BroadcastChannel( channelName );
            
            ml.i.progressHandler(0,1,"loadProgress","loadProgressText","zipProgress");
      
            channel.onmessage = function (event) {
        
                     const link =  document.body.querySelector("#downloadLink");

                     const revoke = createBlobDownloadLink (
                         "path/databases.zip",
                          link,
                         "here",
                         event.data.blob  );
                     
                     document.querySelector("#ready").style.display="block";
                     
                     
                     channel.close();
                   
             };

            }
            
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
   
         
            
        },
        ServiceWorkerGlobalScope: function databasesZip_mware(  ) {
          
          return mware;
          
        } 
    }, {
        Window : [],
        ServiceWorkerGlobalScope: [ ] 
    }

    );

    const sha1 = ml.i.sha1Lib.cb;
    
     
  function mware(event,middleware) {
        
         const progressHandler = ml.i.progressHandler; 
         
         if ( middleware.isLocalDomain(event,/\/databases\.zip$/)) {
            
            
            
            return new Promise(function(resolve){
                
               ml.i.databasesZipHtml(function(html,renderer){
                   
                   const channelName = "channel_"+Math.random().toString(36)+".zip";
                   
                   html = renderer({channelName},html);
                    
                   middleware.response200 (resolve,html,{
                       name          : event.fixup_url.replace(middleware.isLocal,''),
                       contentType   : 'text/html',
                       contentLength : html.length,
                   });
                   
                   
                   var prog;
                    
                   middleware.databases.toZip(
                       undefined,
                       function (n, of_n,file){
                           
                          if (n===0) {
                              prog = progressHandler (0,of_n,"zipProgress") ;
                          } else {
                              prog && prog.setComplete(n,file);
                          }
                           
                       },
                       function(err,buffer){
                       if (err) {
                           return middleware.response500(resolve,err);
                       }
                       sha1(buffer,function(err,hash){
                           if (err) {
                               return middleware.response500(resolve,err);
                           }
                           
                           const channel = new BroadcastChannel(channelName );
                           const blob = new Blob([buffer], {type: "application/zip"});
                                       
                           channel.postMessage({blob:blob});
                           
                           channel.close();
                           
    
                       });
                   });
                   
                   
                   

               });    
             
              
              
            
                
            });
            
            
        }
        
    }

});

