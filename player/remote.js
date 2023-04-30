    var initOk = false;
    
   const clickEvent = sendUiEvent.bind(this,"click");
   const doubleClickEvent = sendUiEvent.bind(this,"dblclick");
   

    const replicatedEvents = {
        "click": clickEvent,    
        "dblclick": doubleClickEvent

   }; 


    addEventListener(
        "message",
        function(e){
          //console.log(e.data);
           switch (e.data.cmd) {
               case "init": {
                   if (window.opener.remoteController) {
                       if (initOk) return;
                       initOk = true;

                       window.opener.remoteController.videoFileInput = videoFileInput;
                       window.opener.remoteController.playBtn = playBtn;
                       window.opener.remoteController.closeAllBtn = closeAllBtn;
                       window.opener.remoteController.listBtn = listBtn;
                       window.opener.remoteController.floatBtn = floatBtn;
                       window.opener.remoteController.fullscreenBtn = fullscreenBtn;
                       window.opener.remoteController.videosList = videosList;
                       window.opener.postMessage({ cmd: 'init' }, '*');




                       var head = document.getElementsByTagName("head")[0];
                       var link = document.createElement("link");
                       link.rel = "stylesheet";
                       link.type = "text/css";
                       link.href = "index.css";
                       head.appendChild(link);

                       playBtn.onclick = clickEvent;

                       closeAllBtn.onclick = clickEvent;

                       listBtn.onclick = clickEvent;

                       floatBtn.visible = false;
                       
                       fullscreenBtn.onclick = function() {
                          if (window.fs_api.isFullscreen()) {
                            window.fs_api.exitFullscreen();
                          } else {
                            window.fs_api.enterFullscreen();
                          }
                           
                       };

                       videosList.onchange = function (e) {
                           window.opener.postMessage({ cmd: 'videosList', change: { value: e.target.value, selectedIndex: e.target.selectedIndex } }, '*');
                       };

                       videosList.onfocus = function (e) {
                           videosList.blur();
                       };

                       videosList.ondblclick = doubleClickEvent;

                      

                       
                       onkeydown = function (e) {
                           if (e.key === "Up" || e.key === "ArrowUp" || e.key === "Left" || e.key === "ArrowLeft") {
                               if (videosList.selectedIndex > 0) {
                                   newIndex(videosList.selectedIndex - 1);
                               } else {
                                   newIndex(videosList.options.length - 1);
                               }

                           } else if (e.key === "Down" || e.key === "ArrowDown" || e.key === "Right" || e.key === "ArrowRight") {
                               if (videosList.selectedIndex < videosList.options.length - 1) {
                                   newIndex(videosList.selectedIndex + 1);
                               } else {
                                   newIndex(0);
                               }
                           }

                           function newIndex(i) {
                               const v = videosList.options[i].value;
                               window.opener.postMessage({ cmd: 'videosList', change: { value: v, selectedIndex: i } }, '*');
                           }
                       };

                       onresize = function () {
                          console.log(window.screenX,window.screenY,window.innerWidth,window.innerHeight);
                          
                          return positonStatus (
                            
                            (window.screenX  > window.opener.screen.availLeft+window.opener.screen.availWidth-10 )||
                            (window.screenX + window.innerWidth-10  < window.opener.screen.availLeft  ) ||
                            (window.screenY  > window.opener.screen.availTop+window.opener.screen.availHeight-10 )||
                            (window.screenY + window.innerHeight-10  < window.opener.screen.availTop  ) 

                          );        
                           
                            function positonStatus(ok) {
                                const addRemove = !ok ? "add" : "remove";
                                this.document.body.classList[addRemove]        ("positioning-remote-fail");
                                this.opener.document.body.classList[addRemove] ("positioning-remote-fail");
                               
                            }

                       };

                     
                      var oldX = window.screenX,
                            oldY = window.screenY;

                        var interval = setInterval(function(){

                            if(oldX != window.screenX || oldY != window.screenY){
                                onresize();
                            }

                            oldX = window.screenX;
                            oldY = window.screenY;
                        }, 500);

                        onresize();
                        this.document.body.classList.add("positioning-remote");
                        this.opener.document.body.classList.add("positioning-remote");

                        onunload = function() {
                            clearInterval(interval);
                            
                            if (window.opener.remoteController) {
                                delete window.opener.remoteController.win;

                            }
                        
                            window.opener.remoteController = undefined;
                            this.opener.document.body.classList.remove("positioning-remote");
                            this.opener.document.body.classList.remove("positioning-remote-fail");
                         
                            window.opener.open().close();
                            
                        };

                        replicateEvents();
                    



                   } else {
                       close();
                   }

                  

                   return;
               }
              case "updateUi" : {
                  let key = e.data.key;
                  let ctrl =  window[e.data.control];
                  let value = e.data.value;

                  if (ctrl) {
                        if (JSON.stringify(value) !== JSON.stringify(ctrl[key])) {
                        ctrl[key] = value;
                        if (key==='selectedIndex') {
                            ctrl.value = ctrl.options[value].value;
                        }
                    }
                    }
                    break;
              }

              case "createUi" : {
                   let parent = window[e.data.parent];
                   parent.innerHTML += e.data.html;
                   replicateEvents();
                   break;
              }

              case "frameUpdate" : {
                    if (window.opener.remoteController) {
                        previewImg.src = e.data.previewFrame;
                        previewProgress.max=e.data.duration;  
                        previewProgress.value=e.data.previewFrameAt;  
                        previewProgress.style.display = "inline-block";
                    }

              }
             
           }

          

    });


    function replicateEvents() {
        const importedFilesContainer = document.getElementById('imported-files-container');
        if (importedFilesContainer) {
            [].slice.call(importedFilesContainer.querySelectorAll('div')).forEach(function (e) {
                                
                if (e.dataset.events && e.dataset.events.length) {
                    e.dataset.events.split(',').forEach(function (event) {
                        const fn = replicatedEvents[event];
                        if (fn) {
                            e['on'+event]=fn;
                        }
                    });
                }
            });
        }

    }

    
    function sendUiEvent(evName,e) {
        let t = e.target;
        let fn;
        while (!fn && t) {
            if (t.id) {
                fn = window.opener.uiEvents[evName][t.id];
                if (!fn) {
                    t = t.parentElement;
                }
            } else {
                t = t.parentElement;
            }
        }
        if (fn) {
            fn(e);
        }
    }

    

     
   
 