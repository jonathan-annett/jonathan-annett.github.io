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


    function zipFSApiLib (pwa,full_zip_uri,zip_virtual_dir,find_li,alias_root_fix) {
        
        const sendMessage = pwa.sendMessage;
        
        const lib = {
           
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
                  zip_virtual_dir ? zip_virtual_dir +'/'+file : full_zip_uri+'/'+file,
                  //zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,
                  function(err,msg){
                     const el = find_li(file);
                     if (el) el.classList.remove('edited');
                     if(cb)cb(err,msg); 
                  });
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
           },
           
           fetchUpdatedURLContents : function (file,hash,cb) {
               return pwa.fetchUpdatedURLContents(
                   zip_virtual_dir ? zip_virtual_dir +'/'+file.replace(alias_root_fix,'') : full_zip_uri+'/'+file,hash,
                   function(err,msg){
                      if (err) return cb (err);
                      const el = find_li(file);
                      if (el) {
                          el.classList[msg.updated?"add":"remove"]('edited');
                          el.classList[msg.updated?"add":"remove"]('editing');
                      }
                      cb(undefined,msg.content,msg.updated,msg.hash);
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


