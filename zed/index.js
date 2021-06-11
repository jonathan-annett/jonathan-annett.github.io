((l,s,w,o,n)=>{if(s in w){w[o](l,()=>{n[s].register(`${s}.js`).then(afterInstall)});}})
('load','serviceWorker',window,'addEventListener',navigator);


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

var installerProgress;
function installerMsg(msg){
    if (!installerProgress) {
       installerProgress =   document.getElementById("progress_container");
       installerProgress.innerHTML= '<progress max="'+msg.progressTotal+'" value="'+msg.progress+'"> 70% </progress';
       installerProgress = installerProgress.children[0];
    } else {
        installerProgress.progress = msg.progress;
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
    
    return {
        done : function () {
           
        }
    }
}

function afterInstall() {
    console.log("installed");
    messageReceiver('UPDATE',function(msg){
        
        console.log(msg);
        
        
    });
}


