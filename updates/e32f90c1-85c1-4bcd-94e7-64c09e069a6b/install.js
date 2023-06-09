
const nwjs_versions = {

    'nwjs-sdk-v0.76.1-win-x64.zip' : {
        version  : '0.76.1 (sdk)',
        url      : 'https://dl.nwjs.io/v0.76.1/nwjs-sdk-v0.76.1-win-x64.zip',
        ziproot  : 'nwjs-sdk-v0.76.1-win-x64',
        sha      : 'c786112b18287c30b2eae6b6d3992cc1a2374cd87dd750e7ed04eaee9818a379',
        'bin'    : 'debug.bin'
    
    },

    'nwjs-v0.76.1-win-x64.zip' : {
        version  : '0.76.1 (normal)',
        url      : 'https://dl.nwjs.io/v0.76.1/nwjs-v0.76.1-win-x64.zip',
        ziproot  : 'nwjs-v0.76.1-win-x64',
        sha      : 'efb20da6f1c6b72cc794634447ac5e69a907e80d3397bbb99689f6062c68c038',
        'bin'    : 'bin'
    }

    };

  const 
  
  html        = document.querySelector('html'),
  dlBtn       = document.getElementById('dlBtn'),
  fileInput   = document.getElementById('fileInput'),
  busy        = document.getElementById('busy'),
  clrCache    = document.getElementById('clrCache'),
  cachesExist = document.getElementById('cachesExist');            

  var 
  
  available_versions = localforage.createInstance({
    name: "available_versions"
  }),
  
  template_sourcecode = localforage.createInstance({
      name: "template_sourcecode"
  }),
  
  zip = new JSZip();
  
  document.querySelector('table').innerHTML += Object.keys(nwjs_versions).map(function(filename){
    const ver = nwjs_versions [filename];
    let html = '<tr id="v'+ver.sha+'">\n';
    html += '<td>'+ver.version+'</td>\n';
    html += '<td><a href="'+ver.url+'">'+filename+'</a></td>\n';
    html += '<td>'+ver.sha+'</td>\n';
    return html+'</tr>'
 }).join('\n');
 
 
 clrCache.onclick = function() {
     available_versions.clear().then(function(){
         location.reload();
     });
 }
     
available_versions.keys().then(function(filenames) {
    // An array of all the key names.
  
           
    filenames.forEach(function(fn){
       console.log('checking',fn,'in indexed db against current list');
       const ver =  nwjs_versions[fn];
       if (ver) {

           available_versions.getItem(fn).then(function(arrayBuffer) {
               getSha256SumForBuffer(arrayBuffer,function(err,hash){
                   const table_row = document.querySelector('#v'+hash);
                   if (ver.sha===hash) {
                        ver.arrayBuffer=arrayBuffer;
                        table_row.style.backgroundColor="aqua";
                        table_row.onclick = table_row_click ;
                        const a = document.querySelector('#v'+ver.sha+' a');
                        a.parentElement.replaceChild( document.createTextNode(fn),a);
                        cachesExist.style.display="inline-block";
                   } else {
                       console.log('removing',fn,'from indexed db - arrayBuffer has incorrect sha256 checksum');
           
                       available_versions.removeItem(fn).then(function(){});
                       table_row.style.backgroundColor=null;
                       table_row.onclick=null;
                   }
               }); 
               
            }).catch(function(err) {
                // This code runs if there were any errors
                console.log(err);
            });
       } else {
           console.log('removing',fn,'from indexed db - not a valid filename');
           available_versions.removeItem(fn).then(function(){});
       }
    });
    
}).catch(function(err) {
    // This code runs if there were any errors
    console.log(err);
});
         













 function table_row_click(){
    const this_hash=this.id.replace(/^v/,'');
    let arrayBuffer;
    Object.keys(nwjs_versions).forEach(function(k){
        const v = nwjs_versions[k];
        document.querySelector('#v'+v.sha).style.backgroundColor = v.sha === this_hash ? "yellow" : v.arrayBuffer?"aqua" : null;
        if (v.sha===this_hash &&  v.arrayBuffer) {
            zip = new JSZip();
            zip.loadAsync(v.arrayBuffer,{createFolders: true}).then(function(zip){resetApp(v,zip);});
        }
    });
    
}


