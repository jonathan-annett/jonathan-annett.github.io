
/* global self, importScripts, caches ,registration,clients ,Response,localforage,cacheName, serviceWorkerEvent */    
self.isSw = typeof WindowClient+typeof SyncManager+typeof addEventListener==='functionfunctionfunction';

 
 
 
 
if (self.isSw) {
    serviceWorkerEvent("activate",    sw_activate, sw_activate_changed);  
}

function sw_activate ( e) {
    // delete any old cache versions
    e.waitUntil(caches.keys().then( function( keys ) {
         console.log("activated");
         return Promise.all(
          
            keys.map( 
                function ( key ) {
                 if (key != cacheName) return caches.delete(key);
                }
            )
            
         ).then(function(){
             clients.claim();
             return Promise.resolve();
         })
    }))
    
}

function sw_activate_changed (e) {
    
    e.waitUntil(
        Promise.timeout(500) 
            .then(self.registration.unregister)
            
             .then(self.clients.matchAll)
               .then(function(clients) {
                   clients.forEach(function(client){ client.navigate(client.url);})
                })
        
    );
    
}
 
