/* global getPWAFiles,caches,cacheName, swivel,BroadcastChannel   */

function install_sw (sw_path, sw_afterinstall,sw_afterstart,sw_progress) {
    //invoked from browser context, 
    (function(navSw){
        if(!navSw)return;
        
         if (typeof sw_progress !== 'function') {
             sw_progress = function(url,progress){
                  console.log("installing:",url||'',progress,"% complete");
             };
         }
        
         const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('installing') : false;
         
        
         sw_progress(undefined,0);
             
         if (channel) {
             channel.onmessage=function(e) {
                 sw_progress(e.data.url,e.data.progress);
             };
         }
        

         navSw.addEventListener('controllerchange',sw_controllerchange);
         
         console.log("loading service worker script...");
         navSw.register( sw_path )
           then (navSw.ready)
           .then (sw_ready);
        
         

         function sw_ready (registration) {
             
             // Track updates to the Service Worker.
           if (!navSw.controller) {
             // The window client isn't currently controlled so it's a new service
             // worker that will activate immediately
             console.log("service worker was just installed, waiting for it to finish");
             sw_afterstart(registration);
             
           }
           
           console.log("checking for service worker update.");
           
           registration.update();
       
           console.log("checking if service worker is installing...");
           if (sw_checknewinstall(registration)===false) {
               console.log("service worker was not installing, starting now");
               sw_afterstart(registration);
           }
            
         }
         
         
         function sw_checknewinstall(registration) {
           if (registration.waiting) {
                 // SW is waiting to activate. Can occur if multiple clients open and
                 // one of the clients is refreshed.
                 console.log("new service worker is available and is waiting.");
                 sw_progress(undefined,101);
                 if (channel) channel.close();
                 sw_afterstart(registration);
                 return true;
           }
         
           if (registration.installing) {
                sw_updatefound();
                return true;
           }
         
           // We are currently controlled so a new SW may be found...
           // Add a listener in case a new SW is found,
           registration.addEventListener('updatefound', sw_updatefound);
           return false;
           
           
           function sw_updatefound() {
                console.log("service worker is installing... will wait for state change to installed..");
                registration.installing.addEventListener('statechange', sw_statechange);
           }
           
           
           function sw_statechange(event) {
             if (event.target.state === 'installed') {
               // A new service worker is available, inform the user
                console.log("service worker has installed, calling sw_afterinstall()");
                sw_progress(undefined,101);
                if (channel) channel.close();
                sw_afterinstall(registration);
             }
           }
           
           
         }
         
         
         function sw_controllerchange(event) {
               navSw.removeEventListener('controllerchange',sw_controllerchange);
               console.log('Controller loaded');
               window.location.reload();
         }
        
         
        
    })(typeof navigator==='object'? navigator.serviceWorker : undefined);

}

(function (signature,service_worker_sig){
  
  if (signature===service_worker_sig) addEventListener("install",  sw_install);

  function sw_install( e ) {
        //invoked from service worker context 
        e.waitUntil(
            
            getPWAFiles(  ).then( function(filesToCache){
                
                  return new Promise(function (resolve,reject){
                      
                      const channel = typeof BroadcastChannel === 'function' ? 
                                             new BroadcastChannel('installing') : 
                                             {  postMessage:function(x){console.log("installed:",x.url,x.progress,"%")},
                                                close :  function(){},
                                             };
    
                      const all_files = filesToCache.site.concat(filesToCache.github);
                      
                      caches.open(cacheName).then(function(cache) {
                          
                          Promise.all(all_files.map(function(url,index){
                              
                               return cache.add(url)
                                   .then(function(x){
                                       channel.postMessage({url:url,progress:Math.ceil((index/all_files.length)*100)});
                                       return Promise.resolve(x);    
                                   }) .catch(function(err){
                                    //Error stuff
                                    console.log("failed adding",url,err);
                               });
                          })).then(function (all){
                              
                              channel.close();
                              
                              swivel.on ('update',update_cached_files);
                              
                              resolve(all);
                          });
                          
                      })
                      
                  });
                  
            })
        );
        
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
                
                
                return swivel.broadcast('updateProgress',{loading:index,url:url}).then (function(){
                            
                    return refreshCache(cache,url).then (function(dl){
                         
                        return  swivel.broadcast('updateProgress',{loaded:index}).then (function(){
                               
                               
                            return Promise.resolve(dl);
                               
                        });
            
                 
                    })
                        
                }) .catch(function(err){
                      //Error stuff
                      console.log("failed adding",url,err);
                });
            }));
            
        }
        
        function update_cached_files() {
        
            getPWAFiles().then( function(filesToCache){
                
               const urls = filesToCache.site.concat(filesToCache.github);
               
               
                   swivel.broadcast('updateProgress',{files : urls});
                   
                    return caches.open(cacheName).then(function(cache) {
                        
                        return updateURLArray(cache,urls).then (function(){
                            
                              return swivel.broadcast('updateDone',{});
                              
                        });
                    });
        
            });
        }
    
  }  
      
  
})(typeof self+typeof navigator+typeof window+typeof caches,'objectundefinedundefinedobject');
