/* global 

getPWAFiles ,caches,cacheName, BroadcastChannel,self,

caches_open,promise2errback,promiseAll2errback,cache_add, asCallback, asPromise,

cpArgs,workerCmd,localforage

*/
self.isSw = typeof WindowClient+typeof SyncManager==='functionfunction';

function install_sw (sw_path, sw_afterinstall,sw_afterstart,sw_progress) {
    //invoked from browser context, 
    const navSw = navigator.serviceWorker ;
    
    var registration;
    
     if (typeof sw_progress !== 'function') {
         sw_progress = function(url,progress){
              console.log("installing:",url||'',progress,"% complete");
         };
     }
    
     let channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('installing') : false;
     
    
     sw_progress(undefined,0);
         
     if (channel) {
         channel.onmessage=function(e) {
             
             if(e.data.filesToCache) {
                 sw_progress(undefined,undefined,e.data.filesToCache);
             } else {
                 if (e.data.summary) {
                     sw_progress(undefined,101);
                     channel.close();
                     channel=undefined;
                     sw_afterinstall(registration,e.data.summary);
                 } else {
                    sw_progress(e.data.url,e.data.progress);
                 }
             }
         };
     }
    

     //navSw.addEventListener('controllerchange',sw_controllerchange);
     
     console.log("registering service worker script...");
     navSw.register( sw_path ).then (function(reg){
         
         if (reg.active) {
             if (channel) {
                 channel.close();
                 channel=undefined;
             }
             sw_afterstart(reg);
         } else {
             registration=reg;
         }
     });

}


workerCmd(
    'refresh_sw',{},
    function pageCode( navSw,replies, resolve, reject, send, id, 
/* --args-->*/ sw_progress ){

        replies.updateProgress = updateProgress;
        replies.refreshing     = refreshing;
        replies.updateDone     = updateDone;
        
        if (typeof sw_progress !== 'function') {
            sw_progress = function(url,progress){
                 console.log("installing:",url||'',progress,"% complete");
            };
        }
        
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
            resolve();
        }
        
        function refreshing (x) {
            sw_progress(x.url,p);
        }
    
    },
    function workerCode(msg,resolve,reject,reply) {
        
         getPWAFiles(function(err,filesToCache){
            
           if (err) {
               return reject(err);
           }
           const urls = filesToCache.site.concat(filesToCache.github);
           reply({updateProgress:{files:urls}});
           caches_open(cacheName,function(err,cache){
               
               if (err) {
                   return reject(err);
               }
               
               updateURLArray(reply,cache,urls,function(err,summary){
                   console.log({summary});
                   resolve({updateProgress:1});
                });
           });
        });
        
        function refreshCache(reply,cache,url) {
        
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
                            
                            reply({refreshing:{url:url}});
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
        
        function updateURLArray(reply,cache,urls) {return asCallback(arguments,function(cb){
        
            const arrayOfPromisedUrls = urls.map(function(url,index){
                return new Promise( toRefreshURL );
                function toRefreshURL(resolve,reject){
                     refreshCache(reply,cache,url).then (function(response){
                         reply({updateProgress:{index:index,url:url}});
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
        });}
        
       
        
    }
);     
        

workerCmd(
    'get_changed_sw',{},
    function pageCode( navSw,replies, resolve, reject, send, id, 
/* --args-->*/ cb ){
          
        },
    function workerCode(msg,resolve,reject) {
      
         localforage.getItem('install-etags').then(function (summary) {
             
             caches_open(cacheName,function(err,cache){
                 
                  const arrayOfPromisedUrls = Object.keys(summary.urls).map(function(url){

                         return fetchChanged(cache,url,summary.urls[url].Etag)
                  });
                  
                  
                  promiseAll2errback(arrayOfPromisedUrls,function(err,arrayOfHeadResults){
                       if (err) return reject(err);
                       
                       const changedUrls = arrayOfHeadResults.filter(function(x){return x!==null});
                       
                       return resolve({changedUrls});
                       
                  });
                         
             });
             
         });
         
         
         function fetchChanged(cache,url,Etag) {
             if (Etag===null) return Promise.resolve(null);   
             return new Promise(function(resolve) {
                  cache.match(url).then(function(response) {
                      if (response && response.type !== 'cors' ) {
                          fetch(url, {
                            method: 'HEAD', // *GET, POST, PUT, DELETE, etc.
                            headers : {'If-None-Match':Etag}
                          }).then (function(head){
                              const newETag = head.headers.get('Etag');
                           
                             if ( Etag !== newETag ) {
                                 resolve(url);
                              } else {
                                 resolve(null);
                              }
                          });
                      } else {
                         resolve(null);
                      }
                  });
             });
         
         }

    }
);






if (self.isSw) {
    console.log("registering install");
    addEventListener("install",  sw_install);
    addEventListener("message",  sw_message);
}    
 


function sw_install( e ) { 
   // self.skipWaiting();
    return e.waitUntil(  new Promise( toInstall )); 
    
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
            channel.postMessage({filesToCache}); 
            caches_open(cacheName,function(err,cache){
                
                if (err) {
                    closeNotificationChannel(channel);
                    return installFailed(err);
                }
                
                const arrayOfPromisedUrls = all_files.map(addToCacheWithProgress(cache));
    
                promiseAll2errback(arrayOfPromisedUrls,function(err,arrayOfCacheResults){
                    //if (err) return installFailed(err);
                    
                    const summary={urls:{}};
                    arrayOfCacheResults.forEach(function(el){
                        if( el && el.url && el.headers) {
                            summary.urls[el.url] = {
                                Etag : el.headers.get('Etag'),
                                size : el.headers.get('Content-Length')
                            };
                        }
                    });
                    channel.postMessage({summary});
                    closeNotificationChannel(channel);
                    
                    localforage.setItem('install-etags', summary).then(function () {
                        installComplete({
                            err,
                            arrayOfCacheResults
                        }); 
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
}

function sw_message ( e ) {
    if (workerCmd.commands) {
        
        const id = e.data.id;
        if ( id && Object.keys(e.data).length===2) {
            
            delete e.data.id;
            const cmdName = Object.keys(e.data)[0];
            
            const cmd = workerCmd.commands[cmdName];
            if (cmd && typeof cmd.handler==='function') {


                e.waitUntil (
                    
                   new Promise(function(resolve,reject){
                       
                       const
                       
                       channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('installing') : false,
                       
                       reply = function  (name,msg) {
                           const wrap = {
                               id : id
                           };
                           wrap[name]=msg;
                           channel.postMessage(wrap);
                           resolve();
                       },
                       
                       _resolve = function(result) {
                           reply('resolve',result);
                           channel.close();
                       },
                       
                       _reject = function  (err) {
                           reply('reject',err);
                           channel.close();
                           reject();
                       };
                       
                       
                       channel.onmessage = sw_message;

                       cmd.handler(e.data,_resolve,_reject,reply);
                       
                   })
                
                );
                

                
            }
            
        }
    }
}


      
