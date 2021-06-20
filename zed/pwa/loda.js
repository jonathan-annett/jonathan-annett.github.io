/*global self */
/*global self,localforage*/

const multiLoad= function (B, O0, T) {
    let boot = function(d) {
        d = d.filter(function(x) {
            return !B[x];
        });
        if (d.length) {
            return setTimeout(boot, 10, d);
        }
        T();
    };
    boot(O0);
},__ml2=function (L, o, a, d) {
    let u, n = a[L] && a[L].name, x = n && o[n] === u ? Object.defineProperty(o, n, {
        value: a[L].apply(this, d[L].map(function(f) {
            return f();
        })),
        enumerable: !0,
        configurable: !0
    }) : u;
},__ml3=function  () {
   return typeof self === "object" && self.constructor.name || "x";
},__ml1=function  () {
   return typeof self === "object" && self||{};
},__ml4=function  () {
   return typeof self === "object" && self;
};


multiLoad(__ml1(),['wToolsLib'],function(){__ml2(__ml3(),__ml4(),

    {

        Window: function wTools(setKey_, getKey, wToolsLib) {


        },

        ServiceWorkerGlobalScope: function wTools(setKey_, getKey) {
            const lib = {}



            return lib;
        },

    }, {
        Window: [

        function() {
            return 0;
        },

        function() {
            return 0;
        },

        function() {
            return self.wToolsLib;
        },

        function() {
            return 0;
        }

        ],
        ServiceWorkerGlobalScope: [

        function() {
            return 0;
        },

        function() {
            return 0;
        },

        function() {
            return 0;
        }

        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/


});




function ml(x,L,o,a,d,s){switch(x){case 0:return function(L,o,a,d){let e=function(t){if((t=t.map(function(x,e){let l,o,A,D;return l=/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(x),o=e,A="script",D=this.document,l?((o=D.createElement(A)).type="text/java"+A,D.body.appendChild(o),d&&d(o),o.setAttribute("src",l[2]),l[1]):!L[x]&&x}).filter(function(x){return!!x})).length)return setTimeout(e,10*t.length,t);a()};e(o)}(L,o,a,d);case 1:return"object"==typeof self&&self||{};case 2:return function(L,o,a,d){let e,t=a[L]&&a[L].name;t&&o[t]===e&&Object.defineProperty(o,t,{value:a[L].apply(this,d[L].map(function(e){return e()})),enumerable:!0,configurable:!0})}(L,o,a,d);case 3:return"object"==typeof self&&self.constructor.name||"x";case 4:return"object"==typeof self&&self;case 5:return L.ml||(L.ml=ml.bind(L)),ml.call(L,0,L,o,a,d,s);case 6:return ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o]}]})},d)}}

function ml(x, L, o, a, d, s) {
    switch (x) {
        case 0:
            return function(L, o, a, d) {
                let e = function(t) {
                    if ((t = t.map(function(x, e) {let l, o, A, D;
                        return l = /([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(x), o = e, A = "script", D = this.document, l ? ((o = D.createElement(A)).type = "text/java" + A, D.body.appendChild(o), d && d(o), o.setAttribute("src", l[2]), l[1]) : !L[x] && x
                        
                    }).filter(function(x) {
                        return !!x
                    })).length) return setTimeout(e, 10 * t.length, t);
                    a()
                };
                e(o)
            }(L, o, a, d);
        case 1:
            return "object" == typeof self && self || {};
        case 2:
            return function(L, o, a, d) {
                let e, t = a[L] && a[L].name;
                t && o[t] === e && Object.defineProperty(o, t, {
                    value: a[L].apply(this, d[L].map(function(e) {
                        return e()
                    })),
                    enumerable: !0,
                    configurable: !0
                })
            }(L, o, a, d);
        case 3:
            return "object" == typeof self && self.constructor.name || "x";
        case 4:
            return "object" == typeof self && self;
        case 5:
            return L.ml || (L.ml = ml.bind(L)), ml.call(L, 0, L, o, a, d, s);
        case 6:
            return ml.call(L, 5, L, [o + "|" + a], function() {
                ml(2, "x", L, {
                    x: s
                }, {
                    x: [function() {
                        return L[o]
                    }]
                })
            }, d)
    }
}
// src
function ml(x,L, o, a, d, s){
    switch (x) {
        case 0: 
            return (function(L,o,a,d) {
                        let strap = function(m) {
                            m = m.map(function(x,i) {
                                return (function(l,o,A,D) {
                                    if (!l) return L[x]?false:x;
                                    o = D.createElement(A);
                                    o.type = "text/java"+A; 
                                    D.body.appendChild(o);
                                    if(d)d(o);
                                    o.setAttribute("src", l[2]);
                                    return l[1];
                                 })(/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(x),i,"script",this.document);
                            }).filter(function(x){return !!x});
                            if (m.length) {
                                return setTimeout(strap, m.length*10, m);
                            }
                            a();
                        };
                        strap(o);
                    })(L,o,a,d);
        case 1: return typeof self === "object" && self||{};
        case 2: return (function(L,o,a,d) {
                            let u, n = a[L] && a[L].name, x = n && o[n] === u ? Object.defineProperty(o, n, {
                                value: a[L].apply(this, d[L].map(function(f) {
                                    return f();
                                })),
                                enumerable: !0,
                                configurable: !0
                            }) : u;
                        })(L,o,a,d);
        case 3: return typeof self === "object" && self.constructor.name || "x";
        case 4: return typeof self === "object" && self;
        case 5: 
            if (!L.ml) L.ml=ml.bind(L);
            return ml.call(L,0,L,o,a,d,s);
        case 6:      // L o         a                                                            d 
            return ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o];}]})},d);
    }
}

