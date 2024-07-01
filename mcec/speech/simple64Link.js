
function createClipboardScript(code,copyButton,pasteButton,cb) {

    simplePeerLib ().then(function(SimplePeer){
        let peer;
        
        peer = new SimplePeer ({initiator:true,trickle:false});
        peer.on('signal',function(signalData){

            compressToBase64(`
                ${code.name}( startPeerHandler(${JSON.stringify(signalData)}) );
                ${code.toString()}
                ${startPeerHandler.toString()}

            `).then(function(scriptsSrc){

                scriptsSrc = `
                   (function(){ 
                    simplePeerLib().then(function(){
                        return loadCompressedScript(${JSON.stringify(scriptsSrc)});
                    }).then(function(fn){
                        fn();
                    });
                    
                    ${decompressFromBase64.toString()}
                    ${loadCompressedScript.toString()}
                   
                    ${simplePeerLib.toString()}
                    ${compresedSimplePeer.toString()}
                })();
                `;

                      
                copyButton.onclick = function() {
                    navigator.clipboard.writeText(scriptsSrc);
                    copyButton.disabled = true;
                    pasteButton.onclick = function(){
                        navigator.clipboard.readText().then(function(json){
                            try {
                                const message = JSON.parse(json);
                                if (peer) {
                                    peer.signal(message);
                                    pasteButton.disabled = true;  
                                }
                            } catch(e) {
                                
                            }
                        });
                    }; 
                    pasteButton.disabled = false;                    
                };
                copyButton.disabled = false;
                

            }).catch(function (err){
                cb('error',err);
            });


        });

        
        peer.on('connect',function(){
            cb('connect',peer);
        });

        peer.on('data',function(json){
            const payload = JSON.parse(json);
            cb('data',payload);
        });

    }).catch(function (err){
        cb('error',err);
    });

}          
 
function startPeerHandler(signalData) {
    let btn;

    const handler = {
        peerConnected : false
    };

    createLocalPeer(signalData);
   
    return handler;

    function peerCloseError (err) {
          handler.peerConnected = false;// this prevents trying to send while down
        // show a paste button and wait for user to click it, callback with new peer's signal data to send to start new link 
        // this is to allow us to reestablish a link without stopping powerpoint. 
        console.log(err);

        addPasteRequestButton(createLocalPeer);
    }

    function createLocalPeer(signalData){
        handler.peer = new SimplePeer({initator:false,trickle:false});
       
        handler.peer.on('signal', function(data ) {
            addReplyCopyButton(JSON.stringify(data));             
        });
        handler.peer.on('connect', () => {
            console.log('Connected');
            handler.peerConnected = true;
        });
        handler.peer.on('error', peerCloseError)
        handler.peer.on('close', peerCloseError);
        handler.peer.signal(signalData);
    }

    function removeBtn() {
        if (btn) {
            btn.parentElement.removeChild(btn);
        }
        btn = null;
    }

    function createBtn() {
        removeBtn();
        btn = document.createElement('button');
        return btn;
    }

    function addReplyCopyButton(json,buttonText = "Copy Response") {
        createBtn().textContent = "Copy Response";
            btn.style= "position:absolute;bottom:10px;left:10px;width:135px;height:50px;z-index:99999;background-color: yellow";

        btn.onclick = function(){
            
            navigator.clipboard.writeText(json).then(function(){
                removeBtn() ;     
            }).catch(function(e){
                console.log(json );
            });
        };

        document.body.appendChild(btn);    
    }

    function addPasteRequestButton(cb) {
        
        createBtn().textContent = "Paste Request";
        btn.style= "position:absolute;bottom:10px;left:10px;width:135px;height:50px;z-index:99999;background-color: red";

        btn.onclick = function(){
            navigator.clipboard.readText().then(function(text){
                debugger;
                  // this will actually be some javascript
                const getb64 = /loadCompressedScript\(\"(.*)\"\)/.exec(text);
                if (getb64) {
                    const b64 = getb64[1];

                    decompressFromBase64(b64).then(function(js){
                     
                        const getJSON = /startPeerHandler\(\{\"(.*)\}\)/.exec(js);
                        if (getJSON) {
                            const json = `{"${getJSON[1]}}`; // yes this is correct! regex group does not include '{"' or '}'
                            try {

                                cb( JSON.parse(json) );
                                removeBtn();

                            } catch (e) {
                                
                            }
                        }

                    });

                }
              
 
            });
        }

        document.body.appendChild(btn);    
    }

    async function decompressFromBase64(base64String) {
        const binaryString = atob(base64String);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        
        const ds = new DecompressionStream('deflate');
        const writer = ds.writable.getWriter();
        
        writer.write(bytes);
        writer.close();
        
        const decompressedStream = ds.readable;
        const decompressedData = await new Response(decompressedStream).arrayBuffer();
        
        const decoder = new TextDecoder();
        return decoder.decode(decompressedData);
    }
     
}   

async function compressToBase64(inputString) {

    const encoder = new TextEncoder();
    const data = encoder.encode(inputString);
    const cs = new CompressionStream('deflate');
    const writer = cs.writable.getWriter();
    
    writer.write(data);
    writer.close();
    
    const compressedStream = cs.readable;
    const compressedData = await new Response(compressedStream).arrayBuffer();
    
    return btoa(String.fromCharCode(...new Uint8Array(compressedData)));
}

async function decompressFromBase64(base64String) {
    const binaryString = atob(base64String);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    
    const ds = new DecompressionStream('deflate');
    const writer = ds.writable.getWriter();
    
    writer.write(bytes);
    writer.close();
    
    const decompressedStream = ds.readable;
    const decompressedData = await new Response(decompressedStream).arrayBuffer();
    
    const decoder = new TextDecoder();
    return decoder.decode(decompressedData);
}
 
async function loadCompressedScript(compressedScript) {
    try {
        const src = await decompressFromBase64(compressedScript);
        return new Function (src);
    } catch (e) {
        console.error( e.message||String(e) );
    }
}

async function simplePeerLib () {
  if (typeof  window.SimplePeer!=='function') { 
      (await loadCompressedScript(compresedSimplePeer()))();
  }
  return window.SimplePeer;
}

function compresedSimplePeer() {
    return  "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";
}

function initateClipboardLink(copyButton,pasteButton,code,cb) {
    copyButton.disabled = true;
    pasteButton.disabled = true;
    let peer;

    createClipboardScript(code,copyButton,pasteButton,function(what,data){
        switch (what) {
            case 'data' :
            case 'connect' :
            if (what==='connect') {
                peer = data;
            }
            cb(what,data);
        }
       
    });

}