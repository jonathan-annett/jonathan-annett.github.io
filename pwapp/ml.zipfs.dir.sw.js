/* global ml,self,localforage,Response,Headers,BroadcastChannel */
/*

this code runs in the service worker and generatees html and scripting for the virtual zip editor

*/
ml(`
    
    sha1Lib              | ${ml.c.app_root}sha1.js
    JSZip                | ${ml.c.app_root}jszip.min.js
    htmlFileItemLib      | ${ml.c.app_root}ml.zipfs.render.file.js
    htmlDirLib           | ${ml.c.app_root}ml.zipfs.render.dir.js
    zipFSDirHtml         | ${ml.c.app_root}ml.zipfs.dir.html

    `,function(){ml(2,

    {   
        ServiceWorkerGlobalScope: function zipFSListingLib (  JSZip ) {
            
            return function listingLib(opts) {
                
               const {
                   databases,
                   getZipObject,fetchUpdatedURLContents,getZipFileUpdates,getZipDirMetaTools,fileisEdited,response200,getUpdatedURLs,virtualDirListing,addSyntaxInfo 
               } = opts;   
                       
               const sha1Lib     = ml.i.sha1Lib;
               const sha1        = sha1Lib.cb;
               const sha1Raw     = sha1Lib.cb.raw;
               const sha1Sync    = sha1Lib.sync;
               const bufferToHex = sha1Lib.bufferToHex;
               
               const zipFSDirHtml = ml.i.zipFSDirHtml;
               const htmlDirLib   = ml.i.htmlDirLib;
               
               
               const { resolveZipListing_HTML,
                       resolveZipListing_Script } = htmlDirLib({
                                                      databases,
                                                      getZipObject,
                                                      zipFSDirHtml,
                                                      getZipFileUpdates,
                                                      getZipDirMetaTools,
                                                      virtualDirListing,
                                                      addSyntaxInfo,
                                                      fileisEdited
                                                  });
               return  {
                   
                  resolveZipListing_Script : resolveZipListing_Script,
                  resolveZipListing_HTML   : resolveZipListing_HTML,
                  resolveZipListing        : resolveZipListing_HTML,
                  resolveZipDownload       : resolveZipDownload,
                  getUpdatedZipFile        : getUpdatedZipFile,
                  getZipFileUpdatedFiles   : getZipFileUpdatedFiles
                  
               };
               
               
              
               function resolveZipDownload( url, mode, alias) {
                   
                   return new Promise(function(resolve){
                       
                       getUpdatedZipFile(url,mode,alias,function(err,buffer){
                           if (err) {
                               return resolve(new Response('', {
                                   status: 500,
                                   statusText: err.message|| err
                               }));
                           }
                           
                           sha1(buffer,function(err,hash){
                               const fileEntry = {
                                   contentType   : 'application/zip',
                                   contentLength : buffer.byteLength,
                                   etag          : hash,
                                   date          : new Date()
                               };
                               response200(resolve,buffer,fileEntry);
                           });
                       }); 
                   
                   });
                   
               }
               
               function getZipFileUpdatedFiles (zip_url,alias,db,cb) {
                   
                   if (typeof db==='function') {
                       cb = db;
                       db = "updatedURLS";
                   }
                   
                   if (typeof alias==='function') {
                       cb = alias; alias = undefined;db="updatedURLS";
                   }
                   
                   const main_url = (alias ? alias : zip_url)  + '/' ;
                   const re = new RegExp ('^'+regexpEscape(main_url),'')
                                           
                   return getUpdatedURLs(re,function (err,urls){
                       if (err) return cb(err);
                       return cb (undefined,urls.map(function(u){
                           return u.substr(main_url.length);
                       }));
                   });
               }
               
               function regexpEscape(str) {
                   return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
               }
               
           
               
               function getUpdatedZipFile (zip_url,mode,alias,cb) {
                   
                   if (typeof alias==='function') {
                       cb = alias; alias = undefined;
                   }
                   
                   if (typeof mode==='function') {
                       cb = mode; mode = 'files' ; alias = undefined;
                   }
                   
                   if (['files','editedFiles','hidden','allFiles','deleted'].indexOf(mode)<0) {
                       mode='files';
                   }
                   
                   getZipFileUpdatedFiles(zip_url,alias,function(err,updated_files){
                       if (err) return cb(err);
                       getZipObject(zip_url,function(err,zip,zipFileMeta){
                           if (err) return cb(err);
                           const log = [];
                           const logname = (zipFileMeta.alias_root ?zipFileMeta.alias_root : '') + '.log.txt';
                           getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                               const fetchmode = mode==='editedFiles' ? 'files' : mode;
                               tools[fetchmode](function(filenames){
                                   
                                   filenames = filenames.concat(updated_files.filter(function(f){
                                       return filenames.indexOf(f)<0;
                                   }));
                                   
                                   const newZip = new JSZip();
                                   function nextFile(i) {
                                       if (i<filenames.length) {
                                           const filename  = filenames[i];
                                           if (filename===logname) return nextFile(i+1);
                                           const fileEntry = zipFileMeta.files[filename];
                                            
                                           if (fileEntry) {
                                               const file_url = (alias ? alias : zip_url)  + '/'+filename ;
                                               fetchUpdatedURLContents(file_url,function(err,buffer,updated){
                                                   if (err) return cb (err);
                                                   if (mode==='editedFiles') {
                                                       if (updated) {
                                                           newZip.file(filename,buffer,{date : fileEntry.date,createFolders: false });
                                                           log.push('added edited file     '+sha1Sync(buffer)+' | '+ filename);
                                                       } else {
                                                           log.push('skipped unedited file '+sha1Sync(buffer)+' | '+ filename);
                                                       }
                                                   } else {
                                                       newZip.file(filename,buffer,{date : fileEntry.date,createFolders: false });
                                                       log.push('added '+sha1Sync(buffer)+' | '+filename);
                                                   }
                                                   nextFile(i+1);
                                               });
                                           } else {
                                               log.push('no zip entry for '+filename+', skipping');
                                               nextFile(i+1);
                                           }
                                           
                                       } else {
                                           
                                           newZip.file(logname,log.join('\n'),{date : new Date(),createFolders: false });
                                           
                                           newZip.generateAsync({
                                               type: "arraybuffer",
                                               compression: "DEFLATE",
                                               compressionOptions: {
                                                   level: 9
                                               },
                                               platform : 'UNIX'
                                           }/*,function updateCallback(metadata) {
                                                 console.log("progression: " + metadata.percent.toFixed(2) + " %");
                                                 if(metadata.currentFile) {
                                                     console.log("current file = " + metadata.currentFile);
                                                 }
                                             }*/).then(function (buffer) {
                                                cb(undefined,buffer)
                                           }).catch(cb);
                                           
                                       }
                                   }
                                   nextFile(0);
                               });
                           });
                       });
                   });
               }
               
               /*
               function getDirTemplateHtml (cb) {
                   
                 
                   
                   
                   if (getDirTemplateHtml.cache) {
                       return cb (undefined,getDirTemplateHtml.cache);
                   }
                   
                   fetchUpdatedURLContents ('/pwapp/ml.zipfs.dir.html',function(err,buffer,updated) {
                        if (err) {
                            return cb(err);
                        }
                        getDirTemplateHtml.cache = new TextDecoder().decode(buffer);
                        return cb(undefined,getDirTemplateHtml.cache);
                   });
                   
               }
               
               */
               
           };    
       

        }

    },  {
    
    
            ServiceWorkerGlobalScope: [ ()=> ml.i.JSZip ]
            
        }
            
    
    );
    

});




