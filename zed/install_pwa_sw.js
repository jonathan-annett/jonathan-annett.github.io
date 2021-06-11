
/* global self, importScripts, caches  */
importScripts('adderall.js');


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

function getIsExcluded(exclusionsList) {
    
    const exclusions  = exclusionsList.map(
        function (excl) {
            if (typeof excl === "string") {
                return function(path){ return path===excl;};
            } else {
                if (typeof excl.RegExp === "string") {
                    const re = new RegExp(excl.RegExp,'');
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
    
   
    
    return function (github_data){
        
        const isExcluded = getIsExcluded( github_data.exclude );
        
        return github_data.tree.filter(function(item){
                
                return item.type === "blob" && ! isExcluded(item.path);
                
            }).map(function (item){
               return github_io_base+item.path; 
            });
    };    
}

function getPWAFiles(config_url,github_io_base) {
    
    return new Promise(function(resolveConfig,reject) {
    
    return fetch(config_url)
       .then(downloadJSON)
         .then(function(config) { 
           
          

           fetch(config.github.url).then(downloadJSON).then(function(github_files){
               
               resolveConfig(
                  config.site.concat.apply(config,github_files.map( getGithubFileList(github_io_base) ))
               );
               
           }).catch(reject);

           
       })
            .catch(reject);
    
    });
}


/* Start the service worker and cache all of the app's content */

self.addEventListener('install', function(e) {
    
  
        
          e.waitUntil(
              
              getPWAFiles('/zed/pwa_config.json','//jonathan-annett.github.io/zed/')
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