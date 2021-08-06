/* global ace*/


/* global ml,qs, self,BroadcastChannel,ResizeObserver  */
ml(`
    
    pwaWindow@Window      | ${ml.c.app_root}ml.pwa-win.js
    editInZed             | ${ml.c.app_root}ml.zedhook.js
    sha1Lib               | ${ml.c.app_root}sha1.js
    htmlFileItemLib       | ${ml.c.app_root}ml.zipfs.dir.file.js
    htmlFileMetaLib       | ${ml.c.app_root}ml.zipfs.dir.file.meta.js
    showdown              | https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.js
    aceSessionLib         | ${ml.c.app_root}ml.ace-session.js
    openWindowLib         | ${ml.c.app_root}ml.openWindow.js
    dragSizeWindowLib     | ${ml.c.app_root}ml.dragSizeWindow.js
    devClassLib           | ${ml.c.app_root}ml.devclass.js
    Tabulator             | ${ml.c.app_root}tabulator/dist/js/tabulator.min.js
    
    `,function(){ml(2,

    {
        Window: function pwaZipDirListing(pwa,zipFSApiLib,sha1,MarkdownConverter ) {
            
            const session_data = "hidden-json";
            const Tabulator    = ml.i.Tabulator;
            
            return ZipDirEditorLib;
            
            function ZipDirEditorLib(dir,parent_link) {
                var 
                
                alias_root_fix  = new RegExp('^'+regexpEscape(dir.alias_root) ,''),
                zip_files = Object.keys(dir.files),
                
                // some edit modes don't generate annotations, 
                annotationsWorkerDetectDelay = 2000,
                
                dragSize = ml.i.dragSizeWindowLib.size,
                
                ace_session_json = ml.i.aceSessionLib,
                
                { fileIsEditable,fileIsImage,aceModeForFile,aceThemeForFile,aceModeHasWorker } =  ml.i.htmlFileMetaLib,
                
                { open_url   } = ml.i.openWindowLib,
                
                editor_url          = location.href.replace(/\/$/,''),
                editor_channel_name = window.parent ? "ch_"+editor_url.replace(/\/|\:|\.|\-/g,'') : false,
                editor_channel      = editor_channel_name ? new BroadcastChannel(editor_channel_name) : false;

                
                                 
                const resizers = ResizeWatcher();
                const available_html = [];
                const available_css = [];
                const available_scripts = [];
                const edit_hooks = {};
                const editorErrors = {};
                const editorWarnings = {};
                const ignoreErrors = {};
                let errorsTable;
                function errorsExist () {
                    return Object.keys(editorErrors).some(function(filename){
                        return !ignoreErrors[filename];
                    });
                }

                qs ("h1 a.restart",function click(e) {
                     if (editor_channel) {
                            preventDefaults (e);
                            editor_channel.postMessage({stop:1});
                            setTimeout(function(){
                                window.close();
                            },10);
                     } else {
                         window.location = window.location.pathname.replace(/\/$/,'') +'/stopping?stop-service-worker='+ ml.c.app_root;
                     }
                });

                var observeDOM = (function(){
                  var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
                
                  return function( obj, callback, off ){
                    if( !obj || obj.nodeType !== 1 ) return; 
                
                    if( MutationObserver ){
                      // define a new observer
                      var mutationObserver = new MutationObserver(callback)
                
                      // have the observer observe foo for changes in children
                      mutationObserver.observe( obj, { childList:true, subtree:true })
                      return {
                          stop : function () {
                              mutationObserver.disconnect();
                          }
                      };
                    }
                    
                    // browser support fallback
                    else if( window.addEventListener ){
                    
                      obj.addEventListener('DOMNodeInserted', callback, false);
                      obj.addEventListener('DOMNodeRemoved', callback, false);
                      return {
                          stop : function () {
                              obj.removeEventListener('DOMNodeInserted', callback);
                              obj.removeEventListener('DOMNodeRemoved', callback);
                          }
                      };
                    }
                  }
                })()
                
                var zoomEl,fs_li_ed,pre_zoom_height,zoom_filename;    
               
                
                
                const modified_files = {};
                const lib = {
                  // pwaApi : pwaApi
                };
                
                
                function regexpEscape(str) {
                    return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
                }
                
                function join(url,file,assoc) {
                    url  = url.replace(/\/$/,'');
                    file = file.replace(alias_root_fix,'');
                    
                    if (assoc) {
                        return url + '/' + file  + '.' + assoc;
                    }
                    return url + '/' + file ;
                }
                                
                function toggleDeleteFile(filename,cb) {
                    // toggle the metadata deleted status for filename in the root zip file
                    return pwa.toggleDeleteFile(dir.zips[0],filename,cb);
                }
                
                function deleteFile(filename,cb) {
                    // set the metadata deleted status for filename in the root zip file
                    return pwa.deleteFile(dir.zips[0],filename,function(err,msg){
                        const ix = zip_files.indexOf(filename);
                        if (ix >=0) {
                            zip_files.splice(ix,1);
                        }
                        if(cb)cb(err,msg);
                    });
                }
                
                function unDeleteFile(filename,cb) {
                    // clear the metadata deleted status for filename in the root zip file
                    return pwa.unDeleteFile(dir.zips[0],filename,function(err,msg){
                        const ix = zip_files.indexOf(filename);
                        if (ix <0) {
                            zip_files.push(filename);
                        }
                        if(cb)cb(err,msg);
                    });
                }
                
                function removeUpdatedURLContents(file_url,li,db,cb) {
     
                   return pwa.removeUpdatedURLContents(
                       file_url,
                       db,
                       function(err,msg){
                          if (li) li.classList.remove('edited');
                          if(cb)cb(err,msg&&msg.url); 
                       });
                }
                
                function updateURLContents(file_url,li,content,db,cb) {
     
                    return pwa.updateURLContents(
                        file_url,
                        content,
                        true,
                        db,
                        function(err,msg){
                            if (li) {
                                li.classList.add('edited');
                                li.classList[!!li.dataset.editor_id ?"add":"remove"]('editing');
                            }
                            if(cb)cb(err,msg && msg.hash,msg&&msg.url);
                        }
                    );
                }
                
                function fetchUpdatedURLContents(file_url,li,hash,db,cb) {
                    return pwa.fetchUpdatedURLContents(
                        file_url,
                        hash,
                        db,
                        function(err,msg){
                           if (err) return cb (err);
                           if (li) {
                               li.classList[msg.updated?"add":"remove"]('edited');
                               li.classList[!!li.dataset.editor_id ?"add":"remove"]('editing');
                           }
                           cb(undefined,msg.content,msg.updated,msg.hash,msg.url);
                        }
                    );
                }
                
                function removeUpdatedFile (filename,cb) {
                    const ix = dir.files[filename];
                    if (typeof ix === 'number'){
                           // file exists - postive index = index to dir.zips[] array to indicate unchanged
                           //
                           // negative index:
                           // -1 means this is a new file
                           // -2 == originally in dir.zips[0], but has been updated
                           // -3 == originally in dir.zips[1], but has been updated
                           
                           
                           if (ix>=0) {
                               // file was not updated.
                               return cb ();
                           }
                           if (ix<-1) {
                               dir.files[filename] = -2 - ix;
                           } 
                           const url = join(dir.url,filename);
                           const li = find_li(filename);
                           removeUpdatedURLContents(url,li,"updatedURLS",cb);
                           
                    } else {
                        return cb(new Error("not found"));
                    }
                }
                
                function readFileBuffer(filename,cb) {// cb--> err,buffer,updated,hash,url
                    const ix = dir.files[filename];
                    if (typeof ix === 'number'){
                           // file exists - postive index = index to dir.zips[] array to indicate unchanged
                           //
                           // negative index:
                           // -1 means this is a new file
                           // -2 == originally in dir.zips[0], but has been updated
                           // -3 == originally in dir.zips[1], but has been updated
                           
                          const as_per_zip = ix < 0 ? false : dir.zips[ix];
                          const updated = !as_per_zip ;
                          const file_url = join(updated ? dir.url : as_per_zip, filename);
                          const li = find_li(filename);
                          if (updated) {
                              // get updated content.
                              fetchUpdatedURLContents(file_url,li,true,cb);
                              
                          } else {
                              // get file from zip.
                              fetch (file_url).then(function(response){
                                  
                                 response.arrayBuffer().then(function(buffer){
                                     
                                     sha1(buffer,function(err,hash){
                                         if (err) return cb(err);
                                         if (li) {
                                             li.classList.remove('edited');
                                             li.classList[!!li.dataset.editor_id ?"add":"remove"]('editing');
                                         }
                                         return cb(undefined,buffer,false,hash,file_url);

                                     });
                                       
                                   }).catch(cb);
                                   
                              }).catch(cb);
                          }

                    } else {
                        return cb(new Error("not found"));
                    }
                }
                
                function readFileText(filename,cb) {
                    readFileBuffer(filename,function(err,buffer,updated,hash){
                       if (err) return cb(err);
                       return cb (undefined,buffer,updated,hash,new TextDecoder().decode(buffer));
                    });
                }
                
                function writeFileBuffer(filename,buffer,cb) {
                    const ix = dir.files[filename];
                    if (typeof ix==='number'){
                          // file exists - overwrite is possible
                          const file_url = join( dir.url, filename);
                          updateURLContents (file_url,find_li(filename),buffer,"updatedURLS",function(err,hash) {
                              if (err) return cb(err);
                                 if (ix >=0 ) {
                                     // file no longer in zip - so force to negative index 
                                     dir.files[filename] = 0 - (2+ix);
                                 }
                                 return cb(undefined,hash,file_url);
                          });
                    } else {
                        return cb(new Error("not found"));
                    }
                }
                
                function createFileBuffer(filename,buffer,cb) {
                    const ix = dir.files[ filename ];
                    if (typeof ix==='number'){
                        // file already exists
                        return cb(new Error("file exists"));
                    } else {
                        dir.files[ filename ]=-1;
                        writeFileBuffer(filename,buffer,cb);
                    }
                }
                
                function forceWriteFileBuffer(filename,buffer,cb) {
                    const ix = dir.files[ filename ];
                    if (typeof ix!=='number'){
                        // file doesn't exists - set new file state
                        dir.files[ filename ]=-1;
                    }
                    writeFileBuffer(filename,buffer,cb);
                }
                
                function writeFileText(filename,text,cb) {
                    writeFileBuffer(filename,new TextEncoder().encode(text),cb);
                }
                
                function createFileText(filename,text,cb) {
                    createFileBuffer(filename,new TextEncoder().encode(text),cb);
                }
                
                function forceWriteFileText(filename,text,cb) {
                    forceWriteFileBuffer(filename,new TextEncoder().encode(text),cb);
                }
                
                
                
                function writeFileAssociatedBuffer(filename,assoc,buffer,cb) {
                    const file_url = join(dir.url,filename,assoc);
                    updateURLContents (file_url,undefined,buffer,"updatedMetadata",function(err,hash) {
                        if (err) return cb(err);
                        return cb (undefined,file_url);
                    });
                }
                
                function writeFileAssociatedText(filename,assoc,text,cb) {
                    writeFileAssociatedBuffer(filename,assoc,new TextEncoder().encode(text),cb);
                }
                
                function readFileAssociatedBuffer(filename,assoc,cb) {
                      const file_url = join(dir.url,filename,assoc);
                      fetchUpdatedURLContents(file_url,undefined,false,"updatedMetadata",function(err,buffer){
                           if (err) return cb(err);
                           return cb (undefined,buffer,file_url);
                      });
                } 
                
                function readFileAssociatedText(filename,assoc,cb) {
                    readFileAssociatedBuffer(filename,assoc,function(err,buffer,file_url) {
                        if (err) return cb(err);
                        return cb(undefined,new TextDecoder().decode(buffer),file_url);
                    });
                }
    
                function removeFileAssociatedData (filename,assoc,cb) {
                    const file_url = join(dir.url,filename,assoc);
                    removeUpdatedURLContents (file_url,undefined,"updatedMetadata",function(err) {
                        if (err) return cb(err);
                        return cb (undefined,file_url);
                    });
                }
                
    
                function onDOMContentLoaded (){
                
                    const showHidden=document.querySelector("h1 input.hidden_chk");
                    if (showHidden) {
                        showHidden.onchange = function() {
                            qs("ul").classList[showHidden.checked?"remove":"add"]("hide_hidden");
                        };
                    }
                    
                    const showPaths=qs("h1 input.fullpath_chk");
                    if (showPaths) {
                        showPaths.onchange = function() {
                           qs("ul").classList[showPaths.checked?"remove":"add"]("hide_full_path");
                        };
                    }
                    
                    
                    const fs_api = ml.i.devClassLib().fs_api;
                    
                    const enterFS = qs ("h1 a.fullscreen",function click(){
                        if (!fs_api.isFullscreen()) {
                          fs_api.enterFullscreen();
                        }
                    });
                    const exitFS = qs ("h1 a.exit-fullscreen",function click(){
                           if (fs_api.isFullscreen()) {
                             fs_api.exitFullscreen();
                           }                                      
                    });
                    
                    
                    qs("#img_dl_link",function click(){
                        pwa.getPNGZipImage(dir.zips[0],"files",dir.url,qs("#show_dl_img"),qs("#img_dl_link2"),"download");
                    });
                    
    
                    [].forEach.call(document.querySelectorAll("li > a.code"),addToggleEditorClick);
                    [].forEach.call(document.querySelectorAll("li > a.close-editor"),addCloseEditorClick);
                    [].forEach.call(document.querySelectorAll("li > a.image"),addViewImageClick);
                    [].forEach.call(document.querySelectorAll("li > a.fullscreen"),addZoomClick);
                    [].forEach.call(document.querySelectorAll("li > a.exit-fullscreen"),addZoomClick);
                    [].forEach.call(document.querySelectorAll("li > a.other"),addViewClick);
                    [].forEach.call(document.querySelectorAll("li > a.zipfile"),addOpenZipViewClick);
                    [].forEach.call(document.querySelectorAll("li > a.deletefile"),addDeleteClick);
                    [].forEach.call(document.querySelectorAll("li > a.undeletefile"),addUndeleteClick);
                    [].forEach.call(document.querySelectorAll("li > a.undo-edits"),addUndoEditsClick);
                    [].forEach.call(document.querySelectorAll("li > a.save-edits"),addSaveEditsClick);

                    
                    setupDragAndDrop();
                    
                 
                    if (editor_channel) {
                    
                            getStylesheets(editor_channel,dir.url,function(urls){
                                
                                available_css.splice(0,available_css.length);
                                
                                available_css.push.apply(available_css,urls.map(function(u){
                                    return (dir.alias_root ? dir.alias_root :'' ) +  u.substr(dir.url.length+1);
                                }));
                                
                                //console.log({available_css});
                                
                                getScripts(editor_channel,dir.url,function(urls){
                                    
                                    available_scripts.splice(0,available_scripts.length);
                                    
                                    available_scripts.push.apply(available_scripts,urls.map(function(u){
                                        return (dir.alias_root ? dir.alias_root :'' ) +  u.substr(dir.url.length+1);
                                    }));
                                    
                                    
                                    getHtmls(editor_channel,dir.url,function(html_urls){
                                        
                                        available_html.splice(0,available_html.length);
                                        
                                        available_html.push.apply(available_html,html_urls.map(function(u){
                                            return (dir.alias_root ? dir.alias_root :'' ) +  u.substr(dir.url.length+1);
                                        }));
                                        
                                        
                                        //console.log({available_html});
                                        
                                        available_css
                                           .concat(
                                              available_html.filter(function(h){return h.slice(-5)===".html"}),
                                              available_scripts)
                                                .forEach(function(livefile){
                                                    const li = find_li(livefile);
                                                    if (li) {
                                                        li.classList.add( livefile.slice(-4)==='.css' ? 'live-edit' : 'live-refresh' );
                                                    }
                                        });
                                        
                                        
                                        html_urls.forEach(function(u,ix){
                                            if (u.slice(-5)!==".html") {
                                                pwa.fixupUrl(u,function(err,entry){
                                                    if (err) return;
                                                    if (entry) {
                                                        if (entry.fixup_url ) {
                                                           
                                                            if (entry.fixup_url.indexOf(dir.url)===0) { 
                                                                const uri = (dir.alias_root ? dir.alias_root :'' ) +  entry.fixup_url.substr(dir.url.length+1);
                                                                const li = find_li(uri);
                                                                if (li) {
                                                                    available_html[ix] = uri;
                                                                    li.classList.add( 'live-refresh' );
                                                                }
                                                            }
                                                        }
                                                    }
                                                });
                                            }
                                        });
                                    
                                    });
                                
                                });
                                
                            });
                            
                            
                    }
                    
                    
                    window.addEventListener('beforeunload', function (event)  {
                      if ( errorsExist () ) {
                        qs('html').classList.add("before_unload"); 
                        setTimeout(function(){
                            setTimeout(function(){
                                qs('html').classList.remove("before_unload"); 
                            },30000);
                        },10);
                        event.returnValue = 'There are uncorrected errors in open editors. Sure you want to leave?';
                      }
                    });
                    
                    
                }
                
                function setupDragAndDrop() {
                
                    let dropArea = document.getElementById('drop-area');
                    
                    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                      dropArea.addEventListener(eventName, preventDefaults, false);
                      document.body.addEventListener(eventName, preventDefaults, false)
                    });
                    
                    
                    ['dragenter', 'dragover'].forEach(addEvent(highlight));
                    ['dragleave', 'drop'].forEach(addEvent(unhighlight));
    
                    function addEvent(fn) {
                        return function (eventName) {
                            dropArea.addEventListener(eventName, fn, false);
                        }
                    }
                    
                    function highlight(e) {
                      dropArea.classList.add('highlight');
                    }
                    
                    function unhighlight(e) {
                      dropArea.classList.remove('highlight');
                    }
                    
                   dropArea.addEventListener('drop', handleDrop, false);
                   
                   function handleDrop(e) {
                     let dt = e.dataTransfer
                     let files = dt.files
                   
                     handleFiles(files)
                   }
                   
                    function handleFiles(files) {
                      ([...files]).forEach(uploadFile)
                    }
                    
                    
                    function uploadFile(file) {
                        const filename = dir.alias_root + file.name;
                        file.arrayBuffer().then (function(buffer){
                            
                            console.log(filename,"<- uploading to--",buffer);
                            
                            if (zip_files.indexOf(filename)<0) {
                                zip_files.push(filename);
                            }
                            
                            const entry = dir.files[filename] = {
                                url_write : join(dir.url,filename)
                            };
                            entry.url_read  = entry.url_write; 
                           
                            writeFileBuffer(filename,buffer,function(err,hash){
                                
                                
                            });
                                
                           
    
                        });
                    }
                    
                }
                
                function preventDefaults (e) {
                  e.preventDefault()
                  e.stopPropagation()
                }
                
                function addDeleteClick (el) {
                    if (el) {
                      el.addEventListener("click",deleteClick);
                    }
                }
                
                function addUndeleteClick (el) {
                    if (el) {
                      el.addEventListener("click",undeleteClick);
                    }
                }
                
    
                function addUndoEditsClick (el) {
                    if (el) {
                      el.addEventListener("click",undoEditsClick);
                    }
                }
                
               
                
                
                function addOpenEditorClick (el) {
                    if (el) {
                      el.addEventListener("click",openEditorClick);
                    }
                }
                
                function addToggleEditorClick (el) {
                    if (el) {
                      el.addEventListener("click",toggleEditorClick);
                    }
                }
                
                function addCloseEditorClick (el) {
                    if (el) {
                      qs(el,"a i").addEventListener("click",closeEditorBtnClick);
                    }
                }
                
                function addSaveEditsClick (el) {
                    if (el) {
                      el.addEventListener("click",saveEditsClick);
                    }
                }
                
                
                
                function addViewImageClick (el) {
                    if (el) {
                      el.addEventListener("click",viewImageBtnClick);
                    }
                }
                
                function addZoomClick (el) {
                    if (el) {
                      qs(el,"a i").addEventListener("click",zoomBtnClick);
                    }
                }
                
                function addViewClick (el) {
                    if (el) {
                        el.addEventListener("click",viewBtnClick);
                       // el.parentElement.addEventListener("click",viewBtnClick);
                    }
                }
                
                function addOpenZipViewClick (el) {
                    if (el) {
                        el.addEventListener("click",openZipBtnClick);
                       // el.parentElement.addEventListener("click",openZipBtnClick);
                    }
                }
                
                function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
               
                function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}
                
                function  zoomBtnClick( e ) {
                    e.stopPropagation();
                    
                    toggleEditorZoom( findFilename(e.target) );
                    
                }
    
                function openEditorClick(e){
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    openInbuiltEditor ( filename,li )
                }
                
                function closeEditorBtnClick(e) {
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    if (e.shiftKey) {
                        open_file(filename);
                    } else {
                        closeInbuiltEditor ( filename,li )
                    }
                    
                }
                
                function saveEditsClick(e) {
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    saveInbuiltEditorChanges ( filename,li);
                }
                
                
                function toggleEditorClick(e){
                    if (!e.shiftKey && zoomEl) {
                        zoomBtnClick( e ) ;
                    } else {
                       e.stopPropagation();
                    }
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    if (e.shiftKey) {
                        open_file(filename);
                    } else {
                        toggleInbuiltEditor ( filename,li );
                    }
                }
            
                function undoEditsClick( e) {
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    
                    
                    
                    removeUpdatedFile (filename);

                   
                   refreshStylesheeet(filename,function() {
                       if (li) {
                           // if the editor is open an editor id will exist in the li element 
                           if (!!li.dataset.editor_id) {
                               
                               if (zip_files.indexOf(filename)<0) {
                                  // this was a new file.
                                  closeInbuiltEditor(filename,li,function(){
                                       li.parentElement.removeChild(li);
                                  });
                                 
                                  
                               } else {
                                   // note - opening an already open editor just returns the li_ed element
                                  openInbuiltEditor (filename,li).reload();
                                  li.classList.remove("edited");
                                 
                               }
                           } else {
                               
                               if (zip_files.indexOf(filename)<0) {
                                  // this was a new file.
                                  li.parentElement.removeChild(li);
                                  
                               } else {
                                   // note - opening an already open editor just returns the li_ed element
                                  li.classList.remove("edited");
                               }
                           }
                       }
                   });
                   
                      
                    
                }
                
                function editInZedClick (e) {
                    e.stopPropagation();
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    const dir_prefix = (zip_virtual_dir ? zip_virtual_dir  : full_zip_uri) + '/';
                       li.classList.add("editing");
                       
                        modified_files[filename]=1;
                        
                        self.editInZed(
                           
                           dir_prefix+filename.replace(alias_root_fix,''),    
                           
                           zip_files.map(function (fn){ return dir_prefix+fn.replace(alias_root_fix,'');}),
    
                           function(){
                           
                        });
                }
    
                function viewImageBtnClick(e) {
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    const nextSib = li.nextSibling;
                    if (li.classList.contains("editing") && (!nextSib || (nextSib &&  nextSib.classList.contains("image_viewer"))) ) {
                        li.parentElement.removeChild(li.nextSibling);
                        li.classList.remove("editing");
                    } else {
                        const img = document.createElement("img");
                        const newLi = document.createElement("li");
                        newLi.classList.add("image_viewer");
                        newLi.appendChild(img);
                        li.parentElement.insertBefore(newLi,nextSib);
                        img.src = join(dir.url,filename);
                        li.classList.add("editing");
                        
                    }
                }
                
                function findFilename(el ) {
                    return el && el.dataset &&  el.dataset.filename ? el.dataset.filename.replace(/(^\/)/,'') : el ? findFilename(el.parentElement )  : false;
                }
                
                function deleteClick(e) {
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
    
                   if (li && !li.classList.contains("deleted")) {
                       closeInbuiltEditor(filename,li,function(){
                           toggleDeleteFile(filename,function(err,msg){
                               if (err) return;
                               li.classList[msg.deleted?"add":"remove"]('deleted');
                               li.classList[msg.deleted?"add":"remove"]('hidden');
                               li.classList.remove("editing");
                           });
                       });    
                       
                   }
                }
                
                function undeleteClick(e) {
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    const li = find_li(filename);
                    
                       
                       if (li && li.classList.contains("deleted")) {
                           closeInbuiltEditor(filename,li,function(){
                               toggleDeleteFile(filename,function(err,msg){
                                   if (err) return;
                                   li.classList[msg.deleted?"add":"remove"]('deleted');
                                   li.classList[msg.deleted?"add":"remove"]('hidden');
                                   li.classList.remove("editing");
                               });
                           });    
                           
                       }
                }
               
                function onEditorClose () {
                    Object.keys(modified_files).forEach(function(file){
                        const li = find_li(file);
                        if (li) {
                            li.classList.remove("editing");
                        }
                        delete modified_files[file];
                    });
                }
                
                function find_li (file) {
                      const anchor = qs('li[data-filename="'+file.replace(/^\//,'')+'"]');
                      return anchor && anchor;
                }
    
                function viewBtnClick(e){
                    e.stopPropagation();
                    const filename = findFilename(e.target);
                    open_file (filename);
                }
                
                function openZipBtnClick(e){
                    
                       if (!e.shiftKey) {
                           return;
                       }
                       
                        e.stopPropagation();
                        const link      = e.target.href ? e.target : e.target.parentElement ;
                        open_url(link.href);
                }
                
                function open_file (fn,cb) {
                    
                   
                    
                    const ext = fn.substr(fn.lastIndexOf('.')+1);
                    const custom_url_openers = {
                        md   : open_markdown,
                        svg  : open_svg,
                        html : view_html
                    };
                    const not_custom = function (fn) {
                       const file_url = join(dir.url,fn); 
                       return open_url (file_url,cb) ;       
                    };
                    
                    return (custom_url_openers[ext] || not_custom) (fn,cb);
                }
               
                function open_html (html,filename,tmp_name,cb) {
                    console.log("creating temp file",filename,tmp_name);
                    
                    var api = {
                        
                          update : function(content){
                              if (api.win) {
                                  api.win.document.body.innerHTML = content; 
                              }
                              
                          },
                          close : function () {
                              if (cb) {
                                  cb("closed");
                              }
                              cb = undefined;
                              if (api.win) api.win.close() ;
                          },
                          reload: function () {
                              if (api.win) {
                                  api.ignore_close  = true;
                                  api.win.location.reload();
                              }
                          },
                          goto : function (url) {
                              if (api.win) {
                                  //api.ignore_close  = true;
                                  api.win.location.replace(url);
                              }
                          } 
                          
                          
                    };
                     
                        
                    writeFileAssociatedText(filename,tmp_name,html,function(err,file_url){
                        
                        if (err) {
                            return ;
                        }
                        console.log("opening temp url",filename,tmp_name);
                        api.win = open_url(file_url,function(ev,w){
                            api.win=w;
                            switch (ev) {
                                case "opened" : {
                                        console.log("window opened for",file_url)
                                        setTimeout(function(){
                                            
                                            removeUpdatedURLContents(file_url,undefined,"updatedMetadata",function(){
                                                console.log("removed temp file",file_url);
                                                if (cb) {
                                                    cb("opened",file_url);
                                                }
                                            });
                                        },500);
                                        
                                    }
                                    break;
                                case "closed" : {
                                    if (api.ignore_close) {
                                        delete api.ignore_close;
                                    } else {
                                        delete api.win;
                                        if (cb) {
                                            cb("closed",file_url);
                                        }
                                    }
                                    break;
                                }
                                
                            }
                        });
                        
                    });
                    
                    return api;
                }
                
                function open_markdown (filename) {
                    var converter = new MarkdownConverter();
                    
                    readFileText(filename,function(err,buffer,updated,hash,text){
                        let win;
                        if (err) {
                            return;
                        } else {
                            const html  = converter.makeHtml(text);
                            win = open_html (
                                html,
                                filename,
                                Math.random().toString(36).substr(-8)+ ".html",
                                function(state,file_url){
                                // window closed so remive edit hook
                                switch (state) {
                                    // add edit hook to update text due to editing.
                                    case "opened" : return addEditHook(file_url,onedit);
                                    case "closed" : return removeEditHook(file_url,onedit);
                                }
                            });
                        }
                        
                        function onedit(cmd,file_url,text) {
                            if (win) {
                                win.update(converter.makeHtml(text));
                            }
                        }
                    });
                }
                
                function view_html (filename) {
                    readFileText(filename,function(err,buffer,updated,hash,html){
                        let win;
                        if (err) {
                            return;
                        } else {
                            win = open_html (
                                html,
                                filename, 
                                Math.random().toString(36).substr(-8)+ ".html" ,
                                function(state,file_url){
                                // window closed so remive edit hook
                                switch (state) {
                                    // add edit hook to update text due to editing.
                                    case "opened" : 
                                        win.goto(file_url);
                                        return addEditHook(file_url,onedit);
                                    case "closed" : 
                                        
                                        return removeEditHook(file_url,onedit);
                                }
                            });
                        }
                        
                        function onedit(cmd,file_url,text) {
                            if (win) {
                                win.reload();
                            }
                        }
                    });
                }
                
                function addEditHook (file_url,fn) {
                    if (typeof fn=='function') {
                        const list = edit_hooks[file_url];
                        if (list) {
                           if (list.indexOf(fn)<0) {
                               list.push(fn);
                           }
                        } else {
                           edit_hooks[file_url] = [fn];
                        }
                    }
                }
                
                function removeEditHook (file_url,fn) {
                    if (typeof fn=='function') {
                        
                        const list = edit_hooks[file_url];
                        if (list) {
                            let ix = list.indexOf(fn);
                            while (ix>=0) {
                                list.splice(ix,1);
                                ix = list.indexOf(fn);
                            }
                            if (list.length===0) {
                                delete edit_hooks[file_url];
                            }
                        }
                    }
                }
                
                function open_svg (filename) {
                    
                    readFileText(filename,function(err,buffer,updated,hash,svg){
                        if (err) {
                            return;
                        } else {
                            
                            const 
                            html  = [
                                '<html>',
                                '<head>',
                                '<title>',
                                filename,
                                '</title>',
                                '</head>',
                                '<body>',
                                 svg,
                                 '</body>',
                                 '/html>'
                                ].join('\n');
                                
                            return open_html (
                                html,
                                filename,
                                Math.random().toString(36).substr(-8)+ ".html" 
                            );
    
                        }
                    });
                }
    
                function startEditHelper(li,url,withContent,cb) {
                    
                    const is_live= li.classList.contains('live-edit') || li.classList.contains('live-refresh');
                    if (is_live) {
                        const ext = url.substr(url.lastIndexOf('.')+1);
                        ({
                            css  : openStylesheetHelper,
                            html : openHtmlHelper,
                            js   : openJSHelper
                            
                        }[ext] || function(){ cb();})(editor_channel,url,withContent,cb);
                    } else {
                        cb();
                    }
                }
                
                function getStylesheets(editor_channel,urlprefix,cb) {
                    const replyId = Date.now().toString(36).substr(-6)+"_"+Math.random().toString(36).substr(-8);
                    
                    editor_channel.addEventListener("message",msgCB);
                    
                    editor_channel.postMessage({
                        get_stylesheets:{
                            urlprefix:urlprefix,   
                            replyId:replyId
                        }
                    });
                    
                   
                    function msgCB( event ) {
                       if (event.data && event.data.replyId===replyId) {
                            cb(event.data.result);
                            editor_channel.removeEventListener("message",msgCB);
                       } 
                    }
                }
                
                function getScripts(editor_channel,urlprefix,cb) {
                    const replyId = Date.now().toString(36).substr(-6)+"_"+Math.random().toString(36).substr(-8);
                    
                    editor_channel.addEventListener("message",msgCB);
                    
                   editor_channel.postMessage({
                       get_scripts:{
                           urlprefix:urlprefix,   
                           replyId:replyId
                       }
                   });
                   
                   
                    function msgCB( event ) {
                       if (event.data && event.data.replyId===replyId) {
                            cb(event.data.result);
                            editor_channel.removeEventListener("message",msgCB);
                       } 
                    }
                }
                
                function getHtmls(editor_channel,urlprefix,cb) {
                    const replyId = Date.now().toString(36).substr(-6)+"_"+Math.random().toString(36).substr(-8);
                    
                    editor_channel.addEventListener("message",msgCB);
                    
                   editor_channel.postMessage({
                       get_htmls:{
                           urlprefix:urlprefix,   
                           replyId:replyId
                       }
                   });
                   
                   
                    function msgCB( event ) {
                       if (event.data && event.data.replyId===replyId) {
                            cb(event.data.result);
                            editor_channel.removeEventListener("message",msgCB);
                       } 
                    }
                }
                
                
                function refreshStylesheeet(filename,cb) {
                    if(available_css.indexOf(filename)<0||!editor_channel) {
                        return cb ();
                    }
                    
                    const file_url = (dir.url,filename); 
                    
                    readFileText(filename,function(err,buffer,updated,hash,withCSS){
                        openStylesheetHelper(editor_channel,file_url,withCSS,function(obj) {  
                            obj.close(true);
                            cb();
                        });
                    });
                }
                
    
                function ResizeWatcher () {
                    
                   const observer = new ResizeObserver(onResized);
                   const watched = [];
                   const dataForEl = function(el,force) {
                       const ix = watched.findIndex(function(data){
                          return data.el===el; 
                       });
                       if (ix <0) {
                           if (force===true) {
                               const newData = {
                                   el : el,
                                   watchers  : []
                               };
                               watched.push(newData);
                               observer.observe(el);
                               return newData;
                           }
                           return false;
                       } else {
                           if (force===false) {
                               watched.splice(ix,1);
                               observer.disconnect(); 
                               return;
                           }
                       }
                       return watched[ ix ];
                   };
                   
                   const watcherFor = function(el,fn,force) {
                       const data = dataForEl(el,force);
                       if (data) {
                          const ix = data.watchers.findIndex(function(x){
                              return x.fn===fn;
                          });
                          if (ix<0) {
                              if (force===true) {
                                  const newWatcher = {
                                      fn      : fn,
                                      delay  : 1,
                                      timeout : false
                                  };
                                  data.watchers.push(newWatcher);
                                  return newWatcher; 
                              }
                              return false;
                          } else {
                              if (force===false) {
                                  if (data.watchers[ix].timeout) {
                                      clearTimeout(data.watchers[ix].timeout);
                                  }
                                  data.watchers.splice(ix,1);
                                  return;
                              }
                          }
                          return data.watchers[ix];
                       }
                       return false;
                   }
                   
                   return {
                       on   : function (el,delay,fn) {
                         el = typeof el === 'string' ? qs(el) : el;
                         if (typeof delay==='function') {
                             fn=delay;
                             delay=1;
                         }
                         const w = watcherFor(el,fn,true);
                         w.delay=delay;
                         w.timeout=false;
                       },
                       off : function (el,fn) {
                         el = typeof el === 'string' ? qs(el) : el;
                         watcherFor(el,fn,false);
                       }
                   };
                    
                
                    
                    
                    
                    function onResized(entries,obs) {
                        
                        entries.forEach(function(x){
                            const el = x.target;
                            const data = dataForEl(el);
                            if (data) {
                               data.watchers.forEach(function(w){
                                   
                                   if (w.timeout) clearTimeout(w.timeout);
                                   if (w.delay===0) {
                                       w.timeout=false;
                                       w.fn(el);
                                         
                                   } else {
                                       
                                        w.timeout = setTimeout(function(){
                                            w.timeout=false;
                                            w.fn(el);
                                        },w.delay);    
                                   }
                                   
                               });
                            }
                        });
                        
                    } 
                    
                } 
                
                function openStylesheetHelper(editor_channel,url,withCSS,cb) {  
                    const replyId = Date.now().toString(36).substr(-6)+"_"+Math.random().toString(36).substr(-8);
                    editor_channel.postMessage({
                        open_stylesheet:{
                            url:url,   
                            withCSS:withCSS,
                            replyId:replyId
                        }
                    });
                    
                    const obj = {
                        update : function (updatedCSS) {
                            
                            editor_channel.postMessage({
                                update_stylesheet:{
                                    url:url,   
                                    updatedCSS:updatedCSS,
                                    replyId:replyId
                                }
                            });
                            
                        },
                        close : function (reload) {
                            
                            editor_channel.postMessage({
                                close_stylesheet:{
                                    url:url,   
                                    reload:reload,
                                    replyId:replyId
                                }
                            });
                            editor_channel.removeEventListener("message",onMsg);
                        },
                        onchange : function () {
                            
                        }
                        
                    };
                    
                    editor_channel.addEventListener("message",onMsg);
                    
                    return obj;
                    
                    
                    function onMsg(event){
                        if (event.data && event.data.replyId===replyId && typeof event.data.result!=='undefined') {
                            cb (obj);
                        }
                        
                        if (event.data && event.data.replyId===replyId 
                                       && event.data.css_changed 
                                       && event.data.css_changed.url 
                                       && event.data.css_changed.css
                                       &&  typeof obj.onchange=== 'function') {
                                           
                            obj.onchange(event.data.css_changed.url,event.data.css_changed.css);
                        }
                    }
                }
    
                function openHtmlHelper(editor_channel,url,withHTML,cb) {  
                    
                    return cb(); /*
                    
                    const replyId = Date.now().toString(36).substr(-6)+"_"+Math.random().toString(36).substr(-8);
                    editor_channel.postMessage({
                        open_html:{
                            url:url,   
                            withHTML:withHTML,
                            replyId:replyId
                        }
                    });
                    
                    const obj = {
                        update : function (updatedHTML) {
                            
                            editor_channel.postMessage({
                                update_html:{
                                    url:url,   
                                    updatedHTML:updatedHTML,
                                    replyId:replyId
                                }
                            });
                            
                        },
                        close : function (reload) {
                            
                            editor_channel.postMessage({
                                close_html:{
                                    url:url,   
                                    reload:reload,
                                    replyId:replyId
                                }
                            });
                            editor_channel.removeEventListener("message",onMsg);
                        },
                        onchange : function () {
                            
                        }
                        
                    };
                    
                    editor_channel.addEventListener("message",onMsg);
                    
                    return obj;
                    
                    
                    function onMsg(event){
                        if (event.data && event.data.replyId===replyId && typeof event.data.result!=='undefined') {
                            cb (obj);
                        }
                        
                        if (event.data && event.data.replyId===replyId 
                                       && event.data.html_changed 
                                       && event.data.html_changed.url 
                                       && event.data.html_changed.html
                                       &&  typeof obj.onchange=== 'function') {
                                           
                            obj.onchange(event.data.html_changed.url,event.data.html_changed.html);
                        }
                    }
                     cb(); */
                }
    
                function openJSHelper(editor_channel,url,withJS,cb) {  
                
                    cb();
                }
    
                function editorResized(li_ed){
                    
                    li_ed.editor.resize();
                    
                    transientEditorMetaResave(li_ed,250);
                    
                }
                
                 
                function saveEditorMeta(filename,li,editor_id,ed,li_ed,cb) {
                    if (typeof li==='function') {
                        cb=li;
                        li=editor_id=ed=li_ed=undefined;
                    }
                    li=li||find_li (filename);
                    editor_id = editor_id || li.dataset.editor_id;
                    if (editor_id) {
                        ed = ed || qs("#"+editor_id);
                        
                        li_ed = li_ed||ed.parentNode;
                        
                        ace_session_json.serialize(
                            li_ed.editor,
                            ["theme"],{
                                height : ed.offsetHeight
                            },
                            
                        function(err,json){
                            if (err) return cb(err);
                            writeFileAssociatedText(filename,session_data,json,cb);
                        });
                    }
                }
                
                function errorTableData() {
                   let data = [];
                   Object.keys(editorErrors).forEach(function(filename){
                       editorErrors[filename].forEach(function(err){
                           data.push({type:"Error",text:err.text,filename:filename,line:err.row+1,column:err.column});
                       });
                   });
                   Object.keys(editorWarnings).forEach(function(filename){
                       editorWarnings[filename].forEach(function(err){
                           data.push({type:"Warning",text:err.text,filename:filename,line:err.row+1,column:err.column});
                       });
                   });
                   data.sort(function(a,b){
                       if (a.filename===b.filename) {
                           return a.row < b.row ? -1 : a.row > b.row ? 1 : 0;
                       } else {
                           return a.filename < b.filename ? -1 : 1;
                       }
                   });
                   data.forEach(function(x,ix){x,x.id=ix+1;});
                   return data;
                }
                
                function updateErrorsTable(cb) {
                    const data = errorTableData();
                    if (data.length === 0) {
                        if (errorsTable) {
                            errorsTable.clearData();
                            const el  = qs("#errors_table");
                            el.innerHTML="";
                            el.className= "";
                            errorsTable = undefined;
                        }
                        return;
                    }
                    
                    if(!errorsTable) {
                        errorsTable = new Tabulator("#errors_table", {
                            data:data,
                            autoColumns:true,
                            autoColumnsDefinitions:[
                                {title:"Error/Warning",  field:"type",}, 
                                {title:"Filename",       field:"filename",}, 
                                {title:"Message",        field:"text",}, 
                                {title:"Line",           field:"row"}, 
                                {title:"Column",         field:"column"}, 
                            ],
                            rowClick:function(e, row){
                               e.preventDefault();
                               const li = find_li(row._row.data.filename);
                               //const file_url = join(dir.url,row._row.data.filename); 
                               let editor_id = li.dataset.editor_id;
                               if (editor_id) {
                                   const ed = qs("#"+editor_id);
                                   const li_ed = ed.parentNode;
                                   const editor = li_ed.editor;
                                   editor.resize(true);
                                   editor.scrollToLine(row._row.data.line, true, true, function () {});
                                   editor.gotoLine(row._row.data.line, row._row.data.column, true);
                                   editor.focus();
                                   li_ed.scrollIntoView();
                               }
                            }
                        });
                        cb(errorsTable);
                    } else {
                        errorsTable.clearData();
                        errorsTable.updateOrAddData (data).then(function(){
                            cb(errorsTable);
                        });
                    }
                }
                

                function transientEditorMetaResave(li_ed,delay,annot) {
                    if (li_ed.transient_timeout) clearTimeout(li_ed.transient_timeout);
                    
                    let errors = false;
                    let warnings = false;
                    
                    if (annot) {
                        const error_list   = editorErrors [ li_ed.filename ]   || (editorErrors   [ li_ed.filename ] = [] );
                        const warning_list = editorWarnings [ li_ed.filename ] || (editorWarnings [ li_ed.filename ] = [] );
                        error_list.splice(0,error_list.length);
                        warning_list.splice(0,warning_list.length);
                        const grab = function (l,x){
                            l.push ({row:x.row,column:x.column,text:x.text});
                        };
                        for (var key in annot){
                            if (annot.hasOwnProperty(key)) {
                                if  (annot[key].type === "warning") {
                                    grab(warning_list,annot[key]);
                                    warnings = true;
                                }
                                if  (annot[key].type === "error") {
                                    grab(error_list,annot[key]);
                                    errors = true;
                                }
                            }
                        }
                        
                        if (warning_list.length===0) {
                            delete editorWarnings[ li_ed.filename ];
                        }
                        
                        if (error_list.length===0) {
                            delete editorErrors[ li_ed.filename ];
                        }
                        
                        const li=find_li(li_ed.filename);
                        
                        li.classList[ error_list.length > 0 ? "add" : "remove" ]("errors");
                        
                        li.classList[ error_list.length > 0 ? "add" : "remove" ]("warnings");
                        
                            
                        qs("html").classList[  errorsExist () ?"add":"remove"]("errors");
                        
                        updateErrorsTable(function(){
                            
                        });
                        
                    } else {
                        errors = null;
                    }
                    
                    
    
                    li_ed.transient_timeout = setTimeout(function(li_ed){
                        delete li_ed.transient_timeout;
                        saveEditorMeta(li_ed.filename,function(){
                             
                        });
                    },delay||(errors?15000:2000),li_ed);
                    return errors===false;
                }
                
                
    
                function openInbuiltEditor (filename,li,cb,height,textContent) {
                    li=li||find_li (filename);
                    const file_url = join(dir.url,filename); 
                    let editor_id = li.dataset.editor_id;
                    if (!editor_id) {
                        while (true) {
                           editor_id = 'ed_'+Math.random().toString(36).substr(-8);
                           if (!qs("#"+editor_id)) break;
                        }
                        li.dataset.editor_id =  editor_id;
                        li.classList.add("editing");
                        const li_ed = document.createElement("li");
                        li_ed.innerHTML = ['<pre id="','"></pre><div class="grab_bar" id="','_grab_bar"></div>'].join(editor_id); 
                        li_ed.filename= filename;
                        
                         
                        li.parentNode.insertBefore(li_ed, li.nextSibling);
                        
                        
                        li_ed.editor = ace.edit(editor_id, {
                            theme:   aceThemeForFile(filename),
                            mode:    aceModeForFile(filename),
                        });
                        
                       
                        li_ed.sizebar = dragSize("#"+editor_id,["#"+editor_id+"_grab_bar"]);
                       
                        
                          readFileText(filename,function(err,buffer,updated,hash,text){
                            const currentText = textContent || text;
                            
                            if (err) {
                                li_ed.editor.session.setValue("error:"+err.message||err);
                            } else {
                                
                                readFileAssociatedText(filename,session_data,function(err,sess_json){
                                         
                                    if (sess_json) {
                                        
                                         ace_session_json.deserialize(li_ed.editor,sess_json,function(err,data){
                                             
                                              if (err || (li_ed.editor.session.getValue() !==currentText) ) { 
                                                  li_ed.editor.session.setValue(currentText);
                                              }
                                              
                                              if (height) {
                                                  if (height!=="skip") {
                                                     qs("#"+editor_id).style.height=""+height+"px";
                                                     li_ed.editor.resize();
                                                  }
                                              } else {
                                                  if (data && data.height) {
                                                      qs("#"+editor_id).style.height=""+data.height+"px";
                                                      li_ed.editor.resize();
                                                  }
                                              }
                                              proceed();
                                         });
                                        
    
                                    } else {
                                        li_ed.editor.session.setValue(currentText);
                                        proceed();
                                    }
                                   
                                   
                                    function proceed () {
                                        
                                        li_ed.hashDisplay = qs(li,".sha1");
                                        li_ed.hashDisplay.textContent=hash;
                                        li_ed.setText = function (text) {
                                            li_ed.editor.session.off('change', li_ed.inbuiltEditorOnSessionChange);
                                            li_ed.editor.setValue(text);
                                            li_ed.editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                                            if (li_ed.edit_helper) {
                                                li_ed.edit_helper.update(text);
                                            }
                                            if (edit_hooks[file_url]) {
                                                const buffer = new TextEncoder().encode(text);
                                                edit_hooks[file_url].forEach(function(fn){
                                                    fn("setText",file_url,text,buffer);
                                                });
                                            }
                                            li.classList.remove("pending");
                                        };
                                        
                                        li_ed.reload = function () {
                                            readFileText(filename,function(err,buffer,updated,hash,text){
                                                li_ed.setText(text);
                                                if (li_ed.edit_helper) {
                                                    li_ed.edit_helper.update(text);
                                                }
                                                if (edit_hooks[file_url]) {
                                                    edit_hooks[file_url].forEach(function(fn){
                                                        fn("reload",file_url,text,buffer);
                                                    });
                                                }
                                                li.classList.remove("pending");
                                            });
                                        };

                                        li_ed.changeAnnotationFunc = function (force,cb){
                                                
                                            // to ignore callback after destruction, the li_ed.changeAnnotationFunc
                                            // is deleted before calling editor.destroy();
                                            // so we test li_ed.changeAnnotationFunc is definedl before continuing
                                            if (li_ed.changeAnnotationFunc) {
                                                
                                                if (typeof li_ed.annotationsWorkerDetect === 'number') {
                                                    // if it's a number, it's because the annotation change beat the time out
                                                    // so kill the timeout, which will otherwise end up setting annotationsWorkerDetect to false
                                                    clearTimeout(li_ed.annotationsWorkerDetect);
                                                    li_ed.annotationsWorkerDetect=true;
                                                }
                                                li.classList.remove("worker");
                                                if (transientEditorMetaResave(li_ed,5000,li_ed.editor.getSession().getAnnotations())||force===true) {
                                                   

                                                    if (li_ed.text_changed||force===true) {
                                                        
                                                       li_ed.text_changed=false;
                                                       const  textContent = li_ed.editor.session.getValue();
                                                       writeFileText(filename,textContent,function(err,hash){
                                                            if (err) {
                                                                return ;
                                                            }
                                                            li.classList.add("edited");
                                                            li_ed.hashDisplay.textContent=hash;
                                                            if (edit_hooks[file_url]) {
                                                                edit_hooks[file_url].forEach(function(fn){
                                                                    fn("edited",file_url,textContent,buffer);
                                                                });
                                                            }
                                                            
                                                            li.classList.remove("pending");
                                                            
                                                            if (typeof cb==='function') {
                                                                cb();
                                                            }

                                                        });
                                                    }
                                                } else {
                                                    delete ignoreErrors[filename];
                                                    qs("html").classList[  errorsExist () ?"add":"remove"]("errors");
                                                }
                                                
                                                
                                            }
                                            
                                        }
                                        li_ed.editor.getSession().on("changeAnnotation", li_ed.changeAnnotationFunc );
                                        
                                       
                                        
                                         
    
                                        startEditHelper(li,file_url,currentText,function(helper){
                                                li_ed.edit_helper = helper;
                                                li_ed.inbuiltEditorOnSessionChange = function () {
                                                    
                                                    // to ignore callback after destruction, the li_ed.inbuiltEditorOnSessionChange
                                                    // is deleted before calling editor.destroy();
                                                    // so we test li_ed.inbuiltEditorOnSessionChange is defined before continuing
                                                    li.classList.add("pending");
                                                    qs('html').classList.remove("before_unload"); 
                                                    
                                                    li.classList[li_ed.annotationsWorkerDetect===false?"remove":"add"]("worker");
                                                    
                                                    
                                                    if (li_ed.inbuiltEditorOnSessionChange ) {
                                                       
                                                    
                                                        if (li_ed.annotationsWorkerDetect===undefined) {
                                                                // this is either the first change, or a change
                                                                // after an annotations worker callback
                                                                li_ed.annotationsWorkerDetect = setTimeout(
                                                                  function(){
                                                                      li_ed.annotationsWorkerDetect=false;
                                                                      setTimeout (li_ed.inbuiltEditorOnSessionChange,10);
                                                                  },
                                                                  annotationsWorkerDetectDelay
                                                                );
                                                           
                                                        }
                                                    
                                                        // delta.start, delta.end, delta.lines, delta.action
                                                        const textContent = li_ed.editor.session.getValue();
                                                        if (li_ed.edit_helper) {
                                                            li_ed.edit_helper.update(textContent);
                                                        }
                                                        if (transientEditorMetaResave(li_ed)||li_ed.annotationsWorkerDetect===false) {
                                                           
                                                            writeFileText(filename,textContent,function(err,hash){
                                                                if (err) {
                                                                    return ;
                                                                }
                                                                // since we are saving the text, we can clear the li_ed.text_changed flag
                                                                li_ed.text_changed=false;
                                                                li.classList.add("edited");
                                                                li_ed.hashDisplay.textContent=hash;
                                                                if (edit_hooks[file_url]) {
                                                                    const buffer = new TextEncoder().encode(textContent);
                                                                    edit_hooks[file_url].forEach(function(fn){
                                                                        fn("edited",file_url,textContent,buffer);
                                                                    });
                                                                }
                                                                
                                                                li.classList.remove("pending");
                                                                delete ignoreErrors[filename];
                                                                qs("html").classList[  errorsExist () ?"add":"remove"]("errors");
                                                            });
                                                        } else {
                                                            // since the text has changed, bit has errors, we need to flag it
                                                            // so evnentually it gets saved once errors are corrected
                                                            li_ed.text_changed=true;
                                                        }
                                                        
                                                        
                                                        
                                                        
                                                    
                                                    }
                                               };
                                               
                                               
                                                li_ed.editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                                                li_ed.editor.focus();
                                                resizers.on(li_ed,10,editorResized);
                                                
                                                
                                                
                                                li_ed.editor.resize();
                                                li.classList.remove("pending");
                                                if (cb) {
                                                    cb(li_ed);
                                                }
                                        });
                                       
                                        
                                    }     
                                    
                                    
                                    
                                        
                                }); 
                            }

                        });
                        
                        return li_ed;
                    } else {
                        const ed = qs("#"+editor_id);
                        const li_ed = ed.parentNode;
                       
                        if (cb) {
                            cb(li_ed);
                        }
                  
                        return li_ed;
                    }
                }
                
               
                function closeInbuiltEditor(filename,li,cb) {
                    li=li||find_li (filename);
                    let editor_id = li.dataset.editor_id;
                    if (editor_id) {
                        li.classList.remove("editing");
                        
                        const ed = qs("#"+editor_id);
                        
                        const li_ed = ed.parentNode;
                        
                        saveEditorMeta(filename,li,editor_id,ed,li_ed,function(){
                        
                                resizers.off(li_ed,editorResized);
    
                                li.classList.remove("editing");
                                
                                li_ed.editor.session.off('change',li_ed.inbuiltEditorOnSessionChange);
                                li_ed.editor.session.off("changeAnnotation", li_ed.changeAnnotationFunc );
            
                                delete li_ed.inbuiltEditorOnSessionChange;
                                delete li_ed.changeAnnotationFunc ;
                                
                                li_ed.editor.destroy();
                                
                                li_ed.removeChild(ed);
                                
                                
                                if (li_ed.edit_helper) {
                                    li_ed.edit_helper.close(true);
                                    delete li_ed.edit_helper;
                                }
            
                                
                                
                                delete li_ed.editor;
                                li_ed.hashDisplay.textContent='';
                                delete li_ed.hashDisplay;
                                
                                li_ed.sizebar.destroy();
                                delete li_ed.sizebar;
                                
                                delete li_ed.setText;
                                delete li_ed.reload;
                                delete li.dataset.editor_id;
                                
                                while (li_ed.firstChild) {
                                    li_ed.removeChild(li_ed.firstChild);
                                }
                            
                                
                                li_ed.parentNode.removeChild(li_ed);
                                
                                
                                if (cb) cb();
                                
                            
                        });
    
                    } else {
                        if (cb) {
                            cb();
                        }
                    }
                }
                
                function saveInbuiltEditorChanges(filename,li) {
                     li=li||find_li (filename);
                     let editor_id = li.dataset.editor_id;
                     if (editor_id) {
                         const ed = qs("#"+editor_id);
                         const li_ed = ed.parentNode;
                         li_ed.changeAnnotationFunc && li_ed.changeAnnotationFunc(true,function(){
                             li.classList.remove("save-edits");
                             ignoreErrors[filename]=true;
                             qs("html").classList[  errorsExist () ?"add":"remove"]("errors");
                         });
                     }
                }
                
                function toggleEditorZoom( filename ) {
                    
                    const zoomClass=function(addRemove) {
                        
                       const ed_pre = qs("#"+zoomEl.dataset.editor_id);
                       if (addRemove==="add") {
                          fs_li_ed=ed_pre.parentNode;
                          fs_li_ed.classList.add("zoomingEditor");
                          qs("main").appendChild(ed_pre);
                          fs_li_ed.editor.focus();
                          let c=5,tmr = setInterval(function(n){
                              if (c<0) {
                                  clearTimeout(tmr);
                              } else {
                                  c--;
                                  fs_li_ed.editor.resize();
                              }
                              
                          },50);
                       } else {
                          fs_li_ed.classList.remove("zoomingEditor");
                          fs_li_ed.appendChild(ed_pre);
                          fs_li_ed.editor.focus(); 
                          let c=5,tmr = setInterval(function(n){
                              if (c<0) {
                                  clearTimeout(tmr);
                              } else {
                                  c--;
                                  fs_li_ed.editor.resize();
                              }
                              
                          },50);
                       }
                       
                       ed_pre.classList[addRemove]("fs_editor");
                       zoomEl.classList[addRemove]("zooming");
                       qs('html').classList[addRemove]("zooming");
                       
                    };
                    
                    if (zoomEl) {
                        //move editor to non zoomed ssate 
                        zoomClass("remove");
                        // transfer text content full screen editor
                        const textContent = fs_li_ed.editor.getValue();
                        // save session state and restore height
                        return closeInbuiltEditor ( zoom_filename,zoomEl, function(){
                             openInbuiltEditor ( zoom_filename,zoomEl, function(){
                             },pre_zoom_height,textContent);
                             fs_li_ed= undefined;
                             zoomEl=undefined;
                             pre_zoom_height=undefined;
                        });
                        
                    } else {
                        zoom_filename = filename;
                        const li = find_li(zoom_filename);
                        let editor_id = li.dataset.editor_id;
                        const ed = qs("#"+editor_id);
                        const li_ed = ed.parentNode;
                        pre_zoom_height = ed.offsetHeight;
                        const textContent = li_ed.editor.getValue();
                        return closeInbuiltEditor ( zoom_filename,li, function(){
                             openInbuiltEditor ( zoom_filename,li, function(){
                                 zoomEl = li;
                                 zoomClass("add");
                             },"skip",textContent);
                        });
                         
                    }
                    
                    
                }
                
               
                function toggleInbuiltEditor (filename,li) {
                    li=li||find_li (filename);
                    if (!!li.dataset.editor_id) {
                       closeInbuiltEditor(filename,li);
                    } else {
                       openInbuiltEditor (filename,li);
                    }
                }
                
                
                const linters = {
                    
                };
                
                function lintSource (hash,src,mode,cb) {
                    const lintr = linters[mode];
                    if (lintr) {
                        return lintr.push(hash,src,cb);
                    }
                    linters[mode]=linter (mode);
                    linters[mode].push(hash,src,cb);
                }
                
                
                function linter (mode) {
                    
                    let pre = document.createElement("pre");
                    pre.id = "lint_"+Math.random().toString(36).substr(-8);
                    let div = document.createElement("div");
                   
                    document.body.appendChild(div); 
                    div.appendChild(pre);
                    div.style.display="none";
                    let timeout,hasWorker;
                    let editor = ace.edit(pre.id, {
                        mode: mode
                    });
                    
                     aceModeHasWorker(mode,function(answer){
                        hasWorker = answer;
                        if (hasWorker) {
                            editor.getSession().on("changeAnnotation",onAnnotationChange);
                        } else {
                           
                            editor.getSession().on("change",onChange);
                        }
                    });
                    
                   
                    
                    const srcs = {};
                    const history = {};
                    
                    return {
                        push : push
                    };
                    
                    function next() {
                        const hash = Object.keys(srcs)[0];
                        if (hash) {
                            const x = srcs[hash];
                            if (x && x.src) {
                                editor.getSession().setValue(x.src);
                                sha1(new TextEncoder().encode(editor.getSession().getValue()),function(er,hash2){
                                   if (hash2!==hash) {
                                       throw new Error ("internal error - hash of getValue() does not match hash to setValue()");
                                   } 
                                });
                            }
                        }
                    }
                    
                    function push (hash,src,cb) {
                        if (history[hash]) {
                            return cb.apply(undefined,history[hash]);
                        }
                        srcs[hash]={src,cb};
                        next();
                    }
                    
                    function onChange (){
                       if (timeout) clearTimeout(timeout);
                       timeout = setTimeout(function(){
                           timeout = undefined;
                           onAnnotationChange();
                        },1000);
                    }
                    
                    function onAnnotationChange(){
                        
                        var annot = editor.getSession().getAnnotations();
                        
                        if (annot) {
                            
                            var src   = editor.getSession().getValue();
                            
                            sha1(new TextEncoder().encode(src),function(er,hash){
                               
                              const x = srcs[hash];
                              if (x && x.src && x.cb) {
                                    
                               
                                  let errors ;
                                  let warnings;
                                      
                                  for (let key in annot){
                                      if (annot.hasOwnProperty(key)) {
                                          if  (annot[key].type === "warning") warnings = true;
                                          if  (annot[key].type === "error") errors = true;
                                          if (warnings && errors) break;
                                      }
                                  }
    
                                  history[hash]=[errors,warnings];
                                  x.cb.apply(undefined,history[hash]);
    
                                  delete x.cb;
                                  delete x.src;
                                  delete srcs[hash];
                                  
                                  next();
                              }
                            });
                          
                        } else {
                            throw new Error("getAnnotations() returns "+typeof annot);
                        }
    
                    }
                     
                   
                    
                }
               
                function zipPoller(index) {
                    //main purpose is to keep service worker awake. but while we are doing that, might as well hash each file and display it
                    index = index || 0;
                    if (index < zip_files.length) {
                        const filename = zip_files[index];
                        const li = find_li (filename);
                        if (li) {
                            let editor_id = li.dataset.editor_id;
                            if (editor_id) {
                                // files open in the editor hash themselves
                                setTimeout(zipPoller,1,index+1);
                            } else {
                                const sha_el = qs(li,".sha1");
                                if(sha_el && sha_el.textContent.trim()==='') {
                                    sha_el.textContent='--hashing---';
                                    
                                    
                                    readFileText(filename,function(err,buffer,updated,hash,text){
                                        
                                        if (fileIsEditable(filename)){
                                            sha_el.textContent='--syntax scanning---';
                                            const mode = aceModeForFile(filename);
                                            if (mode) {
                                                lintSource(hash,text,mode,function(errors,warnings){
                                                    li.classList[errors?"add":"remove"]("errors");
                                                    li.classList[warnings?"add":"remove"]("warnings");
                                                    sha_el.textContent = hash;
                                                }); 
                                                setTimeout(zipPoller,1,index+1);
                                            } else {
                                                sha_el.textContent=hash;
                                                setTimeout(zipPoller,1,index+1);
                                            }
                                        } else {
                                            sha_el.textContent=hash;
                                            setTimeout(zipPoller,1,index+1);
                                        }
    
                                    });
                                } else {
                                    setTimeout(zipPoller,1,index+1);
                                }
                            }
                        } else {
                            setTimeout(zipPoller,1,index+1);
                        }
                    } else {
                        setTimeout(zipPoller,500,0); 
                    }
                }
                
                if (["interactive","complete"].indexOf( window.document && window.document.readyState) >=0) {
                    onDOMContentLoaded();
                } else {
                   window.addEventListener('DOMContentLoaded', onDOMContentLoaded);
                }
                
                zipPoller(0);
                
                return lib;
                
            }
        } 
    }, {
        Window: [
            
            ()=>ml.i.pwaWindow,
            ()=>ml.i.zipFSApiLib,
            ()=>ml.i.sha1Lib.cb,
            ()=>ml.i.showdown.Converter
            
        ] 
    }

    );


 

});



