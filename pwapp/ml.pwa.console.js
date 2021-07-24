/*global ml*/
// the file "/pwapp/stub.js" (when loaded in a <script\> tag):
ml(`
    
 
    
`,function(){ml(2,

    {
        Window: function stubLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        },

        ServiceWorkerGlobalScope: function stubLib( lib ) {
            lib = lib ||{};
            // add / override service worker specific methods here
            
            
            return lib;
        } 
    }, {
        Window: [
            ()=> stubLib ()
        ],
        ServiceWorkerGlobalScope: [
            ()=> stubLib ()
        ]
        
    }

    );


    function stubLib () {
        const lib = {};   
        
        
        return lib;
    }

});



