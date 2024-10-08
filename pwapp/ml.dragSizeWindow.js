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
            
            function size(el,vertHotzones,horzHotZones,deltaX,deltaY) {
              deltaX = deltaX || 1;
              deltaY = deltaY || 1;
              var paused = false;
              var attached;
              var dragStartX, dragStartY; var objInitWidth, objInitHeight;
              var inSize = false,sizeMode;
              var dragTarget = typeof el==='string'?qs(el):el;
              var maxHeight,maxWidth;
              var minHeight,minWidth;
              document.addEventListener("mousedown", mousedown);
              document.addEventListener("mousemove", mousemove);
              document.addEventListener("mouseup", mouseup);
              
              const api = {
                  destroy : destroy,
                  pause   : pause,
                  resume  : resume,
                  attach  : attach,
                  detach  : detach
              };
              return api;
              
              function attach(fn) {
                  if (typeof fn==='function') {
                      attached = fn;
                  } else {
                      attached = undefined;
                  }
              }
              
              function detach() {
                  attached = undefined;
              }
              
              function pause () {
                  paused = true;
              }
              
              function resume () {
                  paused = false;
              }
              
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
                if (paused) return;
                const isVert  = vertHotzones && vertHotzones.map(qs).indexOf(e.target)>=0;
                const isHorz  = horzHotZones && horzHotZones.map(qs).indexOf(e.target)>=0;
                if (!isHorz && !isVert) return;
                
                inSize = true;
                let compStyles = window.getComputedStyle(dragTarget);
                objInitWidth = Number.parseInt(compStyles.getPropertyValue('width') ); 
                objInitHeight = Number.parseInt(compStyles.getPropertyValue('height') );
                dragStartX = e.pageX; dragStartY = e.pageY;
                sizeMode = {h:isHorz,v:isVert};
                
                if (isHorz) {
                    if (dragTarget.getMaxWidth) {
                        maxWidth=dragTarget.getMaxWidth();
                    } 
                    if (dragTarget.getMinWidth) {
                        minWidth = dragTarget.getMinWidth();
                    }
                }
                if (isVert) {
                    if (dragTarget.getMaxHeight) {
                        maxHeight=dragTarget.getMaxHeight();
                    } 
                    if (dragTarget.getMinHeight) {
                        minHeight = dragTarget.getMinHeight();
                    }
                }
              }
              
              function mouseup(e) {
                  if (paused) return;
                  inSize = false;
                  
              }
              
              function mousemove(e) {
                if (paused) return;  
                if (!inSize) {return;}
                let h_ok = sizeMode.h;
                
                if (h_ok) {
                    const newWidth = objInitWidth + deltaX *(e.pageX-dragStartX);
                    if (maxWidth) {
                        if (newWidth>maxWidth) {
                            h_ok=false;
                        }
                    }
                    if (minWidth) {
                        if (newWidth<minWidth) {
                            h_ok=false;
                        }
                    }
                    if (h_ok) {
                        if (attached) attached(newWidth);
                        dragTarget.style.width   = newWidth + "px";
                    }
                }

                if (sizeMode.v) {
                    const newHeight = objInitHeight + deltaY * (e.pageY-dragStartY);
                    if (maxHeight) {
                        if (newHeight>maxHeight) {
                            return;
                        }
                    } 
                    if (minHeight) {
                        if (newHeight<minHeight) {
                            return;
                        }
                    }
                    if (attached) attached(undefined,newHeight);
                    dragTarget.style.height  = newHeight + "px";
                }
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

