/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */(function(define,ml,chrome){//exanple code begins here - ignore the first line of this file



// "native" ml encoded files are encoded into serilized modules where are deserialized to load them

// the file "/pwapp/stub.js" (when loaded in a <script\> tag):
ml(`
    
    neededMod |   /path/needed.js
    x@Window  | https://somecdn/x.min.js
    
`,function(){ml(2,

    {
        Window: function stubLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        },

        ServiceWorkerGlobalScope: function stubLib( lib ) {
            lib = lib ||{};
            // add / override service worker specific methods here
            
            
            return lib;
        } 
    }, {
        Window: [
            ()=> stubLib ()
        ],
        ServiceWorkerGlobalScope: [
            ()=> stubLib ()
        ]
        
    }

    );


    function stubLib () {
        const lib = {};   
        
        
        return lib;
    }

});




function xsEncode(slf,deps,fn) {
    const self_name = slf.constructor.name;
    // deps will be a cleaned up array in the format ["modname|url",...]
    const preload = {};
    deps.forEach(function(line){
        const url        = line.split('|');
        const modname    = url.shift();
        const qualifiers = modname.split('@');
        const id         = qualifiers.shift();
        preload[id]      = url.concat(qualifiers);
    });
    const src = fn.toString();
    let impl_start,impl_end,startup_start,startup_end;
    
    if (locateHeaderSegments()) {
        
        const startup   = src.substring(startup_start,startup_end);
        const implement = src.substring(impl_start,impl_end);
        
        let i = startup_end;
        while (src[++i]!==")");
        while (src[++i]!==";");
        
        const source = [
           'return {',
           '  preload  : ' + JSON.stringify(preload)+',',
           '  startup  : ' + startup+',',
           '  implement: ' + implement,
           '};',
           '',
        ].join('\n') + src.substring(++i,src.lastIndexOf('}'));
        
        
        return JSON.stringify(["function","",[],source,'{}']);
    }
    
    
    function locateHeaderSegments() {
        let b = 0,n = 0, inComment=false,inLineComment=false,inStr=false,inDStr=false,inTick=false;
        let i=0,len=src.length;
        for (i = 0;i < len; i ++) {
            switch(true) {
                
                case inComment : 
                    if (src.substr(i,2)=="*/") {
                      inComment = false;
                      i++;
                    }
                    continue;
                 case inLineComment:
                    if (src[i]==="\n") {
                       inLineComment = false;
                    }
                    continue;
                 case inTick: 
                     if (src[i]==="`") {
                         inTick=false;
                     }
                     continue;
                 case inStr: 
                    if (src[i]==="\\") {
                        i++;
                        continue;
                    }
                    if (src[i]==="'") {
                       inStr = false;
                    }
                    continue;
                 case inDStr: 
                     if (src[i]==="\\") {
                         i++;
                         continue;
                     }
                     if (src[i]==='"') {
                        inDStr = false;
                     }
                     continue;
                 default :
                 
                     if (src.substr(i,2)==="/*") {
                         inComment = true;
                         i++;
                         continue;
                     }
                     if (src.substr(i,2)==="//") {
                         inLineComment = true;
                         i++;
                         continue;
                     }
                     
                     if (src[i]==="'") {
                         inStr = true;
                         continue;
                     }
                     if (src[i]==='"') {
                         inDStr = true;
                         continue;
                     }
                     if (src[i]==='`') {
                         inTick = true;
                         continue;
                     }
                     if (src[i]==="{") {
                         b++;
                         if (b===2 && n===0) {
                             impl_start = i;
                         }
                         if (b===2 && n===1) {
                             startup_start = i;
                         }
                             
                         
                     } else {
                         if (src[i]==="}") {
                           b--;
                           if (b===1) {
                               n++;
                               if (n===1) {
                                   impl_end = i+1;
                               }
                               if (n===2) {
                                   startup_end = i+1;
                                   return true;
                               }
                           }
                         }
                     }
                 
                  
                 
                 continue;
              
                 
            }
        }
    }
}


// is encoded as (ie entire file is third element as a string)
JSON.stringify([
    "HTMLScriptElement",
    "https:/example.com/pwapp/stub.js",// full domain url injected here
`ml(0,ml(1),[
     " neededMod |   /path/needed.js",
     " x@Window  | https://somecdn/x.min.js",
     
 ],function(){ml(2,ml(3),ml(4),
 
     {
         Window: function stubLib( lib ) {
             lib = lib ||{};
             // add / override window specific methods here
             
             return lib;
         },
 
         ServiceWorkerGlobalScope: function stubLib( lib ) {
             lib = lib ||{};
             // add / override service worker specific methods here
             
             
             return lib;
         } 
     }, {
         Window: [
             ()=> stubLib ()
         ],
         ServiceWorkerGlobalScope: [
             ()=> stubLib ()
         ]
         
     }
 
     );
 
 
     function stubLib () {
         const lib = {};   
         
         
         return lib;
     }
 
 });
`
]);
   

// when script is loaded, becomes a call to ml() which in turn calls:
ml.xs("/pwapp/stub.js",function (){
   return {
        preload : {
            "neededMod": [ "https:/example.com/needed.js" ],
            "x"        : [ "https://somecdn/x.min.js", "Window"  ]
        },
        
        
        startup : {
            Window: [
                ()=> stubLib ()
            ],
            ServiceWorkerGlobalScope: [
                ()=> stubLib ()
            ]
            
        },
   
        implement : {
            Window: function stubLib( lib ) {
                lib = lib ||{};
                // add / override window specific methods here
                
                return lib;
            },
    
            ServiceWorkerGlobalScope: function stubLib( lib ) {
                lib = lib ||{};
                // add / override service worker specific methods here
                
                
                return lib;
            } 
        }
        
   };
   function stubLib () {
       const lib = {};
       return lib;
   }
}); 


//which is encoded.stored into the key "https:/example.com/pwapp/stub.js"
JSON.stringify([
    "function","",[],`return {
          preload : {
              "neededMod": [ "https:/example.com/needed.js" ],
              "x"        : [ "https://somecdn/x.min.js", "Window"  ]
          },
          
          
          startup : {
              Window: [
                  ()=> stubLib ()
              ],
              ServiceWorkerGlobalScope: [
                  ()=> stubLib ()
              ]
              
          },
     
          implement : {
              Window: function stubLib( lib ) {
                  lib = lib ||{};
                  // add / override window specific methods here
                  
                  return lib;
              },
      
              ServiceWorkerGlobalScope: function stubLib( lib ) {
                  lib = lib ||{};
                  // add / override service worker specific methods here
                  
                  
                  return lib;
              } 
          }
          
     };
       function stubLib () {
         const lib = {};   
         return lib;
       }`,"{}"]
);


//a file "whatever.js"
   define(function(require, exports, module) {
       return function() {
           return new Promise(function(resolve) {
               chrome.runtime.getBackgroundPage(function(bg) {
                   resolve(bg);
               });
           });
       };
   });

// is encoded as
JSON.stringify([
    "HTMLScriptElement",
    "https:/example.com/pwapp/stub.js",// full domain url injected here
`     define(function(require, exports, module) {
        return function() {
            return new Promise(function(resolve) {
                chrome.runtime.getBackgroundPage(function(bg) {
                    resolve(bg);
                });
            });
        };
    });`
]);
   

   // becomes a call to 
   ml.xs("https:/example.com/whatever.js",function (){
       
      return {
           preload : {
           },
           
           startup : {
               Window: [ ()=> window.require ]
           },
      
           implement : {
               Window: function (require) {
                      const exports = {  };
                      const module  = { exports : exports };
                      module.returned = (function(require, exports, module) {
                           return function() {
                               return new Promise(function(resolve) {
                                   chrome.runtime.getBackgroundPage(function(bg) {
                                       resolve(bg);
                                   });
                               });
                           };
                      })(require,exports,module);
                      return module.returned || module.exports || exports;
                  }
           }
      };
   
   });
   
function xsNewModule_Function(preload,fn) {
  return {
       preload : preload,
       
       startup : {
           Window: [ ()=> window.require ]
       },
  
       implement : {
           Window: function (require) {
               const exports   = {  };
               const module    = { exports : exports };
               module.returned = fn (require,exports,module);
               return module.returned || module.exports || exports;
           }
       }
  };  
}

function xsNewModule_Object(preload,obj) {
  return {
       preload : preload,
       startup : {
           Window: [ ]
       },
       implement : {
           Window: function () {
               return obj;
           }
       }
       
  };  
}
   
function xsDefine(resolver,modName,url,run,/*<--bound  args-->*/id,deps,fn) {
    
    if (typeof id==='function') {
        fn   = id;
        deps = [];
        id   = url;
    } else {
        if (typeof id+typeof deps === 'stringfunction' ) {
            fn   = deps;
            deps = [];
        }
    }
    const preload = {};
    
    deps.forEach(function(id){
        preload[id] = [ resolver(id) ];
    });
    if (run) {
        if (typeof fn==='function') {
            return  ml.xs(id,function(){
                return xsNewModule_Function(preload,fn);
            });
        }
        if (typeof fn==='function') {
            return  ml.xs(id,function(){
                return xsNewModule_Object(preload,fn);
            });
        }
    } else {
        if (typeof fn==='function') {
            ml.xs.setItem__(
               url,
               JSON.stringify(["function","",[],[
                    '  return {',
                    '     preload : '+JSON.stringify(preload),
                    '     startup : {',
                    '         Window: [ ()=> window.require ]',
                    '     },',
                    '     implement : {',
                    '         Window: function '+(modName||'')+'(require) {',
                    '                const exports = {  };',
                    '                const module  = { exports : exports };',
                    '                module.returned = ('+fn.toString()+')(require,exports,module);',
                    '                return module.returned || module.exports || exports;',
                    '            }',
                    '     }',
                    '  };',
                    ].join('\n')
                ])
            );

        }
        
        if (typeof fn==='object') {
            ml.xs.setItem__(
               url,
               JSON.stringify(["function","",[],[
                    '  return {',
                    '     preload : '+JSON.stringify(preload),
                    '     startup : {',
                    '         Window: [ ]',
                    '     },',
                    '     implement : {',
                    '         Window: function '+(modName||'')+'() {',
                    '                return '+JSON.stringify(fn)+';',
                    '         }',
                    '     }',
                    '  };',
                    ].join('\n')
                ])
            );
        }
    }
}

function getScriptPath (hint) {
    if (  typeof document === "object" && 
          typeof document.currentScript === 'object' && 
          document.currentScript && // null detect
          typeof document.currentScript.src==='string' && 
          document.currentScript.src.length > 0) {
        return document.currentScript.src;
    }
    
    
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
            ok = line.indexOf("getScriptPath")>0;
            return false;
        });
        return result;
    }
    
    if ( hint && typeof document === "object") {
       const script = document.querySelector('script[src="'+hint+'"]');
       return script && script.src && script.src.length && script.src;
    }
    
}
   
