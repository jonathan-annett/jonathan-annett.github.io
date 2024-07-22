class PPTCaptions extends HTMLElement {
    constructor() {
        super();

        // Attach a shadow DOM tree to the instance
        this.attachShadow({ mode: 'open' });

        // Create elements and attach them to the shadow DOM
        const wrapper = document.createElement('div');
        wrapper.setAttribute('class', 'wrapper');
        this.shadowRoot.appendChild(wrapper);

        // Add some basic styles
        const style = document.createElement('style');
        style.textContent = `
            .wrapper {
                
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse;
                justify-content: flex-start;
                padding: 10px;
                height : var(--captions-height) !important;
                background-color: var(--captions-color) !important;
                color: var(--text-color) !important;
                font-family: var(--font-family) !important;
                font-size: var(--font-size) !important;

            }
        `;
        this.shadowRoot.appendChild(style);
    }

    connectedCallback() {
        this.init();
        this.render();
    }

    // Getter and Setter for language
    get language() {
        return this.getAttribute('language');
    }

    set language(value) {
        this.setAttribute('language', value);
    }

    // Getter and Setter for transcript
    get transcript() {
        return this.getAttribute('transcript');
    }

    set transcript(value) {
        this.setAttribute('transcript', value);
    }

   

    // Observed attributes
    static get observedAttributes() {
        return ['transcript'];
    }

    // Callback when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
           
            const customEvent = new CustomEvent('CustomSpeechEvent', {
                detail: {
                    provider: 'powerpoint',
                    transcript: this.transcript
                }
            });
            document.dispatchEvent(customEvent);
            this.render();
        }
    }

    // Rendering logic
    render() {
        this.shadowRoot.querySelector('.wrapper').textContent = this.transcript;
    }

    init() {
        const self = this;
       initatePPTLink(function(what,data){
           if (what==='data') {
                if (data.caption.indexOf('[Starting Subtitles]')<0) {
                    self.setAttribute('transcript', data.captions  );

                } else {
                    self.setAttribute('transcript', '' );
                }
           }
       })
    }
}

// Define the new element
customElements.define('ppt-captions', PPTCaptions);
