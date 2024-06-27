class AudioCapturePeer {
    constructor() {
        this.peer = new SimplePeer({ initiator: true, trickle: false });
        this.peer.on('signal', data => {
            document.getElementById('outgoingSignal').value = JSON.stringify(data);
        });
        this.peer.on('connect', () => {
            console.log('Connected');
            this.peer.send("hello");
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
        console.log("adding stream to peer");
        this.peer.addStream(stream);
    }

    connect() {
        const answerSignal = document.getElementById('answerSignal').value;
        this.peer.signal(JSON.parse(answerSignal));
    }
}