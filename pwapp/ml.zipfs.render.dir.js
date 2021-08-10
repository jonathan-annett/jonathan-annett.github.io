/* global ml,Response,Headers */

ml(`

  htmlFileMetaLib      | ${ml.c.app_root}ml.zipfs.dir.file.meta.js
  
`,function(){ml(2,

    {
        Window: function htmlDirLib( lib ) {
            return lib;
        },

        ServiceWorkerGlobalScope: function htmlDirLib( lib ) {
             return lib;
        } 
    }, {
        Window: [
            ()=> htmlDirLib
        ],
        ServiceWorkerGlobalScope: [
            ()=> htmlDirLib
        ]
        
    }

    );
    
    
   

    function htmlDirLib (api) {
        
        const  {
            getZipObject,
            zipFSDirHtml,
            getZipFileUpdates,
            getZipDirMetaTools,
            virtualDirListing,
            fileisEdited
            
        } = api;
        
        return {
            resolveZipListing_HTML,
            resolveZipListing_Script
        };
        
        
           
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

                        getZipFileUpdates(virtual ? virtual :  url,function(err,additionalFiles){
                            
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
                                    alias_root    : zipFileMeta.alias_root,
                                    fileIsHidden  : tools.isHidden,
                                    fileIsDeleted : tools.isDeleted,
                                    fileisEdited  ,
                                    file_listing  ,
                                    updated_prefix,
                                    hidden_files_exist : false 
                                };
                                
                                const {
                                    get_html_file_item,
                                    boldit,
                                    linkit,
                                    fileIsEditable,
                                    replaceTextVars
                                } = ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                                
                                const html_file_func = get_html_file_item(dir_html);

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
                                    
                                ).sort();
                                
                                const html_details = all_files.map(html_file_func);
                                
                                const html = renderHtml (
                                    dir_html,
                                    replaceTextVars,
                                    uri,
                                    url,
                                    virtual,
                                    zipFileMeta.alias_root,
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
                                                     // 'ETag'           : zipFileMeta.etag,
                                                     // 'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                                     // 'Last-Modified'  : zipFileMeta.date.toString() 
                                                    })
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
             
                 dir_html,
                 replaceTextVars,
                 uri,
                 url,
                 virtual,
                 alias_root,
                 hidden_files_exist,
                 html_details) {
                 const origin = location.origin;
                 
                 const virtual_prefix =  virtual ?  '?virtual_prefix='+encodeURIComponent(
                           virtual.indexOf(origin)===0? virtual.substr(origin.length) : virtual 
                           ) : '';
                           
                 return replaceTextVars(
                    
                     dir_html,
                     {
                        uri                : uri,
                        app_root           : ml.c.app_root,
                        script_uri         : '/'+uri+'.meta.js' + virtual_prefix ,
                        head_script        : '',
                        hidden_files_class : hidden_files_exist?' hidden_files_exist':'',
                        designer           : '',
                        html_details       : html_details.join("\n")
                    }

                 );
                
            }

        }
        
        
        function resolveZipListing_HTML_1 (url,buffer,virtual) {
            
            
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
                        
                        
                        if (virtual) {
                            
                            virtualDirListing(virtual,function(err,listingData){
                                
                                const all_files = Object.keys(listingData.files).sort();
                                generateListing(all_files);
                                
                            });
                            
                        } else {

                            getZipFileUpdates(url,function(err,additionalFiles){
                                
                                getZipDirMetaTools(url,zip,zipFileMeta,function(tools){

                                    const file_listing = Object.keys(zipFileMeta.files); 
                                    
                                    const all_files = file_listing.concat(
                                        
                                        additionalFiles.map(function(fn){
                                            return   zipFileMeta.alias_root ? zipFileMeta.alias_root + fn : fn;
                                        }).filter(function(fn){return file_listing.indexOf(fn)<0;})
                                        
                                    ).sort();
                                    
                                    generateListing(all_files);
                                   
                                });
                            });
                            
                        
                        }
                        
                         function generateListing(all_files) {

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
                                            //tools,
                                            all_files,
                                            fileisEdited,
                                            updated_prefix,
                                            hidden_files_exist : false 
                                        };
                                        
                                        const {
                                            get_html_file_item,
                                            boldit,
                                            linkit,
                                            fileIsEditable,
                                            replaceTextVars
                                        } = ml.i.htmlFileItemLib (htmlFileItemLibOpts);
                                        
                                        const html_file_func = get_html_file_item(dir_html);

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
                                            updated_prefix,
                                            uri,url,
                                            virtual,
                                            //zipFileMeta.alias_root,
                                            //all_files,
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
                                                              'Last-Modified'  : zipFileMeta.date.toString() 
                                                            })
                                                })
                                       );
                                       
                                }
                    });
                    
                });
                
            });
            
            function regexpEscape(str) {
                return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
            }

             function renderHtml (
             
                 dir_html,
                 replaceTextVars,
                // tools,
                 updated_prefix,uri,url,
                 virtual,
                 //alias_root,
                 //files, 
                 hidden_files_exist,
                 html_details) {
                 const origin = location.origin;
                 
                 const virtual_prefix =  virtual ?  '?virtual_prefix='+encodeURIComponent(
                           virtual.indexOf(origin)===0? virtual.substr(origin.length) : virtual 
                           ) : '';
                           
                 return replaceTextVars(
                    
                             dir_html, 
                             
                             {
                                uri:uri,
                                app_root:ml.c.app_root,
                                script_uri:'/'+uri+'.meta.js' + virtual_prefix ,
                                head_script:'',
                                hidden_files_class:hidden_files_exist?' hidden_files_exist':'',
                                designer:'',
                                html_details : html_details.join("\n")
                            }

                 );
                
            }

        }
        
        
        function resolveZipListing_Script (zip_meta_js_url,buffer,virtual) {
            
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
                        
                        getZipFileUpdates(virtual ? virtual :  url,function(err,additionalFiles){
                            
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

             function renderScript (updated_prefix,parent_link) {
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
                   
                 //  '         var zip_url_base='+JSON.stringify('/'+uri)+',',
                 //  '         updated_prefix='+ JSON.stringify(updated_prefix)+',',
                 //  '         zip_virtual_dir'+(virtual?'='+JSON.stringify(virtual):'')+',',
                 //  '         alias_root_fix='+(alias_root?"/^"+regexpEscape(alias_root)+"/":'/^\\s/')+',',
                 //  '         alias_root='+JSON.stringify(alias_root)+',',
                 // // '         zip_files='+JSON.stringify(files,undefined,4)+',',
                 //  '         parent_link='+JSON.stringify(parent_link)+',',
                 //  '         full_zip_uri           = location.origin+zip_url_base;',
                 //  
                   //tools.metaSrc(),
                   '         ml.i.localDirLib(function(e,dir){',
                   //'            ml.i.pwaZipDirListing(zip_url_base,alias_root_fix,alias_root,zip_virtual_dir,full_zip_uri,parent_link,dir);',
                   '            if (e) {',
                   '               console.log(e);',
                   '            } else {',
                   '               ml.i.pwaZipDirListing(dir,'+JSON.stringify(parent_link)+');',
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
        

      
        

    }
    
    
    

});
