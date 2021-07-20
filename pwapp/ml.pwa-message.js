/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml([],function(){ml(2,

    {

        Window: function pwaMessage() {
            
            const lib = {
                findWorker:findWorker,
                sendMessage:sendMessage
            };

            function findWorker(cb) {

                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  let noerr;
                
                  if (!registrations.some(function(reg){
                      const worker = reg.controller || reg.active || reg.installing || reg.waiting;
                      if (worker) {
                          cb(noerr,worker);
                          return true;//break some
                      }
                  })){
                     cb(new Error("no worker found"));
                  }
                });
                
            }
            
            function sendMessage(cmd,data,persistent,cb) {
                if (typeof persistent==='function') {
                    cb = persistent;
                    persistent = false;
                }
                const replyName        = "r"+Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-4);
                const sendChannel      = new MessageChannel();
                const replyChannel     = new BroadcastChannel(replyName);
                const timeout = 2000;
                const exitMsg=function(d){
                    let noerr;
                    if (!persistent) {
                       replyChannel.close();
                    }
                    sendChannel.port1.close();
                    sendChannel.port2.close();
                    if (d.error) {
                       cb(d.error); 
                    } else {
                       cb(noerr,d);
                    }
                }
                let tmr = persistent ? undefined : setTimeout(function(){exitMsg({error:"timeout"})},timeout);
                replyChannel.onmessage = function(e) {
                      if(!persistent)clearTimeout(tmr);
                      exitMsg(e.data);
                };
                
                findWorker(function(err,worker){
                    if (err) return cb(err);
                    worker.postMessage({m:cmd,r:replyName,data:data},[sendChannel.port2]); 
                });
           } 
          
            return lib;
        },

       

    }, {
        Window: [/*no imports*/]
    }

    );


 

});



