const audioCapturePeer = new AudioCapturePeer();
audioCapturePeer.init();

pptLink();


document.addEventListener('PPTSpeechEvent',function(e){  
    document.getElementById('transcription').textContent = e.detail.interim_transcript;
});


document.addEventListener('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});

