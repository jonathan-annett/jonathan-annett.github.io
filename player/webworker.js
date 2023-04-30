importScripts("openDB.js");

workerCode();
 
function workerCode(){

    var dbName = "Files",
        storeName,
        database,
        maxBufferSize = 32 * 1024 * 1024;
    var videosListFiles= {};   
    var storageDB = {
    };
    var pending = [];
    openDb(self,storageDB,function(err,db,sn){
        if (err) {
            console.log(err);
            return;
        }
        database = db;
        storeName = sn;
        clearPendingBacklog();

        function clearPendingBacklog() {
            if (pending.length===0) {
                self.removeEventListener('message', bootStrapPendingMessages);
                self.addEventListener('message', onMessageForWorker);
            } else {
                let data = pending.shift();
                processMessageForWorker(data,function(){
                    self.postMessage({done:true,data});
                    setTimeout(clearPendingBacklog,10);    
                });
               
            }
        }                       
       
    });

    self.addEventListener('message', bootStrapPendingMessages);

    function bootStrapPendingMessages(event) {
        pending.push(event.data);
    }


    function onMessageForWorker(event) {
        processMessageForWorker(event.data,function(){
            self.postMessage({done:true,data:event.data});
        });
    }

    function processMessageForWorker(data,cb) {

        const file = data.file;
        const codecInfo = file.codecInfo;
        let firstBuffer = file.arrayBuffer, nextBuffer, nextBufferCB;

        let cursordone = file.bufferCount===1;

        let mediaSource = new MediaSource();
        let handle = mediaSource.handle;

        let transaction,objectStore,index,cursor;

        const pullFunction = file.bufferCount===1?pullFromSingleBuffer:pullFromDB;
        
        createMediaSourceBuffer (mediaSource, codecInfo, pullFunction);

        postMessage({ mediaHandle: handle }, [handle]);
      


        function pullFromSingleBuffer(cb) {
            cb(firstBuffer);
            firstBuffer=undefined;
        }

        function pullFromDB(cb) {
            if (firstBuffer) {
               console.log('sending first buffer',firstBuffer.byteLength,"bytes");
               nextBuffer=undefined;
               nextBufferCB=undefined;
               return pullFromSingleBuffer(cb);
            }

            if (transaction) {

                if (nextBuffer) {
                    cb(nextBuffer);
                    nextBuffer=undefined;
                    nextBufferCB=undefined;
                    cursor.continue();
                } else {
                    if (null===nextBuffer) {
                        cb();
                        nextBufferCB=undefined;
                    } else {
                        nextBufferCB=cb;
                    }
                }
                
            } else {
                console.log('opening cursor...');
                transaction = database.transaction([storeName], "readwrite");
                objectStore = transaction.objectStore(storeName);
                index = objectStore.index("nameBufferIndex");
                let range = IDBKeyRange.bound([file.name,1],[file.name,Infinity],false,false);
                nextBuffer=undefined;
                nextBufferCB=cb;
                cursor = index.openCursor(range);
                cursor.addEventListener('success', gotNextCursor);
            }

            function gotNextCursor(event) {
                const cursor = event.target.result;
                if (cursor) {
                    if (nextBufferCB) {
                        nextBufferCB(cursor.value.arrayBuffer);
                        nextBufferCB=undefined;
                        nextBuffer=undefined;
                        cursor.continue();
                    } else {
                        nextBuffer=cursor.value.arrayBuffer;
                    }
                } else {
                    console.log('no more buffers');
                    if (nextBufferCB) {
                        nextBufferCB(undefined);
                        nextBufferCB=undefined;
                        nextBuffer=undefined;
                    } else {
                        nextBuffer=null;
                    }
                }
            };
            
        }
        
            
         

 

      
    }



}



function createMediaSourceBuffer (mediaSource, mimeStr, pullFromDB) {

	 
        if (mediaSource.readyState === 'open') {
            getSourceBuffer();
        } else {
            mediaSource.addEventListener('sourceopen', getSourceBufferAfterOpen);
        }

        function getSourceBufferAfterOpen() {
            mediaSource.removeEventListener('sourceopen', getSourceBufferAfterOpen);
            getSourceBuffer();
        }

        function getSourceBuffer() {
            try {
                const sourceBuffer = mediaSource.addSourceBuffer(mimeStr);
                sourceBuffer.mode = 'sequence';
                
                sourceBuffer.addEventListener('updateend',nextBuffer);
                nextBuffer();

                function nextBuffer () {
                    pullFromDB(function(arrayBuffer){
                        if (arrayBuffer) {
                            console.log('got buffer',arrayBuffer.byteLength,"bytes");
                            sourceBuffer.appendBuffer(arrayBuffer);
                        } else {
                            console.log('no more buffers');
                        }    
                    });
                }
                

            } catch (e) {
                console.log(e);
            }
        }

    

}
