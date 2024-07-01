 
document.addEventListener('CustomSpeechEvent',function(e){  
    if (e.detail.provider === document.body.className) {
        localStorage.setItem('captions',e.detail.transcript || "")
    }  
});

 


document.addEventListener( "DOMContentLoaded",readStyles);


function readStyles() {
    load('fonts','--font-family');
    load('fontSize','--font-size', 'px');
    load('pageColor','--color-main-background');
    load('textColor','--text-color');
    load('captionsHeight','--captions-height','px');

    document.querySelector('google-speech-spn').onclick = function() {
        document.body.className = "google-spn";
    };

    document.querySelector('ppt-captions').onclick = function() {
        document.body.className = "powerpoint";
    }

    function load(elementId,cssKey,valueSuffix) {
        const storedValue = localStorage.getItem(cssKey);
        if (!storedValue) return;
        document.documentElement.style.setProperty(cssKey,  valueSuffix ?  storedValue + valueSuffix : storedValue);
        document.getElementById(elementId).value = storedValue;
    }
}
function applyStyles() {
 
    save('fonts','--font-family');
    save('fontSize','--font-size', 'px');
    save('pageColor','--color-main-background');
    save('textColor','--text-color');
    save('captionsHeight','--captions-height','px');

    function save(elementId,cssKey,valueSuffix) {
        const editedValue =  document.getElementById(elementId).value;
        localStorage.setItem(cssKey,editedValue);
        document.documentElement.style.setProperty(cssKey, valueSuffix ? editedValue + valueSuffix : editedValue);
    }
    
}   