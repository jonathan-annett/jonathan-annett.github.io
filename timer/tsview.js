/*
  jshint maxerr: 1000000
*/

/* 
global timeProvider

*/
function createTimestampViewer(videoElement,canvas,timestampCanvas,liveCanvas,screenMode) {
    
    localNOW();
    
    let captureVideoElement = videoElement,screenVideoElement;
    
    let mostRecentFrames = [];
    let timedRegionFrames = [];
    
    const events = {
        update : [],
        reset : [],
        showLive : [],
        destroy : [],
        nextCamera : []
    };
    
    let targetStamp;
    let showlive = true;
    const frameRate = 1; // 4 frames per second
    const maxFrames = 5*60*frameRate;
    let int,stream,devices,screenStream,deviceLabel='';
    
    let bytes = 0;
    
    function emit(e,o) {
        const stack = events[e];
        if (stack) {
            stack.forEach(function(fn){
                fn(o);
            });
        }
    }
    
    function onEvent(e,fn) {
        const stack = events[e];
        if (stack && typeof fn==='function' && stack.indexOf(fn)<0) {
            stack.push(fn);
        }
    }
    
    function offEvent(e,fn) {
		const stack = events[e];
		if (stack && typeof fn==='function') {
		    const ix = stack.indexOf(fn);
		    if (ix>0) {
			  stack.splice(ix,1);
		    }
		}
	}
     
    async function startRecording() {
     
     
      
      
      try {
        devices = await navigator.mediaDevices.enumerateDevices();
        console.log(devices);
        devices = devices.filter(device => device.kind === 'videoinput');
        
        if (screenMode) {
        	stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'window' } });
    		const videoTrack = stream.getVideoTracks()[0];
        	deviceLabel = 'Screen Capture'; 
		    screenVideoElement = document.createElement('video');
		    screenVideoElement.width = 1920;
		    screenVideoElement.height = 1080;
		    document.body.appendChild(screenVideoElement); // Add videoElement to the document body
		    screenVideoElement.className="screenVideoElement";
    	 
    		captureVideoElement = screenVideoElement;
    		captureVideoElement.srcObject = new MediaStream([videoTrack]);
    		captureVideoElement.play();        
        } else {
            const device = devices.shift();
            deviceLabel = device.label;
                
            stream = await navigator.mediaDevices.getUserMedia( { video: { deviceId:device.deviceId  } });
            captureVideoElement = videoElement;
            captureVideoElement.srcObject = stream;
            
        }

        const captureFrame = () => {
          if (mostRecentFrames.length >= maxFrames) {
            const frm = mostRecentFrames.shift(); // Drop the oldest frame
            if (timedRegionFrames.indexOf(frm)<0) {
               if (frm.frameBlob) {
				   bytes -= frm.frameBlob.size;
				   delete frm.frameBlob;
				   delete frm.timestamp;
			   }
            }
          }
          const ctx = canvas.getContext('2d');
          ctx.drawImage(captureVideoElement, 0, 0, canvas.width, canvas.height);
          const element = { timestamp : timeProvider.now()};
        
          mostRecentFrames.push(element);
          
          if (targetStamp && timedRegionFrames.length < maxFrames*2) {
             timedRegionFrames.push(element) ;
          }
          canvas.toBlob(function(frameBlob){
             element.frameBlob = frameBlob;
             if (showlive) {
                 bytes += element.frameBlob.size;
                 paintBlob(liveCanvas,element.frameBlob,element.timestamp);
             }
          });
        };
        
      
        int = setInterval(captureFrame, 1000 / frameRate); // Capture frames every 250ms (1000ms / 4)
        //targetStamp = timeProvider.now();
        

      } catch (err) {
        console.error('Error accessing webcam:', err);
      }
    }
    
    async function useScreenCapture () {
        if (stream) {
			stream.getTracks().forEach(function(track) {
			  track.stop();
			});
			stream = undefined;
		}
		
	
		if (devices) devices.splice(0,devices.length);
		
		stream = await navigator.mediaDevices.getDisplayMedia({ video: { mediaSource: 'window' } });
		const videoTrack = stream.getVideoTracks()[0];
		if (!screenVideoElement) {
		    screenVideoElement = document.createElement('video');
		    screenVideoElement.width = 1920;
		    screenVideoElement.height = 1080;
		    document.body.appendChild(screenVideoElement); // Add videoElement to the document body
		    screenVideoElement.className="screenVideoElement";
		    deviceLabel = 'Screen Capture';
                
		}
		captureVideoElement = screenVideoElement;
		captureVideoElement.srcObject = new MediaStream([videoTrack]);
		captureVideoElement.play();
	

    }
    
    async function nextCamera () {
            if (stream) {
				stream.getTracks().forEach(function(track) {
				  track.stop();
				});
				stream = undefined;
			}
			
	 
		 	 if (screenVideoElement && screenVideoElement.parentNode) {
              screenVideoElement.parentNode.removeChild(screenVideoElement); // Remove videoElement from the document body
              screenVideoElement = undefined;
            }
	 
			
			
            let device = devices? devices.shift():undefined;
            if (!device) {
 
                devices = await navigator.mediaDevices.enumerateDevices();
                devices = devices.filter(device => device.kind === 'videoinput');
                device = devices.shift();
            } 
            
            if (device) {
                stream = await navigator.mediaDevices.getUserMedia( { video: { deviceId:device.deviceId  } });
                captureVideoElement = videoElement;
				captureVideoElement.srcObject = stream;
				deviceLabel = device.label;
                emit('nextCamera',deviceLabel);
            }
    }

    
     function drawTimestamp(dispCanvas, timestamp,index) {
          const ctx = dispCanvas.getContext('2d');
          const tstr = timestampToStr(timestamp);
          const timeString = typeof index === 'number' ? `${tstr}` : `LIVE ${tstr}`;
          ctx.fillStyle = 'yellow';
          ctx.font = '16px Arial';
          ctx.fillText(timeString, dispCanvas.width - (typeof index === 'number' ?  80 : 120 ), 20);
          if (typeof index !== 'number') {
              
            let frameString = `${secToStr(Math.floor(mostRecentFrames.length/frameRate))} buffered`;
            
    		ctx.fillText(frameString, 4, dispCanvas.height-24);
    		
    		if (timedRegionFrames.length) {
    		    const frameCount = mostRecentFrames.length + timedRegionFrames.length;
    		    const unique = mostRecentFrames.concat(timedRegionFrames).filter(function(e,i,a){ return a.indexOf(e)===i;}).filter(function(e){ return !!e.frameBlob;});
    		    const uniqueBytes = unique.reduce(function(t,e){ return e.frameBlob.size+t;},0);
    		    const averageBytes = uniqueBytes / unique.length;
    		    const estimate = maxFrames * 3 * averageBytes;
            	frameString = ( unique.length === frameCount   
            	
            	       ? `${(bytes / (1024*1024)).toFixed(1)} mb of ${(estimate / (1024*1024)).toFixed(1)} mb frame data (${(100 * bytes/estimate).toFixed(0)}%)`
            	       
            	       : `${(bytes / (1024*1024)).toFixed(1)} mb of ${(estimate / (1024*1024)).toFixed(1)} mb frame data`
            	       
            	   );
            	ctx.fillText(frameString, 4, dispCanvas.height-10);
        	} else {
        	    const frameCount = mostRecentFrames.length;
    		    const averageBytes = bytes / frameCount;
    		    const estimate = maxFrames * 3 * averageBytes;
                frameString = `${(bytes / (1024*1024)).toFixed(1)} mb of ${(estimate / (1024*1024)).toFixed(1)} mb frame data (${(100 * bytes/estimate).toFixed(0)}%)`;
            	ctx.fillText(frameString, 4, dispCanvas.height-10);
        	}
            
            ctx.fillText(deviceLabel, 4, dispCanvas.height-40);
    	
      }
    }

    

    async function displayFrameClosestTo(timestamp) {
      

      if ((timedRegionFrames.length===0) || (timestamp < timedRegionFrames[0].timestamp) ) {
          timestampCanvas.style.display = "none";
          return;
      }
      
      let index = 0;
	  const latest = timedRegionFrames[timedRegionFrames.length-1];
      let closestFrame;
      
       if (timestamp >= latest.timestamp) {
        	index  =  timedRegionFrames.length-1;
        	closestFrame = latest;
       } else {
           closestFrame = timedRegionFrames.reduce((closest, current,ix) => {
			if ( Math.abs(current.timestamp - timestamp) < Math.abs(closest.timestamp - timestamp) ) {
				index = ix;
				return current;
			} 
			return closest;
		  });
       }
      
      paintBlob(timestampCanvas,closestFrame.frameBlob,closestFrame.timestamp,index);
      timestampCanvas.blob = closestFrame.frameBlob;
      timestampCanvas.onclick = saveCapturedFrame;
      timestampCanvas.filename = `Capture @ ${timestampToStr (timestamp).replace(/\:/g,'_')}.png`;
      
      
    }
    
    function saveCapturedFrame(ev) {
        if (timestampCanvas.blob && timestampCanvas.blob.size && timestampCanvas.filename) {
             saveAs(timestampCanvas.blob, timestampCanvas.filename);
                
            
        }
    }
    
    function paintBlob(dispCanvas,blob,timestamp,index) {
        if (!blob) {
          if (canvas.style.display!=="none") {
            dispCanvas.style.display = "none";
          }       
          return;
        }
        
     
      
   
      const url = URL.createObjectURL(blob);

      const img = new Image();
      if (showlive && dispCanvas.style.display==="none") {
        dispCanvas.style.display = "inline-block";
      }
      img.onload = () => {
        // no longer need to read the blob so it's revoked
        URL.revokeObjectURL(url);
        
        // Get the computed styles for the div
        var computedStyle = window.getComputedStyle(dispCanvas);
        
        var computedWidth = parseInt(computedStyle.width);
        var computedHeight = parseInt(computedStyle.height);
        
        if (computedStyle && computedWidth >0 && computedHeight >0) {
              dispCanvas.width  = computedWidth;
              dispCanvas.height = computedHeight;
         }
          
         const ctx = dispCanvas.getContext('2d');

        ctx.drawImage(img, 0, 0,dispCanvas.width,dispCanvas.height);
        if (timestamp) {
            drawTimestamp(dispCanvas,timestamp,index);
        }
      };

      img.src = url;
        
    }
    
    

    startRecording(); // Start recording frames
    
   
    
    return {
        
        reset : function () {
            const lastFrame = mostRecentFrames[mostRecentFrames.length-1];
             targetStamp = lastFrame ? lastFrame.timestamp : timeProvider.now() ;
             
             timedRegionFrames.splice(0,timedRegionFrames.length).forEach(function(frm){
                 if (mostRecentFrames.indexOf(frm)<0) {
                     if (frm.frameBlob) {
                         bytes -= frm.frameBlob.size;
                         delete frm.frameBlob;
                         delete frm.timestamp;
                     }
                 }
             });
            
            timedRegionFrames = mostRecentFrames.slice();
            
         
             displayFrameClosestTo(targetStamp);
             
             emit('reset',targetStamp);
        },
        updateTimestamp : function (ts) {
			 targetStamp = ts;
			 displayFrameClosestTo(targetStamp);
			 emit('update',targetStamp);
		},
		
        getTimestamp : function () {
            return targetStamp;
        },
        
        showLive : function (v) {
            showlive=v||false;
			displayFrameClosestTo(targetStamp);
            if (showlive) {
                timestampCanvas.style.display="inline-block";
                liveCanvas.style.display="inline-block";
            } else {
                timestampCanvas.style.display="none";
                liveCanvas.style.display="none";
            }
            emit('showLive',v);
        },
        
        showingLive : function () {
            return showlive;
        },
        
        nextCamera : function retry (){
            nextCamera().then(function(){}).catch(function(e){console.log(e);});
            
        },
        
        useScreenCapture :function retry (){
				useScreenCapture().then(function(){}).catch(nextCamera);
		},
    
        on : onEvent,
        
        off: offEvent,
        
        stop : function () {
            clearInterval(int);
            int = undefined;
            
            pruneFrameArray(mostRecentFrames);
            pruneFrameArray(timedRegionFrames);
            
            timestampCanvas.style.display = "none";
            liveCanvas.style.display = "none";
            
            timestampCanvas.onclick = null;
            timestampCanvas.blob = null;
            
            
            if (stream) {
                stream.getTracks().forEach(function(track) {
                  track.stop();
                });
                stream = undefined;
            }
            
          
            
		 	 if (screenVideoElement && screenVideoElement.parentNode) {
              screenVideoElement.parentNode.removeChild(screenVideoElement); // Remove videoElement from the document body
              screenVideoElement = undefined;
            }
	 
           
            
        }
        
    };
    
    function pruneFrameArray(array) {
		  array.splice(0,array.length).forEach(function (frm) {
			 if (frm.frameBlob) {
				 bytes -= frm.frameBlob.size;
				 delete frm.frameBlob;
				 delete frm.timestamp;
			 }
		 });
	}
	
    
}

  function msecToStr(msec) {
      let sec = Math.floor(msec / 1000) % 86400;// convert to seconds, ignore any year/month/day component
	  return secToStr(sec);
  }

  function secToStr(sec) {
	  let prefix = sec < 0 ? "-" : "";
	  if (sec<0) {
		  sec=0-sec;
	  }
	  let min = Math.trunc(sec / 60 ) % 60;
	  let hr  = Math.trunc(sec / 3600 );
	  let sx  = Math.trunc(sec % 60);
	  
	 
	  let sx_  = (sx < 10 ? "0" : "") + sx.toString();
	  if (hr < 1 ) {
		   let min_ = min.toString();
		   return prefix + min_+":"+sx_;
	  }
	  let min_ = (min < 10 ? "0" : "") + min.toString();
	  let hr_  = hr.toString();
	  return prefix+hr_+":"+min_+":"+sx_;
  }



function timestampToStr (timestamp) {
     const date = new Date(timestamp);
     return  date.toLocaleTimeString().trim().split(' ')[0];
}

// Function to get the current timestamp adjusted for the local time zone
function localNOW() {
    // If offset is not cached, or if it's been more than a minute since it was last cached
    if (localNOW.cachedOffset === undefined ) {
        // Get the local time zone offset in minutes
        const offsetMinutes = new Date().getTimezoneOffset();
        // Cache the offset value in milliseconds
        localNOW.cachedOffset = offsetMinutes * 60 * 1000;
    }

    // Adjust the timestamp for the local time zone
    return Date.now() - localNOW.cachedOffset;
}

