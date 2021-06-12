
/* global self, importScripts, caches ,registration,clients ,Response,localforage, cacheName */

/* global getPWAFiles, updateURLArray */
 
const isSw = typeof self+typeof window+typeof caches+typeof document ==='objectundefinedobjectundefined'; 

const sw_message = isSw ? _sw_message : _bad_sw_message;

function openNamedMessageChannel(name,worker)  {
    
    
    return new Promise(isSw?openServiceChannel:openBrowserChannel);
    
    function channel (port,resolvewhenReady,rejectOnTimeout) {
        var timeout = setTimeout(rejectOnTimeout,5000);
        const replies = {},handlers={},
        
        chan =  {
            
            send : function (msg) {
                return new Promise(sentMessage);
                function sentMessage(onReply,onTimeout) {
                    const key = Date.now().toString(36)+Math.random().toString(36);
                    const data = {
                        onReply : onReply,
                        tmr     : setTimeout(function (){
                            clearTimeout(data.tmr);
                            onTimeout();
                            delete data.tmr;
                            delete data.onReply;
                            delete replies[key];
                        }, 5000)
                    };
                    replies[key]=data;
                    port.send({msg:msg,key:key});
                }
            },
            onmessage : function(f) {
                const key = Date.now().toString(36)+Math.random().toString(36);
                handlers[key] = {
                   onMessage : f
                };
                port.send ({
                    register : key
                }); 
                
            }
        };
        
        port.onmessage = function(event) {
             const data = event.data.key && replies[event.data.key];
             if (data && data.onReply) {
                 if (data.tmr) clearTimeout(data.tmr);
                 data.onReply(event.data.reply);
                 delete data.onReply;
                 delete data.tmr;
                 delete replies[event.data.key];
                 return;
             }
             
             const handler = event.data.key && handlers[event.data.key];
             if (handler && handler.onMessage) {
                 handler.onMessage(event.data.msg);
             }
             
             
             const register = event.data.register;
             if (register && resolvewhenReady) {
                 if (timeout) {
                     clearTimeout(timeout);
                     timeout=undefined;
                 }
                 resolvewhenReady(chan); 
                 resolvewhenReady = undefined;
             }
             
        };
        
        return chan;
    }
    
    function openBrowserChannel(resolve,reject){
        var messageChannel = new MessageChannel();
        var chan = channel (messageChannel.port1,resolve,reject);
        worker.postMessage({name:name}, [messageChannel.port2]);
    }
    
    function openServiceChannel(resolve,reject){
        
        if (!openNamedMessageChannel.masterChannelListener) {
            
            openNamedMessageChannel.namedChannels={};
            
            openNamedMessageChannel.masterChannelListener = function (event) {
                
                const RESOLVE = openNamedMessageChannel.namedChannels[event.data.name];
                if (RESOLVE) {
                   delete openNamedMessageChannel.namedChannels[event.data.name];
                   channel (event.ports[0],RESOLVE,reject);
                }
                
            };
            
            self.addEventListener('message', openNamedMessageChannel.masterChannelListener);
            
        }
        openNamedMessageChannel.namedChannels[name] = resolve;        
    }
    
    
}
 
 
function messageSender(NAME,port) {
   // service-worker.js
   if (!isSw) return;
    
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
   var moi = {
       send : function (msg) {
           //console.log({msg});
           if (pending) {
               pending.push(msg);
           } else {
               messagePort.postMessage({ type : NAME, msg : msg });
           }
       },
       replies : [],
       reply : function (msg) {
           // ignore replies until this handler is replaced.
           moi.replies.push(msg);
       }
   };
   return moi;
}

function messageReceiver(worker,NAME,cb) {

// app.js - somewhere in our main app
    
    if (!worker||isSw) return;
    
    const messageChannel = new MessageChannel();
    
    // First we initialize the channel by sending
    // the port to the Service Worker (this also
    // transfers the ownership of the port)
    worker.postMessage({
      type: NAME ,
    }, [messageChannel.port2]);
    
    // Listen to the response
    messageChannel.port1.onmessage = (event) => {
      // Print the result
      cb(event.data.msg);
    };
    
    return {
        done : function () {  },
        
        send : function (reply) {
            worker.postMessage(reply, [messageChannel.port2]);
        }
    }
}



function _bad_sw_message () {
    throw new Error ("sw_message invoked in non service worker context");
}

function _sw_message( e ) {
    
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
