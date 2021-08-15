/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, swResponseZipLib  */
ml([],function(){ml(2,

    {
        Window: function createBGFunction( ) {
            
         return  function (code, hysteresis) {
    
                    let src = "var handler="+ code.toString() +",\n"+
                              "args,on_msg;\n\n"+
                              "self.onmessage=" + onmessage_src() + ";\n";
                                 
                    let blob = blobFromString(src, 'application/javascript');
                    src = null;
    
                    let url = URL.createObjectURL(blob);
    
                    let worker = false; // after the first call, this will be set to the worker object
    
                    let delay;
    
                    return hysteresis ? hfn : fn;
    
                    function hfn(data, cb) {
                        if (delay) {
                            clearTimeout(delay);
                        }
                        if (worker) {
                            worker.postMessage({terminated:true});
                        }
                        delay = setTimeout(fn, hysteresis, data, cb);
                    }
    
                    function fn(data, cb) {
                        delay = undefined;
                        if (data === null && cb === undefined) {
                            return cleanup();
                        }
    
                        if (worker) {
                            // this is a restart request, since the worker still exists
                            // so terminate the object and fall through
                            console.log("terminating worker");
    
                            worker.removeEventListener("message", messageHandler);
                            worker.removeEventListener("messageerror", abortWorker);
                            worker.removeEventListener("rejectionhandled", abortWorker);
                            worker.removeEventListener("unhandledrejection", abortWorker);
                            worker.terminate();
    
                        }
    
                        // create a (new ) Worker object
                        worker = new Worker(url);
                        worker.cb = cb;
    
                        worker.addEventListener("message", messageHandler);
    
                        worker.addEventListener("messageerror", abortWorker);
    
                        worker.addEventListener("rejectionhandled", abortWorker);
    
                        worker.addEventListener("unhandledrejection", abortWorker);
    
                        console.log("posting", data);
    
                        worker.postMessage(data);
                        
                        return worker;
    
                    }
    
                    function abortWorker(e) {
                        worker = undefined;
                    }
    
                    function blobFromString(str, typ) {
                        return new Blob([str], {
                            type: typ
                        });
                    }
    
                    function messageHandler(e) {
                        if (worker) {
                            if (e.data.cb === 'stop') {
                                worker.cb(undefined, true);
                                worker = undefined;
                            } else {
                                if (e.data.cb) {
                                    worker.cb(e.data.cb, false);
                                }
                            }
                        }
                    }
    
                    function cleanup() {
                        if (blob && url) {
                            blob = null;
                            URL.revokeObjectURL(url);
                            url = null;
                        }
                    }
    
                    // this function (onmessage_src) is declared to contain it's source
                    // it is not called in this context, but instead in the worker context
                    
                    function onmessage_src(args,handler,postMessage,on_msg){
                             return (
    function(e) {
    
        if (!args) {
            // this is the first message, which kicks off the background function
    
            // save the args as a "global" (from the worker' perspective)
            args = e.data;
    
            // call the background handler, which returns something truthy if it is persistent
            const looping = handler(args,postMsg);
            postMessage({looping: !! looping});    // coalesce looping to a boolean
            if ( !! looping) {
                if (typeof looping === 'function') {
                    //save on_msg callback for future incoming messages
                    on_msg = looping;
                }
            } else {
                close();
            }
        } else {
    
            // this is an additional message, sent once the function has started
            // merge the keys into the args object
            Object.keys(e.data).forEach(function(k) {
                console.log("setting", k);
                args[k] = e.data[k];
            });
    
            if (on_msg) {
                on_msg(args);
            }
    
        }
        
        
        
        
        function postMsg(msg) {
            postMessage({cb: msg || 'stop'});
            if (!msg) close();
        }
    
    }
                    
    ).toString();
                        
                        
                          
                    }
    
                };
      
        }
    }, {
        Window: [ ]
    }

    );

 

});

