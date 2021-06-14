/* global 

getPWAFiles ,caches,cacheName, BroadcastChannel,self,

caches_open,promise2errback,promiseAll2errback,cache_add,promiseToCB, CBtoPromise,

updateURLArray

*/
self.isSw = typeof WindowClient+typeof SyncManager==='functionfunction';

function install_sw (sw_path, sw_afterinstall,sw_afterstart,sw_progress) {
    //invoked from browser context, 
    const navSw = navigator.serviceWorker ;
    
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
                 console.log(e.data.summary);
                 sw_progress(undefined,101);
                 if (channel) channel.close();
                 sw_afterinstall(registration);
             } else {
                sw_progress(e.data.url,e.data.progress);
             }
         };
     }
    

     //navSw.addEventListener('controllerchange',sw_controllerchange);
     
     console.log("registering service worker script...");
     navSw.register( sw_path );

     

     
 

}

function refresh_sw (sw_progress) {
    return new Promise(function(resolve,reject) {
        
        
        const navSw = navigator.serviceWorker ;

        if (typeof sw_progress !== 'function') {
            sw_progress = function(url,progress){
                 console.log("installing:",url||'',progress,"% complete");
            };
        }
        
        const channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('installing') : false;
        
        const funcs = {
            updateProgress:updateProgress,
            updateDone:updateDone,
            refreshing:refreshing
        };
        
        channel.onmessage=function(msg){
            const key = Object.keys(msg)[0];
            const fn = funcs[key];
            if (fn) fn(msg[key]);
        };
        

        sw_progress(undefined,0);
        var files,count=0,total = 10000000;
        var p;
        
        
        function updateProgress (x) {
            if (x.files) {
                files = x.files;
                total = x.files.length;
                count = 0;
            }
            count++;
            p = Math.round((count / total)*100); 
            sw_progress(undefined,p);
        }
        
        function updateDone (x) {
            sw_progress(undefined,101);
        }
        
        function refreshing (x) {
            sw_progress(x.url,p);
        }
        
        
    });
    
}

function loadnew_sw(){
    if (!self.isSw) {
       //swivel.emit('skip-waiting');
    }
}


if (self.isSw) {
    console.log("registering install");
    addEventListener("install",  sw_install);
}


function sw_install( e ) { 
   // self.skipWaiting();
    return e.waitUntil(  new Promise( toInstall )); 
}


function toInstall (installComplete,installFailed) {
 
    
    console.log("toInstall()");
    
    getPWAFiles(function(err,filesToCache){
        
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
                closeNotificationChannel(channel);
                return installFailed(err);
            }
            
            const arrayOfPromisedUrls = all_files.map(addToCacheWithProgress(cache));

            promiseAll2errback(arrayOfPromisedUrls,function(err,arrayOfCacheResults){
                //if (err) return installFailed(err);
                
                const summary={progress:100,urls:{}};
                arrayOfCacheResults.forEach(function(el){
                    if( el && el.url && el.headers) {
                        summary.urls[el.url] = {
                            Etag : el.headers.get('Etag'),
                            size : el.headers.get('Content-Length')
                        };
                    }
                });
                console.log({summary});
                channel.postMessage(summary);
                closeNotificationChannel(channel);
                installComplete({
                    err,
                    arrayOfCacheResults
                });
            });
            
        });
        
        
        function addToCacheWithProgress(cache){
          

            return addToCache;
            
            function addToCache(url,index){
                
                return new Promise(function(resolve,reject) {
                    
                   cache.add(url).then(function(response){
                           
                           count ++;
                           channel.postMessage({
                               url      : url,
                               progress : Math.ceil( (count  / all_files.length) * 100 )
                           });
                           
                           cache.match(url).then(resolve).catch(reject);
                           
                       }) .catch(function(err){
                            //Error stuff
                            reject(err);
                       });
                   })
            }
            
            
        }
      
        
       
       
    });
      
 

}

function openNotificationChannel() {
    console.log("openNotificationChannel()");
    return typeof BroadcastChannel === 'function' ? 
        new BroadcastChannel('installing') : 
        {  postMessage:function(x){console.log("installed:",x.url,x.progress,"%")},
           close :  function(){},
        };
}

function closeNotificationChannel(channel){
    console.log("closeNotificationChannel()");
    channel.close();
}


function refreshCache(channel,cache,url) {

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
                    
                    channel.postMessage({refreshing:{url:url}});
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

CBtoPromise (
    
    function updateURLArray(channel,cache,urls,cb) {
    
        const arrayOfPromisedUrls = urls.map(function(url,index){
            return new Promise( toRefreshURL );
            function toRefreshURL(resolve,reject){
                 refreshCache(channel,cache,url).then (function(response){
                     channel.postMessage({updateProgress:{index:index,url:url}});
                     resolve(response);
                 }).catch(reject);
            }
        });
        
        promiseAll2errback(arrayOfPromisedUrls,function(err,arrayOfCacheResults){
            cb (undefined,{
                errors:err,
                results:arrayOfCacheResults
            });
        });
    }
)

 

function update_cached_files() {
    
     const channel = openNotificationChannel();
  
     getPWAFiles(function(err,filesToCache){
        
       if (err) {
           channel.postMessage({error:err.message||err});
           closeNotificationChannel(channel);
           return ;
       }
       const urls = filesToCache.site.concat(filesToCache.github);
       channel.postMessage({updateProgress:{files:urls}});
       caches_open(cacheName,function(err,cache){
           
           if (err) {
               
               closeNotificationChannel(channel);
               return ;
           }
           
           updateURLArray(channel,cache,urls,function(err,summary){
               console.log({summary});
               channel.postMessage({updateProgress:1});
               closeNotificationChannel(channel);
            });
       });
    });
    
}

      
