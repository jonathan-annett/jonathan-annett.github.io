/* global zip_url_base,zip_virtual_dir,zip_files, alias_root_fix, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
    'pwaWindow@Window                           | wl.pwa-win.js',
    'sha1Lib                                    | sha1.js'
   
    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function pwaZipDirListing(findWorker,sendMessage,pwa,sha1 ) {
            
            
            var deltaTop=0,deltaLeft=0,deltaWidth=0,deltaHeight=0;
             
          
            
            const full_zip_uri           = location.origin+zip_url_base;
            
            const pwaApi = {
               
               toggleDeleteFile : function (file,cb) {
                   
                   return pwa.toggleDeleteFile(full_zip_uri,file,cb);
                   /*
                   sendMessage('deleted',{
                        zip    : full_zip_uri,
                        virtual: zip_virtual_dir,
                        toggle : file
                   },function(err,msg){
                        if(cb)cb(err,msg);
                   });*/
               },
               
               deleteFile       : function (file,cb) {
                   return pwa.deleteFile(full_zip_uri,file,function(err,msg){
                       const ix = zip_files.indexOf(file);
                       if (ix >=0) {
                           zip_files.splice(ix,1);
                       }
                       if(cb)cb(err,msg);
                   });
                   /*
                   sendMessage('deleted',{
                       zip : full_zip_uri,
                       virtual: zip_virtual_dir,
                       add : file
                   },function(err,msg){
                       const ix = zip_files.indexOf(file);
                       if (ix >=0) {
                           zip_files.splice(ix,1);
                       }
                       if(cb)cb(err,msg);
                   });*/
               },
               
               unDeleteFile     : function (file,cb) {
                   
                   return pwa.unDeleteFile(full_zip_uri,file,function(err,msg){
                       const ix = zip_files.indexOf(file);
                       if (ix <0) {
                           zip_files.push(file);
                       }
                       if(cb)cb(err,msg);
                   });
                   /*
                   sendMessage('deleted',{
                       zip    : full_zip_uri,
                       virtual: zip_virtual_dir,
                       remove : file
                   },function(err,msg){
                       const ix = zip_files.indexOf(file);
                       if (ix <0) {
                           zip_files.push(file);
                       }
                       if(cb)cb(err,msg);
                   });*/
               },
               
               isDeleted     : function (file,cb) {
                   
                   return pwa.isDeleted(full_zip_uri,file,cb);
                   /*
                   sendMessage('deleted',{
                        zip    : full_zip_uri,
                        virtual: zip_virtual_dir,
                        test   : file
                   },function(err,msg){
                        if(cb)cb(err,msg);
                   });*/
               },
               
               writeFileString : function (file,text,hash,cb) {
                   return pwa.writeFileString(full_zip_uri,file,text,hash,cb);
                   /*
                   
                   if (typeof hash==='function') {
                       cb   = hash;
                       hash = false;
                   }
                   sendMessage('writeFileString',{
                       zip    : full_zip_uri,
                       virtual: zip_virtual_dir,
                       file   : file,
                       text   : text,
                       hash   : hash
                   },cb);*/
               },
               
               readFileString : function (file,hash,cb) {
                   return pwa.readFileString(full_zip_uri,file,hash,cb);
                   /*
                   if (typeof hash==='function') {
                       cb   = hash;
                       hash = false;
                   }
                    sendMessage('readFileString',{
                        zip    : full_zip_uri,
                        virtual: zip_virtual_dir,
                        file   : file,
                        hash   : hash
                    },cb);*/
               },
               
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
                   /*
                   sendMessage('hidden',{
                       zip    : full_zip_uri,
                       virtual: zip_virtual_dir,
                       test   : file
                   },function(err,msg){
                       const el = find_li(file);
                       if (el) {
                           if (msg.hidden) {
                                el.classList.add("hidden");
                           } else {
                                el.classList.remove("hidden");
                           }
                       }
                       if(cb)cb(msg.hidden);
                   });*/
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
                  /* 
                  sendMessage('removeUpdatedURLContents',{
                     url    : zip_virtual_dir ? zip_virtual_dir +'/'+file : full_zip_uri+'/'+file,
                  },function(err,msg){
                      const el = find_li(file);
                      if (el) el.classList.remove('edited');
                      if(cb)cb(err,msg);
                  });*/
               },
               
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
                   /*
                   if (typeof hash ==='function') {
                       cb = hash;
                       hash=false;
                   }
                   sendMessage('updateURLContents',{
                       url    : zip_virtual_dir ? zip_virtual_dir +'/'+file : full_zip_uri+'/'+file,
                       content : content,
                       hash    : hash
                   },function(err,msg){
                       const el = find_li(file);
                       if (el) {
                           el.classList.add('edited');
                           el.classList.add('editing');
                       }
                       if(cb)cb(err,msg && msg.hash);
                   });*/
               },
               
               fetchUpdatedURLContents : function (file,hash,cb) {
                   return pwa.fetchUpdatedURLContents(
                       zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,hash,
                       function(err,msg){
                          if (err) return cb (err);
                          cb(undefined,msg.content,msg.updated,msg.hash);
                       }
                   );
                   /*
                   
                   if (typeof hash ==='function') {
                       cb = hash;
                       hash=false;
                   }
                   sendMessage('fetchUpdatedURLContents',{
                       url    : zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                       hash   : hash
                   },function(err,msg){
                       if (err) return cb (err);
                       cb(undefined,msg.content,msg.updated,msg.hash);
                   });
                   */
               },
               
               registerForNotifications : ___registerForNotifications,
               unregisterForNotifications : function (cb) {
                    cb();
               }

            };
            
            
            
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
                    pwa.getPNGZipImage(full_zip_uri,"files",zip_virtual_dir,undefined,qs("#img_dl_link2"),qs("#show_dl_img"));
                });
                
                const filename_input = qs("#newfilename",function keydown(e){
                    if (e.keyCode===27) {
                        inputModal.style.display = "none";
                    } else {
                       if (e.keyCode===13) {
                           inputModal.style.display = "none";
                           let filename = filename_input.value.trim();
                           if (filename.length >0) {

                               // find the ul element
                               qs("ul",function(el){
                                   // make a new id for the new element, as we are creating it on the fly
                                   let newid="li_"+Math.random().toString(36).substr(-8);
                                   
                                   // patch the ul element to include new file
                                   el.innerHTML += html_file_item(newid,filename);
                                   
                                   // add some button events (if relel)
                                   addViewClick(qs("#"+newid+" a span.normal"));
                                   let edBtn = qs("#"+newid+" a span.editinzed");
                                   
                                   // create the file using the service worker 
                                   pwaApi.updateURLContents(filename,'\n',function(){
                                        
                                        if (edBtn) {
                                            // if editable, open the editor 
                                           addEditClick(edBtn);
                                           // make a dummy event object on the fly to "fool" the click handler
                                           edBtnClick({target:edBtn,stopPropagation(){/*ok!*/}});
                                       }
                                   
                                   });
                                   
                               });
                           }
                       }
                    }
                });
                
                qs("h1 a.newfile",function click(){
                    inputModal.style.display = "block";
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
                   zipFS_apiHook(filename).onunmount = onEditorClose;
                   
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
            
            function zipFS_apiHook (initial_path) {
                
                if (zipFS_apiHook.singleton) {
                    
                    return zipFS_apiHook.singleton.open(initial_path);
                    
                }
                
                var zedstate;
                const api_id = Math.random().toString(36).substr(-8),
                      api_call_event_name = 'zipFS_apiCall_'+api_id,
                      tags = {
                          
                          
                      },
                      leadingSlash = /^\//,
                      self = {},
                      fs_api = fsZipApi();
      
                window.addEventListener(api_call_event_name,apiCall);
                
                
                window.addEventListener('beforeunload',windowUnloading);


                Object.defineProperties (self,{
                    open : { value : openFile }
                });
                
                zipFS_apiHook.singleton = self;
                return self.open(initial_path);
                
                
                function windowUnloading () {
                    // invoked by browser when user closes BROWSER window
                    window.removeEventListener('beforeunload',windowUnloading);
                    window.removeEventListener(api_call_event_name,apiCall);
                    window.dispatchEvent( 
                        new CustomEvent( 'zipFS_apiHook',{  detail: {  api_id : api_id,  zipfs: full_zip_uri, unloading:true  } })
                    );
                     
                }
                
                function openFile(file) {
                     initial_path = file;
                     window.dispatchEvent( 
                         new CustomEvent( 'zipFS_apiHook',{  detail: {  api_id : api_id,  zipfs: full_zip_uri, file : initial_path  } })
                     );
                     registerForNotifications(initial_path,function(ip){
                         initial_path=ip;
                     });
                     return zipFS_apiHook.singleton;
                }
                
                function fsZipApi() {
                    return {
                               
                               listFiles: function(reqId) { 
                                   window.dispatchEvent( 
                                       new CustomEvent( 'zipFS_'+reqId,{  detail: {  resolve : reqId, resolveData:zip_files.map(prependSlash) } })
                                   );
                               },
                               
                               readFile: function(reqId,path) { 
                                   
                                   const filename = path.replace(leadingSlash,'');
                                   const replyMsgId = 'zipFS_'+reqId;
                                   if (path === "/.zedstate") {
                                       
                                       getZedState(function(json){
                                           return window.dispatchEvent(
                                               new CustomEvent('zipFS_'+reqId,{  
                                                   detail: {  
                                                       resolve : reqId, 
                                                       resolveData:json
                                                   }})
                                           );
                                       });
                                   }
                                   
                                   pwaApi.fetchUpdatedURLContents(filename,true,function (err,buffer,hash) {
                                   //pwaApi.readFileString(filename,true,function (err,data) {
                                      if (err) {
                                          return window.dispatchEvent( 
                                              new CustomEvent( 'zipFS_'+reqId,{  detail: {  reject : reqId, resolveData:err.message||err }})
                                          );
                                      }
                                      tags[path] = hash;
                                      window.dispatchEvent( 
                                          new CustomEvent('zipFS_'+reqId,{  detail: {  resolve : reqId, resolveData:bufferToText(buffer) }})
                                      );
                                   });
                                   
                               },
                               
                               writeFile: function(reqId,path,content) { 
                                   const filename = path.replace(leadingSlash,'');
                                   const replyMsgId = 'zipFS_'+reqId;
                                   
                                   
                                   
                                   if (path === "/.zedstate") {
                                       
                                       setZedState(content,function(){
                                          window.dispatchEvent( 
                                              new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                          );
                                       });
                                   }
                                   
                                   pwaApi.updateURLContents(filename,content,true,function (err,hash) {
                                   //pwaApi.writeFileString(filename,content,true,function (err,hash) {
                                       
                                       if (err) {
                                           return window.dispatchEvent( 
                                               new CustomEvent( replyMsgId,{  detail: {  reject : reqId, resolveData:err.message||err }})
                                           );
                                       }
                                       
                                       tags[path] = hash;
                                       window.dispatchEvent( 
                                           new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                       );
                                       

                                   });
                                    
                                   
                               },
                               
                               deleteFile: function(reqId,path) { 
                                   const filename = path.replace(leadingSlash,'');
                                   const replyMsgId = 'zipFS_'+reqId;
                                   
                                   pwaApi.deleteFile(filename,function (err) {
                                       
                                       if (err) {
                                           return window.dispatchEvent( 
                                               new CustomEvent( replyMsgId,{  detail: {  reject : reqId, resolveData:err.message||err }})
                                           );
                                       }
                                       
                                       window.dispatchEvent( 
                                           new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                       );
         
                                   });
                                   
                                   
                                   
                               },
               
                              // watchFile: function(reqId) {},
                               
                              // unwatchFile: function(reqId) {},
                               
                               getCacheTag: function(reqId,path) { 
                                   
                                   
                                   const filename = path.replace(leadingSlash,'');
                                   const replyMsgId = 'zipFS_'+reqId;
                                   
                                    if (tags[path]) {
                                         return window.dispatchEvent( 
                                             new CustomEvent(replyMsgId,{  detail: {  resolve : tags[path] }})
                                         );
                                    } else {
                                        
                                        pwaApi.readFileString(filename,true,function (err,data) {
                                            if (err) {
                                               return window.dispatchEvent( 
                                                   new CustomEvent( replyMsgId,{  detail: {  resolve : '1' }})
                                               );
                                            }
                                            
                                            tags[path] = data.hash;
                                            delete data.text;
                                            delete data.hash;
                                            
                                            return window.dispatchEvent( 
                                                new CustomEvent( replyMsgId,{  detail: {  resolve : tags[path] }})
                                            );
                                        });
                                        
                                    }
                               },
                               
                               getCapabilities: function(reqId) { },
                               
                               unmount : function (reqId) {
                                    // this zip file is being unmounted.
                                    
                                    if (self.onunmount) {
                                        self.onunmount();
                                    }
                                    const replyMsgId = 'zipFS_'+reqId;
                                    window.dispatchEvent( 
                                        new CustomEvent(replyMsgId,{  detail: {  resolve : reqId } })
                                    );
                                    window.removeEventListener(api_call_event_name,apiCall);
                                    window.removeEventListener('beforeunload',windowUnloading);
                                    zedstate=undefined;
                                    initial_path=undefined;
                                    delete zipFS_apiHook.singleton;
                                    
                                    // pedantically releas each refrenceed object / function
                                    Object.keys(fs_api).forEach(function (fn){
                                        delete fs_api[fn];
                                    });
                                    
                                   
                                    
                                    Object.keys(self).forEach(function (fn){
                                        delete self[fn];
                                    });
                               } 
                           };
                    
                    
                }

                function apiCall (event) {
                    
                    if (event.detail.closed) {
                        return window.removeEventListener(api_call_event_name,apiCall);   
                    }

                    const cmd     = Object.keys(event.detail.api_msg)[0];
                    const args    = event.detail.api_msg[cmd];
                    const handler = fs_api[cmd];
                    if (handler && args) {
                        handler.apply(this,[event.detail.request].concat(args));
                    }
                    

                }
                
                function bufferToHash(path,buffer,cb) {
                    sha1(buffer,function(err,hash){
                        if (err) {
                            tags[path]=1;
                        } else {
                            tags[path]=hash;
                        }
                        const anchor = qs('a[data-filename="'+path.replace(leadingSlash,'')+'"]');
                        if (anchor) {
                            const sh = anchor.parentElement.querySelector('span.sha1');
                            if (sh) {
                                sh.innerHTML=hash;
                            }
                        }
                        cb(hash);
                    });
                }
                
                function bufferToTextAndHash(path,buffer,cb) {
                    bufferToHash(path,buffer,function(hash){
                        cb(bufferToText(buffer),hash);
                    })
                }
               
                function prependSlash(x) { return "/"+x.replace(leadingSlash,'');}
                
                function removePrependedSlash (x) { return x.replace(leadingSlash,'') }

                function getZedState(cb) {
                    if (!zedstate) {
                        zedstate = JSON.stringify({"session.current": [ '/'+initial_path  ]});
                    }
                    return cb (zedstate);
                } 

                function setZedState (json,cb) {
                    zedstate = json;
                    cb();
                }
                
            }
            
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
            
            
            //registerForNotifications("/",function(){});
            zipFS_apiHook ().onunmount = function () {
                
            };
            
            
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



