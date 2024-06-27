class AudioCapturePeer {
    constructor() {
        this.peer = new SimplePeer({ initiator: true, trickle: false });
        this.peer.on('signal', data => {
            document.getElementById('outgoingSignal').value = JSON.stringify(data);
        });
        this.peer.on('connect', () => {
            console.log('Connected');
            this.peer.send("hello");
            this.connected = true;
        });
        this.peer.on('data', (e) => {
            console.log('data',e);
        });
    }

    async init() {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioSelect = document.getElementById('audioSource');
        devices.forEach(device => {
            if (device.kind === 'audioinput') {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.text = device.label || `Microphone ${audioSelect.length + 1}`;
                audioSelect.appendChild(option);
            }
        });
        document.getElementById('start').addEventListener('click', () => this.start());
        document.getElementById('connect').addEventListener('click', () => this.connect());
    }

    async start() {
        const audioSelect = document.getElementById('audioSource');
        const constraints = {
            audio: { deviceId: audioSelect.value ? { exact: audioSelect.value } : undefined }
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (this.connected) {
          console.log("adding stream to peer");
          //this.peer.addStream(stream);            
          stream.getTracks().forEach(track => this.peer.addTrack(track, stream));
        } else {
            console.log("starting local recognition");
            await this.setupAudioWorklet(stream);
        }
    }

    connect() {
        const answerSignal = document.getElementById('answerSignal').value;
        this.peer.signal(JSON.parse(answerSignal));
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