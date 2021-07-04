/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   'zipUpLib                            | ml.zipfs.fetch.updated.js',
   'sha1Lib                             | sha1.js'
  
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function zipUpWriteLib(   ) {
        
            const lib = {
            };
            
        
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

            
    function fetchUpdatedLib(databases,processFetchRequestInternal,mimeForFilename) {
        
        
    const sha1 = self.sha1Lib.cb;
    const { fetchUpdatedURLContents,fixupKeys,full_URL }  = self.zipUpLib(databases,processFetchRequestInternal);
    
            
    return {
        fetchUpdatedURLContents,
        fixupKeys,
        updateURLContents,
        removeUpdatedURLContents
    };

    function updateURLContents(url,db,responseData,responseState,cb) {
        
        if (typeof responseState==='function') {
            cb            = responseState;
            responseState = undefined;
        }
        
        if (typeof db==='string') {
            db = databases[db];
        }
        
        url = full_URL(location.origin,url);
        
        getPayload(function(payload){
            fixupKeys(payload[1].headers);
            db.setItem(url,payload,cb);
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

