const audioCapturePeer = new AudioCapturePeer();
audioCapturePeer.init();

pptLink();


document.onabort('PPTSpeechEvent',function(e){  
    document.getElementById('transcription').textContent = e.detail.interim_transcript;
});


document.onabort('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});

