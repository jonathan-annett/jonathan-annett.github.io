const   maxBufferSize = 32 * 1024 * 1024;
        var videosListFiles= {};   
        var database,storeName,
            storageDB = {};

        var uiEvents = getUIEvents();

        for (let eventName in uiEvents) {
            for (let id in uiEvents[eventName]) {
                document.getElementById(id).addEventListener(eventName,uiEvents[eventName][id]);
            }
        }
        
        openDb(window,storageDB, function(err,db,sn){
            if (err) return console.log(err);
            console.log("DB Opened");
            database = db;
            storeName = sn;

            uiEvents.click.listBtn();
            

        });

/*
        function HandleFileUpload(event) {
            var oFileArray = [].slice.call(event.currentTarget.files);
            if (oFileArray != null && oFileArray.length > 0) {

                readNextFile(0);

                function readNextFile(i) {
                    if (i >= oFileArray.length) {
                        return  uiEvents.click.listBtn();
                    }
                    const currentFile = oFileArray[i];

                    console.log(currentFile);

                    if (currentFile.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation'||
                        currentFile.type === 'application/x-zip-compressed') {
                        return extractPPTXVids(currentFile, function (err, vids) {
                            if (err) return console.log(err);
                            vids.forEach(function (vid) {
                                oFileArray.push(vid);
                            });
                            return readNextFile(i + 1);
                        });
                    }

                    


                    getMediaFrameAndDuration(currentFile,1,'dataUrl',function(previewFrame,previewFrameAt,duration){
                        console.log('duration:',duration);
                        previewImg.src = previewFrame;
                        previewImg.style.display = 'inline-block';
                        previewImgDiv.className='installing';
                        videoObj.style.display = 'none';
                        previewProgress.max = currentFile.size;
                        previewProgress.value = 0;
                        previewProgress.style.display='inline-block';
                        readFileArrayBuffers(currentFile, function (buffers) {
                            //Store the file
                            const bufferCount = buffers.length;

                            let codecInfo;

                            if (currentFile.type === 'video/mp4') {
                                mp4CodecFromArrayBuffer(buffers[0],function(c){
                                    codecInfo = 'video/mp4; codecs="'+c.join(', ')+'"';
                                    storeNextBuffer();
                                });
                            } else {
                                codecInfo = currentFile.type;
                                storeNextBuffer();
                            }
                                
                            function storeNextBuffer() {
                                if (buffers.length===0) {
                                    return readNextFile(i + 1);
                                }

                               
                                var currentFileJson = {
                                    name: currentFile.name,
                                    type: currentFile.type,
                                    codecInfo: codecInfo,
                                    size: currentFile.size,
                                    duration : duration,
                                    lastModified: currentFile.lastModifiedDate,
                                    bufferIndex: bufferCount-buffers.length,
                                    bufferCount: bufferCount,
                                    previewFrame : previewFrame,
                                    previewFrameAt : previewFrameAt,
                                    arrayBuffer: buffers.shift()
                                };

                               

                                storageDB.set(currentFileJson);
                                previewFrame = '';
                                storeNextBuffer();
                        
                              
                                
                            }
                            
                        }
                    );

                    });
                    
                   
                }
            }
        }

        class FileStreamer {
            constructor(file, defaultChunkSize = 512 * 1024 * 1024  ) {
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

        function readFileArrayBuffers(file,cb) {

            const fileStreamer = new FileStreamer(file,maxBufferSize);
            const buffers = [];
            

            fileStreamer.readBlockAsArrayBuffer().then(onNextBuffer);

            function onNextBuffer(arrayBuffer) {
                buffers.push(arrayBuffer);
                previewProgress.value += arrayBuffer.byteLength;
                if (fileStreamer.isEndOfFile()) {
                    cb(buffers);
                } else {
                    fileStreamer.readBlockAsArrayBuffer().then(onNextBuffer)
                }
            }
        

        }

        function fnSrc(fn) {
            let src = fn.toString();
            return src.substring(src.indexOf('{') + 1, src.lastIndexOf('}'));
        }

        function startWorker(wrk,onMsg,funcs) {
            let worker;
            if (typeof wrk==='function') {
                let scriptText = fnSrc(wrk);
                if (funcs) {
                    scriptText += "\n" + funcs.map(function(fn) { return fn.toString(); }).join("\n");
                }
                var scriptBase64 = btoa(scriptText);
                var scriptURL = 'data:text/javascript;base64,' + scriptBase64;
                worker = new Worker(scriptURL);
            } else if (typeof wrk==='string') {
                const src = wrk;
                worker = new Worker(src);
            }
            if (typeof onMsg==='function') {
            worker.onmessage = function (event) {
                onMsg(event.data);
                }   
            };
            return worker;
        }
        

        function mp4CodecFromArrayBuffer(ab,cb) {
            const mp4boxfile = MP4Box.createFile();
            mp4boxfile.onError = console.error;
            mp4boxfile.onReady = function (info) {
                cb(info.tracks.map(function (track) {
                    return track.codec ;
                }));
            };
            ab.fileStart = 0;
            mp4boxfile.appendBuffer( ab );
            mp4boxfile.flush();
        }

        

*/
   

            function openRemoteWindow() {
                let win;
                if (window.remoteController) {
                    return window.remoteController;
                } else {
                    
                    addEventListener("message",function gotNewObj( e ) {
                       console.log (e.data);
                       const ctl = window[e.data.cmd];
                        switch (e.data.cmd) {
                            case 'init': {
                                window.remoteController.win = win;
                                break;
                            }
                            default:

                                ["click", "dblclick"].forEach(function (evt) {
                                    if (e.data[evt]) {
                                        const fn = uiEvents[evt][e.data.cmd];
                                        if (fn) fn (e.data);
                                    }
                                });
                                
                           
                                if (e.data.change) {
                                    if (ctl.selectedIndex !==  e.data.change.selectedIndex) {
                                        ctl.selectedIndex = e.data.change.selectedIndex;
                                        uiEvents.change[e.data.cmd](e.data);
                                    }
                                }
                                
                        }

                    });
                    win = window.open(undefined,"myfloatingRemote","width=1024,height=768,menubar=no,toolbar=no,location=no,personalbar=no,status=no,resizable=yes,scrollbars=yes,titlebar=no,x=0,y=0");
                   
                     

                  
                    window.remoteController = {win}; 
                    sendHtml();
                    return window.remoteController;

                      function sendHtml () {
                        if (win.document) {
                            win.document.write(`

                            ${controlsWrap.innerHTML}

                            <div id="opaqueMask"></div>
                            <div id="opaqueMaskMsg">move this window to another monitor </div>
                            <button id="opaqueMaskBtn">click "Enter FullScreen" in main window</button>
  
                            <script src="../timer/fsapi.js"></script>
                            <script src="remote.js"> </script>
                           

                            `);
                            setTimeout(function waitForInit() {
                                   if (!window.remoteController) return;
                                   if (window.remoteController.playBtn)  return;

                                   win.postMessage({cmd:'init'},'*');
                                   setTimeout(waitForInit,50);
                            },10);

                        }
                     //   } else {
                      //      setTimeout(sendHtml,100);
                       // }
                    }
                }       
                

            }
      
            function openAsPageInNewTab(pageContent) {
                let encoded = encodeURIComponent(pageContent); 
                let a = document.createElement(`a`);
                a.target = `_blank`;
                a.href = `data:text/html;charset=utf-8,${encoded}`;
                a.style.display = `none`;
                document.body.appendChild(a); // We need to do this,
                a.click();                    // so that we can do this,
                document.body.removeChild(a); // after which we do this.
              }

              function controlId(control) {
                 return typeof control === 'string' ? control : control.id;
              }

              function controlElement(control) {
                    return typeof control === 'string' ? window[control] : control;
              }


              function updateUi(control,key,value) {
                if (control) {
                    const el = controlElement(control);
                    if (typeof value!=='undefined') {
                        el[key] = value;
                    }
                    if (window.remoteController) {
                        window.remoteController.win.postMessage({
                            cmd:'updateUi',
                            control:controlId(control),
                            key,
                            value:el[key]
                        },'*');
                    }
                }
              }

              function setUiClass(control,cls,add) {
                if (control) {
                    controlElement(control).classList[add!==false?'add':'remove'](cls);
                    updateUi(control,'className');
                }
              }

            
              function getMediaDuration (blob,cb) {
                 
                    const tempVidElem = document.createElement('video');
                    tempVidElem.onloadedmetadata = function () {
                        cb(tempVidElem.duration);
                        URL.revokeObjectURL(tempVidElem.src);
                    };
                    tempVidElem.src = URL.createObjectURL(blob);
                
              }

              function getMediaFrameAndDuration(blob,seconds,format,cb) {
                if (typeof format === 'function') {
                    cb = format;
                    format = 'dataUrl';
                }
                const tempVidElem = document.createElement('video');
                tempVidElem.onloadedmetadata = function () {

                
                    if (seconds > tempVidElem.duration) {
                        seconds = tempVidElem.duration;
                    }

                    if (tempVidElem.currentTime === seconds) {
                        grabFrameAtCurrentTime(tempVidElem,format,cb);
                        return;
                    }
                    tempVidElem.currentTime = seconds;
                
                    tempVidElem.onseeked = function () {
                        grabFrameAtCurrentTime(tempVidElem,format,cb);
                    };
                };

                tempVidElem.src = URL.createObjectURL(blob);

                 }

                 function grabFrameAtCurrentTime(v,format,cb) {
                    let c = document.createElement('canvas')
                    c.height = v.videoHeight || parseInt(v.style.height)
                    c.width = v.videoWidth || parseInt(v.style.width)
                    const ctx = c.getContext('2d')
                    ctx.drawImage(v, 0, 0)
                    const url = c.toDataURL();
                    if (format==='dataUrl') {
                        cb(url,v.currentTime,v.duration);
                    } else {
                        if (format==='arrayBuffer') {
                            const ab = stringToArrayBuffer(url) 
                            cb (ab,v.currentTime,v.duration);
                        } else {
                            cb (c,v.currentTime,v.duration);
                        }
                    }
                     
         

               //attrib : https://github.com/dy/string-to-arraybuffer/blob/master/index.js
                  function stringToArrayBuffer(arg) {
                      if (typeof arg !== 'string') throw Error('Argument should be a string')

                      //valid data uri
                      if (/^data\:/i.test(arg)) return decode(arg)

                      //base64
                      if (isBase64(arg)) arg = atob(arg)

                      return str2ab(arg)


                      function str2ab(str) {
                          var array = new Uint8Array(str.length);
                          for (var i = 0; i < str.length; i++) {
                              array[i] = str.charCodeAt(i);
                          }
                          return array.buffer
                      }

                      function decode(uri) {
                          // strip newlines
                          uri = uri.replace(/\r?\n/g, '');

                          // split the URI up into the "metadata" and the "data" portions
                          var firstComma = uri.indexOf(',');
                          if (-1 === firstComma || firstComma <= 4) throw new TypeError('malformed data-URI');

                          // remove the "data:" scheme and parse the metadata
                          var meta = uri.substring(5, firstComma).split(';');

                          var base64 = false;
                          var charset = 'US-ASCII';
                          for (var i = 0; i < meta.length; i++) {
                              if ('base64' == meta[i]) {
                                  base64 = true;
                              } else if (0 == meta[i].indexOf('charset=')) {
                                  charset = meta[i].substring(8);
                              }
                          }

                          // get the encoded data portion and decode URI-encoded chars
                          var data = unescape(uri.substring(firstComma + 1));

                          if (base64) data = atob(data)

                          var abuf = str2ab(data)

                          abuf.type = meta[0] || 'text/plain'
                          abuf.charset = charset

                          return abuf
                      }

                  }


              }

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

