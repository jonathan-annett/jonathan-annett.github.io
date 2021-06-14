
/* global self, importScripts, caches ,registration,clients ,Response,localforage,cacheName  */    
self.isSw = typeof WindowClient+typeof SyncManager==='functionfunction';

 
 
 
 
if (self.isSw) {
    console.log("registering sw_activate");
    addEventListener("activate",    sw_activate);  
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
            
         );
      
    }));
    
}
 
