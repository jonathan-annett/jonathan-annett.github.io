/*

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
                background-color: var(--color-main-background) !important;
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
                    this.transcript = final_transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                    this.interimTranscript = interim_transcript;
                }
            }

            full_transcript[full_transcript.length - 2] = final_transcript;
            full_transcript[full_transcript.length - 1] = interim_transcript;

            const customEvent = new CustomEvent('CustomSpeechEvent', {
                detail: {
                    provider: 'google-spn',
                    transcript: full_transcript.join('\n')
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
            full_transcript[full_transcript.length - 1] = final_transcript;
            full_transcript.push('');

            while (full_transcript.length > 2 && full_transcript[0] === '') {
                full_transcript.splice(0, 1);
            }

            recognition.lang = this.language || 'en-AU';
            recognition.start();
            ignore_onend = false;
            showInfo('info_allow');
            start_timestamp = event.timeStamp;
        };

		document.addEventListener('DOMContentLoaded',this.start);
    }
}

// Define the new element
customElements.define('google-speech-spn', GoogleSpeechAPI_SPN);


*/


function textSmoother (timeout,cb) {
    let samples= [];
    let to;

    addSample.stop = function( ) {
        if (to) {
            clearTimeout(to);
            samples.splice(0,samples.length);
            samples=undefined;
            to=undefined;
        }
    };
    return addSample;

    function getSmoothed() {

        const bestBefore  = Date.now() - timeout;        
        const smoothed = samples.filter(function(sample){
           return sample.when <= bestBefore;
        });

        if (smoothed.length>0) {
            samples = samples.filter(function(sample){
                return sample.when > bestBefore; 
            });
            return smoothed.pop().text;
        } 

    }

    function addSample(txt) {
        samples.push({text:txt,when : Date.now()});
        let smoothed = getSmoothed();
        if (smoothed) {
            cb(smoothed);
        }
        if (to) clearTimeout(to);
        to = setTimeout(function waitfor(){
            to = undefined;
            let smoothed = getSmoothed();
            if (smoothed) {
                cb(smoothed);
            } else {
                to = setTimeout (waitfor,timeout/4);
            }
        },timeout / 2);
    }

    
}

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
                background-color: var(--color-main-background) !important;
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

        const onTranscript = textSmoother (1500,function(transcript){
            const customEvent = new CustomEvent('CustomSpeechEvent', {
                detail: {
                    provider: 'google-spn',
                    transcript: transcript 
                }
            });
            document.dispatchEvent(customEvent);
        });

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
                    this.transcript = final_transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                    this.interimTranscript = interim_transcript;
                }
            }

            full_transcript[full_transcript.length - 2] = final_transcript;
            full_transcript[full_transcript.length - 1] = interim_transcript;

            onTranscript(full_transcript.join('\n'));
            /*
            const customEvent = new CustomEvent('CustomSpeechEvent', {
                detail: {
                    provider: 'google-spn',
                    transcript: full_transcript.join('\n')
                }
            });
            document.dispatchEvent(customEvent);*/
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
            }

            onTranscript.stop();
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
