
/* global self, importScripts, caches ,registration,clients ,Response,localforage,cacheName  */    


 
 
 (function (signature,service_worker_sig){
     
    if (signature===service_worker_sig) addEventListener("activate", sw_activate);

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
     

   
})(typeof self+typeof WindowClient+typeof SyncManager,'objectfunctionfunction'); 