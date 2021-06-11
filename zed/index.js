
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/zed/install_pwa_sw.js')
  .then(afterInstall).catch((error) => {
    // registration failed
    console.log('Registration failed with ' + error);
  });
}


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

var installerProgress,progress_message=document.getElementById("progress_message");

function installerMsg(msg){
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

function afterInstall(reg) {
    
    console.log("installed");
    
    messageReceiver(reg.active||reg.waiting,'UPDATE',installerMsg);  

}


