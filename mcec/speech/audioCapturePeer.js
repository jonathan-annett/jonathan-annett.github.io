    /*
    									 
     global SimplePeer,webkitSpeechRecognition
    					 
    */
    
     class AudioCapturePeer {
    	constructor() {
    		this.peer = new SimplePeer({ initiator: true, trickle: false });
    		this.peer.on('signal', data => {
    			document.getElementById('outgoingSignal').value = JSON.stringify(data);
                document.getElementById('btnCopyGoogleSignal').onclick= function(){
                    navigator.clipboard.writeText(JSON.stringify(data)).then(function(){
                        alert("google connect data is on clipboard");

                        document.getElementById('btnPasteGoogleSignal').onclick = function(){
                            navigator.clipboard.readText().then(function(text){
                                try {
                                    peer.signal(JSON.parse(text));
                                } catch (e) {
                                    
                                }
                            })
                           
                        };
                        document.getElementById('btnCopyGoogleSignal').disabled = true;
                        document.getElementById('btnPasteGoogleSignal').disabled = false;
                    });

                };

                document.getElementById('btnCopyGoogleSignal').disabled = false;

    		});
    		this.peer.on('connect', () => {
    			console.log('Connected');
    			this.peer.send("hello");
    			this.connected = true;
    		});
    		this.peer.on('data', (e) => {
    			console.log('data',e);
    		});
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
    			  //start_img.src = '/intl/en/chrome/assets/common/images/content/mic-animate.gif';
    			};
    		  
    			recognition.onerror = function(event) {
    			  if (event.error == 'no-speech') {
    				//start_img.src = '/intl/en/chrome/assets/common/images/content/mic.gif';
    				showInfo('info_no_speech');
    				ignore_onend = true;
    			  }
    			  if (event.error == 'audio-capture') {
    			   // start_img.src = '/intl/en/chrome/assets/common/images/content/mic.gif';
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
    			  //start_img.src = '/intl/en/chrome/assets/common/images/content/mic.gif';
    			  if (!final_transcript) {
    				showInfo('info_start');
    				return;
    			  }
    			  showInfo('');
    			  if (window.getSelection) {
    				window.getSelection().removeAllRanges();
    				var range = document.createRange();
    				range.selectNode(document.getElementById('final_span'));
    				window.getSelection().addRange(range);
    			  }
    			 
    			};
    		  
    			recognition.onresult = function(event) {
    			  var interim_transcript = '';
    			  if (typeof(event.results) == 'undefined') {
    				recognition.onend = null;
    				recognition.stop();
    			//	upgrade();
    				return;
    			  }//
    			  for (var i = event.resultIndex; i < event.results.length; ++i) {
    				if (event.results[i].isFinal) {
    				  final_transcript += event.results[i][0].transcript;
    				} else {
    				  interim_transcript += event.results[i][0].transcript;
    				}
    			  }
    			  //final_transcript = capitalize(final_transcript);
    			  console.log({interim_transcript,final_transcript});

                  const customEvent = new CustomEvent('GoogleSpeechEvent', { detail: {interim_transcript,final_transcript} });
                  document.dispatchEvent(customEvent);
    
    			  //final_span.innerHTML = linebreak(final_transcript);
    			 // interim_span.innerHTML = linebreak(interim_transcript);
    			  if (final_transcript || interim_transcript) {
    			//	showButtons('inline-block');
    			  }
    			};

                this.restart = function () {
                    
                if (recognizing) {
                    recognition.stop();
                    return;
                  }
                  final_transcript = '';
                  recognition.lang = "10";//select_dialect.value;
                  recognition.start();
                  ignore_onend = false;
                 // final_span.innerHTML = '';
                 // interim_span.innerHTML = '';
                  //start_img.src = '/intl/en/chrome/assets/common/images/content/mic-slash.gif';
                  showInfo('info_allow');
                  //showButtons('none');
                  start_timestamp = event.timeStamp;
    		  }

             

    	}



    
    	async start() {
              

    		if (this.connected) {
    		    const audioSelect = document.getElementById('audioSource');
				const constraints = {
					audio: { deviceId: audioSelect.value ? { exact: audioSelect.value } : undefined }
				};
				const stream = await navigator.mediaDevices.getUserMedia(constraints);
				
		
			  
    		  console.log("adding stream to peer");
    		  //this.peer.addStream(stream);			
    		  stream.getTracks().forEach(track => this.peer.addTrack(track, stream));
    		} else {
    			console.log("starting local recognition");
    		//	await this.setupAudioWorklet(stream);

                this.restart();
    
    		}
        }
    
    	connect() {
    		const answerSignal = document.getElementById('answerSignal').value;
    		this.peer.signal(JSON.parse(answerSignal));
    	}
    
    
    }
