
/* global self, importScripts, caches ,registration,clients ,Response,localforage, cacheName */

/* global getPWAFiles, updateURLArray */


 
function messageSender(NAME,port) {
   // service-worker.js
   let messagePort,pending=[];
   const boot = function (port) {
       messagePort = port; 
       if (pending) {
         pending.forEach(function (msg){
             messagePort.postMessage({ type : NAME, msg : msg, delayed:true });
         });
         pending.splice(0,pending.length)
         pending=undefined;
       }
   },
         bootstrapper = function(event) {
          if (event.data && event.data.type === NAME) {
            removeEventListener("message", bootstrapper);
            boot(event.ports[0]);
          }
        };
   
   if (port) {
       boot(port);
   } else {
       addEventListener("message", bootstrapper); 
    }
   
   return {
       send : function (msg) {
           //console.log({msg});
           if (pending) {
               pending.push(msg);
           } else {
               messagePort.postMessage({ type : NAME, msg : msg });
           }
       }
   };
}


function sw_message( e ) {
    
    if (!(e.data && e.data.type)) return ;
    
    if (e.data.type === 'SKIP_WAITING') {
        return self.skipWaiting();
    }
 
    if (e.data.type === 'UPDATE') {
        getPWAFiles().then( function(filesToCache){
           const progressUpdate = messageSender('UPDATE',e.ports[0]);
           const urls = filesToCache.site.concat(filesToCache.github);
           progressUpdate.send({files : urls});
           return caches.open(cacheName).then(function(cache) {
               updateURLArray(cache,urls,progressUpdate)
                 .then (function(){
                     progressUpdate.send({done : 1});
                 });
               
           });
       
        });
    }
}  
