
/* global self, importScripts, caches ,registration,clients ,Response,localforage, cacheName */

/* global getPWAFiles, updateURLArray */
 
const isSw = typeof self+typeof window+typeof caches+typeof document ==='objectundefinedobjectundefined',
      
      isBrowser  = !isSw,
      
      sw_message = isSw ? _sw_message : _bad_sw_message,
      
      isPromise  = function (p) {
          return typeof p==='object' && p.constructor === Promise;
      },
      
      toPromise = function (p) {
          return isPromise(p) ? p : Promise.resolve(p);
      },
      
      toResolver = function (f) {
          if (f) return f;
          return function(){return Promise.resolve(); };
      },
      
      //unitilty function to copy arguments into a standard Array
      cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice),

      publishedFunctions = {},// functions that are available to be exported to peer
      requestedFunctions = {},// functions that peer has requested, which were not published
      neededFunctions    = {},// functions that this window/worker needs to import, but haven't been published yet 
      availableFunctions = {},// functions that this window can import.
      exportedFunctions   = {},// functions that can be called by peer
      importedFunctions  = {};// functions that can call counterpart in peer
      
if (isSw) {
    addEventListener("message", serviceWorkerMaster); 
}

function setTimeoutDebug(timeout,interval,name) {
    return setTimeout(function(err){
        console.log(err);
        timeout();
    },interval,new Error("firing named timeout:"+name));
}

function publishNamedFunction (name,fn,worker) {
    
    if (typeof name === 'function') {
        worker = fn;
        fn     = name;
        name   = fn.name;
    }

    return promiseWrap(browserPublishNamed,serviceWorkerPublishNamed,worker);
    
    function browserPublishNamed(resolve,reject,worker){

        const messageChannel = new MessageChannel();
        
        var def = requestedFunctions[name] || publishedFunctions[name];
        if (def) {
            def.port       = messageChannel.port1;
            def.fn         = fn;
            def.onexported = resolve;
            if (def.onexported_timeout) {
                clearTimeout(def.onexported_timeout);
            }
            
            delete requestedFunctions[name];
            publishedFunctions[name]=def;
            def.onexported_timeout = setTimeoutDebug(reject,5000,"onexported_timeout");
            
        } else {
            publishedFunctions[name] = def = {
                port               : messageChannel.port1,
                fn                 : fn,
                onexported         : resolve,
                onexported_timeout : setTimeoutDebug(reject,5000,"onexported_timeout")
            };
        }
        
        def.port.onmessage = onIncomingMessage(def);
        
        sendPortData(messageChannel.port2,{publish:name}, "browserPublishNamed", worker );
        
    }
    
    function serviceWorkerPublishNamed(resolve,reject){
        
        const def = requestedFunctions[name];
        
        if (def) {
            def.port.onmessage = onIncomingMessage(def);
            def.fn = fn;
            delete requestedFunctions[name];
            exportedFunctions[name]=def;
            sendPortData(def.port,{publish:name},"serviceWorkerPublishNamed");
            resolve (def);
        } else {
            publishedFunctions[name] = {
                fn                 : fn,
                onexported         : resolve,
                onexported_timeout : setTimeoutDebug(reject,5000,"onexported_timeout")
            };
        }
        
    }

}

function importPublishedFunction (name,worker) {
    
    return promiseWrap(browserImportPublished,serviceWorkerImportPublished,worker);
    
    function browserImportPublished(resolve,reject,worker) {

        const messageChannel = new MessageChannel();
        
        const def = {
           port               : messageChannel.port1,
           onimported         : resolve,
           onimported_timeout : setTimeoutDebug(reject,5000,"onimported_timeout")
        };
        
        def.port.onmessage = onIncomingMessage(def);
        
        worker.postMessage(JSON.stringify({import:name}), [messageChannel.port2]);

    }
    
    function serviceWorkerImportPublished(resolve,reject){
        
        var def = availableFunctions[name];
        
        if (def) {
            def.port.onmessage = onIncomingMessage(def);
            sendPortData(def.port,{import:name},"serviceWorkerImportPublished");
            if (def.onimported_timeout) {
                clearTimeout(def.onimported_timeout);
                delete def.onimported_timeout;
            }
            resolve (remoteHandler (def));
        } else {
            neededFunctions[name] = def = {
                onimport           : function (def){return resolve(remoteHandler (def));},
                onimported_timeout : setTimeoutDebug(reject,5000,"onimported_timeout")
            };
        }
        
    }
    
    
    function remoteHandler (def) {
        
        return function ( ) {
            
            const id = Date.now().toString(36)+Math.random().toString(36);
            
            const msg = JSON.stringify({
                invoke : name,
                args   : cpArgs(arguments),
                id     : id
            } );
            
            return new Promise(toCallRemote);
            
            function toCallRemote (resolve,reject) {
               def.onresult = resolve;
               def.onerror  = reject;
               def.port.postMessage(msg);
            }
            
        };
    }
    
}

function getEventData(event) {
  try {
      return JSON.parse(event.data);
  } catch (e) {
      return {};
  }
}

function sendPortData(port,data,debug,worker) {
    const json = JSON.stringify(data,undefined,4);
    if (worker) {
       worker.postMessage(json,[port]); 
    } else {
       port.postMessage(json);
    }
    console.log(debug+":"+json);
}

