
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),`
    
   
    
    `,function(){ml(2,ml(3),ml(4),

    {
        Window: function sampleLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        },

        ServiceWorkerGlobalScope: function sampleLib( lib ) {
            lib = lib ||{};
            // add / override service worker specific methods here
            
            
            return lib;
        } 
    }, {
        Window: [
            ()=> sampleLib ()
        ],
        ServiceWorkerGlobalScope: [
            ()=> sampleLib ()
        ]
        
    }

    );


    function sampleLib () {
        const lib = {};   
        
        
        return lib;
    }

});

