/* global ml,self,caches */
ml(0,ml(1),['wTools|windowTools.js'],function(){ml(2,ml(3),ml(4),

    {

        Window: function main(wTools) {
            
            const lib = {

            };
            
            
            var [ 
                btnOpen, btnMax, btnMin, btnRestore,
            
                url, title,wleft,wtop,textarea,select] = [
                "#btnOpen", "#btnMax", "#btnMin", "#btnRestore",
                "#url", "#title","#left","#top","textarea","select"
                
            ].map(qs);
            
            btnOpen.onclick = function(){
                wTools.open(url.value,title.value,Number.parseInt(wleft.value)||0,Number.parseInt(wtop.value)||0);
            };
            
            btnMax.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).maximize();
                }
             };
            btnMin.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).minimize();
                }
            };
            btnRestore.onclick = function(){
                const meta = wTools.getMetaForURL(url.value);
                if (meta) {
                    wTools.fs_api(meta.wid).restore();
                }
            };
            
            
            monitor();
            
            wTools.on("setKey",monitor);
            
            window.addEventListener("storage",monitor);
            
            var lastOpen="";
            
            function monitor(){
                var info={};
                var currentOpen = localStorage.getItem("windowTools.openWindows");
                if (currentOpen!==lastOpen) {
                    lastOpen=currentOpen;
                    const openWindows = JSON.parse(currentOpen);
                    const selected = select.value;
                    select.innerHTML = Object.keys(openWindows).map(function(wid){
                        const meta = openWindows[wid];
                        return '<option '+(selected===wid?'selected ':'')+'href="'+wid+'">'+meta.url+'</option>';
                    }).join("\n");
                    
                    
                }
                Object.keys(localStorage).forEach(function(k){
                    
                    if (k.startsWith("windowTools.")){
                        info[k]=JSON.parse(localStorage.getItem(k));
                    }
                    
                });
                textarea.value = JSON.stringify(info,undefined,4);
            }
            
            // generic tools 
            
            function qs(d,q,f) {
                let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
                if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
                if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
                if (D+Q===O+S){
                   r = d.querySelector(q);
                   if (r&&typeof r+typeof f===O+FN) {
                        if (f.name.length>0) 
                           r.addEventListener(f.name,f);
                        else 
                           f(r);
                    }
                }
                return r;
            }
            
            
            if ('serviceWorker' in navigator) {
              navigator.serviceWorker.register('./wtool.js')
              .then((reg) => {
                // registration worked
                console.log('Registration succeeded. Scope is ' + reg.scope);
              }).catch((error) => {
                // registration failed
                console.log('Registration failed with ' + error);
              });
            }

            return lib;
        },

        ServiceWorkerGlobalScope: function dep3() {
            const lib = "hello sw world";
            self.addEventListener("install",function(e){
                self.addEventListener('install', (event) => {
                  event.waitUntil(
                    caches.open('v1').then((cache) => {
                      return cache.addAll([
                        './wtool.html',
                        './test.html',
                        
                      ]);
                    })
                  );
                });
                
            });
            
            self.addEventListener("activate",function(e){
                console.log("activate");
            });
            
            self.addEventListener("fetch",function(event){
                console.log("fetch",event.request.url);
                event.respondWith(
                  caches.match(event.request).then((response) => {
                    return response || fetch(event.request);
                  })
                );
            });
            return lib;
        },

    }, {
        Window: [

            () => self.wTools
           
        ],
        ServiceWorkerGlobalScope: [

            () => self.wTools
        ],
    }

    );


    /*

local imports - these functions are available to the other modules declared in this file

*/
 

});

