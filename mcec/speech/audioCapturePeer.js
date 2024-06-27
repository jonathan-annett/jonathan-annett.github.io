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
          this.peer.addStream(stream);            
        } else {
            console.log("starting local recognition");
            startRecognition(stream);
        }
    }

    connect() {
        const answerSignal = document.getElementById('answerSignal').value;
        this.peer.signal(JSON.parse(answerSignal));
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