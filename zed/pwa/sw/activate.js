
/* global self, importScripts, caches ,registration,clients ,Response,localforage,cacheName  */    

function sw_activate ( e) {
    // delete any old cache versions
    e.waitUntil(caches.keys().then( function( keys ) {
      
         return Promise.all(
          
            keys.map( 
                function ( key ) {
                 if (key != cacheName) return caches.delete(key);
                }
            )
            
         );
      
    }));
    
}
 