/* global zip_url_base,zip_virtual_dir,zip_files, alias_root_fix, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'pwaWindow@Window                           | ml.pwa-win.js',
    'editInZed                                  | ml.zedhook.js', 
    'sha1Lib                                    | sha1.js'
   
    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function pwaZipDirListing(findWorker,sendMessage,pwa,sha1 ) {
            
            
            var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
             
          
            
            const full_zip_uri           = location.origin+zip_url_base;
            
            const pwaApi = {
               
               toggleDeleteFile : function (file,cb) {
                   return pwa.toggleDeleteFile(full_zip_uri,file,cb);
               },
               
               deleteFile       : function (file,cb) {
                   return pwa.deleteFile(full_zip_uri,file,function(err,msg){
                       const ix = zip_files.indexOf(file);
                       if (ix >=0) {
                           zip_files.splice(ix,1);
                       }
                       if(cb)cb(err,msg);
                   });
               },
               
               unDeleteFile     : function (file,cb) {
                   return pwa.unDeleteFile(full_zip_uri,file,function(err,msg){
                       const ix = zip_files.indexOf(file);
                       if (ix <0) {
                           zip_files.push(file);
                       }
                       if(cb)cb(err,msg);
                   });
               },
               
               isDeleted     : function (file,cb) {
                   return pwa.isDeleted(full_zip_uri,file,cb);
               },
               /*
               writeFileString : function (file,text,hash,cb) {
                  return pwa.writeFileString(full_zip_uri,file,text,hash,cb);
               },
               
               readFileString : function (file,hash,cb) {
                   return pwa.readFileString(full_zip_uri,file,hash,cb);
               },*/
               
               isHidden : function (file,cb) {
                   return pwa.isHidden(full_zip_uri,file,function(err,msg){
                         const el = find_li(file);
                         if (el) {
                             if (msg.hidden) {
                                  el.classList.add("hidden");
                             } else {
                                  el.classList.remove("hidden");
                             }
                         }
                         if(cb)cb(msg.hidden);
                     });
               },
               
               removeUpdatedURLContents  : function (file,cb) {
                  return pwa.removeUpdatedURLContents(
                      zip_virtual_dir ? zip_virtual_dir +'/'+file : full_zip_uri+'/'+file,
                      //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                      function(err,msg){
                         const el = find_li(file);
                         if (el) el.classList.remove('edited');
                         if(cb)cb(err,msg); 
                      });
               },
               /*
               updateURLContents : function (file,content,hash,cb) {
                   return pwa.updateURLContents(
                       zip_virtual_dir ? zip_virtual_dir +'/'+file : full_zip_uri+'/'+file,
                       //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                       content,hash,
                       function(err,msg){
                           const el = find_li(file);
                           if (el) {
                               el.classList.add('edited');
                               el.classList.add('editing');
                           }
                           if(cb)cb(err,msg && msg.hash);
                       }
                   );
               },
               
               fetchUpdatedURLContents : function (file,hash,cb) {
                   return pwa.fetchUpdatedURLContents(
                       zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,hash,
                       function(err,msg){
                          if (err) return cb (err);
                          cb(undefined,msg.content,msg.updated,msg.hash);
                       }
                   );
               },
               */
               registerForNotifications : ___registerForNotifications,
               unregisterForNotifications : function (cb) {
                    cb();
               }

            };
            
            /*
            let sw_urls,sw_mods;
            pwa.getServiceWorkerUrls(function(err,urls){
                sw_urls=urls;
                console.log(urls);
            })
            pwa.getServiceWorkerModules(function(err,mods){
                sw_mods=mods;
                console.log(mods);
            })*/
            
            
            function ___registerForNotifications(cb) {
                const persistent=true;
                sendMessage('registerForNotifications',{
                    zip     : full_zip_uri,
                    virtual : zip_virtual_dir,
                },persistent,function(err,msg){
                    if (err) return cb (err);
                    msg.channel = new BroadcastChannel(msg.notificationId);
                    msg.channel.onmessage = function(e){
                       cb(e.data); 
                    }
                    pwaApi.unregisterForNotifications = function (cb) {
                        msg.channel.close();
                        sendMessage('unregisterForNotifications',{
                            zip     : full_zip_uri,
                            virtual : zip_virtual_dir,
                            notificationId : msg.notificationId
                        },function(err,msg){
                            if (err) return cb (err);
                            cb(undefined);
                        });
                        
                        pwaApi.unregisterForNotifications = function (cb) {
                             cb();
                        };
                        
                        pwaApi.registerForNotifications = ___registerForNotifications;
                    };
                    
                    pwaApi.registerForNotifications = function (newcb) {
                         cb=newcb;
                    };
                });
            }
            
            
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
                
                [].forEach.call(document.querySelectorAll("li a span.normal"),addViewClick);
                
                [].forEach.call(document.querySelectorAll("li a span.zipfile"),addOpenZipViewClick);

                [].forEach.call(document.querySelectorAll("li a span.deletefile"),addDeleteClick);
                
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
            
            function html_file_item (id,filename){
                
                
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
               const is_edited    = true;
               
               
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
            }
            
            function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}
           
            function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}
            
            function edBtnClick(e){
                e.stopPropagation();
                const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                const li = btn.parentElement;
                const filename = btn.dataset.filename.replace(/(^\/)/,'');
                
                if (!e.shiftKey) {
                   li.classList.add("editing");
                   
                    modified_files[filename]=1;
                    
                    const dir_prefix = (zip_virtual_dir ? zip_virtual_dir  : full_zip_uri) + '/';
                    
                    self.editInZed(
                       
                       dir_prefix+filename.replace(alias_root_fix,''),    
                       
                       zip_files.map(function (fn){ return dir_prefix+fn.replace(alias_root_fix,'');}),
                       
                       zip_virtual_dir.replace(/\/$/,'')+'/',
                       
                       function(){
                       
                    });

                } else {
                    const file_url = zip_url_base + '/'+filename;
                    open_url(file_url);
                }
            }
            
            function deleteClick(e) {
                e.stopPropagation();
                const btn = e.target.dataset && e.target.dataset.filename ? e.target : e.target.parentElement ;
                const filename = btn.dataset.filename.replace(/(^\/)/,'');
                
                if (e.shiftKey) {
                   pwaApi.removeUpdatedURLContents(filename);
                } else {
                   pwaApi.toggleDeleteFile(filename);
                }
            }
