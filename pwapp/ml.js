/*global self*/

// note some functions in this use some arguments as stack based locals 
// for example (a,b,c,d,e) => {...}  a,b,c are args d,e are local vars.
// in most cases this is documented. 
// also, rather than longhand code "undefined", a shorthand for a known undefined value, based on context
// may sometimes be used. 
// these optimization are to faciliate further reducing code size on minification.
// also, the "c" object is created on first call, and stored externaly as ml.c this is done for several reasons.
// firstly, as it's mostly functions and constants, there is no need to create it each time, so it is effectively an external module
// which is self extracted on first run. 
// secondly it's to allow configuation and method swizzling to allow plugins to modify the behaviour of ml
function ml(x,L,o,a,d,s){
    let c,t,X,T=(G)=>typeof G,l=location,O=l.origin,A=[].slice.call(arguments),W=A.map(T);

    if (!ml.h){
        //create history db if none exists
        ml.h={};ml.H=[];ml.d={};ml.f={};
        let
        C=console;//shortcut for console
        // "t" contains an array of types - object,function,string,undefined
        // used for comparisions later
        ml.T=t=[C,ml,'',t].map(T);
        // "c" contains initial parameter parser(wraps for argument calls eg ml(1), ml(2), and 
        // any constants/worker functions they need. 
        // note that t doubles as a proxy for "undefined" in the type array "t" above 
        ml.c=c={// holder for "constants", also a few holds outer scope commands, common functions
            //c.r = regex:splits "mod | /url" --> [ "mod | url" ,"mod","", /url"] or null
            //c.r = regex:splits "mod@Window | /url" --> [ "mod | url" ,"mod","Window", /url"] or null
            r:(u)=>/([A-z0-9\_\$]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(u),
            //c.b=document base
            b:O+/([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],
            //c.ri() = a random id generator
            ri:()=>Math.random().toString(36).substr(-8),
            //c.c returns true if url is under current domain.
            c:(u)=>u.startsWith(O),
            //c.R=shortcut to replace keyword
            R:'replace',
            f:'forEach',
            w:'serviceWorker',
            n:'navigator',
            d:"document",
            //c.B=rebase  paths that start with ./subpath/file.js or subpath/file.js
            B:(u,r)=>(r=/^\//)&&/^(http(s?)\:\/\/)/.test(u)?u:r.test(u)?u[c.R](r,O+'/'):c.b+u[c.R](/^(\.\/)/,''),
    
            //c.u: convert string to array, remove comments, and whitespace
            u:(u)=>u=T(u)===t[2]?u[c.R](/(^(?:[\t ]*(?:\r?\n|\r))+)|(\ |\t)/gm,'')
                                      [c.R](/(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/))[\r\n]*/g,'')
                                      .trim().split('\n').map((x)=>x.trim()).filter((x)=>x.length):u, 
                
                
            //ml(0)->c[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
            //     (o is the result of c[1]() which was invoked earlier in outer script scope, when it called ml(1) 
            
            //c[0]() = load list of urls, then call outer (a) function (the module ready completion callback)

            0:(L,o,a,d)=>{
               d = c.u(d||o);
               d=d.map(ml.g).filter(c.y);
               if( d.length ) return c.i(c[0],L,o,a,d);
               
               a();
            },
            7: (t,e,n,i) => {
                e = new Error();
                if (!e.stack) try {
                    throw e
                } catch (t) {
                    e = t
                }
                if (e.stack) {
                    t = e.stack.split("\n");
                    n, i = !1;
                    return t.some(function(t) {
                        if (i) {
                            e = t.split(":/"), i = (1 === e.length ? t.split(":")[0] : e[0] + ":/" + e.slice(1).join(":/").split(":")[0]).split("at ");
                            if (i.length > 1) {
                                if ("<" !== (n = i[1])[0].replace(/^.*https:\/\//,'https://')) return !0;
                                n = void 0
                            }
                            return !1
                        }
                        return i = t.indexOf("ml") > 0, !1
                    }), n
                }
                if (t && "object" == typeof document) {
                    e = document.querySelector('script[src="' + t + '"]');
                    return e && e.src && e.src.length && e.src;
                }
            },
            // ml(1)->c[1] = resolve to self or an empty object - becomes exports section
            
            1:()=>c.S||{},
            
            
            // ml(2)-->c[2](L,o,a,d,e,r) 
            
            // L = "Window", "ServiceWorkerGlobalScope" (result of ml(1)--> c[1]
            // o = exports (ie self ie window)
            // a = dictionary of dependants per window type
            // d = array of loaded dependants 
            // e = variable - used for name of export
            // r = undefined
            2:(L,o,a,d,e,r)=>{
                    e = a[L] && a[L].name; //evaluate name of import
                    r = a[L].apply(this, d[L].map(c.x));
                    if(typeof e+typeof o[e]===t[2]+t[3]&&e.length) {//valdidate named import is a function
                        c.m(o,e,r); // do the import into o[e]
                    } 
            },
            //c.P property descriptor
            P:(v)=>1&&{value: v,enumerable: !0,configurable: !0},
            //c.s set key value in obj, returning value
            s:(o,k,v)=>{Object.defineProperty(o,k,c.P(v));return v;},
            m:(o,e,v)=>{
                c.s(o,e,v); // do the import into o[e]
                if (!ml.d[e]) {
                    ml.d[e]={h:c.ri()+".js",sc:c[7]()};
                    ml.h[ ml.d[e].h ]={e:{}};
                }
                c.s(ml.h[ ml.d[e].h ].e,e,v);
            },
            
            // ml(3)->c[1] = resolve to whatever self is (Window,ServiceWorkerGlobalScope or Object if self was not assigned)
            
            3:()=>c.C,//legacy for old module format
            //c.C context
            C:"Window",//
            
            // ml(1)->c[1] = resolve to self or undefined
            4:()=>c.S,// legacy for old module format
            // c.S === self, assuming self is an object, otherwise undefined
            S:typeof self === t[0] && self,
            
            //c.x = map iterator to execure every function in an array of functions
            //      (used to resolve each loaded module)
            x:(f)=>f(),
            //c.l = console.log shortcut
            l:C.log.bind(C),
            //c.L = loader hoist function (called when first argument to ml is a string)
            L:(O,A,D)=>{
                x=c.u(x);// arrayify string dependants
                O=L||{};
                A={};A[c.C] = function (){};// invoke callback with loaded modules
                D={};D[c.C] = x.map((s,i,a,R)=>{
                    R=c.r(s);
                    return R ? ()=>{ o(R[1],ml.i[ R[1] ]);} : ()=>{};
                });// import named module
                return ml(0,O,x,()=>c[2](c.C,O,A,D));
            },
            //c.I = import query
            I:(M,I)=>(M=ml.d[x])&&(I=ml.h[ M.h ])&&I.e[x],
            k:(o)=>Object.keys(o),
            //quasi setImmediate (can be swapped out by replacing ml.c.i)
            i:(f,a,b,c,d)=>setTimeout(f,0,a,b,c,d),
            A:A,// save initial args into ml.c.A,
            
            //c.H(u) === url not loaded
            H:(u) => ml.H.indexOf(u)<0,
            
            
            //c.y = filter to remove elements that are truthy. (c.m returns false when a module is loaded, so truthy = name of still to be loaded module)
            y:(x)=>!!x,
            
            V:(u,v)=>c.F?u+"?v="+v:u,// if using fetch,  append v=version
            v:(u,v,s)=>(ml.h[u]={v:v,s:s,e:{}}),
            
            //c.p = prefetch script to bust cache, and then load call l() which assigns url to src attribute of script element
            p:(u,l,s/*vars->*/,r,L,V,R)=>{//u = url, l() = load script, r=randomId, C= load script with version, R=call V with r
                r=c.ri();//prepare a random version number (in case we need it)
                L=(v)=>l(c.V(u,v));                    // load script with version
                V=(v)=>L(c.v(u,v,s));                  // save version v in history, load script with version
                R=()=>V(r);                            // save random verison in history, load scipt with random version
                return (ml.h [ u ] ?                   // does url exist in history? 
                         !1// V(ml.h[u].v)             // yes = load script using version from history
                         : R()                         // Gretchen didn't make fetch happen. so random.
                       );
            },
            
            //c.T = create script in same window.
            T:(w,s,C)=>c.T2(w[c.d],s,C),
            
            //c.T2 = create and append empty script element
            T2:(d,S,C)=>{s = c.E(d,S);s.type = "text/java"+S;C(c.T3(d,s));},
            
            //c.E = create script element
            E:(d,S)=>d.createElement(S),
            
            //c.T3 = append element x to document d
            T3:(d,x)=>d.body.appendChild(x),
            
            
            
            //c.T4 = create hidden iframe
            T4:(d,i,l)=>{ i=c.E(d,"iframe");
                       i.style.display="none";
                       i.src="ml.html";
                       i.onload=l;
                       return c.T3(d,i);},
            
            //c.T5 = create empty script in it's own empty iframe
            T5:(w,s,C,D)=>{D=c.T4(w[c.d],()=>c.T2(D.contentWindow[c.d],s,C));},
              
            
            8:(m,c)=>{
                
            },
            9:(L,C)=>L&& c.w in self[c.n] && self[c.n][c.w].register('./ml.sw.js?ml=' + encodeURIComponent(L)).then(C?C:()=>{}),
          
    
        };
        //ml.g = map iterator for c[0]
        ml.g = (x,R,U,N)=>{
                  R=c.r(x);// regex x--> [x,module,(context),url]
                  if (!R) {
                     if (L[x]) {
                        return !1;
                     }
                     return x;
                  } else {
                      // for module@Window|filename.js format - return if wrong name:  c.C is "Window","ServiceWorkerGlobalScope"
                     if ((N=R[2])&&N!==(d||c.C)) return !1; 
                  }
                  N=R[1];                     // get moduleName from regex results
                  U=c.B(R[3]);                // get URL from regex results
                  if (c.H(U) && !ml.d[N]) {               // mutex check (we only want 1 copy of each script)
                      ml.H.push(U);
                      if(c.c(U))ml.d[N]={h:U};    //
                      c.T(window,"script",(s)=>{  
                         c.p(U,s.setAttribute.bind(s,"src"),s); 
                      });
                  }
                  return N;                   //
               };
        
        ml.i=new Proxy({},{
            get:(t,p)=>c.I(x=p),
            ownKeys:()=>c.k(ml.d),
            getOwnPropertyDescriptor:(t,p)=>!!ml.d[p]&&c.P(c.I(p)),
            has:(t,p)=>!!ml.d[p]
        });
    } else {
        ml.c.A=ml.c.A||A;
    }
    
    c=ml.c;
    t=ml.T;
    // for ml("string") ie first arg is string, second arg is not a function, 
    
    // if first arg is array/string second is function, no third ie ml(['blah|blah.js'],function(){...}   ml("blah|blah.js",function(){...}   
    if (A.length===2&&(Array.isArray(x)||W[0]===t[2])&&W[1]===t[1]){
       a=L
       o=x;
       L=c.S;
       X=x=0;
    } else {
        X=T(x)===t[2]&&T(L)!==t[1]?/^[a-zA-Z0-9\-\_\$]*$/.test(x)?'I':'L':x;//X =: L= x is filename, I= x is keyword, otherwise x
    }
    //for inner module hoist, we can drop the need for ml(3) and ml(4) now, since ml.js became ml.sw.js so we don't need to deduce context anymore
    if (x===2&&!(L===c.C&&o===c.S)) {
        s=a;
        d=o;
        a=L;
        o=c.S;
        L=c.C;
    }
    /*
    x     L          o     a          d      s     x     L     o     a        d     s
    0,    self,      deps, factory
    deps, factory                              --->0,    self, deps, factory
    2,    "window"   self, deps,     loaded,       
    deps, self,      cb                         
    */
    return typeof c[X]===t[1] && c[X](L,o,a,d,s) ;
}


// async load 1-callback per module to pull in tools that bootstrap the amd loader
ml(`
setImmediateLib | ml.setImmediate.js
amdLib          | ml.amd.js
`,window,function (mod,lib){ 
    switch(mod) {
        case "amdLib":
            window.define=lib.define;
            window.require=lib.require;
            console.log(lib.import_ml (window,location.origin,true));
            break;
        case "setImmediateLib":lib(function(i){
            ml.c.i = i;
        });
    }
});