function setDefine(resolver,modName,url,run){
    window.define = xsDefine.bind(window,resolver,modName,url,run);
}   
   
   //
   
   define("ace/ext/statusbar",["require","exports","module","ace/lib/dom","ace/lib/lang"], function(require, exports, module) {
   "use strict";
   var dom = require("ace/lib/dom");
   var lang = require("ace/lib/lang");
   
   var StatusBar = function(editor, parentNode) {
       this.element = dom.createElement("div");
       this.element.className = "ace_status-indicator";
       this.element.style.cssText = "display: inline-block;";
       parentNode.appendChild(this.element);
   
       var statusUpdate = lang.delayedCall(function(){
           this.updateStatus(editor)
       }.bind(this));
       editor.on("changeStatus", function() {
           statusUpdate.schedule(100);
       });
       editor.on("changeSelection", function() {
           statusUpdate.schedule(100);
       });
   };
   
   (function(){
       this.updateStatus = function(editor) {
           var status = [];
           function add(str, separator) {
               str && status.push(str, separator || "|");
           }
   
           add(editor.keyBinding.getStatusText(editor));
           if (editor.commands.recording)
               add("REC");
   
           var c = editor.selection.lead;
           add(c.row + ":" + c.column, " ");
           if (!editor.selection.isEmpty()) {
               var r = editor.getSelectionRange();
               add("(" + (r.end.row - r.start.row) + ":"  +(r.end.column - r.start.column) + ")");
           }
           status.pop();
           this.element.textContent = status.join("");
       };
   }).call(StatusBar.prototype);
   
   exports.StatusBar = StatusBar;
   
   });



    
   // becomes a call to 
   ml.xs("https:/example.com/ace/ext/statusbar",function (){
      return {
           preload : {
               "ace/lib/dom": ["https:/example.com/ace/lib/dom"],
               "ace/lib/lang": ["https:/example.com/ace/lib/lang"]
           },
           
           
           startup : {
               Window: [ ()=> window.require ]
           },
      
           implement : {
               Window: function (require) {
                   const exports = {  };
                   const module  = { exports : exports };
                   module.returned = (function(require, exports, module) {
          "use strict";
          var dom = require("ace/lib/dom");
          var lang = require("ace/lib/lang");
          
          var StatusBar = function(editor, parentNode) {
              this.element = dom.createElement("div");
              this.element.className = "ace_status-indicator";
              this.element.style.cssText = "display: inline-block;";
              parentNode.appendChild(this.element);
          
              var statusUpdate = lang.delayedCall(function(){
                  this.updateStatus(editor)
              }.bind(this));
              editor.on("changeStatus", function() {
                  statusUpdate.schedule(100);
              });
              editor.on("changeSelection", function() {
                  statusUpdate.schedule(100);
              });
          };
          
          (function(){
              this.updateStatus = function(editor) {
                  var status = [];
                  function add(str, separator) {
                      str && status.push(str, separator || "|");
                  }
          
                  add(editor.keyBinding.getStatusText(editor));
                  if (editor.commands.recording)
                      add("REC");
          
                  var c = editor.selection.lead;
                  add(c.row + ":" + c.column, " ");
                  if (!editor.selection.isEmpty()) {
                      var r = editor.getSelectionRange();
                      add("(" + (r.end.row - r.start.row) + ":"  +(r.end.column - r.start.column) + ")");
                  }
                  status.pop();
                  this.element.textContent = status.join("");
              };
          }).call(StatusBar.prototype);
          
          exports.StatusBar = StatusBar;
          
          })(require,exports,module);
                   return module.returned || module.exports || exports;
               }
           }
           
      };
   
   }); 
   
   
   
    
//example ends here    
})(()=>{},()=>{})