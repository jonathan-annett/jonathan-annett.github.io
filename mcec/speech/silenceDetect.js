
class SilenceDetector {
    constructor(threshold = 0.01, silenceDuration = 5000, renotifyTimeout = 500, getEnergyFunction=null,target) {
        this.eventTarget = (target !== window && target) || null;
        this.threshold = threshold;
        this.thresholdWeight = 256;
        this.silenceDuration = silenceDuration;
        this.silenceTimeout = null;
        this.isSilent = false;
        this.lastAudioNotified = Date.now();
        if (typeof getEnergyFunction==='function') {
            this.getEnergy = getEnergyFunction;
            this.monitor();
        } else {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.getEnergy = this._getEnergy;
            this.init();
        }
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

    _getEnergy () {
        this.analyser.getByteFrequencyData(this.dataArray);
        let sum = 0;
        for (let i = 0; i < this.dataArray.length; i++) {
            sum += this.dataArray[i];
        }
        return sum / this.dataArray.length;        
    }

    monitor() {
 
     

        if (this.getEnergy () < this.threshold * this.thresholdWeight ) {
            if (!this.isSilent) {
                if (this.silenceTimeout === null) {
                    const silenceWasAt = Date.now();
                    this.silenceTimeout = setTimeout(() => {
                        this.isSilent = true;
                        this.emitEvent('silenceDetected', silenceWasAt);
                    }, this.silenceDuration);
                }
            }
        } else {
            if (this.isSilent) {
                this.isSilent = false;
                this.lastAudioNotified = Date.now()
                this.emitEvent('audioResumed', this.lastAudioNotified);
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
        if (this.eventTarget) {
            this.eventTarget.dispatchEvent(event);
        }
    }

    setThreshold(value,weight) {
        this.threshold = value;
        this.thresholdWeight  = weight || 256;
    }

    setEnergyFunc(getEnergyFunction) {
        this.getEnergy = getEnergyFunction;
    }
}
