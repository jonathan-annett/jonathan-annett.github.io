/*
document.addEventListener('GoogleSpeechEvent',function(e){  
    document.getElementById('Google_transcription').textContent = e.detail.interim_transcript;
});


document.addEventListener('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});
*/


document.addEventListener( "DOMContentLoaded",readStyles);


function readStyles() {
    load('fonts','--font-family');
    load('fontSize','--font-size', 'px');
    load('pageColor','--color-main-background');
    load('textColor','--text-color');
    load('captionsHeight','---captions-height','px');

    function load(elId,name,suffix) {
        const value = localStorage.getItem(name);
        if (!value) return;
        document.documentElement.style.setProperty(name, value);
        document.getElementById(elId).value = suffix ?  value + suffix : value;
    }
}
function applyStyles() {
 
    save('fonts','--font-family');
    save('fontSize','--font-size', 'px');
    save('pageColor','--color-main-background');
    save('textColor','--text-color');
    save('captionsHeight','---captions-height','px');

    function save(name,value,suffix) {
        const value =  document.getElementById(name).value;
        localStorage.setItem(name,value);
        document.documentElement.style.setProperty(name, suffix ? value + suffix : value);
    }
    
}