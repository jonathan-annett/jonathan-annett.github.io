class GoogleSpeechAPI_AW extends HTMLElement {
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
                height: 233px;
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse;
                justify-content: flex-start;
                padding: 10px;

                background-color: var(--page-color) !important;
                color: var(--text-color) !important;
                font-family: var(--font-family) !important;
                font-size: var(--font-size) !important;
            }
        `;
        this.shadowRoot.appendChild(style);

        // Initialize variables
        this.audioContext = null;
        this.speechNode = null;
        this.mediaStream = null;
        this.recognition = null;
        this.audioChunks = [];
    }

    connectedCallback() {
        this.init();
    }

    async init() {
        const audioSelect = document.getElementById('audioSource');
        if (audioSelect) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const previouslySelected = localStorage.getItem("speech-audio-device");
            devices.forEach(device => {
                if (device.kind === 'audioinput') {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.text = device.label || `Audio Input Device # ${audioSelect.length + 1}`;
                    if (previouslySelected === option.value) {
                        // Pre-select the last selected device on page load
                        option.selected = true;
                    }
                    audioSelect.appendChild(option);
                }
            });
            audioSelect.onchange = async () => {
                // Save selection for next page load
                localStorage.setItem("speech-audio-device", audioSelect.value);
                await this.startUsingAudioDevice(audioSelect.value);
            };

            await this.startUsingAudioDevice(audioSelect.value);
        } else {
            // Use default device if no audioSelect is provided
            await this.startUsingAudioDevice();
        }
    }

    async startUsingAudioDevice(deviceId) {
        // Stop existing transcription if any
        if (this.recognition) {
            this.recognition.stop();
            this.recognition = null;
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.audioContext = new AudioContext();
        await this.audioContext.audioWorklet.addModule('speechProcessor.js');
        this.speechNode = new AudioWorkletNode(this.audioContext, 'speech-processor');

        // Handle messages from the Audio Worklet
        this.speechNode.port.onmessage = (event) => {
            this.handleAudioData(event.data);
        };

        const constraints = deviceId ? { audio: { deviceId: { exact: deviceId } } } : { audio: true };

        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.speechNode);
        this.speechNode.connect(this.audioContext.destination);

        // Initialize speech recognition
        this.initSpeechRecognition();
    }

    handleAudioData(audioBuffer) {
        // Convert the Float32Array to a Blob
        const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });

        // Check if the recognition is active, if not start it
        if (!this.recognition) {
            this.initSpeechRecognition();
        }

        // Process the audioBlob with the SpeechRecognition API if needed
        this.recognition.onaudioprocess(audioBlob);
    }

    initSpeechRecognition() {
        this.recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        this.recognition.lang = this.language || 'en-US';
        this.recognition.continuous = true;
        this.recognition.interimResults = true;

        this.recognition.onresult = (event) => {
            let final_transcript = '';
            let interim_transcript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    final_transcript += event.results[i][0].transcript;
                } else {
                    interim_transcript += event.results[i][0].transcript;
                }
            }

            this.transcript = final_transcript;
            this.interimTranscript = interim_transcript;
            this.render();
        };

        this.recognition.onerror = (event) => {
            console.error('Speech recognition error', event);
        };

        this.recognition.onend = () => {
            console.log('Speech recognition ended');
            // Restart recognition if needed
            this.recognition.start();
        };

        this.recognition.start();
    }

    render() {
        this.shadowRoot.querySelector('.wrapper').textContent = `${this.transcript || ''} ${this.interimTranscript || ''}`;
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

    static get observedAttributes() {
        return ['transcript', 'interim-transcript'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }
}

customElements.define('google-speech-audioworklet', GoogleSpeechAPI_AW);
