class SpeechProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.recognition = new (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition)();
        this.recognition.lang = 'en-US';
        this.recognition.continuous = true;

        this.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0])
                .map(result => result.transcript)
                .join('');
            this.port.postMessage(transcript);
        };

        this.recognition.onerror = (event) => {
            console.error(event.error);
        };

        this.recognition.start();
    }

    process(inputs, outputs, parameters) {
        // Audio processing is done automatically by the Speech API,
        // so we don't need to process audio samples here.
        return true;
    }
}

registerProcessor('speech-processor', SpeechProcessor);
