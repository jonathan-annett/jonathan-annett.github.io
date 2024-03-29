/* global ml,self,caches, swResponseZipLib  */
ml(`
    pwaMessage@Window                          | ${ml.c.app_root}ml.pwa-message.js
`,function(){ml(2,

    {

        Window: function pwaWindow(findWorker,sendMessage) {
            
            
            const lib = {
               
               toggleDeleteFile : function (zip_url,file,cb) {
                   sendMessage('deleted',{
                        zip    : zip_url,
                        toggle : file
                   },cb);
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
               
               isHidden : function (zip_url,file,cb) {
                   sendMessage('hidden',{
                       zip    : zip_url,
                       test   : file
                   },cb);
               },

               removeUpdatedURLContents  : function (url,db,cb) {
                   if (typeof db==='function') {
                       cb = db;
                       db = "updatedURLS";
                   }
                  sendMessage('removeUpdatedURLContents',{
                     url     : url,
                     db      : db
                  },cb);
               },
               
               updateURLContents : function (url,content,hash,db,cb) {
                   if (typeof db==='function') {
                       cb = db;
                       db = "updatedURLS";
                   }
                   if (typeof hash ==='function') {
                       cb   = hash;
                       db   = "updatedURLS";
                       hash = false;
                   }
                   sendMessage('updateURLContents',{
                       url     : url,
                       content : content,
                       hash    : hash,
                       db      : db
                   },cb);
               },
               
               fetchUpdatedURLContents : function (url,hash,db,cb) {
                   if (typeof db==='function') {
                       cb = db;
                       db = "updatedURLS";
                   }
                   if (typeof hash ==='function') {
                       cb = hash;
                       db = "updatedURLS";
                       hash=false;
                   }
                   sendMessage('fetchUpdatedURLContents',{
                       url     : url,
                       hash    : hash,
                       db      : db
                   },cb);
                   
               },
               
               getUpdatedURLs : function (regexTest,db,cb) {
                   if (typeof db==='function') {
                       cb = db;
                       db = "updatedURLS";
                   }
                   sendMessage('getUpdatedURLs',{
                       regexTest    : regexTest.source,
                       db           : db,
                   },cb);
               },
               
               
               fixupUrl : function (url,cb) {
                     sendMessage('fixupUrl',{
                        url    :    url
                    },cb);
              },
               
               virtualDirQuery : function (url,cb) {
                    sendMessage('virtualDirQuery',{
                       url    :    url
                   },cb);
               },
            
                createBlobDownloadLink : createBlobDownloadLink,
 
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



