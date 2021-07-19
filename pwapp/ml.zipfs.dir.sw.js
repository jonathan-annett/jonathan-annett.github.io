/* global ml,self,localforage,Response,Headers,BroadcastChannel */

ml(`
    
    sha1Lib  | sha1.js
    JSZip    | https://cdnjs.cloudflare.com/ajax/libs/jszip/3.6.0/jszip.min.js
    

    `,function(){ml(2,

    {   
        ServiceWorkerGlobalScope: function zipFSListingLib (  JSZip ) {
            
            
            
            return function listingLib(getZipObject,fetchUpdatedURLContents,getZipFileUpdates,getZipDirMetaTools,fileisEdited,response200) {
                       
                       const sha1Lib     = ml.i.sha1Lib;
                       const sha1        = sha1Lib.cb;
                       const sha1Raw     = sha1Lib.cb.raw;
                       const sha1Sync    = sha1Lib.sync;
                       const bufferToHex = sha1Lib.bufferToHex;
                   
                       return  {
                           
                          resolveZipListing:resolveZipListing,
                          resolveZipDownload:resolveZipDownload,
                          getUpdatedZipFile:getUpdatedZipFile
       
                       };
                       
                       function resolveZipListing (url,buffer,virtual) {
                           
                           return new Promise(function (resolve){
                               
                               getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                                   
                                   if (err || !zip || !zipFileMeta) {
                                       
                                       return resolve ();
                                   }
                                   getDirTemplateHtml (function (err,htmlTemplate){ 
                                       
                                       const doRenderHtml = err||!htmlTemplate ? renderHtml_legacy : renderHtml;

                                       getZipFileUpdates(url,function(err,additonalFiles){
                                           
                                           getZipDirMetaTools(url,zip,zipFileMeta,function(tools){
                                              
                                               
                                               const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                                               const uri= urify.exec(url)[2];
                                               const uri_split = uri.split('.zip/').map(function (x,i,a){
                                                   return i===a.length-1?'/'+x:'/'+x+'.zip';
                                               });
                                               
                                               const top_uri_res = uri_split.map(function(uri){ 
                                                   return new RegExp( regexpEscape(uri+"/"),'g');
                                               });
                                               
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
                                              
                                               const updated_prefix = virtual ? virtual :  url + "/" ;
                                                       
                                               let   hidden_files_exist = false;
                                               
                                     
                                               const file_listing = Object.keys(zipFileMeta.files);
                                               const all_files = file_listing.concat(
                                                   
                                                   additonalFiles.filter(function(fn){return file_listing.indexOf(fn)<0;})
                                                   
                                               ).sort();
                                               
                                               const html_details = all_files.map(html_file_item);
                           
                                               const html = doRenderHtml (htmlTemplate,uri,virtual,zipFileMeta.alias_root,all_files,hidden_files_exist,html_details,parent_link);
                           
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
                                              
                                              
                                              
                                              function html_file_item (filename){
                             
                                                 const full_uri = "/"+uri+"/"+filename,
                                                       basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
                                                 const edited_attr  = ' data-balloon-pos="right" aria-label="'            + basename + ' has been edited locally"';
                                                 const edit_attr    = ' data-balloon-pos="down-left" aria-label="Open '       + basename + ' in zed"'; 
                                                 const zip_attr     = ' data-balloon-pos="down-left" aria-label="...explore ' + basename + ' contents" "' ;
                                                 const alt_name     = zipFileMeta.alias_root && zipFileMeta.alias_root+basename;
                                                 const is_hidden    = tools.isHidden(basename) || alt_name && tools.isHidden(alt_name) ;
                                                 const is_in_zip    = file_listing.indexOf(filename)>=0;
                                                 const is_deleted   = is_hidden && ( tools.isDeleted(basename) || alt_name && tools.isDeleted(alt_name) );
                                                 const is_editable  = fileIsEditable(filename);
                                                 const is_zip       = filename.endsWith(".zip");
                                                 const is_edited    = fileisEdited( updated_prefix+filename );
                                                 
                                                 const sha1span     = '<span class="sha1"></span>';
                                                 
                                                 const edited       = is_edited ? '<span class="edited"'+edited_attr+'>&nbsp;&nbsp;&nbsp;</span>' : '';
                                                 const cls = is_deleted ? ["deleted"] : [];
                                                 if (is_edited)  cls.push("edited");
                                                 if (is_hidden)  cls.push("hidden");
                                                 const li_class     = cls.length===0 ? '' : ' class="'+cls.join(' ')+'"';
                                                 const zedBtn =   is_editable   ? [ '<a'+edit_attr+ ' data-filename="' + filename + '"><span class="editinzed">&nbsp;</span>',  '</a>' + sha1span +edited ] 
                                                                : is_zip        ? [ '<a'+zip_attr+  ' href="/'+uri+'/' + filename + '"><span class="zipfile">&nbsp;</span>',    '</a>' + sha1span +edited ]   
                                                                :                 [ '<a data-filename="'               + filename + '"><span class="normal">&nbsp;</span>',     '</a>' + sha1span +edited ] ;
                                                 
                                                 if (is_hidden) hidden_files_exist = true;
                                                 return '<li'+li_class+'><a data-filename="' + filename + '" data-inzip="'+ (is_in_zip?'1':'0') + '"><span class="deletefile"></span></a><span class="full_path">' + parent_link +'/</span>' +linkit(full_uri,filename,zedBtn) + '</li>';
                                              }
                                              
                                           });
                                       });
                                       
                                   });
                               });
                               
                           });
                           
                           function regexpEscape(str) {
                               return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
                           }
                           
                           
                           function fileIsEditable (filename) {
                               const p = filename.lastIndexOf('.');
                               return p < 1 ? false:["js","json","css","md","html","htm"].indexOf(filename.substr(p+1))>=0;
                           }
                           
                           
                          function boldit(uri,disp){
                              const split=(disp||uri).split("/");
                              if (split.length===1) return '<b>'+(disp||uri)+'</b>';
                              const last = split.pop();
                              if (split.length===1) return split[0]+'/<b>'+last+'</b>';
                              return split.join("/")+'/<b>'+last+'</b>';
                          }
                          
                          function linkit(uri,disp,a_wrap){ 
                              a_wrap=a_wrap||['<a href="'+uri+'">','</a>'];
                              const split=(disp||uri).split("/");
                              if (split.length===1) return a_wrap.join(disp||uri);
                              const last = split.pop();
                              if (split.length===1) return split[0]+'/'+ a_wrap.join(last);
                              return split.join("/")+'/'+ a_wrap.join(last);
                          }
                       
                          
                           
                           function renderHtml_legacy (ignore,uri,virtual,alias_root,files, hidden_files_exist,html_details,parent_link) {
                               
                               const html = [
                                   
                               '<!DOCTYPE html>',
                               '<!--legacy-->',
                               '<html>',
                               '<head>',
                                 '<title>files in '+uri+'</title>',
                                 '<script>',
                                 'var zip_url_base='+JSON.stringify('/'+uri)+',',
                                 'zip_virtual_dir'+(virtual?'='+JSON.stringify(virtual):'')+',',
                                 'alias_root_fix='+(alias_root?"/^"+regexpEscape(alias_root)+"/":'/^\\s/')+',',
                                 'zip_files='+JSON.stringify(files)+',',
                                 'parent_link='+JSON.stringify(parent_link)+';',
                                 '</script>',
                                 '<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/balloon-css/1.2.0/balloon.min.css" integrity="sha512-6jHrqOB5TcbWsW52kWP9TTx06FHzpj7eTOnuxQrKaqSvpcML2HTDR2/wWWPOh/YvcQQBGdomHL/x+V1Hn+AWCA==" crossorigin="anonymous" referrerpolicy="no-referrer" />',
                                 '<link rel="stylesheet" href="ml.zipfs.dir.css"/>',
                                 '</style>',
                               '</head>',
                               '<body class="disable-select">',
                               '<script src="ml.zedhook.js" defer></script>',
                               '<script src="ml.zipfs.dir.js" defer></script>',
                               '<script src="ml.amd.js"></script>',
                               '<h1> files in '+uri,
                               '<span>show full path</span><input class="fullpath_chk" type="checkbox">',
                               '<span id="show_hidden">show hidden files</span><input class="hidden_chk" type="checkbox">',
                               '<a class="downloadfull" href="/'+uri+'?download=files" data-balloon-pos="down-left" aria-label="Download full (including edits)">&nbsp;&nbsp;&nbsp;</a>',
                               '<a class="download" href="/'+uri+'?download=editedFiles" data-balloon-pos="down-left" aria-label="Download edited files">&nbsp;&nbsp;&nbsp;</a>',
                               '<a class="download" id="img_dl_link" data-balloon-pos="down-left" aria-label="Download zip png image">&nbsp;&nbsp;&nbsp;</a>',
                               '<span id="img_dl_link2"></span>',                        
                               '</h1>',
                               '<div id="inputModal" class="modal">',
                               '  <div class="modal-content">',
                               '    <span class="close">&times;</span>',
                               '    <p>Filename:<input id="newfilename" placeholder"file.js" value=""></p>',
                               '  </div>',
                               '</div>',
                               '<div>',
                               '<ul class="hide_hidden hide_full_path ' + (hidden_files_exist ? + 'hidden_files_exist' :'' ) + '">'
                               
                               ].concat (html_details,
                               [
                                   '</ul>',
                                   '</div>',
                                   '<img id="show_dl_img" src="/'+uri+'.png">',
                                   '</body>',
                                   '</html>'
                                   
                               ]).join('\n');
                               
                               return html;
                       
                           }
                           
                           function renderHtml (htmlTemplate,uri,virtual,alias_root,files, hidden_files_exist,html_details,parent_link) {
                               
                               
                               const head_script = [
                                                       '<script>',
                                                       'var zip_url_base='+JSON.stringify('/'+uri)+',',
                                                       'zip_virtual_dir'+(virtual?'='+JSON.stringify(virtual):'')+',',
                                                       'alias_root_fix='+(alias_root?"/^"+regexpEscape(alias_root)+"/":'/^\\s/')+',',
                                                       'zip_files='+JSON.stringify(files)+',',
                                                       'parent_link='+JSON.stringify(parent_link)+';',
                                                       '</script>'
                                                   ];
                                                   
                               
                               return htmlTemplate .replace(/<\!--head_script--\>/,head_script.join("\n") )
                                                   .replace(/\$\{uri\}/g,uri)
                                                   .replace(/\$\{html_details\}/, html_details.join("\n") )
                                                   .replace(/\$\{hidden_files_class\}/,hidden_files_exist?' hidden_files_exist':'');
                                   
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
                           getZipObject(zip_url,function(err,zip,zipFileMeta){
                               if (err) return cb(err);
                               const log = [];
                               const logname = (zipFileMeta.alias_root ?zipFileMeta.alias_root : '') + '.log.txt';
                               getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                                   const fetchmode = mode==='editedFiles' ? 'files' : mode;
                                   tools[fetchmode](function(filenames){
                                       
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
                           
                       }
                       
                       
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
                       
                       
                       
                   };    
       

        }

    },  {
    
    
            ServiceWorkerGlobalScope: [ ()=> ml.i.JSZip ]
            
        }
            
    
    );
    

});




