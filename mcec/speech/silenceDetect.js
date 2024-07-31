//jshint esnext : false
//jshint esversion : 8
//jshint undef : true

class SilenceDetector {
	constructor(threshold = 0.01, silenceDuration = 5000, renotifyTimeout = 500, getEnergyFunction=null,target=null) {
		this.eventTarget = (target !== window && target) || null;
		this.threshold = threshold;
		this.thresholdWeight = 256;
		this.silenceDuration = silenceDuration;
		this.silenceTimeout = null;
		this.isSilent = false;
		this.renotifyTimeout = renotifyTimeout;
		this.lastAudioNotified = Date.now();
		if (typeof getEnergyFunction==='function') {
			this.getEnergy = getEnergyFunction;
			this.monitor();
		} else {
		    const AC = window.AudioContext || window.webkitAudioContext;
			this.audioContext = new AC();
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

	monitor(inTimeout) {
 
	    if (!inTimeout)clearTimeout(this.repeatTimeout);

		if (this.getEnergy () < this.threshold * this.thresholdWeight ) {
			// useful audio is not present

            if (!this.lastAudioSeenAt){
                this.lastAudioSeenAt = Date.now();
            }


			if (!this.isSilent) {
				if (this.silenceTimeout === null) {
					const silenceWasAt =  Date.now() ;
					this.silenceTimeout = setTimeout(() => {
						const silenceDuration = Date.now() - this.lastAudioSeenAt;
						const audioDuration = this.lastAudioSeenAt && this.audioResumedAt ?  this.lastAudioSeenAt - this.audioResumedAt : null;
						this.isSilent = true;
						this.silenceWasAt = silenceWasAt;
						this.emitEvent('silenceDetected', {silenceWasAt,audioDuration,silenceDuration,lastAudioSeenAt:this.lastAudioSeenAt});
					}, this.silenceDuration);
				}
			}
		} else {
			// useful audio is present
			this.lastAudioSeenAt = Date.now();
            if (!this.audioResumedAt){
                this.audioResumedAt = this.lastAudioSeenAt;
            }

			if (this.isSilent) {
				// audio just resumed after a period of silence
				this.isSilent = false;
				this.lastAudioNotified = this.lastAudioSeenAt;
				this.audioResumedAt = this.lastAudioNotified;
				this    .previousSilenceDuration = this.silenceWasAt ?  this.audioResumedAt - this.silenceWasAt : null;
				this.emitEvent('audioResumed', {audioResumedAt:this.audioResumedAt,previousSilenceDuration:this.previousSilenceDuration,silenceWasAt:this.silenceWasAt});
			}
			if (this.silenceTimeout !== null) {
				clearTimeout(this.silenceTimeout);
				this.silenceTimeout = null;
			} else {
				if ( (this.lastAudioSeenAt - this.lastAudioNotified) > this.renotifyTimeout ) {
					this.lastAudioNotified = this.lastAudioSeenAt;
					const audioDuration = this.audioResumedAt ? this.lastAudioSeenAt - this.audioResumedAt : null;
					this.emitEvent('audioActive', {audioResumedAt:this.audioResumedAt,audioDuration,previousSilenceDuration:this.previousSilenceDuration,silenceWasAt:this.silenceWasAt});
				}
			}
		}

		requestAnimationFrame(() => this.monitor());
        this.repeatTimeout = setTimeout(() => this.monitor(true),0);
	}

	emitEvent(eventType, detail) {	   
		const event = new CustomEvent(eventType, { detail: detail });  
		window.dispatchEvent(event);
		if (this.eventTarget && this.eventTarget.postMessage) {
			this.eventTarget.postMessage({ event:eventType, detail },"*");
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
