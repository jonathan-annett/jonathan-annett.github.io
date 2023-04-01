

/* global qrConnect, getDeviceId, loglines,shareBtn, urlbase  */

qrConnect(function(err,mode,data){
  
    if (err) return log(err);
    
    switch (mode) {
      case "connect": 
          onConnectToPeer(data);
          break;
      case "data": 
          onDataFromPeer(data);
          break;
    }
    
  });
  
  shareBtn.onclick=function(){
    
       getDeviceId(function (connect_id) {
          window.prompt("Copy to clipboard: Ctrl+C, Enter", urlbase + "link?"+connect_id);
       });
  };
  
  
  function onConnectToPeer(sendToPeer) {
    console.log("connected to peer",sendToPeer,"func");
    sendToPeer("hello");
  }
  
  
  function onDataFromPeer(data) {
    console.log("got data from peer:",data);  
  }
  
  function log(x) {
     loglines.textContent += "\n";
     loglines.textContent += x.toString();  
  }
  
  