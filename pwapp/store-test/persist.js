
/* global URLSearchParams,crypto */
 const queryString = window.location.search;
 
 const urlParams = new URLSearchParams(queryString);
 
 let storageJson,checkStore;
 
 const id = urlParams.get('id');
 if (id) {
     if (!localStorage.test) {
         serverCmd(id,"getItem",Math.random().toString(36).substr(-8),function(err,data){
            if (!err && data) {
                storageJson=data;
                restore(JSON.parse(data));
            }
            testStorage();
         });
     } else {
        testStorage();
     }
} else {
    const req = urlParams.get('req');
    if (req) {
        console.log(req);
    }
}

function testStorage(){
         
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
         
}



function checkStorage() {
    if (checkStore) {
        clearTimeout(checkStore);
        checkStore=undefined;
    }
    const json = JSON.stringify(backup ());
    if (json!==storageJson) {
        
            serverCmd(
                id,"setItem",
                json,
                function(err,data){
                  storageJson = json;
                  checkStore = setTimeout(checkStorage,30000); 
               });
            
    } else {
       checkStore = setTimeout(checkStorage,30000);
    }
}



 function backup () {
     const data = {
         local : {},
         forage : {}
     }
     Object.keys(localStorage).forEach(function(k){
         data.local[k]=localStorage.getItem(k);
     }); 
     
    return data;
     
 }
 

 function restore (data ) {
     try {
         Object.keys(data.local).forEach(function(k){
             localStorage.setItem(k,data.local[k]);
         }); 
     } catch (e) {
     }
 }
 
 
 function serverCmd(id,cmd,data,cb) {
     const salt = "wkjsdfksnfknaskfjfjksfd86783ikjenbf";
     const json = JSON.stringify(data);
     const here = location.href.replace(/\?.*$/,'');
     sha1SubtleCB(new TextEncoder().encode(id+json+salt+here),function(err,sha1){
          if (err) return cb(err);
          
         const payload = JSON.stringify({
             id,cmd,data,sha1,for:here
         });
              
         window.location.replace("https://pollen-diamond-cone.glitch.me?req="+encodeURIComponent(btoa(payload)));
       
          
         
         /* 
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
            
         xhr.send(payload);*/
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
 
