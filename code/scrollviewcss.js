(function(){
  
  /*
  MIT License

Copyright (c) 2021 Jonathan Annett

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

  
  */
  
  /*global mouseSwipeEvents,touchSwipeEvents*/
  
    if (scriptCheck(['cdpn.io','codepen.io'],'jonathan-annett.github.io','addScrollCss','function')  ) 
    return;


window.addScrollCss=addScrollCss;

function addScrollCss (options,elementIds){ 
  options = options ||{};
  elementIds = (typeof elementIds=== 'object' && 
                  elementIds.constructor===Array) ? elementIds : [elementIds];

  var ON = "addEventListener",
      OFF= "remove"+ON.substr(3),
      HAS="some",
      QS="querySelector",
      QSA=QS+"All",
      console = window.console,

     

      eol="\n",
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
      odd_even=[odd,even],
      width = options.width||320,
      height = options.height||480,
      left = options.left||0,
      top = options.top||0,
      maxCount = options.maxCount|| elementIds.map(function(id){ 
        var el = getEl(id);
        return el?el.children.length:0;
      }).reduce(getMaxCount),
      speed = options.swipeSeconds||0.25;
  

  function getEl(id,fn) {
    var c=document.getElementById(id);
    if(fn)c.onclick=fn
    return c;
  }
  
  function crEl(id,typ,cls,html) {
    var c=document.createElement(typ);
    if(id) c.id=id;
    if(cls)c.className=cls;
    if(html)c.innerHTML=html;
    return c;
  }
  
  function getMaxCount (max,val) {
    max = ( max === undefined || val >max ) ? val : max;
    return max;
  }
  
  function getContainerFromClip(contain_clip){
      var contain = contain_clip[QSA]("."+container);
      if (contain && contain.length===1) {
        return contain[0];
      } else {
        
        return null;
      }
  }
  
  function getContainerData(x,containedClass) {
    
    // x=== either "some_id" or { some_id :[ "some","data" ]}
      var 
      keys=typeof x==='object' ? Object.keys(x) : false,
      containerData = keys ? x[ keys[0] ] : undefined,
      containerId =  keys ? keys[0] : x,
      obj = {
         containerId   : containerId,
         containerData : containerData,
         hadData       : !!keys,
         element       : getEl(containerId)
      };
    
      if (!obj.element) { 
           return null;
      } 
    
      if (containerData) {
           
        
           return obj;
        
      }
          
    
      cleanupDiv(obj.element,containedClass);
      obj.containerData = new Array (obj.element.children.length);
      for (var i=0;i<obj.element.children.length;i++) {
         obj.containerData [i]=obj.element.children[i].innerText;
         
      }
    
    return obj;
  }
 
  function wrapContainer(containerId) {
    
     var 
      contain,
      contain_clip,
      hadData, 
      containerDataMeta,
      containerData = (function(data){ 
         hadData=data.hadData;
         containerId=data.containerId;
         contain =data.element;
         return data.containerData;
      })(getContainerData(containerId,contained));
  
     if(contain===null) return null;
    
    if (contain.classList.contains(container_clip)) {
      
      contain_clip = contain;
      contain = getContainerFromClip(contain_clip);
      if(contain===null) {
         
         if (contain_clip.children.length===0) {
           contain = document.createElement('div');
           contain.className = container;
           contain.classList.add(even);
           contain_clip.appendChild(contain);
           if (hadData && options.on_need_element) {
               containerDataMeta = containerData.map(function(data,index){
                 var 
                 content = options.on_need_element(containerId,index,data); 
                 if (typeof content==='string') {
                    return {el:crEl(undefined,"div",contained,content)};
                 } else {
                    return {el:content};
                 }
              });
               containerDataMeta.forEach(function(meta,index) {
                 contain.appendChild(meta.el);
                 meta.el.id=containerId+"_tab_"+(index+1).toString();
                 //meta.el.dataset.meta=meta;
                 meta.vars={};
               }); 

             }
         }
        
       }
       
      
     
    } else {
      
       if (contain.classList.contains(container)) {
         contain_clip=contain.parentElement;
         contain = getContainerFromClip(contain_clip);
         var i,c=contain.children.length;
         containerDataMeta=new Array(c);
         for (i = 0;i<c;i++) {
            var el=contain.children[i],
            meta={el:el,vars:{}};
            
            meta.el.id=containerId+"_tab_"+(i+1).toString();
            //meta.el.dataset.meta=meta;
            containerDataMeta[i]=meta;
         }
       }
       if(contain===null) return null;
      
    }
    var tabindex = 1,selectIndexFired=1;
    if (!contain) return null;

    contain.mouseSwipeThresholdX  = 100;
    contain.mouseSwipeThresholdY  = 100;
    contain.touchSwipeThresholdX  = 100;
    contain.touchSwipeThresholdY  = 100;
    
    var transitionCallback,
        transitionCallbackElement=contain.children[contain.children.length-1],
        transitionCallbackFired=function(e) {
        if (e.target===transitionCallbackElement)  {
          if (e.elapsedTime >= 0.02) {
            contain.classList.remove("inScroll");
          }
           if (transitionCallback) {
               var cb= transitionCallback;
               transitionCallback=undefined;
               cb(e);
           }
        }
      };
    
    contain[ON]('transitioncancel', transitionCallbackFired);

    contain[ON]('transitionend', transitionCallbackFired);

    function setSectionIndex(index,setMode,cb) {
      var t=[],
          
          count=contain.children.length,
          retval = (typeof index ==='number') && (index >=0) && (index <= count+2);
      index = retval ? index : 1;

      var newClass = (setMode||"scroll")+index.toString();
      if (contain.classList.contains(newClass)){
         transitionCallback=undefined;
         contain.classList.remove("inScroll");
         return typeof cb==='function'?cb():cb;
      }
      
            
      var clsName = newClass.startsWith('scroll') ?  "inScroll "+newClass : newClass ; 
      contain.className.split(" ").forEach(function(x){
        
        if (x.startsWith("scroll") && !isNaN(x.substr(6)) ) { 
            return;
        }

        if (x.startsWith("snap") && !isNaN(x.substr(5)) ) {
           return;
        }
        
        clsName+=" "+x;
      });
      
      transitionCallback=cb;
      contain.className=clsName;
     }

    function snapLeft(cb) {
      
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
    
    function edgeSnap(e,toIndex,CB) {
      tabindex=toIndex;
      //console.log("snapped-rescrolling:",tabindex);
      //setSectionIndex(tabindex,"scroll",function(e){
         console.log("scrolling complete:",tabindex);
         if (CB) CB(e);
      //});
    }
 
    function scrollLeft(e,cb) {
      
        console.log("left",e.type,e.detail.shiftKey,e.detail.swipeDevice);
      
        if (e.detail.shiftKey) 
          return snapLeft(e,cb);

        var count=contain.children.length,
            CB=typeof cb==='function'?cb:undefined;

        console.log("scrolling to:",tabindex+1);
        setSectionIndex(tabindex+1,"scroll",function(e){
          
            tabindex++;
            if(tabindex===count+1) {
                console.log("snapping to:",1);
                setSectionIndex(1,"snap",function(e){
                  edgeSnap(e,1,CB);
                });
            } else {
              console.log("scrolling complete:",tabindex);
              if (CB) CB(e);
            }
          
        });
      
    }
    
    function scrollRight (e,cb) {
      
      console.log("right",e.type, e.detail.shiftKey,e.detail.swipeDevice);
      if (e.detail.shiftKey) return snapRight(e,cb);
      
      var count=contain.children.length,
          CB=typeof cb==='function'?cb:undefined;
      
      
    
        console.log("scrolling to:",tabindex-1);
        setSectionIndex(tabindex-1,"scroll",function(e){
          tabindex--;
          if (tabindex===0) {
            console.log("snapping to:",count);
            setSectionIndex(count,"snap",function(e){
              edgeSnap(e,count,CB);
            });
          } else {
            console.log("scrolling complete:",tabindex);
            if (CB) CB(e);
          }
        });
       
    }

    function scrollToSect(n) {
      setSectionIndex(n,"scroll");
    }

    function snapToSect(n) {
      setSectionIndex(n,"snap");
    }

    function setEvenOdd (flipIt) {
      var addRemove     = ["add","remove"];
      var c=contain.children.length,i;
      var start =0,end=c-1;
      for (i=0;i<c;i++) {
        var el=contain.children[i],o=i%2,e=1-o;
           el.classList[addRemove[i<=start?0:1]]("first");
           el.classList[addRemove[i>=end?0:1]]("last");
           el.classList[addRemove[flipIt?o:o]](odd);
           el.classList[addRemove[flipIt?e:e]](even);
        }
    }
    
    if (options.mouse) {
     mouseSwipeEvents(contain,scrollLeft , scrollRight) ;
    }
    
    if (options.touch) {
     touchSwipeEvents(contain, scrollLeft, scrollRight);
    }
    
    setEvenOdd (false);
    /*
    for (var c=contain.children.length,i=0;i<c;i++) {
      var el=contain.children[i];
       el.classList[i===0?"add":"remove"]("first");
       el.classList[i===c-1?"add":"remove"]("last");
       el.classList.remove(even_odd[i % 2]);
       el.classList.add(even_odd[1-(i % 2)]);
    }*/


    return {
      scrollLeft   : scrollLeft,
      scrollRight  : scrollRight,
      snapLeft     : snapLeft,
      snapRight    : snapRight,
      scrollTo     : scrollToSect,
      snapTo       : snapToSect
    };

  } 
  
  function cleanupDiv(div,cls){
  // remove any top level child nodes that are not divs containing class cls
  var i=0,
      node,
      isDiv=function(x){
         return x.tagName==="DIV";
      },
      isValid=cls?function(x){return isDiv(x) && x.classList.contains(cls);}:isDiv;
  
  while (i<div.childNodes.length) { 
    node=div.childNodes[i];
    
    if (!isValid(node)) { 
      div.removeChild(node);
    } else {
      i++;
    }
  } 
  return div;
}
  
  var csstransition = function(s,mode){
    if (window.vendorPrefix) {
      csstransition=css_trans;
      return css_trans(s,mode);
    }
    return css_generic(s,mode); 
  };
  
  function css_trans(s,mode) {
     var cssTxt="transition: "+(s?s:0)+"s "+(mode?mode:"ease-in-out")+";"+eol;
    return window.vendorPrefix.css+cssTxt+cssTxt;
  }
  
  function css_generic(s,mode) {
    var prefixes = ["-webkit-","-moz-","-o-","",""];
    var cssTxt="transition: "+(s?s:0)+"s "+(mode?mode:"ease-in-out")+";"+eol;
    return prefixes.join(cssTxt);
  }
  
  function makeArray(value,len) {
    if (Array.prototype.fill) {
      return Array(len).fill(value);
    }
    var arr = new Array(len);
    for (var i = 0; i < len; i++) {
      arr[i]=value;
    }
    return arr;
 }
  
  function styleSpacing(count,width) {
    return makeArray(0,count).map(function (x,index){
       return ((1-index) * width).toString()+"px";
    });
  }
   
  function renderCssScrollRule(offsetPx,index) {
      var 
      classHeader=function (move) {
       return "."+container+ "."+move+index+" ."+contained ;
      },
      trans=" transform: translate("+offsetPx+",0);";
      return [
        classHeader("scroll") +"{" ,
        trans ,
        csstransition(speed,"ease-in-out") ,
        "}" + eol +

        classHeader("snap") +"{" ,
        trans ,
        csstransition(0.01,"ease-in-out") ,
        "}",
        ""
      ].join(eol);
  }
  
  function renderScrollCss (offsets){
   
    var count = offsets.length;
    var width_= width.toString()+"px",height_=+height.toString()+"px";
  
    
    return [
      
      
       "."+container_clip+"{",  
    
   
      (!!window.vendorPrefix) ? (
        window.vendorPrefix.css+"user-select: none;" 
   ) : [
       "-webkit-touch-callout: none;",
       "-webkit-user-select: none;",
       "-khtml-user-select: none;", 
       "-moz-user-select: none;",
       "-ms-user-select: none;" 
   ].join(eol),
      
    "user-select: none;",
  
    "overflow:hidden;",
    "width : "+width_+";",
    "height : "+height_+"; ",
    "position:absolute;",
    "top:"+top.toString()+"px;",
    "left :"+left.toString()+"px;",
    "padding:0;",
    "margin:0;",
    "}",

    "."+container+" {",
    "width: "+((count+2)*width).toString()+"px;",
    "position: absolute;",
    "left:0;",
    "top:0;",
    "padding:0;margin:0;",
    "clip: rect(0,"+width_+","+height_+",0);",
    "}",
    "."+contained+" {",
    "position: relative;",
    "display: inline-block;",
    "width:  "+width_+";",
    "height: "+height_+";",
    "margin :0;",
    "padding:0;",
    "}",

    offsets.map(renderCssScrollRule).join(eol),
    
    "."+container+".snap"+(count+1).toString()+" div.first,",
    "."+container+".scroll"+(count+1).toString()+" div.first {",
    "  position:absolute;",
    "  top:0;",
    "  left:"+(width*(count)).toString()+"px;" ,
    "  z-index:1;",
    "}",

    "."+container+".snap0 div.last,",
    "."+container+".scroll0 div.last {",
    "  position:absolute;",
    "  top:0;",
    "  left:-"+width_+";",
    "  z-index:1;",
    "}",
    ].join(eol);
  }
 
  function prependStyleSheet(newStyleSheet){
    var bodyClass = document.getElementsByTagName('head')[0];         
    bodyClass.insertBefore(newStyleSheet, bodyClass.childNodes[2]);
  }
  
  function appendStyleSheet(newStyleSheet){
     var bodyClass = document.getElementsByTagName('head')[0];         
     bodyClass.appendChild(newStyleSheet);
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
    
   
    if (window.vendorPrefix) {
      cssTxt += window.vendorPrefix.css+"user-select: none;"+eol;   
   }  else {
       cssTxt += "-webkit-touch-callout: none;"+eol;   
       cssTxt += "-webkit-user-select: none;"+eol;   
       cssTxt += "-khtml-user-select: none;"+eol;   
       cssTxt += "-moz-user-select: none;"+eol;   
       cssTxt += "-ms-user-select: none;"+eol;   
   }
     cssTxt += "user-select: none;"+eol;   
  
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
    cssTxt += "}"+eol;

    for (var index=0;index<count+2;index++) {
      cssTxt+=(eol+scrollCssElement(container,contained,width,index,speed)) ;
    }
    
    cssTxt += eol+"."+container+".snap"+(count+1).toString()+" div.first,"+eol;
    cssTxt += "."+container+".scroll"+(count+1).toString()+" div.first {"+eol;
    cssTxt += "  position:absolute;"+eol;
    cssTxt += "  top:0;"+eol;
    cssTxt += "  left:"+(width*(count)).toString()+"px;"+ eol ;
    cssTxt += "}"+eol;

    cssTxt += "."+container+".snap0 div.last,"+eol;
    cssTxt += "."+container+".scroll0 div.last {"+eol;
    cssTxt += "  position:absolute;"+eol;
    cssTxt += "  top:0;"+eol;
    cssTxt += "  left:-"+width_+";"+eol;
    cssTxt += "}"+eol;

    
    return cssTxt;
  }

  var style = document.createElement('style');
  style.type = 'text/css';
  
  var offsets = styleSpacing(maxCount,width); 
  
  //style.innerHTML = renderScrollCss (offsets);  
  
  style.innerHTML = scrollCss (container_clip,container,contained,width,height,left,top,maxCount,speed);
  appendStyleSheet(style);
 
  
  var controllers = elementIds.map(wrapContainer).filter (function(c){
    if (c===null) return false;
    c.controllers=controllers;
    return true; 
  });
  
 return controllers[0];
  



}
function scriptCheck(e,o,t,n){if("object"!=typeof window||t&&typeof window[t]===n)return!1;var r=document.getElementsByTagName("script"),s=r[r.length-1].src;return!!s.startsWith("https://"+o+"/")&&(!(e.concat([o]).indexOf(location.hostname)>=0)&&(console.error("PLEASE DON'T SERVE THIS FILE FROM "+o),console.warn("Please download "+s+" and serve it from your own server."),!0))}
})();
