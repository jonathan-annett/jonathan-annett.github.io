
/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(0,ml(1),
    
      `
      
      xStoreBase    | ml.xs.base.js
      httpsStore    | ml.xs.https.js
      memoryStore   | ml.xs.memory.js
      
      `
    
    ,function(){ml(2,

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

            //console.log("installing defaultLoader in ml.xs.js");
            //lib.ml_g = ml.g = getLoader();//defaultLoader;
            
            //lib.getLoader = getLoader ;

            return lib;
            
            function resolveUrl( href ,id ) {
                 const mod  = href && ml_h [ href ];
                 const exp  = mod && mod.e;
                 id = id || exp && Object.keys(exp)[0];
                 return exp && id && exp [id];
            } 
            
            function resolveIdFromUrl (url) {
                const mod  = url && ml_h [ url ];
                const exp  = mod && mod.e;
                return exp && Object.keys(exp)[0];
            }
             
            
            function resolveModuleFromId( id ) {
                 
                 const url  = ml_d [ id ];
                 const href = url && url.h;
                 return resolveUrl( href , id)
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
                  
                  console.log("loading",U,"via defaultLoader in ml.xl.js");
                  z.T(window,"script",(s)=>{
                     z.p(U,s.setAttribute.bind(s,"src"),s);    
                  });
                  return N;
            }
            
            function getLoader () {
                 const amd = ml.i.AMDLoaderLib;
                if ( !!amd && !window.define) {
                        amd.loadResources = amd_loader;
                        amd.moduleMap     = {};
                        amd.definedStack  = [];
                        
                        window.require = amd.require;
                        window.define  = amd.define;
                }
                
                const modules = ml.i.memoryStore({__persistent:true}); 
                
                const urls=ml.H.slice();
                const noCorsTest = new RegExp('^(?!'+regexpEscape(location.origin+'/')+').+','');
                
                const fetcher = ml.i.httpsStore ( urls , noCorsTest, modules, ready );
                console.log("installing ml xstorage loader");
                return ml_g_loader;
                
                
                function amd_loader (U,cb){
                    fetcher.getItem(U,function(module){
                        if (isModule(module)) {
                            module.on('load',function(){
                                console.log('loaded',module);    
                            });
                        } else {
                            console.log('could not load',module);
                        }
                    });
                }
                
                function ready (api) {
                    
                    api.__serialize = customSerialize;
                    const additional = ml.H.map(function(u){ return urls.indexOf(u)<0;});
                    
                    additional.forEach(function(u){
                        urls.push(u);
                    });
                    
                    urls.forEach(function(u){
                       const id = resolveIdFromUrl (u) ;
                       const module = {
                           id      : u,// for amd compatiblity
                           path    : u,
                           ml      : ml,
                           exports : resolveUrl( u , id ),
                           ready   : true,
                           on : function(){},
                       };
                       
                       amd.definedStack.push(u);
                       amd.moduleMap[u]=module;
                       
                    });
                }
                
               
                
                function isBuffer(x) {
                    return typeof x==='object' && typeof x.constructor === ArrayBuffer || x.buffer && x.buffer.constructor === ArrayBuffer;
                }
                
                function isModule(x) {
                    return typeof x==='object' && 
                           typeof typeof x.path+ x.on +typeof x.ml +typeof x.ready +typeof exports === "stringfunctionfunctionbooleanobject" ;
                }
                
                
                function isString(x) {
                    return typeof x === 'string';
                }
                
                
                function isScript(x) {
                    return typeof x==='object' && (x.constructor.name === "HTMLScriptElement" || typeof x.src + typeof x.innerText === 'stringstring') ;
                }
                
                function customSerialize (serialize,url,x,cb) {
                    if ( url.slice(-3)!=='.js' || isScript(x)) return serialize(x,cb);
                    const code = isBuffer(x) ? new TextDecoder().decode(x) : isString(x) ? x : '/* unsupported type : '+typeof x +' */';
                    cb(JSON.stringify(["HTMLScriptElement",url,code]));
                }
                
                function ml_g_loader (x,R,U,N) {
                    R=c.r(x);
                    if (!R) {
                        if (L[x]) return !1;
                        
                        return x;
                    } else {
                        // for module@Window|filename.js format - return if wrong name:  c[3]() is "Window","ServiceWorkerGlobalScope"
                       if ((N=R[2])&&N!==selfname) return !1; 
                    }
                    N=R[1];
                    U=c.B(R[3]);
                    if(c.c(U))ml.d[N]={h:U};
                    
    
                    fetcher.getItem(U,function(module){
                        if (isModule(module)) {
                            module.on('load',function(){
                                console.log('loaded',module);    
                            });
                        } else {
                            console.log('could not load',module);
                        }
                    });
                    
                    
                     
                   
                    
                    return N;
                }
            }
            
            
            function regexpEscape(str) {
                return str.replace(/[-[\]{}()\/*+?.,\\^$|#\s]/g, '\\$&');
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
                     
                     
                     
            console.log("installing defaultLoader in ml.xs.js");
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

