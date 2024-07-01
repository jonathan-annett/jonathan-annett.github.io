/*
document.addEventListener('GoogleSpeechEvent',function(e){  
    document.getElementById('Google_transcription').textContent = e.detail.interim_transcript;
});


document.addEventListener('PPTSpeechEvent',function(e){
    document.getElementById('PPT_transcription').textContent =  e.detail.captions;
});
*/

var audioContext;

const startAudio = async (context, meterElement) => {
    await context.audioWorklet.addModule('volume-meter-processor.js');
    const mediaStream = await navigator.mediaDevices.getUserMedia({audio: true});
    const micNode = context.createMediaStreamSource(mediaStream);
    const volumeMeterNode = new AudioWorkletNode(context, 'volume-meter');   
    volumeMeterNode.port.onmessage = ({data}) => {
      meterElement.value = data * 500;
    };
    micNode.connect(volumeMeterNode).connect(context.destination);
  };
document.addEventListener("DOMContentLoaded",function(){

    const buttonEl = document.getElementById('button-start');
    const meterEl = document.getElementById('volume-meter');
    buttonEl.disabled = false;
    meterEl.disabled = false;
    buttonEl.addEventListener('click', async () => {
        audioContext = new AudioContext();

        await startAudio(audioContext, meterEl);
        audioContext.resume();
        buttonEl.disabled = true;
        //buttonEl.textContent = 'Stop Meter';
    }, false);

});