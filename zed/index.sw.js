
/* global self, importScripts, caches ,registration,clients ,Response */


var 

file_list_url = "/zed/index.sw.json",

version     = 1.1,

cacheName   = 'zed-pwa-'+version,

site_root,
installed_root;

addEventListener('message',  sw_message );
addEventListener('install',  sw_install);
addEventListener('fetch',    sw_fetch_);  
addEventListener('activate', sw_activate);


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

           fetch(github_config.url).then(downloadJSON).then(function(github_data){

             return resolveList( 
                 
                 
                 github_data.tree.filter(
                     
                     function(item){ 
                         
                         const 
                         excluded =  isExcluded(item.path),
                         result = item.type === "blob" && isIncluded(item.path) && !excluded;
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

function refreshCache(cache,url) {
    
    return new Promise(function(resolve,reject) {
         cache.match(url).then(function(response) {
             if (response) {
                 const Etag =response.headers.get('Etag')
                 
                 fetch(url, {
                   method: 'HEAD', // *GET, POST, PUT, DELETE, etc.
                   headers : {'If-None-Match':Etag}
                 }).then (function(head){
                     const newETag = head.headers.get('Etag');
                  
                    if ( Etag !== newETag ) {
                         //console.log("refreshing...",url);
                         fetch(url).then(resolve).catch(reject);
                         
                     } else {
                         //console.log("unchanged...",url);
                          resolve(response);
                     }

                 });
             } else {
                 //console.log("adding new url",url);
                 cache.add(url).then(resolve).catch(reject);
             }
         });
    });

}

function updateURLArray(cache,urls,progressUpdate) {
    
    return Promise.all(urls.map(function(url,index){
         progressUpdate.send({loading:index,url:url});
                
         return refreshCache(cache,url).then (function(dl){
               progressUpdate.send({loaded:index}); 
               return Promise.resolve(dl);
           })
           .catch(function(err){
              //Error stuff
              console.log("failed adding",url,err);
          });
    }));
    
}

function sw_message( e ) {
    
    if (!(e.data && e.data.type)) return ;
    
    if (e.data.type === 'SKIP_WAITING') {
        return self.skipWaiting();
    }
 
    if (e.data.type === 'UPDATE') {
        getPWAFiles( file_list_url ).then( function(filesToCache){
           const progressUpdate = messageSender('UPDATE',e.ports[0]);
           const urls = filesToCache.site.concat(filesToCache.github);
           progressUpdate.send({files : urls});
           return caches.open(cacheName).then(function(cache) {
               updateURLArray(cache,urls,progressUpdate)
                 .then (function(){
                     progressUpdate.send({done : 1});
                 });
               
           });
       
        });
    }
}  

function sw_install( e ) {
    
    e.waitUntil(
        
        getPWAFiles( file_list_url ).then( function(filesToCache){
            
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
}     

function sw_fetch( e ) {
    
         
    console.log("fetch intercept[",e.request.url,"]");
    
    
    if (installed_root && site_root === e.request.url ) {
        console.log("root detect");
        e.respondWith(
        
        
                caches.match(installed_root).then(function(response) {
                    if (response) {
                        console.log(">>>>[",installed_root,response.headers.get('content-length')," bytes]<<<< from cache");
                        return response;
                    }
                    
                })
                
        );
 
        
    } else {
        
        e.respondWith(
            
            
            caches.match(e.request).then(function(response) {
                
                if (response) {
                    
                    console.log(">>>>[",e.request.url,response.headers.get('content-length')," bytes]<<<< from cache");
                    return response;
                
                    
                }
                
                console.log(">>>>[",e.request.url,"]<<<< downloading");
                return fetch(e.request).then(function(response){
                    console.log(">>>>[",e.request.url,response.headers.get('content-length')," bytes]<<<< from network");
                    return response;
                }).catch(function(err){
                       //Error stuff
                    console.log("failed fetching",e.request.url,err);
                    
                })
            }).catch(function(err) {
                //Error stuff
                console.log("failed matching",e.request.url,err);
            })
            
        );
        
    }

    
}

function sw_fetch_( e ) {

 
    
     if ( e.request.mode === "navigate" &&
          e.request.method === "GET" &&
         registration.waiting ) {
          
          return clients.matchAll().then (
              
              function(x){
                 if (x.length <2) {
                     
                      
                     e.respondWith(new Promise(function (resolve)  {
                        registration.waiting.postMessage({type:'SKIP_WAITING'});
                        resolve(  new Response("", {headers: {"Refresh": "0"}}) );
                     }));
                     
                 } else {
                    sw_fetch (e)  ;
                 }
              }
          );
      
      }           
      
      
      sw_fetch (e)  ;

  }

    

function sw_activate ( e) {
    // delete any old cache versions
    e.waitUntil(caches.keys().then( function( keys ) {
      
         return Promise.all(
          
            keys.map( 
                function ( key ) {
                 if (key != cacheName) return caches.delete(key);
                }
            )
            
         );
      
    }));
    
}
 