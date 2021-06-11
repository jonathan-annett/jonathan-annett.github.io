
function invokeServiceWorkerUpdateFlow(registration) {
    // TODO implement your own UI notification element
    let load_new_version = document.getElementById("load_new_version");
    load_new_version.disabled = false;
    const click = function () {
      load_new_version.removeEventListener('click', click);
      load_new_version.disabled = true;  
      if (registration.waiting) {
          // let waiting Service Worker know it should became active
          registration.waiting.postMessage('SKIP_WAITING');
      }
    };
    load_new_version.addEventListener('click', click);
}

// check if the browser supports serviceWorker at all
if ('serviceWorker' in navigator) {
    // wait for the page to load
/* jshint ignore:start */
    window.addEventListener('load', async () => {
        // register the service worker from the file specified
        console.log("registering service worker");
        
        const registration = await navigator.serviceWorker.register('install_pwa_sw.js')
        
        console.log("registered service worker");
        // ensure the case when the updatefound event was missed is also handled
        // by re-invoking the prompt when there's a waiting Service Worker
        if (registration.waiting) {
            invokeServiceWorkerUpdateFlow(registration)
        }

        // detect Service Worker update available and wait for it to become installed
        registration.addEventListener('updatefound', function ()  {
            if (registration.installing) {
                // wait until the new Service worker is actually installed (ready to take over)
                registration.installing.addEventListener('statechange', function()  {
                    if (registration.waiting) {
                        // if there's an existing controller (previous Service Worker), show the prompt
                        if (navigator.serviceWorker.controller) {
                            invokeServiceWorkerUpdateFlow(registration)
                        } else {
                            // otherwise it's the first install, nothing to do
                            console.log('Service Worker initialized for the first time')
                        }
                    }
                })
            }
        })

        let refreshing = false;

        // detect controller change and refresh the page
        navigator.serviceWorker.addEventListener('controllerchange', function () {
            if (!refreshing) {
                window.location.reload()
                refreshing = true
            }
        })
    })
    /* jshint ignore:end */
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


