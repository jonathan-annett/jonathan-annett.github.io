


/* global ml,self,Rusha */
ml(0,ml(1),[ 'Rusha | rusha.js' ],function(){ml(2,ml(3),ml(4),

    {   Window: function sha1Lib(lib) { return lib ;},
        ServiceWorkerGlobalScope: function sha1Lib(lib) { return lib ;}
    }, (()=>{  return {
        Window:                   [ () => { 
            sha1Subtle.bufferToHex = bufferToHex;
            sha1Subtle.arrayToHex = arrayToHex;
            sha1Subtle.cb=sha1SubtleCB;
            sha1Subtle.sync=sha1RushaSync;// we need to use Rusha for sync 
            
            sha1Subtle.cb.raw=sha1SubtleRawCB;
            sha1Subtle.sync.raw=sha1RushaRawSync;// we need to use Rusha for sync 
            
            return sha1Subtle ;
        } ],
        ServiceWorkerGlobalScope: [ () => {
            
            sha1Rusha.bufferToHex=bufferToHex;
            sha1Rusha.arrayToHex=arrayToHex;
            sha1Rusha.cb=sha1RushaCB;
            sha1Rusha.sync=sha1RushaSync;
            
            sha1Rusha.cb.raw=sha1RushaRawCB;
            sha1Rusha.sync.raw=sha1RushaRawSync;
            
            
            return sha1Rusha;
            
        }   ]
    };
            
        
      function sha1Rusha(buffer){ 
              return Promise.resolve(Rusha.createHash().update(buffer).digest('hex'));

      }
      
      function sha1RushaRaw(buffer){ 
              return Promise.resolve(Rusha.createHash().update(buffer).digest());

      }

      function sha1Subtle(buffer){ 
              return window.crypto.subtle.digest("SHA-1", buffer)
                 .then(function(digest){ return Promise.resolve(bufferToHex(digest));}); 
          
      }
      
      function sha1SubtleRaw(buffer){ 
              return window.crypto.subtle.digest("SHA-1", buffer); 
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
      
      function sha1RushaSync(buffer,cb){ 
          return Rusha.createHash().update(buffer).digest('hex');
      }
      
      function sha1RushaRawSync(buffer,cb){ 
          return Rusha.createHash().update(buffer).digest();
      }
      
      function sha1SubtleCB(buffer,cb){ 
              return window.crypto.subtle.digest("SHA-1", buffer)
                 .then(function(dig){cb(undefined,bufferToHex(dig));})
                   .catch(cb); 
          
      }
      
      function sha1SubtleRawCB(buffer,cb){ 
              return window.crypto.subtle.digest("SHA-1", buffer)
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
              hexCodes.push(paddedValue);
          }
          // Join all the hex strings into one
          return hexCodes.join("");
      }
      
      
    })()

    );
    

});