function onIncomingMessage(def){
    
    return function (event) {
        
        const event_data=getEventData(event);
        console.log("onIncomingMessage:"+event.data);
        
       ["invoke","complete","import","export"].some(function(verb){
            const notify  = "on"+verb+"ed"; 
            const notify_timeout  = notify+"_timeout"; 
            const fn_name = event_data[verb];
            
            if (fn_name &&  def[notify] ) {
                 
                if (def[notify_timeout]) {
                    console.log("clearing Timeout:",notify_timeout);
                   clearTimeout(def[notify_timeout]);
                   delete def[notify_timeout];
                } else {
                    console.log("!!! Timeout not set:",notify_timeout);
                }
                
                if (verb==="import" && publishedFunctions[ fn_name ] === def) {
                    exportedFunctions[ fn_name ] = def;
                    console.log("onIncomingMessage:publishedFunctions[",fn_name,"]--> exportedFunctions");
                    delete publishedFunctions[ fn_name ];
                }
                
                switch  (verb) {
                    
                    case "export":
                        
                    case "import":  {
                        def[ notify ](def);
                        delete def[ notify ];
                        return true;
                    }
                    case "complete": {
                        const trigger  = event_data.id;
                        const triggers = event_data.result && def.onresult[ trigger ] ;
                        if (
                            typeof trigger==='string'+typeof triggers === 'stringobject'
                            ) {
                               const notifier = triggers[event_data.notify];
                               if (typeof notifier==='function') {
                                   notifier(event_data.result);
                               }
                               delete def.onresult[ trigger ];
                        }
                        return true;
                    }
                    case "invoke" :{
                        
                            const id = event_data.id;
                            
                            const 
                            notifyResult = function(result){
                                sendPortData(def.port,{
                                   complete:name,
                                   notify:"onresult",
                                   result:result,
                                   id:id},
                                   "onIncomingMessage/invoke-notifyResult");
                            },
                            
                            notifyError = function(err) {
                                sendPortData(def.port,{
                                complete:name,
                                notify:"onerror",
                                result:{message:err.message||err,stack:err.stack||''},
                                id:id},
                                "onIncomingMessage/invoke-notifyError");
                            };
                            
                            try {
                                
                                toPromise( 
                                    
                                    // function can return a value or a promise  to a value
                                    def.fn.apply(this,event_data.args||[]) 
                                    
                                ) .then(notifyResult)
                                     .catch (notifyError);
                                
                            } catch (e) {
                                
                                notifyError(e);
                                
                            }
                        
                            return true;
                        }
                }
                return false;
            }
        });
        
    };
    
}

function serviceWorkerMaster(event){
    if (isBrowser) return;
    
    const event_data=getEventData(event);
    console.log("serviceWorkerMaster:"+event.data);
    var fn_name = event_data.publish; 
    if (fn_name) {
        // peer is publishing a function
        let def = neededFunctions[event_data.publish];
        if (def) {
            // this worker needs this function
            def.port = event.ports[0];
            def.port.onmessage = onIncomingMessage(def);
            sendPortData(def.port,{imported:event_data.publish},"serviceWorkerMaster");
            if (def.onexported) {
                def.onexported(def);
                delete def.onexported;
            }
            delete neededFunctions[event_data.publish];
            importedFunctions[event_data.publish]=def;
            console.log("serviceWorkerMaster:neededFunctions[",fn_name,"]--> importedFunctions");
        } else {
            availableFunctions[ event_data.publish ] = def = {
               port : event.ports[0]
            };
            def.port.onmessage = onIncomingMessage(def);
            console.log("serviceWorkerMaster:",fn_name,"--> availableFunctions");
        }
    }
    
    fn_name = event_data.import;
    if (event_data.import) {
        
        let def = publishedFunctions[ event_data.import ];
        if (def ) {
            //sw already published this function, which peer is now publishing
            def.port = event.ports[0];
            def.port.onmessage = onIncomingMessage(def);
            def.port.onmessage(event);
            
        } else {
            // peer is requesting a yet to be published function
            requestedFunctions[ event_data.import  ] = def = {
                port : event.ports[0]
            };
            def.port.onmessage = onIncomingMessage(def);
            console.log("serviceWorkerMaster:",fn_name,"--> requestedFunctions");
        }

    }
}



function promiseWrap(browserPromised,serviceWorkerPromised,worker) {
    
    return new Promise(promised);
    
    function promised(resolve,reject) {
        if (isBrowser) {
            
            if (!worker) {
                navigator.serviceWorker.getRegistration().then(chooseRegWorker);
            } else {
                browserPromised(resolve,reject,worker);
            }
    
        } else {
            worker = undefined;
            serviceWorkerPromised(resolve,reject);
        }
        
        
        function chooseRegWorker(registration) {
          if(registration){
                const worker = registration.active  || registration.waiting  || registration.installing;
                if (worker) {
                   browserPromised(resolve,reject,worker);
                } else {
                   reject();   
                }
          }
        } 
    
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
         pending.splice(0,pending.length);
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
    };
}



function _bad_sw_message () {
    throw new Error ("sw_message invoked in non service worker context");
}

function _sw_message( e ) {
    
    if (!(e.data && e.data.type)) return ;
    
    if (e.data.type === 'SKIP_WAITING') {
        return self.skipWaiting();
    }
 
   
   
}  
