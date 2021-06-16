
/* global self, importScripts, caches ,registration,clients ,Response, localforage, cacheName, serviceWorkerEvent */    
self.isSw = typeof WindowClient+typeof SyncManager+typeof addEventListener==='functionfunctionfunction';

 
if (self.isSw) {
    serviceWorkerEvent("fetch",    sw_fetch_, false);  
}

function matchJSFixes () {
    return matchJSFixes.cache? Promise.resolve(matchJSFixes.cache):
    new Promise(function(resolve,reject){
        localforage.getItem('matchJSFixes' ).then(function(value){
            resolve((matchJSFixes.cache=value||{}));
        }).catch(reject);
    });
}


function matchJS(url) {
    
    return new Promise(function(resolve,reject) {
        
        matchJSFixes ().then (function(fixes){
              
            caches.match(fixes[url]||url).then(function(default_response){
                
                if (default_response) {
                    return resolve (default_response);
                }
                
                if ( /(\.|\/)(jpe?g|png|webp|pdf|svg|gif|ico|js|json|html|md|css)$/.test( url ) ) {
                    return resolve( false ) ;
                }
                const url_js = url+".js";
                caches.match(url_js).then(function(response){
                    if (response) {
                        fixes[url]=url_js;
                        localforage.setItem('matchJSFixes', (matchJSFixes.cache=fixes)).then(function(){
                             console.log("mapped",url,"-->",url_js,"for future requests");
                             return resolve (response);
                        });
                    } else {
                        console.log(url,"note:not cached");
                       return resolve (false);
                    }
                });
            });
           
         });
    });
}


function sw_fetch( request ) {
     console.log("fetch intercept[", request.url,"]");
    return new Promise(function(resolve,reject){
        
       
        
        //getConfig().then(function(cfg) {
            
             
      
            
            matchJS(request.url).then(function(response) {
                
                if (response) {
                    
                    console.log(">>>>[",request.url,response.headers.get('content-length')," bytes]<<<< from cache");
                    return resolve(response);
                
                    
                }
                
                console.log(">>>>[",request.url,"]<<<< downloading");
                return fetch(request).then(function(response){
                    
                    console.log(">>>>[",request.url,response.headers.get('content-length')," bytes]<<<< from network");
                    return resolve(response);
                    
                }).catch(function(err){
                       //Error stuff
                    console.log("failed downloading", request.url,err);
                    reject();
                    
                })
            }).catch(function(err) {
                //Error stuff
                console.log("failed matching",request.url,err);
                reject();
                
            })
            
      
                
           
       // }).catch(reject);
    
    });
         
  
    
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
                    e.respondWith(sw_fetch(e.request));
                 }
              }
          );
      
      }           
      
      e.respondWith(sw_fetch(e.request));
  }
  
