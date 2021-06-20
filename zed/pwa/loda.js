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


function ml(x,L,o,a,d,s){const t={0:(L,o,a,d)=>{let e=function(n){if((n=n.map(function(x,e){var l,D;return l=t[9](x),D=this.document,l?(s=t[7](D,"script"),d&&d(s),t[8](l[2],s.setAttribute.bind(s,"src",l[2])),l[1]):!L[x]&&x;}).filter(function(x){return!!x})).length)return setTimeout(e,10*n.length,n);a()};e(o)},1:()=>t[4]()||{},2:(L,o,a,d)=>{let t,e=a[L]&&a[L].name;e&&o[e]===t&&Object.defineProperty(o,e,{value:a[L].apply(this,d[L].map(function(t){return t()})),enumerable:!0,configurable:!0})},3:()=>t[4]().constructor.name||"x",4:()=>"object"==typeof self&&self,5:()=>(L.ml||(L.ml=ml.bind(L)),ml.call(L,0,L,o,a,d,s)),6:()=>ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o]}]})},d),7:(d,t)=>((s=d.createElement(t)).type="text/java"+t,d.body.appendChild(s)),8:(t,e)=>typeof fetch==typeof ml?fetch(t+"?c="+Math.random()).then(e):e(),9:t=>/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(t)};return t[x](L,o,a,d,s)}

function ml(x, L, o, a, d, s) {
    const t = {
        0: (L, o, a, d) => {
            let e = function(n) {
                if ((n = n.map(function(x, e) {var l, D;
                    return l = t[9](x), D = this.document, l ? (s = t[7](D, "script"), d && d(s), t[8](l[2], s.setAttribute.bind(s, "src", l[2])), l[1]) : !L[x] && x;
                    
                }).filter(function(x) {
                    return !!x
                })).length) return setTimeout(e, 10 * n.length, n);
                a()
            };
            e(o)
        },
        1: () => t[4]() || {},
        2: (L, o, a, d) => {
            let t, e = a[L] && a[L].name;
            e && o[e] === t && Object.defineProperty(o, e, {
                value: a[L].apply(this, d[L].map(function(t) {
                    return t()
                })),
                enumerable: !0,
                configurable: !0
            })
        },
        3: () => t[4]().constructor.name || "x",
        4: () => "object" == typeof self && self,
        5: () => (L.ml || (L.ml = ml.bind(L)), ml.call(L, 0, L, o, a, d, s)),
        6: () => ml.call(L, 5, L, [o + "|" + a], function() {
            ml(2, "x", L, {
                x: s
            }, {
                x: [function() {
                    return L[o]
                }]
            })
        }, d),
        7: (d, t) => ((s = d.createElement(t)).type = "text/java" + t, d.body.appendChild(s)),
        8: (t, e) => typeof fetch == typeof ml ? fetch(t + "?c=" + Math.random()).then(e) : e(),
        9: t => /([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(t)
    };
    return t[x](L, o, a, d, s)
}
function mlx(x,L, o, a, d, s){
    const z = {
        0:(L,o,a,d)=>{
                    let Z = function(m) {
                        m = m.map(function(x,i) {
                            return (function(l,D) {
                                if (!l) return L[x]?false:x;
                                s = z[7](D,"script");
                                if(d)d(s);
                                z[8](l[2],s.setAttribute.bind(s,"src",l[2]));
                                return l[1];
                             })(z[9](x),this.document);
                        }).filter(function(x){return !!x});
                        if (m.length) {
                            return setTimeout(Z, m.length*10, m);
                        }
                        a();
                    };
                    Z(o);
                },
        1:()=>z[4]()||{},
        2:(L,o,a,d)=>{
                    let u, n = a[L] && a[L].name, x = n && o[n] === u ? Object.defineProperty(o, n, {
                        value: a[L].apply(this, d[L].map(function(f) {
                            return f();
                        })),
                        enumerable: !0,
                        configurable: !0
                    }) : u;
                },
        3:()=>z[4]().constructor.name || "x",
        4:()=>typeof self === "object" && self,
        5:()=>{if (!L.ml) L.ml=ml.bind(L);return ml.call(L,0,L,o,a,d,s)},
        6:()=>ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o];}]})},d),
        7:(d,S)=>{s = d.createElement(S);s.type = "text/java"+S; return d.body.appendChild(s)},
        8:(u,c)=>{return typeof fetch===typeof ml?fetch(u+'?c='+Math.random()).then(c):c();},
        9:(u)=>/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(u)
    };
    return z[x](L,o,a,d,s);
}


