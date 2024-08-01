 

 
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
                
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse;
                justify-content: flex-start;
                padding: 10px;
                height : var(--captions-height) !important;
                background-color: var(--captions-color) !important;
                color: var(--text-color) !important;
                font-family: var(--font-family) !important;
                font-size: var(--font-size) !important;
            }
        `;  
        this.shadowRoot.appendChild(style);
    }

    connectedCallback() {
        this.init();
        this.render();
    }

    // Getter and Setter for language
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
        return ['transcript', 'interim-transcript'];
    }

    // Callback when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    // Rendering logic
    render() {
        this.shadowRoot.querySelector('.wrapper').textContent = `${this.transcript} ${this.interimTranscript}`;
    }

    init() {
        const recognition = new webkitSpeechRecognition();
        this.recognition = recognition;

        let recognizing = false;
        let ignore_onend = false;
        let final_transcript = '';
        const full_transcript = [final_transcript, ''];

        let start_timestamp;

        recognition.continuous = true;
        recognition.interimResults = true;

        const showInfo = (x) => {
            this.shadowRoot.querySelector('.wrapper').className = `wrapper ${x}`;
        };

        recognition.onstart = () => {
            recognizing = true;
            showInfo('info_speak_now');
        };

        recognition.onerror = (event) => {
            if (event.error === 'no-speech') {
                showInfo('info_no_speech');
                ignore_onend = true;
            }
            if (event.error === 'audio-capture') {
                showInfo('info_no_microphone');
                ignore_onend = true;
            }
            if (event.error === 'not-allowed') {
                if (event.timeStamp - start_timestamp < 100) {
                    showInfo('info_blocked');
                } else {
                    showInfo('info_denied');
                }
                ignore_onend = true;
            }
        };

        recognition.onend = () => {
            recognizing = false;
            if (ignore_onend) {
                return;
            }
            if (!final_transcript) {
                showInfo('info_start');
                return;
            }
            this.restart();
        };

       

        recognition.onresult = (event) => {
            let interim_transcript = '';

            if (typeof event.results === 'undefined') {
                recognition.onend = null;
                recognition.stop();
                return;
            }

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                    this.interimTranscript = interim_transcript;
                }
            }

            full_transcript[full_transcript.length - 2] = final_transcript;
            full_transcript[full_transcript.length - 1] = interim_transcript;

          
            this.transcript = full_transcript.join('\n').substr(-1024)
            const customEvent = new CustomEvent('CustomSpeechEvent', {
                detail: {
                    provider: 'google-spn',
                    transcript:  this.transcript
                }
            });
            document.dispatchEvent(customEvent);
        };

        this.start = (event) => {
            if (recognizing) {
                recognition.stop();
                return;
            }
            final_transcript = '';
            full_transcript.splice(0,full_transcript.length);
            full_transcript.push( final_transcript) ;
            full_transcript.push('');

            this.interimTranscript = '';
            
            this.render();

            recognition.lang = this.language || 'en-AU';
            recognition.start();
            ignore_onend = false;
            showInfo('info_allow');
            start_timestamp = event.timeStamp;
        };

        this.stop = () => {
            if (recognizing) {
                recognition.stop();
                recognizing = false;
                showInfo('info_start');
            } else {
                final_transcript = '';
                full_transcript.splice(0,full_transcript.length);
                full_transcript.push( final_transcript) ;
                full_transcript.push('');
                this.interimTranscript = '';
                 this.render();
            }

          
        };

        this.restart = () => {
            this.stop();
            
            setTimeout(this.start, 500,new Event('restart'));
        };

        document.addEventListener('DOMContentLoaded', this.start);
    }
}

// Define the new element
customElements.define('google-speech-spn', GoogleSpeechAPI_SPN);
