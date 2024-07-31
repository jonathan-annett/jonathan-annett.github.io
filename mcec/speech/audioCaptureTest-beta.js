//jshint esnext : false
//jshint esversion : 8
//jshint undef : true

let lastSpeechEventTimeout;
const failoverMsec = 5000;


document.addEventListener('CustomSpeechEvent',function(e){  
	 // give priority to powerpoint if it is active 
	 
	 
	if  (!!lastSpeechEventTimeout && e.detail.provider === "powerpoint") {
		if (document.querySelector('#preferPowerpoint').checked && document.body.className !== 'muted') {
			document.body.className = e.detail.provider; 
		}
	}


	if  (e.detail.provider === 'google-spn' && checkGoogle.watchdog) {
		// put the watchdog back in it's kennel
		clearTimeout(checkGoogle.watchdog);
		delete checkGoogle.watchdog;
		console.log("google Watchdog: back in kennel");
	}



	if (e.detail.provider === document.body.className ) {

		if (lastSpeechEventTimeout) {
			clearTimeout(lastSpeechEventTimeout);
			lastSpeechEventTimeout = undefined;
		}
		localStorage.setItem('captions',e.detail.transcript || "");

	}  else {
		if (!lastSpeechEventTimeout && document.body.className !== 'muted' ) {
			lastSpeechEventTimeout = setTimeout(
				function() {
					document.body.className = e.detail.provider;
					localStorage.setItem('captions',e.detail.transcript || "");
				},
				failoverMsec
			);
		}
	}


});


function checkGoogle () {
	 if (checkGoogle.watchdog) {
		 clearTimeout(checkGoogle.watchdog);
		 delete checkGoogle.watchdog;
		 console.log("google Watchdog: restarting gooogle speech");
		 document.querySelector('google-speech-spn').restart();
	 }
 }

document.addEventListener( "DOMContentLoaded",pageReady);


function pageReady() {
	const html = document.querySelector('html');

	load('fonts','--font-family');
	load('fontSize','--font-size', 'px');
	load('pageColor','--color-main-background');
	load('captionsColor','--captions-color');
	load('textColor','--text-color');
	load('captionsHeight','--captions-height','px');

	load('captionsLeft','--captions-left','px');
	load('captionsRight','--captions-right','px');
	load('captionsBottom','--captions-bottom','px');


   (function () {
	var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
	var eventer = window[eventMethod];
	var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
	
	const eventFuncs =  {audioActive:onAudioActive,silenceDetected:onSilence,audioResumed:onAudioResumed};
	// Listen to message from child window
	eventer(messageEvent,function(e) {
		var key = e.message ? "message" : "data";
		var data = e[key];

		const fn = eventFuncs [data.event];
		if (fn) {
			fn(data.detail);
		} else {
			console.log("on message",{data});
		}

	},false);
   })();

   function onSilence({silenceWasAt,audioDuration,silenceDuration,lastAudioSeenAt}) {
		if (checkGoogle.watchdog) {
			// we don't want to try to restart the google speech api unless we have seen some audio...
			clearTimeout(checkGoogle.watchdog);
			delete checkGoogle.watchdog;
			console.log("google Watchdog: waiting for audio (currently in silence)");
		}
   }

   function onAudioActive({audioResumedAt,audioDuration,previousSilenceDuration,silenceWasAt}) {
	
   }

   function onAudioResumed({audioResumedAt,previousSilenceDuration,silenceWasAt}) {

        if (previousSilenceDuration > 5 * 60 * 1000) {
            // assume google speech has died as it was more than 5 minutes of silence.
            console.log("google Watchdog: restarting engine - preceding silence was ", (previousSilenceDuration / (60*1000)).toFixed(1) , 'minutes' );
            document.querySelector('google-speech-spn').restart();
        }

        // in any case. recheck in 5 seconds if the recognition is generating messages...
		if (checkGoogle.watchdog) {
			console.log("google Watchdog: restarting timeout");
			clearTimeout(checkGoogle.watchdog);
		} else {
			console.log("google Watchdog: starting timeout");
		}
		// audio has begun after at least 5 seconds of silence - in 5 seconds see if there are any messages from google speech 
		checkGoogle.watchdog = setTimeout(checkGoogle,5000);	 

   }

   document.querySelector('#toggleLevels').addEventListener('click', function() {
		html.classList.toggle('levels');
   });
	
	document.querySelector('#mute_captions').addEventListener('click', function() {
		if (lastSpeechEventTimeout) {
			clearTimeout(lastSpeechEventTimeout);
			lastSpeechEventTimeout=undefined;
		}
		
		document.body.className = "muted";
		localStorage.setItem('captions','');
	   
	});

	document.querySelector('google-speech-spn').onclick = function() {
		document.body.className = "google-spn";
		localStorage.setItem('captions',document.querySelector('google-speech-spn').transcript);
	};

	document.querySelector('ppt-captions').onclick = function() {
		document.body.className = "powerpoint";
		localStorage.setItem('captions',document.querySelector('ppt-captions').transcript);
	};

	document.querySelector('#restartGoogle').onclick = function() {
		document.querySelector('google-speech-spn').restart();
	};  
	

	function load(elementId,cssKey,valueSuffix) {
		const storedValue = localStorage.getItem(cssKey);
		if (null===storedValue) return;
		document.documentElement.style.setProperty(cssKey,  valueSuffix ?  storedValue + valueSuffix : storedValue);
		document.getElementById(elementId).value = storedValue;
	}
}
function applyStyles() {
 
	save('fonts','--font-family');
	save('fontSize','--font-size', 'px');
	save('pageColor','--color-main-background');
	save('captionsColor','--captions-color');
	save('textColor','--text-color');
	save('captionsHeight','--captions-height','px');

	save('captionsLeft','--captions-left','px');
	save('captionsRight','--captions-right','px');
	save('captionsBottom','--captions-bottom','px');

	function save(elementId,cssKey,valueSuffix) {
		const editedValue =  document.getElementById(elementId).value;
		localStorage.setItem(cssKey,editedValue);
		document.documentElement.style.setProperty(cssKey, valueSuffix ? editedValue + valueSuffix : editedValue);
	}
	
}   