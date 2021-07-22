/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml([],function(){ml(2,

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
            getUpdatedURLs,
            URLIsUpdated,
            fixupKeys,
            full_URL
        };
        
        
        function fetchUpdatedURLContents(url,cb) {
            url = full_URL(location.origin,url);
            virtualDirQuery(url).then(function(entry){
                
                if (entry && (entry.prefix || entry.aliased_url)) {
                    // this is a virtual entry. if it was updated, the "virtual" path will return contents and updated
                    const db = databases.updatedURLS;
                    const use_url = (entry.aliased_url && db.keyExists(entry.aliased_url) && entry.aliased_url ) ||
                                (entry.fixup_url   && db.keyExists(entry.fixup_url)   && entry.fixup_url ) ||
                                (db.keyExists(url) && url);
                    if (use_url) {
                        db.getItem(
                            
                            use_url,
                            
                            function(err,args){
                            if(err) {
                                return cb(err);
                            }
                            if (args) {
                                const buffer = args[0];
                                return cb (undefined,buffer,true);
                            }
                            if (entry && entry.response) {
                                cb (undefined,entry.response);
                                delete entry.response;
                            } else {
                               // ok it's a virtual entry that has NOT been updated, so get the correct version from the correct zip.
                               const use_url = entry.aliased_url || entry.fixup_url || url;
                               doFetch(use_url,cb);
                            }
                        });
                    } else {
                        doFetch(url,cb);
                    }
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
            fetchUpdatedURLContents(url,function(err,response){
                return cb (!!response);
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
        
        function getUpdatedURLs(regexTest,db,cb) {
            
            if (typeof regexTest ==='function') {
               cb = regexTest;
               db = databases.updatedURLS;
               regexTest = undefined;
            }

            if (typeof db ==='function') {
               cb = db;
               db = databases.updatedURLS;
            }
            
            db = typeof db ==='string' ? databases [db] : db;
            
            if (typeof cb ==='function') {
                    
                    if (db && db.keys) {
                        
                        db.getKeys(function(err,keys){
                            return regexTest ? cb (undefined,keys.filter(function(k){
                                                        return regexTest.test(k);
                                                    })
                                                )
                                            : cb (undefined,keys);
                        });
                        
                    } else {
                        cb(undefined,[]);
                    }
            }
            
        }

    }
    

});

