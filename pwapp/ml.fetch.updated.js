/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    
    ],function(){ml(2,

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
    
    
    
   

            
    function fetchUpdatedLib(databases,fetchInternalBuffer,virtualDirQuery) {
    
        return {
            fetchUpdatedURLContents,
            URLIsUpdated,
            fixupKeys,
            full_URL
        };
        
        
        function fetchUpdatedURLContents(url,cb) {
            url = full_URL(location.origin,url);
            virtualDirQuery(url).then(function(entry){
                
                if (entry) {
                    // this is a virtual entry. if it was updated, the "virtual" path will return contents and updated
                    databases.updatedURLS.getItem(entry.aliased_url,function(err,args){
                        if(err) {
                            return cb(err);
                        }
                        if (args) {
                            const buffer = args[0];
                            return cb (undefined,buffer,true);
                        }
                        // ok it's a virtual entry that has NOT been updated, so get the correct version from the correct zip.
                        doFetch(entry.fixup_url,cb);
                    });
                } else {
                    // it's not a virtual entry, so just fetch it
                    doFetch(url,cb);
                }
                
            });
            
            
            function doFetch(use_url,cb) {
                databases.updatedURLS.getItem(use_url,function(err,args){
                    
                    if(err) {
                        return cb(err);
                    }
                    if (args) {
                        const buffer = args[0];
                        return cb (undefined,buffer,true);
                    }
                    fetchInternalBuffer(use_url,cb);
                    
                });
            }
        }
        
        
        
        function URLIsUpdated (url,cb) {
            url = full_URL(location.origin,url);
            virtualDirQuery(url).then(function(entry){
                if (entry) {
                    // this is a virtual entry. if it was updated, the "virtual" path will be in updatedURLS
                    cb (databases.updatedURLS.keyExists(entry.aliased_url));
                    
                } else {
                    // it's not a virtual entry, see if it has been updated
                    cb (databases.updatedURLS.keyExists(url));
                }
                
            });
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

