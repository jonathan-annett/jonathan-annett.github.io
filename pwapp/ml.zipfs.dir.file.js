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
        
        const {uri,alias_root,meta,file_listing,fileisEdited,updated_prefix,parent_link} = options;
        
        return {
            html_file_item,
            boldit,
            linkit,
            fileIsEditable
        };
        
        
        function isDeleted (file_name) {
            return meta.deleted && meta.deleted.indexOf(file_name)>=0;
        }
        
        function isHidden (file_name) {
           if (meta.deleted) { 
               if (meta.deleted.indexOf(file_name)>=0) return true;
           }
           
           return regexps.some(function(re){ 
               return re.test(file_name);
           });
        }
        
        function html_file_item (filename,cb){
            
            
           if (filename === ".dirmeta.json") return "";

           const full_uri = "/"+uri+"/"+filename,
                 basename=full_uri.substr(full_uri.lastIndexOf("/")+1);
           const edited_attr  = ' data-balloon-pos="right" aria-label="'            + basename + ' has been edited locally"';
           const edit_attr    = ' data-balloon-pos="down-left" aria-label="Open '       + basename + ' in zed"'; 
           const zip_attr     = ' data-balloon-pos="down-left" aria-label="...explore ' + basename + ' contents" "' ;
           const test_name    = alias_root && filename.indexOf(alias_root)===0 ? filename.substr(alias_root.length) : filename;
           const is_hidden    = tools.isHidden(test_name);//  tools.isHidden(basename) || alt_name && tools.isHidden(alt_name) ;
           const is_in_zip    = file_listing.indexOf(filename)>=0;
           const is_deleted   = is_hidden && tools.isDeleted(test_name)  ;//( tools.isDeleted(basename) || alt_name && tools.isDeleted(alt_name) );
           const is_editable  = fileIsEditable(filename);
           const is_zip       = filename.endsWith(".zip");
           const is_edited    = fileisEdited( updated_prefix+filename );
           
           const sha1span     = '<span class="sha1"></span>';
           
           const edited       = is_edited ? '<span class="edited"'+edited_attr+'>&nbsp;&nbsp;&nbsp;</span>' : '';
           const zoom_full    = '<a data-filename="' + filename + '"><span class="fullscreen">&nbsp;&nbsp;</span></a>';
           const cls = is_deleted ? ["deleted"] : [];
           if (is_edited)  cls.push("edited");
           if (is_hidden)  cls.push("hidden");
           const li_class     = cls.length===0 ? '' : ' class="'+cls.join(' ')+'"';
           const zedBtn =   is_editable   ? [ '<a'+edit_attr+ ' data-filename="' + filename + '"><span class="editinzed">&nbsp;</span>',  '</a>' + sha1span +edited+zoom_full ] 
                          : is_zip        ? [ '<a'+zip_attr+  ' href="/'+uri+'/' + filename + '"><span class="zipfile">&nbsp;</span>',    '</a>' + sha1span +edited+zoom_full ]   
                          :                 [ '<a data-filename="'               + filename + '"><span class="normal">&nbsp;</span>',     '</a>' + sha1span +edited+zoom_full ] ;
           
           if (is_hidden) options.hidden_files_exist = true;
           return '<li'+li_class+'><a data-filename="' + filename + '" data-inzip="'+ (is_in_zip?'1':'0') + '"><span class="deletefile"></span></a><span class="full_path">' + parent_link +'/</span>' +linkit(full_uri,filename,zedBtn) + '</li>';
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
