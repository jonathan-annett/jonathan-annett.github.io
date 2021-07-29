/* global ml,Response,Headers  */
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

/*jshint -W054 */

ml([], function() {
    ml(2,

    {

        ServiceWorkerGlobalScope: function virtualDir_mware() {
            return mware;
        }
    }, {
        ServiceWorkerGlobalScope: []
    }

    );

    const textmode=true;

    const trigger_re = /\/build\/ml\.sw\.js$/;

    function mware(event, middleware) {
        if (trigger_re.test(event.fixup_url)) {
            return new Promise(function(resolve) {
                const result = {
                    "url": location.origin + '/service-worker',
                    "files": {

                    }
                };

                ml.H.forEach(function(u) {
                    const h = ml.h[u];
                    if (h && h.e) {
                        result.files[u] = {
                            url_read: u,
                            url_write: u
                        };
                    }
                });

                const deflate = ml.i.pako.deflate;
                const deflateOpts = {
                    level: 9
                };
                const db = middleware.databases.cachedURLS;
                const pako_re = /\/pako\.js$/;
                let inflate_url;
                const getNextFile = function(index) {

                    if (index < ml.H.length) {

                        const url = ml.H[index];

                        fetchURL(db, url, function(err, buffer) {

                            if (pako_re.test(url)) {
                                inflate_url = url.replace(pako_re, '/pako.inflate.min.js');
                            }
                            if (err || !buffer) return middleware.response500(resolve, err || new Error("could not fetch " + url));
                            const compressed = deflate(buffer, deflateOpts);
                            (textmode?bufferToText:bufferTob64)(compressed, function(data) {
                                result.files[url] = data;
                                getNextFile(index + 1);
                            });

                        });

                    } else {

                        const json = JSON.stringify(result, undefined, 4);

                        if (inflate_url) {
                            fetchURL(db, inflate_url, function(err, buffer) {
                                const source = [
                                    '/* global ml,self,Response,Headers,BroadcastChannel  */',
                                    '/*jshint -W054 */',
                                    '(function(module){',
                                    '(function(exports){' + new TextDecoder().decode(buffer) + '})(module.exports);',
                                      '(function(inflate,dir,importScripts){',
                                         middleware.fnSrc(ml, true)
                                            .replace(/\s*\/\/.*\n|^\s*|\s*$/gm, '')
                                              .replace(/\s*\{\s*\n/g, '{')
                                                .replace(/\s\}\s/g, '}'),
                                         middleware.fnSrc(textmode?runtimeText:runtimeBas64),
                                      '})(module.exports.inflate,' + json + ')',
                                    '})({exports:{}});'

                                ].join('\n');

                                resolve(new Response(source, {

                                    status: 200,
                                    headers: new Headers({
                                        'Content-Type': 'application/javascript',
                                        'Content-Length': source.length
                                    })

                                }));
                            });
                        }


                    }

                };

                getNextFile(0);

                return true;


                function fetchURL(db, url, cb) {
                    db.getItem(url, function(err, args) {
                        if (err || !args) {

                            return fetch(url, {
                                mode: 'no-cors'
                            }).then(function(response) {
                                if (!err && response.ok) {

                                    response.arrayBuffer().then(function(buffer) {
                                        middleware.updateURLContents(url, db, buffer, function() {
                                            cb(undefined, buffer);
                                        });
                                    }).
                                    catch (cb);

                                } else {
                                    cb(err || new Error('could not fetch ' + url));
                                }
                            }).
                            catch (cb);

                        }

                        cb(undefined, args[0]);
                    });
                }

                function bufferTob64(arrayBuffer, cb) {
                    var blob = new Blob([arrayBuffer]);

                    var reader = new FileReader();
                    reader.onload = function(event) {
                        cb(event.target.result.substr('data:application/octet-stream;base64,'.length));
                    };

                    reader.readAsDataURL(blob);
                }
                
                function bufferToText(arraybuffer,cb){
                    cb(new TextDecoder().decode(arraybuffer));
                }

            });
        }

    }
    
    function runtimeBas64(dir, pako, self, importScripts, inflate) {

        function inflateModule(url) {
            if (dir.files[url]){
                const
                bstr = atob(dir.files[url]),
                len = bstr.length,
                bytes = new Uint8Array(len);
    
                for (let i = 0; i < len; i++) {
                    bytes[i] = bstr.charCodeAt(i);
                }
                return new Function(
                    ['bound_self', 'ml', '__filename', '__dirname'],
                    new TextDecoder().decode(inflate(bytes.buffer))
                );
            } else {
                return function(){};
            }
        }

        function getScript(bound_this, url) {
            return inflateModule(url).bind(bound_this, bound_this, ml, url, url.replace(/\/[a-zA-Z0-9\-\_\.~\!\*\'\(\)\;\:\@\=\+\$\,\[\]]*$/, '/'));
        }

        function fakeImportScripts(self, scripts) {
            scripts = typeof scripts === 'string' ? [scripts] : scripts;
            scripts.forEach(function(url) {
                const fn = getScript(self, ml.c.B(url));
                fn();
            });

        }
        importScripts = fakeImportScripts.bind(undefined, self);
        // async load 1-callback per module to pull in tools that bootstrap the amd loader
        self.ml = ml;
        ml.register = ml.bind(self, 8);
        ml(9, self);


    }
    
    
    function runtimeText(dir, pako, self, importScripts, inflate) {

        function inflateModule(url) {
            if (dir.files[url]){
                return new Function(
                    ['bound_self', 'ml', '__filename', '__dirname'],
                    new TextDecoder().decode(inflate(new TextEncoder().encode(dir.files[url])))
                );
            } else {
                return function(){};
            }
        }

        function getScript(bound_this, url) {
            return inflateModule(url).bind(bound_this, bound_this, ml, url, url.replace(/\/[a-zA-Z0-9\-\_\.~\!\*\'\(\)\;\:\@\=\+\$\,\[\]]*$/, '/'));
        }
 
        function fakeImportScripts(self, scripts) {
            scripts = typeof scripts === 'string' ? [scripts] : scripts;
            scripts.forEach(function(url) {
                const fn = getScript(self, ml.c.B(url));
                fn();
            });

        }
        importScripts = fakeImportScripts.bind(undefined, self);
        // async load 1-callback per module to pull in tools that bootstrap the amd loader
        self.ml = ml;
        ml.register = ml.bind(self, 8);
        ml(9, self);


    }

});