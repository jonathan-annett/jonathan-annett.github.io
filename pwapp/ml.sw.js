/* global self,importScripts,BroadcastChannel */
function ml(x,L, o, a, d, s){
    let z,c,t,T=(G)=>typeof G;
    if (!ml.h){
        //create history db if none exists
        
        ml.h={};ml.H=[];ml.d={};ml.f={};ml.l=['ml.sw.js'];
        
        
        let
        l=location,O=l.origin,
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
            //c.c returns true if url is under current domain.
            c:(u)=>u.startsWith(O),
            R:'replace',
            f:'forEach',
           // w:'serviceWorker',
           // n:'navigator',
           // d:"document",
            
            //c.u: convert string to array, remove comments, and whitespace
            u:(u)=>u=typeof u===t[2]?u[c.R](/(^(?:[\t ]*(?:\r?\n|\r))+)|(\ |\t)/gm,'')
                                      [c.R](/(^(\/\*+[\s\S]*?\*\/)|(\/\*+.*\*\/)|\/\/.*?[\r\n])[\r\n]*/g,'')
                                      .trim().split('\n').map((x)=>x.trim()).filter((x)=>x.length):u, 
            
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
            // r = undefined
            2:(L,o,a,d,e,r)=>{
                    e = a[L] && a[L].name; e=typeof e+typeof o[e]===t[2]+t[3]? Object.defineProperty(o, e, {
                    value: a[L].apply(this, d[L].map(c.x)),
                    enumerable: !0,
                    configurable: !0
                }) : r;
            },
            
            // ml(3)->c[1] = resolve to whatever self is (Window,ServiceWorkerGlobalScope or Object if self was not assigned)
            3:()=>"ServiceWorkerGlobalScope",
            
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
            I:(M,I)=>(M=ml.d[x])&&(I=ml.h[ M.h ])&&I.e[x],
            
            //c.k = Object.keys();
            k:(o)=>Object.keys(o)
            
    
                    
            
              
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
    z=typeof c[x]===t[1]?c[x](L,o,a,d,s):c;
    
    if (z!==c)return z;
        
    z = {
       F:ml.fetch||false,// F:t[1] = use fetch, F:false,  = don't use fetch
       
       //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
       //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
       0:()=>z.l(c.u(o)),
       
       //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
       l:(u,L)=>{
             u=u.map(ml.g||z.u).filter(z.y);
            
             if (!u.length) {
                 L=c[4]();
                 ml.H[c.f](function(U){
                    ml.h[U] && c.k(ml.h[U].e)[c.f]((m)=>{
                       if (!ml.h[U].e[m]) ml.h[U].e[m]=L[m]; 
                    }) 
                 });
             }
             return u.length?setTimeout(z.l, u.length+1, u):a();
       },

       //z.u = map iterator z.l (note - R argument is a cheat - used as local var, originally index for interator)
       u:(x,R,U,N)=>{
            
             R=c.r(x);
             if (!R) {
                 if (L[x]) return !1;
                 
                 return x;
             } else {
                 // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                if ((N=R[2])&&N!==(d||c[3]())) return !1; 
             }
             
             N=R[1];
             U=c.B(R[3]);
             ml.l.push(N+'='+U);
             if(c.c(U)){ml.d[N]={h:U};ml.H.push(U);}
             try {
               importScripts(U);
             } catch (e){
               c.l(e.message,'while loading',U,'in',ml.l);  
             }
             ml.h[U]=ml.h[U]||{e:{}};
             ml.h[U].e[N]=c[4]()[N]||false;
             ml.l.pop();
             return N;
       },
       
       
       //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
       y:(x)=>!!x,
         
       //z.U() = history as an array of urls
       U:()=>c.k(ml.h),

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
