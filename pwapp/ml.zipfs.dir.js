/* global zip_url_base,zip_virtual_dir,zip_files,full_zip_uri,updated_prefix, alias_root_fix,alias_root, parent_link,BroadcastChannel,ace*/


/* global ml,qs, self,caches,BroadcastChannel,Shell,ResizeObserver  */
ml(`
    
    pwaWindow@Window     | ml.pwa-win.js
    editInZed            | ml.zedhook.js
    sha1Lib              | sha1.js
    htmlFileItemLib      | ml.zipfs.dir.file.js
    zipFSApiLib          | ml.zipfs.api.js
    showdown             | https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.js
    aceSessionLib        | ml.ace-session.js
    FontAwesomeKitConfig | https://kit.fontawesome.com/f16568395d.js
    
    
    
    `,function(){ml(2,

    {
        Window: function pwaZipDirListing(pwa,zipFSApiLib,sha1,MarkdownConverter ) {
            
            
            var 
            
            ace_session_json = ml.i.aceSessionLib,
            
            
           
            
            editor_url          = location.href.replace(/\/$/,''),
            editor_channel_name = window.parent ? "ch_"+editor_url.replace(/\/|\:|\.|\-/g,'') : false,
            editor_channel      = editor_channel_name ? new BroadcastChannel(editor_channel_name) : false,
         
            
            deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
            const pwaApi = zipFSApiLib (pwa,full_zip_uri,zip_virtual_dir,find_li,alias_root_fix,alias_root,updated_prefix);   
                             
            const resizers = ResizeWatcher();
            const available_css = [];
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
                boldit,
                linkit,
                fileIsEditable
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
                

                [].forEach.call(document.querySelectorAll("li a span.editinzed"),addEditClick);
                
                [].forEach.call(document.querySelectorAll("li a span.fullscreen"),addZoomClick);
                
                [].forEach.call(document.querySelectorAll("li a span.normal"),addViewClick);
                
                [].forEach.call(document.querySelectorAll("li a span.zipfile"),addOpenZipViewClick);

                [].forEach.call(document.querySelectorAll("li a span.deletefile"),addDeleteClick);
                
                
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
                
                
                if (editor_channel) {
                
                        getStylesheets(editor_channel,zip_virtual_dir,function(urls){
                            
                            available_css.splice(0,available_css.length);
                            
                            available_css.push.apply(available_css,urls.map(function(u){
                                return (alias_root ? alias_root :'' ) +  u.substr(zip_virtual_dir.length+1);
                            }));
                            
                            console.log(available_css);
                            

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
                  el.parentElement.addEventListener("click",deleteClick);
                }
            }
            
            function addEditClick (el) {
                if (el) {
                  el.addEventListener("click",edBtnClick);
                  el.parentElement.addEventListener("click",edBtnClick);
                }
            }
            
            function addZoomClick (el) {
                if (el) {
                  el.addEventListener("click",zoomBtnClick);
                  el.parentElement.addEventListener("click",zoomBtnClick);
                }
            }
            
            function addViewClick (el) {
                if (el) {
                    el.addEventListener("click",viewBtnClick);
                    el.parentElement.addEventListener("click",viewBtnClick);
                }
            }
            
            function addOpenZipViewClick (el) {
                if (el) {
                    el.addEventListener("click",openZipBtnClick);
                    el.parentElement.addEventListener("click",openZipBtnClick);
                }
            }
            
            function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
           
            function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}
            
            
            var zoomEl,fs_editor;            
            function  zoomBtnClick( e ) {
                e.stopPropagation();
                
                
                const zoomClass=function(addRemove) {
                   const li_ed=qs("#"+zoomEl.dataset.editor_id).parentNode;
                   li_ed.classList[addRemove]("zoomingEditor");
                   zoomEl.classList[addRemove]("zooming");
                   qs('html').classList[addRemove]("zooming"); 
                   
                   if (addRemove==="add") {
                      if (!fs_editor) {
                         
                         const el = document.createElement("pre");
                         el.id = "fs_editor";
                         
                         qs("main").appendChild(el);
                          
                         fs_editor = ace.edit("fs_editor");
                         fs_editor.setAutoScrollEditorIntoView(true);
                      } 
                        
                      fs_editor.setTheme(li_ed.editor.getTheme());
                      fs_editor.session.setMode(li_ed.editor.session.getMode());
                      
                      li_ed.editor.session.off('change', li_ed.inbuiltEditorOnSessionChange);
                      fs_editor.setSession(li_ed.editor.getSession());
                      fs_editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                      fs_editor.focus();
                   } else {
                       fs_editor.session.off('change', li_ed.inbuiltEditorOnSessionChange);
                       li_ed.editor.setSession(fs_editor.getSession());
                       li_ed.editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                       li_ed.editor.focus();
                        
                   }
                };
                
                if (zoomEl) {
                    zoomClass("remove");
                    zoomEl=undefined;
                } else {
                    const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                    zoomEl = btn.parentElement;
                    zoomClass("add");
                }
                
            }
            
            function edBtnClick(e){
                e.stopPropagation();
                const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                const li = btn.parentElement;
                const filename = btn.dataset.filename.replace(/(^\/)/,'');
                const dir_prefix = (zip_virtual_dir ? zip_virtual_dir  : full_zip_uri) + '/';
                if (e.shiftKey) {
                   li.classList.add("editing");
                   
                    modified_files[filename]=1;
                    
                    self.editInZed(
                       
                       dir_prefix+filename.replace(alias_root_fix,''),    
                       
                       zip_files.map(function (fn){ return dir_prefix+fn.replace(alias_root_fix,'');}),

                       function(){
                       
                    });

                } else {
                    if (e.ctrlKey) {
                        open_file(filename);
                    } else {
                        li.classList.add("editing");
                        toggleInBuiltEditor ( filename,li )
                    }
                }
            }
            
            function deleteClick(e) {
                e.stopPropagation();
                const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                const filename = btn.dataset.filename.replace(/(^\/)/,'');
                const li = find_li(filename);
                if (e.shiftKey) {
                    
                   // shift delete removes any edits to the file
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
                   
                  
                   
                } else {
                    
                   // delete click just toggles a delete flag, as well as the hidden flag 
                   // if "show hidden files" is checked, the delete button changes the highlighting colour,
                   // so the user can just undelete a deleted file by showing hidden files and  reclicking delete.
                   // note that deleting a file does not delete any edits, it just prevents the browser from accessing the file
                   // ( the only exception to this is if the file is inside a virtual zip file that onscures a physical file at the same
                   //   path. for example, index.html usually replaces the installer index.html. so deleting the index.html inside the zip 
                   //   allows testing of the installer while the app is techincally still loaded )
                   
                   closeInbuiltEditor(filename,li);
                   pwaApi.toggleDeleteFile(filename,function(err,msg){
                       if (err) return;
                       
                       if (li) {
                           li.classList[msg.deleted?"add":"remove"]('deleted');
                           li.classList[msg.deleted?"add":"remove"]('hidden');
                           li.classList.remove("editing");
                       }
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
                  const anchor = qs('a[data-filename="'+file.replace(/^\//,'')+'"]');
                  return anchor && anchor.parentElement;
            }

            function viewBtnClick(e){
                e.stopPropagation();
                const btn      = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                const filename = btn.dataset.filename.replace(/(^\/)/,'');
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
            
            function open_url(file_url,cb) {
                return open_window(
                  file_url,
                  file_url.replace(/\/|\:|\.|\-/g,''),
                  0,
                  0,
                  1024,
                  768,
                  true,
                  function onClosed(){ if (cb) cb ("closed");},
                  function onOpened(){ if (cb) cb ("opened");}
                );
            }
            
            function open_html (html,file_url,cb) {
                console.log("creating temp file",file_url);
                
                var win,api = {
                      update : function(content){
                          if (win) {
                              win.document.body.innerHTML = content; 
                          }
                          if (cb) {
                              cb("opened");
                          }
                      },
                      close : function () {
                          if (cb) {
                              cb("closed");
                          }
                          cb = undefined;
                          if (win) win.close() ;
                      }
                      
                };
                 
                pwaApi.updateURLContents (file_url ,new TextEncoder().encode(html),true,function(err,hash) {
                    
                    if (err) {
                        return ;
                    }
                    console.log("opening temp url",file_url);
                    const theWin = open_url(file_url,function(ev){
                        switch (ev) {
                            case "opened" : {
                                    console.log("window opened for",file_url)
                                    setTimeout(function(){
                                        pwaApi.removeUpdatedURLContents(file_url,function(){
                                            console.log("removed temp file",file_url);
                                            win = theWin;
                                        });
                                    },500);
                                }
                                break;
                            case "closed" : {
                                win = undefined;
                                if (cb) {
                                    cb();
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
                var converter = new MarkdownConverter();
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
                                    win.location= file_url;
                                    return addEditHook(file_url,onedit);
                                case "closed" : 
                                    
                                    return removeEditHook(file_url,onedit);
                            }
                        });
                    }
                    
                    function onedit(cmd,file_url,text) {
                        if (win) {
                            win.location.reload();
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
            
            function aceModeForFile(fn ) {
                const ext = fn.substr(fn.lastIndexOf('.')+1);
                return {
                    html : "ace/mode/html",
                    js   : "ace/mode/javascript",
                    json : "ace/mode/json",
                    md   : "ace/mode/markdown",
                    css  : "ace/mode/css"
                    
                }[ext]||"ace/mode/text";
            }
            
            function aceThemeForFile(fn ) {
                const ext = fn.substr(fn.lastIndexOf('.')+1);
                return {
                    html : "ace/theme/cobalt",
                    js   : "ace/theme/chaos",
                    json : "ace/theme/monokai",
                    md   : "ace/theme/dawn",
                    css  : "ace/theme/pastel_on_dark",
                }[ext] || "ace/theme/chrome";
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
            
            function open_window(
              url,
              name,
              left,
              top,
              width,
              height,
              size,
              onClosed,
              onOpened
            ) {
              // sync return is a string refering to future open window.
                  var opts =
                     "toolbar=no,menubar=no,location=no"+
                     ",resizable=" + (size ? "yes" : "no") +
                     ",scrollbars=" + (size ? "yes" : "no") +
                     (typeof top==='number'    ? ",top="    + (top-deltaTop).toString()+     ",screenY="    + top    : "" )+
                     (typeof left==='number'   ? ",left="   + (left-deltaLeft).toString()+   ",screenX="   +  left  : "" )+
                     (typeof width==='number'  ? ",width="  + (width-deltaWidth).toString()   : "" )+
                     (typeof height==='number' ? ",height=" + (height-deltaHeight).toString() : "" );
                     
                   // if a name is specified, use that, otherwise make up a random name
                   const w = window.open(url, name, opts);
                   
                   on_window_close(w,onClosed);
                   on_window_open(w,onOpened);
                   
                   return w;
            }
            
            function on_window_close(w, fn) {
              if (typeof fn === "function" && w && typeof w === "object") {
                setTimeout(function() {
                  if (w.closed) return fn();
            
                  try {
                    w.addEventListener("beforeunload", fn);
                  } catch (err) {
                    // console.log(err);
                    var fallback = function() {
                      if (w.closed) return fn();
                      setTimeout(fallback, 500, w, fn);
                    };
                    setTimeout(fallback, 500);
                  }
                }, 1000);
              }
            }
            
            function on_window_open_poller (w,fn, interval) {
                if (w.closed) return ;
                
                if (w.length>1) {
                    return fn (w);
                }
                if (interval) {
                    return setTimeout(fn, interval, w);   
                }
                return setTimeout(on_window_open_poller, 400, w, fn, 1500);
            }
            
            function on_window_open(w, fn) {
              if (typeof fn === "function" && w && typeof w === "object") {
                
                try {
                  w.addEventListener("load", function(){fn(w);});// this will throw for cross domain windows
                } catch (err) {
                  //wait until 1 subfram exiss or 2 seconds, whatever happens first
                  setTimeout(on_window_open_poller, 100, w, fn);
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



