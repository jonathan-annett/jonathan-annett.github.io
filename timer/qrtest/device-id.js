
var localDeviceId;

function getDeviceId(cb) {
    
      var http = new XMLHttpRequest();
      var url = 'localId';
      var json = JSON.stringify({localDeviceId:localStorage.getItem("localDeviceId")});
      http.open('POST', url, true);

      //Send the proper header information along with the request
      http.setRequestHeader('Content-type', 'application/json');

      http.onreadystatechange = function() {//Call a function when the state changes.
          if(http.readyState == 4 && http.status == 200) {
            try {
              
              localDeviceId = JSON.parse(http.responseText).localDeviceId;
              localStorage.setItem("localDeviceId",localDeviceId);
              cb(localDeviceId);
            } catch (e) {
              cb();
            }                  
          }
      };
      http.send(json);   
    
  }
