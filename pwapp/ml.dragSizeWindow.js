/* global zip_url_base,zip_files, parent_link*/


/* global ml,qs,self,caches, swResponseZipLib  */
ml([],function(){ml(2,

    {
        
        
        
        Window: function dragSizeWindowLib(  ) {
            
            const lib ={ drag, size};
            // add / override window specific methods here
            
            function drag(el,Hotzones) {
              var dragStartX, dragStartY; var objInitLeft, objInitTop;
              var inDrag = false;
              var dragTarget = typeof el==='string'?qs(el):el;
              document.addEventListener("mousedown",mousedown );
              document.addEventListener("mousemove",mousemove );
              document.addEventListener("mouseup", mouseup);
              
              const api = {
                  destroy : destroy
                  
              };
              return api;
              
              function destroy() {
                  document.removeEventListener("mousedown", mousedown);
                  document.removeEventListener("mousemove", mousemove);
                  document.removeEventListener("mouseup", mouseup);
                  delete api.mousedown;
                  delete api.mousemove;
                  delete api.mouseup;
                  delete api.destroy;
              }
              
              function mousedown(e) {
                  if (Hotzones.map(qs).indexOf(e.target)<0) return;
                inDrag = true;
                let compStyles = window.getComputedStyle(dragTarget);
                objInitLeft = Number.parseInt(compStyles.getPropertyValue('left') ); objInitTop = Number.parseInt(compStyles.getPropertyValue('top') );
                dragStartX = e.pageX; dragStartY = e.pageY;
              }
              
              function mousemove(e) {
                if (!inDrag) {return;}
                dragTarget.style.left = (objInitLeft + e.pageX-dragStartX) + "px";
                dragTarget.style.top = (objInitTop + e.pageY-dragStartY) + "px";
                
              }
              
              function mouseup(e) {
                  inDrag = false;
              }

            } 
            
            function size(el,vertHotzones,horzHotZones) {
              var dragStartX, dragStartY; var objInitWidth, objInitHeight;
              var inSize = false,sizeMode;
              var dragTarget = typeof el==='string'?qs(el):el;
              
              document.addEventListener("mousedown", mousedown);
              document.addEventListener("mousemove", mousemove);
              document.addEventListener("mouseup", mouseup);
              
              const api = {
                  destroy : destroy
                  
              };
              return api;
              
              function destroy() {
                  document.removeEventListener("mousedown", mousedown);
                  document.removeEventListener("mousemove", mousemove);
                  document.removeEventListener("mouseup", mouseup);
                  delete api.mousedown;
                  delete api.mousemove;
                  delete api.mouseup;
                  delete api.destroy;
              }
              
              function mousedown(e) {
                const isVert  = vertHotzones && vertHotzones.map(qs).indexOf(e.target)>=0;
                const isHorz  = horzHotZones && horzHotZones.map(qs).indexOf(e.target)>=0;
                if (!isHorz && !isVert) return;
                
                inSize = true;
                let compStyles = window.getComputedStyle(dragTarget);
                objInitWidth = Number.parseInt(compStyles.getPropertyValue('width') ); 
                objInitHeight = Number.parseInt(compStyles.getPropertyValue('height') );
                dragStartX = e.pageX; dragStartY = e.pageY;
                sizeMode = {h:isHorz,v:isVert}
              }
              
              function mouseup(e) {
                  inSize = false;
                  
              }
              
              function mousemove(e) {
                if (!inSize) {return;}
                if (sizeMode.h) dragTarget.style.width   = Math.max(dragTarget.scrollWidth,  (objInitWidth + e.pageX-dragStartX))  + "px";
                if (sizeMode.v) dragTarget.style.height  = Math.max(dragTarget.scrollHeight, (objInitHeight + e.pageY-dragStartY)) + "px";
              }
            } 
            
            
            return lib;
        }
    }, {
        Window: [
            
        ]

    }

    );

 
 

});

