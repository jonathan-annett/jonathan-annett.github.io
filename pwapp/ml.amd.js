/*global self*/

/* global  self */

/*jshint -W054 */

(function(opt,root_script){

  const resolve_fn    = function (fn) {
      return       /^http(s):\/\//.test(fn)? fn :
                  /^\//.test(fn) ? location.origin+fn :
                  location.pathname.replace(/\/[a-zA-Z0-9\-\_\.~\!\*\'\(\)\;\:\@\=\+\$\,\[\]]*$/,'/'+fn.replace(/\.\//,''));

  };
  const compile    = { script   : compile_viascript,
                       debug    : compile_viascript_base64,
                       newfunc  : compile_newfunc}[opt && opt.compile || "newfunc"] || compile_newfunc;
  const loadScriptText = typeof fetch ==='function' ? {
                      xhr    : loadScriptText_xhr,
                      fetch  : loadScriptText_fetch}[opt && opt.load || "fetch"] || loadScriptText_fetch :
                      loadScriptText_xhr;
  
  if (opt&&opt.main&&opt.main_script) {
        root_script     = resolve_fn(opt.main_script);
  }  else {
        root_script     = resolve_fn(root_script);
  }
  
  const ml_stack = [];
  window.ml=function() {
     ml_stack.push([].slice.call(arguments));
  };

  loadScriptText("ml.amd.implementation.js",function(err,text){
      if (text) {
          
          compile(   [ 'bound_this','root_script','compile','loadScriptText','ml_stack','resolve_fn' ], 
            [
              'return amd(root_script,bound_this,compile,loadScriptText,ml_stack,resolve_fn);',
              text
            ].join('\n'),
          [this,root_script,compile,loadScriptText,ml_stack,resolve_fn],
          function(err,prom){
              if (prom) {
                  prom.then(function(ml){
                      if (opt&&opt.main&&opt.main_script) {
                          ml(opt.main+'|'+opt.main_script,function main(){ml(2,
                              {
                                  Window: function pageBoot( lib ) {
                                      return lib;
                                  }
                              }, {
                                  Window: [
                                      ()=> window.ml.i[opt.main]
                                  ]
                              }
                          
                              );
                          });
                      }
                  });
              }
          });
      }
  });

// loads script as a string/arraybuffer
function loadScriptText_xhr(url,cb){
    var notified,xhr = new XMLHttpRequest();
    
    xhr.onerror = function(){
        if (notified) return;
        notified=true;
        cb(new Error("Error - while loading "+url));
    };
    xhr.onabort = function(){
        if (notified) return;
        notified=true;
        cb(new Error("Abort - while loading "+url));
    };
    
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4 && xhr.status >= 200 && xhr.status <300 ) {
            var buffer = xhr.response;
            var text = new TextDecoder().decode(buffer);
            notified=true;
            cb (undefined,text,buffer,xhr.status); 
        } else if (xhr.readyState == 4  ) {
            if (notified) return;
            notified=true;
            cb (new Error("loading "+url+" finsihed with status "+xhr.status));
        }
    };
    
    xhr.open("GET", url);
    xhr.responseType = "arraybuffer";
    xhr.send();
    
}

function loadScriptText_fetch(url,cb){
    
    fetch(url,{mode:'no-cors'}).then(function(response){
        response.arrayBuffer().then(function(buffer){
            return cb (undefined,new TextDecoder().decode(buffer),buffer,response.status);
        }).catch(cb);
    }).catch(cb);
    
}

function compile_viascript_base64(args,src,arg_values,cb){
    
    const script = document.createElement("script");
    script.onload=function(){
        cb(undefined,script.exec.apply(undefined,arg_values) );
    };
    script.src = "data:text/plain;base64," + btoa([
        'document.currentScript.exec=function('+args.join(',')+'){',
        src,
        '};'
    ].join('\n'));
    document.body.appendChild(script);
}
//preloadScriptModuleFunction downloads and "compiles" a script into a loadable module

function compile_viascript(args,src,arg_values,cb){
    
    const script = document.createElement("script");
   // script.onload=function(){
    //    cb(undefined,script.exec.call(undefined,arg_values) );
    //};
    const scriptText = document.createTextNode([
                         'document.currentScript.exec=function('+args.join(',')+'){',
                         src,
                         '};'
                     ].join('\n'));
                     
    script.appendChild(scriptText);
    document.body.appendChild(script);
    cb(undefined,script.exec.apply(undefined,arg_values) );
}

function compile_newfunc(args,src,arg_values,cb){
    try {
        const mod_fn = new Function (args,src);
        cb(undefined,mod_fn.apply(undefined,arg_values))
    } catch (e) {
        cb(e);
    }
}

})(typeof document==='object'&&document.currentScript&&document.currentScript.dataset,
   typeof document==='object'&&document.currentScript&&document.currentScript.src);