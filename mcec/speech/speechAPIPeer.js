class SpeechAPIPeer {
    constructor() {
        this.peer = new SimplePeer({ initiator: false, trickle: false });
        this.peer.on('signal', data => {
            document.getElementById('outgoingSignal').value = JSON.stringify(data);
        });
        this.peer.on('connect', () => {
            console.log('Connected');
        });
        this.peer.on('stream', stream => {
            this.startRecognition(stream);
        });
    }

    connect() {
        const incomingSignal = document.getElementById('incomingSignal').value;
        this.peer.signal(JSON.parse(incomingSignal));
    }

    startRecognition(stream) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = true;

        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(2048, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);
        
        processor.onaudioprocess = function(event) {
            const inputBuffer = event.inputBuffer.getChannelData(0);
            recognition.onaudiostart = () => recognition.start();
            recognition.onresult = event => {
                const transcript = event.results[0][0].transcript;
                document.getElementById('transcription').innerText = transcript;
                const customEvent = new CustomEvent('customSpeechEvent', { detail: transcript });
                document.dispatchEvent(customEvent);
            };
            recognition.onerror = event => console.error(event.error);
        };
    }
}