/* global ml */

ml(`
  htmlFileMetaLib      | ${ml.c.app_root}ml.zipfs.dir.file.meta.js
  
`,function(){ml(2,

    {
        Window: function htmlFileItemLib( lib ) {
            return lib;
        },

        ServiceWorkerGlobalScope: function htmlFileItemLib( lib ) {
             return lib;
        } 
    }, {
        Window: [
            ()=> htmlFileItemLib
        ],
        ServiceWorkerGlobalScope: [
            ()=> htmlFileItemLib
        ]
        
    }

    );
    
    const  { fileIsEditable,fileIsImage,aceModeForFile,aceThemeForFile } =  ml.i.htmlFileMetaLib; 
    
    const hidden_js_regex = /\.hidden\-js(on)?$/;

    function htmlFileItemLib (options) {
        
        const {uri,alias_root,tools,file_listing,fileisEdited,updated_prefix} = options;
        
        return {
            get_html_file_item,
            boldit,
            linkit,
            extractWrapperText,
            replaceWrapperText,
            replaceVarText,
            replaceTextVars,
            hidden_js_regex
        };
        
        
       
        function extractWrapperTags(tag) {
            return [ '<!--'+tag+'>-->', '<!--<'+tag+'-->'];
        }

        function replaceVarWrapperTags(tag) {
           return [ '${'+tag+'}', '<!--'+tag+'-->'];
        }
        
        function replaceVarText(text,key,value) {
            replaceVarWrapperTags(key).forEach(function(search){
                text = text.split(search).join(value);
            });
            return text;
        }


        function extractWrapperText(text,tag) {
           const [prefix,suffix] = extractWrapperTags(tag);
           const start = text.indexOf(prefix);
           if (start<0) return false;
           text = text.substr(start+prefix.length);
           const end = text.indexOf(suffix);
           if (end<0) return false;
           return text.substr(0,end);
        }
        
         
        function replaceWrapperText(text,tag,withText) {
            
            const [prefix,suffix] = extractWrapperTags(tag);
            const prefix_len = prefix.length, suffix_len = suffix.length;
            const output  = options.keep_comments ? prefix+withText+suffix : withText ;
            return rep(text);
            
            function rep (text) {
                const start   = text.indexOf(prefix);
                if (start<0) return text;
                
                const text2   = text.substr(start+prefix_len);
                const end     = text2.indexOf(suffix);
                if (end<0) return text;
                const text3   = text2.substr(end+suffix_len);
                const newText = text.substr(0,start) + output + rep(text3);
                
                return newText;
            }
        }
        
        
        function replaceTextVars(text,vars) {
            
            Object.keys(vars).forEach(function(key){
                const value = vars[key];
                text = replaceWrapperText(text,key,value);
                text = replaceVarText(text,key,value)
            });
            
            return text;
        }
        
        
        function html_file_template(dir_html) {
                
                const html_details_html = extractWrapperText(dir_html,'html_details');
                if (!html_details_html) return false;
                
                const link_it_html    = extractWrapperText(html_details_html,'link_it');
                
                return file_template;
                
                function file_template(vars) {
                    
                    return replaceTextVars(
                        replaceWrapperText(
                            html_details_html,
                            "link_it",
                            linkit(
                                vars.link_it_path, 
                                vars.link_it_filename
                                )
                            ),
                        vars
                    ); 
                }
                
                function linkit(uri,disp){ 
                    //a_wrap=a_wrap||['<a href="'+uri+'">','</a>'];
                    const split=(disp||uri).split("/");
                    if (split.length===1) return link_it_wrapper ('', disp||uri);         //   a_wrap.join(disp||uri);
                    const last = split.pop();
                    if (split.length===1) return link_it_wrapper(split[0]+'/' ,last );    //split[0]+'/'+ a_wrap.join(last);
                    return link_it_wrapper( split.join("/")+'/', last );                  //split.join("/")+'/'+ a_wrap.join(last);
                }
                
                function link_it_wrapper(path,filename) {
                   return  replaceWrapperText(
                             replaceWrapperText(link_it_html,"link_it_filename",filename.replace(alias_root)),
                             "link_it_path",
                             path
                           );  
                }
                
               
               

        }
        
        
        function get_html_file_item (dir_html){
            
           const template = html_file_template(dir_html);   
           
           return template ? render : false;
           
           function render(filename) {
               
               if ( hidden_js_regex.test(filename)) return "";   
             
                const full_uri = "/"+uri+"/"+filename,
                basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
                
                const test_name    = alias_root && filename.indexOf(alias_root)===0 ? filename.substr(alias_root.length) : filename;
                const is_hidden    = tools.isHidden(test_name);//  tools.isHidden(basename) || alt_name && tools.isHidden(alt_name) ;
                const is_in_zip    = file_listing.indexOf(filename)>=0;
                const is_deleted   = is_hidden && tools.isDeleted(test_name)  ;//( tools.isDeleted(basename) || alt_name && tools.isDeleted(alt_name) );
                const is_editable  = fileIsEditable(filename);
                const is_image     = fileIsImage(filename);
                const is_zip       = filename.endsWith(".zip");
                const is_edited    = fileisEdited( updated_prefix+test_name );
                
                //const sha1span     = '<span class="sha1"></span>';
                
                const cls = is_deleted ? ["deleted"] : [];
                if (is_edited)   cls.push("edited");
                if (is_hidden)   cls.push("hidden");
                
                if (is_zip)      cls.push("zipfile");
                if (is_editable) cls.push("code");
                if (is_image)    cls.push("image");
                if (!is_image && !is_editable && !is_zip) cls.push("other");
                
                const li_class     = cls.length===0 ? '' : cls.join(' ');
               
               return template({
                   filename     : filename,
                   app_root     : ml.c.app_root,
                   li_class     : li_class,
                   basename     : basename,
                   is_in_zip    : is_in_zip?'1':'0',
                   parent_link  : options.parent_link,
                   link_it_path : full_uri,
                   link_it_filename:filename,
                   sha1:'',
                   designer:''
               });
               
            }
            
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
     
         
    }
    
    
    

});
