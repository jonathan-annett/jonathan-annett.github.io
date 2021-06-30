/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */

function ml(x,L,o,a,d,s){ml.h||(ml.h={},ml.H=[],ml.d={},ml.f={});let z,C=console,e=[C,ml,"",z,x].map(e=>typeof e),l=location,O=l.origin,t=e[4]===e[2]?/^[a-zA-Z0-9\-\_\$]*$/.test(x)?"I":"L":x,c={r:e=>/([A-z0-9\_\$]*)(?:\@)?([\w\$]*)(?:\s*\|)(?:\s*)([A-z0-9\:\/\-\_\.\@\~\#\!]+)/.exec(e),b:O+/([a-zA-Z0-9\.\-]*\/)*/.exec(l.pathname)[0],c:e=>e.startsWith(O),R:"replace",f:"forEach",w:"serviceWorker",n:"navigator",d:"document",B:(e,r)=>(r=/^\//)&&/^(http(s?)\:\/\/)/.test(e)?e:r.test(e)?e[c.R](r,O+"/"):c.b+e[c.R](/^(\.\/)/,""),1:()=>c[4]()||{},2:(L,o,a,d,t,D)=>{typeof(t=a[L]&&a[L].name)+typeof o[t]===e[2]+e[3]&&(c.S(o,t,a[L].apply(this,d[L].map(c.x))),ml.d[t]&&c.S(ml.h[ml.d[t].h].e,t,o[t])),ml.i||(ml.i=new Proxy({},{get:(e,t)=>c.I(x=t),ownKeys:()=>c.k(ml.d),getOwnPropertyDescriptor:(e,t)=>!!ml.d[t]&&c.P(c.I(t)),has:(e,t)=>!!ml.d[t]}))},P:e=>({value:e,enumerable:!0,configurable:!0}),S:(o,e,t)=>(Object.defineProperty(o,e,c.P(t)),t),3:()=>c[4]().constructor.name||"x",4:()=>typeof self===e[0]&&self,x:e=>e(),l:C.log.bind(C),L:(e,R,t,m)=>(R=c.r(x),m=R?c[4]():!!o,e=m?o:{},R=R||[x,"t",0,x],t=a||R[1],ml(0,e,[t+"@T|"+R[3]],()=>ml(2,"T",e,{T:L},{T:[x=>(R=e[t],m||delete e[t],(x=t&&ml.d[t])&&(ml.h[x.h].e[t]=R),R)]}),"T")),I:(e,t)=>(e=ml.d[x])&&(t=ml.h[e.h])&&t.e[x],k:o=>Object.keys(o)};return(z=typeof c[t]===e[1]?c[t](L,o,a,d,s):c)!==c?z:(z={F:((r)=>{r=ml.fetch||false;if (!r) c.l=()=>{};return r;})(0),0:()=>z.l(o),t:e=>Math.min(100,ml.t=ml.t?2*ml.t:1),l:e=>(e=e.map(z.u).filter(z.y)).length?setTimeout(z.l,z.t(e.length),e)&&c.l("pending...",e):a(),u:(x,R,e,t)=>(R=c.r(x))?(!(t=R[2])||t===(d||c[3]()))&&(t=R[1],e=c.B(R[3]),c.c(e)&&(ml.d[t]={h:e}),z.T(window,"script",s=>{z.p(e,s.setAttribute.bind(s,"src"),s)}),t):!L[x]&&x,y:x=>!!x,s:(d,e,C)=>{(s=z.E(d,e)).type="text/java"+e,C(z.A(d,s))},S:(e,s,C,D)=>{D=z.f(e[c.d],()=>z.s(D.contentWindow[c.d],s,C))},T:(e,s,C)=>z.s(e[c.d],s,C),E:(d,e)=>d.createElement(e),A:(d,x)=>d.body.appendChild(x),f:(d,e,l)=>((e=z.E(d,"iframe")).style.display="none",e.src="ml.html",e.onload=l,z.A(d,e)),U:()=>c.k(ml.h),p:(e,l,s,r,L,t,R)=>(r=z.r(),L=(t=>l(z.V(e,t))),t=(t=>L(z.v(e,t,s))),R=(()=>t(r)),!ml.h[e]&&(ml.H.push(e)&&(typeof fetch===z.F?fetch(e,{method:"HEAD"}).then(e=>t(z.e(e,r))).catch(R):R()))),e:(r,d)=>r.headers.get("Etag")[c.R](/[\"\/\\\-]*/g,"")||d,r:()=>Math.random().toString(36).substr(-8),V:(e,t)=>z.F?e+"?v="+t:e,v:(e,t,s)=>ml.h[e]={v:t,s:s,e:{}},8:(e,c)=>{},9:(L,C)=>L&&c.w in self[c.n]&&self[c.n][c.w].register("./ml.sw.js?ml="+encodeURIComponent(L)).then(C||(()=>{}))})[x]&&z[x](L,o,a,d,s)}
ml(0,ml(1),[
    
    'swResponseZipLib@ServiceWorkerGlobalScope  | ml.zipfs.js',

    
    ],function(){ml(2,ml(3),ml(4),

    {

        Window: function main(wTools) {
            
            const lib = {

            };
         
            
            ml(9,'./ml.pwa.js');
            
            /*
            
            setTimeout(function(){
                
                sendMessage("ping",{hello:"world",when:new Date(),also:Math.random()},function(err,reply){
                   console.log({err,reply});  
                   
                   
                 
                });
                
                
                  
                
                
            },5000);
            
            
            
            function findWorker(cb) {

                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                  let noerr;
                
                  if (!registrations.some(function(reg){
                      const worker = reg.controller || reg.active || reg.installing || reg.waiting;
                      if (worker) {
                          cb(noerr,worker);
                          return true;//break some
                      }
                  })){
                     cb(new Error("no worker found"));
                  }
                });
                
            }
             
            
            function sendMessage(cmd,data,cb) {
                const replyName        = "r"+Math.random().toString(36).substr(-8)+Date.now().toString(36).substr(-4);
                const sendChannel      = new MessageChannel();
                const replyChannel     = new BroadcastChannel(replyName);
                const timeout = 2000;
                const exitMsg=function(d){
                    let noerr;
                    replyChannel.close();
                    sendChannel.port1.close();
                    sendChannel.port2.close();
                    if (d.error) {
                       cb(d.error); 
                    } else {
                       cb(noerr,d);
                    }
                }
                let tmr = setTimeout(function(){exitMsg({error:"timeout"})},timeout);
                replyChannel.onmessage = function(e) {
                      clearTimeout(tmr);
                      exitMsg(e.data);
                };
                
                findWorker(function(err,worker){
                    if (err) return cb(err);
                    worker.postMessage({m:cmd,r:replyName,data:data},[sendChannel.port2]); 
                });
           } */

            return lib;
        },

        ServiceWorkerGlobalScope: function main(swRespZip) {
            
                ml.register("activate",function(event){
                    
                    console.log("activate event");
                    self.clients.claim();
                    
                });
                
                ml.register("messages",{
                    
                    ping:function(msg,cb){ 
                            
                            console.log(msg); 
                            return cb("pong");
                        
                    },

                });
                   
                const dbKeyPrefix       = 'zip-files-cache.';
       
                
                ml.register("fetch",swRespZip(dbKeyPrefix).processFetchRequest);
                

        },

    }, {
        Window: [

        ],
        ServiceWorkerGlobalScope: [

            () => self.swResponseZipLib
            
        ],
    }

    );


 

});



