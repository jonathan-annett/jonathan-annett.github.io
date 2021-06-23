 
function examples() { 
 
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



}


//minified-beautified


function browserMinPretty () {
    return ml;
   function ml(x, L, o, a, d, s) {
       ml.h || (ml.h = {}, ml.H = [], ml.d = {}, ml.f = {});
       let z, C = console,
           e = [C, ml, "", z, x].map(e => typeof e),
           l = location,
           O = l.origin,
           t = e[4] === e[2] ? /^[a-zA-Z0-9\-\_\$]*$/.test(x) ? "I" : "L" : x,
           c = {
               r: e => /([A-z]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(e),
               b: O + /([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],
               c: e => e.startsWith(c.b),
               R: "replace",
               B: (e, r) => (r = /^\//) && /^(http(s?)\:\/\/)/.test(e) ? e : r.test(e) ? e[c.R](r, O + "/") : c.b + e[c.R](/^(\.\/)/, ""),
               1: () => c[4]() || {},
               2: (L, o, a, d, t, D) => {
                   D = "defined", t = typeof(t = a[L] && a[L].name) + typeof o[t] === e[2] + e[3] ? c.S(ml.h[ml.d[t].h].e, t, c.S(o, t, a[L].apply(this, d[L].map(c.x)))) && c.l(D + ":", t) || c.l(D + " empty:", t) : c.l("ready:", t), ml.i || (ml.i = new Proxy({}, {
                       get: (e, t) => c.I(x = t),
                       ownKeys: () => c.k(ml.d),
                       getOwnPropertyDescriptor: (e, t) => !!ml.d[t] && c.P(c.I(t)),
                       has: (e, t) => !!ml.d[t]
                   }))
               },
               P: e => ({
                   value: e,
                   enumerable: !0,
                   configurable: !0
               }),
               S: (o, e, t) => (Object.defineProperty(o, e, c.P(t)), t),
               3: () => c[4]().constructor.name || "x",
               4: () => typeof self === e[0] && self,
               x: e => e(),
               l: C.log.bind(C),
               L: (e, R, t, m) => (R = c.r(x), m = R ? c[4]() : !!o, e = m ? o : {}, R = R || [x, "t", 0, x], t = a || R[1], ml(0, e, [t + "@T|" + R[3]], () => ml(2, "T", e, {
                   T: L
               }, {
                   T: [x => (R = e[t], m || delete e[t], (x = t && ml.d[t]) && (ml.h[x.h].e[t] = R), R)]
               }), "T")),
               I: (e, t) => (e = ml.d[x]) && (t = ml.h[e.h]) && t.e[x],
               k: o => Object.keys(o),
               f: "forEach",
               w: "serviceWorker",
               n: "navigator",
               d: "document"
           };
       return (z = typeof c[t] === e[1] ? c[t](L, o, a, d, s) : c) !== c ? z : (z = {
           F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),
           0: () => z.l(o),
           t: e => Math.min(100, ml.t = ml.t ? 2 * ml.t : 1),
           l: e => (e = e.map(z.u).filter(z.y)).length ? setTimeout(z.l, z.t(e.length), e) && c.l("pending...", e) : a(),
           u: (x, R, e, t) => (R = c.r(x)) ? (!(t = R[2]) || t === (d || c[3]())) && (t = R[1], e = c.B(R[3]), c.c(e) && (ml.d[t] = {
               h: e
           }), z.T(window, "script", s => {
               z.p(e, s.setAttribute.bind(s, "src"), s)
           }), t) : !L[x] && x,
           y: x => !!x,
           s: (d, e, C) => {
               (s = z.E(d, e)).type = "text/java" + e, C(z.A(d, s))
           },
           S: (e, s, C, D) => {
               D = z.f(e[c.d], () => z.s(D.contentWindow[c.d], s, C))
           },
           T: (e, s, C) => z.s(e[c.d], s, C),
           E: (d, e) => d.createElement(e),
           A: (d, x) => d.body.appendChild(x),
           f: (d, e, l) => ((e = z.E(d, "iframe")).style.display = "none", e.src = "ml.html", e.onload = l, z.A(d, e)),
           U: () => c.k(ml.h),
           p: (e, l, s, r, L, t, R) => (r = z.r(), L = (t => l(z.V(e, t))), t = (t => L(z.v(e, t, s))), R = (() => t(r)), !ml.h[e] && (ml.H.push(e) && (typeof fetch === z.F ? fetch(e, {
               method: "HEAD"
           }).then(e => t(z.e(e, r))).catch(R) : R()))),
           e: (r, d) => r.headers.get("Etag")[c.R](/[\"\/\\\-]*/g, "") || d,
           r: () => Math.random().toString(36).substr(-8),
           V: (e, t) => z.F ? e + "?v=" + t : e,
           v: (e, t, s) => ml.h[e] = {
               v: t,
               s: s,
               e: {}
           },
           8: (e, c) => {},
           9: L => L && c.w in self[c.n] && self[c.n][c.w].register("./ml.sw.min.js?ml=" + encodeURIComponent(L))
       })[x] && z[x](L, o, a, d, s)
   }
   
   ml(9, self), ml.register = ml.bind(self, 8);
    
}


function browserMin () {
    return ml;
/*
<script>//*/    
    function ml(x,L,o,a,d,s){ml.h||(ml.h={},ml.H=[],ml.d={},ml.f={});let z,C=console,e=[C,ml,"",z,x].map(e=>typeof e),l=location,O=l.origin,t=e[4]===e[2]?/^[a-zA-Z0-9\-\_\$]*$/.test(x)?"I":"L":x,c={r:e=>/([A-z]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(e),b:O+/([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],c:e=>e.startsWith(c.b),R:"replace",B:(e,r)=>(r=/^\//)&&/^(http(s?)\:\/\/)/.test(e)?e:r.test(e)?e[c.R](r,O+"/"):c.b+e[c.R](/^(\.\/)/,""),1:()=>c[4]()||{},2:(L,o,a,d,t,D)=>{D="defined",t=typeof(t=a[L]&&a[L].name)+typeof o[t]===e[2]+e[3]?c.S(ml.h[ml.d[t].h].e,t,c.S(o,t,a[L].apply(this,d[L].map(c.x))))&&c.l(D+":",t)||c.l(D+" empty:",t):c.l("ready:",t),ml.i||(ml.i=new Proxy({},{get:(e,t)=>c.I(x=t),ownKeys:()=>c.k(ml.d),getOwnPropertyDescriptor:(e,t)=>!!ml.d[t]&&c.P(c.I(t)),has:(e,t)=>!!ml.d[t]}))},P:e=>({value:e,enumerable:!0,configurable:!0}),S:(o,e,t)=>(Object.defineProperty(o,e,c.P(t)),t),3:()=>c[4]().constructor.name||"x",4:()=>typeof self===e[0]&&self,x:e=>e(),l:C.log.bind(C),L:(e,R,t,m)=>(R=c.r(x),m=R?c[4]():!!o,e=m?o:{},R=R||[x,"t",0,x],t=a||R[1],ml(0,e,[t+"@T|"+R[3]],()=>ml(2,"T",e,{T:L},{T:[x=>(R=e[t],m||delete e[t],(x=t&&ml.d[t])&&(ml.h[x.h].e[t]=R),R)]}),"T")),I:(e,t)=>(e=ml.d[x])&&(t=ml.h[e.h])&&t.e[x],k:o=>Object.keys(o),f:"forEach",w:"serviceWorker",n:"navigator",d:"document"};return(z=typeof c[t]===e[1]?c[t](L,o,a,d,s):c)!==c?z:(z={F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),0:()=>z.l(o),t:e=>Math.min(100,ml.t=ml.t?2*ml.t:1),l:e=>(e=e.map(z.u).filter(z.y)).length?setTimeout(z.l,z.t(e.length),e)&&c.l("pending...",e):a(),u:(x,R,e,t)=>(R=c.r(x))?(!(t=R[2])||t===(d||c[3]()))&&(t=R[1],e=c.B(R[3]),c.c(e)&&(ml.d[t]={h:e}),z.T(window,"script",s=>{z.p(e,s.setAttribute.bind(s,"src"),s)}),t):!L[x]&&x,y:x=>!!x,s:(d,e,C)=>{(s=z.E(d,e)).type="text/java"+e,C(z.A(d,s))},S:(e,s,C,D)=>{D=z.f(e[c.d],()=>z.s(D.contentWindow[c.d],s,C))},T:(e,s,C)=>z.s(e[c.d],s,C),E:(d,e)=>d.createElement(e),A:(d,x)=>d.body.appendChild(x),f:(d,e,l)=>((e=z.E(d,"iframe")).style.display="none",e.src="ml.html",e.onload=l,z.A(d,e)),U:()=>c.k(ml.h),p:(e,l,s,r,L,t,R)=>(r=z.r(),L=(t=>l(z.V(e,t))),t=(t=>L(z.v(e,t,s))),R=(()=>t(r)),!ml.h[e]&&(ml.H.push(e)&&(typeof fetch===z.F?fetch(e,{method:"HEAD"}).then(e=>t(z.e(e,r))).catch(R):R()))),e:(r,d)=>r.headers.get("Etag")[c.R](/[\"\/\\\-]*/g,"")||d,r:()=>Math.random().toString(36).substr(-8),V:(e,t)=>z.F?e+"?v="+t:e,v:(e,t,s)=>ml.h[e]={v:t,s:s,e:{}},8:(e,c)=>{},9:L=>L&&c.w in self[c.n]&&self[c.n][c.w].register("./ml.sw.min.js?ml="+encodeURIComponent(L))})[x]&&z[x](L,o,a,d,s)}//</script>
    
}

function browserSource () {
    return ml;
    
    // source - browser version
    /*global self*/
   function ml(x,L,o,a,d,s){
       if (!ml.h){ml.h={};ml.H=[];ml.d={};ml.f={};}//create history db if none exists
       let
       C=console,//shortcut for console
       z,
       // "t" contains an array of types - object,function,string,undefined
       // used for comparisions later
       t=[C,ml,'',z,x].map((G)=>typeof G),
       l=location,O=l.origin,
       X=t[4]===t[2]?/^[a-zA-Z0-9\-\_\$]*$/.test(x)?'I':'L':x,//X =: L= x is filename, I= x is keyword, otherwise x
       // "c" contains initial parameter parser(wraps for argument calls eg ml(1), ml(2), and 
       // any constants/worker functions they need. also contains some code used later by z
       // note that z doubles as a proxy for "undefined" in the type array "t" above 
       c = {// holder for "constants", also a few holds outer scope commands, common functions
           //c.r = regex:splits "mod | /url" --> [ "mod | url" ,"mod","", /url"] or null
           //c.r = regex:splits "mod@Window | /url" --> [ "mod | url" ,"mod","Window", /url"] or null
           r:(u)=>/([A-z]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(u),
           //c.b=document base
           b:O+/([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],
           c:(u)=>u.startsWith(c.b),
           //c.R=shortcut to replace keyword
           R:'replace',
           //c.B=rebase  paths that start with ./subpath/file.js or subpath/file.js
           B:(u,r)=>(r=/^\//)&&/^(http(s?)\:\/\/)/.test(u)?u:r.test(u)?u[c.R](r,O+'/'):c.b+u[c.R](/^(\.\/)/,''),
   
           // ml(1)->c[1] = resolve to self or an empty object - becomes exports section
           
           1:()=>c[4]()||{},
           
           
           // ml(2)-->c[2](L,o,a,d,e,r) 
           
           // L = "Window", "ServiceWorkerGlobalScope" (result of ml(1)--> c[1]
           // o = exports (ie self ie window)
           // a = dictionary of dependants per window type
           // d = array of loaded dependants 
           // e = unuused argument doubles as a variable
           // D = constant
           2:(L,o,a,d,e,D)=>{
                   D="defined";//define a constant
                   e= a[L] && a[L].name; //evaluate name of import
                   e=typeof e+typeof o[e]===t[2]+t[3]? (//valdidate nameed import is a function
                      c.S(ml.h[ ml.d[e].h ].e,e, //
                        c.S(o,e,a[L].apply(this, d[L].map(c.x))) // do the import
                       )&&c.l(D+":",e)||c.l(D+" empty:",e) ) : c.l("ready:",e);
                     
                  if (!ml.i){  
                      ml.i=new Proxy({},{
                          get:(t,p)=>c.I(x=p),
                          ownKeys:()=>c.k(ml.d),
                          getOwnPropertyDescriptor:(t,p)=>!!ml.d[p]&&c.P(c.I(p)),
                          has:(t,p)=>!!ml.d[p]
                      });
                  }
               
           },
           //c.P property descriptor
           P:(v)=>1&&{value: v,enumerable: !0,configurable: !0},
           //c.S set key value in obj, returning value
           S:(o,k,v)=>{Object.defineProperty(o,k,c.P(v));return v;},
           // ml(3)->c[1] = resolve to whatever self is (Window,ServiceWorkerGlobalScope or Object if self was not assigned)
           3:()=>c[4]().constructor.name || "x",
           
           // ml(1)->c[1] = resolve to self or undefined
           4:()=>typeof self === t[0] && self,
           
           //c.x = map iterator to execure every function in an array of functions
           //      (used to resolve each loaded module)
           x:(f)=>f(),
           //c.l = console.log shortcut
           l:C.log.bind(C),
           //c.L = loader hoist function (called when first argument to ml is a string)
           L:(S,R,t,w)=>{
               // ml("/path/to/mod.js",function(mod){...}) 
               //   ==>  x="/path/to/mod.js", L=function(mod){ /* do something with mod*/ }
               // ml("/path/to/mod.js",function(mod){...},window,"modName") 
               //   ==>  x="/path/to/mod.js", L=function(mod){ /* do something with mod*/ } o=window,a="modName"
               R=c.r(x);
               w=R?c[4]():!!o;
               S=w?o:{};  // S=dummy self, contains "t" temporarily
                      // R=holder for S.t between deletion and return
               R=R||[x,'t',0,x];// [fullurl,tempname,ignored,url]
               t=a||R[1];
               return ml(
                   0,S,[
                   t+"@T|"+R[3]],
                   ()=>ml(  2,'T',S,
                           {T:L},
                           {T:[(x)=>{ R=S[t];
                                     if (!w) delete S[t];
                                     x=t&&ml.d[t];
                                     if(x)ml.h[ x.h ].e[t]=R;
                                     return R;
                                    }
                              ]}),
                   'T'
               );
           },
           //c.I = import query
           I:(M,I)=>(M=ml.d[x])&&(I=ml.h[ M.h ])&&I.e[x],
           k:(o)=>Object.keys(o),
           f:'forEach',
           w:'serviceWorker',
           n:'navigator',
           d:"document"
       };
       // here X will be 5 if first arg(x) is a string, ie a file name to be loaded. otherwise X will be x
       z=typeof c[X]===t[1]?c[X](L,o,a,d,s):c;// if c[X] resolves to a function, execute it, putting result in z, otherwise set z to c
       
       if (z!==c)return z;// if z === c it's because c[X] was not a function, so we need to loook further, otherwise exit
           
       z = {
          F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),// F:t[1] = use fetch, F:false,  = don't use fetch
 
          //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
          //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
          0:()=>z.l(o),
          
          t:(n)=>Math.min(100,ml.t=(ml.t?ml.t*2:1)),
          //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
          l:(u)=>{
                u = u.map(z.u).filter(z.y);
                return u.length?setTimeout(z.l, z.t(u.length), u)&&c.l("pending...",u):a();
          },
   
          //z.u = map iterator z.l
          u:(x,R,U,N)=>{
                R=c.r(x);
                if (!R) {
                    if (L[x]) return !1;
                    
                    return x;
                    
                    //if(ml.d[x]) return !1;
                    
                    //if(ml.h[x]) return !1;
                    
                    //return x;
                } else {
                    // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                   if ((N=R[2])&&N!==(d||c[3]())) return !1; 
                }
                N=R[1];
                U=c.B(R[3]);
                if(c.c(U))ml.d[N]={h:U};
                z.T(window,"script",(s)=>{
                   z.p(U,s.setAttribute.bind(s,"src"),s);    
                });
                return N;
          },
          
          //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
          y:(x)=>!!x,
            
          //z.s = create and append empty script element
          s:(d,S,C)=>{s = z.E(d,S);s.type = "text/java"+S;C(z.A(d,s));},
          //z.s = create empty script in it's own empty iframe
          S:(w,s,C,D)=>{D=z.f(w[c.d],()=>z.s(D.contentWindow[c.d],s,C));},
          T:(w,s,C)=>z.s(w[c.d],s,C),
          //z.E = create script element
          E:(d,S)=>d.createElement(S),
          //z.A = append element x to document d
          A:(d,x)=>d.body.appendChild(x),
          //z.f = create hidden iframe
          f:(d,i,l)=>{ i=z.E(d,"iframe");
                     i.style.display="none";
                     i.src="ml.html";
                     i.onload=l;
                     return z.A(d,i);},



          //document.getElementById('targetFrame').contentWindow.targetFunction();
          
        

          
                 
          //z.U() = history as an array of urls
          
          U:()=>c.k(ml.h),
          
          
          //z.p = prefetch script to bust cache, and then load call l() which assigns url to src attribute of script element
          p:(u,l,s/*vars->*/,r,L,V,R)=>{//u = url, l() = load script, r=randomId, C= load script with version, R=call V with r
              r=z.r();//prepare a random version number (in case we need it)
              L=(v)=>l(z.V(u,v));                  // load script with version
              V=(v)=>L(z.v(u,v,s));                   // save version v in history, load script with version
              R=()=>V(r);                           // save random verison in history, load scipt with random version
              return (ml.h[u] ?                     // does url exist in history? 
                        !1// V(ml.h[u].v)                  //yes = load script using version from history
                       : ml.H.push(u) && ( typeof fetch===z.F ?    // did Gretchen make fetch happen ? 
                             fetch(u,{method: 'HEAD'}) // yes= fetch header and 
                               .then((h)=>V(z.e(h,r))) // use etag as version, or random if no etag
                               .catch(R)                               // if fetch(HEAD) fails,use random version
                           : R())                     // Gretchen didn't make fetch happen. so random.
                     );
          },
          //z.e = resolve to etag in r.header or d (default)
          e:(r,d)=>r.headers.get("Etag")[c.R](/[\"\/\\\-]*/g,'')||d,
          
          //z.r() = a random id generator
          r:()=>Math.random().toString(36).substr(-8),
           
          
          V:(u,v)=>z.F?u+"?v="+v:u,// if using fetch,  append v=version
          v:(u,v,s)=>(ml.h[u]={v:v,s:s,e:{}}),
          8:(m,c)=>{
              
          },
          9:(L)=>L&& c.w in self[c.n] && self[c.n][c.w].register('./ml.sw.min.js?ml=' + encodeURIComponent(L))
       };
       return z[x]&&z[x](L,o,a,d,s);
   }


}


function serviceWorkerMin () {
    var self,importScripts;
    return ml;
    function ml(x,L,o,a,d,s){ml.h=ml.h||{};let e,t=console,m=[t,ml,"",e,x].map(e=>typeof e),r={1:()=>r[4]()||{},2:(L,o,a,d,e,t)=>{e=typeof(e=a[L]&&a[L].name)+typeof o[e]===m[2]+m[3]?Object.defineProperty(o,e,{value:a[L].apply(this,d[L].map(r.x)),enumerable:!0,configurable:!0}):t},3:()=>r[4]().constructor.name||"x",4:()=>typeof self===m[0]&&self,x:e=>e(),l:t.log.bind(t),L:(e,t,m,n)=>(e=(n=!!o)?o:{},t=r.r(x)||[x,"t",0,x],m=a||t[1],ml(0,e,[m+"@T|"+t[3]],()=>ml(2,"T",e,{T:L},{T:[()=>(t=e[m],n||delete e[m],t)]}),"T")),r:e=>/([A-z]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(e)};return(e=typeof r[x]===m[1]?r[x](L,o,a,d,s):r)!==r?e:(e={F:ml.fetch||!1,0:()=>e.l(o),l:t=>(t=t.map(e.u).filter(e.y)).length?setTimeout(e.l,t.length+1,t):a(),u:(x,e)=>(e=r.r(x))?(!e[2]||e[2]===(d||r[3]()))&&(importScripts(e[3]),e[1]):!L[x]&&x,y:x=>!!x,U:()=>Object.keys(ml.h),e:(e,d)=>e.headers.get("Etag").replace(/[\"\/\\\-]*/g,"")||d,V:(t,m)=>e.F?t+"?v="+m:t,v:(e,t)=>ml.h[e]=t,r:()=>Math.random().toString(36).substr(-8),G:(e,t)=>(ml[e]=t,t=>ml[e](t)),8:(e,t)=>(ml[e]=t,ml.p.splice(0,ml.p.length)),I:(t,m,n)=>t.addEventListener(m,e.G(m,n||(e=>{r.l(m,e.data)}))),9:t=>{ml.p=[],e.I(t,"install",e=>e.waitUntil(new Promise((e,t)=>ml.p.push([e,t])))),e.I(t,"activate"),e.I(t,"fetch",e=>fetch(e.request)),e.I(t,"message"),importScripts(new URL(location).searchParams.get("ml"))}})[x]?e[x](L,o,a,d,s):void 0}ml(9,self);

}


function serviceWorkerMinPretty () {
    var self,importScripts;
    
    return ml;
    function ml(x, L, o, a, d, s) {
        ml.h = ml.h || {};
        let e, t = console,
            m = [t, ml, "", e, x].map(e => typeof e),
            r = {
                1: () => r[4]() || {},
                2: (L, o, a, d, e, t) => {
                    e = typeof(e = a[L] && a[L].name) + typeof o[e] === m[2] + m[3] ? Object.defineProperty(o, e, {
                        value: a[L].apply(this, d[L].map(r.x)),
                        enumerable: !0,
                        configurable: !0
                    }) : t
                },
                3: () => r[4]().constructor.name || "x",
                4: () => typeof self === m[0] && self,
                x: e => e(),
                l: t.log.bind(t),
                L: (e, t, m, n) => (e = (n = !!o) ? o : {}, t = r.r(x) || [x, "t", 0, x], m = a || t[1], ml(0, e, [m + "@T|" + t[3]], () => ml(2, "T", e, {
                    T: L
                }, {
                    T: [() => (t = e[m], n || delete e[m], t)]
                }), "T")),
                r: e => /([A-z]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(e)
            };
        return (e = typeof r[x] === m[1] ? r[x](L, o, a, d, s) : r) !== r ? e : (e = {
            F: ml.fetch || !1,
            0: () => e.l(o),
            l: t => (t = t.map(e.u).filter(e.y)).length ? setTimeout(e.l, t.length + 1, t) : a(),
            u: (x, e) => (e = r.r(x)) ? (!e[2] || e[2] === (d || r[3]())) && (importScripts(e[3]), e[1]) : !L[x] && x,
            y: x => !!x,
            U: () => Object.keys(ml.h),
            e: (e, d) => e.headers.get("Etag").replace(/[\"\/\\\-]*/g, "") || d,
            V: (t, m) => e.F ? t + "?v=" + m : t,
            v: (e, t) => ml.h[e] = t,
            r: () => Math.random().toString(36).substr(-8),
            G: (e, t) => (ml[e] = t, t => ml[e](t)),
            8: (e, t) => (ml[e] = t, ml.p.splice(0, ml.p.length)),
            I: (t, m, n) => t.addEventListener(m, e.G(m, n || (e => {
                r.l(m, e.data)
            }))),
            9: t => {
                ml.p = [], e.I(t, "install", e => e.waitUntil(new Promise((e, t) => ml.p.push([e, t])))), e.I(t, "activate"), e.I(t, "fetch", e => fetch(e.request)), e.I(t, "message"), importScripts(new URL(location).searchParams.get("ml"))
            }
        })[x] ? e[x](L, o, a, d, s) : void 0
    }
    ml(9, self);
}

function serviceWorkerSource () {
    
    var self,importScripts;
    

    
    
// source -sw version 
/* global self,importScripts,BroadcastChannel */
function ml(x,L, o, a, d, s){
    ml.h=ml.h||{};//create history db if none exists
    let
    C=console,
    z,
    // "t" contains an array of types - object,function,string,undefined
    // used for comparisions later
    T=(G)=>typeof G,
    t=[C,ml,'',z,x].map(T),
    // "c" contains initial parameter parser(wraps for argument calls eg ml(1), ml(2), and 
    // any constants/worker functions they need. also contains some code used later by z
    // note that z doubles as a proxy for "undefined" in the type array "t" above 
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
        l:C.log.bind(C),
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
        
        //c.r = regex:splits "mod | /url" --> [ "mod | url" ,"mod","", /url"] or null
        //c.r = regex:splits "mod@Window | /url" --> [ "mod | url" ,"mod","Window", /url"] or null
        r:(u)=>/([A-z]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(u),
        
          
    };
    z=typeof c[x]===t[1]?c[x](L,o,a,d,s):c;
    
    if (z!==c)return z;
        
    z = {
       F:ml.fetch||false,// F:t[1] = use fetch, F:false,  = don't use fetch
       
       //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
       //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
       0:()=>z.l(o),
       
       //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
       l:(u)=>{
             u = u.map(z.u).filter(z.y);
             return u.length?setTimeout(z.l, u.length+1, u):a();
       },

       //z.u = map iterator z.l (note - R argument is a cheat - used as local var, originally index for interator)
       u:(x,R)=>{
             R=c.r(x);
             if (!R) return L[x]?false:x;
             // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
             if (R[2]&&R[2]!==(d||c[3]())) return false; 
             importScripts(R[3]);
             return R[1];
       },
       
       //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
       y:(x)=>!!x,
         
       //z.U() = history as an array of urls
       U:()=>Object.keys(ml.h),

       //z.e = resolve to etag in r.header or d (default)
       e:(r,d)=>r.headers.get("Etag").replace(/[\"\/\\\-]*/g,'')||d,

       //z.V chooses final script url load tag, depending on fetch precache setting
       V:(u,v)=>z.F?u+"?v="+v:u,// if using fetch,  append v=version
       //z.v saves the version tag into version history (also acts as flag for "i've seen this module")
       v:(u,v)=>(ml.h[u]=v), 
       
       //z.r() = a random id generator
       r:()=>Math.random().toString(36).substr(-8),
           
       //wrap event E to call X, whhich is stored as z[E]
       G:(E,X)=>{ml[E]=X;return (e)=>ml[E](e);},
       
         
       
       //install final event handler,and return captured promise for install event
       8:(E,f)=>{
           ml[E]=f;
           return ml.p.splice(0,ml.p.length);
       },
       
       //z.I = install initial event handler wrapper 
       I:(S,E,X)=>S.addEventListener(E,z.G(E,X?X:(e)=>{c.l(E,e.data);})), 
       m:'message',
       9:(S)=>{
                ml.p=[];
                z.I(S,'install',(e)=>self.skipWaiting());
                z.I(S,'activate');
                z.I(S,'fetch',(e)=>fetch(e.request));
                z.I(S,z.m,(e,r,m,c,d,M)=>{
                    d=e.data;m=ml[z.m+'s'];r=m&&d.m;
                    if (r){ 
                        r=m[r];
                        r=T(r)===t[1]&&r(d,((x)=>M=x));
                        if (r){
                          c = new BroadcastChannel(d.r);
                          c.postMessage(M||r);
                          c.close();
                        }
                    }
                });
                importScripts( new URL(location).searchParams.get('ml') );
       }
    };
    return z[x]?z[x](L,o,a,d,s):undefined;
}
ml(9,self);
ml.register=ml.bind(self,8);

      
}


function clearAllTimeouts() {
    const noop=function(){},low = clearAllTimeouts.low||0,high = setTimeout(noop,1e4);
    let kill= high;
    while (kill > low) {
       clearTimeout(kill--);
    }
    clearTimeout(clearAllTimeouts.low=setTimeout(noop,1e6));
}

function clearAllIntervals() {
    const noop=function(){},low = clearAllIntervals.low||0,high = setInterval(noop,1e4);
    let kill= high;
    while (kill > low) {
       clearInterval(kill--);
    }
    clearTimeout(clearAllIntervals.low=setInterval(noop,1e6));
}



/* global ml,self */
ml(0,ml(1),[ /*an array of dependancies*/ 'jQuery','someMod | /path/to/filename.js'  ],function(){ml(2,ml(3),ml(4),

    {   // module construtor definition
        Window:                   function moduleName(lib) {
           
            // this function is invoked with arguments defined in the array below
            // it will be invoked when (and only when) all modules listed above (jQuery && someMod are defined in self.
            // the return from this function will be assigned to "self.moduleName" - derived from the name of this outer  
            // this specific function will only be called if self happens to be a "Window"
            // in partiular example we are simply returning "lib" which was the return value of aLib()
            // it's an example of how to make a truly common module that has no differences in the service worker.
            // you could however add additional methods here , or in the service worker module function below.
            lib.hello();
            return lib;

        },
        
        ServiceWorkerGlobalScope: function moduleName(lib) {lib.hello(); return lib;},
    }, (()=>{  return {
        // module import resolver
        Window:                   [ () => aLib () /*this resolves to "lib" in the  */  ],
        ServiceWorkerGlobalScope: [ () => aLib    /*you can also do ()=>self.xyz to import an otherise declare lib, 
                                                   which you've pulled in at the start of the module  */  ],
                                                   
        // note - these arrays MUST contain functions that return values (not values themselves). if the object you want to
        // return is a function, then it needs to be wrapped in a function - like shown for ServiceWorkerGlobalScope above
        // the relevant array calls each embedded function without arguments, and whatever is returned becomes an argument 
        // to the module constructor.
        
        // also note - there is no semantic connection between the "dependancies" array, the indidvidual arguments passed to the module constructor
        // you can have as many or as few entries in either. 
        // all dependencies is for is to ensure the module define function is not called until those dependancies exist
        // at that point you know that self has those items. you don't NEED to specifically return them as arguments to 
        // the constructor. you may chooseto do this however, to change the name or to augument the import
        // before passing it to the individual module constructor.
    };
      
      function aLib (libFilter) {
          const lib = {};
          lib.hello = function () {
              console.log("yeah gudday world");
          }
          return lib;
      }
      
    })()

    );
    
    
    // you can also delcare "global" functions here. not truly global, 
    // but shared between Window and ServiceWorkerGlobalScope
    // note - they are not really "shared" in the sense that you can't pass object beween the two - they are 
    // the same code, being executed in their own contexts.

});



