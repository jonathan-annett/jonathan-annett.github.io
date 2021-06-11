
window.onload = () => {
  'use strict';

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
             .register('install_pwa_sw.js');
             
    const recv = messageReceiver('INSTALL',function(e){
       console.log("got:",e.msg.progress,e.msg.progressTotal,(e.msg.progress/e.msg.progressTotal) * 100);
    });
  }
}


function messageReceiver(NAME,cb) {
    
    // app.js - somewhere in our main app
    const messageChannel = new MessageChannel();
    
    // First we initialize the channel by sending
    // the port to the Service Worker (this also
    // transfers the ownership of the port)
    navigator.serviceWorker.controller.postMessage({
      type: NAME ,
    }, [messageChannel.port2]);
    
    // Listen to the response
    messageChannel.port1.onmessage = (event) => {
      // Print the result
      console.log(event.data.payload);
      cb(event.data.payload);
    };
    
 
}
