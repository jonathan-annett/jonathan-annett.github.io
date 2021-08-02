


/*
function encodeArrayBufferToRawString(ab) {
    
    const storing    = ab.slice();
    const byteLength = storing.byteLength;
    const oddEven    = byteLength % 2;
    const storedByteLength = oddEven === 0 ? byteLength + 2 : byteLength + 3;
    
    const storage = arrayBufferTransfer(storing, storedByteLength);
    const storageView = new Uint16Array(storage);
    storageView[storageView.length-1]=oddEven;
    return encodeUint16ArrayToRawString(storageView);
}

function decodeUint16ArrayFromRawString(str) {
    return new Uint16Array(str.split('').map((x)=>x.charCodeAt(0)));
}

function decodeArrayBufferFromRawString (str) {
    const ui16    = decodeUint16ArrayFromRawString(str);
    const oddEven = ui16[ui16.length-1];
    if (oddEven<2) {
       const storedByteLength = ( (ui16.length-1) * 2 ) - oddEven;
       return arrayBufferTransfer(ui16.buffer,storedByteLength);
    }
}
*/ 

function bufferReadStream(forBuffer) {

    if (!forBuffer|| forBuffer.constructor !== ArrayBuffer) {
       throw new Error ("expecting ArrayBuffer as argument");
    }

    const storedLength = forBuffer.byteLength;
    let offset = 0;
    const obj = {};
    Object.defineProperties(obj,{
        readBuffer : {
            value : function (bytesToRead) {
                if (bytesToRead === undefined) {
                    bytesToRead = storedLength-offset;
                } else {
                    if (offset+bytesToRead > storedLength) { 
                        bytesToRead = storedLength - offset;
                    }
                }
                if (bytesToRead===0) {
                    return new ArrayBuffer();
                }
                const result = forBuffer.slice(offset,offset+bytesToRead);
                offset += bytesToRead;
                return result;
            },
            enumerable:true,
            configurable:true
        },
        
        readUtf8String : {
            value : function (bytesToRead) {
                const delimiter = bytesToRead;
                if (typeof delimiter ==='string') {
                    bytesToRead = storedLength - offset;
                    const seekArea = forBuffer.slice(offset,storedLength);
                    let index = arrayBuffer_indexOf(seekArea,delimiter);
                    if (index<0) {
                        // delimiter not found, return from offset to end of stream
                        offset=storedLength;
                        return new TextDecoder().decode(seekArea);
                    }
                    // return delimited area (including delimiter)
                    index  += delimiter.length;
                    // point to next byte after delimter
                    offset += index;
                    return new TextDecoder().decode(seekArea.slice(0,index));
                } else {
                    // read specified number of bytes and decode via utf8
                    return new TextDecoder().decode(obj.readBuffer(bytesToRead));
                }
            },
            enumerable:true,
            configurable:true
        },
        
        readUtf16String : {
            value : function (charsToRead) {
                const bytesToRead = charsToRead * 2;
                const u16 = new Uint16Array(obj.readBuffer(bytesToRead));
                return encodeUint16ArrayToRawString(u16);
            },
            enumerable:true,
            configurable:true
        },
        
        read : {
            value : function (byteLength,into) {
                
                const 
                
                key    = byteLength,
                result = (typeof byteLength==='number') ? obj.readBuffer(byteLength) : JSON.parse(obj.readUtf8String("\n"));
                
                if (typeof key+typeof into==='stringobject') {
                    into[key]=result;
                }
                
                return result;
            }  
        },
 
 
        buffer : {
            get : function () {
                return forBuffer;
            },
            enumerable:true,
            configurable:true
        },
        
        utf8String : {
            get : function () {
                return new TextDecoder().decode(  obj.buffer );
            },
            set : function () {
            },
            enumerable:true,
            configurable:true
        },
        
        utf16String : {
            get : function () {
                const utf16Length = Math.trunc(storedLength / 2 ) + (storedLength % 2);
                const u16 = new Uint16Array(forBuffer,0, (utf16Length*2) <= forBuffer.byteLength ? utf16Length : utf16Length-1);
                return encodeUint16ArrayToRawString(u16);
            },
            set : function () {
            },
            enumerable:true,
            configurable:true
        },
        
        byteLength :  {
            get : function () {
                return storedLength;
            },
            enumerable:true,
            configurable:true
        },
        
        seek : {
            value : function (newOffset,mode) {
                const delimiter = typeof newOffset+ typeof mode==='stringundefined' ? newOffset : false;
                if (delimiter) {
                    obj.readUtf8String(delimiter);
                    return offset;
                } else {
                    if (typeof newOffset !=='number') throw new Error("expecting numeric offset as first argument");
                    switch (mode) {
                        case undefined: {
                            if (newOffset<0) {
                               offset =  storedLength + newOffset;
                            } else {
                               offset = newOffset;
                            }
                             
                            if ( (offset > storedLength) || (offset < 0)) {
                                throw new Error ("invalid offset in seek");
                            }
                            return offset;
                        }
                        case "fromStart" : {
                            if (newOffset < 0) throw new Error ("invalid offset in seek");
                            return obj.seek(newOffset);
                            
                        }
                        case "fromEnd" : {
                             if (newOffset < 0) throw new Error ("invalid offset in seek");
                            return obj.seek(0-newOffset);
                        }
                        case "fromHere":
                        case "relative" : {
                            const seekTo = offset+newOffset;
                            if (seekTo < 0) throw new Error ("invalid offset in seek");
                            return obj.seek(seekTo);
                        }
                    }
                }
            },
            enumerable:true,
            configurable:true
        },
        
        offset : {
            get : function () {
               return offset;   
            },
            set : function(value) {
                obj.seek(value,"fromStart");
            }
            
        }
    });
    
    return obj;
}

