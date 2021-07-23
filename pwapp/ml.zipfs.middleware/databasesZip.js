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
sha1Lib               |  /pwapp/sha1.js
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
               <head>
               
               <style>
               
               #loadProgress {
                 width: 180px;
                 background-color: #ddd;
               }
               
               #loadBar {
                 width: 2px;
                 height: 10px;
                 background-color: #4CAF50;
               }
               
               
               </style>
               </head>
               <body>
               <p>
                standby...
                </p>
                
                <div id="loadProgress">
                  <div id="loadBar"></div>
                </div>
                
                <div id="ready" style="display:none">
                   You can download the zip <a id = "downloadLink"></a> 
                </div>
                
               
                <script>
                
                var channelName = "${channelName}";
                
                ${
                    middleware.fnSrc(
                    function() {
                
                       
                       const channel = new BroadcastChannel(channelName );
                       
                       progressHandler(0,1,"loadProgress","loadProgressText","zipProgress");
                 
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
              
                         
                        function progressHandler(complete,total,id,idtxt,channelName) {
                           let expect_total = total;
                           let outer = qs("#"+id),inner = qs(outer,"div"),status = qs("#"+idtxt),maxWidth = outer.offsetWidth, barHeight=outer.offsetHeight;
                           updateBar();
                           if (status) {
                              status.style= "position:relative;left:"+(maxWidth+2)+"px;top:-"+barHeight+"px;"; 
                           }
                           
                         
                             if (channelName) {
                               const channel = new BroadcastChannel(channelName);
                               channel.onmessage =function(e){
                                   const msg = e.data;
                                   if (msg && msg.setTotal) {
                                       setTotal(msg.setTotal);
                                   } 
                                   else if (msg && msg.setComplete) {
                                      setComplete(msg.setComplete);
                                   }
                                   else if (msg && msg.addToTotal) {
                                      addToTotal(msg.addToTotal);
                                   }
                                   else if (msg && msg.logComplete) {
                                      logComplete(msg.logComplete);
                                   }
                               };
                           }
                           return {
                               setTotal:setTotal,
                               setComplete:setComplete,
                               addToTotal:addToTotal,
                               updateBar : updateBar,
                               logComplete: logComplete
                           };
                          
                           function setTotal(n) {
                               expect_total=n;
                           }
                          
                           function setComplete(n) {
                               complete=n;
                               updateBar();
                           }
                          
                           function logComplete(n) {
                              complete += n;
                              updateBar();
                           }
                          
                           function addToTotal (n) {
                               total+=n;
                               updateBar();
                           }
                          
                           function updateBar (){
                             
                             inner.style.width = Math.floor(Math.min((complete/Math.max(total,expect_total)),1)*maxWidth)+"px";
                             if (status) {
                               status.textContent = complete+"/"+Math.max(total,expect_total);
                             }
                           }
                        } 
                        
                        function qs(d,q,f) {
                            let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
                            if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
                            if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
                            if (D+Q===O+S){
                               r = d.querySelector(q);
                               if (r&&typeof r+typeof f===O+FN) {
                                    if (f.name.length>0) 
                                       r.addEventListener(f.name,f);
                                    else 
                                       f(r);
                                }
                            }
                            return r;
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
               
                
               var prog;
                
               middleware.databases.toZip(
                   function (n, of_n){
                       
                      if (n===0) {
                         prog = progressHandler (0,of_n,"zipProgress") ;
                      } else {
                          prog.setComplete(n);
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
               
               
               function progressHandler (complete,total,channelName) {
                 const channel = new BroadcastChannel(channelName);
                 const expect  = Number.parseInt(new URL(location).searchParams.get('count'));
                 if (!isNaN(expect) && expect > 0) {
                     setTotal(expect);
                 }
                 return {
                      setTotal:setTotal,
                      setComplete:setComplete,
                      addToTotal:addToTotal,
                      logComplete: logComplete
                  };
                 
                  function setTotal(n) {
                      channel.postMessage({setTotal:n});
                  }
                 
                  function setComplete(n) {
                      channel.postMessage({setComplete:n});
                  }
                 
                  function logComplete(n) {
                      channel.postMessage({logComplete:n});
                  }
                 
                  function addToTotal (n,f) {
                      channel.postMessage({addToTotal:n,filename:f});
                  }
                 
                  
               }
                
            });
        }
        
    }

});

