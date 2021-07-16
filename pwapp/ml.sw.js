/* global self,importScripts,BroadcastChannel */
function ml(x,L, o, a, d, s){
    let z,c,t,T=(G)=>typeof G,l=location,O=l.origin,A=[].slice.call(arguments),W=A.map(T);
    if (!ml.h){
        //create history db if none exists
        
        ml.h={};ml.H=[];ml.d={};ml.f={};ml.l=['ml.sw.js'];
        
        
        let
        
        C=console;
        // "t" contains an array of types - object,function,string,undefined
        // used for comparisions later
        ml.t=t=[C,ml,'',t].map(T);
        // "c" contains initial parameter parser(wraps for argument calls eg ml(1), ml(2), and 
        // any constants/worker functions they need. also contains some code used later by z
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
            
            //c.k = Object.keys();
            k:(o)=>Object.keys(o),
            //quasi setImmediate (can be swapped out by replacing ml.c.i)
            i:(f,a,b)=>setTimeout(f,0,a,b),
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
                    
            
              
        };
       
        
        ml.i=new Proxy({},{
            get:(t,p)=>c.I(x=p),
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
    
    
    // see if we can get away without instantiating z to service this query, if so, do it and set z to something other than c
    z=typeof c[x]===t[1]?c[x](L,o,a,d,s):c;
    
    // if z===c it means we could not service the query, so we need to instantiate z
    // otherwise z is the return value of the query
    if (z!==c)return z;// if z === c it's because c[X] was not a function, so we need to loook further, otherwise exit

    // if first arg is array/string second is function, no third ie ml(['blah|blah.js'],function(){...}   ml("blah|blah.js",function(){...}   
    if (!o&&(Array.isArray(x)||T(x)===t[2])&&T(L)===t[1]){
       a=L
       o=x;
       L=c.S;
       x=0;
    }

    z = {

       //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
       //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
       0:()=>z.l(c.u(o)),
       
       //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
       l:(u,L)=>{
             u=u.map(ml.g||z.u).filter(z.y);
            
             if (!u.length) {
                 L=c.S;
                 ml.H[c.f](function(U){
                    ml.h[U] && c.k(ml.h[U].e)[c.f]((m)=>{
                       if (!ml.h[U].e[m]) ml.h[U].e[m]=L[m]; 
                    }) 
                 });
             }
             return u.length?c.i(z.l,u):a();
       },

       //z.u = map iterator z.l (note - R argument is a cheat - used as local var, originally index for interator)
       u:(x,R,U,N)=>{
            
             R=c.r(x);
             if (!R) {
                 if (L[x]) return !1;
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
       },
       
       
       //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
       y:(x)=>!!x,
         
      

       //z.e = resolve to etag in r.header or d (default)
       e:(r,d)=>r.headers.get("Etag")[c.r](/[\"\/\\\-]*/g,'')||d,

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
                z.I(S,z.m,(e,r,m,d,M,Z)=>{
                    d=e.data;m=ml[z.m+'s'];r=m&&d.m;
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
    return z[x]?z[x](L,o,a,d,s):undefined;
}
ml(9,self);
ml.register=ml.bind(self,8);
