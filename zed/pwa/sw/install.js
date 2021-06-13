/* global getPWAFiles,caches,cacheName   */
/* global publishNamedFunction, importPublishedFunction,toResolver */

function sw_install( e ) {
    
    e.waitUntil(
        
        getPWAFiles(  ).then( function(filesToCache){
            
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



function refreshCache(cache,url) {
    
    return new Promise(function(resolve,reject) {
        
             cache.match(url).then(function(response) {
                 if (response && response.type !== 'cors' ) {
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

function updateURLArray(cache,urls) {
    
    return Promise.all(urls.map(function(url,index){
        
        
        return toResolver(updateURLArray.progress)({loading:index,url:url}).then (function(){
                    
            return refreshCache(cache,url).then (function(dl){
                 
                return  toResolver(updateURLArray.progress)({loaded:index}).then (function(){
                       
                       
                    return Promise.resolve(dl);
                       
                });
    
         
            })
                
        })
        .catch(function(err){
              //Error stuff
              console.log("failed adding",url,err);
        });
    }));
    
}

function update_cached_files() {

    getPWAFiles().then( function(filesToCache){
        
       const urls = filesToCache.site.concat(filesToCache.github);
       
       
         toResolver(updateURLArray.progress)({files : urls}).then(function(){
           
            return caches.open(cacheName).then(function(cache) {
                
                return updateURLArray(cache,urls).then (function(){
                    
                      return toResolver(updateURLArray.progress)({done : 1});
                      
                });
            });
       
       });
    
    });
}

publishNamedFunction(update_cached_files);


importPublishedFunction ('updateInstallProgress').then (function (updateInstallProgress){
      
      updateURLArray.progress = updateInstallProgress;
});

