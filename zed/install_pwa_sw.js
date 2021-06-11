
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

function get_X_cluded (exclusionsList) {
    
    const exclusions  = exclusionsList.map(
        function (excl) {
            if (typeof excl === "string" ) { 
                console.log('get_X_cluded:literal:',excl);
                return function(path){ return path===excl;};
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
    
    return function isExcluded (path) {
        return exclusions.some(function(test){ return test(path);});
    };
}

function getGithubFileList (github_io_base) {
    
    return function iterator(github_config) {
        
       const isIncluded = get_X_cluded ( github_config.include );
       const isExcluded = get_X_cluded ( github_config.exclude );
       
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
                         
                         console.log("checking:",item) ;
                         return item.type === "blob" && isIncluded(item.path) && ! isExcluded(item.path); 
                         
                     }
                     
                 ).map(
                     
                     function (item){ return github_io_base+item.path;  }
                     
                     
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
                   
                   var github_io_base = config.root;
                   
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


/* Start the service worker and cache all of the app's content */

self.addEventListener('install', function(e) {
    
  
        
          e.waitUntil(
              
              getPWAFiles( file_list_url )
                 .then(function(files){
                    
                    return caches.open(cacheName).then(function(cache) { 
                        return Promise.all(files.map(function(url){
                             //console.log("loading...",url);
                             return cache.add(url);
                        }));
                    })
                    
                 })
          );
});

if (true) {
    
  self.addEventListener('fetch', function(event) {
        event.respondWith(
            // Try the cache
            caches.match(event.request).then(function(response) {
                return response || fetch(event.request);
            }).catch(function() {
                //Error stuff
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