/* global ml,Response, Headers  */
/*

   middleware must either:
   
      return a promise that resolves to a response
      
      or
      
      return undefined if it can't handle the request (the default)
      
      or 
      
      return a promise that resolves to undefined, in the event that it's unknown at the point of return 
      if the request can be hanlded
      
      
      it should not reject unless a catastophic error occurs
      
      (ie don't resolve to a 404 error, unless there is absolutely no possibility of another middleware resolving the request)
      
      
      
*/
ml([],function(){ml(2,

    {

        ServiceWorkerGlobalScope: function updatedURL_mware(  ) {
          return mware;
        } 
    }, {
        ServiceWorkerGlobalScope: [] 
    }

    );


    function mware(event,middleware) {
       
       const url = event.fixup_url;
       const db  = middleware.databases.updatedURLS;
       
       switch (event.request.method) {
           case "GET"    : return  db.keyExists(url,true) ? new Promise ( toFetchUrl(db) ) : undefined;
           case "PUT"    : return new Promise ( toUpdateUrl );
           case "DELETE" : return new Promise ( toRemoveUrl );
       }
       
       function toFetchUrl( db ) {
           
           return function (resolve,reject) {
               
           };
           
       }

       function toUpdateUrl (resolve,reject) {
              
           event.request.arrayBuffer().then(function(buffer){
              middleware.updateURLContents (url,db,buffer,function(){
                  resolve(new Response('ok', {
                      status: 200,
                      statusText: 'Ok',
                      headers: new Headers({
                        'Content-Type'   : 'text/plain',
                        'Content-Length' : 2
                      })
                  }));
              }); 
           });
           
       }
       
       function toRemoveUrl (resolve,reject) {
              
          let inzip   = event.request.headers.get('x-is-in-zip') ===  '1';

          middleware.removeUpdatedURLContents (url,function(){
              
              
              if (inzip) {
                  
                  const zip_url_split = url.lastIndexOf('.zip/')+4;
                  const zip_url     = url.substr(0,zip_url_split);
                  const file_in_zip = url.substr(zip_url_split+1);
                  
                  middleware.getZipObject(zip_url,function(err,zip,zipFileMeta){
                      
                      if (err)  throw err;
                       
                      middleware.getZipDirMetaTools(zip_url,zip,zipFileMeta,function(tools){
                          
                          tools.deleteFile(file_in_zip,okStatus);
                          tools.notify({deleteFile:file_in_zip});
                      });
                      
                  });
                  
              } else {
                  okStatus();
              }
              
          }); 

          function okStatus() {
                resolve(new Response('ok', {
                  status: 200,
                  statusText: 'Ok',
                  headers: new Headers({
                    'Content-Type'   : 'text/plain',
                    'Content-Length' : 2
                  })
                }));
          }
       
       }
        
    }

});