//ml(6,win,mod,url,cb)
               //L o a   d   s  
function loadMod(w,m,url,evs,cb){
  ml(5,w,[m+"|"+url],function(){ml(2,"x",w,{x:cb},{x:[function(){return w[m];}]})});
}

ml(0,ml(1),['dep3'],function(){ml(2,ml(3),ml(4),

    {

        Window: function myLibName(dep1, dep2, dep3, renamed) {
            
            const lib = {};
            
            dep2(dep1.answer);
            
            console.log(dep3);  // from external file

            renamed(dep1.answer);// calls dep4

            return lib;
        },

        ServiceWorkerGlobalScope: function myLibName(dep1, renamed, dep3) {
            const lib = {}

            renamed(dep1.answer);// calls dep2
            
            console.log(dep3);// from external file

            dep4(dep1.answer); // available globally anyway.



            return lib;
        },

    }, {
        Window: [

            function() {
                return dep1 ;
            },
    
            function() {
                return dep2;
            },
    
            function() {
                return self.dep3;
            },
    
            function() {
                return dep4;
            }

        ],
        ServiceWorkerGlobalScope: [

            function() {
                return dep1() ;
            },
    
            function() {
                return dep2 ;
            },
    
            function() {
                return self.dep3;
            }

        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/


   function dep1 () {
       return { answer : 42};
   }
   
   function dep2 (x) {
       console.log(x);
   }
   
   
   function dep4 (x) {
       dep2(x+1);
   }


});





ml(0,ml(1),[],function(){ml(2,ml(3),ml(4),

    {

        Window: function dep3() {
            
            const lib = {
                
                acme : "widgets"
                
            };
            
            

            return lib;
        },

        ServiceWorkerGlobalScope: function dep3() {
            const lib = "hello sw world";

            return lib;
        },

    }, {
        Window: [

           
        ],
        ServiceWorkerGlobalScope: [


        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/


   function dep1 () {
       return { answer : 42};
   }
   
   function dep2 (x) {
       console.log(x);
   }
   
   
   function dep4 (x) {
       dep2(x+1);
   }


});




ml(0,ml(1),[],function(){ml(2,ml(3),ml(4),

    {

        Window: function dep3() {
            
            const lib = {
                
                acme : "widgets"
                
            };
            
            

            return lib;
        },

        ServiceWorkerGlobalScope: function dep3() {
            const lib = "hello sw world";

            return lib;
        },

    }, {
        Window: [

           
        ],
        ServiceWorkerGlobalScope: [


        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/
 

});



/* global ml,self */
ml(0,ml(1),[],function(){ml(2,ml(3),ml(4),

    {
        Window:                   function libname(lib) {return lib;},
        ServiceWorkerGlobalScope: function libname(lib) {return lib;},
    }, (()=>{  return{
        Window:                   [ () => aLib ()     ],
        ServiceWorkerGlobalScope: [ () => aLib ()     ],
    };
      
      function aLib () {
          const lib = {};
          
          return lib;
      }
      
    })()

    );

});






function ml(x,L, o, a, d, s){
    switch (x) {
        case 0: 
            return (function(L,o,a,d) {
                        let strap = function(m) {
                            m = m.map(function(x,i) {
                                return (function(l,o,D) {
                                    if (!l) return L[x]?false:x;
                                    o = ml(7,D,"script");
                                    if(d)d(o);
                                    ml(8,l[2],o.setAttribute.bind(o,"src",l[2]));
                                    return l[1];
                                 })(/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(x),i,this.document);
                            }).filter(function(x){return !!x});
                            if (m.length) {
                                return setTimeout(strap, m.length*10, m);
                            }
                            a();
                        };
                        strap(o);
                    })(L,o,a,d);
        case 1: return typeof self === "object" && self||{};
        case 2: return (function(L,o,a,d) {
                            let u, n = a[L] && a[L].name, x = n && o[n] === u ? Object.defineProperty(o, n, {
                                value: a[L].apply(this, d[L].map(function(f) {
                                    return f();
                                })),
                                enumerable: !0,
                                configurable: !0
                            }) : u;
                        })(L,o,a,d);
        case 3: return typeof self === "object" && self.constructor.name || "x";
        case 4: return typeof self === "object" && self;
        case 5: if (!L.ml) L.ml=ml.bind(L);return ml.call(L,0,L,o,a,d,s);
        case 6: return ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o];}]})},d);
        case 7: s = L.createElement(o);s.type = "text/java"+o; return L.body.appendChild(s);
        case 8: return typeof fetch===typeof ml?fetch(L+'?c='+Math.random()).then(o):o();
        
    }
}