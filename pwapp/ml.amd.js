 
/*


loosely based on (with refactoring and a few  modifications)

https://raw.githubusercontent.com/enimo/amd-loader/master/cdn/amd.loader/0.9.0/amd.loader.js


license:
https://raw.githubusercontent.com/enimo/amd-loader/master/LICENSE

Copyright (c) 2014, Rocky LUO
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:

* Redistributions of source code must retain the above copyright notice, this
  list of conditions and the following disclaimer.

* Redistributions in binary form must reproduce the above copyright notice,
  this list of conditions and the following disclaimer in the documentation
  and/or other materials provided with the distribution.

* Neither the name of amd-loader nor the names of its
  contributors may be used to endorse or promote products derived from
  this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE
FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL
DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR
SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER
CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY,
OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.



*/
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function AMDLoaderLib( lib ) {
            return lib;
        },

        ServiceWorkerGlobalScope: function AMDLoaderLib( lib ) {
            return lib;
        } 
    }, {
        Window: [
            ()=> AMDLoaderLib() 
        ],
        ServiceWorkerGlobalScope: [
            ()=> AMDLoaderLib()
        ],
        
    }

    );


      function AMDLoaderLib (env,resourceLoader,anonymousId) {
            
            if (AMDLoaderLib.cached) return AMDLoaderLib.cached;
            
            const 
            _op        = Object.prototype,
            _os        = _op.toString,
            _oseq      = function(x,o){return !!o&&x===_os.call(o);},
            hasProp    = _op.hasOwnProperty.call.bind(_op.hasOwnProperty),
            _a         = Array.prototype,
            cpArgs     = _a.slice.call.bind (_a.slice),
            isArray    = Array.isArray || _oseq.bind(this,_os.call([])),
            isObject   = function(o){return typeof o==='object'&&o.constructor===Object;},
            isFunction = function(f){return typeof f==='function'};
            
            return (function(
                slf,
                env,
                loadResources,
                _anonymousId,
                api) {
                    
                reqr.sync = rsnc;
                defn.amd = {};
                defn.version = '0.9.0';
                api = {
                    define         : defn,
                    require        : reqr,
                    requireSync    : rsnc,
                    filterLoadDeps : typeof Array.prototype.filter === 'function' ? filterLoadDeps1 : filterLoadDeps2,
                    getModule      : getModule,
                    loadResources  : loadResources,
                    moduleMap      : loadResources.moduleMap,
                    definedStack   : loadResources.definedStack,
                    implement      : implement
                };

                AMDLoaderLib.cached = api;
                return api;
            
                /**
                 * @description Define function implement
                 *
                 * @param {string} id module name
                 * @param {Array} deps dependent modules
                 * @param {Function} factory module function
                 * @access public
                **/
                function defn(id, deps, factory) {
                    if (hasProp(api.moduleMap, id)) {
                        return;
                    }
                    if (isFunction(id) || isArray(id) || isObject(id)) {
                        var modName = '_anonymous_mod_' + _anonymousId++;
                        if (arguments.length === 1) {
                            factory = id;
                            deps = null;
                        } else if (arguments.length === 2) {
                            factory = deps;
                            deps = id;
                        }
                        id = modName;
                    } else if (isFunction(deps) && arguments.length === 2) {
                        factory = deps;
                        deps = null;
                    }
                    api.moduleMap[id] = {
                        id:      id,
                        deps:    deps,
                        factory: factory
                    };
                    api.definedStack.push(id);
                }
            
                /**
                 * @description require function implement
                 *
                 * @param {Array} deps dependent modules
                 * @param {Function} callback callback function
                 * @access public
                 * @return {Void}
                **/
                function reqr (deps, callback) {
                    if (typeof deps === 'string') {
                        deps = [deps];
                    }
                    if (deps.length === 1 && arguments.length === 1) {
                        return reqr.sync(deps.join(''));
                    }
            
                    var loadDeps = api.filterLoadDeps(deps);
                    var depsLen = loadDeps.length;
                    var loadCount = depsLen;
                    if (depsLen) {
                        for (var i = 0; i < depsLen; i++) {
                            var depModName = loadDeps[i];
                            api.loadResources(depModName, modResolved);
                        }
                    }
                    else {
                        allResolved();
                    }
            
                    function modResolved(modName) {
                        var mod = api.getModule(modName) || {};
                        var filterDeps = [];
                        var filterLen = 0;
                        if (hasProp(mod, 'deps') && mod.deps) {
                            filterDeps = api.filterLoadDeps(mod.deps);
                            filterLen = filterDeps.length;
                        }
                        if (filterLen > 0) {
                            loadCount += filterLen - 1;
                            for (var i = 0; i < filterLen; i++) {
                                var dep = filterDeps[i];
                                api.loadResources(dep,modResolved);// arguments.callee);
                            }
                        }
                        else {
                            if (--loadCount <= 0) {
                                allResolved();
                            }
                        }
                    }
            
                    function allResolved() {
                        var exports = [];
                        for (var index = 0; index < depsLen; index++) {
                            exports.push(reqr.sync(deps[index]));
                        }
                        callback && callback.apply(undefined, exports);
                        exports = null;
                    }
                }
            
                /**
                 * @description require function implement
                 * Compatible with CMD synchronization call:
                 * var mod = require.sync("mod");
                 *
                 * @param {string} id dependent module
                 * @access public
                 * @return {Void}
                **/
                function rsnc(id) {
                    var module;
                    var exports;
                    var deps;
                    var args = [];
            
                    if (!hasProp(api.moduleMap, id)) {
                        throw new Error('Required unknown module, id: "' + id + '"');
                    }
            
                    module = api.getModule(id) || {};
                    if (hasProp(module, 'exports')) {
                        return module.exports;
                    }
                    module.exports = exports = {};
                    deps =  module.deps;
                    if (deps) {
                        for (var depsLen = deps.length, i = 0; i < depsLen; i++) {
                            var dep = deps[i];
                            args.push(dep === 'require' ?
                                reqr : (dep === 'module' ?
                                    module : (dep === 'exports' ? exports : api.requireSync(dep))
                                )
                            );
                        }
                    }
                    return api.implement(module,args) ; /*
                    if (isObject(module.factory)) {
                        module.exports = module.factory;
                    }
                    else if (isFunction(module.factory)) {
                        var ret = module.factory.apply(undefined, args);
                        if (ret !== undefined && ret !== exports) {
                            module.exports = ret;
                        }
                    }
                    return module.exports;*/
                }
                
                
                function implement(module,args) {
                    if (isObject(module.factory)) {
                        module.exports = module.factory;
                    }
                    else if (isFunction(module.factory)) {
                        var ret = module.factory.apply(undefined, args);
                        if (ret !== undefined && ret !== exports) {
                            module.exports = ret;
                        }
                    }
                    return module.exports;
                }
            

                /**
                 * @description Filter reserved ids when loading deps resources: module, require, exports
                 * @param {Array} depsMod Depends modules
                 * @return {Array} filterDeps
                **/
                function filterLoadDeps1(depsMod) {
                    return depsMod.filter(function(f){return !/^require|exports|module$/.test(f);});
                }
                
                function filterLoadDeps2(depsMod) {
                    var filterDeps = [];
                    if (depsMod && depsMod.length > 0) {
                        for (var i = 0, len = depsMod.length; i < len; i++) {
                            if (depsMod[i] !== 'require' && depsMod[i] !== 'exports' && depsMod[i] !== 'module') {
                                filterDeps.push(depsMod[i]);
                            }
                        }
                    }
                    return filterDeps;
                }
            
                /**
                 * @description Get the module entity object according to the module id
                 * @param {string} id mod id
                 * @return {Object} module
                **/
                function getModule(id) {
                    if (!id || !hasProp(api.moduleMap, id)) {
                       log('%c_moduleMap does not exist the module: "'+ id +'"','color:red');
                       return false;
                    }
                    var module = api.moduleMap[id];
                    if (hasProp(module, 'alias')) {
                        module = api.moduleMap[module.alias];
                    }
                    return module;
                }

            
                /**
                 * @description Helper function, same as: 1,prop in obj; 2,key_exists(); 3.obj[prop]
                 * @param {Object} obj original object
                 * @param {string} prop property to check
                 * @return {boolean}
                **/

                

                function log() {
                    env.debug && slf && slf.console && slf.console.log.apply(console, cpArgs(arguments));
                }
            

                /*In the testing phase, if requirejs has not been loaded, it can be directly exposed to the window*/
                //if (env.debug && typeof win.define === 'undefined') {
                    //win.define = win._define_;
                   // win.require = win._require_;
                //}
            
                
            
            })
               (
                   slf,
                   env                            || {debug: 1, ts: 0},
                   resourceLoader                 || loadResourcesLib (),
                   anonymousId                    || 0,
                   typeof window==='object'?window:typeof self==='object'?self:{}
               );

               function loadResourcesLib (){
                   return (function (doc) {

                   var
                   _moduleMap    = (loadResources.moduleMap = {}), 
                   _loadedMap    = {}, 
                   _loadingMap   = {}, 
                   _definedStack = (loadResources.definedStack = []),
                   loadScript    = typeof window==='object'?loadScript1:loadScript2;
                   
                   return loadResources;
                   
                   /**
                    * @description loads the js file according to the unique url address
                    * @param {string} url load script uri
                    * @param {Function} callback callback after loaded
                   **/
               
                   
                   function loadScript1(url,callback) {
                       
                       if (hasProp(_loadedMap, url)) {
                           callback && isFunction(callback) && callback();
                       }
                       else if (hasProp(_loadingMap, url)) {
                           _loadingMap[url] = _loadingMap[url] || [];
                           _loadingMap[url].push(callback);
                       }
                       else {
                           _loadingMap[url] = [];
                           var _head = doc.getElementsByTagName('head')[0];
                           var script = doc.createElement('script');
                           script.type = 'text/javascript';
                           script.src = url;
                           script.setAttribute('_md_', '_anymoore_' + url);
                           _head.appendChild(script);
               
                           if (isFunction(callback)) {
                               if (doc.addEventListener) {
                                   script.addEventListener('load', winScriptLoaded, false);
                               }
                               else {
                                   script.onreadystatechange = function() {
                                       if (/loaded|complete/.test(script.readyState)) {
                                           script.onreadystatechange = null;
                                           winScriptLoaded();
                                       }
                                   };
                               }
                           }
                       }
                       
                       function winScriptLoaded() {
                           scriptLoaded(url,callback);
                           script = null;
                       }
               
               
                   }
                   
                   function loadScript2(url,callback) {
                       if (hasProp(_loadedMap, url)) {
                           callback && isFunction(callback) && callback();
                       }
                       else if (hasProp(_loadingMap, url)) {
                           _loadingMap[url] = _loadingMap[url] || [];
                           _loadingMap[url].push(callback);
                       }
                       else {
                           _loadingMap[url] = [];
                           self.importScripts(url);// happens syncronously
                           scriptLoaded(url,callback);
                       }
                   }
                   
                   function scriptLoaded(url,callback) {
                           _loadedMap[url] = true;
                           //if (!env.debug) {
                        //       _head.removeChild(script);
                           //}
               
                           var pathId = url.slice(0, -3);
                           var modName = _definedStack.pop();
                           var mod = _moduleMap[modName];
               
                           if (mod && pathId !== modName) {
                               _moduleMap[pathId] = {alias: modName};
                           }
                           
                           var cbStack = _loadingMap[url] || [];
                           var cb = null;
                           if (cbStack.length > 0) {
                               while ((cb = cbStack.shift())) {
                                   cb && cb();
                               }
                               _loadingMap[url] = null;
                           }
                           callback && callback();
                       }
                       
                       
                   /**
                    * @description According to the given depModName module name, load the corresponding resource, according to whether different loading methods are used in the clouda environment and whether to handle the merge relationship
                    * @param {string} depModName Depends module name
                    * @param {Function} callback callbak after loaded
                   **/
                   function loadResources(depModName, callback) {
                       var url = null;
                       if (depModName) {
                           var realId = realpath(depModName);
                           url = (realId.slice(-3) !== '.js') ? (realId + '.js') : realId;
                       }
                       url && loadScript(url, function() {
                           callback(depModName);
                       });
                   }

                   /**
                    * @description Same as php realpath, generate absolute path
                    * @param {string} path relative path
                    * @return {string} realpath
                   **/
                  
                   function realpath(path) {
                       var arr = [];
                       if (path.indexOf('://') !== -1) {
                           return path;
                       }
                       arr = path.split('/');
                       path = [];
                       for (var k = 0, len = arr.length; k < len; k++) {
                           if (arr[k] === '.') {
                               continue;
                           }
                           if (arr[k] === '..') {
                               if (path.length >= 2) {
                                   path.pop();
                               }
                           }
                           else {
                               if (!path.length || (arr[k] !== '')) {
                                   path.push(arr[k]);
                               }
                           }
                       }
                       path = path.join('/');
                       /* return path.indexOf('/') === 0? path:'/' + path; //Don't add'/' before path temporarily */
                       return path;
                   }
                  
                   })(typeof document==='object'?document:undefined);
               
               }

        }
         


});

