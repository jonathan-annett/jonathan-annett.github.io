    /*
    									 
     global SimplePeer,webkitSpeechRecognition
    					 
    */
    
     class GoogleSpeechAPI_SPN {
    	constructor() {
    		 
    	}
    
    	async init() {
    		const devices = await navigator.mediaDevices.enumerateDevices();
    		const audioSelect = document.getElementById('audioSource');
    		devices.forEach(device => {
    			if (device.kind === 'audioinput') {
    				const option = document.createElement('option');
    				option.value = device.deviceId;
    				option.text = device.label || `Microphone ${audioSelect.length + 1}`;
    				audioSelect.appendChild(option);
    			}
    		});
    		document.getElementById('start').addEventListener('click', () => this.start());
    		document.getElementById('connect').addEventListener('click', () => this.connect());

            
    			var recognition = new webkitSpeechRecognition();
                this.recognition= recognition;

    			var recognizing = false;
                var ignore_onend = false;
    			var final_transcript = '';
    			
    			var start_timestamp ;
    
    			recognition.continuous = true;
    			recognition.interimResults = true;

                function showInfo(x) {
            		console.log(x);
            	}
    
    		
    			recognition.onstart = function() {
    			  recognizing = true;
    			  showInfo('info_speak_now');
    			};
    		  
    			recognition.onerror = function(event) {
    			  if (event.error == 'no-speech') {
    				showInfo('info_no_speech');
    				ignore_onend = true;
    			  }
    			  if (event.error == 'audio-capture') {
    				showInfo('info_no_microphone');
    				ignore_onend = true;
    			  }
    			  if (event.error == 'not-allowed') {
    				if (event.timeStamp - start_timestamp < 100) {
    				  showInfo('info_blocked');
    				} else {
    				  showInfo('info_denied');
    				}
    				ignore_onend = true;
    			  }
    			};
    		  
    			recognition.onend = function() {
    			  recognizing = false;
    			  if (ignore_onend) {
    				return;
    			  }
    			  if (!final_transcript) {
    				showInfo('info_start');
    				return;
    			  }
    			 
    			};
    		  
    			recognition.onresult = function(event) {
    			  var interim_transcript = '';
    			  if (typeof(event.results) == 'undefined') {
    				recognition.onend = null;
    				recognition.stop();
    		 		return;
    			  } 
    			  for (var i = event.resultIndex; i < event.results.length; ++i) {
    				if (event.results[i].isFinal) {
    				  final_transcript += event.results[i][0].transcript;
    				} else {
    				  interim_transcript += event.results[i][0].transcript;
    				}
    			  }
    			   console.log({interim_transcript,final_transcript});

                  const customEvent = new CustomEvent('GoogleSpeechEvent', { detail: {interim_transcript,final_transcript} });
                  document.dispatchEvent(customEvent);
    
    			  
    			};

                this.start = function () {
						
					if (recognizing) {
						recognition.stop();
						return;
                  	}
					final_transcript = '';
					recognition.lang = "10";//select_dialect.value;
					recognition.start();
					ignore_onend = false;
					showInfo('info_allow');
					start_timestamp = event.timeStamp;
    		  }

    	}

    
    	connect() {
    		const answerSignal = document.getElementById('answerSignal').value;
    		this.peer.signal(JSON.parse(answerSignal));
    	}
    
    
    }
