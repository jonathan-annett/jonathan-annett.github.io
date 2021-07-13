/*

jshint maxerr:10000

*/

/*jslint bitwise: true */


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    'serializerLib | ml.xs.serializer.js'
],function(){ml(2,ml(3),ml(4),

    {
        Window: function amdLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        }
    }, {
        Window: [
            ()=> amdLib ()
        ]

    }

    );


    function amdLib () {
       
        const { deserialize, serialize, setImmediate } = self.serializerLib(),
              _a         = Array.prototype,
              cpArgs     = _a.slice.call.bind (_a.slice),
              commonJSArgs   = ['require','module','exports'],
              
              amd_require_arg_names = ['define'].concat(commonJSArgs),
              module_rename_wrap_args = ['loadModule','createModule','self','DEF','REQ','module'],

              
              commonJSRegExp = /^require|exports|module$/,
              stripCommentsRegExp = /(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/)|\/\/.*?[\r\n])[\r\n]*/g,
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
            define  : DEFINE
            
        };

        
        return lib;
              
        
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
    
        function REQUIRE (){
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

        function fn_args  (x,sourceNoComments) {
            if (!sourceNoComments) {
               const source = typeof x==='string'?x:x.toString();
               sourceNoComments = source.replace(stripCommentsRegExp,'');
            }
            return  sourceNoComments.split('(')[1].split(')')[0].split(',').map(function(fn){ return fn.trim();});
        }
        
        function fn_requires (x,sourceNoComments) {
            
           if (!sourceNoComments) {
              const source     = typeof x==='string'?x:x.toString();
              sourceNoComments = source.replace(stripCommentsRegExp,'');
           }
           
           const result = [];
           
           commonJSRequireSplit( sourceNoComments.replace(commonJSQuotedRequires,'') ) .forEach(
               
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
        
        
        
      
        let loadModule = function loadModule (
            /*these args are for linting only*/createModule,define,require,module,exports
            /*he function is converted to as string starting from the first curly brace--->*/) {
            const _a   = Array.prototype,
            cpArgs     = _a.slice.call.bind (_a.slice),
            boot_args  = [define,require,module,exports].concat(cpArgs(arguments));
            
            if (module.__booted) {
                return module.exports;
            } else {
                module.exports =  (createModule.apply(self,boot_args) || module.exports) ;
                
                Object.defineProperty("__booted",{value:true,enumerable:false,writable:false});
                return module.exports;
            }
            
        }.toString();
        // save the source code for the above function as a string, as RuntimeModule uses it to create
        // a wrapper function to boostrap a module.
        loadModule = ' ()'+ loadModule.substring(loadModule.indexOf(')')+1);
       
            
        loadModule = function loadModule (createModule,doLoadModule,module) {
            return doLoadModule(createModule,module);
        }.toString();
        // save the source code for the above function as a string, as RuntimeModule uses it to create
        // a wrapper function to boostrap a module.
        loadModule = ' ()'+ loadModule.substring(loadModule.indexOf(')')+1);


        
        function DEF () {
            console.log("this in define:",this);
        }
        
        function REQ (id) {
            console.log("REQ invoked with",id);
            return {
              id:id
            };
        }
       
           
       function doLoadModule (createModule,module) {
           const boot_args  = [DEF,REQ,module,module.exports].concat(module.__runtime_args);
           if (module.__booted) {
               return module.exports;
           } else {
               module.exports =  (createModule.apply(self,boot_args) || module.exports) ;
               Object.defineProperty(module,"__booted",{value:true,enumerable:false,writable:false});
               return module.exports;
           }
       }
       
       function RuntimeModule (
           name,         // 
           coded_args,   // array of arguments from:  define (function(these,args,here){}) ---->["these","args","here"]
           require_list, // array of ids for coded_args followed by any require statements not included in coded_args
           source,       // 
           THIS) {
           const args = cpArgs(arguments)
           if (new.target) { 
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
                  __coded_arg_names  : { 
                      value:coded_args.slice(),
                      enumerable:false,
                      writable:false,
                      configurable:true},
                      
                  __preload_arg_names :{ 
                      value:require_list.slice(),
                      enumerable:false,
                      writable:false,
                      configurable:true},
                      
                  __preload_args     : { 
                      get : function () {
                          const def = { 
                              value:module.__preload_arg_names.map(REQ),
                              enumerable:false,
                              writable:false,
                              configurable:true
                          };
                          delete module.__preload_args;
                          Object.defineProperty (module,'__runtime_args',def);
                          return def.value;
                      }, 
                      enumerable   : false,
                      configurable : true
                  },
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
                  }
                  
               });
               
               const module_arg_names  = amd_require_arg_names.concat(coded_args);
               const module_definition = new Function(module_arg_names,source);
               
               const newModule      = (new Function (
                                         module_rename_wrap_args,
                                         'return function ' + (name ? name : '') + loadModule 
                                    ))(loadModule,module_definition,doLoadModule,DEF,REQ,module);
               newModule.constructor = RuntimeModule; 
               return  newModule;
           }
           
           
           function createFromSerializedModule(ser,THIS) {
               const arr = JSON.parse(ser);
               return createFromSource(
                   ser[1],//name, 
                   ser[2],//coded_args, 
                   ser[3],//require_list, 
                   ser[4],//source, 
                   THIS);
           }
           
           function createFromScriptElement(doc,script,THIS) {
               
           }
           
           
           function createFromArrayBuffer(arraybuffer,THIS) {
               
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
       
               

        
        function SerializedModule() {
            
            let fnArgs = cpArgs(arguments);
            
            let name,coded_args,require_list,source;
            
            switch (fnArgs.map(typ).join('_')) {
                
                case '': 
                    
                    throw new Error("expecting arguments in call to SerializedModule");
                    
                case 'objectfunction' : {
                   /*
                   new SerializedModule( meta, function(require,module,exports,other1,other2) { }) 
                   */
                   const fn = fnArgs[1];
                   const src = fn.toString(); 
                   const src_nocom   = src.replace(stripCommentsRegExp,'');
                   const _coded_args_  = fn_args(src,src_nocom);
                   const internal_requires = fn_requires(src,src_nocom);
                   
                   coded_args = _coded_args_.filter(function(x){return !commonJSRegExp.test(x);});
                   
                   
                   source = src.substring(src.indexOf('{')+1,src.lastIndexOf('}'));
                
                   break;
                }
                
                case "string" : {
                    /*
                    new SerializedModule( serialzied_data ) 
                    */
                    
                    break;  
                }
                
                case 'object_array_string' : {
                    /*
                    new SerializedModule( meta, dependants, source ) 
                    */
                    
                    meta = { deps : fnArgs[0] };
                    source = fnArgs[1];
                    break;
                }
                
                
                
            }

            Object.call(this);
            Object.defineProperties(this,{
                source    : { value : source, enumerable : true, writable : false },
                deps      : { value : source, enumerable : true, writable : false },
                serialize : { value : source, enumerable : true, writable : false },
                
            });
            
            
            function toSerial (){
                return JSON.stringify([
                   "SerializedModule",
                   name,
                   deps,
                   internal_requires,
                   source
                ]);
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


