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
    
    htmlFileItemLib.regexpEscape = regexpEscape;
    htmlFileItemLib.boldit = boldit;
    htmlFileItemLib.linkit = linkit;
    htmlFileItemLib.replaceVarText = replaceVarText;
    htmlFileItemLib.extractWrapperText = extractWrapperText;
    htmlFileItemLib.extractWrapperTags = extractWrapperTags;
    htmlFileItemLib.replaceVarWrapperTags = replaceVarWrapperTags;

    function htmlFileItemLib (dirInfo) {
        
        const alias_root = dirInfo.alias_root;
        
        return {
            get_html_file_item,
            boldit,
            linkit,
            extractWrapperText,
            replaceWrapperText,
            replaceVarText,
            replaceTextVars,
            hidden_js_regex,
            regexpEscape
        };
        

        function replaceWrapperText(text,tag,withText) {
            
            const [prefix,suffix] = extractWrapperTags(tag);
            const prefix_len = prefix.length, suffix_len = suffix.length;
            const output  = dirInfo.keep_comments ? prefix+withText+suffix : withText ;
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
                text = replaceVarText(text,key,value);
            });
            
            return text;
        }

        function html_file_template(dir_html) {
                
                // extract the area of the html template text that 
                const file_entry_html = extractWrapperText(dir_html,'file_entry');
                if (!file_entry_html) return false;
                
                const link_it_html    = extractWrapperText(file_entry_html,'link_it');
                
                // in order to hide the alias_root directory when "show full path" is unchecked
                // we need a way to wrap every instance of it in a span with the class "alias_root"
                // to do this, we use a global regexp replace, which picks up a carefully placed comment inside the template,
                // which appears before the full uri, which follows the parent link.
                
                const fixup_re =  new RegExp(regexpEscape('<!--alias_root=-->'+alias_root),'g');
                
                return file_template;
                
                
                   
                function file_template(vars) {
                    const html = replaceTextVars(
                        replaceWrapperText(
                            file_entry_html,
                            "link_it",
                            linkit(
                                vars.link_it_path, 
                                vars.link_it_filename
                                )
                            ),
                        vars
                    );
                    
                    return html.replace(fixup_re,'<span class="alias_root">'+alias_root+'</span>'); 
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
             
                const full_uri     =  dirInfo.fileFullUri(filename),
                basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
                
                const test_name    = alias_root && filename.indexOf(alias_root)===0 ? filename.substr(alias_root.length) : filename;
                const is_hidden    = dirInfo.fileIsHidden(test_name);//  tools.isHidden(basename) || alt_name && tools.isHidden(alt_name) ;
                const is_in_zip    = dirInfo.file_listing.indexOf(filename)>=0;
                const is_deleted   = is_hidden && dirInfo.fileIsDeleted(test_name)  ;//( tools.isDeleted(basename) || alt_name && tools.isDeleted(alt_name) );
                const is_editable  = fileIsEditable(filename);
                const is_image     = fileIsImage(filename);
                const file_sha1    = dirInfo.file_sha1 ? dirInfo.file_sha1(filename) : '';
                const is_zip       = filename.endsWith(".zip");
                const is_edited    = dirInfo.fileisEdited( dirInfo.updated_prefix+test_name );
                const has_warnings = dirInfo.fileHasWarnings(filename);
                const has_errors   = dirInfo.fileHasErrors(filename);
                
                //const sha1span     = '<span class="sha1"></span>';
                
                const cls = is_deleted ? ["deleted"] : [];
                if (is_edited)    cls.push("edited");
                if (is_hidden)    cls.push("hidden");
                if (has_warnings) cls.push("warnings");
                if (has_errors)   cls.push("errors");
                if (is_zip)       cls.push("zipfile");
                if (is_editable)  cls.push("code");
                if (is_image)     cls.push("image");
                if (!is_image && !is_editable && !is_zip) cls.push("other");
                
                const li_class     = cls.length===0 ? '' : cls.join(' ');
               
               return template({
                   filename     : filename,
                   app_root     : ml.c.app_root,
                   li_class     : li_class,
                   basename     : basename,
                   is_in_zip    : is_in_zip?'1':'0',
                   parent_link  : dirInfo.parent_link,
                   sha1         : file_sha1,
                   link_it_path : full_uri,
                   link_it_filename:filename,
                   designer:''
               });
               
            }
            
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
 
    function extractWrapperText(text,tag) {
       const [prefix,suffix] = extractWrapperTags(tag);
       const start = text.indexOf(prefix);
       if (start<0) return false;
       text = text.substr(start+prefix.length);
       const end = text.indexOf(suffix);
       if (end<0) return false;
       return text.substr(0,end);
    }
    
    function replaceVarText(text,key,value) {
        replaceVarWrapperTags(key).forEach(function(search){
            text = text.split(search).join(value);
        });
        return text;
    }
    
    function regexpEscape(str) {
        return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
    }
    
    function extractWrapperTags(tag) {
        return [ '<!--'+tag+'>-->', '<!--<'+tag+'-->'];
    }

    function replaceVarWrapperTags(tag) {
       return [ '${'+tag+'}', '<!--'+tag+'-->'];
    }

});