function readFile() {
  let file = fileInput.files[0];
  
  

  let reader = new FileReader();

  reader.readAsArrayBuffer(file);

  reader.onload = function() {
      
     fileInput.disabled = true;
     
     const arrayBuffer = reader.result;
     
     getSha256SumForBuffer(arrayBuffer,function(err,hash){
         console.log(file,hash);
         
         let version = nwjs_versions[file.name];
         
        
         Object.keys(nwjs_versions).forEach(function(fn){
             let v = nwjs_versions[fn];
             let r =  document.querySelector('#v'+v.sha);
             if (v.sha === hash) {
                 version = v;
                  available_versions.setItem(fn,arrayBuffer).then(function(){
                     r.style.backgroundColor="yellow";
                     v.arrayBuffer = arrayBuffer;
                     r.onclick = table_row_click;
                     const a = document.querySelector('#v'+v.sha+' a');
                     a.parentElement.replaceChild( document.createTextNode(fn),a);
                     cachesExist.style.display="inline-block";
                 });
             } else {
                 r.style.backgroundColor = v.arrayBuffer ? "aqua" : null;
                 r.onclick =  v.arrayBuffer ? table_row_click : null;
             }
         })
     
         
         if (version) {
             if (version.sha !== hash) {
                  alert ("that file seems corrupted, sorry");
                 fileInput.disabled = false;
                 fileInput.value = null;
                 return;
             }
         } else {
             
             alert ("I don't recognize that file, sorry");
             fileInput.disabled = false;
             fileInput.value = null;
             return;
         }
  
  
         zip = new JSZip();
         zip.loadAsync(arrayBuffer,{createFolders: true}).then(function(zip){resetApp(version,zip);});
         
        
         
     });

         
  };
  
 

   reader.onerror = function() {
    console.log(reader.error);
  };

}

 function resetApp(version,zip)  {
            
        const bin_folder = renameFolderInZip(zip, version.ziproot, version.bin);
        const update_folder = zip.folder('update');
        
        dlBtn.onclick = function(){
            
                dlBtn.disabled = true;
                busy.style.display="inline-block";

                const filenames = [
                    "package.nw",
                    "package.app.nw",
                    "package.modules.nw",    
                    "package.nw.sha",
                    "package.app.nw.sha",
                    "package.modules.nw.sha"
                ];

                Promise.all(filenames.map(function(fn){

                    return fetch("./"+fn);

                })).then(function(responses){

                    return responses.map(function(resp){
                        return resp.arrayBuffer();
                    })

                }).then(function(arrayBuffers){

                    arrayBuffers.forEach(function(arrayBuffer,index){
                        update_folder.file(filenames[index],arrayBuffer);
                        if (index <= 1) {
                            // we put the package.nw and package.nw.sha file in bin also
                            bin_folder.file(filenames[index],arrayBuffer);
                        }
                    });
                   
                    exportAndDownload();
                });
        
        };
        
        dlBtn.disabled = false;
        fileInput.disabled = false;
        
        
        function exportAndDownload(){
                      
                zip.generateAsync({type:"blob"}).then(function (blob) { 
                    
                    saveAs(blob, "app.zip");      
                    dlBtn.disabled = false;
                    busy.style.display="none";
                    
                    // reload the zip fresh, in case the user toggles the package.nw folder/file setting
                    zip = new JSZip();
                    zip.loadAsync(version.arrayBuffer,{createFolders: true}).then(function(zip){resetApp(version,zip);});
                    
                }, function (err) {

                    alert(err);

                });
        }

}


/**
 * Move/rename entire directory tree within a zip.
 * @param {*} zipFilePath The original zip file
 * @param {*} modifiedZipFilePath The path where palace the modified zip 
 * @param {*} originalDir The original directory to change
 * @param {*} destinationDir The new directory to move to.
 */
function renameFolderInZip(zipFile, originalDir, destinationDir) {

    return new Promise(function(resolve,reject){

        // Get the original directory entry
        const originalDirContent = zipFile.folder(originalDir);
        // Walk on all directory tree

        const pending = [];

        originalDirContent.forEach(function (path, entry) {
            // If it's a directory entry ignore it.
            if (entry.dir) {
                return;
            }
            // Extract the file path within the directory tree 
            const internalDir = path.split(originalDir)[0];
            // Build the new file directory in the new tree 
            const newFileDir = `${destinationDir}/${internalDir}`;
            // Put the file in the new tree, with the same properties

            pending.push(new Promise(function(resolve){
                const fileInst = zipFile.file(entry.name);
                if (fileInst) {
                    fileInst.arrayBuffer().then(function(ab){
                        zipFile.file(newFileDir, ab, { 
                            createFolders: true,
                            unixPermissions: entry.unixPermissions,
                            comment: entry.comment,
                            date: entry.date,
                            compression: "DEFLATE",
                            compressionOptions: {
                                level: 9 // force a compression and a compression level for this file
                            }
                        });
                        resolve(true);
                    });
                } else {
                    resolve(false);
                }
            }));        
        
        });
        // After all files copied to the new tree, remove the original directory tree.

        Promise.all(pending).then(function(){
            zipFile.remove(originalDir);
            resolve(zipFile.folder(destinationDir));
        });

    });

}


function getSha256SumForBuffer(arrayBuffer,callback) {
  const hash = crypto.subtle.digest("SHA-256", arrayBuffer);
  
  hash.then(
      
      function(hashBuffer){
            const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
            const hashHex = hashArray.map(function(b) { return b.toString(16).padStart(2, "0");});
           callback(undefined,hashHex.join(""));
       }
  );
   
  hash.catch(callback);
}
         