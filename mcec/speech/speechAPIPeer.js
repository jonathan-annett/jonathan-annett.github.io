class SpeechAPIPeer {
    constructor() {
        this.peer = new SimplePeer({ initiator: false, trickle: false });
        this.peer.on('signal', data => {
            document.getElementById('outgoingSignal').value = JSON.stringify(data);
        });
        this.peer.on('connect', () => {
            console.log('Connected');
        });
        this.peer.on('track', async (track, stream) => {
            if (track.kind === 'audio') {
                await this.setupAudioWorklet(stream);
            }
        });
    }

    connect() {
        const incomingSignal = document.getElementById('incomingSignal').value;
        this.peer.signal(JSON.parse(incomingSignal));
    }

    async setupAudioWorklet(stream) {
        const audioContext = new AudioContext();
        await audioContext.audioWorklet.addModule('speechProcessor.js');
        const speechNode = new AudioWorkletNode(audioContext, 'speech-processor');

        speechNode.port.onmessage = (event) => {
            const transcript = event.data;
            document.getElementById('transcription').innerText = transcript;
            const customEvent = new CustomEvent('customSpeechEvent', { detail: transcript });
            document.dispatchEvent(customEvent);
        };

        const source = audioContext.createMediaStreamSource(stream);
        source.connect(speechNode);
        speechNode.connect(audioContext.destination);
    }
}