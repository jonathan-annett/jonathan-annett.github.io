


function initatePPTLink(cb) {

  const targetQuery = "#SubtitleResultSpan";


    initateClipboardLink(
        document.getElementById('btnCopyPPTSignal'),
        document.getElementById('btnPastePPTSignal'),
        captionWatcher,
        targetQuery,
        cb);
    
    
    function captionWatcher(handler) {

        if (!handler) {
            alert ("pasted into incorrect console area!")
            return;
        }

        const targetNode = document.querySelector(targetQuery);
               
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
                        try {
                            handler.peer.send(JSON.stringify({captions:textContent}));
                        } catch (e) {

                        }
                    }
              } else if (mutation.type === 'characterData') {
                    const textContent = targetNode.textContent;
                    if (handler.peer && handler.peerConnected) {
                        try {
                            handler.peer.send(JSON.stringify({captions:textContent}));
                        } catch (e) {

                        }
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