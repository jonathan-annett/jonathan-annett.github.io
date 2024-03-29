/* global zip_url_base,zip_files, parent_link*/


/* global ml,self,caches, Response,Headers  */
ml(`

`,function(){ml(2,

    {
        ServiceWorkerGlobalScope: function zipFSResponseLib( lib ) {
            lib = lib ||{};
            // add / override service worker specific methods here
            
            
            return lib;
        } 
    }, {
        ServiceWorkerGlobalScope: [
            ()=> zipFSResponseLib ()
        ]
        
    }

    );
    
    


    function zipFSResponseLib () {
        const lib = {
            response304,
            response404,
            response200,
            response500,
            response200_JSON,
            response200_HTML
        };
        return lib;
        
        function response304 (resolve,fileEntry) {
            return resolve( new Response('', {
                        status: 304,
                        statusText: 'Not Modifed',
                        headers: new Headers({
                          'Content-Type'   : fileEntry.contentType,
                          'Content-Length' : fileEntry.contentLength,
                          'ETag'           : fileEntry.etag,
                          'Cache-Control'  : 'max-age=3600, s-maxage=600',
                          'Last-Modified'  : fileEntry.date.toString(),
                        })
           }));
        }
        
        function response404 (resolve) {
            return resolve( new Response('', {
                        status: 404,
                        statusText: 'Not Found'
           }));
        }
        
        function response200 (resolve,buffer,fileEntry) {
            return resolve( new Response(
                               buffer, {
                                       status: 200,
                                       statusText: 'Ok',
                                       headers: new Headers({
                                         'Content-Type'   : fileEntry.contentType,
                                         'Content-Length' : fileEntry.contentLength,
                                         'ETag'           : fileEntry.etag,
                                         'Cache-Control'  : 'max-age=3600, s-maxage=600',
                                         'Last-Modified'  : (fileEntry.date ? fileEntry.date : new Date()).toString(),
                                       })
                               })
           );
                   
        }

        function response500 (resolve,error) {
            let errMessage = error.stack ? ml.i.editInZed.zedhookErrorHtml(error) : error.message||error;
            return resolve( new Response(
                               errMessage, {
                                       status: 500,
                                       statusText: 'ouch',
                                       headers: new Headers({
                                         'Content-Type'   : 'text/html',
                                         'Content-Length' : errMessage.length
                                       })
                               })
           );
                   
        }

        function isJSON(j) {
            return typeof j==='string' && j.test(/^[0-9|\"|\[|\{]|^true|^false|^null/);
        }
        function response200_JSON(resolve,json) {
            json = isJSON(json) ? json : JSON.stringify(json,undefined,4); 
            resolve(new Response(json, {
              status: 200,
              headers: new Headers({
                'Content-Type'   : 'application/json',
                'Content-Length' : json.length
              })
            }))
        }
        
        function response200_HTML(resolve,html) {
            return resolve(
                 
                 new Response(
                        html, {
                                 status: 200,
                                 statusText: 'Ok',
                                 headers: new Headers({
                                   'Content-Type'   : 'text/html',
                                   'Content-Length' : html.length,
                                 })
                              }
                  )
            );
        }
        
      
    }


 

});

