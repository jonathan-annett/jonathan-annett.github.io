
let lastSpeechEventTimeout;
const failoverMsec = 5000;


document.addEventListener('CustomSpeechEvent',function(e){  
     // give priority to powerpoint if it is active 
     
     
    if  (!!lastSpeechEventTimeout && e.detail.provider === "powerpoint") {
        if (document.querySelector('#preferPowerpoint').checked && document.body.className !== 'muted') {
            document.body.className = e.detail.provider; 
        }
    }

    if (e.detail.provider === document.body.className ) {

        if (lastSpeechEventTimeout) {
            clearTimeout(lastSpeechEventTimeout);
            lastSpeechEventTimeout = undefined;
        }
        localStorage.setItem('captions',e.detail.transcript || "");

    }  else {
        if (!lastSpeechEventTimeout && document.body.className !== 'muted' ) {
            lastSpeechEventTimeout = setTimeout(
                function() {
                    document.body.className = e.detail.provider;
                    localStorage.setItem('captions',e.detail.transcript || "");
                },
                failoverMsec
            );
        }
    }


});


document.addEventListener( "DOMContentLoaded",readStyles);


function readStyles() {
    load('fonts','--font-family');
    load('fontSize','--font-size', 'px');
    load('pageColor','--color-main-background');
    load('captionsColor','--captions-color');
    load('textColor','--text-color');
    load('captionsHeight','--captions-height','px');

    load('captionsLeft','--captions-left','px');
    load('captionsRight','--captions-right','px');
    load('captionsBottom','--captions-bottom','px');


   (function () {
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
    var eventer = window[eventMethod];
    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";
    
    // Listen to message from child window
    eventer(messageEvent,function(e) {
        var key = e.message ? "message" : "data";
        var data = e[key];
        //run function//
    },false);
   })()

    
    document.querySelector('#mute_captions').addEventListener('click', function() {
        if (lastSpeechEventTimeout) {
            clearTimeout(lastSpeechEventTimeout);
            lastSpeechEventTimeout=undefined;
        }
        
        document.body.className = "muted";
        localStorage.setItem('captions','');
       
    });

    document.querySelector('google-speech-spn').onclick = function() {
        document.body.className = "google-spn";
        localStorage.setItem('captions',document.querySelector('google-speech-spn').transcript);
    };

    document.querySelector('ppt-captions').onclick = function() {
        document.body.className = "powerpoint";
        localStorage.setItem('captions',document.querySelector('ppt-captions').transcript);
    };

    document.querySelector('#restartGoogle').onclick = function() {
        document.querySelector('google-speech-spn').restart();
    };  
    

    function load(elementId,cssKey,valueSuffix) {
        const storedValue = localStorage.getItem(cssKey);
        if (null===storedValue) return;
        document.documentElement.style.setProperty(cssKey,  valueSuffix ?  storedValue + valueSuffix : storedValue);
        document.getElementById(elementId).value = storedValue;
    }
}
function applyStyles() {
 
    save('fonts','--font-family');
    save('fontSize','--font-size', 'px');
    save('pageColor','--color-main-background');
    save('captionsColor','--captions-color');
    save('textColor','--text-color');
    save('captionsHeight','--captions-height','px');

    save('captionsLeft','--captions-left','px');
    save('captionsRight','--captions-right','px');
    save('captionsBottom','--captions-bottom','px');

    function save(elementId,cssKey,valueSuffix) {
        const editedValue =  document.getElementById(elementId).value;
        localStorage.setItem(cssKey,editedValue);
        document.documentElement.style.setProperty(cssKey, valueSuffix ? editedValue + valueSuffix : editedValue);
    }
    
}   