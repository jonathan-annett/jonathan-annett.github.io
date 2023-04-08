
function evenSimplerPeer() {
  
    const domain        = "even-simpler-peer.glitch.me";
    const iframe_url    = `https://${domain}/api`;
    const target_origin = `https://${domain}/`;
    
    const events = {
       connected    : [],
       message      : [],
       disconnected : []
    };
    
    const iframe = document.createElement('iframe');
    
    iframe.src = iframe_url;
    
    iframe.onload = function () {
      
        const payload = {
          target_origin : location.origin,
          target_href   : location.href.replace(/\?.*/,'')
        };
      
        let param_id = location.search.replace(/^\?/,'').replace(/\&.*/,'');
        
        if (param_id && param_id.length===24) {
          
          payload.own_id=param_id.substr(0,12);
          payload.peer_id=param_id.substr(12);
  
          setTimeout(location.replace.bind(location),150,payload.target_href);
      
        } 
          
        iframe.contentWindow.postMessage(payload,target_origin);    
        
    };
    document.body.appendChild(iframe);
         
    window.addEventListener('message',function(event){
  
        if (event.data.message) {
            events.message.forEach(function(fn){
              fn(event.data.message);
            });
        } else {
            if (event.data.connected) {
              //iframe.style.display="none";
              events.connected.forEach(function(fn){
                fn(event.data.connected);
              });
            } else {
              if (event.data.disconnected) {
                //iframe.style.display="block";              
                events.disconnected.forEach(function(fn){
                  fn(event.data.disconnected);
                });
              }
            }
        }
       
    });
    
    function sendToPeer(msg) {
        iframe.contentWindow.postMessage({send:msg},target_origin);     
    }
    
    function setPeerId(id) {
        iframe.contentWindow.postMessage({setPeerId:id},target_origin);      
    }
    
    return {
      
      send :      sendToPeer,
      
      setPeerId : setPeerId,
      
      on   : function (e,fn) {
         if (typeof e + typeof fn ==='stringfunction' && events[e]) {
            const ix = events[e].indexOf(fn);
            if (ix<0) events[e].push(fn);
         }
      },
      
      off   : function (e,fn) {
         if (typeof e + typeof fn ==='stringfunction' && events[e]) {
            const ix = events[e].indexOf(fn);
            if (ix>=0) events[e].splice(ix,1);
         }
      },
      
    };
    
  }
  