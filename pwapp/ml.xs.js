
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),[
    
   
    
    ],function(){ml(2,ml(3),ml(4),

    {
        Window: function mlXStoreLib( ) {
            const lib = {};
            // add / override window specific methods here
            const l=location,O=l.origin;
            const selfname ="Window";
            const ml_d = ml.d,ml_h = ml.h; 
            
            
            
            
            let   L = window; // gets replaces once X-loader is booted
            const c = ml.c;
            //const d=false;
            const z= {
                        F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),// F:t[1] = use fetch, F:false,  = don't use fetch
                 
                        //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
                        //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
                        //0:()=>z.l(o),
                        
                        //t:(n)=>Math.min(100,ml.t=(ml.t?ml.t*2:1)),
                        //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
                    /*  l:(u)=>{
                           u=typeof u===t[2]?u.replace(/(^(?:[\t ]*(?:\r?\n|\r))+)|(\ |\t)/gm,'').split('\n'):u; 
                           u = u.map(ml.g||z.u).filter(z.y);
                           return u.length?setTimeout(z.l, z.t(u.length), u)&&c.l("pending...",u):a();
                        },*/
                 
                        //z.u = map iterator z.l
                        
                        //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
                        //y:(x)=>!!x,
                          
                        //z.s = create and append empty script element
                        s:(d,S,C,s)=>{s = z.E(d,S);s.type = "text/java"+S;C(z.A(d,s));},
                        //z.s = create empty script in it's own empty iframe
                        //S:(w,s,C,D)=>{D=z.f(w[c.d],()=>z.s(D.contentWindow[c.d],s,C));},
                        T:(w,s,C)=>z.s(w[c.d],s,C),
                        //z.E = create script element
                        E:(d,S)=>d.createElement(S),
                        //z.A = append element x to document d
                        A:(d,x)=>d.body.appendChild(x),
                        //z.f = create hidden iframe
                    /*  f:(d,i,l)=>{ i=z.E(d,"iframe");
                                   i.style.display="none";
                                   i.src="ml.html";
                                   i.onload=l;
                                   return z.A(d,i);},*/
                 
                 
                 
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
                        //e:(r,d)=>r.headers.get("Etag")[c.R](/[\"\/\\\-]*/g,'')||d,
                        
                        //z.r() = a random id generator
                        r:()=>Math.random().toString(36).substr(-8),
                         
                        
                        V:(u,v)=>z.F?u+"?v="+v:u,// if using fetch,  append v=version
                        v:(u,v,s)=>(ml.h[u]={v:v,s:s,e:{}}),
                       // 8:(m,c)=>{
                            
                        //},
                        //9:(L,C)=>L&& c.w in self[c.n] && self[c.n][c.w].register('./ml.sw.js?ml=' + encodeURIComponent(L)).then(C?C:()=>{})
                     };

            lib.ml_g = ml.g = defaultLoader;

            return lib;
            
            function resolveId( id ) {
                 
                 const url  = ml_d [ id ];
                 const href = url && url.h;
                 const mod  = href && ml_h [ href ];
                 const exp  = mod && mod.e;
                 
                 return exp && exp [id];
            } 
            
            
            function defaultLoader(x,R,U,N) {
                  R=c.r(x);
                  if (!R) {
                      if (L[x]) return !1;
                      
                      return x;
                      
                      //if(ml.d[x]) return !1;
                      
                      //if(ml.h[x]) return !1;
                      
                      //return x;
                  } else {
                      // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                     if ((N=R[2])&&N!==selfname) return !1; 
                  }
                  N=R[1];
                  U=c.B(R[3]);
                  if(c.c(U))ml.d[N]={h:U};
                  z.T(window,"script",(s)=>{
                     z.p(U,s.setAttribute.bind(s,"src"),s);    
                  });
                  return N;
            }

           
        },

        ServiceWorkerGlobalScope: function mlXStoreLib( ) {
            const lib = {};
            // add / override window specific methods here
            const l=location,O=l.origin;
            const selfname ="ServiceWorkerGlobalScope";
            const ml_d = ml.d,ml_h = ml.h;
            
            let   L = self; // gets replaces once X-loader is booted
            const c = ml.c;
            //const d=false;
            const z = {
                        F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),// F:t[1] = use fetch, F:false,  = don't use fetch
                 
                        //ml(0)->z[0] = entry vector - note we ignore params passed to ()=> use outer scope to fetch o
                        //     (o is the result of z[1]() which was invoked earlier in outer script scope, when it called ml(1) 
                        //0:()=>z.l(o),
                        
                        //t:(n)=>Math.min(100,ml.t=(ml.t?ml.t*2:1)),
                        //z.l = load list of urls, then call outer (a) function (the module ready completion callback)
                    /*  l:(u)=>{
                           u=typeof u===t[2]?u.replace(/(^(?:[\t ]*(?:\r?\n|\r))+)|(\ |\t)/gm,'').split('\n'):u; 
                           u = u.map(ml.g||z.u).filter(z.y);
                           return u.length?setTimeout(z.l, z.t(u.length), u)&&c.l("pending...",u):a();
                        },*/
                 
                        //z.u = map iterator z.l
                        //z.u = map iterator z.l (note - R argument is a cheat - used as local var, originally index for interator)
                        //z.y = filter to remove elements that truthy. (z.m returns false when a module is loaded, so truthy = name of still to be loaded module)
                        //y:(x)=>!!x,
                          
                        //z.s = create and append empty script element
                        s:(d,S,C,s)=>{s = z.E(d,S);s.type = "text/java"+S;C(z.A(d,s));},
                        //z.s = create empty script in it's own empty iframe
                        //S:(w,s,C,D)=>{D=z.f(w[c.d],()=>z.s(D.contentWindow[c.d],s,C));},
                        T:(w,s,C)=>z.s(w[c.d],s,C),
                        //z.E = create script element
                        E:(d,S)=>d.createElement(S),
                        //z.A = append element x to document d
                        A:(d,x)=>d.body.appendChild(x),
                        //z.f = create hidden iframe
                    /*  f:(d,i,l)=>{ i=z.E(d,"iframe");
                                   i.style.display="none";
                                   i.src="ml.html";
                                   i.onload=l;
                                   return z.A(d,i);},*/
                 
                 
                 
                        //document.getElementById('targetFrame').contentWindow.targetFunction();
                        
                      
                 
                        
                               
                        //z.U() = history as an array of urls
                        
                        U:()=>c.k(ml.h),
                        
                        
                        //z.r() = a random id generator
                        //r:()=>Math.random().toString(36).substr(-8),
                         
                        
                        //V:(u,v)=>z.F?u+"?v="+v:u,// if using fetch,  append v=version
                        //v:(u,v,s)=>(ml.h[u]={v:v,s:s,e:{}}),
                       // 8:(m,c)=>{
                            
                        //},
                        //9:(L,C)=>L&& c.w in self[c.n] && self[c.n][c.w].register('./ml.sw.js?ml=' + encodeURIComponent(L)).then(C?C:()=>{})
                     };
                     
                     
                     
            lib.ml_g = ml.g = defaultLoader;

            return lib;
            
            function resolveId( id ) {
                 
                 const url  = ml_d [ id ];
                 const href = url && url.h;
                 const mod  = href && ml_h [ href ];
                 const exp  = mod && mod.e;
                 
                 return exp && exp [id];
            } 
           
            function defaultLoader(x,R,U,N) {
                R=c.r(x);
                if (!R) {
                    if (L[x]) return !1;
                    
                    return x;
                } else {
                    // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                   if ((N=R[2])&&N!==(selfname)) return !1; 
                }
                
                N=R[1];
                U=c.B(R[3]);
                ml.l.push(N+'='+U);
                if(c.c(U)){ml.d[N]={h:U};ml.H.push(U);}
                try {
                  self.importScripts(U);
                } catch (e){
                  c.l(e.message,'in',ml.l);  
                }
                ml.h[U]=ml.h[U]||{e:{}};
                ml.h[U].e[N]=c[4]()[N]||false;
                ml.l.pop();
                return N;
                
            }

            
            
        } 
    }, {
        Window: [
            
        ],
        ServiceWorkerGlobalScope: [
            
        ]
        
    }

    );


    

});

