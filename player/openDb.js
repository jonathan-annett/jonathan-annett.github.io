
function openDb(SELF,storageDB,cb) {
    const version = 573;
    const dbName = "Files",
          storeName = "FileStore";

          // Concatenate a mix of typed arrays
        function concatenate(...arrays) {
            // Calculate byteSize from all arrays
            let size = arrays.reduce((a,b) => a + b.byteLength, 0)
            // Allcolate a new buffer
            let result = new Uint8Array(size)
        
            // Build the new array
            let offset = 0
            for (let arr of arrays) {
            result.set(arr, offset)
            offset += arr.byteLength
            }
        
            return result
        }

    function sha256Hasher(buffer,previousDigest,cb) {
        const data = previousDigest ? concatenate(previousDigest,buffer) : buffer;
        crypto.subtle.digest('SHA-256', data).then(function(digest) {
            cb(undefined,digest);
        }).catch(cb);
    }
          
    class FileStreamer {
        constructor(file, defaultChunkSize = 512 * 1024 * 1024 /* bytes */) {
            this.file = file;
            this.offset = 0;
            this.defaultChunkSize = defaultChunkSize;
            this.rewind();
        }
        rewind() {
            this.offset = 0;
        }
        isEndOfFile() {
            return this.offset >= this.getFileSize();
        }
        readBlockAsArrayBuffer(length = this.defaultChunkSize) {
            const fileReader = new FileReader();
            const blob = this.file.slice(this.offset, this.offset + length);
            return new Promise((resolve, reject) => {
                fileReader.onloadend = (event) => {
                    const target = (event.target);
                    if (target.error == null) {
                        const result = target.result;
                        this.offset += result.byteLength;
                        this.testEndOfFile();
                        resolve(result);
                    }
                    else {
                        reject(target.error);
                    }
                };
                fileReader.readAsArrayBuffer(blob);
            });
        }

        testEndOfFile() {
            if (this.isEndOfFile()) {
                console.log('Done reading file');
            }
        }

        getFileSize() {
            return this.file.size;
        }

    }


 
    Object.defineProperties(storageDB, {
        init: {
            // Create/open database 
                        
            enumerable: true,
            configurable: false,

            value: function () {
                SELF.indexedDB = SELF.indexedDB || SELF.mozIndexedDB || SELF.webkitIndexedDB || SELF.msIndexedDB;
                SELF.IDBTransaction = SELF.IDBTransaction || SELF.webkitIDBTransaction || SELF.msIDBTransaction;
                SELF.IDBKeyRange = SELF.IDBKeyRange || SELF.webkitIDBKeyRange || SELF.msIDBKeyRange;
                if (!SELF.indexedDB) {
                    alert("What?! No IndexedDB?");
                }
                try {
                    var request = SELF.indexedDB.open(dbName, version);
                    request.onerror = function (event) {
                        cb(event.errorCode);
                    };
                    request.onsuccess = function (event) {
                        cb(undefined, request.result,storeName);
                    };
                    request.onupgradeneeded = function (event) {

                        console.log("Upgrading ", event.dbName, "from", event.oldVersion, " to ", event.newVersion);
                        var db = event.target.result;
                        if (db.objectStoreNames.contains(storeName)) {
                            db.deleteObjectStore(storeName);
                        }

                        var objectStore = db.createObjectStore(storeName, { keyPath: "id", autoIncrement: true });
                        objectStore.createIndex("digestStringIndex", "digestString", { unique: false });
                        objectStore.createIndex("digestStringBufferIndex", ["digestString", "bufferIndex"], { unique: true });

                    };
                }
                catch (Error) {
                    cb(Error);
                }
            } 

        },
        set: {
            //  Store a file arrayBuffer in the database
                        
            enumerable: true,
            configurable: false,
            value: function (value,cb) {
                var transaction = database.transaction([storeName], "readwrite");
                var objectStore = transaction.objectStore(storeName);
                var request = objectStore.put(value);
                request.onsuccess = function (event) {
                    var item = event;
                    value.id = event.target.result;
                    //alert("File Stored, ID: " + value.id);
                    if (typeof cb === "function") {
                        cb(undefined,value.id);
                    }
                };
                request.onerror = (typeof cb === "function") ? cb : function (event) {
                    throw event.error || event.target.error || "Error storing data";
                }
            } 
        },
        get: {
            //  Retrieve a file arrayBuffer from the database           
            enumerable: true,
            configurable: false,

            value: function (Id,cb) {
                const transaction = database.transaction([storeName], "readwrite");
                const objectStore = transaction.objectStore(storeName);
                const request = objectStore.get(Id);
                request.onsuccess = function (event) {
                    var item = event.target.result;

                    if (typeof cb === "function") {
                        cb(undefined,item,objectStore,transaction);
                    }

                };
                request.onerror = (typeof cb === "function") ? cb : function (event) {
                    throw event.error || event.target.error || "Error retrieving data";
                }
            } 
        },

        getList: {

            // Retrieve a list of files from the database
            enumerable: true,
            configurable: false,

            value: function (cb) {
                var transaction = database.transaction([storeName], "readwrite");
                var objectStore = transaction.objectStore(storeName);
                var index = objectStore.index("digestStringIndex");
                var items = [];
                index.openCursor(undefined, 'nextunique').onsuccess = function (event) {
                    var cursor = event.target.result;
                    if (cursor) {
                        items.push(cursor.value);
                        cursor.continue();
                    }
                };

                transaction.oncomplete = function (event) {
                    cb(items);
                };

            }
        },

        getBlob: {
            // Retrieve a file blob from the database
            enumerable: true,
            configurable: false,

            value: function (file, selected, cb) {
                if (typeof selected === "function") {
                    cb = selected;
                    selected = undefined;
                }
                let digestString = file.digestString;

                const importedFilesContainer = document.getElementById('imported-files-container');
               
                const uiElements = storageDB.createFileDiv( importedFilesContainer,file,"loading",selected),
                { fileDisplayDiv, 
                    previewImgDiv,
                    thumbNameText, 
                    thumbnailImg, 
                    thumbnailProgress } = uiElements;

                file.fileDisplayDiv = fileDisplayDiv;
                if (selected)
                   storageDB.updateSelected(file);

                thumbnailProgress.max = file.size;
                thumbnailProgress.value = 0; 
                //previewProgress.style.display = "inline-block";
                let transaction = database.transaction([storeName], "readwrite");
                let objectStore = transaction.objectStore(storeName);
                let index = objectStore.index("digestStringBufferIndex");
                let range = IDBKeyRange.bound([digestString, 0], [digestString, Infinity], false, false);
                let mimeType;

                cursor = index.openCursor(range);
                cursor.addEventListener('success', gotNextCursor);

                let arrayBuffers = [];

                function gotNextCursor(event) {
                    const thisCursor = event.target.result;
                    if (thisCursor) {
                        arrayBuffers.push(thisCursor.value.arrayBuffer);
                        mimeType = mimeType || thisCursor.value.mimeType;
                        thumbnailProgress.value += thisCursor.value.arrayBuffer.byteLength;
                        thisCursor.continue();
                    } else {
                        let blob = new Blob(arrayBuffers, { type: mimeType });
                        arrayBuffers.splice(0, arrayBuffers.length);
                        arrayBuffers = undefined;
                       

                        updateUi(previewImgDiv,'className','loaded');
                        
                        try {

                            let url = URL.createObjectURL(blob);
                            let retain = false;
                            try {
                                retain = cb(undefined, blob, url,uiElements) === true;
                                cb = undefined;
                            }
                            catch (e) {

                                if (cb) {
                                    cb(e);
                                    cb = undefined;
                                } else {
                                    console.log(e);
                                }
                            }

                            finally {
                                if (retain) {
                                    console.log('caller retained ObjectURL');
                                } else {
                                    console.log('revoking ObjectURL')
                                    URL.revokeObjectURL(url);
                                }
                                url = undefined;
                                blob = undefined;
                            }
                        } catch (e) {

                            if (cb) {
                                cb(e);
                                cb = undefined;
                            } else {
                                console.log(e);
                            }

                        }
                        finally {
                            console.log('closing cursor...');
                            transaction = undefined;
                            objectStore = undefined;
                            index = undefined;
                            range = undefined;
                            mimeType = undefined;
                            cursor = undefined;

                            blob = undefined;
                        }

                    }
                }
            }
        },

        importPPT: {
            value: function (file,cb) {

                storageDB.importZip(file, function (err, videoFiles, zip) {
                    if (err) {
                       return cb(err);
                    } 

                    getPPTXSlides(zip,function (err,slides) {
                        if (err) {
                            return cb(err);
                        }

                        const slideFilenames = Object.keys(slides);

                        processNextVideoFile(0);

                        function getSlideNos(filename) {
                            return slideFilenames.filter(function (fn) {
                                return slides[fn].indexOf(filename) > 0;
                            }).map(function (fn) {
                                return Number(fn.replace(/\.xml\.rels$/i, '').replace(/^.*\/_rels\/slide/, ''));
                            });
                        }

                        function processNextVideoFile(i) {
                            if (i<videoFiles.length) {
                                const videoFile = videoFiles[i];
                                const slideMask = videoFile.internalPath.replace(/^.*\/media\//i,'/media/')+'"';
                                const slideNos = getSlideNos(slideMask);
                                const nameFixRegex = /\.pptx\/ppt\/media\//i;
                                const slideNosText = slideNos.length ? '.pptx/@Slide'+slideNos.join('+')+'/' : '.pptx/ppt/media/';

                                // we are augmenting the name to show the slide numbers
                                const fixedName = videoFile.displayName.replace(nameFixRegex,slideNosText);    

                                // make a detailed powerpoint specfic info object for this video file
                                // which we will place in the filenames array in both the returned value and the database
                                 
                                const filenamesEntry =  {
                                    displayName     : fixedName,
                                    internalPath    : videoFile.internalPath,
                                    importFilename  : fixedName,
                                    sourceFile      : file.name,
                                    slideNos        : slideNos,
                                };

                                // update the filenames array for the immediate caller 
                                videoFile.filenames[ videoFile.filenamesIndex ] = filenamesEntry;

                                return storageDB.get(videoFile.id,function (err,existingFile,objectStore,transaction) {
                                    if (err) {
                                        return cb(err);
                                    }
                                    if (existingFile) {

                                        if (videoFile.isFirstImport) {
                                            // only do this if it's not a re-import
                                            // as user most likely has edited it to a friendly name.
                                            existingFile.meta.displayName = fixedName;
                                        } 
                                            
                                        existingFile.meta.filenames[ videoFile.filenamesIndex ] = filenamesEntry;
                                     
                                        objectStore.put(existingFile);

                                        return processNextVideoFile(i+1);
                                    }

                                });
                            }
                            cb(undefined,videoFiles,zip);
                        }
                        
                         
                    });
                });

                function getPPTXSlides(zip,cb) {

                    let media = zip.folder("ppt\/slides\/_rels");
                    let files = media.file( /.*\.xml\.rels$/i );
                    let promises = [];  
                    files.forEach(function (file) {
                        promises.push(
                            new Promise(function (resolve,reject) {
                                zip.file(file.name).async("text").then(function (xmlText) {
                                  return xmlText;                              
                                }).then(resolve).catch(reject);
                            })
                           
                        );
                    });
                    Promise.all(promises).then(function (results) {
                        let slides = {};
                        results.forEach(function (xmlText,i) {
                            slides[files[i].name] = xmlText;
                        });
                        cb(undefined,slides);
                    }).catch(cb);
    
                }
    

            },
            enumerable: true,
            configurable: false,
        },
        importZip: {
            // read in the blob and unzip it using JSZip.
            // then, look for video files in the zip
                value: function (blob,cb) {

                 let zip = new JSZip();
                    let prefix = blob.name + '/';
                    zip.loadAsync(blob).then(function (zip) {
                            
                        let files = zip.file(/.*\.(mp4|mov|avi|wmv|mpg|mpeg|flv|webm)$/i);
                        let promises = [];
                        files.forEach(function (file) {
                            promises.push(
                                new Promise(function (resolve, reject) {
                                    zip.file(file.name).async("blob").then(function (blob) {
            
                                        blob.lastModifiedDate = file.date || new Date();
                                        blob.lastModified = blob.lastModifiedDate.getTime();
            
                                        return Object.defineProperties(blob, {
                                            type: { value: 'video/mp4' },
                                            name: {
                                                value: prefix + file.name  
                                            },
                                            sourceFile   : { value: blob.name },
                                            internalPath : { value: file.name }
                                         });
                                    }).then(resolve).catch(reject);
                                })
            
                            );
                        });

                        Promise.all(promises).then(function (results) {
                            
                            nextFile(0);
                        
                            function nextFile(i) {
                                if (i < results.length) {
                                    storageDB.importVideo  (results[i], function(err,record){
                                        if (err) return cb(err);   
                                        
                                        record.sourceFile   = results[i].sourceFile; 
                                        record.internalPath = results[i].internalPath; 

                                        results[i] = record;
                                        nextFile(i+1);
                                    });

                                } else {    
                                    cb(undefined,results,zip);
                                }

                            }
                            
                        }).catch(cb);
                
                    }).catch(cb);
    
    
            },
            enumerable: true,
            configurable: false,
        },
        importVideo: {

            // this reads in a video file blob and saves it into 
            // records wrapping array buffers (because there's a limit to the size of an array buffer)
                        
            enumerable: true,
            configurable: false,

            value: function (blob, cb) { 
                               
                const importedFilesContainer = document.getElementById('imported-files-container');

                let fileDisplayDiv,previewImgDiv,thumbNameText, thumbnailImg,thumbnailProgress;

                if (importedFilesContainer) {
                    // we are importing in the context of an active GUI
                    // create a div to display the file
                    // and a few elements to show the progress of the import

                    (// wrap in brackets to destructure to existing variables
                        {
                            fileDisplayDiv,
                            previewImgDiv,
                            thumbNameText,
                            thumbnailImg,
                            importProgress: thumbnailProgress
                        } = storageDB.createFileDiv(
                            importedFilesContainer, { filenames: [blob.name], filenamesIndex: 0 }, 'importing')
                    );
                }


                if (thumbnailProgress) {
                    // we are importing in the context of an active GUI
                    // so give the user some indication of how long it might take
                    thumbnailProgress.max = blob.size * 2;
                    // we may be iterating the data twice
                    // once to get the hash (and split it into an array of buffers)
                    // and possibly a second time to store it in the database
                    // this means that if we are storing a duplicat file, the
                    // progress bar will jump the last 50% very quickly since that stage 
                    // won't happen.  So we set the max to twice the file size

                    thumbnailProgress.value = 0;
                     
                }



                const thumbWidth         = thumbnailImg && thumbnailImg.dataset.width || 320;
                const thumbHeight        = thumbnailImg && thumbnailImg.dataset.height || 240;
                const thumbnailAtSeconds = thumbnailImg && thumbnailImg.dataset.posterTime || 1;

              

                getMediaFrameAndDuration(
                    blob,
                    thumbnailAtSeconds,
                    thumbWidth, thumbHeight,
                    function (previewFrame, previewFrameAt, duration) {


                        let frameUpdater;
                        
                        if (thumbnailImg) {
                            // we are importing in the context of an active GUI
                            // so give the user a preview of the video
                            // as the video is imported
                            thumbnailImg.src = previewFrame;
                            thumbnailImg.dataset.posterTime = previewFrameAt;

                            
                        }


                        // first, read the file into an array of arrayBuffers
                        // and determine a quasi-sha256 digest of the file
                        // (not a true hash due to a limitation of subtlecrypto)
                        // the digest is sha256(sha256(sha256(buffer1)+buffer2)+buffer3) and so on
                        // we use the hash to determine if the file has already been imported
                        // and it forms the basis of the file's id


                        readFileArrayBuffers(blob, function (buffers, digest) {

                            const digestString = [...new Uint8Array(digest)].map(byteToHex).join('');

                            lookupFile(digestString, function (notFound, cursor, transaction) {
                                if (notFound) {

                                    // since it's a new file, we need to get a preview frame



                                    const bufferCount = buffers.length;// buffers will shrink as we store them, so we need to save the count now.

                                    // make a placeholder meta object
                                    // that will be used for the first buffer, and replaced
                                    // with a pruned down pointer to the first buffer's id key, which is 
                                    // used to find the metadata from any buffer, should the need arise 
                                    // in the future. at this point, that seems inconceivable, but it's
                                    // but some of us can remember when a 16k expansion pack for the zx81 was all we'd ever need, right?
                                    let meta = {
                                        //displayName: blob.name,  // the first time we store the file, 
                                        // we use the filename as the display name
                                        // which can be changed later by the user
                                        filenames: [ { displayName: blob.name, importFilename : blob.name }],  // this is the first time this content has been saved, so there is only one filename
                                        type: blob.type,
                                        size: blob.size,
                                        lastModified: blob.lastModifiedDate,

                                        previewFrame: previewFrame,
                                        previewFrameAt: previewFrameAt,
                                        duration: duration

                                    };

                                    // the callback is a faux record that's returned to indicate what was imported
                                    // it's not the * actual * record - for example in reality the meta information
                                    // is not exploded out like it is here, but is stored in a single object, in the first buffer
                                    // but this is a convenient way to pass back the information to the caller
                                    const callbackValue = {
                                        id: null, // we don't know the id yet, but we will soon
                                        digestString: digestString, // the digestString is the digest of the file
                                        displayName: meta.filenames[0].displayName,// the display name is the filename at the time of import
                                        importFilename: meta.filenames[0].importFilename, // the importFilename is the filename at the time of import
                                        // (if the file gets renamed or copied, we could end up with multiple display names for the same file
                                        // they end up in the filenames array - see below)
                                        type: meta.type,
                                        size: meta.size,
                                        lastModified: meta.lastModified,
                                        duration: meta.duration,
                                        previewFrame: meta.previewFrame,
                                        previewFrameAt: meta.previewFrameAt,
                                        filenames: meta.filenames,
                                        filenamesIndex: 0,
                                        isFirstImport: true // we need this to differentiate between the first import re-importing file at
                                        // filenameIndex 0, and subsequent imports of the same content at a different filenameIndex
                                    };

                                    if (fileDisplayDiv) {
                                         fileDisplayDiv.dataset.filenamesIndex = 0;
                                    }


                                    // and now do the actual import
                                    storeNextBuffer();

                                    function storeNextBuffer() {

                                        if (buffers.length === 0) {
                                            if (previewImgDiv ) {
                                                updateUi(previewImgDiv,'className','');
                                            }
                                          
                                            cb(undefined, callbackValue);
                                            return updateThumbNameText( callbackValue.id,0);

                                        }

                                        var currentFileJson = {
                                            digestString: digestString,
                                            bufferIndex: bufferCount - buffers.length,
                                            bufferCount: bufferCount,
                                            arrayBuffer: buffers.shift(),
                                            meta: meta
                                        };

                                        storageDB.set(currentFileJson, function (err, id) {
                                            if (err) {
                                                return cb(err);
                                            }

                                            if (meta.filenames) {
                                                // after saving the first buffer, the meta can be pruned
                                                // down to a pointer to were the meta can be found (in the first buffer)
                                                // since records after the first one are only used in streaming
                                                // data, it's unlikely we will need to access the meta unless
                                                // we start streaming mid-file, in which case we can get the meta
                                                // from the first buffer. in reality we'd probably load the whole file
                                                // and tell the video to start playing at the right time, since it knows
                                                // a lot more about how to seek on various codecs than we do.
                                                // but since we really don't need to save the huge preview frame
                                                // and other meta data more than once, we don't.
                                                // there's also the valid point that the filenames array will be updated
                                                // if additional copies are located later, and we really don't want to 
                                                // iterate every buffer to update the meta.

                                                meta = {
                                                    at: id
                                                };
                                                // save the id for the outer callback
                                                callbackValue.id = id;
                                            }

                                            if (thumbnailProgress) {
                                                thumbnailProgress.value += currentFileJson.arrayBuffer.byteLength;
                                            }
                                            //onwards to next buffer
                                            storeNextBuffer();
                                        });

                                    }





                                } else {
                                    // the content exists (it might be a duplicate file)
                                    // but we need to add the filename.

                                    if (thumbnailImg) {
                                        // we are importing in the context of an active GUI
                                        // so give the user a preview of the video
                                        // as the video is imported
                                        thumbnailImg.src = cursor.value.meta.previewFrame;
                                        thumbnailImg.dataset.posterTime = cursor.value.meta.previewFrameAt;
                                    }
                                    if (previewImgDiv ) {
                                         updateUi(previewImgDiv,'className','');
                                    }

                                    buffers.splice(0, buffers.length);// clear the buffers array

                                    let ix = cursor.value.meta.filenames.findIndex( function (filename) {
                                        return filename.importFilename === blob.name;
                                    });
                                    if (ix < 0) {
                                        // ok this is another copy of the file with a different name
                                        // we don't need to waste space and time storing the file again
                                        // but the user wants it in multiple places for some reason.
                                        // (for example a bumper that gets used in multiple shows)
                                        ix = -1 + cursor.value.meta.filenames.push( { displayName: blob.name, importFilename : blob.name });
                                        cursor.update(cursor.value);
                                        transaction.commit();
                                    } else {
                                        // the file is already in the database, and it has the same name
                                        transaction.abort();
                                    }

                                    if (fileDisplayDiv) {
                                        fileDisplayDiv.dataset.filenamesIndex = ix;
                                    }


                                    // since we are technially not importing anything, 
                                    // we just want to send back the same information so it can be displayed
                                    // in the GUI. the key to note is that the filenamesIndex is the index of the filename
                                    // AND WILL BE > 0

                                    const preserveId = cursor.value.id;
                              
                                    const callbackValue = {
                                        id: cursor.value.id, // the id of the first buffer
                                        digestString: cursor.value.digestString,  // the digest of the file   

                                        displayName: cursor.value.meta.filenames[ix].displayName,// the name of the file as it was first imported
                                        importFilename: cursor.value.meta.filenames[ix].importFilename, // the name of the file as it was first imported
                                        type: cursor.value.meta.type,
                                        size: cursor.value.meta.size,
                                        lastModified: cursor.value.meta.lastModified,
                                        duration: cursor.value.meta.duration,
                                        previewFrame: cursor.value.meta.previewFrame,
                                        previewFrameAt: cursor.value.meta.previewFrameAt,
                                        filenames: cursor.value.meta.filenames,
                                        filenamesIndex: ix, // the index of the filename in the filenames array
                                        isFirstImport: false // this is not the first import of the file.
                                        // this is so importPPT and importZip can differentiate between the first import

                                    };

                                    cb(undefined, callbackValue);

                                    updateThumbNameText(preserveId, callbackValue.filenamesIndex);

                                   

                                   
                    
                                }
                            });

                        });

                    });
                   
                   
                function updateThumbNameText(forId,atFileIndex) {

                    if (thumbNameText) {
                        setTimeout(function () {
                                // we need to wait a bit for any pptx name update transactions to complete
                                storageDB.get(forId, function (err, value) {
                                    if (err) throw err;
                                    
                                    thumbNameText.textContent = getDisplayName(value,atFileIndex);
                                });
                        },1000);
                    }
                }

                function getDisplayName(value,atFileIndex) {

                    const entry = value.meta.filenames[atFileIndex];

                    return typeof entry === 'string' ? entry : entry.displayName;

                }

              
                function byteToHex(byte) {
                    return ('0' + (byte & 0xFF).toString(16)).slice(-2);
                }
    
                //calls cb with array of arrayBuffers and digest of file
                function readFileArrayBuffers(file,cb) {

                    const fileStreamer = new FileStreamer(file,maxBufferSize);
                    const buffers = [];
                    let cumulativeDigest = undefined;
                    
        
                    fileStreamer.readBlockAsArrayBuffer().then(onNextBuffer);
        
                    function onNextBuffer(arrayBuffer) {
                        buffers.push(arrayBuffer);
                        sha256Hasher(arrayBuffer,cumulativeDigest,function(err,digest){
                            if (err) throw err ;

                            cumulativeDigest = digest;
                           
                            if (thumbnailProgress) {
                                thumbnailProgress.value += arrayBuffer.byteLength;
                            }
                            
                            if (fileStreamer.isEndOfFile()) {
                                cb(buffers,cumulativeDigest);
                            } else {
                                fileStreamer.readBlockAsArrayBuffer().then(onNextBuffer)
                            }
                        });
                        
                    }
                
        
                }

                // calls cb with a thumbnail from the video at the current time
                function grabThumbnailAtCurrentTime(videoElement, maxWidth, maxHeight, cb) {
                    var width = videoElement.videoWidth || parseInt(videoElement.style.width);
                    var height = videoElement.videoHeight || parseInt(videoElement.style.height);
                
                    if (width > height) {
                        if (width > maxWidth) {
                            height = height * (maxWidth / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = width * (maxHeight / height);
                            height = maxHeight;
                        }
                    }

                    let canv = document.createElement('canvas');
                    canv.height = height;
                    canv.width = width;

                    const ctx = canv.getContext('2d');
                    ctx.drawImage(videoElement, 0, 0,width,height);
                    const url = canv.toDataURL();
                    
                    cb(url, videoElement.currentTime, videoElement.duration);
 
                }

                // calls cb with a thumbnail from the video at a specified time
                // (reads video from blob, uses temporary video element to seek to time, then calls grabThumbnailAtCurrentTime)
                function getMediaFrameAndDuration(blob,thumbnailAtSeconds, maxWidth, maxHeight,cb) {
         
                    const tempVidElem = document.createElement('video');
                    tempVidElem.onloadedmetadata = function () {
    
                    
                        if (thumbnailAtSeconds > tempVidElem.duration) {
                            thumbnailAtSeconds = tempVidElem.duration;
                        }
    
                        if (tempVidElem.currentTime === thumbnailAtSeconds) {
                           return grabThumbnailAtCurrentTime(tempVidElem, maxWidth, maxHeight, cb);
                        }
                        
                        tempVidElem.onseeked = function () {
                            grabThumbnailAtCurrentTime(tempVidElem, maxWidth, maxHeight, cb);
                        };
                        tempVidElem.currentTime = thumbnailAtSeconds;
                    
                    };
    
                    tempVidElem.src = URL.createObjectURL(blob);
    
                }

                // try to find a specific file in the database
                function lookupFile(digestString,cb) {

                    let transaction = database.transaction([storeName], "readwrite");
                    let objectStore = transaction.objectStore(storeName);
                    let index = objectStore.index("digestStringBufferIndex");
                    let range = IDBKeyRange.bound([digestString, 0], [digestString, Infinity], false, false);
                    cursor = index.openCursor(range);
                    cursor.addEventListener('success', foundFile);
            
                    
                    function foundFile(event) {
                        const thisCursor = event.target.result;
                        if (thisCursor) {
                            cb (undefined,thisCursor,transaction);
                        } else {
                            cb (new Error('File not found'),undefined,transaction);
                        }
                    }
                        
                }

            } 
        
        },

    
        importFiles : {
            // import file(s) into the database
            // source is single file source (which may be a zip,pptx or media file of some description)
            // cb is called with an array of file objects
                        
            enumerable: true,
            configurable: false,

            value : function (source,cb) {
                          
                // check the type to see if it's something other than a video file
                switch (source.type) {
                    case 'application/zip' : 
                    case 'application/x-zip-compressed' :
                        return this.importZip(source,cb);
           
                    case 'application/vnd.openxmlformats-officedocument.presentationml.presentation' : 
                        return this.importPPT(source,cb);

                        //todo: add support for other media types eg audio, images, pdfs etc
                         
                }

                // if we get here, assume it's a video file
                return this.importVideo(source,function(err,vid){
                    if (err) return cb(err);
                    // for consistency, we always return an array of files
                    // even if there is only one.
                    // (this is because a zip or pptx file may contain more than one file)
                    cb(undefined,[vid]);
                });
                
            }
        },

        dropHandler : {
            // handle a file drop event
            
            enumerable: true,
            configurable: false,

            value : function (event,cb) {
                // Prevent default behavior (Prevent file from being opened)
                event.preventDefault();
                if (typeof cb!=='function') cb=undefined;

                // make a list of files to import, with a function to get each file
                const useMap = event.dataTransfer.items?itemMapper:fileMapper;
                const transferList = [].slice.call ( event.dataTransfer.items || event.dataTransfer.files).map(useMap);
                const importedFiles = [];

                // handle each file in turn
                handleNextFile(0);

                function handleNextFile(i) {

                    if (i < transferList.length) {

                        const file = transferList[i]();
                        console.log(`Importing ${file.name}…`);
                        storageDB.importFiles(file,function(err,imported){
                            if (err) {
                                (cb||console.log)(err);
                            } else {
                                importedFiles.push.apply(importedFiles,imported);
                                handleNextFile(i+1);
                            }
                           
                          });
                    }   else {
                        (cb||console.log)(undefined,importedFiles);                         
                    }             

                }

                // map functions to get files from dataTransferItem or dataTransferFile
                function itemMapper(item){return function(){return item.getAsFile();};}
                function fileMapper(file){return function(){return file;};}
            
            }
        },

        localFileSelectHandler: {
             // handle a file selection event

            enumerable: true,
            configurable: false,
           
            value: function (event,cb) {
                // Prevent default behavior (Prevent file from being opened)
                event.preventDefault();
                if (typeof cb!=='function') cb=undefined;

                if (!event.currentTarget || !event.currentTarget.files || !event.currentTarget.files.length) {
                    return (cb||console.log)('No files selected');
                }

                var oFileArray = [].slice.call(event.currentTarget.files);
                const importedFiles = [];

                handleNextFile(0);

                function handleNextFile(i) {

                    if (i < oFileArray.length) {

                        const file = oFileArray[i];

                        console.log(`Importing ${file.name}…`);
                        storageDB.importFiles(file, function (err, imported) {
                            if (err) {
                                (cb||console.log)(err);
                            } else {
                                 
                                importedFiles.push.apply(importedFiles,imported);
                                handleNextFile(i + 1);
                            }

                        });
                    } else {
                        if (cb) return cb(undefined,importedFiles);
                    }

                }

            }

        },

        updateSelected: {
                enumerable: true,
                configurable: false,

                value : function (selectedFile) {
                    if (selectedFile.fileDisplayDiv) {
                        [].slice.call(selectedFile.fileDisplayDiv.parentNode.children).forEach(function (el) {
                            setUiClass(el, 'selected', el === selectedFile.fileDisplayDiv );
                        });
                    }
                }
                
        },

        createFileDiv: {
            enumerable: true,
            configurable: false,

            value : function (importedFilesContainer,file,setClassname,selected) {

                const importFilename = file.filenames[file.filenamesIndex].importFilename;

                let fileDisplayDiv,  previewImgDiv, thumbNameText, thumbnailImg, thumbnailProgress;
            
                fileDisplayDiv = importedFilesContainer.querySelectorAll(`[data-import-filename="${importFilename}"]`)[0];
                
                const existed = !!fileDisplayDiv;

                if (existed) {
                    previewImgDiv = fileDisplayDiv.querySelector('div');
                   
                    thumbNameText =previewImgDiv.querySelector('span');
                    thumbNameText.textContent = importFilename;
                    thumbnailProgress = previewImgDiv.querySelector('progress');
                    thumbnailProgress.value = 0;
            
                    thumbnailImg = previewImgDiv.querySelector('img');
            
                    if (file.previewFrame) {
                       thumbnailImg.src = file.previewFrame;
                    }
            
                  
            
                } else {
                
                    
                    fileDisplayDiv = document.createElement('div');
                    fileDisplayDiv.classList.add('imported-file');
            
                   
                    fileDisplayDiv.dataset.importFilename = importFilename; 
            
                    previewImgDiv = document.createElement('div');
                    previewImgDiv.ondragstart = function () { return false; };

                    fileDisplayDiv.appendChild(previewImgDiv);
            
                    thumbNameText = document.createElement('span');
                    thumbNameText.textContent = importFilename;
                    previewImgDiv.appendChild(thumbNameText);
            
                    thumbnailImg = document.createElement('img');
                    thumbnailImg.src = file.previewFrame || 'black.png';
            
                    previewImgDiv.appendChild(thumbnailImg);
            
                    thumbnailProgress = document.createElement('progress');
                    thumbnailProgress.value=0;
                    previewImgDiv.appendChild(thumbnailProgress);
            
                    importedFilesContainer.appendChild(fileDisplayDiv);

                    
                
                }
            
                if (setClassname) {
                    previewImgDiv.className = setClassname;
                }

                if (selected) {
                    storageDB.updateSelected(  file );
                }

                if (file.id) {
                    const divID = 'file-'+file.id;
                    fileDisplayDiv.id = divID;
                    const thumbID = 'thumb-'+file.id;
                    previewImgDiv.id = thumbID;

                    fileDisplayDiv.dataset.events='click,dblclick';

                    if (!existed && window.remoteController) {
                        window.remoteController.win.postMessage({
                            cmd:'createUi',
                            parent : importedFilesContainer.id,
                            html : fileDisplayDiv.outerHTML,
                        },'*');
                    }
                }
            
                return { fileDisplayDiv, previewImgDiv, thumbNameText, thumbnailImg, thumbnailProgress };
            
            }
        }

    });

    storageDB.init();

}

 
