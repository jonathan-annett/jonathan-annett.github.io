/*

global SimplePeer, getDeviceId, QRCode, qrcode, qrclick, localDeviceId

*/

const urlbase = "https://messy-aback-woodwind.glitch.me/";

function goPostal(url, data, cb) {
    var http = new XMLHttpRequest();
    var json = JSON.stringify(data);
    http.open("POST", urlbase + (url.replace(/^\//,'')), true);
  
    //Send the proper header information along with the request
    http.setRequestHeader("Content-type", "application/json");
  
    http.onreadystatechange = function () {
      //Call a function when the state changes.
      if (http.readyState == 4 && http.status == 200) {
        try {
          cb(null, JSON.parse(http.responseText));
        } catch (e) {
          cb(e);
        }
      }
    };
    http.send(json);
  }
  
  
  function makePeer(init,signalKey,signalWaitKey,cb) {
      let errored = false;
  
      let peer = new SimplePeer({
        initiator:   init,
        trickle:     false,
        objectMode : false
      });
  
      peer.on("error", function (err) {
        if (errored) return;
        errored = true;
        cb(err);
      });
  
      peer.on("signal", function (data) {
        console.log("sending signal data to peer");
        qr_css_state("signalling");      
        goPostal(
          "/signal",
          { signal: signalKey, signalData: data },
          function () {
            console.log("signal data sent to peer", data);
          }
        );
      });
  
      peer.on("connect", function () {
        if (errored) return;
        qr_css_state("connected");
        qr_css_state("connecting",false);
        qr_css_state("signalling",false);      
        
    
        cb(null, "connect", function send(data) { peer.send(JSON.stringify(data));});
      });
  
      peer.on("data", function (data) {
        if (errored) return;
        
        cb(null, "data", JSON.parse(String(data)));
      });
  
      const onSignal = function (err, signalData) {
        if (err) {
          errored = true;
          return cb(err);
        }
  
        peer.signal(signalData);
        console.log("was signalled by peer",signalData);
  
        waitForSignal(signalWaitKey, onSignal);
      };
  
      waitForSignal(signalWaitKey, onSignal);
    
            
  }
  
  
  function qrConnect(cb) {
    
    qr_css_state("connecting");
    qr_css_state("connected",false);
    qr_css_state("signalling",false);      
        
    
    getDeviceId(function (localDeviceId) {
      if (localDeviceId) {
        goPostal("/connect", { deviceId: localDeviceId }, function (err, json) {
          if (err) return cb(err);
  
          let connectKey = json.key;
          let link = urlbase + "/c?" + connectKey;
          
          if (typeof qrclick !=='undefined') {
             qrclick.href = link;
          }
          
          if (typeof qrcode !=='undefined') {
             qrcode.innerHTML = "";
          }
  
          if (typeof QRCode !=='undefined') {
              let qr = new QRCode(document.getElementById("qrcode"), link);
          }
  
          goPostal("/connect-wait", { key: connectKey }, onConnectWait);
  
          function onConnectWait(err, json) {
            if (err) return cb(err);
  
            if (json.scanned) {
              
              if (typeof qrcode !=='undefined') {
                 qrcode.innerHTML = "";
              }
              return goPostal(
                "connect-wait",
                { key: connectKey },
                onConnectWait
              );
            }
            
            makePeer(true,json.signal,json.signalWait,cb);
            
          }
          
        });
      }
    });
  }
  
  function qrListen(cb) {
    
    qr_css_state("connecting");
    qr_css_state("connected",false);
    qr_css_state("signalling",false);      
  
    getDeviceId(function (localDeviceId) {
      if (localDeviceId) {
        goPostal("listen", { deviceId: localDeviceId }, function (err, json) {
          if (err) return cb(err);
  
          let listenKey = json.key;
          let link = urlbase + "l?" + listenKey;
  
          if (typeof qrclick !=='undefined') {
            qrclick.href = link;
          }
          if (typeof qrcode !=='undefined') {
             qrcode.innerHTML = "";
          }
  
          if (typeof QRCode !=='undefined') {
              let qr = new QRCode(document.getElementById("qrcode"), link);
          }
  
          goPostal("listen-wait", { key: listenKey }, onListenWait);
  
          function onListenWait(err, json) {
            
            if (err) return cb(err);
  
            if (json.scanned) {
              
              if (typeof qrcode !=='undefined') {
                 qrcode.innerHTML = "";
              }
              return goPostal("listen-wait", { key: listenKey }, onListenWait);
            }
            
            makePeer(false,json.signal,json.signalWait,cb);
  
          }
        });
      }
    });
  }
  
  function waitForSignal(signalKey, cb) {
    goPostal(
      "/signal-wait",
      { signal: signalKey },
  
      function (err, json) {
        if (err) return cb(err);
        if (json) {
          qr_css_state("signalled");      
          return cb(null, json);
        }
        waitForSignal(signalKey, cb);
      }
    );
  }
  
  function qr_css_state (state,onoff) {
     document.body.classList[onoff===false?"remove":"add"](state);
  }
  