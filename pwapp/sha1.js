/* global ml,self,Rusha, crypto */
ml(
// rusha is only used as a fallback for crypto.subtle, or for sync usage 

`Rusha | ${ml.c.app_root}rusha.js`,function(){ml(2,

    {   Window: function sha1Lib(lib) { return lib ;},
        ServiceWorkerGlobalScope: function sha1Lib(lib) { return lib ;}
    }, (()=>{  
        
        // see if crypto.subtle exists in browser context
        const SUBTLE = typeof crypto==='object' && typeof crypto.subtle === "object" &&  crypto.subtle;
        
        return {
            Window:                   [ chooseSha1Lib () ],
            ServiceWorkerGlobalScope: [ chooseSha1Lib () ]
        };
     

     function chooseSha1Lib () {
         // return the most applicable sha1 lib, based on availability of crypto.subtle
         return !!SUBTLE ? subtleAvailable : rushaFallback;
     }

     function subtleAvailable () { 
         
         sha1Subtle.bufferToHex = bufferToHex;
         sha1Subtle.arrayToHex = arrayToHex;
         sha1Subtle.cb=sha1SubtleCB;
         sha1Subtle.sync=sha1RushaSync;// we need to use Rusha for sync 
         
         sha1Subtle.cb.raw=sha1SubtleRawCB;
         sha1Subtle.sync.raw=sha1RushaRawSync;// we need to use Rusha for sync 
         
         return sha1Subtle ;
     }
     
     function rushaFallback () {
         sha1Rusha.bufferToHex=bufferToHex;
         sha1Rusha.arrayToHex=arrayToHex;
         sha1Rusha.cb=sha1RushaCB;
         sha1Rusha.sync=sha1RushaSync;
         
         sha1Rusha.cb.raw=sha1RushaRawCB;
         sha1Rusha.sync.raw=sha1RushaRawSync;

         return sha1Rusha;
     }
     
        
      function sha1Rusha(buffer){ 
              return Promise.resolve(Rusha.createHash().update(buffer).digest('hex'));

      }
      
      function sha1RushaRaw(buffer){ 
              return Promise.resolve(Rusha.createHash().update(buffer).digest());

      }

      function sha1Subtle(buffer){ 
              return SUBTLE.digest("SHA-1", buffer)
                 .then(function(digest){ return Promise.resolve(bufferToHex(digest));}); 
          
      }
      
      function sha1SubtleRaw(buffer){ 
              return SUBTLE.digest("SHA-1", buffer); 
      }
      
      
      function sha1RushaCB(buffer,cb){ 
             cb(undefined,
               Rusha.createHash().update(buffer).digest('hex')
             );
      
      }
      
      function sha1RushaRawCB(buffer,cb){ 
             cb(undefined,
               Rusha.createHash().update(buffer).digest()
             );
      
      }
      
      function sha1RushaSync(buffer){ 
          return Rusha.createHash().update(buffer).digest('hex');
      }
      
      function sha1RushaRawSync(buffer){ 
          return Rusha.createHash().update(buffer).digest();
      }
      
      function sha1SubtleCB(buffer,cb){ 
              return SUBTLE.digest("SHA-1", buffer)
                 .then(function(dig){cb(undefined,bufferToHex(dig));})
                   .catch(cb); 
          
      }
      
      function sha1SubtleRawCB(buffer,cb){ 
              return SUBTLE.digest("SHA-1", buffer)
                 .then(function(dig){cb(undefined,dig);})
                   .catch(cb); 
          
      }
      
      
      function arrayToHex(bytes) {
          const padding = '00';
          const hexCodes = [];
          if (bytes.length===0) return '';
         
          for (let i = 0; i < bytes.length; i ++) {
              // toString(16) will give the hex representation of the number without padding
              const stringValue = bytes[i].toString(16);
              // We use concatenation and slice for padding
              const paddedValue = (padding + stringValue).slice(-padding.length);
              hexCodes.push(paddedValue);
          }
          // Join all the hex strings into one
          return hexCodes.join("");
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
      
      
    })()

    );
    

});





