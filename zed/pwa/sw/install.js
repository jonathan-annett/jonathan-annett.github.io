/* global 

getPWAFiles_,caches,cacheName, swivel,BroadcastChannel,self,

caches_open,promise2errback,promiseAll2errback,cache_add

*/
self.isSw = typeof WindowClient+typeof SyncManager==='functionfunction';

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
                 if (e.data.summary) {
                     console.log(e.data.summary)
                 } else {
                    sw_progress(e.data.url,e.data.progress);
                 }
             };
         }
        

         navSw.addEventListener('controllerchange',sw_controllerchange);
         
         console.log("registering service worker script...");
         navSw.register( sw_path )
           .then (function(registration){
              
              console.log("registered.");
              
              navSw.ready.then (whenReady);

           });
               
            
        
         

         function whenReady (registration) {
             
            
         
                   // Track updates to the Service Worker.
                   if (!navSw.controller) {
                     // The window client isn't currently controlled so it's a new service
                     // worker that will activate immediately
                       console.log("service worker was just installed");
                       return sw_afterinstall(registration);
                     
                   }
                   
                   console.log("checking for service worker update.");
                   
                   registration.update();
               
                   console.log("checking if service worker is installing...");
                   if (sw_checknewinstall(registration)===false) {
                       console.log("service worker was not installing, starting now");
                       sw_progress(undefined,101);
                       if (channel) channel.close();
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

function refresh_sw (sw_progress) {
    return new Promise(function(resolve,reject) {
        
        (function(navSw){
        if(!navSw)return reject();
        
                swivel.on('updateProgress',updateProgress);
                swivel.on('updateDone',updateDone);
                swivel.on('refreshing',refreshing);
                swivel.at(navSw.active).emit('refresh-files');
                
                sw_progress(undefined,0);
                var files,total = 10000000;
                var p;
                function updateProgress (x) {
                    if (x.files) {
                        files = x.files;
                        total = x.files.length;
                    }
                    p = Math.round((x.index / total)*100); 
                    sw_progress(undefined,p);
                }
                
                function updateDone (x) {
                    sw_progress(undefined,101);
                }
                
                function refreshing (x) {
                    sw_progress(x.url,p);
                }
        })(typeof navigator==='object'? navigator.serviceWorker : undefined);
    });
    
}

function loadnew_sw(){
    if (!self.isSw) {
       swivel.emit('skip-waiting');
    }
}


if (self.isSw) {
    console.log("registering install");
    addEventListener("install",  sw_install);
    swivel.on('skip-waiting',self.skipWaiting);
    swivel.on('refresh-files',update_cached_files);
}


function sw_install( e ) { return e.waitUntil(  new Promise( toInstall )); }


function toInstall (installComplete,installFailed) {
 
    
    console.log("toInstall()");
    
    getPWAFiles_(function(err,filesToCache){
        
        if (err) return installFailed(err);
        
        
        console.log(
            "got list:",
            filesToCache.site.length,"site files,",
            filesToCache.github.length,"github files" 
        );
       
         const channel = openNotificationChannel();
         
         const all_files = filesToCache.site.concat(filesToCache.github);
         let count = 0;
         
        caches_open(cacheName,function(err,cache){
            
            if (err) {
                closeNotificationChannel();
                return installFailed(err);
            }
            
            const arrayOfPromisedUrls = all_files.map(addToCacheWithProgress(cache));

            promiseAll2errback(arrayOfPromisedUrls,function(err,arrayOfCacheResults){
                if (err) return installFailed(err);
                
                const summary={progress:100,urls:{}};
                arrayOfCacheResults.forEach(function(el){
                    if( el && el.url && el.headers) {
                        summary.urls[el.url] = {
                            url  : el.url,
                            Etag : el.headers.get('Etag'),
                            size : el.headers.get('Content-Length')
                        };
                    }
                });
                console.log({summary});
                channel.postMessage(summary);
                closeNotificationChannel();
            });
            
        });
        
        
        function addToCacheWithProgress(cache){
          

            return addToCache;
            
            function addToCache(url,index){
                return new Promise(function(res,rej) {
                    
                   cache.add(url).then(function(response){
                           
                           count ++;
                           channel.postMessage({
                               
                               url:url,
                               progress:Math.ceil( (count  / all_files.length) * 100 )
                           });
                           
                           return cache.match(url);
                           
                       }) .catch(function(err){
                            //Error stuff
                            console.log("failed adding",url,err);
                       });
                   })
            }
            
            
        }
      
        function openNotificationChannel() {
            console.log("openNotificationChannel()");
            return typeof BroadcastChannel === 'function' ? 
                new BroadcastChannel('installing') : 
                {  postMessage:function(x){console.log("installed:",x.url,x.progress,"%")},
                   close :  function(){},
                };
        }
        
        function closeNotificationChannel(){
            console.log("closeNotificationChannel()");
            channel.close();
            swivel.on('skip-waiting',self.skipWaiting);
            swivel.on('refresh-files',update_cached_files);
        }
        
       
       
    });
      
 

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
                             swivel.broadcast('refreshing',{url:url})
                             .then(function(){
                                fetch(url).then(resolve).catch(reject);
                              });
                            
                             
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

function updateURLArray_(cache,urls,cb) { return promise2errback(updateURLArray(cache,urls),cb);}
function updateURLArray(cache,urls) {
    if (!self.isSw) return;
    
    
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
  
     getPWAFiles_(function(err,filesToCache){
        
       if (err) return ;
       
       const urls = filesToCache.site.concat(filesToCache.github);
       
           swivel.broadcast('updateProgress',{files : urls});
           
           caches_open(cacheName,function(err,cache){
               if (err) return;
               
               updateURLArray_(cache,urls,function(){
                    swivel.broadcast('updateDone',{});
                });
           });
    });
    
}

      
