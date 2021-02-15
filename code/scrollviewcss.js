(function(){
 if (typeof window!=='object') 
    return;
 if (typeof window.addScrollCss==='function') 
    return;
window.addScrollCss=addScrollCss;

function addScrollCss (options,elementIds){ 
  scrollClases = scrollClases ||{};
  elementIds = (typeof elementIds=== 'object' && 
                  elementIds.constructor===Array) ? elementIds : [elementIds];
    
  var eol="\n",
      ON = "addEventListener",
      OFF= "removeEventListener",
      HAS="some",
      defaultClasses = {
        container_clip : "container_clip",
        container : "container",
        contained : "contained",
        even_odd  : [ "even","odd"] 
      },
      container_clip = options.container_clip||defaultClasses.container_clip,
      container= options.container||defaultClasses.container,
      contained= options.contained||defaultClasses.contained,
      odd  = (options.even_odd&&options.even_odd[1]) ||defaultClasses.even_odd[1],
      even = (options.even_odd&&options.even_odd[0]) ||defaultClasses.even_odd[0],
      even_odd=[even,odd],
      width = options.width||320,
      height = options.height||480,
      left = options.left||0,
      top = options.top||0,
      maxCount = options.maxCount|| elementIds.reduce(getMaxCount),
      speed = options.swipeSeconds||0.25;
   
  function getEl(id,fn) {
    var c=document.getElementById(id);
    if(fn)c.onclick=fn
    return c;
  }
  function getMaxCount (max,val) {
    max = ( max === undefined || val >max ) ? val : max;
    return max;
  }
 
  function wrapContainer(containerId) {
    var contain=getEl(containerId);
    var tabindex = 1;
    if (!contain) return null;

    contain.mouseSwipeThresholdX  = 100;
    contain.mouseSwipeThresholdY  = 100;
    contain.touchSwipeThresholdX  = 100;
    contain.touchSwipeThresholdY  = 100;
    
    var transitionCallback=false,
        transitionCallbackFired=function() {
        if (transitionCallback) {
            transitionCallback();
            transitionCallback=false;
        }
      };
    contain[ON]('transitioncancel', transitionCallbackFired);

    contain[ON]('transitionend', transitionCallbackFired);

    function setSectionIndex(index,setMode,cb) {
       transitionCallback=cb;
       var t=[],
          count=contain.children.length,
          retval = (typeof index ==='number') && (index >=0) && (index <= count+2);
      index = retval ? index : 1;

      var newClass = (setMode||"scroll")+index.toString();
      if (contain.classList.contains(newClass)){
         transitionCallback=undefined;
         return typeof cb==='function'?cb():cb;
      }

      if (!t.concat.apply(t,contain.classList).some(function(x){

        if (x.startsWith("scroll") && !isNaN(x.substr(6)) ) { 
           
           contain.classList.add(newClass);
           contain.classList.remove(x);
           return true;
        }

        if (x.startsWith("snap") && !isNaN(x.substr(5)) ) {
           contain.classList.remove(x);
           contain.classList.add(newClass);
           return true;
        }
        
        return false;
      })) {
          contain.classList.add(newClass);
      }

     }


    function snapLeft() {
      
      var count = contain.children.length,
          CB = typeof cb==='function'?cb:undefined;
      
      tabindex++;
      if (tabindex >count)  {
         tabindex=1;
      } 
      
      setSectionIndex(tabindex,"snap",CB);
    }
    
    function snapRight(cb) {
      var count=contain.children.length,
          CB = typeof cb==='function'?cb:undefined;
      
      tabindex--;
      if (tabindex <1)  {
        tabindex=count;
       }
   
      setSectionIndex(tabindex,"snap",CB);
         
    }
 
    function scrollLeft(e) {
      console.log("left",e.type,e.detail.shiftKey,e.detail.swipeDevice);
      if (e.detail.shiftKey) return snapLeft(e,cb);
      
      var count=contain.children.length,
          CB=typeof cb==='function'?cb:undefined;
      tabindex++;
      if (tabindex > count)  {

        setSectionIndex(0,"snap",function(){
           setSectionIndex(1,"scroll",CB);
           tabindex=1;
        });
         
      } else
        setSectionIndex(tabindex,"scroll",CB)
    }
    
    function scrollRight (e,cb) {
      
      console.log("right",e.type, e.detail.shiftKey,e.detail.swipeDevice);
      if (e.detail.shiftKey) return snapRight(e,cb);
      
      var count=contain.children.length,
          CB=typeof cb==='function'?cb:undefined;
      
      tabindex--;
      if (tabindex <1)  {

        
         setSectionIndex(count+1,"snap",function(){
            setSectionIndex(count,"scroll",CB);
            tabindex=count;
        });
        
      } else
        setSectionIndex(tabindex,"scroll",CB);
    }

    function scrollToSect(n) {
      if (n===tabindex) 
        return;
      contain.className = 'container scroll'+n;
      tabindex=n;
    }

    function snapToSect(n) {
      if (n===tabindex) 
        return;
      contain.className = 'container nap'+n;
      tabindex=n;
    }

   
    
    if (options.mouse) {
      mouseSwipeEvents(contain,scrollLeft , scrollRight);
    } ;
    
    if (options.touch) {
      touchSwipeEvents(contain, scrollLeft, scrollRight);
    }
    
    for (var i= 0;i<contain.children.length;i++) {
      var el=contain.children[i];
       el.classList.remove(even_odd[i % 2]);
       el.classList.add(even_odd[1-(i % 2)]);
    }


    return {
      scrollLeft   : scrollLeft,
      scrollRight  : scrollRight,
      snapLeft     : snapLeft,
      snapRight    : snapRight,
      scrollTo     : scrollToSect,
      snapTo       : snapToSect
    };

  } 

  function csstransition(sex,mode) {
    var cssTxt="transition: "+(sex?sex:0)+"s "+(mode?mode:"ease-in-out")+";"+eol;
    return cssTxt+(["-webkit-","-moz-","-o-",""].join(cssTxt));
  }

  function scrollCssElement(container,contained,width,index,speed) {

    return (
      "."+container+ ".scroll"+index+" ."+contained+ "{"+eol+
      " transform: translate("+  (width*(1-index)).toString()+"px,0);"+ eol +
      csstransition(speed,"ease-in-out") + eol +
      "}" + eol +

      "."+container+ ".snap"+index+" ."+contained+ "{"+eol+
      " transform: translate("+  (width*(1-index)).toString()+"px,0);"+ eol +
      csstransition(0.01,"ease-in-out") + eol +
      "}"
    );
  }

  function scrollCss (container_clip,container,contained,width,height,left,top,count,speed){
    
    
    
    
    var cssTxt = "",width_= width.toString()+"px",height_=+height.toString()+"px";
    
    cssTxt += "."+container_clip+"{"+eol; 
  
    cssTxt += "overflow:hidden;"+eol;
    cssTxt += "width : "+width_+";"+eol;
    cssTxt += "height : "+height_+"; "+eol;
    cssTxt += "position:absolute;"+eol;
    cssTxt += "top:"+top.toString()+"px;"+eol;
    cssTxt += "left :"+left.toString()+"px;"+eol;
    cssTxt += "padding:0;"+eol;
    cssTxt += "margin:0;"+eol;
    cssTxt += "}"+eol;

    cssTxt += "."+container+" {"+eol;
    cssTxt += "width: "+((count+2)*width).toString()+"px;"+eol;
    cssTxt += "position: absolute;"+eol;
    cssTxt += "left:0;"+eol;
    cssTxt += "top:0;"+eol;
    cssTxt += "padding:0;margin:0;"+eol;
    cssTxt += "clip: rect(0,"+width_+","+height_+",0);"+eol;
    cssTxt += "}"+eol;
    cssTxt += "."+contained+" {"+eol;
    cssTxt += "position: relative;"+eol;
    cssTxt += "display: inline-block;"+eol;
    cssTxt += "width:  "+width_+";"+eol;
    cssTxt += "height: "+height_+";"+eol;
    cssTxt += "margin :0;"+eol;
    cssTxt += "padding:0;"+eol;
    cssTxt += "}";

    for (var index=0;index<count+2;index++) {
      cssTxt+=(eol+scrollCssElement(container,contained,width,index,speed)) ;
    }
    return cssTxt;
  }

  var style = document.createElement('style');
  style.type = 'text/css';
  style.innerHTML = scrollCss (container_clip,container,contained,width,height,left,top,maxCount,speed);
  document.getElementsByTagName('head')[0].appendChild(style);
  
  var controllers = elementIds.map(wrapContainer).filter (function(c){
    if (c===null) return false;
    c.controllers=controllers;
    return true; 
  });
  
 return controllers[0];
  



}

})();
