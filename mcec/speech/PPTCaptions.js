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
                font-family: consolas;
                background-color: black;
                color: white;
                font-size: 38pt;
                height: 233px;
                overflow: hidden;
                display: flex;
                flex-direction: column-reverse;
                justify-content: flex-start;
                padding: 10px;
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

    // Getter and Setter for interimTranscript
    get interimTranscript() {
        return this.getAttribute('interim-transcript');
    }

    set interimTranscript(value) {
        this.setAttribute('interim-transcript', value);
    }

    // Observed attributes
    static get observedAttributes() {
        return ['transcript', 'interim-transcript'];
    }

    // Callback when observed attributes change
    attributeChangedCallback(name, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.render();
        }
    }

    // Rendering logic
    render() {
        this.shadowRoot.querySelector('.wrapper').textContent = `${this.transcript} ${this.interimTranscript}`;
    }

    init() {
       initatePPTLink(function(what,data){
           if (what==='data') {
               this.setAttribute('interim-transcript', data.captions);
           }
       })
    }
}

// Define the new element
customElements.define('ppt-captions', PPTCaptions);
