class SpeechProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (input.length > 0) {
            const inputChannel = input[0];
            const buffer = new Float32Array(inputChannel.length);
            buffer.set(inputChannel);

            // Send audio data to main thread
            this.port.postMessage(buffer);
        }

        return true;
    }
}

registerProcessor('speech-processor', SpeechProcessor);
