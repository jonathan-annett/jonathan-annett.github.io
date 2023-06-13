
const

    html = document.querySelector('html'),
    dlBtn = document.getElementById('dlBtn'),
    dlSdkBtn = document.getElementById('dlSdkBtn'),
    fileInput = document.getElementById('fileInput'),
    busy = document.getElementById('busy'),
    clrCache = document.getElementById('clrCache'),
    cachesExist = document.getElementById('cachesExist');

var

    available_versions = localforage.createInstance({
        name: "available_versions"
    }),

    template_sourcecode = localforage.createInstance({
        name: "template_sourcecode"
    }),
    appName,
    appVersion,
    zipDownloadName = "app.zip";

fetchCacheBust("/updates/index.json").then(function (response) {
    return response.json();
})

    .then(function (data) {

        return getPermissionHex().then(function (hex) {
            return data.permissions.indexOf(hex) < 0 ? Promise.reject(JSON.stringify({missingPermission:hex})) : Promise.resolve(data);
        });

    })

    .then(function (data) {

        return fetchCacheBust("package.nw").then(function (response) {
            return response.arrayBuffer();
        });

    })

    .then(function (arrayBuffer) {
        const zip = new JSZip();
        return zip.loadAsync(arrayBuffer).then(function (zip) {

            return zip.file('package.json').async('text').then(function (json) {
                const pkg = JSON.parse(json);
                appName = pkg.name;
                appVersion = pkg.version;
                zipDownloadName = appName + "-v" + appVersion + ".zip";

                document.querySelector('h1').innerHTML = appName + " v" + appVersion + " installer";

                return NWJSVersions();

            });

        });
    })

    .then(function (nwjs_versions) {

        document.querySelector('table').innerHTML += Object.keys(nwjs_versions).map(function (filename) {
            const ver = nwjs_versions[filename];
            let html = '<tr id="v' + ver.sha + '">\n';
            html += '<td>' + ver.version + '</td>\n';
            html += '<td><a href="' + ver.url + '">' + filename + '</a></td>\n';
            html += '<td>' + ver.sha + '</td>\n';
            return html + '</tr>'
        }).join('\n');

        const runtimeAvailable = function() {
            return Object.keys(nwjs_versions).some(function(fn){
                const ver = nwjs_versions[fn];
                return (ver.bin==='bin') && !!ver.arrayBuffer;
            });
        };

        const sdkAvailable = function() {
            return Object.keys(nwjs_versions).some(function(fn){
                const ver = nwjs_versions[fn];
                return (ver.bin==='debug.bin') && !!ver.arrayBuffer;
            });
        };

        const runtimeZip = function(bin_name) {
            bin_name = bin_name || "bin";
            return new Promise(function(resolve,reject){

                if (Object.keys(nwjs_versions).some(function(fn){
                    const version = nwjs_versions[fn];
                    if ((version.bin===bin_name) && !!version.arrayBuffer) {
                        const zip = new JSZip();
                        zip.loadAsync(version.arrayBuffer).then(function( ){
                            const bin_folder = renameFolderInZip(zip, version.ziproot, version.bin);
                            const update_folder = zip.folder('update');
                            resolve({
                                root:zip,
                                bin_folder,
                                update_folder
                            });
                          
                        });
                        return true;
                    }
                })) return ;

                reject(new Error("no "+bin_name+" runtime zip file exists"));

            });
        }

        fileInput.onchange=readFile;

        clrCache.onclick = function () {
            available_versions.clear().then(function () {
                location.reload();
            });
        }

        available_versions.keys().then(function (filenames) {
            // An array of all the key names.

            Promise.all(
                filenames.map(function (fn) {
                    return new Promise(function(resolve,reject){
                        console.log('checking', fn, 'in indexed db against current list');
                        const ver = nwjs_versions[fn];
                        if (ver) {

                            available_versions.getItem(fn).then(function (arrayBuffer) {
                                getSha256SumForBuffer(arrayBuffer, function (err, hash) {
                                    const table_row = document.querySelector('#v' + hash);
                                    if (ver.sha === hash) {
                                        ver.arrayBuffer = arrayBuffer;
                                        table_row.style.backgroundColor = "aqua";
                                        table_row.onclick = table_row_click;
                                        const a = document.querySelector('#v' + ver.sha + ' a');
                                        a.parentElement.replaceChild(document.createTextNode(fn), a);
                                        cachesExist.style.display = "inline-block";
                                        resolve();
                                    } else {
                                        console.log('removing', fn, 'from indexed db - arrayBuffer has incorrect sha256 checksum');

                                        available_versions.removeItem(fn).then(function () { });
                                        table_row.style.backgroundColor = null;
                                        table_row.onclick = null;
                                        resolve();
                                    }
                                });

                            }).catch(function (err) {
                                // This code runs if there were any errors
                                console.log(err);
                                resolve();
                            });

                        } else {
                            console.log('removing', fn, 'from indexed db - not a valid filename');
                            available_versions.removeItem(fn).then(function () { 
                                resolve();
                            });
                        }
                    });
                })
            ).then(function(){

                document.body.style.display=null;
                resetApp();


            });

        }).catch(function (err) {
            // This code runs if there were any errors
            console.log(err);
        });


        function table_row_click() {
            const this_hash = this.id.replace(/^v/, '');
            Object.keys(nwjs_versions).forEach(function (k) {
                const v = nwjs_versions[k];
                document.querySelector('#v' + v.sha).style.backgroundColor = v.sha === this_hash ? "yellow" : v.arrayBuffer ? "aqua" : null;
            });

        }


        function readFile() {
            let file = fileInput.files[0];



            let reader = new FileReader();

            reader.readAsArrayBuffer(file);

            reader.onload = function () {

                fileInput.disabled = true;

                const arrayBuffer = reader.result;

                getSha256SumForBuffer(arrayBuffer, function (err, hash) {
                    console.log(file, hash);

                    let version = nwjs_versions[file.name];


                    Object.keys(nwjs_versions).forEach(function (fn) {
                        let v = nwjs_versions[fn];
                        let r = document.querySelector('#v' + v.sha);
                        if (v.sha === hash) {
                            version = v;
                            available_versions.setItem(fn, arrayBuffer).then(function () {
                                r.style.backgroundColor = "yellow";
                                v.arrayBuffer = arrayBuffer;
                                r.onclick = table_row_click;
                                const a = document.querySelector('#v' + v.sha + ' a');
                                a.parentElement.replaceChild(document.createTextNode(fn), a);
                                cachesExist.style.display = "inline-block";
                            });
                        } else {
                            r.style.backgroundColor = v.arrayBuffer ? "aqua" : null;
                            r.onclick = v.arrayBuffer ? table_row_click : null;
                        }
                    })


                    if (version) {
                        if (version.sha !== hash) {
                            alert("that file seems corrupted, sorry");
                            fileInput.disabled = false;
                            fileInput.value = null;
                            return;
                        }
                    } else {

                        alert("I don't recognize that file, sorry");
                        fileInput.disabled = false;
                        fileInput.value = null;
                        return;
                    }


                      resetApp();


                });


            };



            reader.onerror = function () {
                console.log(reader.error);
            };

        }

        function prepareDownloader(bin_name) {
            return new Promise(function(resolve,reject){
                
                const filenames = [
                    // these files are relative to the install.html page this script is loaded from
                    "package.nw", "package.nw.sha",
                    "package.app.nw", "package.app.nw.sha",
                    "package.modules.nw", "package.modules.nw.sha"
                ];

                Promise.all(filenames.map(function (fn) {

                    return fetch("./" + fn);

                })).then(function (responses) {

                    return responses.map(function (resp) {
                        return resp.arrayBuffer();
                    })

                }).then(function (arrayBuffers) {
                    runtimeZip(bin_name).then(function(ZIP){       

                        arrayBuffers.forEach(function (arrayBuffer, index) {
                            ZIP.update_folder.file(filenames[index], arrayBuffer);
                            if (index <= 1) {
                                // we put the package.nw and package.nw.sha file in bin also
                                ZIP.bin_folder.file(filenames[index], arrayBuffer);
                            }
                        });
                        resolve(ZIP);
                    }).catch(reject);
                });

            });
        }

        function resetApp() {

            if (runtimeAvailable()) {

                dlBtn.onclick = function () {
                    dlBtn.disabled = true;
                    dlSdkBtn.disabled = true;
                    busy.style.display = "inline-block";
                    prepareDownloader().then(function(ZIP){
                        exportAndDownload(ZIP.root);
                        dlBtn.disabled = false;
                        dlSdkBtn.disabled = !sdkAvailable();
                    });
                };
                dlBtn.disabled = false;
            } else {
                dlBtn.onclick = null;
                dlBtn.disabled = true;
            }

            if (sdkAvailable()) {

                dlSdkBtn.onclick = function () {

                    dlBtn.disabled = true;
                    dlSdkBtn.disabled = true;
                    busy.style.display = "inline-block";
                    prepareDownloader("debug.bin").then(function(ZIP){
                        exportAndDownload(ZIP.root);
                        dlBtn.disabled = !runtimeAvailable();
                        dlSdkBtn.disabled = false;
                    });

                };

                dlSdkBtn.disabled = false;
                dlSdkBtn.hidden = false;

            } else {
                dlSdkBtn.onclick = null;
                dlSdkBtn.disabled = true;
                dlSdkBtn.hidden = true;
            }
       

            function exportAndDownload(zip) {
                return new Promise(function(resolve,reject){
                    zip.generateAsync({ type: "blob", compression: "DEFLATE" }).then(function (blob) {

                        saveAs(blob, zipDownloadName);
                        busy.style.display = "none";

                        resolve();

                    }, function (err) {

                        reject(err);

                    });
                });
            }

        }


        function renameFolderInZip(zipFile, originalDir, destinationDir) {

            const originalDirContent = zipFile.folder(originalDir);

            const pending = [];

            const fixKeys = {};
            const killKeys = [];

            originalDirContent.forEach(function (path, entry) {

                const basename = path.split(originalDir)[0];
                const newFileName = destinationDir + '/' + basename;

                const fileInst = originalDirContent.files[entry.name];
                if (fileInst) {
                    fixKeys[newFileName] = fileInst;
                    killKeys.push(fileInst.name);
                    fileInst.name = newFileName;
                    if (fileInst.unsafeOriginalName) {
                        fileInst.unsafeOriginalName = newFileName;
                    }
                }
            });



            originalDirContent.root = destinationDir;
            Object.keys(fixKeys).forEach(function (key) {
                originalDirContent.files[key] = fixKeys[key];
                delete fixKeys[key];
            });
            killKeys.forEach(function (key) {
                delete originalDirContent.files[key];
            });
            killKeys.splice(0, killKeys.length);

            const dirInst = zipFile.files[originalDir + '/'];
            if (dirInst) {
                dirInst.name = destinationDir + '/';
                if (dirInst.unsafeOriginalName) {
                    dirInst.unsafeOriginalName = destinationDir + '/';
                }
                zipFile.files[destinationDir + '/'] = dirInst;
                delete zipFile.files[originalDir + '/'];
            }

            return zipFile.folder(destinationDir);

        }


        function getSha256SumForBuffer(arrayBuffer, callback) {
            const hash = crypto.subtle.digest("SHA-256", arrayBuffer);

            hash.then(

                function (hashBuffer) {
                    const hashArray = Array.from(new Uint8Array(hashBuffer)); // convert buffer to byte array
                    const hashHex = hashArray.map(function (b) { return b.toString(16).padStart(2, "0"); });
                    callback(undefined, hashHex.join(""));
                }
            );

            hash.catch(callback);
        }


    })
    
    
    .catch(function(err){

        document.body.innerHTML="404 not found"+"<!-- "+String(err)+" -->";
        document.body.style.display=null;

    }) ;



function fetchCacheBust(url) {
    return fetch(url + '?_=' + Math.random().toString(36));
}


function NWJSVersions() {

    return fetchCacheBust('/updates/nwjs.versions.json').then(function (response) {
        return response.json();
    });
}


function getPermissionHex() {
    return new Promise(function (resolve, reject) {
        let key = localStorage.getItem('local.key');

        if (!key) {
            key = (Math.random().toString(36) + Date.now().toString(36) + Math.random().toString(36)).replace(/\0\./g, '');
            localStorage.setItem('local.key', key);
        }

        const encoder = new TextEncoder();
        const data = encoder.encode(key);

        crypto.subtle.digest("SHA-256", data).then(function (digest) {
            const hashArray = Array.from(new Uint8Array(digest)); // convert buffer to byte array
            const hashHex = hashArray
                .map((b) => b.toString(16).padStart(2, "0"))
                .join(""); // convert bytes to hex string
            resolve(hashHex);

        }).catch(reject);

    });
}


