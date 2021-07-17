/*

jshint maxerr:10000

*/

/*jslint bitwise: true */


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),`

serializerLib | ml.xs.serializer.js
xStoreBase    | ml.xs.base.js
httpsStore    | ml.xs.https.js
memoryStore   | ml.xs.memory.js


`,function(){ml(2,

    {
        Window: function amdLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        }
    }, {
        Window: [
            ()=> amdLib (undefined,"/pwapp",function(def,req){
                console.log("amd ready");
                window.require=req;
                window.define=def;
            })
        ]

    }

    );


    function amdLib (
        moduleStore,
        scripts_root,
        ready) {
       
        const { deserialize, serialize, setImmediate } = self.serializerLib(),
              _a         = Array.prototype,
              cpArgs     = _a.slice.call.bind (_a.slice),
              commonJSArgs   = ['require','module','exports'],
              
              amd_require_arg_names = ['define'].concat(commonJSArgs),

              commonJSRegExp = /^require|exports|module$/,
              stripCommentsRegExp = /\/\/(?![\S]{2,}\.[\w]).*|\/\*(.|\n)+?\*\//g,
              commonJSRequireScan = /(?<=require\s*\(\s*[\'\"])([a-z0-9\_\-\.]*)(?=[\'\"]\s*\))/,
              commonJSRequireSplit = commonJSRequireScan[Symbol.split].bind(commonJSRequireScan),
              commonJSQuotedRequires=/(\'.*(require\s*\(\s*(\"|\\\"|\\\')).*\')|(\".*(require\s*\(\s*(\'|\\\"|\\\')).*\")|(\`.*(require\s*\(\s*(\"|\'|\\\"|\\\')).*\`)/g,
              
              
              
              defines    = {
                  
                  "function"            : define_commonJS,
                  
                  array_function        : define_dependants_moduleFactory,
                  array_object          : define_dependants_object,
                  
                  string_array_function : define_id_dependants_moduleFactory,
                  string_array_object   : define_id_dependants_object, 
                  
              },
              requires = {
                  string         : require_sync,
                  array          : require_sync2,
                  array_function : require_async,
              },
              defined = {
                  href : {},
                  id : {},
              },
              loaded = {
                  
              };
              
              
        /*
        Converts a String that is of the form [module ID] + '.extension' to an URL path. require.toUrl 
        resolves the module ID part of the string using its normal module ID-to-path resolution rules, 
        except it does not resolve to a path with a ".js" extension. 
        Then, the '.extension' part is then added to that resolved path. 
        */
        REQUIRE.toUrl = function (x){
            
        };
        
        const lib = {
            
            require : REQUIRE,
            define  : DEFINE,
            import_ml :import_ml 
            
        };
        
        
        const origin  = window.location.origin.replace(/\/$/,'')+'/';
        scripts_root = typeof scripts_root==='string' && scripts_root.length > 0 ?   (origin+scripts_root+'/').replace(/^\/\//g,'/')  : origin;
        
        const noCorsTest = function ( url ) {
                 return  ! (
                     
                      url.indexOf("/")===0 || 
                      url.indexOf(".")===0 || 
                      url.indexOf(origin)===0
                      
                    ) ;
        };
        
        const idToFullUrl = function ( id , base ) {
                base = base || scripts_root;
                // "main/   ---> "main/index/js"     ---> https://wherever.com/main/index.js
                // "main"   ---> "main.js"           ---> https://wherever.com/main/index.js
                // "lib/func"   ---> "lib/func.js"
                id = id.slice(-3)===".js" ? id : id.slice(-1)==="/" ? id+"index.js" : id + ".js";
                switch (true) {
                    case id.indexOf("/")===0 :      return id.replace(/^\/*/,scripts_root);
                    case /^http(s):\/\//.test(id):  return id;
                    case /^\.\//.test(id) :         return id.replace(/^\.\//,base); 
                    default :                       return base + id;
                }
                
        };
    
        //const main_id_url = typeof main_id === 'string' ? idToFullUrl(main_id) : idToFullUrl( "index.js") ;
        
        
        // report back when main_id is ready to start loading
        // does not actually preload anything, just primes the moduleStore cache to include the item for main_id
        
        
        if (!moduleStore) { 
            // set up a memory cached http fetch moduleStore.
            
            const moduleCache = ml.i.memoryStore({__persistent:true});
            
            
            const urls = [  ];
            
            moduleStore = ml.i.httpsStore ( urls , noCorsTest, moduleCache, function() {
                if (typeof ready === 'function') {
                    ready(DEFINE,REQUIRE);
                }
            });
        }

        
        return lib;
        
        
        function import_ml (selfObj,baseurl,remove) {
            var store = {};
            
            Object.keys(ml.d).forEach(function( modName ){
                
                const mod     = ml.d [ modName ];
                const url     = mod  && mod.h;
                const urlData = url  && ml.h [ url ];
                
                
                let src = urlData.f && urlData.f.toString();
                src = src && src.substring(src.indexOf("{")+1,src.lastIndexOf("}"));
                
                const deps    = urlData.d && urlData.d.map(function(x,ix){
                   x = x && ml.c.r(x);
                   if( x ) {
                      const [ unparsed,modName, context , url] = x;
                      const fullUrl = ml.c.B(url);
                      if (!context || context==="Window") {
                         return {
                            mod : modName,
                            url : fullUrl,
                            dep : unparsed
                         };
                      }
                      
                   } else {
                        x = urlData.d[ix];
                        return {url :  ml.c.B(x), dep : x };
                   }
                   return null;
               });
               
                store [url] = {
                    modName : modName,
                    deps    : deps,
                    deps_src: urlData.d,
                    src     : src
                };
                
                
                if (remove && urlData && urlData.s) {
                    
                    if ( urlData.s.parentElement ) {
                       urlData.s.parentElement.removeChild(urlData.s);
                    }
                    
                    delete urlData.s;
                }

            });
            
             /*
            ml.g = function(x,R,U,N){
                 R=ml.c.r(x);
                 if (!R) {
                     if (selfObj[x]) return false;
                     
                     return x;
                 } else {
                     // for module@Window|filename.js format - return if wrong name:  c.C is "Window","ServiceWorkerGlobalScope"
                    if ((N=R[2])&&N!==ml.c.C) return true; 
                 }
                 N=R[1];
                 U=ml.c.B(R[3]);
                 if(ml.c.c(U))ml.d[N]={h:U};
                 console.log("loading",U);
                 loadScript(U,undefined,function(){
                     console.log("loaded",N,U);
                 });
                 
                 return N;
           };
           
           
           
           
            ml.c[ 2 ] = function (L,o,a,d,e,r){
                      e = a[L] && a[L].name; //evaluate name of import
                      console.log("inline define via captured ml.c[2] vector:",e);
                      
                      if(typeof e+typeof o[e]===ml.T[2]+ml.T[3]) {//valdidate named import is a function
                          ml.c.m(o,e,a[L].apply(this, d[L].map(ml.c.x))); // do the import into o[e]
                      } 
  
            }*/
        
            return store;
        }
        
        
        
        function loadScript(src,meta,cb) {     
           const
           script = document.createElement("script");
           script.meta=meta||{};
           script.meta.src=src;
           script.src=src;
           script.meta.href=script.src;
           script.meta.baseURI=script.baseURI;
           script.onload = cb;
           document.body.appendChild(script);
        }
        
        
        function loadScriptInIframe(src,def,req,meta) {
            
            const _a         = Array.prototype, cpArgs = _a.slice.call.bind (_a.slice);
            
            let iframe,script,cleanup_timer,scripts={};
            
            createIframe();
            
            function createIframe() {
                iframe= document.createElement('iframe');
                
                iframe.style.display="none";
                
                iframe.onload = iframe_ready; 
                iframe.src = 'about:blank';
                document.body.appendChild(iframe);
            }
            
            function iframe_ready() {
                iframe.require = function () {
                    if (cleanup_timer) clearTimeout(cleanup_timer);
                    cleanup_timer  = setTimeout(cleanup,15000);
                    return req.apply(undefined,[script.meta].concat(cpArgs(arguments)));
                };        
                        
                iframe.define = function () {
                    if (cleanup_timer) clearTimeout(cleanup_timer);
                    cleanup_timer  = setTimeout(cleanup,15000);
                    const define_args = cpArgs(arguments);
                    if (!script.meta.arrayBuffer) {
                        fetch(script.src,{mode:"no-cors"}).then(function(response){
                           response.arrayBuffer().then(function(buffer){
                              const fn      = define_args.pop();
                              const source  = fn.toString();
                              const text    = new TextDecoder().decode( buffer);
                              const removed = text.split(source).join('').trim();
                              script.meta.soloScript = removed==='define()'||removed==='define();';
                              if (script.meta.soloScript) {
                                  meta.alternate = JSON.stringify([
                                      'function',   
                                      '',
                                      fn_args(source),
                                      text
                                  ]);
                              } else {
                                  meta.alternate = JSON.stringify([
                                      'function',   
                                      '',
                                      ['define','require'],
                                      text
                                  ]);
                              }
                              def.apply(undefined,[script.meta].concat(define_args));
                           }); 
                        });
                    } else {
                        return def.apply(undefined,[script.meta].concat(define_args));
                    }
                };
                iframe.define.amd={};
                
                
                iframe.contentWindow.define  = iframe.define;
                iframe.contentWindow.require = iframe.require;
                proceed();
           }
            
            function proceed() {     
               script = document.createElement("script");
               script.meta=meta||{};
               script.meta.src=src;
               script.src=src;
               script.meta.href=script.src;
               script.meta.baseURI=script.baseURI;
               iframe.contentWindow.document.body.appendChild(script);
            }
            
            function cleanup () {
                cleanup_timer = undefined;
                if (iframe) {
                    if (script) {
                        iframe.contentWindow.document.body.removeChild(script);
                    }
                    document.body.removeChild(iframe);
                }
            }
            
            
        } 
        

        function typ (x) {
            return Array.isArray(x)?'array':typeof x;
        }
        
        function DEFINE () {
             const url = getScriptPath(undefined,'define');
             const args = cpArgs(arguments),
             def=defines[args.map(typ).join('_')];
             args.unshift(urlIdHash(url));
            return typeof def==='function'&&def.apply(undefined,args); 
        }
    
        function REQUIRE () {
          const url = getScriptPath(undefined,'require');
          const args = cpArgs(arguments),
          def=requires[args.map(typ).join('_')];
          args.unshift(urlIdHash(url));
          return typeof def==='function'&&def.apply(undefined,args); 
        }

        function require_sync(meta,id) {
            const mod = loaded[id];
            if (mod) return mod.exports;
            
            const defn = defined.id[ id ];
            const subreq = require_sync.bind(undefined,meta);
            if (defn) {
                 const loader = deserialize(defn);
                 if (typeof loader==='function') {
                     if (loader.meta.deps.length===0) return setLoaded(loader());
                     const args = loader.meta.deps.map(subreq);
                     return setLoaded(loader.apply(undefined,args));
                 }
            } 
            
            throw new Error ("not found: require('"+ id +"')");
            
            
            function setLoaded(e) {
                loaded[id]={
                    exports:e
                };
                
                return loaded[id].exports;
            }
        }
        
        function require_sync2(meta,deps) {
            if (deps.length===1) {
                return require_sync(meta,deps[0]);
            }
            throw new Error ("unsupported require syntax: require([ <"+deps.length.toString()+" elements> ] )");
        }
        
        function require_async(meta,deps,cb) {
            const loaded = deps.map(require_sync.bind(undefined,meta));
            return cb.apply(undefined,loaded);
        }

        // returns the array of named arguments (with a few optional extraIds)
        function fn_args  (fn,sourceNoComments,ids,reqr,modl,index,extraIds) {
            // to avoid double processing, caller can pass in source without comments
            // in which case fn ( the function itself, a string of the function source) is ignored.
            if (!sourceNoComments) {
               const source = typeof fn==='string'?fn:fn.toString();
               sourceNoComments = source.replace(stripCommentsRegExp,'');
            }
            
            //locate and clean up each argument name (ie remove whitespace)
            const args = sourceNoComments.split('(')[1].split(')')[0].split(',').map(function(a){ return a.trim();});
           
            
            // ids is the array that proceeded the function in a call to define. eg define([...],function(...){...}) 
            // validate the ids array and it's length vs args length before attempting to it further.
            if (Array.isArray(ids) && ids.length===args.length) {
                
                
                // when extra info is returned, it's in an object.
                const dict = {
                    args     : args,               // the names of each argument, to pass into new Function()
                    ids      : ids,                // the ids for each argument, to locate the dependancy
                    //deps : tdb                   // the loaded dependancy (populated below if reqr is supplied by caller)
                    commonJS : args[0]==='require' // a boolean indicating the function is a commonJS module
                };
                
                // by providing reqr (the require implementation relevant to the function), caller indicates they want 
                // an array of preloaded dependancies to be generated for each argument
                if (typeof reqr ==='function') {
                    
                    // validate the passed in index argument
                    const valid_index = typeof index ==='object' && typeof index.i +typeof index.a ==='objectobject' ;
                    
                    // wrap reqr with an array iterator, which optionally saves the module into an external object
                    const req = valid_index ? function(id,ix){
                       // pull in the module by it's id
                       const mod = reqr(id); 
                       // save it into the index by id
                       index.i[ id ] = mod;
                       // save it into the index by argument name
                       index.a[ args[ix] ] = mod;
                       
                       return mod;
                    } : function(id) { return reqr(id); };
                    
                    // map dependancy to it's loaded module 
                    dict.deps = ids.map(req);
                    if ( Array.isArray( extraIds ) ) {
                        dict.extraIds  = extraIds;
                        dict.extraDeps = extraIds.map(req);
                    }
                }
                
                // and we need to take things further for functions that call require.
                if (dict.commonJS) {
                    // rework the arguments array to conform to require,module,exports,others, even if exports and module were not included
                    dict.commonJSArgs = commonJSArgs.concat(
                        
                        args.filter(
                            function(x){
                                return !commonJSRegExp.test(x); 
                            }
                        )
                        
                    );
                    dict.commonJSIds = [ '','','' ].concat(
                        // we need to map before filtering, because the arrays are index linked.
                        args.map(function(a,ix){
                           // convert the argument to it's id (or null if one of require,module,exports )
                           return commonJSRegExp.test(a) ? null : ids[ix];
                        }).filter( function(a) { return a !==null; } )
                    );
                        
                    // pre populate a commonJSDeps array ready to instantiate the module
                    if (typeof reqr+typeof modl ==='functionobject' && typeof modl.exports==='object') {
                        dict.commonJSDeps = [ reqr, modl, modl.exports ].concat(
                            
                           // we need to map before filtering, because the arrays are index linked.
                           args.map(function(a,ix){
                              // convert the argument to it's id (or null if one of require,module,exports )
                              return commonJSRegExp.test(a) ? null : dict.deps[ix];
                           }).filter( function(a) { return a !==null; } )
                           
                        );
                        
                    }
                    
                    

                }
                // when extra info is returned, it's in an object.
                return dict;
            }
            
            return args;
        }
        
        // returns the code segment (with heeader and arguments removed, and first and last curly brace)
        // embeded comments are preserved
        function fn_src (x,sourceNoComments) {
          const stripCommentsRegExp = /\/\/(?![\S]{2,}\.[\w]).*|\/\*(.|\n)+?\*\//g;
          const source = typeof x==='string'?x:x.toString();
          let offset = 0,located;
          
          // white out any comments before the first brace
          let src     = source;
          let braceAt = src.indexOf('{');
          let match   = stripCommentsRegExp.exec(src);
          while (match) {
               if (braceAt<match.index) {
                   // first/next comment is after the first brace, so we can use braceAt as a valid index
                   return source.substr(braceAt+1,source.lastIndexOf('}'));
               }
               // white out the commment
               const matchlen = match[0].length;
               src     = src.substr(0,match.index) + new Array ( matchlen+1).join(' ') + src.substr(match.index+matchlen);
               
               // have another go around
               braceAt = src.indexOf('{');
               match   = stripCommentsRegExp.exec(src);
          }
          
          braceAt = source.indexOf('{');
          return source.substr(braceAt+1,source.lastIndexOf('}'));
        }
        
        
        // returns any embeded require statements
        function fn_requires (x,sourceNoComments) {
            
            // first remove any comments that are in the source.
            // this deals with the issue of commented out code that includes require statements
           if (!sourceNoComments) {
              const source     = typeof x==='string'?x:x.toString();
              sourceNoComments = source.replace(stripCommentsRegExp,'');
           }
           
           const result = [];
           
           // now remove any require statements that are inside strings or template strings
           
           const dequotedSource = sourceNoComments.replace(commonJSQuotedRequires,'');
           
           
           // now split on require statements, which will yeild an array where every second element is 
           
           
           commonJSRequireSplit( dequotedSource ) .forEach(
               
               function (x,ix){
                  if (ix % 2 === 1) {
                      result.push( x );
                   }
               }
               
           );
           
           return result;
        }
        
        
        function urlIdHash (domain_prefix,referrer_prefix,url) {
            const hasQuery=url.indexOf('?'), dot_dir = /^\.\//, slash_dir = /^\//;
            const trimmed = hasQuery < 0 ? url : url.substr(0,hasQuery);
            const prefixed = /^http(s?)\:\/\//.test(trimmed) ? trimmed :
                             dot_dir.test(trimmed)   ? trimmed.replace(dot_dir,referrer_prefix) :
                             slash_dir.test(trimmed) ? trimmed.replace(slash_dir,domain_prefix) :
                             referrer_prefix+trimmed;
                             
            return {
                id    : getHash(prefixed),
                url   : prefixed,
                input : url
            };
            
            function getHash(text) {
                'use strict';
            
                var hash = 5381,
                    index = text.length;
            
                while (index) {
                    hash = (hash * 33) ^ text.charCodeAt(--index);
                }
            
                return hash >>> 0;
            }
        }
        
      
        // REQ wrapp require, preventing a call to REQUIRE if id is not available.
        // REQ (id) will either return the loaded module, or throw an exception
        // REQ is safe to call as an array iterator, since it filters out the second and third args  
        function REQ (id) {
            if (AVAIL(id)) {
                return REQUIRE(id);
            } else {
                throw new Error (id+" is not available");
            }
        }
        
        
        // AVAIL returns true or false indicating if the module referenced by id is available
        // additionally, if the module IS NOT available, and "preload" is true, it will 
        // asynchronously do what is needed to make it potentially available the next time AVAIL is called.
        // so whilst it will not block, a true return indicates the module is availble for a blocking load via REQ
        // also, assuming preload===true, if cb is a function, call it when the module is available to be preloaded 
        function AVAIL (id,preload,cb) {
            const id_url = idToFullUrl(id);
            if (moduleStore.exists(id_url)) {
                if (preload && typeof cb=== 'function' ) {
                    cb();
                }
                return true;
            } else {
               if (preload) {
                   moduleStore.___getItem(id_url,function(ser){
                       console.log("preloaded",id,"(",id_url,ser,"bytes)");
                       if (typeof cb==='function' && moduleStore.exists(id)  ) {
                           cb();
                       }
                   });
               }
               return false;
            }
        }
           
       function doLoadModule (createModule,module,THIS) {
           const boot_args  = [DEFINE,REQ,module,module.exports].concat(module.__runtime_args);
           if (module.__booted) {
               return module.exports;
           } else {
               module.exports =  (createModule.apply(THIS,boot_args) || module.exports) ;
               Object.defineProperty(module,"__booted",{value:true,enumerable:false,writable:false});
               return module.exports;
           }
       }
       
       
       
       /*
       
            serialized data / scriptElement / commonJS function wrapper --> SerializedModule ---> RuntimeModule
            
            
            
            RuntimeModule
       
       
       
       
       */
       
       
       function RuntimeModule (
           name,         // 
           coded_args,   // array of strings representing arguments from:  define (function(these,args,here){}) ---->["these","args","here"]
           require_list, // array of strings representing ids for coded_args followed by any require statements not included in coded_args
           source,       // 
           THIS) {
           const args = cpArgs(arguments)
           if (this instanceof RuntimeModule) { 
             // basically we invert things and throw away the new'd object, forcing invocation as
             // a "normal function", because we a returning a function, and there's no real
             // simple way to override Function AND bind it to a runtime defined argument
             // so instead we create a normal function, and then patch it's constructor back to RuntimeModule
             return RuntimeModule.apply(undefined,args); 
             
           } else {
               switch (args.map(typ).join('_')) {
                   case 'string_array_array_string_object' : return createFromSource.apply(undefined,args);
                   case 'string_object': return createFromSerializedModule.apply(undefined,args);
                   
               }
              
           }
            
           function createFromSource(name, coded_args, require_list, source, THIS) {
               name = name || "unnamed_module";
               const module = {
                   exports : {}  
               };
               
               Object.defineProperties(module,{
                   
                  // array of argument names
                  __coded_arg_names  : { 
                      value:coded_args.slice(),
                      enumerable:false,
                      writable:false,
                      configurable:true},
                      
                  // array of ids this module needs. the first __coded_arg_names.length elements maps to __coded_arg_names
                  __preload_ids : { 
                      value:require_list.slice(),
                      enumerable:false,
                      writable:false,
                      configurable:true},
                      
                      
                  // on first touch, attempts to load each module needed, and if sucesfull, returns an array of each preloaded dependancy 
                  // subsequent touches just returns that array.
                  __preload_args     : { 
                      get : function () {
                          const def = { 
                              value:module.__preload_ids.map(REQ),
                              enumerable:false,
                              writable:false,
                              configurable:true
                          };
                          delete module.__preload_args;
                          Object.defineProperty (module,'__preload_args',def);
                          return def.value;
                      }, 
                      enumerable   : false,
                      configurable : true
                  },
                  
                  // this is effecttivey a slice of the __preload_args array ( which maps to __coded_arg_names)
                  // in otherwords, __runtime_args [ n ] ===  loaded module for __coded_arg_names[ n ]
                  // like __preload_args, this is populated on first touch.
                  __runtime_args     : { 
                      get : function () {
                          const def = { 
                              value:module.__preload_args.slice(0,module.__coded_arg_names.length),
                              enumerable:false,
                              writable:false,
                              configurable:true
                          };
                          delete module.__runtime_args;
                          Object.defineProperty (module,'__runtime_args',def);
                          return def.value;
                      }, 
                      enumerable   : false,
                      configurable : true
                  },
                  
                  // returns true if the RuntimeModule is able to be instantiated
                  // in otherwords, if __preload_avail is false, touching __preload_ids or __runtime_args will result in an exception
                  // this function is non destructive. it does not attempt to preload anything, simply tells you if EVERYTHING is available. 
                  __preload_avail    : {
                      
                      get : function () {
                               
                          return module.__preload_args.reduce(function(n,id){
                              return AVAIL(id,true) ? n+1 : n;
                          },0) === module.__preload_args.length;
                          
                      },
                      enumerable   : false,
                      configurable : true
                  },
                  
                  // assuming all objects are availble this will preload the module's dependants, but not the module itself
                  // returns true or false, and does not attempt to load anything unless all dependants are available.
                  // optionally, a callback will return an array of missing modules, or the module itself. 
                  // eg __preload(function(missing,module) {});
                  __preload : {
                      
                      value : function (cb) {
                          const missing = [];
                          const avail = module.__preload_args.reduce(function(n,id){
                               if (AVAIL(id,true)) return n+1;
                               missing.push(id);
                               return n;
                          },0) === module.__preload_args.length;
                          
                          if (avail) {
                              const ignored = module.__preload_ids.slice();
                              ignored.splice(0,ignored.length);
                              return typeof cb === 'function' ? cb(undefined,module) : true;
                          } 
                          if (typeof cb === 'function') return cb(missing);
                          missing.splice(0,missing.length);
                          return false;
                      },
                       enumerable   : false,
                       configurable : true
                },
                  
                  
               });
               
               
               const module_arg_names  = amd_require_arg_names.concat(coded_args);
               const module_definition = new Function(module_arg_names,source);
               
               
               // this wrapper construct is multi purpose
               // 1) allows naming of the funcition
               // 2) to prevent source from being exposed simply calling toString()
               // 3) to reduce code size by not having to include loader code in the module itself 
               const newModule      = (new Function (
                                      ['loadModule', 'createModule', 'module', 'THIS' ],
                                            'return function ' + (name ? name : '') + ' () return loadModule(createModule,module,THIS);' 
                                    ))(doLoadModule, module_definition, module, THIS);
                                    
               newModule.constructor = RuntimeModule;
               newModule.__module = module;
               return  newModule;
           }
           
           
           function createFromSerializedModule(ser,THIS) {
               const arr = JSON.parse(ser);
               return createFromSource(
                   arr[1],//name, 
                   arr[2],//coded_args, 
                   arr[3],//require_list, 
                   arr[4],//source, 
                   THIS);
           }

       }
       
       
       let x = new RuntimeModule (
           "testMod",
           'a,b,c'.split(','),
           'a,b,c'.split(','),
           
           `
       console.log({this:this,self:self,require,define,exports,module,a,b,c});
       require () ;
       module.exports = function (){
           return 4;
       }; `,
       
          this
       );
       
       
 
        
        function SerializedModule(meta) {
            
            let fnArgs = cpArgs(arguments);
            
            let name,coded_args,require_list,source,loaded;
            
            switch (fnArgs.map(typ).join('_')) {
                
                case '': 
                    
                    throw new Error("expecting arguments in call to SerializedModule");
                    
                // eg define ('mylib',['otherlib'],function(require,module,exports,otherlib) { ... });
                // ---> new SerializedModule (meta,'mylib',['otherlib'],function(require,module,exports,otherlib) { ... });
                
                case 'string': { 
                    fromSerial (fnArgs[0]);
                    break;
                }
                case 'object_string_array_function': {
                    const ids      = fnArgs[2];
                    source         = '/*file:'+meta.url+' ('+meta.href+') */\n'+
                                     fnArgs[3].toString();
                    const sourceNoComments = source.replace(stripCommentsRegExp,'');
                    const dict     = fn_args (source,sourceNoComments,ids);
                    const requires = fn_args(source,sourceNoComments);
                    coded_args     = (dict.commonJS ? dict.commonJSArgs : dict.args);
                    require_list   = (dict.commonJS ? dict.commonJSIds : dict.ids).concat (requires);
                    break;
                }
                
                // eg define (['otherlib'],function(require,module,exports,otherlib) { ... });
                // ---> new SerializedModule (meta,['otherlib'],function(require,module,exports,otherlib) { ... });
                case 'object_array_function': {
                    const ids      = fnArgs[1];
                    source         = '/*file:'+meta.url+' ('+meta.href+') */\n'+
                                     fnArgs[2].toString();
                    const sourceNoComments = source.replace(stripCommentsRegExp,'');
                    const dict     = fn_args (source,sourceNoComments,ids);
                    const requires = fn_args(source,sourceNoComments);
                    coded_args     = (dict.commonJS ? dict.commonJSArgs : dict.args);
                    require_list   = (dict.commonJS ? dict.commonJSIds : dict.ids).concat (requires);
                    break;
                }
                
                // eg define (function(require,module,exports,otherlib) { ... });
                // ---> new SerializedModule (meta,function(require,module,exports,otherlib) { ... });
                case 'object_function': {
                    const ids      = [ meta.url ];
                    source         = '/*file:'+meta.url+' ('+meta.href+') */\n'+
                                     fnArgs[1].toString();
                    const sourceNoComments = source.replace(stripCommentsRegExp,'');
                    const dict     = fn_args (source,sourceNoComments,ids);
                    const requires = fn_args(source,sourceNoComments);
                    coded_args     = (dict.commonJS ? dict.commonJSArgs : dict.args);
                    require_list   = (dict.commonJS ? dict.commonJSIds : dict.ids).concat (requires);
                    break;
                }
                
            }

            Object.call(this);
            Object.defineProperties(this,{
                name          : { value : name,         enumerable : true, writable  : false },
                coded_args    : { value : coded_args,   enumerable : true, writable  : false },
                require_list  : { value : require_list, enumerable : true, writable  : false },
                source        : { value : source,       enumerable : true, writable  : false },
                toJSON        : { value : toSerial,     enumerable : false, writable : false },
                ser           : { get   : toSerial,     enumerable : false, writable : false },
                load          : { value : loader,       enumerable : false, writable : false },
            });
            
            
            function available (THIS) {
                if (!loaded) {
                    loaded = new RuntimeModule(name,     
                    coded_args,   // array of strings representing arguments from:  define (function(these,args,here){}) ---->["these","args","here"]
                    require_list, // array of strings representing ids for coded_args followed by any require statements not included in coded_args
                    source,       // 
                    THIS);
                }
                return loaded.__module.__preload_avail;
                
            }
            
            function loader (THIS){
                if (!loaded) {
                    loaded = new RuntimeModule(name,     
                    coded_args,   // array of strings representing arguments from:  define (function(these,args,here){}) ---->["these","args","here"]
                    require_list, // array of strings representing ids for coded_args followed by any require statements not included in coded_args
                    source,       // 
                    THIS);
                }
                
                return loaded.__module.preload(function(missing,module){
                    if (missing) {
                        throw new Error ( 'missing sources: \n'+missing.join('\n') ) ;
                    }
                    return module;
                });

            }
            
            function toSerial (){
                return JSON.stringify([
                   "SerializedModule",
                   name,
                   coded_args,
                   require_list,
                   source
                ]);
            }
            
            function fromSerial (ser) {
               const arr    = JSON.parse(ser);
               name         = arr[1];
               coded_args   = arr[2];
               require_list = arr[3];
               source       = arr[4];
            }
        }
     
     
    
        function define_id_dependants_object (url,id,deps,obj) {
            const fn_name = '';
            const href = typeof url==='string' ? url : url.url;
            const mod   = defined.id [ id ] = JSON.stringify(
                
                
                [
                
              
                "SerializedModule",fn_name, [], [
                    
                'ml.xs(',
                   'function () {',
                       'return '+JSON.stringify(obj)+';',
                   '}',
                ');'].join('\n'),
                
                JSON.stringify({
                    meta:{
                        id   : id,
                        url  : href,
                        deps : deps,
                        isObject:true
                    }
                })
            ]); 
            
            
            
            
            
            const hrefIndex = defined.href [ href ] || {};
            hrefIndex[ id ] = mod;
            defined.href [ href ]=hrefIndex;
        }
        
        function define_id_dependants_moduleFactory (url,id,deps,factory) {
            const href = typeof url==='string' ? url : url.url;
            const source   = factory.toString();
            const args     = fn_args(source);
            const commonJS = args.some(isCommonJS);
            
            if (commonJS) return define_id_dependants_commonJS (href,id,deps,source,args) ;
            
            const fn_name = '';
            
            const mod   = defined.id [ id ] = JSON.stringify([
                
                "function", fn_name, args, [
                'ml.xs(',
                   source,
                ');'].join('\n'),
                
                JSON.stringify({
                    meta:{
                        id   : id,
                        url  : href,
                        deps : deps.filter(strip_repeats),
                        commonJS:false,
                    }
                })
            ]);
            
            const hrefIndex = defined.href [ href ] || {};
            hrefIndex[ id ] = mod;
            defined.href [ href ]=hrefIndex;
        }
        
        function define_id_dependants_commonJS (href,id,deps,source,args,sourceNoComments) {
            args = removeCommonJS(args);
            const internal_deps = fn_requires(source,sourceNoComments);
            const all_args = commonJSArgs.concat(args);
            const fn_name = '';
            const mod   = defined.id [ id ] = JSON.stringify([
                
                "function", fn_name, all_args, [
                'ml.xs(',
                   source,
                ');'].join('\n'),
                
                JSON.stringify({
                    meta:{
                        id       : id,
                        url      : href,
                        deps     : deps.concat(internal_deps).filter(strip_repeats),
                        commonJS : true,
                    }
                })
            ]);
            
            const hrefIndex = defined.href [ href ] || {};
            hrefIndex[ id ] = mod;
            defined.href [ href ]=hrefIndex;
        }
    
        function define_dependants_object (url,deps,obj) {
            const id       = url.id;
            const href     = url.url;
        
            return define_id_dependants_object (href,id,deps,obj);
        }
        
        function define_dependants_moduleFactory (url,deps,factory) {
            const id       = url.id;
            const href     = url.url;
            return define_id_dependants_moduleFactory (href,id,deps,factory);
        }
        
        function define_commonJS (url, factory) {
            const id               = url.id;
            const href             = url.url;   
            const source           = factory.toString();
            const sourceNoComments = source.replace(stripCommentsRegExp,'');
            const args             = fn_args(source,sourceNoComments);
        
            return define_id_dependants_commonJS (href,id,[],source,args,sourceNoComments);
        }
        
        function strip_repeats(x,i,a){return a.indexOf(x)===i;}
        
        function getScriptPath (hint,caller) {
            if (  !caller && typeof document === "object" && 
                  typeof document.currentScript === 'object' && 
                  document.currentScript && // null detect
                  typeof document.currentScript.src==='string' && 
                  document.currentScript.src.length > 0) {
                return document.currentScript.src;
            }
            
            caller = typeof caller === 'string' ? caller : (typeof caller ==='function' ? caller.name : 'getScriptPath');
            
            let here = new Error();
            if (!here.stack) {
                try { throw here;} catch (e) {here=e;}
            }
            if (here.stack) {
                
                const stacklines = here.stack.split('\n');
                //console.log("parsing:",stacklines);
                let result,ok=false;
                stacklines.some(function(line){
                    if (ok) {
                       const httpSplit=line.split(':/');
                       const linetext = httpSplit.length===1?line.split(':')[0]:httpSplit[0]+':/'+( httpSplit.slice(1).join(':/').split(':')[0]);
                       const chop = linetext.split('at ');
                       if (chop.length>1) {
                           result = chop[1];
                           if ( result[0]!=='<') {
                              //console.log("selected script from stack line:",line);               
                              return true;
                           }
                           result=undefined;
                       }
                       return false; 
                    }
                    ok = line.indexOf(caller)>0;
                    return false;
                });
                return result;
            }
            
            if ( hint && typeof document === "object") {
               const script = document.querySelector('script[src="'+hint+'"]');
               return script && script.src && script.src.length && script.src;
            }
            
        }
           
        function isNotCommonJS(f){return !/^require|exports|module$/.test(f);}
        
        function isCommonJS(f){return /^require|exports|module$/.test(f);}
           
        function removeCommonJS(depsMod) {
            return depsMod.filter(isNotCommonJS);
        }
        
        
        
       
    }

 

});


