/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib,Response  */
ml(`
   zipUpLib                            | ml.fetch.updated.js
   sha1Lib                             | sha1.js
`,function(){ml(2,

    {
        Window: function zipUpWriteLib(   ) {
        
            const lib = { };
            
            return lib;
        },

        ServiceWorkerGlobalScope: function zipUpWriteLib( lib ) {

            return lib;
        } 
    }, {
        Window: [
            
        ],
        ServiceWorkerGlobalScope: [
            () => fetchUpdatedLib
        ],
        
    }

    );

            
    function fetchUpdatedLib(databases,fetchInternalBuffer,virtualDirQuery,mimeForFilename) {
        
        
    const sha1 = self.sha1Lib.cb;
    const { fetchUpdatedURLContents,fixupKeys,full_URL,getUpdatedURLs }  = self.zipUpLib(databases,fetchInternalBuffer,virtualDirQuery);
    
            
    return {
        fetchUpdatedURLContents,
        fixupKeys,
        updateURLContents,
        removeUpdatedURLContents,
        getUpdatedURLs
    };

    function updateURLContents(url,db,responseData,responseState,cb) {
        
        if (typeof responseState==='function') {
            cb            = responseState;
            responseState = undefined;
        }
        
        if (typeof db==='string') {
            db = databases[db];
        }
        
        // first make a full url
        url = full_URL(location.origin,url);
        
        // now see if that full url is inside a virtual directory, which will resolve to specific file inside a specific zip.
        // we need to update the correct overlayed url, so local reads well get the correct data.
        virtualDirQuery(url).then(function(entry){
            
            if (entry && (entry.prefix || entry.aliased_url)) {
                // this is updating a virtual item - so we need to patch the correct fixup_url
                getPayload(function(payload){
                    
                    fixupKeys(payload[1].headers);
                    db.setItem(entry.aliased_url  || entry.fixup_url || url ,payload,function(){
                        if (entry.response) {
                           delete entry.response;
                           entry.response = new Response(payload[0],payload[1]);
                        }
                        cb();
                    });
                    
                });

            } else {
                // not a virtual item
                getPayload(function(payload){
                    fixupKeys(payload[1].headers);
                    db.setItem(url,payload,cb);
                });
            }
            
        });
        
       
    
        function getPayload (cb) {
            if (responseState) return cb ([responseData,responseState]);
            
            sha1(responseData,function(err,hash){
                cb([
                    responseData,
                    {
                       status : 200,
                       headers:{     'Content-Type'   : mimeForFilename(url),
                          'Content-Length' : responseData.byteLength || responseData.length,
                          'ETag'           : hash,
                          'Cache-Control'  : 'max-age=3600, s-maxage=600',
                          'Last-Modified'  : new Date().toString()
                       }
                        
                    }
                ]);
            });
        }
    }

    function removeUpdatedURLContents(url,cb) {
        url = full_URL(location.origin,url);
        databases.updatedURLS.removeItem(url,cb);
    }
    
   


}


});

