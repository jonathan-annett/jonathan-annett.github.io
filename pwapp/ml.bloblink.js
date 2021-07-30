/*global ml */ 

// the file "/pwapp/stub.js" (when loaded in a <script\> tag):
ml(`
    
     
`,function(){ml(2,

    {
        Window: function stubLib(  ) {
            
            
            const lib = {createBlobDownloadLink};
            // add / override window specific methods here
            
            function createBlobDownloadLink(url,linkEl,linkText,blob ) {
                
                const data_link = URL.createObjectURL(blob);
                        
                if (linkEl){    
                    const link = document.createElement("a");
                    link.download = url.split('/').pop();
                    link.href = data_link;
                    link.appendChild(new Text(linkText||"Download data"));
                    link.addEventListener("click", function() {
                        this.parentNode.removeChild(this);
                        // remember to free the object url, but wait until the download is handled
                        setTimeout(revoke, 500)
                    });
                    linkEl.appendChild(link);
                    
                    return revoke;
                }
                
                
                function revoke(){URL.revokeObjectURL(data_link);}
                
          
            }
   
            
            return lib;
        },

        ServiceWorkerGlobalScope: function stubLib(  ) {
            
            
            const lib = {createBlobDownloadLink};
            
            
             
            return lib;
        } 
    }, {
        Window: [
           
        ],
        ServiceWorkerGlobalScope: [
           
        ]
        
    }

    );


  

});

