const sw_path = '/zed/index.sw.js';



function showRefreshUI(registration) {

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

var installerProgress,progress_message=document.getElementById("progress_message");

function installerMsg(cb,msg){
    if (msg.files) {
       installerProgress =   document.getElementById("progress_container");
       installerProgress.innerHTML= '<progress max="' + msg.files.length + '" value="0"> 0% </progress';
       installerProgress = installerProgress.children[0];
    } else {
        if (installerProgress && msg.downloaded) {
            installerProgress.progress = msg.downloaded;
        }
    }
    if (msg.url) {
        progress_message.innerHTML = msg.url;
    } 
    
    if (msg.done && cb) {
        cb();
    }
}



function messageReceiver(worker,NAME,cb) {
    
    if (!worker) return;
    
    // app.js - somewhere in our main app
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
        done : function () {
           
        }
    }
}

function afterInstall(reg,cb) {
    
    console.log("installed");
    messageReceiver(
        reg.installing || reg.waiting || reg.active ,
        'UPDATE',
        installerMsg.bind(this,cb)
    );
    
}






function onNewServiceWorker(registration, callback) {
  if (registration.waiting) {
    // SW is waiting to activate. Can occur if multiple clients open and
    // one of the clients is refreshed.
    return callback();
  }

  function listenInstalledStateChange() {
    registration.installing.addEventListener('statechange', function(event) {
      if (event.target.state === 'installed') {
        // A new service worker is available, inform the user
        callback();
      }
    });
  }

  if (registration.installing) {
    return listenInstalledStateChange();
  }

  // We are currently controlled so a new SW may be found...
  // Add a listener in case a new SW is found,
  registration.addEventListener('updatefound', listenInstalledStateChange);
}

window.addEventListener('load', w_load);



function w_load ( e ) {
    
    
    var sw_controllerchange_refreshing;
    function sw_controllerchange(event) {
      if (sw_controllerchange_refreshing) return; // prevent infinite refresh loop when you use "Update on Reload"
      sw_controllerchange_refreshing = true;
      console.log('Controller loaded');
      window.location.reload();
    }
    
    // When the user asks to refresh the UI, we'll need to reload the window
    navigator.serviceWorker.addEventListener('controllerchange',sw_controllerchange);
  
    navigator.serviceWorker.register( sw_path )
    .then(function (registration) {
        // Track updates to the Service Worker.
      if (!navigator.serviceWorker.controller) {
        // The window client isn't currently controlled so it's a new service
        // worker that will activate immediately
        afterInstall(registration,function(){
            window.boot_zed();
            
        });
        
        
        navigator.serviceWorker.ready.then(afterInstall);
        return;
      }
      
      registration.update();
  
      onNewServiceWorker(registration, function() {
          
        afterInstall(registration,function(){
            
            showRefreshUI(registration);
            window.boot_zed();
            
        });
        
        
      });
       
    });
    
    
}





