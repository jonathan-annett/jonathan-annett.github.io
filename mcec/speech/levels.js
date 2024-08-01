// constants purloined from https://www.engineeringtoolbox.com/octave-bands-frequency-limits-d_1602.html
const barInfo = [/*
 low    center  high  */    
[11.2,  12.5,	14.1],
[14.1,  16,	    17.8],
[17.8,  20,	    22.4],
[22.4,  25,	    28.2],
[28.2,  31.5,	35.5],
[35.5,  40,	    44.7],
[44.7,  50,	    56.2],
[56.2,  63,	    70.8],
[70.8,  80,	    89.1],
[89.1,  100,	112],
[112,   125,	141],
[141,   160,	178],
[178,   200,	224],
[224,   250,	282],
[282,   315,	355],
[355,   400,	447],
[447,   500,	562],
[562,   630,	708],
[708,   800,	891],
[891,   1000,	1122],
[1122,  1250,	1413],
[1413,  1600,	1778],
[1778,  2000,	2239],
[2239,  2500,	2818],
[2818,  3150,	3548],
[3548,  4000,	4467],
[4467,  5000,	5623],
[5623,  6300,	7079],
[7079,  8000,	8913],
[8913,  10000,	11220],
[11220, 12500,	14130],
[14130, 16000,	17780],
[17780, 20000,	22390]

 ];
const prevIgnore = localStorage.getItem("ignoreBars");
const ignoreBars = barInfo.map(function(){ return true;});

const line5   = document.getElementById("line5"),
      lineCeil = document.getElementById("lineCeil");

function freqStyle1 (info,ix){
   return info[1].toString();
}

function freqStyle2 (info,ix){

  if (info[1]<1000) 
    return  info[1].toString();
    return  (info[1]/1000).toString()+" K"
}

function freqStyle3 (info,ix){
  if (info[1]<1000) 
    return  info[1].toString();
  let ks = (info[1]/1000).toString(); 
  if (ks.indexOf(".")<0) return  ks+"K"
  return  ks.replace(".","K");
}


// load module from Skypack CDN
import AudioMotionAnalyzer from './audiomotion.js';


var elem = document.documentElement;

/* View in fullscreen */
function openFullscreen() {
  if (elem.requestFullscreen) {
    elem.requestFullscreen();
  } else if (elem.webkitRequestFullscreen) { /* Safari */
    elem.webkitRequestFullscreen();
  } else if (elem.msRequestFullscreen) { /* IE11 */
    elem.msRequestFullscreen();
  }
}

/* Close fullscreen */
function closeFullscreen() {
  if (document.exitFullscreen) {
    document.exitFullscreen();
  } else if (document.webkitExitFullscreen) { /* Safari */
    document.webkitExitFullscreen();
  } else if (document.msExitFullscreen) { /* IE11 */
    document.msExitFullscreen();
  }
}

var c = document.getElementById("GEQCanvas");
var ctx = c.getContext("2d");

var c2 = document.getElementById("VULevel");
var ctx2 = c2.getContext("2d");


var freqLabs =  [
  document.getElementById("freqs"),
  document.getElementById("freqs2")
 ];

const freqStyles = [freqStyle1,freqStyle2,freqStyle3];
var   freqStyleIndex = 1;

var cw ,ch, cw2,ch2 ;


var w ,hw, hh ;

let redrawLines = 1;
let redrawLines2 = 1;

let scale = localStorage.getItem('scale');
scale = scale ? Number(scale) : 2.5;
let ceilValue = localStorage.getItem('ceilValue');
ceilValue = ceilValue ? Number(ceilValue) : 0.8;

const scaleRange = document.getElementById('scaleRange');
const scaleInfo  = document.getElementById('scaleInfo');


let bandsHistory = new Array();
let historyBuffer = new Array();
scaleRange.value = 100 * scale;

reportWindowSize();


const freqNames = barInfo.map(freqStyle2).join("\n");

freqLabs.forEach(function(lab){
  lab.innerHTML = freqNames;
  lab.style.lineHeight = w.toString()+"px";
});

var freqButton = document.getElementById('freqStyle');



window.onresize = reportWindowSize;

var running=false,started=false;

var sampleCount=0,samplesStart,msPerPixel;


const smoothingBuffer = new Array( 50 );
for (let i=0;i<smoothingBuffer.length;i++) {
	smoothingBuffer[0]=0;
}

const silenceDetector = new SilenceDetector(ceilValue, 5000,500,getAudioLevel,window===window.top?undefined:window.top);
silenceDetector.setThreshold(ceilValue,1);
const silenceInfo = document.querySelector('.silenceInfo');
let updateTimeout;

let classLists = [  document.body.classList ];
if (window.top && window.top !== window) {
  classLists.push(window.top.document.querySelector('html').classList);
}

