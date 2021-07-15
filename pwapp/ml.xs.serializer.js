
/* global ml,self,BigInt64Array,BigUint64Array,BigInt  */

/*jshint -W054 */

ml(0,ml(1),`
    
   setImmediateLib | ml.xs.setImmediate.js
   Rusha           | rusha.js
    
`,function(){ml(2,

    {
        Window: function serializerLib( lib ) {
        
            return lib;
        },

        ServiceWorkerGlobalScope: function serializerLib( lib ) {

           
            return lib;
        } 
    }, {
        Window: [
            ()=>serializerLib
        ],
        ServiceWorkerGlobalScope: [
            ()=>serializerLib
        ],
        
    }

    );
        
        
        function serializerLib (){        
            if (serializerLib.cached) {
                return serializerLib.cached;
            }
            return ml.i.setImmediateLib(function (setImmediate,clearImmediate){
                    
                const arrayTypes = [ "Int8Array","Uint8Array","Uint8ClampedArray",
                                     "Int16Array","Uint16Array","Int32Array",
                                     "Uint32Array","Float32Array",
                                     "Float64Array","BigInt64Array","BigUint64Array"
                                   ];
                const arrayConstructors = [
                    
                    typeof Int8Array         === 'function' ? Int8Array         : undefined,
                    typeof Uint8Array        === 'function' ? Uint8Array        : undefined,
                    typeof Uint8ClampedArray === 'function' ? Uint8ClampedArray : undefined,
                    typeof Int16Array        === 'function' ? Int16Array        : undefined,
                    typeof Uint16Array       === 'function' ? Uint16Array       : undefined,
                    typeof Int32Array        === 'function' ? Int32Array        : undefined,
                    typeof Uint32Array       === 'function' ? Uint32Array       : undefined,
                    typeof Float32Array      === 'function' ? Float32Array      : undefined,
                    typeof Float64Array      === 'function' ? Float64Array      : undefined,
                    typeof BigInt64Array     === 'function' ? BigInt64Array     : undefined,
                    typeof BigUint64Array    === 'function' ? BigUint64Array    : undefined
                ];
                
                const 
                
                Rusha = ml.i.Rusha,
                
                sha1Hex = function (buffer){ 
                    return Rusha.createHash().update(buffer).digest('hex');
                },
                sha1 = function (buffer){ 
                    return Rusha.createHash().update(buffer).digest();
                };
                
                const JSON_stringifyable = ["undefined","boolean","string","number"]
                
        
                function R(x,cb){setImmediate(cb,x);}
                function J(x,cb){setImmediate(cb,JSON.stringify(x));}
                
                function errLogger(err){
                    
                    console.log(err);
                    throw err;
                }
                
                function A(x,handler,cb){
                        Promise.all(x.map(function(el){
                            
                            return new Promise(function(resolve){
                                handler(el,resolve);
                            });
                            
                        })).then(cb).catch(errLogger);
                }
                
                function getObjectStore(x,cb) {
                    const store      = [];// holds stored object (the literal object)
                    const serialized = [];// holds serialized object (string)
                    
                    // create an object store (to detect cicular references for objects or functions that can contain other objects)
                    // (also helps reduce size of seriliazation if large objects are repeated in a non circuar fashion)
        
                    // serlize the top item, and any sub items
                    // (if x is not an object, there won't be any sub items)
                    return  serialize( x, function(ser_x){ 
                        
                        serialized.push(ser_x);
                        cb(serialized.join('\n'));
                        serialized.splice(0,serialized.length);
                        store.splice(0,store.length);
                        
                    } , objStore);
        
                    function objStore(obj,cb){
                        
                         if (["object","function"].indexOf(typeof obj) >=0) {
                            const index = store.indexOf(obj);
                            if (index < 0) {
                                const index = serialized.length; 
                                store.push(obj);
                                serialized.push("-");
                                return  function (ser){
                                       serialized[index]=ser;
                                       cb('@' + index.toString(36));
                                };
                            }
                            
                            cb('@'+index.toString(36));
                            return ;
                            
                        }
                        throw new Error ("non object ("+typeof obj+") passed into objStore()");
                    }
        
                }
                
                function serialize(x,cb,objStore) {
                    switch (typeof cb+typeof objStore) {
                        case "functionfunction"  : return serialize[typeof x](x,cb,objStore);
                        case "functionundefined" : return getObjectStore(x,cb);
                    }
                    throw new Error ("incorrect arguments passed to serialize");
                }
        
                // handle primitives that don't need to be wrapped in an array construct
                JSON_stringifyable.forEach(function(typ){
                    serialize[typ] = J;
                });
                
                // 
                serialize.bigint = function(x,cb) {
                    J(["bigint",x.toString()],cb);
                };
                serialize.symbol = function(x,cb) {
                    J(["symbol",/(?:Symbol\()(.*)(?:\))/.exec(x.toString())],cb);
                };
                serialize.object = function(x,cb,objStore) {
                    if (x===null) {
                        return R('[null]',cb); 
                    }
                    const handler = serialize.object[x.constructor.name];
                    return handler?handler(x,cb,objStore):cb ('{}');
                };
                
                serialize.object.Array = function(arr,cb,objStore) {
                    const assign = objStore(arr,cb);
                    if (!assign) {
                        return;
                    }
                    
                    return A(
                       arr,
                       function(x,cb) {
                           return serialize(x,cb,objStore);
                       },
                       function(ser_array){
                           ser_array.unshift("Array");
                           J(ser_array,assign);
                       }
                    );
                };
                
                serialize.object.Object = function(obj,cb,objStore) {
                   // see if object is already stored (prevents circular) 
                   const assign = objStore(obj,cb);
                   
                   if (!assign) {
                       return;
                   }
                    
                   const keys = Object.keys(obj);
                   A(
                       keys,
                       function(key,resolve){
                          serialize(obj[key],resolve,objStore);
                       },
                       function(strs){
                           const obj2={};
                           keys.forEach(function(k,ix){
                               obj2[k]=strs[ix];
                           });
                           J(obj2,assign);
                       });
                };
                
                serialize.object.HTMLScriptElement = function(x,cb) {
                    if (x.src&&x.src.length) {
                      fetch( x.src, {mode:'no-cors'}).then(
                            function(res){
                              res.arrayBuffer()
                                 .then(function(buf){
                                     const code = new TextDecoder().decode(buf);
                                     J(["HTMLScriptElement",x.src,code],cb); 
                                 })
                                 
                                 .catch (function(err){
                                     const code = x.innerText || x.text || x.textContent || '/*no script content*/\n';
                                     J(["HTMLScriptElement",x.src,code,err.message],cb); 
                                 });
                            })
                            
                        .catch(function(err){
                            const code = x.innerText || x.text || x.textContent || '/*no script content*/\n';
                            J(["HTMLScriptElement",x.src,code,err.message],cb); 
                        });
                      
                    } else {
                        const code = x.innerText || x.text || x.textContent;
                       J(["HTMLScriptElement",x.src,code],cb); 
                    }
                };
                
                serialize.object.Date = function(x,cb) {
                    J(["Date",x.getTime()],cb); 
                };
                
                serialize.object.RegExp = function(x,cb) {
                    J(["RegExp",x.source,x.flags],cb); 
                };
                
                serialize.object.ArrayBuffer = function(x,cb,objStore) {
                    const assign = objStore(x,cb);
                    if (assign) {
                        J(["ArrayBuffer",new TextDecoder().decode(x)],assign);
                    }
                };
                
                arrayTypes.forEach(function(arrayClass){
                    serialize.object[arrayClass] = function(x,cb,objStore) {
                        const assign = objStore(x,cb);
                        if (assign) {
                           J([arrayClass,new TextDecoder().decode(x.buffer)],assign);
                        }
                    };    
                });
                
                serialize.function = function(fn,cb,objStore) {
                    
                    const assign = objStore(fn,cb);
                    
                    if (!assign) {
                        return;
                    }
        
                    const source = fn.toString();
                    const keys = Object.keys(fn);
                    const vars = {};
                    const nm = fn.name;
                    const sourceTrimmed = source.substring(
                         source.indexOf('{')+1,
                         source.lastIndexOf('}')
                    );
                    const args = serialize.function.args(source);

                    // make a temp object that has each key enumerated by the function's object
                    keys.forEach(function(k){vars[k]=fn[k];});
                    
                    
                    A(
                    keys,
                    function(key,resolve){
                       serialize(fn[key],resolve,objStore);
                    },
                    function(strs){
                        const obj2={};
                        keys.forEach(function(k,ix){
                            obj2[k]=strs[ix];
                        });
                        J(obj2,function(vars_ser){
                            keys.forEach(function(k){ delete vars[k];});
                            assign(JSON.stringify(["function",nm,args,sourceTrimmed,vars_ser]));
                        });
                    });
                    
                };
                serialize.function.args = function (x) {
                    const source = typeof x==='string'?x:x.toString();
                    const sourceNoComments = source.replace(/(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/)|\/\/.*?[\r\n])[\r\n]*/g,'');
                    const args = sourceNoComments.split('(')[1].split(')')[0].split(',').map(function(fn){ return fn.trim();});
                    return args
                };
                
                function SOME(array,iterator) {
                    let 
                    done,error,
                    after=function(){},
                    caught=function(err){ throw err;},
                    final;
                   
                    
                    setImmediate(loop,0);
                    
                    return {
                        then : function (fn) {
                            if (typeof done==='boolean') {
                                fn(done);
                            } else {
                               after=fn;
                            }
                        },
                        catch : function (fn) {
                            if (error) {
                                fn(error);
                            } else {
                               caught=fn;
                            }
                        },
                        finally : function (fn) {
                            if (typeof done==='boolean') {
                                fn();
                            } else {
                               final=fn;
                            }
                        }
                    }; 
                    
                    function loop(index){
                        
                        if (index < array.length) {
                            let result;
                            try {
                                result = iterator(array[index],index,array);
                            } catch (ouch) {
                                error=ouch;
                                if (final) {
                                    caught(error);
                                    setImmediate(final);
                                } else {
                                    setImmediate(caught,error);
                                }
                                return;
                            }    
                            
                            if (result===true) {
                                done=true;
                                if (final) {
                                    after(done);
                                    setImmediate(final);
                                } else {
                                    setImmediate(after,done);
                                }
                            } else {
                                setImmediate(loop,index+1);
                            }
                        } else {
                            done=false;
                            if (final) {
                                after(done);
                                setImmediate(final);
                            } else {
                                setImmediate(after,done);
                            }
                        }
                    }
                }
                
                function FOREACH(array,iterator) {
                    
                    let 
                    done,error,
                    after=function(){},
                    caught=function(err){ throw err;},
                    final;
                    
                    
                    
                    setImmediate(loop,0);                    
                     
                    return {
                        then : function (fn) {
                            if (done===true) {
                                fn();
                            } else {
                               after=fn;
                            }
                        },
                        catch : function (fn) {
                            if (error) {
                                fn(error);
                            } else {
                               caught=fn;
                            }
                        },
                        finally : function (fn) {
                            if (typeof done==='boolean') {
                                fn();
                            } else {
                               final=fn;
                            }
                        }
                    };
                    
                    function loop(index) {
                        
                        if (index < array.length) {
                            try {
                                iterator(array[index],index,array);
                            } catch (ouch) {
                                error=ouch;
                                done=false;
                                if (final) {
                                    caught(error);
                                    setImmediate(final);
                                } else {
                                    setImmediate(caught,error);
                                }
                                
                            }
                            setImmediate(loop,index+1);
                        } else {
                            done=true;
                            if (final) {
                                after();
                                setImmediate(final);
                            } else {
                                setImmediate(after);
                            }
                        }
                    
                    }
                    
                }
        
                function deserializeResolverSync(str,bound,cb) {
                     
                            const serialized = str.split('\n');
                            const store      = new Array (serialized.length);
                            const ready      = new Array (serialized.length);
                            
                            let completed = 0;
                            
                            while (serialized.some(incomplete)&&completed<serialized.length);
                            
                            serialized.forEach(finalPass);
                            
                            serialized.splice(0,serialized.length);
                            
                            if (store.length>1) {
                                store.splice(0,store.length-1)
                            }
                            
                            return store.pop();
                            
                            function incomplete(ser,index) {
                                if (!!store[index]) return false;
                                
                                const s=ser.trim();
        
                                const c0=s.charAt(0);
                                switch (c0) {
                                    case '@': {
                                        const childIndex = Number.parseInt(s.substr(1),36);
                                        store[index] = store[childIndex];
                                        if (!ready[index]) {
                                           if (!!store[index]) {
                                               ready[index]=true;
                                               completed++;
                                           }
                                        }
                                        return !store[index];
                                    }
                                    case '[': {
                                        store[index] = deserialize['['](s,objRestore,index,undefined,bound);
                                        if (!ready[index]) {
                                           ready[index]=true;
                                           completed++;
                                        }
                                        return false;
                                    } case '{': 
                                        store[index] = deserialize['{'](s,objRestore,index);
                                        if (!ready[index]) {
                                           ready[index]=true;
                                           completed++;
                                        }
                                        return false; 
                                }
        
                                if ('0123456789-tnf"'.indexOf(c0)<0) {
                                    throw new Error ("invalid JSON");
                                }
                                store[index] = JSON.parse(s);
                                return false ; // not incomplete
                            }
                            
                            
                           
                            
                            function objRestore(ser,atIndex,container) {
                               const s=ser.trim();
        
                               const c0=s.charAt(0);
                               switch (c0) {
                                   case '@': {
                                       const childIndex = Number.parseInt(s.substr(1),36);
                                       if (atIndex===childIndex && container) {
                                           return container;
                                       }
                                       return  store[childIndex];
                                   }
                                   case '[': {
                                       return deserialize['['](s,objRestore,atIndex,undefined,bound);
                                   } case '{': 
                                       return deserialize['{'](s,objRestore,atIndex);
                               }
                                   
                               if ('0123456789-tnf"'.indexOf(c0)<0) {
                                   throw new Error ("invalid JSON");
                               }
                               return JSON.parse(s);
                            }
                            
                            
                            
                            
                            function finalPass(ser,index) {
                                const s=ser.trim();
                                const c0=s.charAt(0);
                                switch (c0) {
                                    case '[': {
                                        deserialize['['](s,freshen,index,store[index]);
                                        return;
                                    } case '{': 
                                        deserialize['{'](s,freshen,index,store[index]);
                                        return; 
                                }
                            }
                            
                            
                           
                            
                            function freshen(ser,atIndex,container,containerKey) {
                               const s=ser.trim();
        
                               const c0=s.charAt(0);
                               switch (c0) {
                                   case '@': {
                                       const childIndex = Number.parseInt(s.substr(1),36);
                                       if (atIndex===childIndex && container) {
                                           container[containerKey]=container;
                                           return container;
                                       }
                                       return store[childIndex];
                                   }
                                   case '[': {
                                       deserialize['['](s,freshen,atIndex,store[atIndex]);
                                       return store[atIndex];
                                   } case '{': 
                                       deserialize['{'](s,freshen,atIndex,store[atIndex]);
                                       return store[atIndex];
                               }
                               return store[atIndex];
                            }
                            
                             
        
                }
                
                
                
                function deserializeResolver(str,bound,cb) {
                            
                            const serialized = str.split('\n');
                            const store      = new Array (serialized.length);
                            const ready      = new Array (serialized.length);
                            
                            let state = {completed : 0};
                            
                            return typeof cb==='function'? asyncIt(state,cb)  : syncIt(state) ;
                            
                            
                            function asyncIt(state,cb) {
                                
                                function pass1(state,pass2) {
                                    SOME(serialized,incomplete)
                                     .then(function(some){
                                          if (some && state.completed<serialized.length) {
                                              setImmediate(pass1,state,pass2);
                                          } else {
                                              pass2()
                                          }
                                     });
                                }
                                
                                pass1(state,function(){
                                   
                                   FOREACH(serialized,finalPass)
                                   .then(function(){
                                           
                                           serialized.splice(0,serialized.length);
                                           
                                           if (store.length>1) {
                                               store.splice(0,store.length-1)
                                           }
                                           
                                           return cb(store.pop());
                                   });
                                    
                                });
                            }
                         
                            function syncIt(state) {
                                while (serialized.some(incomplete)&&state.completed<serialized.length);
                                
                                serialized.forEach(finalPass);
                                
                                serialized.splice(0,serialized.length);
                                
                                if (store.length>1) {
                                    store.splice(0,store.length-1)
                                }
                                
                                return store.pop();
                            }
                         
                            
                            function incomplete(ser,index) {
                                if (!!store[index]) return false;
                                
                                const s=ser.trim();
        
                                const c0=s.charAt(0);
                                switch (c0) {
                                    case '@': {
                                        const childIndex = Number.parseInt(s.substr(1),36);
                                        store[index] = store[childIndex];
                                        if (!ready[index]) {
                                           if (!!store[index]) {
                                               ready[index]=true;
                                               state.completed++;
                                           }
                                        }
                                        return !store[index];
                                    }
                                    case '[': {
                                        store[index] = deserialize['['](s,objRestore,index,undefined,bound);
                                        if (!ready[index]) {
                                           ready[index]=true;
                                           state.completed++;
                                        }
                                        return false;
                                    } case '{': 
                                        store[index] = deserialize['{'](s,objRestore,index);
                                        if (!ready[index]) {
                                           ready[index]=true;
                                           state.completed++;
                                        }
                                        return false; 
                                }
        
                                if ('0123456789-tnf"'.indexOf(c0)<0) {
                                    throw new Error ("invalid JSON");
                                }
                                store[index] = JSON.parse(s);
                                return false ; // not incomplete
                            }
                            
                            
                           
                            
                            function objRestore(ser,atIndex,container) {
                               const s=ser.trim();
        
                               const c0=s.charAt(0);
                               switch (c0) {
                                   case '@': {
                                       const childIndex = Number.parseInt(s.substr(1),36);
                                       if (atIndex===childIndex && container) {
                                           return container;
                                       }
                                       return  store[childIndex];
                                   }
                                   case '[': {
                                       return deserialize['['](s,objRestore,atIndex,undefined,bound);
                                   } case '{': 
                                       return deserialize['{'](s,objRestore,atIndex);
                               }
                                   
                               if ('0123456789-tnf"'.indexOf(c0)<0) {
                                   throw new Error ("invalid JSON");
                               }
                               return JSON.parse(s);
                            }
                            
                            
                            
                            
                            function finalPass(ser,index) {
                                const s=ser.trim();
                                const c0=s.charAt(0);
                                switch (c0) {
                                    case '[': {
                                        deserialize['['](s,freshen,index,store[index]);
                                        return;
                                    } case '{': 
                                        deserialize['{'](s,freshen,index,store[index]);
                                        return; 
                                }
                            }
                            
                            
                           
                            
                            function freshen(ser,atIndex,container,containerKey) {
                               const s=ser.trim();
        
                               const c0=s.charAt(0);
                               switch (c0) {
                                   case '@': {
                                       const childIndex = Number.parseInt(s.substr(1),36);
                                       if (atIndex===childIndex && container) {
                                           container[containerKey]=container;
                                           return container;
                                       }
                                       return store[childIndex];
                                   }
                                   case '[': {
                                       deserialize['['](s,freshen,atIndex,store[atIndex]);
                                       return store[atIndex];
                                   } case '{': 
                                       deserialize['{'](s,freshen,atIndex,store[atIndex]);
                                       return store[atIndex];
                               }
                               return store[atIndex];
                            }
                            
                             
        
                }
                
                function deserialize (str,bound,cb){
                    if (typeof bound==='function' && typeof cb==='undefined') {
                        cb = bound;
                        bound = undefined;
                    }
                    if(typeof str==='string') {
                        const s=str.trim();
                        if (s.length>0) {
                           return deserializeResolver(s,bound,cb);
                        }
                    }
                    
                    throw new Error ("incorrect arguments passed to deserialize");
                    
                }
                
                deserialize['['] = function (str,objRestore,index,child,bound) {
                    const arr = JSON.parse(str);
                    const subtype = arr.shift();
                    const handler = deserialize['['][subtype];
                    if (typeof handler==='function') {
                        return handler(arr,objRestore,index,child,bound);
                    }
                    throw new Error ("invalid subtype ("+subtype+") in deserialize['[']()");
                };
                deserialize['['].Array=function(ser_array,objRestore,index,child) {
                    const freshen = !!child;
                    if (!freshen) {
                       child = new Array(ser_array.length);
                    }
                    ser_array.forEach(function(ser,ix){
                        child[ix] = objRestore(ser,index,child,ix,child[ix]);
                    });
                    return child;
                };
                deserialize['['].bigint=function(arr,objRestore){
                    return typeof BigInt==='function' ? BigInt(arr[0]) : Number.parseInt(arr[0])||0;
                };
                deserialize['['].symbol=function(arr,objRestore){
                    return Symbol(arr[0]);
                };
                deserialize['['].Date=function(arr,objRestore) {
                    return new Date(arr[0]);
                };
                deserialize['['].RegExp=function(arr,objRestore) {
                    return new RegExp(arr[0],arr[1]);
                };
                deserialize['['].HTMLScriptElement=function(arr,objRestore) {
                    const amd  = ml.i.AMDLoaderLib;
                    const [src,code,err] = arr; 
                    const source  = code && code.length ? code : (err?'/*'+err+'*/\n':'/*no source*/\n') ;
                    const args    = amd ? ['ml',             'define',           'require'] : ['ml'   ];
                    const argVals = amd ? [ ml,           amd.define,         amd.require ] : [ ml    ];
                    const module     = amd ? { path:src, ml:ml, define:amd.define, require:amd.require, exports:{} }  : { path:src,  ml:ml, exports:{} };
                    module.self = module;
                        
                    if (typeof window ==='object' && window.document && typeof window.document.createElement === 'function') {
                        const script = window.document.createElement("script");
                        script.textContent === code;
                        module.script = script;
                        const head = window.document.getElementsByTagName('head')[0];
                        let notified = false,onready;
                        module.ready = false;
                        module.on(function(e,fn){
                            if (e==='load'&& typeof fn==='function' && !notified && module.ready) {
                                notified=true;
                                setImmediate(fn,module);
                            } else {
                                onready=fn;
                            }
                        });
                        
                        script.onload = function () {
                            const mod = src && src.length && ml.h [ src ];
                            if (mod && mod.e) {
                                Object.keys(mod.e).forEach(function(k){
                                    module.exports[k] = mod.e[k];
                                });
                                head.removeChild(script);
                            }
                            module.ready = true;
                            if (typeof onready==='function') {
                                notified = true;
                                onready(module);
                                onready=undefined;
                            }
                        }
                        head.appendChild(script);
                        return module;
                    } else { 
                        // fall back for service worker  create function inside sandboxed module
                        const fn = new Function(args,'/*script:'+(src?src:'(inlined)')+'*/\n'+source);
                        fn.apply(module,ml,argVals);
                        const mod = ml.h [ src ];
                        Object.keys(mod.e).forEach(function(k){
                            module.export[k] = mod.e[k];
                        });
                        module.ready = true;
                        let notified = false;
                        module.on(function(e,fn){
                            if (e==='load'&& typeof fn==='function' && !notified) {
                                notified=true;
                                setImmediate(fn,module);
                            }
                        });
                        return module;
                    }
                    
                };
                deserialize['['].function = function (arr,objRestore,index,child,bound) {
                    
                    const [ nm,args,sourceTrimmed,vars_ser ] = arr;
                    const freshen = !!child;
                    if (!freshen) {
                       child = new Function(args,sourceTrimmed).bind(parent);
                       if (bound) {
                           child = child.bind(bound);
                       }
                       Object.defineProperty(child,'name',{value:nm,configurable:true,enumerable:false,writable:true});
                    }
                    
                    const temp=JSON.parse(vars_ser),
                          keys=Object.keys(temp);
                          
                    keys.forEach(function(key){
                         child[key] = objRestore(temp[key],index,child,key,child[key]); 
                    });
                     
                    return child;
               };
                deserialize['['].ArrayBuffer=function(arr,objRestore) {
                    return new TextEncoder().encode(arr[0]).buffer;
                };
                arrayTypes.forEach(function(arrayClass,ix){
                    const ArrayConstructor = arrayConstructors[ix] || Uint8Array;
                    deserialize['['][arrayClass]=function(arr,objRestore,index) {
                        return new ArrayConstructor(new TextEncoder().encode(arr[0]).buffer) ;
                    };    
                });
                deserialize['{']=function(str,objRestore,index,child) {
                    const freshen = !!child;
                    if (!freshen) {
                         child={};
                    }
                    const temp=JSON.parse(str),
                          keys=Object.keys(temp);
                    keys.map(function(key){
                        child[key] = objRestore(temp[key],index,child,key,child[key]);
                    });
                    return child;
                };

                serializerLib.cached =  {
                    serialize      : serialize,
                    deserialize    : deserialize,
                    sha1Hex        : sha1Hex,
                    sha1           : sha1,
                    setImmediate   : setImmediate,
                    clearImmediate : clearImmediate
                };
                
                return serializerLib.cached;
        
            });
        }
        
         

});

