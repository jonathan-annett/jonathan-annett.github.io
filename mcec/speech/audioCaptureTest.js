const audioCapturePeer = new AudioCapturePeer();
audioCapturePeer.init();

pptLink();


document.addEventListener('GoogleSpeechEvent',function(e){  
    document.getElementById('Google_transcription').textContent = e.detail.interim_transcript;
});


document.addEventListener('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});

