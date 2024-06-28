
function pptLink(chromaKeyed) {


    initateClipboardLink(document.getElementById('btnCopyPPTSignal'),document.getElementById('btnPastePPTSignal'),captionWatcher,function(what,data){

        switch (what) {
            case 'data' : {
                 console.log(data);
                break;
            }
            case 'connect' : {
                console.log("connected");
                break;
            }

        }
        
    });
    
    
    function captionWatcher(handler) {

        const targetNode = document.querySelector("#SubtitleResultSpan");
               
        const config = {
            attributes: true,
            childList: true,
            subtree: true,
            characterData: true
        };
        
        const callback = function(mutationsList, observer) {
            for (const mutation of mutationsList) {
                if (mutation.type === 'childList') {
                    const textContent = targetNode.textContent;
                    if (handler.peer && handler.peerConnected) {
                        handler.peer.send(JSON.stringify({captions:textContent}));
                    }
              } else if (mutation.type === 'characterData') {
                    const textContent = targetNode.textContent;
                    if (handler.peer && handler.peerConnected) {
                        handler.peer.send(JSON.stringify({captions:textContent}));
                    }
                }
            }
        };
        
        // Create an instance of MutationObserver and pass the callback
        const observer = new MutationObserver(callback);
        
        // Start observing the target node with the configured parameters
        observer.observe(targetNode, config);
        
         
    }

}