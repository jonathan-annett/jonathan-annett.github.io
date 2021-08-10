/* global ml */

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

    function htmlDirLib (dirInfo) {
        
        return {
            
        };
        

    }
    
    
    

});
