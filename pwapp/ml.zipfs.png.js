/* global ml,self, JSZipUtils,JSZip,localforage,Response,Headers,BroadcastChannel,UPNG */

ml(0,ml(1),[
    
    'sha1Lib  | sha1.js',
    'UPNG     | upng.js',
    'pako     | pako.js'

    ],function(){ml(2,ml(3),ml(4),

    {   
        ServiceWorkerGlobalScope: function zipPNGLib (  lib ) {
            
            
            
            return lib;

        }

    }, (()=>{  return {
    
    
            ServiceWorkerGlobalScope: [ ()=> getLib ]
            
            };
            
            function getLib(getUpdatedZipFile,response200) {
                
                
                const sha1 = self.sha1Lib.cb;
                const sha1Raw = self.sha1Lib.cb.raw;
                const sha1Sync = self.sha1Lib.sync;
                const bufferToHex = self.sha1Lib.bufferToHex;
                
                const expectHashLength = self.sha1Lib.sync.raw('x').byteLength;
            
                return  {
                    
                   resolvePngZipDownload  : resolvePngZipDownload,
                   createPNGZipFromZipUrl : createAPNGZipFromZipUrl,
                   createAPNGZipFromZipUrl : createAPNGZipFromZipUrl,
                   
                   createPNGWrappedBuffer : createPNGWrappedBuffer,
                   extractBufferFromPng   : extractBufferFromPng

                };
                
             
                function resolvePngZipDownload( url, mode, alias) {
                    
                    return new Promise(function(resolve){
                        
                        createPNGZipFromZipUrl(url,mode,alias,function(err,pngData,hash){
                            if (err) {
                                return resolve(new Response('', {
                                    status: 500,
                                    statusText: err.message|| err
                                }));
                            }
                            
                            const fileEntry = {
                                contentType   : 'image/png',
                                contentLength : pngData.byteLength,
                                etag          : hash,
                                date          : new Date()
                            };
                            response200(resolve,pngData,fileEntry);
                        });

                    });
                    
                    
                    
                    
                    function concatTypedArrays(a, b) { // a, b TypedArray of same type
                        var c = new (a.constructor)(a.length + b.length);
                        c.set(a, 0);
                        c.set(b, a.length);
                        return c;
                    }
                    
                    
                    function concatBuffers(a, b) {
                        return concatTypedArrays(
                            new Uint8Array(a.buffer || a), 
                            new Uint8Array(b.buffer || b)
                        ).buffer;
                    }
                        
                        
                    function createHeaderBuffer (zipBuffer,cb) {
                        sha1Raw(zipBuffer,function(err,hashBuffer){
                            if (err) return cb(err);
                            const len0 = zipBuffer.byteLength      & 0xff;
                            const len1 = zipBuffer.byteLength >>8  & 0xff;
                            const len2 = zipBuffer.byteLength >>16 & 0xff;
                            const len3 = zipBuffer.byteLength >>32 & 0xff;
                            
                            const sizeBuffer = new Uint8Array([len0, len1, len2, len3, hashBuffer.byteLength,0,0,0]);
                            cb(undefined,concatBuffers(sizeBuffer,hashBuffer),bufferToHex(hashBuffer));
                        });
                    }
                    
                    
                   
                    
                }
                
                
                function createPNGZipFromZipUrl(url,mode,alias,cb) {
                    getUpdatedZipFile(url,mode,alias,function(err,buffer){
                        if (err) return cb (err);
                        createPNGWrappedBuffer( buffer,cb);
                    });
                }
                
                function createPNGWrappedBuffer( buffer,cb) {
                    
                        createHeaderBuffer(buffer,function(err,headerBuffer,hash){
                            if (err) return cb (err);

                            const bytesNeeded = buffer.byteLength + headerBuffer.byteLength;
                            
                           
                            let 
                            w =  Math.round (  Math.sqrt( bytesNeeded /4) ),h=w,
                            
                            bytesAllocated = (w * h * 4);

                            while ( bytesAllocated < bytesNeeded ) {
                                h++;
                                bytesAllocated = (w * h * 4);
                            }
                            
                            const paddingNeeded = bytesAllocated - bytesNeeded;
                            
                            const paddingBuffer = new ArrayBuffer(paddingNeeded);
                            
                            const paddedData = concatBuffers(buffer,paddingBuffer);
                            
                            const cc = 3;
                            const ac = 1;
                            const depth = 8;
                            
                            const imgs  = [ concatBuffers(headerBuffer,paddedData) ];
                            const pngData = UPNG.encodeLL(imgs, w, h, cc, ac, depth);
                            
                            
                            checkPngBuffer (buffer,hash,pngData,w,h,headerBuffer,function(err){
                                if (err) return cb (err);
                                return cb (undefined,pngData,hash);
                            });
                            
                        });
           
                        function concatTypedArrays(a, b) { // a, b TypedArray of same type
                            var c = new (a.constructor)(a.length + b.length);
                            c.set(a, 0);
                            c.set(b, a.length);
                            return c;
                        }

                        function concatBuffers(a, b) {
                            return concatTypedArrays(
                                new Uint8Array(a.buffer || a), 
                                new Uint8Array(b.buffer || b)
                            ).buffer;
                        }

                        function createHeaderBuffer (zipBuffer,cb) {
                            sha1Raw(zipBuffer,function(err,hashBuffer){
                                if (err) return cb(err);
                                const len0 = zipBuffer.byteLength      & 0xff;
                                const len1 = zipBuffer.byteLength >>8  & 0xff;
                                const len2 = zipBuffer.byteLength >>16 & 0xff;
                                const len3 = zipBuffer.byteLength >>32 & 0xff;
                                
                                const sizeBuffer = new Uint8Array([len0, len1, len2, len3, hashBuffer.byteLength,0,0,0]);
                                cb(undefined,concatBuffers(sizeBuffer,hashBuffer),bufferToHex(hashBuffer));
                            });
                        }
                        
                }
                
                
                function extractBufferFromPng (pngBuffer,cb) {
                    
                    
                        const png = UPNG.decode(pngBuffer);
                        
                        if (!png) {
                            return cb (new Error("could not decode png image"));
                        }
                        
                        if (png.width > png.height) {
                            return cb (new Error("width should be less than or equal to height"));
                            
                        }
                        
                        
                        if (png.depth !== 8) {
                            return cb (new Error("png.depth should be 8 bit"));
                            
                        }
            
                       
                        
                        const storedDataSize = png.data[0] | (png.data[1] << 8) | ( png.data[2] << 16) || (png.data[3] << 24);
                        const storedHashLength = png.data[4];
                        if (storedHashLength !== expectHashLength) {
                            return cb (new Error("Stored hash length is incorrect"));
                        }
                        
                        if (png.data[5]!==0 || png.data[6]!==0 || png.data[7]!==0 ) {
                            return cb (new Error("reserved header bytes are not zero")) ;
                        }
                        
                        const storedHashStart = 8;
                        const expectedHeaderSize = storedHashStart + storedHashLength;
                        
                        if (storedDataSize > png.data.byteLength - expectedHeaderSize) {
                            
                            return cb (new Error("Stored data length looks suspect")) ;
                        } 
                        
                        
                        const hashBufferSlice = new Uint8Array(png.data.slice(storedHashStart, storedHashStart + storedHashLength ));
                        const storedHash = bufferToHex(hashBufferSlice.buffer);
                        
                        
                        const storedDataStart = storedHashStart + storedHashLength;
                        const storedBuffer = new Uint8Array(png.data.slice(storedDataStart,storedDataStart+storedDataSize)).buffer;
                                            
                            
                        compareBufferAgainstHash(storedBuffer,storedHash,storedDataSize,function(err,proceed){
                            if (err) return cb(err);
                            
                            if (!proceed) {
                                return cb (new Error("storedBuffer does not match storedHash"));
                            }
                            
                            return cb (undefined,storedBuffer,storedHash);
                        });

                } 
                
                function checkPngBuffer (originalBuffer,hash,pngBuffer,w,h,headerBuffer,cb) {
                    
                    
                    compareBufferAgainstHash(originalBuffer,hash,function(err,proceed){
                        if (err) return cb (err);
                        if (!proceed) {
                            return cb (new Error("originalBuffer does not match supplied hash"));
                        }
                        
                        const png = UPNG.decode(pngBuffer);
                        
                        
                        if (w === png.width && h === png.height && png.depth ==8 && png.data && png.data.byteLength >= (originalBuffer.byteLength + headerBuffer.byteLength )) {
                            
                            
                            extractBufferFromPng(pngBuffer,function(err,storedBuffer,storedHash){
                                if (err) return cb (err);
                                return cb (undefined,storedHash===hash&&storedBuffer&&storedBuffer.byteLength===originalBuffer.byteLength);
                            });
                            

                        } else {
                            
                            return cb (new Error("header size details don't match"));
                        }
                    });
                    
                   
                    
                    

                    
                } 
            
                function compareBufferAgainstHash(buffer,hash,expectedLength,cb) {
                    
                    if (typeof expectedLength==='function' )  {
                        cb = expectedLength;
                        expectedLength=buffer ? buffer.byteLength : false;
                    }
                    
                    if (typeof cb==='function' )  {
                       if (typeof buffer==='object') {
                           
                           if (typeof buffer.buffer ==='object' && typeof buffer.buffer.byteLength === 'number') {
                               buffer = buffer.buffer;
                           }  
                           
                           if (typeof buffer.byteLength === 'number') {
                              if (buffer.byteLength === expectedLength) {
                                      sha1(buffer,function(err,actualHash){
                                          if (err) return cb(err);
                                          cb (undefined,hash===actualHash,actualHash);
                                      });
                              }  else {
                                  cb (new Error("buffer is incorrect size, not hashing"));   
                              }
                           } else {
                              cb (new Error("buffer argument looks invalid"));    
                           }
                           
                       } else {
                           cb (new Error("buffer argument is not an object"));
                       }
                    
                    } else {
                        throw new Error("expecting a callback as last argument");
                    }
                }
                
                
                
                function createAPNGWrappedBuffer( buffer,cb) {
                    
                        createHeaderBuffer(buffer,function(err,headerBuffer,hash){
                            if (err) return cb (err);

                            const bytesNeeded = buffer.byteLength + headerBuffer.byteLength;
                            
                           
                            let 
                            w = 64,
                            h = w,
                            perFrame = 4 * w * h,
                            frames = Math.ceil(bytesNeeded / perFrame),
                            bytesAllocated = (frames * perFrame);

                            while ( bytesAllocated < bytesNeeded ) {
                                frames++;
                                bytesAllocated = (frames * perFrame);
                            }
                            
                            const paddingNeeded = bytesAllocated - bytesNeeded;
                            
                            const paddingBuffer = new ArrayBuffer(paddingNeeded);
                            
                            const paddedData  = concatBuffers(buffer,paddingBuffer);
                            const fullPayload = concatBuffers(headerBuffer,paddedData);
                            const imgs = [];
                            
                            for (let frame=0;frame<frames;frame++) {
                                imgs.push(
                                   fullPayload.slice(frame*perFrame,(frame+1)*perFrame).buffer
                                );
                            }
                            
                            const cc = 3;
                            const ac = 1;
                            const depth = 8;
                            const delay = 100;
                           
                            const pngData = UPNG.encodeLL(imgs, w, h, cc, ac, depth,delay);
                            
                            
                            checkAPngBuffer (buffer,hash,pngData,w,h,frames,headerBuffer,function(err){
                                if (err) return cb (err);
                                return cb (undefined,pngData,hash);
                            });
                            
                        });
           
                        function concatTypedArrays(a, b) { // a, b TypedArray of same type
                            var c = new (a.constructor)(a.length + b.length);
                            c.set(a, 0);
                            c.set(b, a.length);
                            return c;
                        }

                        function concatBuffers(a, b) {
                            return concatTypedArrays(
                                new Uint8Array(a.buffer || a), 
                                new Uint8Array(b.buffer || b)
                            ).buffer;
                        }

                        function createHeaderBuffer (zipBuffer,cb) {
                            sha1Raw(zipBuffer,function(err,hashBuffer){
                                if (err) return cb(err);
                                const len0 = zipBuffer.byteLength      & 0xff;
                                const len1 = zipBuffer.byteLength >>8  & 0xff;
                                const len2 = zipBuffer.byteLength >>16 & 0xff;
                                const len3 = zipBuffer.byteLength >>32 & 0xff;
                                
                                const sizeBuffer = new Uint8Array([len0, len1, len2, len3, hashBuffer.byteLength,0,0,0]);
                                cb(undefined,concatBuffers(sizeBuffer,hashBuffer),bufferToHex(hashBuffer));
                            });
                        }
                        
                }
                
                
                function checkAPngBuffer (originalBuffer,hash,apngBuffer,w,h,frames,headerBuffer,cb) {
                    
                    
                    compareBufferAgainstHash(originalBuffer,hash,function(err,proceed){
                        if (err) return cb (err);
                        if (!proceed) {
                            return cb (new Error("originalBuffer does not match supplied hash"));
                        }
                        
                        const png = UPNG.decode(apngBuffer);
                        
                        console.log(png);
                        
                        if (w === png.width && h === png.height && png.depth ==8 && png.data && png.data.byteLength >= (originalBuffer.byteLength + headerBuffer.byteLength )) {
                            
                            
                            extractBufferFromPng(apngBuffer,function(err,storedBuffer,storedHash){
                                if (err) return cb (err);
                                return cb (undefined,storedHash===hash&&storedBuffer&&storedBuffer.byteLength===originalBuffer.byteLength);
                            });
                            

                        } else {
                            
                            return cb (new Error("header size details don't match"));
                        }
                    });
                    
                   
                    
                    

                    
                } 
                
                 
            }    
        
    })()

    );
    

});




