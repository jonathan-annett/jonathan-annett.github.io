/* global ml,Response,Headers */

ml(`

  htmlFileMetaLib      | ${ml.c.app_root}ml.zipfs.dir.file.meta.js
  zipFSResponseLib     | ${ml.c.app_root}ml.zipfs.response.js 
  zipFSResolveLib      | ${ml.c.app_root}ml.zipfs.resolve.js 

`,function(){ml(2,

    {
        Window: function htmlDirLib(  ) {
            return function htmlDirLib (api) {
                
                const  {
                    databases,
                    getZipObject,
                    zipFSDirHtml,
                    getZipFileUpdates,
                    getZipDirMetaTools,
                    virtualDirListing,
                    addEditorInfo,
                    fileisEdited,
                } = api;
                
                return {
                    resolveZipListing_HTML
                };
                

                function resolveZipListing_HTML (url,buffer,virtual) {

                }

            }
        },

        ServiceWorkerGlobalScope: function htmlDirLib(  ) {
            
            
            const dir_meta_name  = ml.i.zipFSResolveLib.dir_meta_name;
            
            const response200_HTML = ml.i.zipFSResponseLib.response200_HTML;
            
            return function htmlDirLib (api) {
                       
               const {
                     databases,
                     getZipObject,
                     zipFSDirHtml,
                     getZipFileUpdates,
                     getZipDirMetaTools,
                     virtualDirListing,
                     addEditorInfo,
                     fileisEdited
                     
                 } = api;
               
               return {
                   
                   resolveZipListing_HTML,
                   resolveVirtualDirListing_HTML,
                   
                   resolveZipListing_Script
                   
               };
               
               function resolveZipListing_HTML (url,buffer) {
                   
                   return new Promise(function (resolve){
                       
                       getZipFilesOpts(url,buffer,function(htmlFileItemLibOpts,dirData){
                           
                            zipFSDirHtml (function (err,dir_html){
                               
                               const renderFileLib=ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                               setParentLink(renderFileLib,htmlFileItemLibOpts,url);
                              
                               const html = renderDirPage(url,undefined,dir_html, htmlFileItemLibOpts,renderFileLib );
                               
                               return response200_HTML (resolve,html);
                           });

                       });
                       
                   });
                   
               }
               
               // when an explicit zip is being edited, this function is called to
               // get options to pass into htmlFileItemLib()
               
               function getZipFilesOpts (url,buffer,cb) {
                   
                   getZipObject(url,buffer,function(err,zip,zipFileMeta) {
                           
                       getZipFileUpdates(url,function(err,additionalFiles){
                           
                           getZipDirMetaTools(url,zip,zipFileMeta,function(tools){
                               
                               const file_listing = Object.keys(zipFileMeta.files); 
    
                               const updated_prefix = url  + "/" ;
    
                               const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                               const uri= urify.exec(url)[2];
                               
                               const dirData = {
                                   url         : url,
                                   zips        : [ url ],
                                   alias_root  : zipFileMeta.alias_root,
                                   files       : { },
                                   editor      : { }
                               };
                               
                               const htmlFileItemLibOpts = {
                                   alias_root    : zipFileMeta.alias_root,
                                   fileFullUri   : function(filename) { return "/"+uri+"/"+filename;},
                                   fileIsHidden  : tools.isHidden,
                                   fileIsDeleted : tools.isDeleted,
                                   file_sha1      : function(file){
                                       return dirData.editor[file] && dirData.editor[file].hash ? dirData.editor[file].hash : '';
                                   },
                                   fileHasErrors : function(file) {
                                        return dirData.editor[file] ? !!dirData.editor[file].errors : false;
                                   },
                                   fileHasWarnings : function(file) {
                                        return dirData.editor[file] ? !!dirData.editor[file].warnings : false;
                                   },
                                   fileisEdited  ,
                                   file_listing  ,
                                   updated_prefix,
                                   hidden_files_exist : false 
                               };
                               
                               
                               file_listing.forEach(function(file){
                                   if (file.indexOf(zipFileMeta.alias_root)===0) {
                                      dirData.files[file]=0;
                                   }
                               });
    
                               
                                   
                               additionalFiles.map(function(fn){
                                   return   zipFileMeta.alias_root + fn;
                               }).forEach(function(fn){
                                   if (fn.indexOf(zipFileMeta.alias_root)===0) {
                                       const ix = file_listing.indexOf(fn);
                                       if (ix<0) {
                                           dirData.files[fn]=-1;
                                       } else {
                                           dirData.files[fn] = 0 - (2+ix);
                                       }
                                   }
                               });
                                   
                               htmlFileItemLibOpts.all_files = Object.keys(dirData.files).sort();
                               
                               
                               const url_split = url.split('/');
                               dirData.alias_url   = '';
                               
                               if (url_split.length > 2) {
                                   const test = url_split.pop().replace(/\.zip$/,'/');
                                   const files = Object.keys(dirData.files);
                                   const count = files.reduce(function(n,fn){
                                       if (fn===dir_meta_name) return n+1;
                                       return fn.indexOf(test)===0?n+1:n;
                                   },0);
                                   if (count===files.length) {  
                                       dirData.url = url_split.join('/')+'/';
                                       dirData.alias_url = test;
                                   }
                               }
                               
                               
                               addEditorInfo(databases.updatedMetadata,dirData,function(){
                                   cb (htmlFileItemLibOpts,dirData);
                               });
    
                           });
                           
                       });
                       
                       
                   });
               }
               
               
               
               
               function resolveVirtualDirListing_HTML (url,buffer) {
                   
                   return new Promise(function (resolve){
                       
                       getZipFilesOpts(url,buffer,function(htmlFileItemLibOpts,dirData){
                           
                            zipFSDirHtml (function (err,dir_html){
                               
                               const renderFileLib=ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                               setParentLink(renderFileLib,htmlFileItemLibOpts,url);
                              
                               const html = renderDirPage(url,undefined,dir_html, htmlFileItemLibOpts,renderFileLib );
                               
                               return response200_HTML (resolve,html);
                           });

                       });
                       
                   });
                   
               }
               
               function getVirtualDirOpts(dirData) {
                   
                   const file_listing = Object.keys(dirData.editor);
                   Object.keys(dirData.files).forEach(function(file){
                       if (!dirData.editor[file]) {
                           file_listing[file].push(file);
                       }
                   });
                   
                   const htmlFileItemLibOpts = {
                       
                       fileFullUri   : function(fn){ 
                           const ix = dirData.files[fn];
                           const prefix = typeof ix==='number'&& ix >= 0 ? dirData.zips[ ix ] : dirData.url;
                           return (prefix.replace(/^https\:\/\//,'')+fn).replace(/^.*\//,'/');
                       },
                       alias_root    : dirData.alias_root,
                       fileIsHidden  : function(fn){ return /^\./.test(fn); },
                       fileIsDeleted : function(){   return false;},
                       fileisEdited  : function(fn){ return dirData.files[fn]<0; },
                       file_sha1     : function(fn){ return dirData.editor[fn] ? dirData.editor[fn].hash : '';},
                       fileHasErrors : function(fn) {
                            return dirData.editor[fn] ? !!dirData.editor[fn].errors : false;
                       },
                       fileHasWarnings : function(fn) {
                            return dirData.editor[fn] ? !!dirData.editor[fn].warnings : false;
                       },
                       file_listing,
                       updated_prefix : dirData.url,
                       hidden_files_exist : false 
                   };
                   
               }
       
               function setParentLink (renderFileLib,htmlFileItemLibOpts,url) {
                   
                   const urify = /^(https?:\/\/[^\/]+)\/?([^?\n]*)(\?[^\/]*|)$/;
                   const uri= urify.exec(url)[2];
                   const uri_split = uri.split('.zip/').map(function (x,i,a){
                       return i===a.length-1?'/'+x:'/'+x+'.zip';
                   });
                   
                   const top_uri_res = uri_split.map(function(uri){ 
                       return new RegExp( regexpEscape(uri+"/"),'g');
                   });
                   
                   const { boldit, linkit } = renderFileLib;
                   
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
       
                   parent_link = uri_full_split.map(function(href){
                       const parts = href.split('/.zip');
                       const disp  = parts.length===1?undefined:parts.pop();
                       const res   = (href.endsWith(uri)?boldit:linkit) (href,disp);
                       return res;
                   }).join("");
       
                   htmlFileItemLibOpts.parent_link = cleanup_links(parent_link);
                   
               }
               
               function resolveZipListing_Script (zip_meta_js_url,buffer) {
                   
                   const url = zip_meta_js_url.replace(/\.zip\.meta\.js$/,'.zip');
                   
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
                               
                               getZipFileUpdates(url,function(err,additionalFiles){
                                   
                                   getZipDirMetaTools(url,zip,zipFileMeta,function(tools){
                                       
                                       const file_listing = Object.keys(zipFileMeta.files); 
       
                                       const updated_prefix = url + "/" ;
       
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
                                           hidden_files_exist : false  
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
                                           
                                           additionalFiles.map(function(fn){
                                               return   zipFileMeta.alias_root ? zipFileMeta.alias_root + fn : fn;
                                           }).filter(function(fn){return file_listing.indexOf(fn)<0;})
                                           
                                       );
                                       
                                       const script = renderScript (
                                           updated_prefix,
                                           parent_link
                                       );
                   
                                       return resolve( 
                                           
                                           new Response(
                                                  script, {
                                                           status: 200,
                                                           statusText: 'Ok',
                                                           headers: new Headers({
                                                             'Content-Type'   : 'application/javascript',
                                                             'Content-Length' : script.length } )
                                               })
                                      );
                                      
                                 
                                   });
                                   
                               });
                               
                           });
                       });
                       
                   });
                   
                   function renderScript (updated_prefix,parent_link,virtual) {
                        
                       const head_script = [
                           
                           
                          ' ml(["pwaZipDirListing|'+ml.c.app_root+'ml.zipfs.dir.js",',
                          '     "localDirLib|'+ updated_prefix+ 'virtual-listing.json'+(virtual?'?virtual_prefix='+encodeURIComponent(virtual):'')+'"],function(){ml(2,',
                          ' ',
                          '     {',
                          '         Window: function pageMain( lib ) {',
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
                          '         ml.i.localDirLib(function(e,dir){',
                          '            if (e) {',
                          '               console.log(e);',
                          '            } else {',
                          '               ml.i.pwaZipDirListing(dir,'+JSON.stringify( parent_link )+');',
                          '            }',
                          '         });',
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
               
            };
        } 
    }, {
        Window: [

        ],
        ServiceWorkerGlobalScope: [
            
        ]
        
    }

    );
    
    function regexpEscape(str) {
        return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
    }
    
    
    function renderDirPage (url,virtual,dir_html,renderOpts,renderLib) {
        
        const html_file_func = renderLib.get_html_file_item(dir_html);
        const file_entry = renderOpts.all_files.map(html_file_func);
        const origin = location.origin;
             
        const virtual_prefix =  virtual ?  '?virtual_prefix='+encodeURIComponent(
                   virtual.indexOf(origin)===0? virtual.substr(origin.length) : virtual 
                   ) : '';
                   
        const app_root = ml.c.app_root;
        const uri = url.replace(/^https\:\/\//,'').replace(/.*\//,app_root);
        
         return renderLib.replaceTextVars(
             dir_html, {
                uri                : uri,
                app_root           : app_root,
                script_uri         : uri  + '.meta.js' + virtual_prefix ,
                head_script        : '',
                hidden_files_class : renderOpts.hidden_files_exist?' hidden_files_exist':'',
                designer           : '',
                file_entry         : file_entry.join("\n")
            }
         );
            
    }
 
    

});
