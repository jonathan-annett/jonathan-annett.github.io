
/* global localforage, URLSearchParams,crypto */
 const queryString = window.location.search;
 
 const urlParams = new URLSearchParams(queryString);
 
 if (!localStorage.test) {
     localStorage.test = Math.random().toString(36).substr(-8);
     console.log("defined:localStorage.test="+localStorage.test);
 } else {
     console.log("retreived:localStorage.test="+localStorage.test);
 }
 
 if (!document.cookie) {
     document.cookie = Math.random().toString(36).substr(-8);
     console.log("defined:document.cookie="+document.cookie);
 } else {
     console.log("retreived:document.cookie="+document.cookie);
 }
 
 localforage.getItem('test', function (err, value) {
     if (err) {
        console.log("error getting localForage:",err);
     }
      if (value) {
          console.log("retreived:localForage.test="+value);
      } else {
          localforage.setItem('test', Math.random().toString(36).substr(-8), function (err) {
              if (err) {
                  console.log("error setting localForage:",err);
               }
               localforage.getItem('test', function (err, value) {
                   if (err) {
                      console.log("error getting localForage:",err);
                   }
                    if (value) {
                        console.log("defined:localForage.test="+value);
                    } 
               });
          });
      }
 });
 
 
 function backup (cb) {
     const data = {
         local : {},
         forage : {}
     }
     Object.keys(localStorage).forEach(function(k){
         data.local[k]=localStorage.getItem(k);
     }); 
     
     localforage.keys().then(function(keys){
         Promise.all(keys.map(function(k){
           return localStorage.getItem(k);
         })).then(function(values){
             
             keys.forEach(function(k,ix){
                 data.forage[k]=values[ix];
             });
             
             cb(data);
         });
     });
     
 }
 

 function restore (data,cb ) {
     try {
         Object.keys(data.local).forEach(function(k){
             localStorage.setItem(k,data.local[k]);
         }); 
     } catch (e) {
         return cb(e);
     }
     
     Promise.all(Object.keys(data.forage).map(function(k){
                     return localforage.setItem(k,data.local[k]);
                 })).then(function(){
         cb ();
     }).catch(cb);
     

 }
 
 
 function serverCmd(id,cmd,data,cb) {
     const salt = "wkjsdfksnfknaskfjfjksfd86783ikjenbf";
     const json = JSON.stringify(data);
     sha1SubtleCB(new TextEncoder().encode(id+json+salt),function(){
         const payload = JSON.stringify({
             id,cmd,data
         });
         
         var xhr = new XMLHttpRequest(); 
         xhr.open("POST", "https://pollen-diamond-cone.glitch.me/storage");
         xhr.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
         
         xhr.onerror=function(){
             cb(new Error("xhr error"));
         };
         
         xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
               if(xhr.status===200) {
                     try {
                        cb(undefined,JSON.parse(xhr.responseText));
                    } catch(e) {
                        cb(e);
                    }
               }
            }};
            
         xhr.send(payload);
     });  
 }
 
 
 function bufferToHex(buffer) {
     const padding = '00000000';
     const hexCodes = [];
     const view = new DataView(buffer);
     if (view.byteLength===0) return '';
     if (view.byteLength % 4 !== 0) throw new Error("incorrent buffer length - not on 4 byte boundary");
 
     for (let i = 0; i < view.byteLength; i += 4) {
         // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
         const value = view.getUint32(i);
         // toString(16) will give the hex representation of the number without padding
         const stringValue = value.toString(16);
         // We use concatenation and slice for padding
         const paddedValue = (padding + stringValue).slice(-padding.length);
         hexCodes.push(
             paddedValue.substr(6,2)+
             paddedValue.substr(4,2)+
             paddedValue.substr(2,2)+
             paddedValue.substr(0,2)
        );
     }
     // Join all the hex strings into one
     return hexCodes.join("");
 }
 
 function sha1SubtleCB(buffer,cb){ 
         return crypto.subtle.digest("SHA-1", buffer)
            .then(function(dig){cb(undefined,bufferToHex(dig));})
              .catch(cb); 
     
 }
 
 const id = urlParams.get('id');
 if (id) {
     serverCmd(id,"getItem",Math.random().toString(36).substr(-8),function(err,data){
        console.log(err,data);
     });
 }
