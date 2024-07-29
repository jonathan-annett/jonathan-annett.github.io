
class AudioMonitor {
    constructor(silenceDetector, eventTimeout = 5000) {
        this.silenceDetector = silenceDetector;
        this.eventTimeout = eventTimeout;
        this.lastSpeechEventTime = null;
        this.audioActive = false;
        
        // Listen for silence detection events
        window.addEventListener('silenceDetected', () => {
            this.audioActive = false;
        });

        window.addEventListener('audioResumed', () => {
            this.audioActive = true;
            this.checkForWarning();
        });

        window.addEventListener('audioActive', (event) => {
            this.checkForWarning();
        });

        // Listen for custom TTS events
        document.addEventListener('CustomSpeechEvent', (event) => {
            this.lastSpeechEventTime = Date.now();
            this.checkForWarning();
        });
    }

    checkForWarning() {
        if (this.audioActive && this.lastSpeechEventTime) {
            const currentTime = Date.now();
            if (currentTime - this.lastSpeechEventTime <= this.eventTimeout) {
                this.emitWarningEvent();
            }
        }
    }

    emitWarningEvent() {
        const warningEvent = new CustomEvent('WarningEvent', {
            detail: {
                message: 'Potential issue detected with the text-to-speech service.',
                timestamp: Date.now()
            }
        });
        document.dispatchEvent(warningEvent);
    }
}
