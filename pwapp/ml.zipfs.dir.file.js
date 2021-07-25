/* global ml */

ml(`

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


    function htmlFileItemLib (options) {
        
        const {uri,alias_root,tools,file_listing,fileisEdited,updated_prefix} = options;
        
        return {
            html_file_item,
            get_html_file_item,
            boldit,
            linkit,
            fileIsEditable,
            extractWrapperText,
            replaceWrapperText
        };
        
        
        function regexpEscape(str) {
            return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
        }
        
        
        function extractWrapperTags(tag) {
            return [ '<!--'+tag+'>-->', '<!--<'+tag+'-->'];
        }
        
        function extractWrapperRegExp(tag) {
           
           if (!extractWrapperRegExp.cache) {
               extractWrapperRegExp.cache={}; 
           }
           
           if (!extractWrapperRegExp.cache[tag]) {
               const [prefix,suffix] = extractWrapperTags(tag).map(regexpEscape);
               extractWrapperRegExp.cache[tag] = new RegExp( '(?:'+prefix+')(.*)(?:'+suffix+')','');
           }
           
           return extractWrapperRegExp.cache[tag];
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
                const newText = text2 + output + rep(text3);
                
                return newText;
            }
        }
        
          function html_file_template(dir_html) {
            
            const html_details_html = extractWrapperText(dir_html,'html_details');
            if (!html_details_html) return false;
            
            const link_it_html    = extractWrapperText(html_details_html,'link_it');
            
            return file_template;
            
            function file_template(vars) {
                
                let html = replaceWrapperText(html_details_html,"link_it",linkit(vars.link_it_path,vars.link_it_filename));

                Object.keys(vars).forEach(function(k){
                    const v = vars[k];
                    html = replaceWrapperText(html,k,v);
                });
                
                return html;
            }
            
            function link_it_wrapper(path,filename) {
               return  replaceWrapperText(
                         replaceWrapperText(link_it_html,"link_it_filename",filename),
                         "link_it_path",
                         path
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

        }
        
        
        function get_html_file_item (dir_html){
            
           const template = html_file_template(dir_html);   
           
           return template ? render : false;
           
           function render(filename) {
               
               if ( /\.hidden\-json$/.test(filename)) return "";   
             
                const full_uri = "/"+uri+"/"+filename,
                basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
                
                const test_name    = alias_root && filename.indexOf(alias_root)===0 ? filename.substr(alias_root.length) : filename;
                const is_hidden    = tools.isHidden(test_name);//  tools.isHidden(basename) || alt_name && tools.isHidden(alt_name) ;
                const is_in_zip    = file_listing.indexOf(filename)>=0;
                const is_deleted   = is_hidden && tools.isDeleted(test_name)  ;//( tools.isDeleted(basename) || alt_name && tools.isDeleted(alt_name) );
                const is_editable  = fileIsEditable(filename);
                const is_zip       = filename.endsWith(".zip");
                const is_edited    = fileisEdited( updated_prefix+filename );
                
                const sha1span     = '<span class="sha1"></span>';
                
                const cls = is_deleted ? ["deleted"] : [];
                if (is_edited)  cls.push("edited");
                if (is_hidden)  cls.push("hidden");
                const li_class     = cls.length===0 ? '' : ' class="'+cls.join(' ')+'"';
               
               return template({
                   filename:filename,
                   li_class:li_class,
                   basename:basename,
                   parent_link:options.parent_link,
                   link_it_path:full_uri,
                   link_it_filename:filename,
               });
               
            }
            
        }
        
        
        function html_file_item (filename,cb){
            
            
           if ( /\.hidden\-json$/.test(filename)) return "";

           const full_uri = "/"+uri+"/"+filename,
                 basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
           const edited_attr  = ' data-balloon-pos="right" aria-label="'            + basename + ' has been edited locally"';
           const not_edited_attr = ' data-balloon-pos="right" aria-label="'            + basename + ' hasn\'t been edited"';
           const edit_attr    = ' data-balloon-pos="down-left" aria-label="Edit '       + basename + '"'; 
           const zip_attr     = ' data-balloon-pos="down-left" aria-label="...explore ' + basename + ' contents" "' ;
           const test_name    = alias_root && filename.indexOf(alias_root)===0 ? filename.substr(alias_root.length) : filename;
           const is_hidden    = tools.isHidden(test_name);//  tools.isHidden(basename) || alt_name && tools.isHidden(alt_name) ;
           const is_in_zip    = file_listing.indexOf(filename)>=0;
           const is_deleted   = is_hidden && tools.isDeleted(test_name)  ;//( tools.isDeleted(basename) || alt_name && tools.isDeleted(alt_name) );
           const is_editable  = fileIsEditable(filename);
           const is_zip       = filename.endsWith(".zip");
           const is_edited    = fileisEdited( updated_prefix+filename );
           
           const sha1span     = '<span class="sha1"></span>';
           
           const edited       = is_edited ? '<span class="edited"'+edited_attr+'><i class="fas fa-not-equal"></i></span>' :  '<span class="not-edited"'+not_edited_attr+'><i class="fas fa-equals"></i></span>' ;
           const zoom_full    = '<a data-filename="' + filename + '"><span class="fullscreen">&nbsp;&nbsp;</span></a>';
           const cls = is_deleted ? ["deleted"] : [];
           if (is_edited)  cls.push("edited");
           if (is_hidden)  cls.push("hidden");
           const li_class     = cls.length===0 ? '' : ' class="'+cls.join(' ')+'"';
           const zedBtn =   is_editable   ? [ '<a'+edit_attr+ ' data-filename="' + filename + '"><span class="editinzed"><i class="fas fa-code"></i></span>',  '</a>' + sha1span +edited+zoom_full ] 
                          : is_zip        ? [ '<a'+zip_attr+  ' href="/'+uri+'/' + filename + '"><span class="zipfile"><i class="fas fa-file-archive"></i></span>',    '</a>' + sha1span +edited+zoom_full ]   
                          :                 [ '<a data-filename="'               + filename + '"><span class="normal">&nbsp;</span>',     '</a>' + sha1span +edited+zoom_full ] ;
           
           if (is_hidden) options.hidden_files_exist = true;
           return '<li'+li_class+'><a data-filename="' + filename + '" data-inzip="'+ (is_in_zip?'1':'0') + '"><span class="deletefile"><i class="fas fa-trash' +(is_deleted? '-restore':'')+ ' "></i></span></a><span class="full_path">' + options.parent_link +'/</span>' +linkit(full_uri,filename,zedBtn) + '</li>';
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
     
         
    }
    
    
    

});
