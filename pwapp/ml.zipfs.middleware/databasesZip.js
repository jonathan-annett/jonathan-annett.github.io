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

progressHandler                            |  /pwapp/ml.progressHandler.js
sha1Lib@ServiceWorkerGlobalScope           |  /pwapp/sha1.js
databasesZipHtml@ServiceWorkerGlobalScope  |  /pwapp/ml.zipfs.middleware/databasesZip.html

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
            
            ml.i.progressHandler(0,1,"zipProgress","zipProgressText",channelName+"_progress");
      
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
             
             channel.postMessage("start");

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

 
    
     
  function mware(event,middleware) {
      
         const sha1 = ml.i.sha1Lib.cb;
        
         const progressHandler = ml.i.progressHandler; 
         
         if ( middleware.isLocalDomain(event,/\/databases\.zip$/)) {
            
            
            
            return new Promise(function(resolve){
                
               ml.i.databasesZipHtml(function(err,html,renderer){
                   
                  if (err) {
                      return middleware.response500(resolve,err);
                  }
                   
                   const channelName = "channel_"+Math.random().toString(36)+".zip";
                   
                   
                   html = renderer({channelName},html);
                    
                   middleware.response200 (resolve,html,{
                       name          : event.fixup_url.replace(middleware.isLocal,''),
                       contentType   : 'text/html',
                       contentLength : html.length,
                   });
                   
                   
                   const channel = new BroadcastChannel(channelName );
                   
                   channel.onmessage = function() {
                       
                       var prog;
                        
                       middleware.databases.toZip(
                           undefined,
                           function (n, of_n,file){
                               
                              if (n===0) {
                                  prog = progressHandler (0,of_n,channelName+"_progress") ;
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
                               
                              
                               const blob = new Blob([buffer], {type: "application/zip"});
                                           
                               channel.postMessage({blob:blob});
                               
                               channel.close();
                               
        
                           });
                       });
                       
                   };
                   

                   
                   

               });    
             
              
              
            
                
            });
            
            
        }
        
    }

});

