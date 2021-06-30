/* global 
*/
const  
[ html,keyPRE,                    refresh_files,   load_new_version,]   = 
["html","html .notbeta pre.key","#refresh_files","#load_new_version"].map(qs);

 
 
 function getConfig() {
     return new Promise(function (resolve,reject){
         
         fetch("betakeys.json")
           .then(toJSON)
               .then(resolve).catch(reject);


     });
 }
 

     
 [
     "registered",
     "activated"].forEach(function(x){
     window.addEventListener('ml.pwa.'+x,function(){
         
       //  if (window.matchMedia('(display-mode: standalone)').matches) {  
             
             betaTesterApproval().then(function(){
                  location.replace(location.href);
             }).catch(
                function(err){
                    console.log("site not available",err);
                }    
             ); 
      //     }
     });
 });
 
 
 function betaTesterApproval() {
     
     if (!window.crypto) {
        return Promise.reject();
     }

     return new Promise(function(resolve,reject) {
         const hashAlgo = "SHA-256";
         const seedSize = 512;
         const localStorageKey = "betaTesterKey";
         
          getConfig().then(function(config){
             
             if (config && config.betaTesterKeys) {
                 const keyAsHex = localStorage[localStorageKey];
                 if (keyAsHex) {
                     const keyAsBuffer = bufferFromHex(keyAsHex);
                     
                     return window.crypto.subtle
                         .digest( hashAlgo, keyAsBuffer ).then (
                             
                             function(hashedKeyasBuffer) {
                                 
                                const hashedKeyHex = bufferToHex(hashedKeyasBuffer);
                           
                                  if ( config.betaTesterKeys.indexOf(hashedKeyHex) < 0 ) {
                                      console.log("your beta tester approval code:",hashedKeyHex);
                                      html.classList.remove("beta");
                                      html.classList.add("notbeta");
                                      keyPRE.innerHTML=hashedKeyHex;
                                      reject();
                                  } else {
                                      html.classList.add("beta");
                                      html.classList.remove("notbeta");
                                      config.testerKey = keyAsHex;
                                      resolve(config);
                                  }
                                  
                             }
                         ); 
                     
                 } else {
                     
                     var seed = new Uint32Array(seedSize);
                     window.crypto.getRandomValues(seed);
                     return window.crypto.subtle.digest(hashAlgo,seed).then(function(unhashedKey) {
                         const unhashedKeyHex = bufferToHex(unhashedKey);
                         return window.crypto.subtle.digest(hashAlgo,unhashedKey).then(function(hashedKey) {
                              localStorage[localStorageKey] = unhashedKeyHex;
                              html.classList.remove("beta");
                              html.classList.add("notbeta");
                              keyPRE.innerHTML=bufferToHex(hashedKey);
                              reject();
                         });        
                     });
                 }
             } else {
                reject();  
             }
             
         }).catch(reject);
         
     });
     
 }
 
 // generic tools 

 function qs(d,q,f) {
     let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
     if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
     if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
     if (D+Q===O+S){
        r = d.querySelector(q);
        if (r&&typeof r+typeof f===O+FN) {
             if (f.name.length>0) 
                r.addEventListener(f.name,f);
             else 
                f(r);
         }
     }
     return r;
 }
 
 function toJSON(response) { return response.json(); }
 
 
 function fromBufferToHex(buffer){ 
     return new Promise(function (resolve,reject){
         try {
             const hex = bufferToHex(buffer);
             resolve(hex);
         } catch (e) {
             reject(e);
         }
     });
 }
 
 function bufferFromHex (hex) {
     if (hex.length === 0) return new ArrayBuffer(0);
     if ((hex.length % 8) !== 0 ) throw new Error("incorrent hex length - need multiples of 8 digits");
     
     const ui32Array = [];
     for (let i =0; i < hex.length; i+=8) {
         ui32Array.push(Number.parseInt("0x"+hex.substr(i,8)));
     }
     return Uint32Array.from(ui32Array).buffer;
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
         hexCodes.push(paddedValue);
     }
     // Join all the hex strings into one
     return hexCodes.join("");
 }
 
 