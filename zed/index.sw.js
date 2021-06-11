
/* global self, importScripts, caches  */


var 

file_list_url = "/zed/index.sw.json",
filesToCache,
cacheName   = 'zed-pwa',
version     = 1.0,
site_root,
installed_root;

function downloadJSON(response) { return response.json(); }

function get_X_cluded (base,exclusionsList) {
    
    const exclusions  = exclusionsList.map(
        function (excl) {
            if (typeof excl === "string" ) { 
                
                console.log('get_X_cluded:literal:',excl);
                return function(path){ 
                    return path === excl ;
                };
                
            } else {
                
                if (typeof excl.RegExp === "string") {
                    const re = new RegExp(excl.RegExp,'');
                    console.log('get_X_cluded:regex:',re);
                    return re.test.bind(re);
                } else {
                    return null;
                }
                
            }
        }   
    ).filter(function(x){ return x !== null;})
    
    const fn =  function  (path) {
       
        return exclusions.some(function(test){ return test(path);});
    };
    
    fn.list = exclusionsList;
    
    return fn;
}

function getGithubFileList (github_io_base) {
    
    return function iterator(github_config) {
        
       const isIncluded = get_X_cluded ( github_io_base, github_config.include );
       const isExcluded = get_X_cluded ( github_io_base, github_config.exclude );
       
       console.log({
           isIncluded,
           isExcluded
       });
  
       return new Promise(function (resolveList,reject) {

           console.log("fetching:",github_config.url);
           fetch(github_config.url).then(downloadJSON).then(function(github_data){
             console.log("fetched:",github_data);
             return resolveList( 
                 
                 
                 github_data.tree.filter(
                     
                     function(item){ 
                         
                         const 
                         excluded =  isExcluded(item.path),
                         result = item.type === "blob" && isIncluded(item.path) && !excluded;
                         if (item.type === "blob"  && excluded){
                             console.log("excluded:",item) ;
                         }
                         //console.log("checking:",item,result ? "included" : "excluded") ;
                         return result;
                     }
                     
                 ).map(
                     
                     function (item){ 
                         //console.log("including:",github_io_base+item.path);
                         return github_io_base+item.path; 

                     }
                     
                     
                 )
                 
                 
              );
           
           });
           
       });
       
    };
    
}

function getPWAFiles(config_url) {
 

    return new Promise(function(resolveConfig,reject) {
        
            
                    
            console.log("fetching...:",config_url);
            fetch(config_url)
               .then(downloadJSON)
                 .then(function(config) { 
                   
                   console.log("fetched...:",config);
                   
                   var github_io_base = config.site.root;
                   
                   console.log("github_io_base:",github_io_base);
                   
                   Promise.all( config.github.map( getGithubFileList(github_io_base) ))
                   
                      .then (function(arrayOfFileLists){  
                          
                              console.log("resolved:",arrayOfFileLists) ;
                              resolveConfig(
                                   { 
                                       site   : config.site.files,
                                       github : [].concat.apply([],arrayOfFileLists)
                                   }
                              );
                              
                          })
                          
                          
                      });
                      
       })
    
   
}


function messageSender(NAME,port) {
   // service-worker.js
   let messagePort,pending=[];
   const boot = function (port) {
       messagePort = port; 
       if (pending) {
         pending.forEach(function (msg){
             messagePort.postMessage({ type : NAME, msg : msg, delayed:true });
         });
         pending.splice(0,pending.length)
         pending=undefined;
       }
   },
         bootstrapper = function(event) {
          if (event.data && event.data.type === NAME) {
            self.removeEventListener("message", bootstrapper);
            boot(event.ports[0]);
          }
        };
   
   if (port) {
       boot(port);
   } else {
       self.addEventListener("message", bootstrapper); 
    }
   
   return {
       send : function (msg) {
           //console.log({msg});
           if (pending) {
               pending.push(msg);
           } else {
               messagePort.postMessage({ type : NAME, msg : msg });
           }
       }
   };
}


/* Start the service worker and cache all of the app's content */


self.addEventListener('message', (event) => {
    
    if (!(event.data && event.data.type)) return ;
    
    if (event.data.type === 'SKIP_WAITING') {
        return self.skipWaiting();
    }
 
    if (event.data.type === 'UPDATE') {
       const msg = messageSender('UPDATE',event.ports[0]);
       msg.send({files : filesToCache.github});
       return caches.open(cacheName).then(function(cache) {
           return Promise.all(filesToCache.github.map(function(url,index){
                msg.send({loading:index,url:url});
                       
                return refreshCache(cache,url).then (function(dl){
                      msg.send({loaded:index}); 
                      return Promise.resolve(dl);
                  })
                  .catch(function(err){
                     //Error stuff
                     console.log("failed adding",url,err);
                 });
           }));
       })
       
    }
});

function refreshCache(cache,url) {
    
    return new Promise(function(resolve) {
         cache.match(url).then(function(response) {
             if (response) {
                 const Etag =response.headers.get('Etag')
                 
                 console.log("refreshing",url,Etag);
                 fetch(url, {
                   method: 'GET', // *GET, POST, PUT, DELETE, etc.
                   headers : {'If-None-Match':Etag}
                 }).then (function(got){
                     console.log("GET-->",{got,headers : got.headers.get('Etag')});
                     resolve(response);
                 });
             } else {
                 console.log("adding new url",url);
                cache.add(url).then(resolve);
             }
         });
    });

}


 

self.addEventListener('install', function(e) {
    
          e.waitUntil(
              
              getPWAFiles( file_list_url ).then( function(files){
                  
                    filesToCache = files;
                    return caches.open(cacheName).then(function(cache) {
                        
                        return Promise.all(filesToCache.site.map(function(url,index){
                             console.log("loading...",url);
                             return cache.add(url) .catch(function(err){
                                  //Error stuff
                                  console.log("failed adding",url,err);
                              });
                        }));
                        
                    })
                    
              })
          );
          
});



addEventListener('fetch', function(event) {
      
        
        console.log("fetch intercept[",event.request.url,"]");
        
        
        if (installed_root && site_root === event.request.url ) {
            
            event.respondWith(
            // Try the cache
            
                    caches.match(installed_root).then(function(response) {
                        if (response) {
                            console.log(">>>>[",installed_root,response.headers.get('content-length')," bytes]<<<< from cache");
                            return response;
                        }
                        
                    })
            );
     
            
        } else {
            
            event.respondWith(
                // Try the cache
                
                
                caches.match(event.request).then(function(response) {
                    
                    if (response) {
                        
                        console.log(">>>>[",event.request.url,response.headers.get('content-length')," bytes]<<<< from cache");
                        return response;
                    
                        
                    }
                    
                    console.log(">>>>[",event.request.url,"]<<<< downloading");
                    return fetch(event.request).then(function(response){
                        console.log(">>>>[",event.request.url,response.headers.get('content-length')," bytes]<<<< from network");
                        return response;
                    }).catch(function(err){
                           //Error stuff
                        console.log("failed fetching",event.request.url,err);
                        
                    })
                }).catch(function(err) {
                    //Error stuff
                    console.log("failed matching",event.request.url,err);
                })
            );
            
        }
    });  


 