window.addEventListener('silenceDetected', (event) => {
    console.log('Silence detected at:', event.detail);
    classLists.forEach(function(list){
      list.add('silent');
      list.remove('audio');
    });
    if (updateTimeout) clearTimeout(updateTimeout);

    updateTimeout = setTimeout(function dispSeconds(lastAudioSeenAt) {
        const elapsedMsec = Date.now() - lastAudioSeenAt;
        const elapsed = (elapsedMsec / 1000);
        silenceInfo.innerHTML = isNaN(elapsed)  ? '' : `silent for ${elapsed.toFixed(1)} seconds`;
        updateTimeout = setTimeout(dispSeconds, 100,lastAudioSeenAt);
    }, 100, event.detail.lastAudioSeenAt);
});

window.addEventListener('audioResumed', (event) => {
    console.log('Audio resumed at:', event.detail);
    classLists.forEach(function(list){
      list.remove('silent');
      list.add('audio');
    });
    if (updateTimeout) {
        clearTimeout(updateTimeout);
        updateTimeout = undefined;
        silenceInfo.innerHTML = `${silenceInfo.innerHTML}.<br>Audio resumed at ${
        
            new Date(event.detail.audioResumedAt ).toLocaleTimeString()
        
        }`;
    }
});


   
window.addEventListener('audioActive', (event) => {
    console.log('Audio active:', event.detail);
});

scaleChanged();



scaleRange.addEventListener( 'input',scaleChanged);

function scaleChanged(e)  {

  scale = scaleRange.value / scaleRange.min;
  scaleInfo.textContent = `1:${scale.toFixed(1).replace(/\.0$/,'')}`;
  const rectangle = c2.getBoundingClientRect();
  const vv = (rectangle.height * ceilValue * scale );

  const ct = ((rectangle.top + rectangle.height) - vv) -4 ;
	lineCeil.style.top = `${ ct }px`;
	lineCeil.style.display = 'block';
	if (e) {
	    redrawLines = historyBuffer.length;
	}
	localStorage.setItem('scale',scale);

}

freqButton.addEventListener( 'change', () => {

    if(freqStyleIndex===2) {
        freqStyleIndex=0
    } else {
      freqStyleIndex++;
    }
      
    const freqNames = barInfo.map(freqStyles[freqStyleIndex]).join("\n");

    freqLabs.forEach(function(lab){
      lab.innerHTML = freqNames;
    });

});

function redrawLabs() {
   const freqNames = barInfo.map(freqStyles[freqStyleIndex]).join("\n");

   w = cw / barInfo.length;
   hw = w/2;
   freqLabs.forEach(function(lab){
      lab.style.lineHeight =  w.toString()+"px";
      lab.innerHTML = freqNames;
    });
}

function reportWindowSize(e) {

  cw = c.clientWidth;
  ch = c.clientHeight;
    
  cw2 = c2.clientWidth;
  ch2 = c2.clientHeight;
  
  hh = c2.clientHeight / 2;
 
  c.setAttribute("width",cw);
  c.setAttribute("height",ch);
  
  c2.setAttribute("width",cw2);
  c2.setAttribute("height",ch2);

  redrawLines2 = bandsHistory.length;
  
  redrawLabs();
  
  if (e) {
      scaleChanged(e);
  }

}

/*
freqLabs[1].addEventListener('mousedown',function(e){
  const  x = e.offsetX,y = e.offsetY;
  const ix = Math.floor(y / w);
  
  ignoreBars[ix] = ! ignoreBars[ix];
  console.log(x,y,ix,barInfo[ix][1]);
  redrawLabs();
  
  localStorage.setItem("ignoreBars",JSON.stringify(ignoreBars));
});*/


c2.addEventListener('mousedown',function(e){
   const rectangle = c2.getBoundingClientRect();
   ceilValue = ((c2.clientHeight)-(e.y - rectangle.top+4))/c2.clientHeight/scale;  
   silenceDetector.setThreshold(ceilValue,1);
   localStorage.setItem('ceilValue',ceilValue.toString());
   
   scaleChanged(); 
});

c2.addEventListener('mousemove',function(e){
    if(e.buttons === 1) {
        const rectangle = c2.getBoundingClientRect();
        ceilValue = ((c2.clientHeight)-(e.y - rectangle.top+4))/c2.clientHeight/scale;  
        silenceDetector.setThreshold(ceilValue,1);
        localStorage.setItem('ceilValue',ceilValue.toString());
        scaleChanged();
    }
 });

