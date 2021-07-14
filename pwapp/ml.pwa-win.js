/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),`

    amdLib@Window                              | new_amd.js
    pwaMessage@Window                          | ml.pwa-message.js
`,function(){ml(2,ml(3),ml(4),

    {

        Window: function pwaWindow(findWorker,sendMessage) {
            
            
            const lib = {
               
               toggleDeleteFile : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                        zip    : zip_url,
                        toggle : file
                   });
               },
               
               deleteFile       : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                       zip : zip_url,
                       add : file
                   },cb);
               },
               
               unDeleteFile     : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                       zip    : zip_url,
                       remove : file
                   },cb);
               },
               
               isDeleted     : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                        zip    : zip_url,
                        test   : file
                   },cb);
               },
               
               writeFileString : function (zip_url,file,text,hash,cb) {
                   if (typeof hash==='function') {
                       cb   = hash;
                       hash = false;
                   }
                   sendMessage('writeFileString',{
                       zip    : zip_url,
                       file   : file,
                       text   : text,
                       hash   : hash
                   },cb);
               },
               
               readFileString : function (zip_url,file,hash,cb) {
                   if (typeof hash==='function') {
                       cb   = hash;
                       hash = false;
                   }
                    sendMessage('readFileString',{
                        zip    : zip_url,
                        file   : file,
                        hash   : hash
                    },cb);
               },
               
               isHidden : function (zip_url,file,cb) {
                   sendMessage('hidden',{
                       zip    : zip_url,
                       test   : file
                   },cb);
               },

               removeUpdatedURLContents  : function (url,cb) {
                  sendMessage('removeUpdatedURLContents',{
                     url    : url,
                  },cb);
               },
               
               updateURLContents : function (url,content,hash,cb) {
                   if (typeof hash ==='function') {
                       cb = hash;
                       hash=false;
                   }
                   sendMessage('updateURLContents',{
                       url     : url,
                       content : content,
                       hash    : hash
                   },cb);
               },
               
               fetchUpdatedURLContents : function (url,hash,cb) {
                   if (typeof hash ==='function') {
                       cb = hash;
                       hash=false;
                   }
                   sendMessage('fetchUpdatedURLContents',{
                       url    : url,
                       hash   : hash
                   },cb);
                   
               },
               
 
                getPNGZipImage     : getPNGZipImage,
                
                getServiceWorkerModules : function (cb) {
                    sendMessage('getServiceWorkerModules',{},cb);
                },
                
                getServiceWorkerUrls: function (cb) {
                    sendMessage('getServiceWorkerUrls',{},cb);
                },
                
                findWorker   : findWorker,
                
                sendMessage : sendMessage
            };
            
   
            function getPNGZipImage(zip_url,mode,alias_url,imageEl,linkEl,linkText,cb) {
                
                if (typeof linkText==='function') {
                    cb = linkText;
                    linkText = undefined;
                }
                
                if (typeof linkEl==='function') {
                    cb = linkEl;
                    linkText = undefined;
                    linkEl = undefined;
                }
                
                
                if (typeof imageEl==='function') {
                    cb = imageEl;
                    imageEl = undefined;
                    linkText = undefined;
                    linkEl = undefined;
                }
                
                if (typeof alias_url==='function') {
                    cb = alias_url;
                    alias_url = undefined;
                    imageEl = undefined;
                    linkText = undefined;
                    linkEl = undefined;
                }
                 
                 
                if (typeof zip_url+typeof mode ==='stringstring' && 'stringundefined'.indexOf(typeof alias_url)>=0) {
                    if (imageEl||linkEl||linkText||cb) {
                        return sendMessage("getPNGZipImage",{
                            zip_url:zip_url,
                            mode:mode,
                            alias_url:alias_url},function(err,data){
                            
                            if (typeof cb==='function') cb(data.blob);
                            
                            data.link = URL.createObjectURL(data.blob);
                            
                            if (linkEl){    
                                const link = document.createElement("a");
                                link.download = zip_url.split('/').pop().replace(/\.zip$/,'-'+data.hash+ ".png");
                                link.href = data.link;
                                link.appendChild(new Text(linkText||"Download data"));
                                link.addEventListener("click", function() {
                                    this.parentNode.removeChild(this);
                                    // remember to free the object url, but wait until the download is handled
                                    setTimeout(revoke, 500)
                                });
                                linkEl.appendChild(link);
                            }
                            if (imageEl) {
                                imageEl.src = data.link;
                                if (!linkEl) {
                                   imageEl.onload = revoke;
                                }
                            }
                            
                           
                            
                            if (!imageEl && ! linkEl) {
                                revoke();
                            }
                            
                            function revoke(){URL.revokeObjectURL(data.link);}
                        });
                    }
                }
                
                throw new Error ("incorrect arugments to getPNGZipImage");
            }

            
          const amd = ml.i.amdLib(undefined,"/pwapp",function(def,req){
              console.log("amd ready",amd);
              window.require=req;
              window.define=def;
              
          });

            return lib;
        },

        
    }, {
        Window: [
            
            ()=>self.pwaMessage.findWorker, 
            ()=>self.pwaMessage.sendMessage
            
        ] 
    }

    );


 function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}

 function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}

});



