class SpeechProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.recognition = new (globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition)();
        this.recognition.lang = 'en-US';
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

            this.port.postMessage({
                finalTranscript: final_transcript,
                interimTranscript: interim_transcript
            });
        };

        this.recognition.start();
    }

    process(inputs, outputs, parameters) {
        // Audio processing logic, if needed.
        return true;
    }
}

registerProcessor('speech-processor', SpeechProcessor);
