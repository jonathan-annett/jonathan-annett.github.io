/* global getPWAFiles,caches,cacheName   */


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
