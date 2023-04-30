function getUIEvents() {

    window.fs_api = window.fs_api.newApi(videoObj);




    fs_api.on('enter', function () {
        if (window.remoteController) {
            setTimeout(() => {
                  window.remoteController.win.focus();
            }, 500);
          
         }
    });
    fs_api.on('exit', function () {
        if (window.remoteController) {
            window.remoteController.win.close();
            window.remoteController.win = null;
            window.remoteController = null;
        }
    });

    let 
    frameUpdateTimerIdleMs = 1000,
    frameUpdateTimerRunMs = 1000/30,    
    frameUpdateTimer  = setTimeout(function frameUpdateTimerFunc () {
        frameUpdateTimer=undefined;

        if (window.remoteController && window.remoteController.win && !videoObj.paused) {
        try {

             grabFrameAtCurrentTime(videoObj,'dataUrl',function(previewFrame,previewFrameAt,duration){
                    window.remoteController.win.postMessage({cmd:'frameUpdate',previewFrame,previewFrameAt,duration}, '*');
                    frameUpdateTimer  =  setTimeout(frameUpdateTimerFunc,frameUpdateTimerRunMs);
             });

            } catch (error) {   

                console.log(error);
                frameUpdateTimer  = setTimeout(frameUpdateTimerFunc,frameUpdateTimerIdleMs);
            }

        } else {  
            frameUpdateTimer  = setTimeout(frameUpdateTimerFunc,frameUpdateTimerIdleMs);
        }

       
    }, frameUpdateTimerIdleMs);

    return {
        click: {
            listBtn: function (e) {
                uiEvents.click.closeAllBtn({});
                storageDB.getList(function (files) {
                    videosList.innerHTML = '';
                    Object.keys(videosListFiles).forEach(function (key) {
                        delete videosListFiles[key];
                    });

                    const explodedList = [];

                    files.forEach(function (file) {
                        file.meta.filenames.forEach(function(entry,filenamesIndex){
                            const listEntry = {
                                id          : file.id,
                                digestString  : file.digestString,
                                displayName : typeof entry === 'string' ? entry : entry.displayName,
                                meta        : typeof entry === 'string' ? {} : entry,
                                filenamesIndex:filenamesIndex
                            };
                            Object.keys(file.meta).forEach(function(key){
                                if (key!=='displayName') {
                                    listEntry[key] = file.meta[key];
                                }
                            });

                            explodedList.push(listEntry);
                        });
                    });

                    explodedList.forEach(function (file) {
                        var opt = document.createElement('option');
                        var name = document.createElement('span');
                        name.innerHTML = `

                        <!--span class="file-id">${  file.id.toString(16).padStart(6,'0') }</span-->                      
                        <span class="file-duration">${  secToStr(file.duration )}</span>
                        <span class="file-display-name">${  file.displayName }</span>
                        <!--span class="file-digest-string">${  file.digestString  }</span-->                      
                        
                        `;
                        opt.appendChild(name);
                        opt.value = file.id; XPathExpression
                        videosListFiles[file.id] = file;
                        opt.dataset.digestString = file.digestString;
                        opt.dataset.filenamesIndex = file.filenamesIndex;
                        opt.id = 'video-' + file.id;
                        Object.keys(file.meta).forEach(function(key){
                            opt.dataset['meta'+ key.charAt(0).toUpperCase()+ key.substring(1)] = file.meta[key];
                        });
                        videosList.appendChild(opt);
                    });
                    uiEvents.change.videosList();

                    function secToStr(sec) {
                        let prefix = sec < 0 ? "-" : "";
                        if (sec < 0) {
                            sec = 0 - sec;
                        }
                        let min = Math.trunc(sec / 60) % 60;
                        let hr = Math.trunc(sec / 3600);
                        let sx = Math.trunc(sec % 60);
                    
                    
                        let sx_ = (sx < 10 ? "0" : "") + sx.toString();
                        if (hr < 1) {
                            let min_ = min.toString();
                            return prefix + min_ + ":" + sx_;
                        }
                        let min_ = (min < 10 ? "0" : "") + min.toString();
                        let hr_ = hr.toString();
                        return prefix + hr_ + ":" + min_ + ":" + sx_;
                    }
                });
            },

            playBtn: function (e, opts) {
                opts = opts || {};
                const selectedFileId = videosList.value;
                const selectedOption = videosList.options[videosList.selectedIndex];
                const selectedFile = videosListFiles[selectedFileId];
                if (selectedFile) {

                    updateUi('playBtn', 'disabled', selectedFile.playing);
                    if (!selectedFile.playing) {
                        uiEvents.click.closeAllBtn({ ctrlKey: true }, function () {

                            if (!!selectedFile.blobUrl) {
                                videoObj.src = selectedFile.blobUrl;
                                console.log('playing video:', selectedFile.digestString);
                                videoObj.style.display = 'inline-block';
                                videoObj.play();
                               
                               
                                selectedFile.playing = true;

                                updateUi(selectedOption, 'className', 'loaded playing');
                                updateUi(selectedFile.previewImgDiv,'className', selectedOption.className);
                                updateUi(videosList, 'className', selectedOption.className);
                                videoObj.addEventListener('playing', onPlaying);
                                videoObj.addEventListener('ended', onEnded);
                            } else {
                                console.log('loading video:', selectedFile.digestString);
                                updateUi(selectedOption, 'className', 'loading');
                                updateUi(videosList, 'className', selectedOption.className);
                                storageDB.getBlob(selectedFile, true, function (err, blob, url,uiElements) {
                                    if (err) return console.log(err);
                                    selectedFile.blobUrl = url;
                                    selectedFile.previewImgDiv = uiElements.previewImgDiv;

                                    videoObj.src = url;
                                    console.log('playing video:', selectedFile.digestString);
                                    videoObj.style.display = 'inline-block';
                                    videoObj.play();
                                     
                                    selectedFile.playing = true;
                                    updateUi(selectedOption, 'className', 'loaded playing');
                                    updateUi(selectedFile.previewImgDiv,'className', selectedOption.className);
                                    updateUi(videosList, 'className', selectedOption.className);
                                    videoObj.addEventListener('playing', onPlaying);
                                    videoObj.addEventListener('ended', onEnded);
                                    return true;
                                });
                            }
                        });
                    }

                    function onEnded() {
                        console.log('video ended');
                        videoObj.removeEventListener('ended', onEnded);
                        videoObj.removeEventListener('playing', onPlaying);
                       
                        selectedFile.playing = false;

                        updateUi(selectedOption, 'className', 'loaded');
                        updateUi(selectedFile.previewImgDiv,'className', selectedOption.className);
                        updateUi(videosList, 'className', videosList.options[videosList.selectedIndex].className);
                        updateUi('playBtn', 'disabled', !videosListFiles[videosList.value].blobUrl);
                    }

                    function onPlaying () {
                         
                    }
                }
            },

            closeAllBtn: function (e, cb) {
                const options = [].slice.call(videosList.options);
                let needsCb = !!cb, weClosed;
                options.forEach(function (option) {
                    const selectedFile = videosListFiles[option.value];
                    if (selectedFile) {
                        if (!selectedFile.playing || e.shiftKey || e.ctrlKey) {
                            if (selectedFile.playing) {
                                videoObj.pause();
                                if (needsCb) {
                                    videoObj.addEventListener('pause', function onpause() {
                                        videoObj.removeEventListener('pause', onpause);
                                        videoObj.src = '';
                                        selectedFile.playing = false;
                                        cb(selectedFile);
                                    });
                                    needsCb = false;
                                } else {
                                    videoObj.src = '';
                                    selectedFile.playing = false;
                                }
                            }
                            if (selectedFile.blobUrl && !e.ctrlKey) {
                                URL.revokeObjectURL(selectedFile.blobUrl);
                                selectedFile.blobUrl = undefined;
                             }

                            setUiClass(option, 'loading', false);
                            setUiClass(option, 'loaded', !!selectedFile.blobUrl);
                            setUiClass(option, 'playing', false);

                            updateUi(selectedFile.previewImgDiv, 'className', option.className);

                            
                        }
                    }
                });
                const selectedOption = videosList.options[videosList.selectedIndex];
                const selectedFile = videosListFiles[videosList.value];
                updateUi(videosList, 'className', selectedOption ? selectedOption.className : '');
                updateUi('playBtn', 'disabled', selectedFile ? !!selectedFile.blobUrl : true);

                if (needsCb) {
                    cb();
                }
            },

            floatBtn: async function togglePiPMode(event) {
                floatBtn.disabled = true; //disable btn ,so that no multiple request are made
                try {
                    if (videoObj !== document.pictureInPictureElement) {
                        await videoObj.requestPictureInPicture();
                        floatBtn.textContent = "Embed";
                    } else {
                        await document.exitPictureInPicture();
                        floatBtn.textContent = "Float";
                    }
                } catch (error) {
                    console.log(error);
                } finally {
                    floatBtn.disabled = false; //enable toggle at last
                }
            },

            fullscreenBtn: function (e) {


                if (window.remoteController) {

                    videoObj.style.display = 'inline-block';
                    if (fs_api.isFullscreen()) {
                        fs_api.exitFullscreen();
                    } else {
                        fs_api.enterFullscreen();
                    }

                    if (window.remoteController) {
                       
                        window.remoteController.win.focus();
                    }
                    
                } else {

                    let rc = openRemoteWindow();
                    console.log(rc);
                         
                    document.body.classList.add('remote-available');

                    if (!fs_api.isFullscreen()) {
                        fs_api.enterFullscreen();
                    }


                    
                }

            },

            opaqueMaskBtn : function (e) {
                if (window.remoteController) {

                    window.remoteController.win.document.body.classList.remove("positioning-remote");
                    window.remoteController.win.document.body.classList.remove("positioning-remote-fail");
                    document.body.classList.remove("positioning-remote");
                    document.body.classList.remove("positioning-remote-fail");
                    
                    if (!fs_api.isFullscreen()) {
                        fs_api.enterFullscreen();
                    }
                }
            },

            grabFrame: function (e) {

                const v = document.querySelector('video')
                let c = document.createElement('canvas')
                c.height = v.videoHeight || parseInt(v.style.height)
                c.width = v.videoWidth || parseInt(v.style.width)
                const ctx = c.getContext('2d')
                ctx.drawImage(v, 0, 0)
                const wnd = window.open('');
                const url = c.toDataURL();
                wnd.document.write(`<img src="${url}"/>`)
                URL.revokeObjectURL(url);
            }

        },
        dblclick: {
            videosList: function (e) {
                uiEvents.click.playBtn({ inDblClick: true });
            }
        },
        focus: {
            videosList: function (e) {
                videosList.blur();
            }
        },
        change: {

            videoFileInput: function (e) { 
                storageDB.localFileSelectHandler(e,function(err,importedFiles){
                    if(err){
                        console.log(err);
                    }else{
                       uiEvents.click.listBtn();
                    }
                });
            },

            videosList: function (e) {
                const selectedFileId = videosList.value;
                const selectedOption = videosList.options[videosList.selectedIndex];
                const selectedFile = videosListFiles[selectedFileId];
                if (selectedFile) {

                    //updateUi(previewImg,'src',selectedFile.previewFrame || '');

                    
                    if (selectedFile.blobUrl) {

                        updateUi('playBtn', 'disabled', selectedFile.playing);
                        updateUi(selectedOption, 'className', 'loaded' + (selectedFile.playing ? ' playing' : ''));
                        updateUi(selectedFile.previewImgDiv,'className', selectedOption.className);

                        storageDB.updateSelected(selectedFile);

                        updateUi(videosList, 'className', selectedOption.className);

                        updateUi(videosList, 'selectedIndex');
                        if (window.remoteController) {
                            window.remoteController.win.focus();
                        }

                    } else {

                        selectedFile.playing = false;
                        updateUi('playBtn', 'disabled', true);
                        updateUi(selectedOption, 'className', 'loading');
                        storageDB.updateSelected(selectedFile);
                        updateUi(videosList, 'className', selectedOption.className);
                        updateUi(videosList, 'selectedIndex');

                        if (window.remoteController) {
                            window.remoteController.win.focus();
                        }
                        storageDB.getBlob(selectedFile, true, function (err, blob, url,uiElements) {
                            if (err) return console.log(err);
                         

                            selectedFile.blobUrl = url;
                            selectedFile.previewImgDiv = uiElements.previewImgDiv;
                            selectedFile.fileDisplayDiv = uiElements.fileDisplayDiv;

                            console.log('pre-loaded video:', selectedFile.digestString);

                            updateUi(selectedOption, 'className', 'loaded');
                            updateUi(selectedFile.previewImgDiv,'className', 'loaded');
                            setUiClass(selectedFile.fileDisplayDiv, 'selected');
                            

                            updateUi('playBtn', 'disabled', !videosListFiles[videosList.value].blobUrl || videosListFiles[videosList.value].playing);
                            storageDB.updateSelected(selectedFile);
                            updateUi(videosList, 'className', videosList.options[videosList.selectedIndex].className);
                            updateUi(videosList, 'selectedIndex');

                            selectedFile.fileDisplayDiv.onclick = function (e) {
                                videosList.value = selectedOption.value; 
                                uiEvents.change.videosList(e);
                            };

                        
                            selectedFile.fileDisplayDiv.ondblclick = function (e) {
                                videosList.value = selectedOption.value; 
                               // uiEvents.change.videosList(e);
                               if (selectedFile.playing) {
                                   uiEvents.click.closeAllBtn({ctrlKey:true});
                               } else {
                                   uiEvents.click.playBtn({ inDblClick: true });
                               }
                            };

                            if (selectedFile.fileDisplayDiv.id) {
                                uiEvents.click[selectedFile.fileDisplayDiv.id] = selectedFile.fileDisplayDiv.onclick;
                                uiEvents.dblclick[selectedFile.fileDisplayDiv.id] = selectedFile.fileDisplayDiv.ondblclick;
                            }


                            return true;
                        });
                    }
                }

               
            }
        },


    };
}