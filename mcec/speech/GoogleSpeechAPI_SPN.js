 

	 class GoogleSpeechAPI_SPN extends HTMLElement {
		constructor() {
			super();
	
			// Attach a shadow DOM tree to the instance
			this.attachShadow({ mode: 'open' });
	
			// Create elements and attach them to the shadow DOM
			const wrapper = document.createElement('div');
			wrapper.setAttribute('class', 'wrapper');
			this.shadowRoot.appendChild(wrapper);
	
			// Add some basic styles
			const style = document.createElement('style');
			style.textContent = `
				.wrapper {
					border: 1px solid #ccc;
					padding: 10px;
					margin: 10px;
					background-color: #f9f9f9;
				}
			`;
			this.shadowRoot.appendChild(style);


		}

		connectedCallback() {
			this.init();
			this.render();
		}
	
	
		// Getter and Setter for attrib1
		get language() {
			return this.getAttribute('language');
		}
	
		set language(value) {
			this.setAttribute('language', value);
		}
	
		// Getter and Setter for transcript
		get transcript() {
			return this.getAttribute('transcript');
		}
	
		set transcript(value) {
			this.setAttribute('transcript', value);
		}

		// Getter and Setter for interimTranscript
		get interimTranscript() {
			return this.getAttribute('interim-transcript');
		}
	
		set interimTranscript(value) {
			this.setAttribute('interim-transcript', value);
		}
	
		// Observed attributes
		static get observedAttributes() {
			return ['transcript','interim-transcript'];
		}
	
		// Callback when observed attributes change
		attributeChangedCallback(name, oldValue, newValue) {
			if (oldValue !== newValue) {
				this.render();
			}
		}
	
		// Initial rendering
		connectedCallback() {
			this.render();
		}
	
		// Rendering logic
		render() {
			this.shadowRoot.querySelector('.wrapper').textContent = `${this.transcript} ${this.interimTranscript}`;
		}

		init () {
			var recognition = new webkitSpeechRecognition();
			this.recognition= recognition;

			var recognizing = false;
			var ignore_onend = false;
			var final_transcript = '';
			var full_transcript = [
				final_transcript,''
			];

			 
			var start_timestamp ;

			recognition.continuous = true;
			recognition.interimResults = true;

			function showInfo(x) {
				this.shadowRoot.querySelector('.wrapper').className = "wrapper "+x;
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
				  this.transcript  = final_transcript;
				} else {
				  interim_transcript += event.results[i][0].transcript;
				  this.interimTranscript  = interim_transcript; 
				}
			  }

			  full_transcript[full_transcript.length-2] = final_transcript;
			  full_transcript[full_transcript.length-1] = interim_transcript;
			  
			  const customEvent = new CustomEvent('CustomSpeechEvent', { detail: {
					provider : "google-spn",
					transcript : full_transcript.join("\n")} 
				});
			  document.dispatchEvent(customEvent);    
			  
			};

			this.start = function () {
					
				if (recognizing) {
					recognition.stop();
					return;
				  }
				final_transcript = '';
				full_transcript [ full_transcript.length-1]=final_transcript;
				full_transcript.push('');

				while (full_transcript.length > 2 && full_transcript[0]==='') {
					full_transcript.splice(0,1);
				}

				recognition.lang = "10";//select_dialect.value;
				recognition.start();
				ignore_onend = false;
				showInfo('info_allow');
				start_timestamp = event.timeStamp;
		  }

		}
	}
	
	// Define the new element
	customElements.define('google-speech-spn', GoogleSpeechAPI_SPN);
	
     