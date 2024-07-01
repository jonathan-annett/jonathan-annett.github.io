/*
document.addEventListener('GoogleSpeechEvent',function(e){  
    document.getElementById('Google_transcription').textContent = e.detail.interim_transcript;
});


document.addEventListener('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});
*/

function applyStyles() {
    const font = document.getElementById('fonts').value;
    const fontSize = document.getElementById('fontSize').value + 'px';
    const pageColor = document.getElementById('pageColor').value;
    const textColor = document.getElementById('textColor').value;

    document.documentElement.style.setProperty('--font-family', font);
    document.documentElement.style.setProperty('--font-size', fontSize);
    document.documentElement.style.setProperty('--page-color', pageColor);
    document.documentElement.style.setProperty('--text-color', textColor);
}