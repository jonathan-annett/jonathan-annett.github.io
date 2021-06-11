
/* global self, importScripts, caches  */
importScripts('adderall.js');

var file_list_url = "/zed/zedPWA.files.json";

var cacheName = 'zed-pwa';

var version = 1.0;

var 
site_domain = self.location.hostname,
filesToCache = [
  
],
locals = {};

filesToCache.forEach(function(u){
   locals["https://"+site_domain+u]=u; 
});

    
 

var urlCleanupRegex = /^\/$/, urlCleanupReplace = '/', urlCleanupReplace2 = '/';


function downloadJSON(response) { return response.json(); }

function get_X_cluded (base,exclusionsList) {
    
    const exclusions  = exclusionsList.map(
        function (excl) {
            if (typeof excl === "string" ) { 
                console.log('get_X_cluded:literal:',excl);
                return function(path){ return path===base+excl;};
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
    
    return function  (path) {
        return exclusions.some(function(test){ return test(path);});
    };
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
                         
                         const result = item.type === "blob" && isIncluded(item.path) && ! isExcluded(item.path); 
                         //console.log("checking:",item,result ? "included" : "excluded") ;
                         return result;
                     }
                     
                 ).map(
                     
                     function (item){ 
                         console.log("including:",github_io_base+item.path);
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
                     
                                 
                                    config.site.files.concat.apply(config.site.files,arrayOfFileLists)
                               
                              );
                              
                          })
                          
                          
                      });
        
                  

           
       })
    
   
}




function messageSender(NAME) {
   // service-worker.js
   let messagePort,pending=[];
   self.addEventListener("message", function(event) {
     if (event.data && event.data.type === NAME) {
       messagePort = event.ports[0];
       if (pending) {
           pending.forEach(function (msg){
               messagePort.postMessage({ type : NAME, msg : msg, delayed:true });
           });
           pending.splice(0,pending.length)
           pending=undefined;
         }
     }
   

    
   }); 
   
   return {
       send : function (msg) {
           console.log({msg});
           if (pending) {
               pending.add(msg);
           } else {
               messagePort.postMessage({ type : NAME, msg : msg });
           }
       }
   };
}


/* Start the service worker and cache all of the app's content */


self.addEventListener('message', (event) => {
    if (event.data === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});


self.addEventListener('install', function(e) {
    
          const msg = messageSender('INSTALL');
        
          e.waitUntil(
              
              getPWAFiles( file_list_url )
              
                 .then(function(files){
                    msg.send({progress:0,progressTotal:files.length});
                    return caches.open(cacheName).then(function(cache) { 
                        return Promise.all(files.map(function(url,index){
                             //console.log("loading...",url);
                             msg.send({progress:index,progressTotal:files.length,status:'downloading:'+url});
                             return cache.add(url)
                             .then(function(x){
                                 msg.send({progress:index,progressTotal:files.length,status:'downloaded:'+url});
                                 return x;
                             })
                             .catch(function(err){
                                  //Error stuff
                                  msg.send({progress:index,progressTotal:files.length,status:'failed:'+url});   
                                  console.log("failed adding",url,err);
                              });
                        }));
                    })
                    
                 })
          );
});

if (true) {
    
  self.addEventListener('fetch', function(event) {
        console.log("fetch intercept[",event.request.url,"]");
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
                }).catch(function(err){
                       //Error stuff
                    console.log("failed fetching",event.request.url,err);
                    
                })
            }).catch(function(err) {
                //Error stuff
                console.log("failed matching",event.request.url,err);
            })
        );
    });  


} else {

/* Serve cached content when offline */
self.addEventListener('fetch', function(e) { 
    
  
   console.log("fetch:",e.request.url );
  
  if ( !!locals[ e.request.url ] ) {
      e.respondWith(
      
        caches.match(e.request).then(function(response) {
          if (response) {
              console.log("Resolved from cache")
              return response ;
          }    
          console.log("fetching [",cleanURL,"] from remote");
          return fetch(e.request.url);
        })
      );

  } else {
      const cleanURL = e.request.url.replace(urlCleanupRegex,urlCleanupReplace);
      const cleanURI = e.request.url.replace(urlCleanupRegex,urlCleanupReplace2);   
      
      console.log(`[Service Worker] Fetching resource: ${e.request.url} [ ${cleanURI} ] --->  ${cleanURL}`);
      e.respondWith(
          
        caches.match(cleanURI).then(function(response) {
          if (response) {
              console.log("Resolved from cache")
              return response ;
          }    
          console.log("fetching [",cleanURL,"] from remote");
          return fetch(cleanURL);
        })
  );     
      
  }
 
});

}