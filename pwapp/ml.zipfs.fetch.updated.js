/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   'sha1Lib                             | sha1.js'
  
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function zipUpLib(   ) {
        
            const lib = {
            };
            
        
            return lib;
        },

        ServiceWorkerGlobalScope: function zipUpLib( lib ) {

            

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

    return {
        updateURLContents,
        fetchUpdatedURLContents,
        removeUpdatedURLContents,
        fixupKeys
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
    
    function fetchUpdatedURLContents(url,cb) {
        
        url = full_URL(location.origin,url);
        
        databases.updatedURLS.getItem(url,function(err,args){
            if(err) {
                return cb(err);
            }
            if (args) {
                const buffer = args[0];
                return cb (undefined,buffer,true);
            } else {
                
                
                fetchInternal(url,function(err,response){
                      if(err) {
                         return cb(err);
                      }
                      response.arrayBuffer().then(function(buffer){
                          return cb (undefined,buffer,false);
                      });
                });
            }
        });
    }
    
    function removeUpdatedURLContents(url,cb) {
        url = full_URL(location.origin,url);
        databases.updatedURLS.removeItem(url,cb);
    }
    
    
    function fetchInternal(url,cb) {
        const fakeEvent = {
            request : {
                url      : url,
                referrer : 'about:client',
                headers  : {
                    get : function () {}
                }
            },
        };
        processFetchRequestInternal(fakeEvent,cb);
    }
    
    
    
    function full_URL(base,url) {
        
        if (typeof url==='string') {
            if (url.length===0) return base;
        
            switch (url[0]) {
                case '/' : return base+url;
                case 'h' : if (/^http(s?)\:\/\//.test(url)) return url; break;
                case '.' : if ( url.substr(0,2)==='./') {
                    return base + url.substr(1);
                }
            }

            return base + url;
        }
        
    }
    
    
    function fixupKeys(db) {
        if (db) {
            Object.keys(db).forEach(function(key){
                const newkey=key.toLowerCase();
                if (newkey===key) return;
                db[newkey]=db[key]
                delete db[key];
            });
        }
        return db;
    }
    
     
}


});