function ml(x,L,o,a,d,s){let e,t=[{},ml,"",e].map(e=>typeof e),n={1:()=>n[4]()||{},2:(L,o,a,d,e,m)=>{e=typeof(e=a[L]&&a[L].name)+typeof o[e]===t[2]+t[3]?Object.defineProperty(o,e,{value:a[L].apply(this,d[L].map(n.x)),enumerable:!0,configurable:!0}):m},3:()=>n[4]().constructor.name||"x",4:()=>typeof self===t[0]&&self,x:e=>e()};return(e=typeof n[x]===t[1]?n[x](L,o,a,d,s):n)!==n?e:(e={0:()=>e.l(o),l:t=>(t=t.map(e.u).filter(e.y)).length?setTimeout(e.l,10*t.length,t):a(),u:(x,t)=>(t=e.r(x))?(s=e.s(this.document,"script"),d&&d(s),e.p(t[2],s.setAttribute.bind(s,"src",t[2])),t[1]):!L[x]&&x,y:x=>!!x,s:(d,e)=>((s=d.createElement(e)).type="text/java"+e,d.body.appendChild(s)),p:(e,n)=>typeof fetch===t[1]?fetch(e+"?c="+Math.random()).then(n):n(),r:e=>/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(e),5:()=>(L.ml||(L.ml=ml.bind(L)),ml.call(L,0,L,o,a,d,s)),6:()=>ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o]}]})},d)})[x](L,o,a,d,s)}

function ml(x,L, o, a, d, s){
    let
    z,
    t=[{},ml,'',z].map((G)=>typeof G),
    c = {
        // ml(1)->c[1] = resolve to self or an empty object - becomes exports section
        1:()=>c[4]()||{},
        
        // ml(2)-->c[2](L,o,a,d,e,r) 
        
        // L = "Window", "ServiceWorkerGlobalScope" (result of ml(1)--> c[1]
        // o = exports (ie self ie window)
        // a = dictionary of dependants per window type
        // d = array of loaded dependants 
        // e = unuused argument doubles as a variable
        // r = undefined
        2:(L,o,a,d,e,r)=>{
                e = a[L] && a[L].name; e=typeof e+typeof o[e]===t[2]+t[3]? Object.defineProperty(o, e, {
                value: a[L].apply(this, d[L].map(c.x)),
                enumerable: !0,
                configurable: !0
            }) : r;
        },
        
        // ml(3)->c[1] = resolve to whatever self is (Window,ServiceWorkerGlobalScope or Object if self was not assigned)
        3:()=>c[4]().constructor.name || "x",
        
        // ml(1)->c[1] = resolve to self or undefined
        4:()=>typeof self === t[0] && self,
        
        //c.x = map iterator to execure every function in an array of functions
        //      (used to resolve each loaded module)
        x:(f)=>f(),
          
    };
    z=typeof c[x]===t[1]?c[x](L,o,a,d,s):c;
    
    if (z!==c)return z;
        
    z = {
        
       //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
       //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
       0:()=>z.l(o),
       
       //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
       l:(u)=>{
             u = u.map(z.u).filter(z.y);
             return u.length?setTimeout(z.l, u.length*10, u):a();
       },

       //z.u = map iterator z.l (note - R argument is a cheat - used as local var, originally index for interator)
       u:(x,R)=>{
             R=z.r(x);
             if (!R) return L[x]?false:x;
             s = z.s(this.document,"script");
             if(d)d(s);
             z.p(R[2],s.setAttribute.bind(s,"src",R[2]));
             return R[1];
       },
       
       //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
       y:(x)=>!!x,
      
         
       //z.s = create and append empty script element
       s:(d,S)=>{s = d.createElement(S);s.type = "text/java"+S; return d.body.appendChild(s);},
       
       //z.p = prefetch script to bust cache, and then load call c() which assigns url to src attribute of script element
       p:(u,c)=>{return typeof fetch===t[1]?fetch(u+'?c='+Math.random()).then(c):c();},
       
       //z.r = regex:splits "mod | /url" --> [ "mod | url" ,"mod","/url"] or null
       r:(u)=>/([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.]+)/.exec(u),
       
        
       //experimental, probably buggy, extra script loader. needs some work
       5:()=>{if (!L.ml) L.ml=ml.bind(L);return ml.call(L,0,L,o,a,d,s);},
       
       //experimental, probably buggy, extra script loader. needs some work
       6:()=>ml.call(L,5,L,[o+"|"+a],function(){ml(2,"x",L,{x:s},{x:[function(){return L[o];}]});},d)
  
    };
    return z[x](L,o,a,d,s);
    
}
  