function arrayBufferDecoder(crypto,pako) {
    
    
    const javascriptCommentData = [ '/*\n',' */\n',   '*/', ' */\n/*',   '/*',   '*/',  16 ];
    const htmlCommentData       = [ '<!--\n','-->\n', '--', '-->\n<!--', '<!--', '-->', 16 ];
    
    return {
        javascriptCommentData : javascriptCommentData,
        htmlCommentData       : htmlCommentData,
        html                  : htmlCommentDecode,
        js                    : javascriptCommentDecode,
        bufferToHex           : bufferToHex,
        bufferReadWriteStream : bufferReadWriteStream,
        arrayBuffer_indexOf   : arrayBuffer_indexOf
    };
    
    function commentDecode(
           stream,
           hash,
           commentStartTag,
           commentEndTag,
           replace_this,
           with_this,
           cb) {
         
         stream.seek(0);
         const outputStream = bufferReadWriteStream();
         if (stream.seek(commentStartTag+JSON.stringify(hash)+'\n') < stream.byteLength) {
             const byteLengths = stream.read();
             const [licenseLength,compLength,unCompLength] = byteLengths.splice(0,3);
             const joiner   = new TextEncoder().encode(replace_this).buffer;
             const joinerSkip = with_this.length;
             
             stream.offset += licenseLength;
             byteLengths.forEach(function(byteLength,ix){
                 if (ix>0) {
                     stream.offset += joinerSkip;
                     outputStream.writeBuffer(joiner);
                 }
                 outputStream.writeBuffer( stream.readBuffer(byteLength) )
             });
             try {
                 const buffer = pako.inflate(outputStream.buffer);
                 crypto.subtle.digest("SHA-1", buffer).then(function(digest){
                     if (bufferToHex(digest)===hash) {
                         cb (undefined,buffer,hash);
                     }
                 });
              
             } catch (e) {
                 cb(e);
             }
         }
    }
    
    function arrayBuffer_indexOf(buffer,str) {
        if (typeof buffer==='string') return buffer.indexOf(str);
        const bufAsArray = new Uint8Array (buffer.buffer||buffer);
        const strArray   = new TextEncoder().encode(str);
        const limit2=strArray.byteLength, limit = (bufAsArray.byteLength-limit2)+1;
        if (limit<0) return -1;
        for (let i = 0;i<limit;i++){
            let j,c = 0;
            for (j=0;j<limit2;j++) {
                if (bufAsArray[i+j]===strArray[j]) {
                    c++;
                } else {
                    break;
                }
            }
            if (c===limit2) {
                return i;
            }
        }
       return -1; 
    }
    
    function arrayBufferTransfer(oldBuffer, newByteLength) {
        const 
        srcArray  = new Uint8Array(oldBuffer),
        destArray = new Uint8Array(newByteLength),
        copylen = Math.min(srcArray.buffer.byteLength, destArray.buffer.byteLength),
        floatArrayLength   = Math.trunc(copylen / 8),
        floatArraySource   = new Float64Array(srcArray.buffer,0,floatArrayLength),
        floarArrayDest     = new Float64Array(destArray.buffer,0,floatArrayLength);
        
        floarArrayDest.set(floatArraySource);
            
        let bytesCopied = floatArrayLength * 8;
        
    
        // slowpoke copy up to 7 bytes.
        while (bytesCopied < copylen) {
            destArray[bytesCopied]=srcArray[bytesCopied];
            bytesCopied++;
        }
        
      
        return destArray.buffer;
    }
    
    function splitArrayBufferMaxLen (ab,maxLen) {
        if (ab.byteLength<maxLen) return [ab];
        
        const result  = [ ab.slice(0,maxLen)  ];
        let start = maxLen;
        while (start+maxLen <ab.byteLength) {
            result.push( ab.slice(start,start+maxLen));
            start += maxLen;
        }
        result.push( ab.slice(start) );
        return result;
    }
    
    function encodeUint16ArrayToRawString(ui16) {
        const bytesPerChunk = 1024 * 16;
        const bufs = splitArrayBufferMaxLen(ui16,bytesPerChunk);
        const chunks = [];
        while (bufs.length>0) {
            chunks.push(String.fromCharCode.apply(String,new Uint16Array(bufs.shift())));
        }
        const result = chunks.join('');
        chunks.splice(0,chunks.length);
        return result;
    }
    
    function bufferReadWriteStream(forBuffer) {
    
        function arrayBuffer_write_x(intoBuffer, atByteOffset, dataToWrite, modulus,ArrayViewClass) {
            if (!intoBuffer  || intoBuffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as first argument");
            if (atByteOffset % modulus !== 0) throw new Error("Invalid offset: expecting multple of "+modulus+" bytes to match "+ArrayViewClass.name);
            if (!dataToWrite || dataToWrite.constructor !== ArrayViewClass) throw new Error ("expecting data to be "+ArrayViewClass.name);
            
            const targetIndex         = atByteOffset  / modulus;
            const sourceArrayLength   = dataToWrite.length;
            const minimumTargetLength = targetIndex + sourceArrayLength;
            const minumumTargetByteLength = minimumTargetLength * modulus;
            if (intoBuffer.byteLength < minumumTargetByteLength) {
                throw new Error ("Insufficent space in target ArrayBuffer");
            }
            const targetView = new ArrayViewClass(intoBuffer,atByteOffset,sourceArrayLength);
            targetView.set(dataToWrite);
            console.log("wrote",dataToWrite.length * modulus,"bytes of",ArrayViewClass.name,"into offset",atByteOffset,"of target ArrayBuffer");
        }
        
        const arrayTypes = [Float64Array,Uint32Array,Uint16Array,Uint8Array];
        
        function resolveBuffer(x){ return x && x.buffer && x.buffer.constructor === ArrayBuffer && x.buffer || x;}
        function arrayBuffer_write(intoBuffer, atByteOffset, bufferToWrite, fromByteOffset, bytesToWrite) {
            intoBuffer = resolveBuffer(intoBuffer);
            bufferToWrite = resolveBuffer(bufferToWrite);
            
            
            if (!intoBuffer     || intoBuffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as first argument");
            if (typeof atByteOffset !== 'number') throw new Error ("expecting numeric bytes offset as second argument"); 
            if (!bufferToWrite  || bufferToWrite.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as third argument");
            fromByteOffset = fromByteOffset||0;
            bytesToWrite   = bytesToWrite || (bufferToWrite.byteLength - fromByteOffset);
          
            if (bytesToWrite===0) return;
            
            const spaceAvailable = intoBuffer.byteLength - atByteOffset;
            
            if (bytesToWrite > spaceAvailable) throw new Error ("insufficient space in target arrayBuffer");
            
            if (bytesToWrite < 8) {
                // don't mess around looking for matching array sizes, this is so small there is nothing to be gained.
                const arrayToWrite  =  new Uint8Array(bufferToWrite,fromByteOffset,bytesToWrite);
                return arrayBuffer_write_x(intoBuffer, atByteOffset, arrayToWrite, 1,Uint8Array);
            }
            
            let 
            index = 0,
            modulus = 8;
            
            while (index < 4) {
                const elementsToWrite = Math.trunc(bytesToWrite / modulus);
                if (elementsToWrite> 0) {
                    
                    const ArrayClass = arrayTypes[index];
                    if ( atByteOffset   % modulus ===0 && 
                         fromByteOffset % modulus === 0) {
                        
                        
                            if (bytesToWrite % modulus === 0 ) {
                               const arrayToWrite = new ArrayClass(bufferToWrite,fromByteOffset,elementsToWrite);
                               return arrayBuffer_write_x(intoBuffer, atByteOffset,arrayToWrite, modulus,ArrayClass);
                            }
                            
                            const canWriteBytes   = elementsToWrite * modulus;
                            
                            const arrayToWrite  =  new ArrayClass(bufferToWrite,fromByteOffset,elementsToWrite);
                            arrayBuffer_write_x(intoBuffer, atByteOffset, arrayToWrite, modulus,ArrayClass);
                        
                           
                            return arrayBuffer_write(
                                 intoBuffer,    atByteOffset + canWriteBytes, 
                                 bufferToWrite, fromByteOffset + canWriteBytes,
                                 bytesToWrite - canWriteBytes
                            ); 
                        
                     
                    }
                }
                index ++;
                modulus = modulus >> 1;
                // eventually  we will reach Uint8Array, which can deal with any offset criteria.
            }
            
        }
        
        let extended = false;
        let storedLength = 0;
        let offset = 0;
        
        if (forBuffer) {
            storedLength = forBuffer.byteLength;
            offset = storedLength;
        } else {
            extended = true;
            forBuffer = new Uint8Array(128).buffer;
        }
    
        const obj = {};
        Object.defineProperties(obj,{
            
            writeBuffer : {
                value : function (buffer,bytesToWrite) {
                    if (!buffer  || buffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as first argument");
                    bytesToWrite = bytesToWrite || buffer.byteLength;
                    const minLength = offset + bytesToWrite;
                    if (storedLength < minLength) {
                        storedLength = minLength;
                        if (forBuffer.byteLength < minLength) {
                            extended  = true;
                            forBuffer = arrayBufferTransfer(forBuffer,minLength + Math.trunc(minLength / 2));
                            console.log("extended underlying arraybuffer to",forBuffer.byteLength,"bytes,virtual buffer is now",storedLength,"bytes");
                        }
                    }
                    arrayBuffer_write(forBuffer,offset,buffer,0,bytesToWrite);
                    offset += buffer.byteLength;
                },
                enumerable:true,
                configurable:true
            },
            
            readBuffer : {
                value : function (bytesToRead) {
                    if (bytesToRead === undefined) {
                        bytesToRead = storedLength-offset;
                    } else {
                        if (offset+bytesToRead > storedLength) { 
                            bytesToRead = storedLength - offset;
                        }
                    }
                    if (bytesToRead===0) {
                        return new ArrayBuffer();
                    }
                    const result = forBuffer.slice(offset,offset+bytesToRead);
                    offset += bytesToRead;
                    return result;
                },
                enumerable:true,
                configurable:true
            },
            
            readUtf8String : {
                value : function (bytesToRead) {
                    const delimiter = bytesToRead;
                    if (typeof delimiter ==='string') {
                        bytesToRead = storedLength - offset;
                        const seekArea = forBuffer.slice(offset,storedLength);
                        let index = arrayBuffer_indexOf(seekArea,delimiter);
                        if (index<0) {
                            // delimiter not found, return from offset to end of stream
                            offset=storedLength;
                            return new TextDecoder().decode(seekArea);
                        }
                        // return delimited area (including delimiter)
                        index  += delimiter.length;
                        // point to next byte after delimter
                        offset += index;
                        return new TextDecoder().decode(seekArea.slice(0,index));
                    } else {
                        // read specified number of bytes and decode via utf8
                        return new TextDecoder().decode(obj.readBuffer(bytesToRead));
                    }
                },
                enumerable:true,
                configurable:true
            },
            
            readUtf16String : {
                value : function (charsToRead) {
                    const bytesToRead = charsToRead * 2;
                    const u16 = new Uint16Array(obj.readBuffer(bytesToRead));
                    return encodeUint16ArrayToRawString(u16);
                },
                enumerable:true,
                configurable:true
            },
            
            writeUtf8String : {
                value : function (str,length) {
                    const buf = new TextEncoder().encode(str.substr(0,length)).buffer;
                    return obj.writeBuffer (buf);
                },
                enumerable:true,
                configurable:true
            },
            
            clear : {
                value : function () {
                    offset = 0;
                    storedLength = 0;
                    extended = true;
                },
                enumerable:true,
                configurable:true
            },
            
            buffer : {
                get : function () {
                    return extended ? forBuffer.slice(0,storedLength) : forBuffer.buffer||forBuffer;
                },
                set : function (buffer) {
                    if (!buffer  || buffer.constructor !== ArrayBuffer) throw new Error ("expecting ArrayBuffer as argument");
                    forBuffer = buffer;
                    offset    = forBuffer.length;
                    extended  = false;
                    storedLength = offset;
                },
                enumerable:true,
                configurable:true
            },
            
            utf8String : {
                get : function () {
                    return new TextDecoder().decode(  obj.buffer );
                },
                set : function (value) {
                    obj.buffer = new TextEncoder().encode(value).buffer;
                },
                enumerable:true,
                configurable:true
            },
            
            utf16String : {
                get : function () {
                    const utf16Length = Math.trunc(storedLength / 2 ) + (storedLength % 2);
                    const u16 = new Uint16Array(forBuffer,0, (utf16Length*2) <= forBuffer.byteLength ? utf16Length : utf16Length-1);
                    return encodeUint16ArrayToRawString(u16);
                },
                set : function () {
                    throw new Error ("not supported");
                },
                enumerable:true,
                configurable:true
            },
            
            byteLength :  {
                get : function () {
                    return storedLength;
                },
                enumerable:true,
                configurable:true
            },
            
            seek : {
                value : function (newOffset,mode) {
                    const delimiter = typeof newOffset+ typeof mode==='stringundefined' ? newOffset : false;
                    if (delimiter) {
                        obj.readUtf8String(delimiter);
                        return offset;
                    } else {
                        if (typeof newOffset !=='number') throw new Error("expecting numeric offset as first argument");
                        switch (mode) {
                            case undefined: {
                                if (newOffset<0) {
                                   offset =  storedLength + newOffset;
                                } else {
                                   offset = newOffset;
                                }
                                
                                if (offset < 0) throw new Error ("invalid offset in seek");
                                if (offset > storedLength) {
                                    if (offset > forBuffer.byteLength) {
                                        extended  = true;
                                        forBuffer = arrayBufferTransfer(forBuffer,offset + Math.trunc(offset / 2));
                                        console.log("extended underlying arraybuffer to",forBuffer.byteLength,"bytes,virtual buffer is now",offset,"bytes");
        
                                    }
                                    storedLength = offset;
                                }
                                return offset;
                            }
                            case "fromStart" : {
                                if (newOffset < 0) throw new Error ("invalid offset in seek");
                                return obj.seek(newOffset);
                                
                            }
                            case "fromEnd" : {
                                 if (newOffset < 0) throw new Error ("invalid offset in seek");
                                return obj.seek(0-newOffset);
                            }
                            case "fromHere":
                            case "relative" : {
                                const seekTo = offset+newOffset;
                                if (seekTo < 0) throw new Error ("invalid offset in seek");
                                return obj.seek(seekTo);
                            }
                        }
                    }
                },
                enumerable:true,
                configurable:true
            },
            
            offset : {
                get : function () {
                   return offset;   
                },
                set : function(value) {
                    obj.seek(value,"fromStart");
                }
                
            },
            
            truncate : {
                value : function () {
                    storedLength = offset;
                },
                enumerable:true,
                configurable:true
            },
            
            write : {
                
                value : function () {
                    [].slice.call(arguments).forEach(function(x){
                        if (typeof x==='object'&& x.constructor === ArrayBuffer ) {
                            obj.writeBuffer(x);
                        } else {
                             if (typeof x==='object'&& x.buffer && x.buffer.constructor === ArrayBuffer ) {
                                 obj.writeBuffer(x.buffer);
                             } else {
                                 if (['string','number'].indexOf(typeof x)>=0||(typeof x==='object'&&([Object,String,Date,Array].indexOf(x.constructor)>=0))) {
                                     obj.writeUtf8String(JSON.stringify(x)+"\n");
                                 }
                             }
                         }
                        
                    });
                }
            },
            
            
            read : {
                value : function (byteLength,into) {
                    
                    const 
                    
                    key    = byteLength,
                    result = (typeof byteLength==='number') ? obj.readBuffer(byteLength) : JSON.parse(obj.readUtf8String("\n"));
                    
                    if (typeof key+typeof into==='stringobject') {
                        into[key]=result;
                    }
                    
                    return result;
                }  
            },
     
            
        });
        
        return obj;
    }
    
    function bufferToHex(buffer) {
        const padding = '00000000';
        const hexCodes = [];
        const view = new DataView(buffer);
        if (view.byteLength===0) return '';
    
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
    
    function javascriptCommentDecode(stream,hash,cb) {
        const args =  [stream,hash].concat(javascriptCommentData.slice(0,5));
        args[6]=cb;
        return commentDecode.apply(undefined,args);
        //commentDecode(stream,hash,'/* \n',' */\n',  '*/',' */\n/*', cb);
    }
    
    function htmlCommentDecode(stream,hash,cb) {
        const args =  [stream,hash].concat(htmlCommentData.slice(0,5));
        args[6]=cb;
        return commentDecode.apply(undefined,args);
    }

}

function arrayBufferEncoder(crypto,pako) {
    
    const {
              javascriptCommentData : javascriptCommentData,
              htmlCommentData       : htmlCommentData,
              bufferToHex           : bufferToHex,
              bufferReadWriteStream : bufferReadWriteStream,
              arrayBuffer_indexOf   : arrayBuffer_indexOf
    } = arrayBufferDecoder();
    
        
    return {
        html                  : htmlCommentEncode,
        js                    : javascriptCommentEncode
    };
    
    function commentEncode (
        stream,
        buffer,
        commentStartTag,
        commentEndTag,
        replace_this,
        with_this,
        licenceStart,
        licenseEnd,
        licenceStartLimit,
        cb) {
            
            
        let licenceText = '';
        
        if (licenceStart && licenseEnd) {
            const ix = arrayBuffer_indexOf(buffer,licenceStart);
            const ix_lic_start = ix +  licenceStart.length;
            if (ix >= 0 && (licenceStartLimit===false || (ix_lic_start < licenceStartLimit))) {
                const ix_lic_end = arrayBuffer_indexOf(buffer,licenseEnd);
                if (ix_lic_end >= ix_lic_start) {
                   licenceText =  arrayBuffer_substring(ix_lic_start,ix_lic_end);
                }
            }
        }
        
        stream = stream || bufferReadWriteStream();
        
        crypto.subtle.digest("SHA-1", buffer).then(function(digest){
            
            const deflated = pako.deflate(buffer,{level:9});
            
            const parts = arrayBuffer_split(deflated,replace_this);
            
            const offset = stream.offset;
            const joiner   = new TextEncoder().encode(with_this).buffer;
            
            
            stream.writeUtf8String(commentStartTag);
            stream.write(
                bufferToHex(digest),[
                licenceText.length,
                deflated.buffer.byteLength,
                buffer.byteLength].concat(parts.map(function(x){return x.byteLength;})));
            
            
                
            stream.writeUtf8String(licenceText);
    
            
            parts.forEach(function(part,ix) {
                if (ix>0) {
                    stream.writeBuffer(joiner);  
                }
                stream.writeBuffer(part.buffer||part);
            });
            
            stream.writeUtf8String(commentEndTag);
          
            const byteLength = stream.offset - offset;
            cb (stream,offset,byteLength);
            
            
        });
        
    }
    
    function arrayBuffer_split(buffer,str) {
        let nextIndex = arrayBuffer_indexOf(buffer,str);
        if (nextIndex<0) return [ buffer ];
        
        const result = [ buffer.slice (0,nextIndex) ]  ;
        buffer = buffer.slice (nextIndex+str.length);
        
        nextIndex = arrayBuffer_indexOf(buffer,str);
        while (nextIndex >=0) {
            result.push (buffer.slice (0,nextIndex));
            buffer = buffer.slice (nextIndex+str.length);
            nextIndex = arrayBuffer_indexOf(buffer,str);
        }
        
        result.push(buffer);
        return result;
    }
    
    
    function arrayBuffer_substring(buffer,start,end) {
        if (typeof buffer==='string') return buffer.substring(start,end);
        const bufAsArray = new Uint8Array (buffer.buffer||buffer);
        return new TextDecoder().decode(bufAsArray.slice(start,end));
    }
    

    

    function javascriptCommentEncode(stream,buffer,cb) {
        return commentEncode.apply(undefined,[stream,buffer].concat(javascriptCommentData).concat([cb]));
    }
    
    function htmlCommentEncode(stream,buffer,cb) {
        return commentEncode.apply(undefined,[stream,buffer].concat(htmlCommentData).concat([cb]));
    }
    
    

}





