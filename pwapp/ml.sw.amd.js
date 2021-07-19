/* global self,importScripts,BroadcastChannel */
/*jshint -W054 */

function amd(root_js,bound_self){
    
    
    const

    // loads script as a string/arraybuffer
    loadScriptText=loadScriptText_fetch,
    compile=compile_newfunc,

    splitURLRegExp = /((http(?:s?)|ftp):\/\/)?((([^:\n\r]+):([^@\n\r]+))@)?((www\.)?([^\/\n\r]+))\/?([^?\n\r]+)?\??([^#\n\r]*)?#?([^\n\r]*)/,
    removeCredentialsRegExp=/(?<=http(s?):\/\/)(.*\:.*\@)/,
    getUrlPartIx = function(i,p,s,u){ u=splitURLRegExp.exec(u);return u&&p+u[i]+s;},
    getUrlOrigin = function(u) {return getUrlPartIx(1,'','/',u).replace(removeCredentialsRegExp,'');},
    getUrlDomain = getUrlPartIx.bind(undefined,7,'',''),
    getUrlPath   = getUrlPartIx.bind(undefined,10,'/',''),
    getUrlQuery  = getUrlPartIx.bind(undefined,11,'',''),
    localDomain  = getUrlDomain(location.href),
    getPathDir = function(u){ return u.substr(0,u.lastIndexOf('/')+1);},
    
    commonJSRegExp         = /^require|exports|module$/,
    stripCommentsRegExp    = /\/\/(?![\S]{2,}\.[\w]).*|\/\*(.|\n)+?\*\//g,
    commonJSRequireScan    = /(?<=require\s*\(\s*[\'\"])([a-z0-9\_\-\.]*)(?=[\'\"]\s*\))/,
    commonJSRequireSplit   = commonJSRequireScan[Symbol.split].bind(commonJSRequireScan),
    commonJSQuotedRequires = /(\'.*(require\s*\(\s*(\"|\\\"|\\\')).*\')|(\".*(require\s*\(\s*(\'|\\\"|\\\')).*\")|(\`.*(require\s*\(\s*(\"|\'|\\\"|\\\')).*\`)/g,
    commonJSArgs           = ['require','module','exports'],
    
    scriptBase             = getPathDir(getUrlPath(root_js)),
    
    urlIndex = {};
    
    
    bound_self.ml = ml;
    ml.req=function (id) {
        return globalIdAvail(id) && globalRequireId (id);
    };
    
    ml(9,bound_self);
    ml.register=ml.bind(bound_self,8);
    
        
    // attempt to preload the prescribed root javascrpt file
    // preloading does not execute the script, but instead "compiles" it into a function that can be called later
    // the wrapper function is intended to add context to the
    preloadScriptModuleFunction (root_js,function(err,module_fn) {
        
        if (err) {
            // most likely the file does not exist, or a network error
            throw err;
        }

        // install the top level module
        installScriptModuleFn(root_js,function(err,mod){
            
            if (err) {
                throw err;
            }
            
            
        });
        
        
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
       
        
    });
    
    function globalRequireId(id,base) {
        const url   = idToUrl (id,base||scriptBase);
        const entry = urlIndex [url];
        if (entry ) {
            
            if (entry.module && entry.exports) {
            
                return entry.exports;
            }
            
            
            if (entry.module && entry.modDef) {

                delete entry.exports;
                entry.exports = entry.modDef.factory.apply(this,entry.modDef.dependency_urls.map(function(url){
                    return globalRequireId(url,base);
                }));
                
                
                delete entry.modDef.dependencies;
                delete entry.modDef.dependency_urls;   
                delete entry.modDef.extra_urls;        
                delete entry.modDef.factory;           
                
                return entry.exports;
            }
        }            
            
        throw new Error (id+" ("+url+") not available")
        
    }
    
    
    
    function globalIdAvail(id,base) {
        const url   = idToUrl (id,base||scriptBase);
        const entry = urlIndex [url];
        const depsAvail = function(deps) {
            return deps.filter(function(url){
                return globalIdAvail(url);
            }).length === deps.length;
        };
        
        if ( entry ) {
            
            if (entry.module && !entry.modDef) {
                // this has already been installed
                return !!entry.exports;
            }
            
            
            if (entry.module && entry.modDef) {

                return  depsAvail(entry.modDef.dependency_urls) &&
                        depsAvail(entry.modDef.extra_urls);
                
            }
        }            
            
        return false;
        
    }
    
    
   
    /*
    function globalRequire(id,base) {
        const script_url   = idToUrl (id,base||scriptBase);
        if (globalAvail(id,base)) {
            return Promise.resolve(globalRequireId(id,base));
        }
        return new Promise (function (resolve,reject){
             preloadScriptModuleFunction(script_url,function(err){
                 if (err) return reject(err);
                 
                 
                 
                 installScriptModuleFn(script_url,function(err,mod){
                     if (err) return reject(err);
                     
                     
                 });
                 
             });
        });
    }*/
    
    
    /*
    
    A module identifier is a String of "terms" delimited by forward slashes.
    A term must be a camelCase identifier, ".", or "..".
    Module identifiers may not have file-name extensions like ".js".
    Module identifiers may be "relative" or "top-level". A module identifier is "relative" if the first term is "." or "..".
    Top-level identifiers are resolved off the conceptual module name space root.
    Relative identifiers are resolved relative to the identifier of the module in which "require" is written and called.
    */
    
    function validateModuleIdTerm( term ) {
        return term.length>0 && /(^\.$)|(^\.\.$)|(^([A-Z][a-z0-9]+)+$)/.test(term);
    }
    
    function validateModuleId (id) {
        if (typeof id==='string') {
            const terms = id.split('/');
            return terms.length>0&&terms.filter(validateModuleIdTerm).length===terms.length;
        }
        return false;
    }
    
    function idToUrl (id,base) {
        if (id.slice(-1)==="/") {
           id += "index.js";
        } else {
           if (id.slice(-3)!=='.js') id += ".js";
        }
        if (/^http(s?)\:\/\//.test(id)) {
            return id;
        }
        
        if (id.indexOf("/")===0) {
            return id.replace(/^\//,scriptBase);
        }
        if (id.indexOf(scriptBase)===0) return id;
        
        if (id.indexOf('./')===0) {
            return id.replace(/^\.\//,base);
        }
        return base + id;
    }
    
    function loadMissing (urls, base, cb) {
        
        //convert depdancies array to an array of fully qualified
        urls = urls.map (function(dep){
            if (!validateModuleId(dep)) {
                return cb (new Error ("Invalid id:"+dep));
            }
            return idToUrl(dep,base);
        });
        
        
        // load any missing script modules
        const missing = urls.filter (function (url) {
            return !urlIndex[url];
        });
        
    
        if (missing.length>0) {
            
            preloadScriptModules (missing,function(err,loadedMissing){
               cb(undefined,urls,missing,loadedMissing);
            });
            
        } else {
            cb(undefined,urls,missing,[]); 
        }
    }

    function continueDefine(
        script_url,   // path to the script that called define() 
        id,           // if define supplied an id, this is it
        dependencies, // what caller to define put inside the [ids] dependancy list  
        urls,         // the urls we thing map 1 to 1 to the dependencies array
        requires ,    // the urls that are mentioned inside requires inside factory
        base,         // the folder that the the script that called define is runnign in.
        factory,      // the factory function passed to define()
        cb) {         // callback to return error or defined module
            
            const use_url = id ? idToUrl(id,base) : script_url;
            
            if (id && (script_url !== use_url) ) {
                
                urlIndex[ use_url ] = {
                    
                    load : function ( ) {
                       // since the module has already been loaded, ignore this
                       // (we know it's loaded since define is called by the module, so it nust be loaded!)
                    }
                };
                
            }
            
            urlIndex[ use_url ].modDef = {
                dependencies      : dependencies,
                dependency_urls   : urls,
                extra_urls        : requires.filter(function(u){ return urls.indexOf(u)<0; }),
                factory           : factory,
            };
            
            cb (undefined,urlIndex[ use_url ]);
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
    
    function do_defn1 (script_url,factory, cb) {
        if (! urlIndex[script_url] ) {
            
            return cb (new Error (script_url+" is not defined in urlIndex."));
            
        }
        
        // determine the base dir for scripts under this script
        const base = script_url.substr(0,script_url.lastIndexOf("/")+1);
        
        // scan the factory function for embeded defines.
        const reqs = fn_requires(factory);
        
        // and preload any that aren't already preloaded
        // (preloading does not "load" module (ie execute the script) but get the script into a function
        // format that can later be loaded
        loadMissing (reqs,base, function (err,requires) {
            // requires is an array of module objects with a .load() function which will execute the script
            if (err) return cb (err);
            // 
            continueDefine(script_url,undefined, [], [], requires,base,factory,cb) ;
        });
    }
    
    function do_defn2 (script_url,dependencies,factory, cb) {
        if (!urlIndex[script_url]) {
            
            return cb (new Error (script_url+" is not defined in urlIndex."));
            
        }
        
        // determine the base dir for scripts under this script
        const base = script_url.substr(0,script_url.lastIndexOf("/")+1);
        
        // preload the coded dependancies from the define callback.
        // (this does not execute the scripts, but pulls them into memory as a function )
        loadMissing (dependencies,base,function (err,urls) {
            // urls is an array of module objects with a .load() function which will execute the script
            if (err) return cb (err);
            
            // scan the factory function for embeded defines.
            const reqs = fn_requires(factory);
            
            // and load any that aren't already loaded
            loadMissing (reqs,base, function (err,requires) {
                // requires is an array of module objects with a .load() function which will execute the script
                if (err) return cb (err);
                // 
                continueDefine(script_url,undefined, dependencies,urls,requires ,base,factory,cb) ;
            });
        });
    }
    
    function do_defn3 (script_url,id, dependencies, factory, cb) {
        
        if (!urlIndex[script_url]) {
            
            return cb (new Error (script_url+" is not defined in urlIndex."));
            
        }
        
        // determine the base dir for scripts under this script
        const base = script_url.substr(0,script_url.lastIndexOf("/")+1);
        
        // preload the coded dependancies from the define callback.
        // (this does not execute the scripts, but pulls them into memory as a function )
        loadMissing (dependencies,base,function (err,urls) {
            if (err) return cb (err);
            
            // scan the factory function for embeded defines.
            const reqs = fn_requires(factory);
            
            // and preload any that aren't already loaded
            // (this does not execute the scripts, but pulls them into memory as a function )
            loadMissing (reqs,base, function (err,requires) {
                // requires is an array of module objects with a .load() function which will execute the script
            
                if (err) return cb (err);
                // 
                continueDefine(script_url,id, dependencies,urls, requires, base, factory,cb) ;
            });
        });

    }

    function installScriptModuleFn(script_url,cb) {
        // invokes the module function wrapper which will do 1 or more of the following:
        // call define()
        // call require();
        // call ml()
        // modify module.exports
        // replace module.exports
        // modify self/window
        // we basically set traps for all of the above, and associated the objects created with the url.
        // calling define can happen more than once, as can calling ml
        // it's presumed that modifying window, replacing exports, or calling define happens synchronously, while require may happen at any time going forward
        
        if (urlIndex [script_url].module && !urlIndex [script_url].modDef) {
            // this has already been installed
            return cb(undefined,urlIndex [script_url].module);
        }
        
        if (urlIndex [script_url].module && urlIndex [script_url].modDef) {
            // this has already been loaded but not fully installed
            return cb(undefined,globalRequireId(script_url));
        }
        
        const 
        
        exports  = { }, 
        module   = { exports : exports }, 
        // determine the base dir for scripts under this script
        script_dir = getPathDir( getUrlPath(script_url) ),
        // capture the current set of keys for "this"
        selfKeys = Object.keys(this);
        
        // "execute" the script in a context that traps define, require and supplies module, exports
        
        try {
            localDef.amd={};
            urlIndex[script_url].load.call(this,ml,localDef,moduleRequireId,module,exports);
        } catch (e) {
            return cb (e);
        }

        if (module.exports !== exports) {
            // module.exports has been replaced, that's most likely the export
            urlIndex [script_url].module = module;
            urlIndex [script_url].exports = module.exports;
            return cb(undefined,globalRequireId(script_url));
        } else {
            if( Object.keys(module.exports).length > 0 ) {
                //module.exports has had keys added - so most likely that's the export]
                urlIndex [script_url].module  = module;
                urlIndex [script_url].exports = module.exports;
                return cb(undefined,globalRequireId(script_url));
            }
        }
        
        
        //checkAsyncDeferred ();
             

        function localDef (a,b,c) {
            switch (arguments.length) {
                case 1 : return do_defn1(script_url,module,exports,a,     onDefine );
                case 2 : return do_defn2(script_url,module,exports,a,b,   onDefine );
                case 3 : return do_defn3(script_url,module,exports,a,b,c, onDefine );
            }
            
            function onDefine(err,entry) {
                
                if (!err && entry === urlIndex [script_url]) {
                    // only to the callback for the primary module
                    // (module may be defining submodules)
                    return cb(undefined,globalRequireId(script_url));
                }
                
            }
        }
         
        function moduleRequireId(id) {
            return globalRequireId(id,script_dir);
        }
        
        
        /*
        function checkAsyncDeferred () {
            
            // see if any new objects have been added to window since we started loading
            if (Object.keys(this).some(function(k){
                if ( selfKeys.indexOf(k)<0 ) {
                    module.exports = self[k];
                    urlIndex [script_url].module = module;
                    return true;
                }
            })) return cb(undefined,globalRequireId(script_url));
        
           
            setTimeout(checkAsyncDeferred,1);
           
        }*/
    }
    
    function ml(x,L, o, a, d, s){
        let c,t,T=(G)=>typeof G,l=location,O=l.origin,A=[].slice.call(arguments),W=A.map(T);
        if (!ml.h){
            //create history db if none exists
            
            ml.h={};ml.H=[];ml.d={};ml.f={};ml.l=['ml.sw.js'];
            
            
            let
            
            C=console;
            // "t" contains an array of types - object,function,string,undefined
            // used for comparisions later
            ml.t=t=[C,ml,'',t].map(T);
            // "c" contains initial parameter parser(wraps for argument calls eg ml(1), ml(2), and 
            // any constants/worker functions they need. 
            // note that t doubles as a proxy for "undefined" in the type array "t" above 
            ml.c=c={
                
                //c.r = regex:splits "mod | /url" --> [ "mod | url" ,"mod","", /url"] or null
                //c.r = regex:splits "mod@Window | /url" --> [ "mod | url" ,"mod","Window", /url"] or null
                r:(u)=>/([A-z0-9\_\$]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(u),
                //c.b=document base
                b:O+/([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],
                //c.ri() = a random id generator
                ri:()=>Math.random().toString(36).substr(-8),
                //c.c returns true if url is under current domain.
                c:(u)=>u.startsWith(O),
                R:'replace',
                f:'forEach',
               // w:'serviceWorker',
               // n:'navigator',
               // d:"document",
                
                //c.u: convert string to array, remove comments, and whitespace
                u:(u)=>u=typeof u===t[2]?u[c.R](/(^(?:[\t ]*(?:\r?\n|\r))+)|(\ |\t)/gm,'')
                                          [c.R](/(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/))[\r\n]*/g,'')
                                          .trim().split('\n').map((x)=>x.trim()).filter((x)=>x.length):u, 
                
                //c.B=rebase  paths that start with ./subpath/file.js or subpath/file.js
                B:(u,r)=>(r=/^\//)&&/^(http(s?)\:\/\/)/.test(u)?u:r.test(u)?u[c.R](r,O+'/'):c.b+u[c.R](/^(\.\/)/,''),
                
                
                //ml(0)->c[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
                //     (o is the result of c[1]() which was invoked earlier in outer script scope, when it called ml(1) 
             
                0:(L,u,a)=>{
                   
                   u = c.u(u);
                   
                   u=u.map(ml.g).filter(c.y);
                  
                   if (!u.length) {
                       L=c.S;
                       ml.H[c.f](function(U){
                          ml.h[U] && c.k(ml.h[U].e)[c.f]((m)=>{
                             if (!ml.h[U].e[m]) ml.h[U].e[m]=L[m]; 
                          }) 
                       });
                   }
                   return u.length?c.i(c[0], L,u,a):a();
                },
        
                
                // ml(1)->c[1] = resolve to self or an empty object - becomes exports section
                1:()=>c.S||{},
                
                // ml(2)-->c[2](L,o,a,d,e,r) 
                
                // L = "Window", "ServiceWorkerGlobalScope" (result of ml(1)--> c[1]
                // o = exports (ie self ie window)
                // a = dictionary of dependants per window type
                // d = array of loaded dependants 
                // e = variable - used for exports container 
                // r = undefined
                2:(L,o,a,d,e,r)=>{
                        e = a[L] && a[L].name; e=typeof e+typeof o[e]===t[2]+t[3]? c.m(o,e,a[L].apply(this, d[L].map(c.x))) : r;
                },
                
                //c.P property descriptor
                P:(v)=>1&&{value: v,enumerable: !0,configurable: !0},
                //c.s set key value in obj, returning value
                s:(o,k,v)=>{Object.defineProperty(o,k,c.P(v));return v;},
                m:(o,e,v,h)=>{
                    c.s(o,e,v); // do the import into o[e]
                    
                    if (!ml.d[e]) {
                        h = c.ri()+".js";
                        ml.d[e]={h:h};
                    } else {
                        h = ml.d[e].h;
                    }
                    
                    ml.h[ h ] = ml.h[ h ] || {e:{}};
                    
                    c.s(ml.h[ ml.d[e].h ].e,e,v);
                },
                
                // ml(3)->c[1] = resolve to whatever self is (Window,ServiceWorkerGlobalScope or Object if self was not assigned)
                3:()=>c.C,//legacy for old module format
                C:"ServiceWorkerGlobalScope",//
                
                // ml(1)->c[1] = resolve to self or undefined
                4:()=>c.S,// legacy for old module format
                //c.S === self
                S:typeof self === t[0] && self,
                
                //c.x = map iterator to execure every function in an array of functions
                //      (used to resolve each loaded module)
                x:(f)=>f(),
                l:C.log.bind(C),
                e:C.error.bind(C),
                //c.L = loader hoist function (called when first argument to ml is a string)
                L:(S,R,t,w)=>{
                   // ml("/path/to/mod.js",function(mod){...}) 
                   //   ==>  x="/path/to/mod.js", L=function(mod){ /* do something with mod*/ }
                   // ml("/path/to/mod.js",function(mod){...},window,"modName") 
                   //   ==>  x="/path/to/mod.js", L=function(mod){ /* do something with mod*/ } o=window,a="modName"
                   w=!!o;
                   S=w?o:{};  // S=dummy self, contains "t" temporarily
                          // R=holder for S.t between deletion and return
                   R=c.r(x)||[x,'t',0,x];// [fullurl,tempname,ignored,url]
                   t=a||R[1];
                   return ml(
                       0,S,[
                       t+"@T|"+R[3]],
                       ()=>ml(  2,'T',S,
                               {T:L},
                               {T:[()=>{ R=S[t];
                                         if (!w) delete S[t];
                                         return R;
                                        }
                                  ]}),
                       'T'
                   );
                },
                I:(M,I)=>(M=ml.d[x])&&(I=ml.h[ M.h ])&&I.e[x],
                I2:(I)=>(I=ml.h[c.B(x)])&&I.e[ c.k(I.e)[0] ],
                
                //c.k = Object.keys();
                k:(o)=>Object.keys(o),
                //quasi setImmediate (can be swapped out by replacing ml.c.i)
                i:(f,a,b,c)=>setTimeout(f,0,a,b,c),
                K:{},
                n:(N,f,K)=>{
                  if(c.K[N]){c.K[N].push(f);}else{c.K[N]=[f];}
                  c.j();
                },
                j:()=>{
                    c.k(c.K).forEach((k)=>{
                       if (c.S[k]) {
                           c.K[k].forEach((f)=>f(c.S[k]));
                           delete c.K[k];
                       }
                    });
                    c.k(c.K).length && c.i(c.j);
                },
                A:A,// save initial args into ml.c.A,
                //c.H(u) === url not loaded
                H:(u) => ml.H.indexOf(u)<0,
                        
                //c.y = filter to remove elements that truthy. (c.m returns false when a module is loaded, so truthy = name of still to be loaded module)
                y:(x)=>!!x,
                
                
                
                //c.G wrap event E to call X, whhich is stored as c[E]
                G:(E,X)=>{ml[E]=X;return (e)=>ml[E](e);},
                
                  
                
                //install final event handler,and return captured promise for install event
                8:(E,f)=>{
                    ml[E]=f;
                    return ml.p.splice(0,ml.p.length);
                },
                
                //c.In = install initial event handler wrapper 
                In:(S,E,X)=>S.addEventListener(E,c.G(E,X?X:(e)=>{c.l(E,e.data);})), 
                M:'message',
                9:(S)=>{
                         ml.p=[];
                         c.In(S,'install',(e)=>self.skipWaiting());
                         c.In(S,'activate');
                         c.In(S,'fetch',(e)=>fetch(e.request));
                         c.In(S,c.M,(e,r,m,d,M,Z)=>{
                             d=e.data;m=ml[c.M+'s'];r=m&&d.m;
                             Z=(x,c)=>{
                                 c = new BroadcastChannel(d.r);
                                 c.postMessage(x);
                                 c.close();
                                 Z=0;
                             };
                             if (r){ 
                                 r=m[r];
                                 r=T(r)===t[1]&&r(d,Z);
                                 if (r&&Z){Z(r);}
                             }
                         });
                         importScripts( new URL(location).searchParams.get('ml') );
                }
                  
               
                  
            };
           
           
            //ml.g = map iterator for c[0]
            ml.g = (x,R,U,N)=>{
                        
                         R=c.r(x);
                         if (!R) {
                             if (c.S[x]||ml.i[x]) {
                                 // 
                                return !1;
                             }
                             return x;
                         } else {
                             // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                            if ((N=R[2])&&N!==(d||c.C)) return !1; 
                         }
                         
                         N=R[1];
                         U=c.B(R[3]);
                         if (c.H(U)) {
                             ml.l.push(N+'='+U);
                             ml.d[N]={h:U};
                             ml.H.push(U);
                             try {
                                importScripts(U);
                                c.n(N,(e)=>{
                                    ml.h[U] = ml.h[U]   || {e:{}};
                                    ml.h[U].e[N]=c.S[N] || false;
                                });
                             } catch (e){
                                c.e(e.message,'while loading',U,'in',ml.l);  
                             }
                             ml.l.pop();
                         }
                         
                         return N;
                   };
                   
            ml.i=new Proxy({},{
                //get:(t,p)=>c.I(x=p),
                get:(t,p)=>c.I(x=p)||c.I2(x=p)||(p.slice&&p.slice(-3)!==".js"&&c.I2(x=p+".js"))||(x=ml.d[p])&&(x=x.h&&ml.req(x.h)),
                
                ownKeys:()=>c.k(ml.d),
                getOwnPropertyDescriptor:(t,p)=>!!ml.d[p]&&c.P(c.I(p)),
                has:(t,p)=>!!ml.d[p]
            });
    
        }   
        c=ml.c;
        t=ml.t;
        //for inner module hoist, we can drop the need for ml(3) and ml(4) now, since ml.js became ml.sw.js so we don't need to deduce context anymore
        if (x===2&&!(L===c.C&&o===c.S)) {
            s=a;
            d=o;
            a=L;
            o=c.S;
            L=c.C;
        }
    
        // if first arg is array/string second is function, no third ie ml(['blah|blah.js'],function(){...}   ml("blah|blah.js",function(){...}   
        if (!o&&(Array.isArray(x)||T(x)===t[2])&&T(L)===t[1]){
           a=L
           o=x;
           L=c.S;
           x=0;
        }
    
        // see if we can get away without instantiating z to service this query, if so, do it and set z to something other than c
        return typeof c[x]===t[1] && c[x](L,o,a,d,s);
    
    }
    

    function loadScriptText_fetch(url,cb){
        
        fetch(url,{mode:'no-cors'}).then(function(response){
            response.arrayBuffer().then(function(buffer){
                return cb (undefined,new TextDecoder().decode(buffer),buffer,response.status);
            }).catch(cb);
        }).catch(cb);
        
    }
    
    function compile_newfunc(args,src,arg_values,cb){
        try {
            const mod_fn = new Function (args,src);
            cb(undefined,mod_fn.apply(undefined,arg_values))
        } catch (e) {
            cb(e);
        }
    }
    
    
    
    function preloadScriptModuleFunction (url,cb) {
        if (typeof cb !== 'function') throw new Error ("expecting cb to be a function");
        if (urlIndex[url]) {
            // already loaded
            return cb(undefined,urlIndex[url]);
        }
        
        loadScriptText(url,function(err,text){
            
           if (err) return cb(err);
           
           if (url.slice(-3)===".js") {
               const filename = getUrlPath(url);
               const dirname  = getPathDir(filename);
               const compile_mode = comile_debug_regex.test(text) ? compile_viascript_base64 : compile;
               
               compile_mode(   [  'self', '__filename', '__dirname'], 
                          [
                            'return function (ml,define,require,module,exports){',
                            text,    
                            '};' 
                          ].join('\n'),
                        [bound_self,filename,dirname],
                        function(err,mod_fn){
                            if (err) return cb(err);
                                         
                            // create the module object, which has a loader func, ready to execute the script
                            const mod = {            
                                load : function (ml,define,require,module,exports) {
                                    // on first call, execute the script wrapper function
                                    mod_fn.call(this,ml,define,require,module,exports);
                                    mod.load = function () {
                                    };
                                }
                            };
                            
                            urlIndex[url] = mod;
                            return cb (undefined, mod);
                        });
                   
               /*
               try {
                   
                   // create a wrapper function that locks in the file path 
                   const mod_fn = (new Function (['self', '__filename', '__dirname'],[
                                    'return function (ml,define,require,module,exports){',
                                    text,    
                                    '};'
                                ].join('\n'))(bound_self,filename,dirname));
                                
                   // create the module object, which has a loader func, ready to execute the script
                   const mod = {            
                       load : function (ml,define,require,module,exports) {
                           // on first call, execute the script wrapper function
                           mod_fn.call(this,ml,define,require,module,exports);
                           // save module
                           //mod.module  = module;
                           // create a virtual exports that always returns module.exports, even if it's replaced later
                           //Object.defineProperty (mod,'exports',{get: function(){return module.exports;}});
                           // swap out the load function, so calling this twice has no effect
                           mod.load = function () {
                           };
                       }
                   };
                   
                   urlIndex[url] = mod;
                   return cb (undefined, mod);
                   
                   
               
               } catch (err) {
                   
                   cb(err);
               }
               
               */
               
           } else if (url.slice(-5)===".json") {
             try {
                   
                   const obj = JSON.parse(text);
                   const mod = {
                      load : function () {
                          mod.module = {exports : obj};
                          // create a virtual exports that always returns module.exports, even if it's replaced later
                          Object.defineProperty (mod,'exports',{get: function(){return module.exports;}});
                          mod.load = function() {};
                      }
                   };
                   
                   urlIndex[url] = mod;
                   
                   return cb (undefined,mod);

                  
             } catch (err) {
                 
                  cb(err);
             }
           }
           
           
        });
        
    }
    
    function preloadScriptModules(urls,cb,i,results) {
        if (typeof cb !== 'function') throw new Error ("expecting cb to be a function");
        
        
        if (!Array.isArray(urls)) {
            cb (new Error ("expecting array as first argument") );
        }

        if (!results) {
             return (preloadScriptModules,urls,cb,0,new Array (urls.length));
        }
        
        if (i < urls.length) {
            return preloadScriptModuleFunction(urls[i],function(err,mod_fn){
                if (err) { 
                    return cb(err);
                }
                results[i]=mod_fn;
                return preloadScriptModules(urls,cb,i+1,results); 
            });
        }
        
        return cb (undefined,results);
    }
    

}

amd((
    
    (u)=>u.searchParams.get('ml').replace(
        /\.\//,u.origin+u.pathname.substr(0,u.pathname.lastIndexOf("/")+1)
        )
    )(new URL(location)),this);
