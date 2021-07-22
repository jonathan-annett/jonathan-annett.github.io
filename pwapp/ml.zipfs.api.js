/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml([],function(){ml(2,

    {
        Window: function zipFSApiLib( lib ) {
            return lib;
        }
    }, {
        Window: [
            ()=> zipFSApiLib
        ]

    }

    );


    function zipFSApiLib (pwa,full_zip_uri,zip_virtual_dir,find_li,alias_root_fix,alias_root,updated_prefix) {
        
        const sendMessage = pwa.sendMessage;
        const get_file_url= function(file) {
            return   file.indexOf(full_zip_uri)===0 || (zip_virtual_dir && file.indexOf(zip_virtual_dir)===0) ? file
                     : zip_virtual_dir ? zip_virtual_dir +'/'+file : full_zip_uri+'/'+file;
        }; 
        const lib = {
            
            
           filename_to_url : function  (filename) {
               if (zip_virtual_dir) {
                   if (alias_root) {
                       if (filename.indexOf(alias_root)===0) {
                           return updated_prefix + filename.replace(alias_root_fix,'');
                       }
                       
                   }
                   return updated_prefix + filename;
               }
               
               if (alias_root) {
                   if (filename.indexOf(alias_root)===0) {
                       return full_zip_uri + '/' + filename.replace(alias_root_fix,'');
                   }
               }
               
               return full_zip_uri + '/' + filename;
           },
           
           url_to_filename : function  (file_url) {
               
               if (zip_virtual_dir) {
                   if (file_url.indexOf(zip_virtual_dir)===0) {
                       return file_url.substr(zip_virtual_dir.length);
                   }
                   if (zip_virtual_dir.indexOf(location.origin)===0) {
                       const zip_virtual_base = zip_virtual_dir.substr(location.origin.length);
                       if (file_url.indexOf(zip_virtual_base)===0) {
                           return file_url.substr(zip_virtual_base.length);
                       } 
                   }
               } else {
                   if (alias_root) {
                       if (file_url.indexOf(full_zip_uri+'/'+alias_root)===0) {
                           return file_url.substr(full_zip_uri.length + 1 + alias_root.length);
                       }
                   }
                   if (file_url.indexOf(full_zip_uri)===0) {
                       return file_url.substr(full_zip_uri.length);
                   } 
                   if (file_url.indexOf(zip_url_base)===0) {
                       return file_url.substr(zip_url_base.length);
                   }
               }
               
               throw new Error ("can't parse url");
           },
           
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
                  get_file_url(file),
                  function(err,msg){
                     const el = find_li(file);
                     if (el) el.classList.remove('edited');
                     if(cb)cb(err,msg&&msg.url); 
                  });
           },
           
           updateURLContents : function (file,content,hash,cb) {

               return pwa.updateURLContents(
                   get_file_url(file),
                   content,
                   hash,
                   function(err,msg){
                       const el = find_li(file);
                       if (el) {
                           el.classList.add('edited');
                           el.classList[!!el.dataset.editor_id ?"add":"remove"]('editing');
                       }
                       if(cb)cb(err,msg && msg.hash,msg&&msg.url);
                   }
               );
           },
           
           fetchUpdatedURLContents : function (file,hash,cb) {
               
               return pwa.fetchUpdatedURLContents(
                   get_file_url(file),
                   hash,
                   function(err,msg){
                      if (err) return cb (err);
                      const el = find_li(file);
                      if (el) {
                          el.classList[msg.updated?"add":"remove"]('edited');
                          el.classList[!!el.dataset.editor_id ?"add":"remove"]('editing');
                      }
                      cb(undefined,msg.content,msg.updated,msg.hash,msg&&msg.url);
                   }
               );
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
                lib.unregisterForNotifications = function (cb) {
                    msg.channel.close();
                    sendMessage('unregisterForNotifications',{
                        zip     : full_zip_uri,
                        virtual : zip_virtual_dir,
                        notificationId : msg.notificationId
                    },function(err,msg){
                        if (err) return cb (err);
                        cb(undefined);
                    });
                    
                    lib.unregisterForNotifications = function (cb) {
                         cb();
                    };
                    
                    lib.registerForNotifications = ___registerForNotifications;
                };
                
                lib.registerForNotifications = function (newcb) {
                     cb=newcb;
                };
            });
        }
      
        return lib;
        
        
    }

 

});


