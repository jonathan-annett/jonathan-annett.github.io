
/* global URLSearchParams,crypto */
 const queryString = window.location.search;
 
const urlParams = new URLSearchParams(queryString);
 
 
 const b64Json = urlParams.get("data");
 if (b64Json){
    const json  = btoa(b64Json);
    try {
        const data = JSON.parse(json);
        if (data) {
           restore(data);
        }
    } catch (e) {
        
    }
} else {
    const data_id = localStorage.data_id;
    if (!data_id) {
        
         const data_id = Math.random().toString(36).substr(-8)+Math.random().toString(36).substr(-8)+Math.random().toString(36).substr(-8)+Math.random().toString(36).substr(-8) + Date.now().toString(36).substr(-6);
         localStorage.data_id = data_id;
        
         const scan_url = "https://pollen-diamond-cone.glitch.me/";
         const here     = location.href.split('?')[0];
         const reqId  = data_id;
         const url    = scan_url+"?id="+encodeURIComponent(reqId);
         const url2   = scan_url+"collect?id="+encodeURIComponent(reqId)+"&for="+encodeURIComponent(here);
         const qr_url = "https://qr.1mb.site?code="+encodeURIComponent(url)+"&then="+encodeURIComponent(url2)+"&delay=1&quiet=1";
         window.location.replace(qr_url);
         
    } else {
        testStorage()
    }
    let data = backup ();
    delete data.data_id;
    let last_json = JSON.stringify(data);
    
    let interval = setInterval(function(){
        const data = backup ();
        const data_id = data.data_id;
        delete data.data_id;
        const json = JSON.stringify(data);
        if (json!==last_json) {
            let iframe = document.createElement("iframe");
            iframe.src = "https://pollen-diamond-cone.glitch.me/deposit?id="+encodeURIComponent(data_id)+"&data="+encodeURIComponent(data);
            document.body.appendChild(iframe);
            setTimeout(function(){ document.body.removeChild(iframe);},5000);
            last_json=json;
        }
        
    },30*1000);
}



function testStorage(){
         
         if (!localStorage.test) {
             localStorage.test = Math.random().toString(36).substr(-8);
             console.log("defined:localStorage.test="+localStorage.test);
         } else {
             console.log("retreived:localStorage.test="+localStorage.test);
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
 