function getTimespanInfo(msecs) {
    let waterLine = performance.now()-msecs;
    if ( historyBuffer [ 0 ].when > waterLine ) return null;
    
    const samples =  historyBuffer.filter(function(el){
       return el.when>= waterLine;
    });
    
    return {
        samples,
        max : samples.reduce(function(max,el){
             return el.value > max ? el.value : max; 
        },0),
        average : samples.reduce(function (total,el){
             return total + el.value; 
        },0) / samples.length
    };
    
}

function showHistoryLine(seconds,over) {
    const msecs = seconds * 1000;
    const info = getTimespanInfo(msecs);
    const el = document.getElementById(`line${seconds}`);
    if (info && el) {
          var rectangle = over.getBoundingClientRect();
          el.style.display = "block";
          el.style.top = `${ (rectangle.top + rectangle.height) - (rectangle.height * info.max * scale ) }px`;
          el.style.height = `${ (rectangle.height * ( (info.max-info.average) * scale) ) }px`;
          el.style.left  = info.samples.length < rectangle.width ? `${rectangle.width-info.samples.length}px` :  '0';
          el.info = info;
          return info.samples;
    }
}

function emitEvent(eventType, timestamp) {
    const event = new CustomEvent(eventType, { detail: { timestamp } });
    window.dispatchEvent(event);
    window.top.postMessage({eventType,timestamp},"*");
}

function getAudioLevel() {
  return realTimeDisplayFunc.value ;
}

function realTimeDisplayFunc(instance)  {
    if (!running) return;  
    
    const nw = performance.now();
    sampleCount++;
    if (sampleCount===1) {
        samplesStart=nw;
    } else {
        msPerPixel = (nw - samplesStart) / sampleCount;
    }
    
    
    var right  = c2.clientWidth-4;
    var bottom = c2.clientHeight-4;
       
    
    var ix,ix2; 
       
    let max=0;
    let maxAt;
       
    // we are going to paint each bar gray, then overpaint the current max (hot zone) in red
    
    const value = realTimeDisplayFunc.value =  instance.getEnergy();

    if (!silenceDetector.initialChecked) {
      silenceDetector.initialChecked=true;
      setTimeout(()=>{
        silenceDetector.initialCheck();
      },500);
    }
    

    if (value > ceilValue ) {

      classLists.forEach(function(list){
        if (!list.contains('overThreshold')) {
            list.add('overThreshold');
        }
    });      
      
       
    } else {
        classLists.forEach(function(list){
          if (list.contains('overThreshold')) {
              list.remove('overThreshold');
          }
        });       
    }
    
    smoothingBuffer.push(value);
    smoothingBuffer.shift();
    const smoothed = smoothingBuffer.reduce(function(t,v){ return t+v},0) / smoothingBuffer.length;
    
    historyBuffer.push({value:smoothed,when:nw});
    
    // scroll left 1 pixel
    ctx2.drawImage(ctx2.canvas, 1, 0, cw2-1, ch2,  0, 0, cw-1, ch2 );
    
    ix=historyBuffer.length-1;
    
    while (redrawLines> 0 && right > 0&& ix>=0) {
    
        const topPix = bottom-(bottom*historyBuffer[ix].value*scale);
        ctx2.beginPath();
        ctx2.strokeStyle = "black"; 
        ctx2.moveTo(right, 0);
        ctx2.lineTo(right, topPix);
        ctx2.stroke();   
    
    	ctx2.beginPath();
        ctx2.strokeStyle = "aqua"; 
    	ctx2.moveTo(right, topPix);
    	ctx2.lineTo(right, bottom);
    	ctx2.stroke();	
    	right --;
	    ix --;
        redrawLines --;
    }
    redrawLines = 1;
  
  
    setCeilButton.parentElement.style.backgroundColor = !!showHistoryLine(5,c2) ? 'white' : 'gray';
        
    const newBuf = showHistoryLine(60,c2);
    if (newBuf) {
        historyBuffer = newBuf;
        setCeilButton2.parentElement.style.backgroundColor='white';
    } else {
        setCeilButton2.parentElement.style.backgroundColor='gray';
    }  
    
    // scroll up 1 pixel
	ctx.drawImage(ctx.canvas, 0, 1, cw, ch - 1,  0, 0, cw, ch - 1);

    let samples= new Array(barInfo.length);
    for (ix=0;ix<barInfo.length;ix++) {
          // get energy for current bar
          const lowBound  = barInfo[ix][0];
          const highBound = barInfo[ix][2];
          const value = instance.getEnergy(lowBound,highBound);
          samples[ix]=value;
    }
    
    
    ix = bandsHistory.length;
    while (ix>500) {
        ix--;
        bandsHistory.shift();
    }
    bandsHistory.push(samples);
	
	let top = c.clientHeight;
	
			 
    //console.log({redrawLines2,bhl:bandsHistory.length});

	while (redrawLines2>0 && top > 0 && ix >=0) {
	    
	    let left = w/2;
	    
    	    // wipe out bottom line of pixels
    		ctx.strokeStyle = "black";
    	   
    		ctx.beginPath();
    		ctx.moveTo(1, top);
    		ctx.lineTo(cw-1, top);
    		ctx.stroke();   
    	

        for (ix2=0;ix2<samples.length;ix2++) {
    	      const value = bandsHistory[ix][ix2];
    	      
              if (ignoreBars[ix2]) {
                 ctx.strokeStyle = "gray";
              } else {
                  ctx.strokeStyle = "lime"; 
                  if (value>max) {
                    max = value;
                    maxAt = [left];
                  } else {
                    if (maxAt&& (value===max)) {
                      maxAt.push(left);
                    }
                  }
              }
              // draw each bar in gray, even if it's the current max
              ctx.beginPath();
              ctx.moveTo(left-(value*hw), top);
              ctx.lineTo(left+(value*hw), top);
              ctx.stroke();    
              left += w; 
    
        }   
        
        // overpaint the detected max bar(s) in red   
		ctx.strokeStyle = "red";
	   
		if (maxAt) {
		  maxAt.forEach(function(left){ 
				ctx.beginPath();
				ctx.moveTo(left-(max*hw), top);
				ctx.lineTo(left+(max*hw), top); 
				ctx.stroke();	
	
		  });
		}
	
        redrawLines2--;
        ix--;
        top--;
	}
	
	redrawLines2=1;
    
    
} 
                 
