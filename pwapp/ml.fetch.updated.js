/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, swResponseZipLib  */
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
        
        
        function fetchUpdatedURLContents(url,db,cb) {
            if(typeof db==='function') {
                cb=db;
                db = databases.updatedURLS;
            } else {
                if (typeof db==='string') {
                     db = databases[db];
                }
            }
            url = full_URL(location.origin,url);
            db.getItem(url,function(err,args){
                
                if(err) {
                    return cb(err);
                }
                if (args) {
                    const buffer = args[0];
                    const hash   = args[1] && args[1].headers && args[1].headers.etag;
                    return cb (undefined,buffer,true,hash);
                }
                if (url.indexOf('.zip/')<0) {
                   fetchInternalBuffer(url,cb);
                } else {
                    cb(new Error("not found"));
                }
            });
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

