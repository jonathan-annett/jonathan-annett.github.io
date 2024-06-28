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
                font-family: consolas;
                background-color: black;
                color: white;
                font-size: 38pt;
                height: 233px;
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse;
                justify-content: flex-start;
                padding: 10px;
            }
        `;
        this.shadowRoot.appendChild(style);

        // Initialize variables
        this.audioContext = null;
        this.speechNode = null;
        this.mediaStream = null;
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

        this.speechNode.port.onmessage = (event) => {
            const { finalTranscript, interimTranscript } = event.data;
            this.transcript = finalTranscript;
            this.interimTranscript = interimTranscript;
            this.render();
        };

        const constraints = deviceId ? { audio: { deviceId: { exact: deviceId } } } : { audio: true };

        this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        source.connect(this.speechNode);
        this.speechNode.connect(this.audioContext.destination);
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
