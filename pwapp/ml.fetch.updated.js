/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    
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
    
    
    
   

            
    function fetchUpdatedLib(databases,fetchInternalBuffer,virtualDirQuery) {
    
        return {
            fetchUpdatedURLContents,
            fixupKeys,
            full_URL
        };
        
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
                    
                    
                    virtualDirQuery(url).then(function(entry){
                        
                        if (entry) {
                            
                            if (entry.response) {
                                
                                entry.response.clone().arrayBuffer().then(function(buffer) {
                                   cb(undefined,buffer);
                                });
                                
                            } else {
                                fetchInternalBuffer(url,entry.fixup_url,cb);
                            }
                            
                        } else {
                            fetchInternalBuffer(url,cb);
                        }
                        
                    });

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

