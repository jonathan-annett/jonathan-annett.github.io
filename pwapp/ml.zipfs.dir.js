/* global zip_url_base,zip_virtual_dir,zip_files,full_zip_uri,updated_prefix, alias_root_fix,alias_root, parent_link,BroadcastChannel,ace*/


/* global ml,qs, self,caches,BroadcastChannel,Shell,ResizeObserver  */
ml(`
    
    pwaWindow@Window     | ml.pwa-win.js
    editInZed            | ml.zedhook.js
    sha1Lib              | sha1.js
    htmlFileItemLib      | ml.zipfs.dir.file.js
    htmlFileMetaLib      | ml.zipfs.dir.file.meta.js
    zipFSApiLib          | ml.zipfs.api.js
    showdown             | https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.js
    aceSessionLib        | ml.ace-session.js
    openWindowLib        | ml.openWindow.js
    
    `,function(){ml(2,

    {
        Window: function pwaZipDirListing(pwa,zipFSApiLib,sha1,MarkdownConverter ) {
            
            
            var 
            
            ace_session_json = ml.i.aceSessionLib,
            
            { fileIsEditable,fileIsImage,aceModeForFile,aceThemeForFile } =  ml.i.htmlFileMetaLib,
            
            { open_url   } = ml.i.openWindowLib,
            
            editor_url          = location.href.replace(/\/$/,''),
            editor_channel_name = window.parent ? "ch_"+editor_url.replace(/\/|\:|\.|\-/g,'') : false,
            editor_channel      = editor_channel_name ? new BroadcastChannel(editor_channel_name) : false;
         
            
           
            const pwaApi = zipFSApiLib (pwa,full_zip_uri,zip_virtual_dir,find_li,alias_root_fix,alias_root,updated_prefix);   
                             
            const resizers = ResizeWatcher();
            const available_css = [];
            const available_scripts = [];
            const edit_hooks = {};
           
            
            qs ("h1 a.restart",function click(e) {
                 if (editor_channel) {
                        preventDefaults (e);
                        editor_channel.postMessage({stop:1});
                        setTimeout(function(){
                            window.close();
                        },10);
                 } else {
                     window.location = window.location.pathname.replace(/\/$/,'') +'/stopping?stop-service-worker='+ zip_virtual_dir.replace(location.origin,'');
                 }
            });
            
        
           
           
            
            
            const htmlFileItemLibOpts = {
                uri:zip_url_base.replace(/^\//,''),
                alias_root,
                tools : {
                    isHidden : function() {
                        
                    },
                    isDeleted: function () {
                        
                    },
                },
                zip_files,
                fileisEdited:function(){return true;},
                updated_prefix,
                parent_link,
                hidden_files_exist : false // this gets updated by html_file_item()
            };
            
            const {
                html_file_item,
                get_html_file_item,
                boldit,
                linkit
            }  = ml.i.htmlFileItemLib (htmlFileItemLibOpts);

            
            const modified_files = {};
            const lib = {
               pwaApi : pwaApi
            };
            

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
                

                
                qs("#img_dl_link",function click(){
                    pwa.getPNGZipImage(full_zip_uri,"files",zip_virtual_dir,qs("#show_dl_img"),qs("#img_dl_link2"),"download");
                });
                

                [].forEach.call(document.querySelectorAll("li > a.code"),addOpenEditorClick);
                [].forEach.call(document.querySelectorAll("li > a.close-editor"),addCloseEditorClick);
                [].forEach.call(document.querySelectorAll("li > a.image"),addViewImageClick);
                [].forEach.call(document.querySelectorAll("li > a.fullscreen"),addZoomClick);
                [].forEach.call(document.querySelectorAll("li > a.exit-fullscreen"),addZoomClick);
                [].forEach.call(document.querySelectorAll("li > a.other"),addViewClick);
                [].forEach.call(document.querySelectorAll("li > a.zipfile"),addOpenZipViewClick);
                [].forEach.call(document.querySelectorAll("li > a.deletefile"),addDeleteClick);
                [].forEach.call(document.querySelectorAll("li > a.undeletefile"),addUndeleteClick);
                [].forEach.call(document.querySelectorAll("li > a.undo-edits"),addUndoEditsClick);
                
                setupDragAndDrop();
                
             
                if (editor_channel) {
                
                        getStylesheets(editor_channel,zip_virtual_dir,function(urls){
                            
                            available_css.splice(0,available_css.length);
                            
                            available_css.push.apply(available_css,urls.map(function(u){
                                return (alias_root ? alias_root :'' ) +  u.substr(zip_virtual_dir.length+1);
                            }));
                            
                            console.log({available_css});
                            
                            getScripts(editor_channel,zip_virtual_dir,function(urls){
                                
                                available_scripts.splice(0,available_scripts.length);
                                
                                available_scripts.push.apply(available_scripts,urls.map(function(u){
                                    return (alias_root ? alias_root :'' ) +  u.substr(zip_virtual_dir.length+1);
                                }));
                                
                                console.log({available_scripts});
                            
                            });
                            
                        });
                        
                        
                }
                
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
                    const filename = alias_root +file.name;
                    file.arrayBuffer().then (function(buffer){
                        
                        console.log(filename,"<- uploading to--",buffer);
                        
                        if (zip_files.indexOf(filename)<0) {
                            zip_files.push(filename);
                            
                            
                        }
                        
                        pwaApi.updateURLContents (filename,buffer,true,function(err,hash) {
                            if (err) {
                                
                                return ;
                            }
                           // li_ed.hashDisplay.textContent=hash;
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
                  //el.parentElement.addEventListener("click",deleteClick);
                }
            }
            
            function addUndeleteClick (el) {
                if (el) {
                  el.addEventListener("click",undeleteClick);
                  //el.parentElement.addEventListener("click",undeleteClick);
                }
            }
            
            
            
            function addUndoEditsClick (el) {
                if (el) {
                  el.addEventListener("click",undoEditsClick);
                 // el.parentElement.addEventListener("click",undoEditsClick);
                }
            }
            
            
            
            
            function addOpenEditorClick (el) {
                if (el) {
                  el.addEventListener("click",openEditorClick);
                }
            }
            
            function addCloseEditorClick (el) {
                if (el) {
                  qs(el,"a i").addEventListener("click",closeEditorBtnClick);
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
            
            
            var zoomEl,fs_li_ed;            
            function  zoomBtnClick( e ) {
                e.stopPropagation();
                const filename = findFilename(e.target);
                const zoomClass=function(addRemove) {
                    
                   const ed_pre = qs("#"+zoomEl.dataset.editor_id);
                   if (addRemove==="add") {
                      fs_li_ed=ed_pre.parentNode;
                      fs_li_ed.classList.add("zoomingEditor");
                      qs("main").appendChild(ed_pre);
                      fs_li_ed.editor.resize();
                   } else {
                      fs_li_ed.classList.remove("zoomingEditor");
                      fs_li_ed.appendChild(ed_pre);
                      fs_li_ed.editor.resize();
                      fs_li_ed=undefined;
                   }
                   
                   ed_pre.classList[addRemove]("fs_editor");
                   zoomEl.classList[addRemove]("zooming");
                   qs('html').classList[addRemove]("zooming"); 
                };
                
                if (zoomEl) {
                    zoomClass("remove");
                    zoomEl=undefined;
                } else {
                    zoomEl = find_li(filename);
                    zoomClass("add");
                }
                
            }
            
            function openEditorClick(e){
                e.stopPropagation();
                const filename = findFilename(e.target);
                const li = find_li(filename);
                if (e.shiftKey) {
                    open_file(filename);
                } else {
                    openInbuiltEditor ( filename,li )
                }
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
            
            
            
            function undoEditsClick( e) {
                e.stopPropagation();
                const filename = findFilename(e.target);
                const li = find_li(filename);
                
                
               const file_url = pwaApi.filename_to_url(filename);
               pwaApi.removeUpdatedURLContents(file_url);
               refreshStylesheeet(filename,function() {
                   if (li) {
                       // if the editor is open an editor id will exist in the li element 
                       if (!!li.dataset.editor_id) {
                           
                           if (zip_files.indexOf(filename)<0) {
                              // this was a new file.
                              closeInbuiltEditor(filename,li);
                              li.parentElement.removeChild(li);
                              
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
                const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                const li = btn.parentElement;
                const filename = btn.dataset.filename.replace(/(^\/)/,'');
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
                
            }
            
            function findFilename(el ) {
                return el && el.dataset &&  el.dataset.filename ? el.dataset.filename.replace(/(^\/)/,'') : el ? findFilename(el.parentElement )  : false;
            }
            
            function deleteClick(e) {
                e.stopPropagation();
                const filename = findFilename(e.target);
                const li = find_li(filename);

               if (li && !li.classList.contains("deleted")) {
                   closeInbuiltEditor(filename,li);    
                   pwaApi.toggleDeleteFile(filename,function(err,msg){
                       if (err) return;
                       li.classList[msg.deleted?"add":"remove"]('deleted');
                       li.classList[msg.deleted?"add":"remove"]('hidden');
                       li.classList.remove("editing");
                   });
               }
            }
            
            function undeleteClick(e) {
                e.stopPropagation();
                const filename = findFilename(e.target);
                const li = find_li(filename);
                
                   
                   if (li && li.classList.contains("deleted")) {
                       closeInbuiltEditor(filename,li);    
                       pwaApi.toggleDeleteFile(filename,function(err,msg){
                           if (err) return;
                           li.classList[msg.deleted?"add":"remove"]('deleted');
                           li.classList[msg.deleted?"add":"remove"]('hidden');
                           li.classList.remove("editing");
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
                
                const file_url = pwaApi.filename_to_url(fn);
                
                const ext = fn.substr(fn.lastIndexOf('.')+1);
                const custom_url_openers = {
                    md   : open_markdown,
                    svg  : open_svg,
                    html : view_html
                };
                const not_custom = function (filename,file_url) {
                   return open_url (file_url,cb) ;       
                };
                
                return (custom_url_openers[ext] || not_custom) (fn,file_url);
            }
            
           
            function open_html (html,file_url,cb) {
                console.log("creating temp file",file_url);
                
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
                 
                pwaApi.updateURLContents (file_url ,new TextEncoder().encode(html),true,function(err,hash) {
                    
                    if (err) {
                        return ;
                    }
                    console.log("opening temp url",file_url);
                    api.win = open_url(file_url,function(ev,w){
                        api.win=w;
                        switch (ev) {
                            case "opened" : {
                                    console.log("window opened for",file_url)
                                    setTimeout(function(){
                                        pwaApi.removeUpdatedURLContents(file_url,function(){
                                            console.log("removed temp file",file_url);
                                            if (cb) {
                                                cb("opened");
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
                                        cb("closed");
                                    }
                                }
                                break;
                            }
                            
                        }
                    });
                    
                });
                
                return api;
            }
            
            function open_markdown (filename,file_url) {
                var converter = new MarkdownConverter();
                pwaApi.fetchUpdatedURLContents(file_url,true,function(err,buffer){
                    let win;
                    if (err) {
                        return;
                    } else {
                        const html  = converter.makeHtml(new TextDecoder().decode(buffer));
                        const suffix = Math.random().toString(36)+ ".html";
                        win = open_html (html,file_url+suffix,function(state){
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
            
            function view_html (filename,file_url) {
                pwaApi.fetchUpdatedURLContents(file_url,true,function(err,buffer){
                    let win;
                    if (err) {
                        return;
                    } else {
                        const html  = new TextDecoder().decode(buffer);
                        const suffix = Math.random().toString(36)+ ".html";
                        win = open_html (html,file_url+suffix,function(state){
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
            
            function open_svg (filename,file_url) {
                pwaApi.fetchUpdatedURLContents(file_url,true,function(err,buffer){
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
                             new TextDecoder().decode(buffer),
                             '</body>',
                             '/html>'
                            ].join('\n');
                            
                        const suffix = Math.random().toString(36)+ ".html";
                        return open_html (html,file_url+suffix);

                    }
                });
            }

            function startEditHelper(url,withContent,cb) {
                const ext = url.substr(url.lastIndexOf('.')+1);
                ({
                    css  : openStylesheet,
                }[ext] || function(){ cb();})(editor_channel,url,withContent,cb);
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
            
            
            
            
            
            function refreshStylesheeet(filename,cb) {
                if(available_css.indexOf(filename)<0||!editor_channel) {
                    return cb ();
                }
                
                const file_url = pwaApi.filename_to_url(filename);
                pwaApi.fetchUpdatedURLContents(file_url,true,function(err,text,updated,hash){
                    const withCSS = new TextDecoder().decode(text);
                    openStylesheet(editor_channel,file_url,withCSS,function(obj) {  
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
                           observer.unobserve(el);
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
            
            function openStylesheet(editor_channel,url,withCSS,cb) {  
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
            
            
            function editorResized(li_ed){
                
                return li_ed.editor.resize();
                
                var resizeEvent = window.document.createEvent('UIEvents'); 
                resizeEvent.initUIEvent('resize', true, false, window, 0); 
                window.dispatchEvent(resizeEvent);
            }
            
            
            function openInbuiltEditor (filename,li) {
                li=li||find_li (filename);
                const file_url = pwaApi.filename_to_url(filename);
                let editor_id = li.dataset.editor_id;
                if (!editor_id) {
                    while (true) {
                       editor_id = 'ed_'+Math.random().toString(36).substr(-8);
                       if (!qs("#"+editor_id)) break;
                    }
                    li.dataset.editor_id =  editor_id;
                    li.classList.add("editing");
                    const li_ed = document.createElement("li");
                    li_ed.innerHTML = '<PRE id="'+editor_id+'"></PRE>'; 
                    
                    li.parentNode.insertBefore(li_ed, li.nextSibling);
                    
                    
                    li_ed.editor = ace.edit(editor_id, {
                        theme:   aceThemeForFile(filename),
                        mode:    aceModeForFile(filename),
                        //autoScrollEditorIntoView: true,
                        //maxLines: 10,
                        //minLines: 2
                    });
                    
                    resizers.on(li_ed,10,editorResized);
                    
                    
                    const file_session_url = pwaApi.filename_to_url(filename)+".hidden-json";
                    
                    pwaApi.fetchUpdatedURLContents(file_url,true,function(err,text,updated,hash){
                        const currentText = new TextDecoder().decode(text);
                        
                        if (err) {
                            li_ed.editor.session.setValue("error:"+err.message||err);
                        } else {
                            pwaApi.fetchUpdatedURLContents(file_session_url,false,function(err,sess_json){
                                    
                                sess_json = err ? false : new TextDecoder().decode(sess_json);
                                if (sess_json) {
                                    
                                     ace_session_json.deserialize(li_ed.editor,sess_json,function(err,data){
                                         
                                          if (err || (li_ed.editor.session.getValue() !==currentText) ) { 
                                              li_ed.editor.session.setValue(currentText);
                                          }
                                          //if (data) li_ed.editor.setOptions(data);
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
                                    };
                                    
                                    li_ed.reload = function () {
                                        pwaApi.fetchUpdatedURLContents(file_url,true,function(err,buffer,updated,hash){
                                            const text = new TextDecoder().decode(buffer);
                                            li_ed.setText(text);
                                            if (li_ed.edit_helper) {
                                                li_ed.edit_helper.update(text);
                                            }
                                            if (edit_hooks[file_url]) {
                                                edit_hooks[file_url].forEach(function(fn){
                                                    fn("reload",file_url,text,buffer);
                                                });
                                            }
                                        });
                                    }
                                   
                                    
                                    
                                   
                                    startEditHelper(file_url,currentText,function(helper){
                                            li_ed.edit_helper = helper;
                                            li_ed.inbuiltEditorOnSessionChange = function () {
                                                // delta.start, delta.end, delta.lines, delta.action
                                                const textContent = li_ed.editor.session.getValue();
                                                const buffer = new TextEncoder().encode(textContent);
                                                if (li_ed.edit_helper) {
                                                    li_ed.edit_helper.update(textContent);
                                                }
                                                pwaApi.updateURLContents (file_url,buffer,true,function(err,hash) {
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
                                                });
                                           };
                                           li_ed.editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                                           
                                    });
                                   
                                    
                                }     
                                    
                            }); 
                        }
                        
                        

                        
                    });
                    
                    return li_ed;
                } else {
                    const ed = qs("#"+editor_id);
                    const li_ed = ed.parentNode;
                    return li_ed;
                }
            }
          
            function closeInbuiltEditor(filename,li) {
                li=li||find_li (filename);
                let editor_id = li.dataset.editor_id;
                if (editor_id) {
                    li.classList.remove("editing");
                    
                    const ed = qs("#"+editor_id);
                    
                    const li_ed = ed.parentNode;
                    
                    
                    ace_session_json.serialize(
                        li_ed.editor,
                        ["theme"],
                        {
                            maxLines : li_ed.editor.getOption("maxLines")
                        },
                    function(err,json){
                        
                        const buffer = new TextEncoder().encode(json);
                        const file_url = pwaApi.filename_to_url(filename)+".hidden-json";
                        pwaApi.updateURLContents (file_url,buffer,false,function(err) {
                            
                            resizers.off(li_ed,editorResized);
                            li.classList.remove("editing");
                            li_ed.editor.off('change',li_ed.inbuiltEditorOnSessionChange);
        
                            li_ed.editor.destroy();
                            
                            li_ed.removeChild(ed);
                            
                            
                            if (li_ed.edit_helper) {
                                li_ed.edit_helper.close(true);
                                delete li_ed.edit_helper;
                            }
        
                            
                            delete li_ed.inbuiltEditorOnSessionChange;
                            delete li_ed.editor;
                            delete li_ed.hashDisplay;
                            delete li_ed.setText;
                            delete li_ed.reload;
                            
                            
                            while (li_ed.firstChild) {
                                li_ed.removeChild(li_ed.firstChild);
                            }
                        
                            
                            li_ed.parentNode.removeChild(li_ed);
                            
                            delete li.dataset.editor_id;
                            
                        });
                    });
                    
                    
                    
                   
                }
            }
            
            function filterHistory  (deltas){ 
                return deltas.filter(function (d) {
                    return d.group != "fold";
                });
            }
            
           
           
            function toggleInBuiltEditor (filename,li) {
                li=li||find_li (filename);
                if (!!li.dataset.editor_id) {
                   closeInbuiltEditor(filename,li);
                } else {
                   openInbuiltEditor (filename,li);
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
                            if(sha_el && sha_el.textContent==='') {
                                pwaApi.fetchUpdatedURLContents(filename,true,function(err,text,updated,hash){
                                    sha_el.textContent=hash;
                                    setTimeout(zipPoller,1,index+1);
                                });
                            } else {
                                setTimeout(zipPoller,1,index+1);
                            }
                        }
                    } else {
                        setTimeout(zipPoller,1,index+1);
                    }
                } else {
                    setTimeout(zipPoller,5000,0); 
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



