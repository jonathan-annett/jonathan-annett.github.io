/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml([],function(){ml(2,

    {
        Window: function progressHandler( ) {
            
            return  function progressHandler(complete,total,id,idtxt,channelName) {
                      let expect_total = total;
                      let outer = qs("#"+id),inner = qs(outer,"div"),status = qs("#"+idtxt),maxWidth = outer.offsetWidth, barHeight=outer.offsetHeight;
                      updateBar();
                      if (status) {
                         status.style= "position:relative;left:"+(maxWidth+2)+"px;top:-"+barHeight+"px;"; 
                      }
                      
                    
                        if (channelName) {
                          const channel = new BroadcastChannel(channelName);
                          channel.onmessage =function(e){
                              const msg = e.data;
                              if (msg && msg.setTotal) {
                                  setTotal(msg.setTotal);
                              } 
                              else if (msg && msg.setComplete) {
                                 setComplete(msg.setComplete);
                              }
                              else if (msg && msg.addToTotal) {
                                 addToTotal(msg.addToTotal);
                              }
                              else if (msg && msg.logComplete) {
                                 logComplete(msg.logComplete);
                              }
                          };
                      }
                      return {
                          setTotal:setTotal,
                          setComplete:setComplete,
                          addToTotal:addToTotal,
                          updateBar : updateBar,
                          logComplete: logComplete
                      };
                     
                      function setTotal(n) {
                          expect_total=n;
                      }
                     
                      function setComplete(n) {
                          complete=n;
                          updateBar();
                      }
                     
                      function logComplete(n) {
                         complete += n;
                         updateBar();
                      }
                     
                      function addToTotal (n) {
                          total+=n;
                          updateBar();
                      }
                     
                      function updateBar (){
                        
                        inner.style.width = Math.floor(Math.min((complete/Math.max(total,expect_total)),1)*maxWidth)+"px";
                        if (status) {
                          status.textContent = complete+"/"+Math.max(total,expect_total);
                        }
                      }
                   } ;
                   
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

        },
        
        ServiceWorkerGlobalScope: function progressHandler(  ) {
            // we reuse the progress handler send mechanism that is embedded in the ml kernel.
            return ml.c.p;
        } 
        
    }, {
        
        Window: [ ],
        
        ServiceWorkerGlobalScope : [ ]

    }

    );


               
   
   
               
 

});



