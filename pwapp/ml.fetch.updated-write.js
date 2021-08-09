/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, swResponseZipLib,Response  */
ml(`
   zipUpLib                            | ${ml.c.app_root}ml.fetch.updated.js
   sha1Lib                             | ${ml.c.app_root}sha1.js
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
        
        
        getPayload(function(payload){
            fixupKeys(payload[1].headers);
            db.setItem(url,payload,function(err){
                if (err) return cb (err);
                cb(undefined,payload[1].headers.etag);
            });
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

    function removeUpdatedURLContents(url,db,cb) {
        if (typeof db === 'function' ) {
            cb=db;
            db=databases.updatedURLS;
        } else {
            if (typeof db==='string') {
                db=databases[db];
            }
        }
        url = full_URL(location.origin,url);
        db.removeItem(url,cb);
    }
    
   


}


});