function extractPPTXVids(blob, cb) {
    let zip = new JSZip();
    let prefix = blob.name + ' - ';
    zip.loadAsync(blob).then(function (zip) {

        getPPTXSlides(zip, function (err, slides) {
            if (err) return cb(err);
            let slideFilenames = Object.keys(slides);

            let media = zip;//.folder("ppt/media");
            //if (!media) media = zip.folder("");
            let files = media.file(/.*\.(mp4|mov|avi|wmv|mpg|mpeg|flv|webm)$/i);
            let promises = [];
            files.forEach(function (file) {
                promises.push(
                    new Promise(function (resolve, reject) {
                        zip.file(file.name).async("blob").then(function (blob) {

                            blob.lastModifiedDate = file.date || new Date();
                            blob.lastModified = blob.lastModifiedDate.getTime();

                            const slideNos =  slideFilenames.filter(function (filename) {
                                const basename=file.name.replace(/^.*\/media\//,'/media/');
                                return slides[filename].indexOf(basename+'"') > 0;
                            }).map(function (fn) {
                                return Number(fn.replace(/\.xml\.rels$/i, '').replace(/^.*\/_rels\/slide/, ''));
                            });

                            return Object.defineProperties(blob, {
                                type: { value: 'video/mp4' },
                                name: {
                                    value: 
                                    file.name.replace(/^ppt\/media\//, prefix) + ' (' +

                                    slideNos.map(function(n){ return 'Slide '+n}).join(',')+')'
                                },
                                slideNos : {value : slideNos}
                            });
                        }).then(resolve).catch(reject);
                    })

                );
            });
            Promise.all(promises).then(function (results) {
                cb(undefined, results);
            }).catch(cb);
        });


    }).catch(cb);
}



