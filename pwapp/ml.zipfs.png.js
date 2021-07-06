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
                
                const apng_width_height = 64;
                
                const expectHashLength = self.sha1Lib.sync.raw('x').byteLength;
            
                return  {
                    
                   resolvePngZipDownload   : resolveAPngZipDownload,
                   
                   createPNGZipFromZipUrl  : createAPNGZipFromZipUrl,
                   createPNGWrappedBuffer  : createAPNGWrappedBuffer,
                   
                   //resolveAPngZipDownload   : resolveAPngZipDownload,
                   //createAPNGZipFromZipUrl : createAPNGZipFromZipUrl,
                   //createAPNGWrappedBuffer : createAPNGWrappedBuffer,
                   
                   extractBufferFromPng    : extractBufferFromPng

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
                    
                    
                        const png = pngBuffer.width && 
                                    pngBuffer.height && 
                                    pngBuffer.data && 
                                    pngBuffer.depth ? pngBuffer : UPNG.decode(pngBuffer);
                        
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
                            
                            
                            extractBufferFromPng(png,function(err,storedBuffer,storedHash){
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
                
                
                
                
                function resolveAPngZipDownload( url, mode, alias) {
                    
                    return new Promise(function(resolve){
                        
                        createAPNGZipFromZipUrl(url,mode,alias,function(err,pngData,hash){
                            if (err) {
                                return resolve(new Response('', {
                                    status: 500,
                                    statusText: err.message|| err
                                }));
                            }
                            
                            const fileEntry = {
                                contentType   : 'image/apng',
                                contentLength : pngData.byteLength,
                                etag          : hash,
                                date          : new Date()
                            };
                            response200(resolve,pngData,fileEntry);
                        });

                    });
                    
                    
                    
                    
                    
                   
                    
                }
                
                function createAPNGZipFromZipUrl(url,mode,alias,cb) {
                    getUpdatedZipFile(url,mode,alias,function(err,buffer){
                        if (err) return cb (err);
                        createAPNGWrappedBuffer( buffer,cb);
                    });
                }
                
                
                function createAPNGWrappedBuffer( buffer,cb) {
                    
                        createHeaderBuffer(buffer,function(err,headerBuffer,hash){
                            if (err) return cb (err);

                            const bytesNeeded = buffer.byteLength + headerBuffer.byteLength;
                            
                           
                            let 
                            w = apng_width_height,
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
                
                function extractBufferFromAPng (apngBuffer,cb) {
                    
                    
                        const apng = apngBuffer.width && 
                                    apngBuffer.height && 
                                    apngBuffer.data && 
                                    apngBuffer.depth &&
                                    apngBuffer.frames ? apngBuffer : UPNG.decode(apngBuffer);
                        
                        if (!apng) {
                            return cb (new Error("could not decode apng image"));
                        }
                        
                        if (apng.width !== apng.height) {
                            return cb (new Error("width should equal height"));
                            
                        }
                        
                         if (apng.width !== apng_width_height) {
                            return cb (new Error("width and height should be "+apng_width_height));
                            
                        }
                        
                        if (apng.depth !== 8) {
                            return cb (new Error("apng.depth should be 8 bit"));
                            
                        }
            
                        var frameDataObj = UPNG.toRGBA8(apng);
                        var frameData    = frameDataObj.map(function(buf){ return new Uint8Array(buf);});
                        var header = frameData[0];
                        
                        const storedDataSize = header[0] | (header[1] << 8) | ( header[2] << 16) || (header[3] << 24);
                        const storedHashLength = header[4];
                        if (storedHashLength !== expectHashLength) {
                            return cb (new Error("Stored hash length is incorrect"));
                        }
                        
                        if (header[5]!==0 || header[6]!==0 || header[7]!==0 ) {
                            return cb (new Error("reserved header bytes are not zero")) ;
                        }
                        
                        var combinedUint8Array;
                        frameData.forEach(function (u8Array){
                            if (combinedUint8Array) {
                                combinedUint8Array = concatTypedArrays(combinedUint8Array,u8Array);
                            } else {
                                combinedUint8Array = u8Array;
                            }
                        });
                        
                        
                        const storedHashStart = 8;
                        const expectedHeaderSize = storedHashStart + storedHashLength;
                        
                        if (storedDataSize > combinedUint8Array.buffer.byteLength - expectedHeaderSize) {
                            
                            return cb (new Error("Stored data length looks suspect")) ;
                        } 
                        
                        const combinedBuffer = combinedUint8Array.buffer;
                        
                        
                        const hashBufferSlice = new Uint8Array(combinedBuffer.slice(storedHashStart, storedHashStart + storedHashLength ));
                        const storedHash = bufferToHex(hashBufferSlice.buffer);
                        
                        
                        const storedDataStart = storedHashStart + storedHashLength;
                        const storedBuffer = new Uint8Array(combinedBuffer.slice(storedDataStart,storedDataStart+storedDataSize)).buffer;
                                            
                            
                        compareBufferAgainstHash(storedBuffer,storedHash,storedDataSize,function(err,proceed){
                            if (err) return cb(err);
                            
                            if (!proceed) {
                                return cb (new Error("storedBuffer does not match storedHash"));
                            }
                            
                            return cb (undefined,storedBuffer,storedHash);
                        });

                } 
                
                function checkAPngBuffer (originalBuffer,hash,apngBuffer,w,h,frames,headerBuffer,cb) {
                    
                    
                    compareBufferAgainstHash(originalBuffer,hash,function(err,proceed){
                        if (err) return cb (err);
                        if (!proceed) {
                            return cb (new Error("originalBuffer does not match supplied hash"));
                        }
                        
                        const apng = UPNG.decode(apngBuffer);
                        
                        console.log(apng);
                        
                        if ( w === apng.width && 
                             h === apng.height && 
                             apng.frames &&
                             frames === apng.frames.length && 
                             apng.tabs &&
                             apng.tabs.acTL &&
                             frames === apng.tabs.acTL.num_frames && 
                             apng.depth ==8 && 
                             
                             apng.data && (apng.frames.length * (apng.width  * apng.height) * 4) >= (originalBuffer.byteLength + headerBuffer.byteLength )) {
                            
                            
                            extractBufferFromAPng(apng,function(err,storedBuffer,storedHash){
                                if (err) return cb (err);
                                return cb (undefined,storedHash===hash&&storedBuffer&&storedBuffer.byteLength===originalBuffer.byteLength);
                            });
                            

                        } else {
                            
                            return cb (new Error("header size details don't match"));
                        }
                    });
                    
                   
                    
                    

                    
                } 
                
                
                
                
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

                
                 
            }    
        
    })()

    );
    

});