// instantiate analyzer
var  audioMotion; 

 



// toggle microphone on/off
const micButton      = document.getElementById('mic');
const setCeilButton  = document.getElementById('setCeil');
const setCeilButton2 = document.getElementById('setCeil2');
const micButtonLabel = document.getElementById('micLab');
var lastStream;

micButton.addEventListener( 'change',onMicToggle);

setCeilButton.addEventListener( 'change',onCeilButtonClick);
setCeilButton2.addEventListener( 'change',onCeilButtonClick);

const audioSessionInfo = { audio: true,  video: false } ;

document.addEventListener( 'keydown',onMicToggle);


 

function onCeilButtonClick (ev){
   const lineEl = ev.target.parentElement.dataset.seconds == '5' ? line5:line60;
   if (started && (lineEl.style.display === "block")) {

        lineCeil.style.display = "block";
        
  
          
      if (ev.shiftKey) {
        lineCeil.style.top = `${ Number.parseInt(lineEl.style.top)+ Number.parseInt(lineEl.style.height) -4 }px`;
        localStorage.setItem('ceilValue',lineEl.info.average);
      } else {
        lineCeil.style.top = `${ Number.parseInt(lineEl.style.top)-4 }px`;
        localStorage.setItem('ceilValue',lineEl.info.max);
      }
		    localStorage.setItem('scale',scale);
		    ceilValue = lineEl.info.max;
        silenceDetector.setThreshold(ceilValue,1);

	}
}

function getLiveAudioSource(cb){
    
    if ( navigator.mediaDevices ) {
        
      navigator.mediaDevices
        .getUserMedia(audioSessionInfo) 
           .then( function( stream ) { cb (undefined,stream); })
          .catch( cb );
    } else {
      cb(new Error('User mediaDevices not available'));
    }
    
}

function onMicToggle (e){

   if (e.type==="keydown") {
       if (e.code==="Space") {
          micButton.checked = !micButton.checked; 
       } else {
          return ;
       }
   }
  let micIsOn = micButton.checked; 
  if (  micIsOn ) {

    if (!audioMotion) {
      audioMotion = new AudioMotionAnalyzer(
        null,
        {
          mode: 0,// discrete frequency mode
          fftSize:8192,
          useCanvas: false, // don't use the canvas
        
          onCanvasDraw: realTimeDisplayFunc
        }
      );
    }
    
    getLiveAudioSource(function(err,stream){
       if (err) {
           alert(err.message || err);
           return;
       } 
        
        // create stream using audioMotion audio context
        let micStream = audioMotion.audioCtx.createMediaStreamSource( stream );
        // connect microphone stream to analyzer
        audioMotion.connectInput( micStream );
        // mute output to prevent feedback loops from the speakers
        audioMotion.volume = 0;
        lastStream = stream;
        running = true;
      
        
        started=true;
        
        micButtonLabel.classList.add('running');

        // let some history build up before booting the silence detector
       
    });  
  }
  else {
    // disconnect all input audio sources
    audioMotion.disconnectInput();
    if (lastStream) {
       stopStream(lastStream); 
       lastStream=undefined;
    }
    running = false;
    micButtonLabel.classList.remove('running');
  }
}

 

function stopStream( stream ) {
  stream.getTracks().forEach(function(track) {
    track.stop();
  });
}


 
