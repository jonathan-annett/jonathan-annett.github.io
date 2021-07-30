/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, swResponseZipLib  */
ml([],function(){ml(2,

    {
        ServiceWorkerGlobalScope: function sampleLib( lib ) {
            lib = lib ||{};
            // add / override service worker specific methods here
            
            
            return lib;
        } 
    }, {
        ServiceWorkerGlobalScope: [
            ()=> sampleLib ()
        ]
        
    }

    );


    function sampleLib () {
        const lib = {}   
        
        
        return lib;
    }


 

});

