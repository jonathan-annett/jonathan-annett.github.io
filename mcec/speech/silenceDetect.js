
class SilenceDetector {
    constructor(threshold = 0.01, silenceDuration = 5000, renotifyTimeout = 500) {
        this.threshold = threshold;
        this.silenceDuration = silenceDuration;
        this.silenceTimeout = null;
        this.isSilent = false;
        this.lastAudioNotified = Date.now();
        this.renotifyTimeout = renotifyTimeout;
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.init();
    }

    async init() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioInput = this.audioContext.createMediaStreamSource(stream);
            this.analyser = this.audioContext.createAnalyser();
            this.analyser.fftSize = 256;
            this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
            this.audioInput.connect(this.analyser);
            this.monitor();
        } catch (error) {
            console.error('Error accessing audio input:', error);
        }
    }

    monitor() {
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        const average = sum / this.dataArray.length;

        if (average < this.threshold * 256) {
            if (!this.isSilent) {
                if (this.silenceTimeout === null) {
                    this.silenceTimeout = setTimeout(() => {
                        this.isSilent = true;
                        this.emitEvent('silenceDetected', Date.now());
                    }, this.silenceDuration);
                }
            }
        } else {
            if (this.isSilent) {
                this.isSilent = false;
                this.lastAudioNotified = Date.now()
                this.emitEvent('audioResumed', this.lastAudioNotified);
            } else {
                const timeNow = Date.now();
                if (timeNow-this.lastAudioNotified > this.renotifyTimeout) {
                    this.lastAudioNotified = timeNow;
                    this.emitEvent('audioActive', this.lastAudioNotified);
                }
            }
            if (this.silenceTimeout !== null) {
                clearTimeout(this.silenceTimeout);
                this.silenceTimeout = null;
            }
        }

        requestAnimationFrame(() => this.monitor());
    }

    emitEvent(eventType, timestamp) {
        const event = new CustomEvent(eventType, { detail: { timestamp } });
        window.dispatchEvent(event);
    }

    setThreshold(value) {
        this.threshold = value;
    }
}