/*
            function registerForNotifications(initial_path,cb) {
                pwaApi.registerForNotifications(function(msg){
    
                    if (msg.deleted) {
                        const el = find_li(msg.deleted);
                        if (el) {
                           el.classList.add("deleted");
                           el.classList.add("hidden");
                        }
                        return;
                    }
                    if (msg.undeleted) {
                        const el = find_li(msg.undeleted);
                        if (el) {
                           el.classList.remove("deleted");
                           el.classList.remove("hidden");
                        }
                        return;
                    }
                    if (msg.hidden) {
                        const el = find_li(msg.hidden);
                        return el && el.classList.add("hidden");
                    }
                    
                    if (msg.unhidden) {
                        const el = find_li(msg.unhidden);
                        return el && el.classList.remove("hidden");
                    }
                    
                    if (msg.hash && msg.writeFileString) {
                        
                        if (msg.writeFileString.replace(/^\//,'') !== '.zedstate') {
                                 initial_path = msg.writeFileString.replace(/^\//,'');
                            cb (initial_path);
                            const anchor = qs('a[data-filename="'+initial_path+'"]');
                            if (anchor) {
                                const el = anchor.parentElement;
                                const sh = el.querySelector('span.sha1');
                                if (sh) {
                                    sh.innerHTML=msg.hash;
                                }
                                el.classList.add("editing");
                                el.classList.add("edited");
                                modified_files[initial_path]=1;
                            } else {
                               
                                    qs("ul",function(el){
                                        // make a new id for the new element, as we are creating it on the fly
                                        let newid="li_"+Math.random().toString(36).substr(-8);
                                        
                                        // patch the ul element to include new file
                                        el.innerHTML += html_file_item(newid,initial_path);
                                        
                                        // add some button events (if relel)
                                        addViewClick(qs("#"+newid+" a span.normal"));
                                        let edBtn = qs("#"+newid+" a span.editinzed");
                                        el.classList.add("edited");
                                        el.classList.add("editing");
                                        modified_files[initial_path]=1;
                                        pwaApi.isHidden(initial_path,function(hidden){
                                            if (hidden) {
                                                el.classList.add("hidden");
                                            }
                                        });
                                    });
                                
                            }
                        }
                    }
                    
                    if (msg.hash && msg.readFileString) {
                        const anchor = qs('a[data-filename="'+msg.readFileString.replace(/^\//,'')+'"]');
                        if (anchor) {
                            const sh = anchor.parentElement.querySelector('span.sha1');
                            if (sh) {
                                sh.innerHTML=msg.hash;
                            }
                        }
                    }
                    
                    
    
                });
            }
*/
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
                const file_url = zip_url_base + '/' + filename;
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
            
            ()=>self.pwaWindow.findWorker, 
            ()=>self.pwaWindow.sendMessage,
            ()=>self.pwaWindow,
            ()=>self.sha1Lib.cb
            
        ] 
    }

    );


 

});



