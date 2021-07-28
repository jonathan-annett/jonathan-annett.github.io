/* global ml,self,localforage,Response,Headers,BroadcastChannel */

ml(`
    
    sha1Lib              | sha1.js
    JSZip                | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js
    htmlFileItemLib      | ml.zipfs.dir.file.js
    htmlFileMetaLib      | ml.zipfs.dir.file.meta.js
    zipFSDirHtml         | ml.zipfs.dir.html

    `,function(){ml(2,

    {   
        ServiceWorkerGlobalScope: function zipFSListingLib (  JSZip ) {
            
            return function listingLib(getZipObject,fetchUpdatedURLContents,getZipFileUpdates,getZipDirMetaTools,fileisEdited,response200,getUpdatedURLs) {
                       
                       const sha1Lib     = ml.i.sha1Lib;
                       const sha1        = sha1Lib.cb;
                       const sha1Raw     = sha1Lib.cb.raw;
                       const sha1Sync    = sha1Lib.sync;
                       const bufferToHex = sha1Lib.bufferToHex;
                       
                       const zipFSDirHtml = ml.i.zipFSDirHtml;
                   
                       return  {
                           
                          resolveZipListing_Script : resolveZipListing_Script,
                          resolveZipListing_HTML   : resolveZipListing_HTML,
                          
                          resolveZipListing      : resolveZipListing_HTML,
                          resolveZipDownload     : resolveZipDownload,
                          getUpdatedZipFile      : getUpdatedZipFile,
                          getZipFileUpdatedFiles : getZipFileUpdatedFiles
       
                       };
                       
                       
                       function resolveZipListing_Script (zip_meta_js_url,buffer,virtual) {
                           const url = zip_meta_js_url.replace(/\.zip\.meta\.js/,'.zip');
                           return new Promise(function (resolve){
                               
                               getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                                   
                                   if (err || !zip || !zipFileMeta) {
                                       
                                       return resolve ();
                                   }
                                   zipFSDirHtml (function (err,dir_html){ 
                                       
                                       if (err) {
                                           return resolve(new Response('', {
                                               status: 500,
                                               statusText: err.message|| err
                                           }));
                                       }
                                       
                                       
                                       
                                       getZipFileUpdates(virtual ? virtual :  url,function(err,additonalFiles){
                                           
                                           getZipDirMetaTools(url,zip,zipFileMeta,function(tools){
                                               
                                               const file_listing = Object.keys(zipFileMeta.files); 

                                               const updated_prefix = (virtual ? virtual :  url).replace(/\/$/,'')+ "/" ;

                                               const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                                               const uri= urify.exec(url)[2];
                                               const uri_split = uri.split('.zip/').map(function (x,i,a){
                                                   return i===a.length-1?'/'+x:'/'+x+'.zip';
                                               });
                                               
                                               const top_uri_res = uri_split.map(function(uri){ 
                                                   return new RegExp( regexpEscape(uri+"/"),'g');
                                               });
                                               
                                               const htmlFileItemLibOpts = {
                                                   uri,
                                                   alias_root:zipFileMeta.alias_root,
                                                   tools,
                                                   file_listing,
                                                   fileisEdited,
                                                   updated_prefix,
                                                   hidden_files_exist : false // this gets updated by html_file_item()
                                               };
                                               
                                               const {
                                                   boldit,
                                                   linkit
                                               } = ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                                               
                                               const cleanup_links = function(str) {
                                                   top_uri_res.forEach(function(re){
                                                       str = str.replace(re,'/');
                                                   });
                                                   return str;
                                               };
                           
                                               const uri_full_split = uri_split.map(function(x,i,a){
                                                   return a.slice(0,i+1).join("");
                                               });
                                               
                                               var parent_link="";
                                               
                                               parent_link = uri_full_split.map(function(href,i,a){
                                                   const parts = href.split('/.zip');
                                                   const disp  = parts.length===1?undefined:parts.pop();
                                                   const res   = (href.endsWith(uri)?boldit:linkit) (href,disp);
                                                   return res;
                                               }).join("");
                                               
                                               
                                               parent_link = cleanup_links(parent_link);
                                              
                                                       
                                               htmlFileItemLibOpts.parent_link = parent_link;
                                              
                                               const all_files = file_listing.concat(
                                                   
                                                   additonalFiles.map(function(fn){
                                                       return   zipFileMeta.alias_root ? zipFileMeta.alias_root + fn : fn;
                                                   }).filter(function(fn){return file_listing.indexOf(fn)<0;})
                                                   
                                               );
                                               
                                               
                                               const script = renderScript (
                                                   tools,
                                                   updated_prefix,uri,
                                                   virtual,
                                                   zipFileMeta.alias_root,
                                                   all_files,
                                                   parent_link
                                               );
                           
                                               return resolve( 
                                                   
                                                   new Response(
                                                          script, {
                                                                   status: 200,
                                                                   statusText: 'Ok',
                                                                   headers: new Headers({
                                                                     'Content-Type'   : 'application/javascript',
                                                                     'Content-Length' : script.length,
                                                                     'ETag'           : zipFileMeta.etag,
                                                                     'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                                                     'Last-Modified'  : zipFileMeta.date.toString() } )
                                                       })
                                              );
                                              
                                         
                                           });
                                       });
                                       
                                   });
                               });
                               
                           });
                           
                           function regexpEscape(str) {
                               return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
                           }

                            function renderScript (
                            
                                tools,
                                updated_prefix,
                                uri,
                                virtual,
                                alias_root,
                                files, 
                                parent_link) {
                               
                               
                               const head_script = [
                                   
                                   
                                  ' ml("pwaZipDirListing|ml.zipfs.dir.js",function(){ml(2,',
                                  ' ',
                                  '     {',
                                  '         Window: function pageMain( lib ) {',
                                  '             lib = lib ||{};',
                                  '             // add / override window specific methods here',
                                  '             ',
                                  '             return lib;',
                                  '         }',
                                  '     }, {',
                                  '         Window: [',
                                  '             ()=> directoryInfo ()',
                                  '         ]',
                                  ' ',
                                  '     }',
                                  ' ',
                                  '     );',
                                  ' ',
                                  ' ',
                                  '     function directoryInfo () {',
                                  '         const lib = {}  ;',
                                  
                                  '         var zip_url_base='+JSON.stringify('/'+uri)+',',
                                  '         updated_prefix='+ JSON.stringify(updated_prefix)+',',
                                  '         zip_virtual_dir'+(virtual?'='+JSON.stringify(virtual):'')+',',
                                  '         alias_root_fix='+(alias_root?"/^"+regexpEscape(alias_root)+"/":'/^\\s/')+',',
                                  '         alias_root='+JSON.stringify(alias_root)+',',
                                  '         zip_files='+JSON.stringify(files)+',',
                                  '         parent_link='+JSON.stringify(parent_link)+',',
                                  '         full_zip_uri           = location.origin+zip_url_base;',
                                  
                                  tools.metaSrc(),
                                  
                                  '         ml.i.pwaZipDirListing(zip_url_base,zip_virtual_dir,zip_files,full_zip_uri,updated_prefix,alias_root_fix,alias_root,parent_link);',


                                  
                                  '         ',
                                  '         return lib;',
                                  '     }',
                                  ' ',
                                  '  ',
                                  ' ',
                                  ' });'

                                   ];
                                  

                                   

                               return head_script.join("\n");
                           }

                       }
                       
                       function resolveZipListing_HTML (url,buffer,virtual) {
                           
                           return new Promise(function (resolve){
                               
                               getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                                   
                                   if (err || !zip || !zipFileMeta) {
                                       
                                       return resolve ();
                                   }
                                   zipFSDirHtml (function (err,dir_html){ 
                                       
                                       if (err) {
                                           return resolve(new Response('', {
                                               status: 500,
                                               statusText: err.message|| err
                                           }));
                                       }
                                       
                                       
                                       
                                       getZipFileUpdates(virtual ? virtual :  url,function(err,additonalFiles){
                                           
                                           getZipDirMetaTools(url,zip,zipFileMeta,function(tools){
                                               
                                               const file_listing = Object.keys(zipFileMeta.files); 

                                               const updated_prefix = (virtual ? virtual :  url).replace(/\/$/,'')+ "/" ;

                                               const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                                               const uri= urify.exec(url)[2];
                                               const uri_split = uri.split('.zip/').map(function (x,i,a){
                                                   return i===a.length-1?'/'+x:'/'+x+'.zip';
                                               });
                                               
                                               const top_uri_res = uri_split.map(function(uri){ 
                                                   return new RegExp( regexpEscape(uri+"/"),'g');
                                               });
                                               
                                               const htmlFileItemLibOpts = {
                                                   uri,
                                                   alias_root:zipFileMeta.alias_root,
                                                   tools,
                                                   file_listing,
                                                   fileisEdited,
                                                   updated_prefix,
                                                   hidden_files_exist : false // this gets updated by html_file_item()
                                               };
                                               
                                               const {
                                                   html_file_item,
                                                   get_html_file_item,
                                                   boldit,
                                                   linkit,
                                                   fileIsEditable,
                                                   replaceTextVars
                                               } = ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                                               
                                               const html_file_func = get_html_file_item(dir_html) || html_file_item;

                                               const cleanup_links = function(str) {
                                                   top_uri_res.forEach(function(re){
                                                       str = str.replace(re,'/');
                                                   });
                                                   return str;
                                               };
                           
                                               const uri_full_split = uri_split.map(function(x,i,a){
                                                   return a.slice(0,i+1).join("");
                                               });
                                               
                                               var parent_link="";
                                               
                                               
                                               
                                              
                                               parent_link = uri_full_split.map(function(href,i,a){
                                                   const parts = href.split('/.zip');
                                                   const disp  = parts.length===1?undefined:parts.pop();
                                                   const res   = (href.endsWith(uri)?boldit:linkit) (href,disp);
                                                   return res;
                                               }).join("");
                                               
                                               
                                               parent_link = cleanup_links(parent_link);
                                              
                                                       
                                               htmlFileItemLibOpts.parent_link = parent_link;
                                              
                                               const all_files = file_listing.concat(
                                                   
                                                   additonalFiles.map(function(fn){
                                                       return   zipFileMeta.alias_root ? zipFileMeta.alias_root + fn : fn;
                                                   }).filter(function(fn){return file_listing.indexOf(fn)<0;})
                                                   
                                               ).sort();
                                               
                                               //const html_details = all_files.map(html_file_item);
                                               const html_details = all_files.map(html_file_func);
                                               
                                               
                                               
                                               
                                               /*
                                               function renderHtml (
                                               htmlTemplate,tools,updated_prefix,uri,
                                               virtual,alias_root,files, hidden_files_exist,
                                               html_details,parent_link) {
                                               */
                           
                                               const html = renderHtml (
                                                   dir_html,
                                                   replaceTextVars,
                                                   tools,updated_prefix,uri,
                                                   virtual,zipFileMeta.alias_root,
                                                   all_files,
                                                   htmlFileItemLibOpts.hidden_files_exist,
                                                   html_details
                                               );
                           
                                               return resolve( 
                                                   
                                                   new Response(
                                                          html, {
                                                                   status: 200,
                                                                   statusText: 'Ok',
                                                                   headers: new Headers({
                                                                     'Content-Type'   : 'text/html',
                                                                     'Content-Length' : html.length,
                                                                     'ETag'           : zipFileMeta.etag,
                                                                     'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                                                     'Last-Modified'  : zipFileMeta.date.toString() } )
                                                       })
                                              );
                                              
                                         
                                           });
                                       });
                                       
                                   });
                               });
                               
                           });
                           
                           function regexpEscape(str) {
                               return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
                           }

                            function renderHtml (
                            
                                dir_html,replaceTextVars,
                                tools,updated_prefix,uri,
                                virtual,alias_root,files, 
                                hidden_files_exist,
                                html_details) {
                               
                               
                                return replaceTextVars( 
                                   
                                            dir_html, 
                                            
                                            {
                                               uri:uri,
                                               script_uri:'/'+uri+'.meta.js',
                                               head_script:'',
                                               hidden_files_class:hidden_files_exist?' hidden_files_exist':'',
                                               designer:'',
                                               html_details : html_details.join("\n")
                                           }

                                );
                               
                           }

                       }

                       
                       
                       
                       function resolveZipListing (url,buffer,virtual) {
                           
                           return new Promise(function (resolve){
                               
                               getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                                   
                                   if (err || !zip || !zipFileMeta) {
                                       
                                       return resolve ();
                                   }
                                   zipFSDirHtml (function (err,dir_html){ 
                                       
                                       if (err) {
                                           return resolve(new Response('', {
                                               status: 500,
                                               statusText: err.message|| err
                                           }));
                                       }
                                       
                                       
                                       
                                       getZipFileUpdates(virtual ? virtual :  url,function(err,additonalFiles){
                                           
                                           getZipDirMetaTools(url,zip,zipFileMeta,function(tools){
                                               
                                               const file_listing = Object.keys(zipFileMeta.files); 

                                               const updated_prefix = (virtual ? virtual :  url).replace(/\/$/,'')+ "/" ;

                                               const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                                               const uri= urify.exec(url)[2];
                                               const uri_split = uri.split('.zip/').map(function (x,i,a){
                                                   return i===a.length-1?'/'+x:'/'+x+'.zip';
                                               });
                                               
                                               const top_uri_res = uri_split.map(function(uri){ 
                                                   return new RegExp( regexpEscape(uri+"/"),'g');
                                               });
                                               
                                               const htmlFileItemLibOpts = {
                                                   uri,
                                                   alias_root:zipFileMeta.alias_root,
                                                   tools,
                                                   file_listing,
                                                   fileisEdited,
                                                   updated_prefix,
                                                   hidden_files_exist : false // this gets updated by html_file_item()
                                               };
                                               
                                               const {
                                                   html_file_item,
                                                   get_html_file_item,
                                                   boldit,
                                                   linkit,
                                                   fileIsEditable,
                                                   replaceTextVars
                                               } = ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                                               
                                               const html_file_func = get_html_file_item(dir_html) || html_file_item;

                                               const cleanup_links = function(str) {
                                                   top_uri_res.forEach(function(re){
                                                       str = str.replace(re,'/');
                                                   });
                                                   return str;
                                               };
                           
                                               const uri_full_split = uri_split.map(function(x,i,a){
                                                   return a.slice(0,i+1).join("");
                                               });
                                               
                                               var parent_link="";
                                               
                                               
                                               
                                              
                                               parent_link = uri_full_split.map(function(href,i,a){
                                                   const parts = href.split('/.zip');
                                                   const disp  = parts.length===1?undefined:parts.pop();
                                                   const res   = (href.endsWith(uri)?boldit:linkit) (href,disp);
                                                   return res;
                                               }).join("");
                                               
                                               
                                               parent_link = cleanup_links(parent_link);
                                              
                                                       
                                               htmlFileItemLibOpts.parent_link = parent_link;
                                              
                                               const all_files = file_listing.concat(
                                                   
                                                   additonalFiles.map(function(fn){
                                                       return   zipFileMeta.alias_root ? zipFileMeta.alias_root + fn : fn;
                                                   }).filter(function(fn){return file_listing.indexOf(fn)<0;})
                                                   
                                               ).sort();
                                               
                                               //const html_details = all_files.map(html_file_item);
                                               const html_details = all_files.map(html_file_func);
                                               
                                               
                                               
                                               
                                               /*
                                               function renderHtml (
                                               htmlTemplate,tools,updated_prefix,uri,
                                               virtual,alias_root,files, hidden_files_exist,
                                               html_details,parent_link) {
                                               */
                           
                                               const html = renderHtml (
                                                   dir_html,
                                                   replaceTextVars,
                                                   tools,updated_prefix,uri,
                                                   virtual,zipFileMeta.alias_root,
                                                   all_files,
                                                   htmlFileItemLibOpts.hidden_files_exist,
                                                   html_details,
                                                   parent_link
                                               );
                           
                                               return resolve( 
                                                   
                                                   new Response(
                                                          html, {
                                                                   status: 200,
                                                                   statusText: 'Ok',
                                                                   headers: new Headers({
                                                                     'Content-Type'   : 'text/html',
                                                                     'Content-Length' : html.length,
                                                                     'ETag'           : zipFileMeta.etag,
                                                                     'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                                                     'Last-Modified'  : zipFileMeta.date.toString() } )
                                                       })
                                              );
                                              
                                         
                                           });
                                       });
                                       
                                   });
                               });
                               
                           });
                           
                           function regexpEscape(str) {
                               return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
                           }

                            function renderHtml (
                            
                                dir_html,replaceTextVars,
                                tools,updated_prefix,uri,
                                virtual,alias_root,files, 
                                hidden_files_exist,
                                html_details,
                                parent_link) {
                               
                               
                               const head_script = [
                                                       '<script>',
                                                       'var zip_url_base='+JSON.stringify('/'+uri)+',',
                                                       'updated_prefix='+ JSON.stringify(updated_prefix)+',',
                                                       'zip_virtual_dir'+(virtual?'='+JSON.stringify(virtual):'')+',',
                                                       'alias_root_fix='+(alias_root?"/^"+regexpEscape(alias_root)+"/":'/^\\s/')+',',
                                                       'alias_root='+JSON.stringify(alias_root)+',',
                                                       'zip_files='+JSON.stringify(files)+',',
                                                       'parent_link='+JSON.stringify(parent_link)+',',
                                                       'full_zip_uri           = location.origin+zip_url_base;',
                                                       
                                                       tools.metaSrc(),
                                                       
                                                       
                                                       '</script>'
                                                   ];
                                                   
                               return replaceTextVars( 
                                   
                                            dir_html, 
                                            
                                            {
                                               uri:uri,
                                               head_script:head_script.join("\n"),
                                               hidden_files_class:hidden_files_exist?' hidden_files_exist':'',
                                               designer:'',
                                               html_details : html_details.join("\n")
                                           }

                                );
                               
                               
                               /*
                               return htmlTemplate .replace(/<\!--head_script--\>/,head_script.join("\n") )
                                                   .replace(/\$\{uri\}/g,uri)
                                                   .replace(/\$\{html_details\}/, html_details.join("\n") )
                                                   .replace(/\$\{hidden_files_class\}/,hidden_files_exist?' hidden_files_exist':'');
                                */   
                           }

                       }

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
                               cb=db;
                               db="updatedURLS";
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




