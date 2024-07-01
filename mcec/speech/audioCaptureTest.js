
document.addEventListener('GoogleSpeechEvent',function(e){  
    document.getElementById('Google_transcription').textContent = e.detail.interim_transcript;
});


document.addEventListener('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});

document.addEventListener("DOMContentLoaded",function(){

    const buttonEl = document.getElementById('button-start');
    const meterEl = document.getElementById('volume-meter');
    buttonEl.disabled = false;
    meterEl.disabled = false;
    buttonEl.addEventListener('click', async () => {
        await startAudio(audioContext, meterEl);
        audioContext.resume();
        buttonEl.disabled = true;
        //buttonEl.textContent = 'Stop Meter';
    }, false);

});