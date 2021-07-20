/* global zip_url_base,zip_virtual_dir,zip_files,full_zip_uri,updated_prefix, alias_root_fix,alias_root, parent_link,BroadcastChannel,ace*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`
    
    pwaWindow@Window    | ml.pwa-win.js
    editInZed           | ml.zedhook.js
    sha1Lib             | sha1.js
    htmlFileItemLib     | ml.zipfs.dir.file.js
    zipFSApiLib         | ml.zipfs.api.js
    
    showdown            | https://cdnjs.cloudflare.com/ajax/libs/showdown/1.9.1/showdown.js
    
    `,function(){ml(2,

    {

        Window: function pwaZipDirListing(pwa,zipFSApiLib,sha1 ) {
            
            
            var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
             
            const pwaApi = zipFSApiLib (pwa,full_zip_uri,zip_virtual_dir,find_li,alias_root_fix) ;

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
                
                
                const inputModal = qs("#inputModal");
                
                qs("div.modal-content span.close",function click(){
                    inputModal.style.display = "none";
                });
                // When the user clicks anywhere outside of the modal, close it
                window.onclick = function(event) {
                    if (event.target == inputModal) {
                       inputModal.style.display = "none";
                    }
                };
                
                
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
                        } else {
                            
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
            
            /*function html_file_item (id,filename){
                
                
                const linkit=function(uri,disp,a_wrap){ 
                    a_wrap=a_wrap||['<a href="'+uri+'">','</a>'];
                    const split=(disp||uri).split("/");
                    if (split.length===1) return a_wrap.join(disp||uri);
                    const last = split.pop();
                    if (split.length===1) return split[0]+'/'+ a_wrap.join(last);
                    return split.join("/")+'/'+ a_wrap.join(last);
                };
            
               const full_uri = zip_url_base+"/"+filename,
                     basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
               const edited_attr  = ' data-balloon-pos="right" aria-label="'                + basename + ' has been edited locally"';
               const edit_attr    = ' data-balloon-pos="down-left" aria-label="Open '       + basename + ' in zed"'; 
               const zip_attr     = ' data-balloon-pos="down-left" aria-label="...explore ' + basename + ' contents" "' ;
               const is_hidden    = false;
               const is_deleted   = false;
               const is_editable  = true;
               const is_zip       = false;
               const is_edited    = true;// new files are by definition,edited
               
               
               const sha1span     = '<span class="sha1"></span>';
               
               const edited       = is_edited ? '<span class="edited"'+edited_attr+'>&nbsp;&nbsp;&nbsp;</span>' : '';
               const cls = is_deleted ? ["deleted"] : [];
               if (is_edited)  cls.push("edited");
               if (is_hidden)  cls.push("hidden");
               const li_class     = cls.length===0 ? '' : ' class="'+cls.join(' ')+'"';
               
               const zedBtn =   is_editable   ? [ '<a'+edit_attr+ ' data-filename="' + filename + '"><span class="editinzed">&nbsp;</span>',  '</a>'                + sha1span + edited ] 
                              : is_zip        ? [ '<a'+zip_attr+  ' href="'+zip_url_base+'/' + filename + '"><span class="zipfile">&nbsp;</span>',    '</a>'        + sha1span + edited ]   
                              :                 [ '<a data-filename="'               + filename + '" data-inzip="0"><span class="normal">&nbsp;</span>',     '</a>' + sha1span + edited ] ;
               
               
               return '<li'+li_class+'><a data-filename="' + filename + '"><span class="deletefile"></span></a><span class="full_path">' + parent_link +'/</span>' +linkit(full_uri,filename,zedBtn) + '</li>';
            } */
            
            function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
           
            function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}
            
            
            var zoomEl;            
            function  zoomBtnClick( e ) {
                e.stopPropagation();
                
                const zoomClass=function(addRemove) {
                   const li_ed=qs("#"+zoomEl.dataset.editor_id).parentNode;
                   li_ed.classList[addRemove]("zoomingEditor");
                   zoomEl.classList[addRemove]("zooming");
                   qs('html').classList[addRemove]("zooming"); 
                   
                   li_ed.editor.setOption("minLines", addRemove==="add"?undefined:2);
                   li_ed.editor.setOption("maxLines", addRemove==="add"?undefined:30);
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
                       if (filename.slice(-3)===".md") {
                           open_markdown (filename);
                       } else {
                            const file_url = dir_prefix+filename.replace(alias_root_fix,'');
                            open_url(file_url);
                       }
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
                   pwaApi.removeUpdatedURLContents(filename);
                   if (li) {
                       // if the editor is open an editor id will exist in the li element 
                       if (!!li.dataset.editor_id) {
                           // note - opening an already open editor just returns the li_ed element
                           openInBuiltEditor (filename,li).reload();
                       }
                   }
                   
                  
                   
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
                const dir_prefix = (zip_virtual_dir ? zip_virtual_dir  : full_zip_uri) + '/';
                const file_url = dir_prefix+filename.replace(alias_root_fix,'');
                open_url(file_url);
            }
            
            function openZipBtnClick(e){
                   if (!e.shiftKey) {
                       return;
                   }
                   
                    e.stopPropagation();
                    const link      = e.target.href ? e.target : e.target.parentElement ;
                    open_url(link.href);
            }
            
            function open_url(file_url) {
                return open_window(
                  file_url,
                  file_url.replace(/\/|\:|\.|\-/g,''),
                  0,
                  0,
                  1024,
                  768,
                  true,
                  function onClosed(){},
                  function onOpened(){}
                );
            }
            
            function open_markdown (filename) {
                var converter = new showdown.Converter();

                pwaApi.fetchUpdatedURLContents(filename,true,function(err,text,updated,hash){
                if (err) {
                    return;
                } else {
                    const html  = converter.makeHtml(new TextDecoder().decode(text));
                    let url = URL.createObjectURL(new Blob([html]))
                    open_url(url);
                }
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
            
            
            function closeInbuiltEditor(filename,li) {
                li=li||find_li (filename);
                let editor_id = li.dataset.editor_id;
                if (editor_id) {
                    const ed = qs("#"+editor_id);
                    const li_ed = ed.parentNode;
                    
                    li_ed.editor.off('change',li_ed.inbuiltEditorOnSessionChange);
                    li_ed.removeChild(ed);
                    
                    
                    delete li_ed.inbuiltEditorOnSessionChange;
                    delete li_ed.editor;
                    delete li_ed.hashDisplay;
                    delete li_ed.setText;
                    delete li_ed.reload;
                    
                    li_ed.parentNode.removeChild(li_ed);
                    
                    delete li.dataset.editor_id;
                }
            }
            
            

            function openInBuiltEditor (filename,li) {
                li=li||find_li (filename);
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
                        autoScrollEditorIntoView: true,
                        maxLines: 30,
                        minLines: 2
                    });
                    
                    pwaApi.fetchUpdatedURLContents(filename,true,function(err,text,updated,hash){
                        if (err) {
                            li_ed.editor.session.setValue("error:"+err.message||err);
                        } else {
                            
                            
                            li_ed.editor.session.setValue(new TextDecoder().decode(text));
                            li_ed.hashDisplay = qs(li,".sha1");
                            li_ed.hashDisplay.textContent=hash;
                            li_ed.setText = function (text) {
                                li_ed.editor.session.off('change', li_ed.inbuiltEditorOnSessionChange);
                                li_ed.editor.setValue(text);
                                li_ed.editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                            };
                            
                            li_ed.reload = function () {
                                pwaApi.fetchUpdatedURLContents(filename,true,function(err,text,updated,hash){
                                    li_ed.setText(new TextDecoder().decode(text));
                                });
                            }
                           
                            
                            li_ed.inbuiltEditorOnSessionChange = function () {
                                    // delta.start, delta.end, delta.lines, delta.action
                                    
                                    const buffer = new TextEncoder().encode(li_ed.editor.session.getValue());
                                    
                                    pwaApi.updateURLContents (filename,buffer,true,function(err,hash) {
                                        if (err) {
                                            return ;
                                        }
                                        li_ed.hashDisplay.textContent=hash;
                                    });
                            };
                            
                            li_ed.editor.session.on('change', li_ed.inbuiltEditorOnSessionChange);
                            
                        }
                        

                        
                    });
                    return li_ed;
                } else {
                    const ed = qs("#"+editor_id);
                    const li_ed = ed.parentNode;
                    return li_ed;
                }
            }
           
            function toggleInBuiltEditor (filename,li) {
                li=li||find_li (filename);
                if (!!li.dataset.editor_id) {
                   closeInbuiltEditor(filename,li);
                } else {
                   openInBuiltEditor (filename,li);
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
            
            function qs(d,q,f) {
                let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
                if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
                if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
                if (D+Q===O+S){
                   r = d.querySelector(q);
                   if (r&&typeof r+typeof f===O+FN) {
                        if (f.name.length>0) 
                           r.addEventListener(f.name,f);
                        else 
                           f(r);
                    }
                }
                return r;
            }
            
            
            if (["interactive","complete"].indexOf( window.document && window.document.readyState) >=0) {
                onDOMContentLoaded();
            } else {
               window.addEventListener('DOMContentLoaded', onDOMContentLoaded);
            }
            
          
            return lib;
        } 
    }, {
        Window: [
            
            ()=>ml.i.pwaWindow,
            ()=>ml.i.zipFSApiLib,
            ()=>ml.i.sha1Lib.cb
            
        ] 
    }

    );


 

});



