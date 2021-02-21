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
      updateDragStyle,
      api,

     

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
      even_odd = [even,odd],
      odd_even = [odd,even],
      width = options.width||320,
      height = options.height||480,
      left = options.left||0,
      top = options.top||0,
      maxCount = options.maxCount|| elementIds.map(function(id){ 
        var el = getEl(id);
        return el?el.children.length:0;
      }).reduce(getMaxCount),
      spacing,
      speed = options.swipeSeconds||0.25,
      fastSpeed = options.swipeSecondsFast||false,
      wrap = typeof options.wrap ==='boolean' ? options.wrap : true;
  
      maxCount+= Math.floor(maxCount / 2);
  
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
             containerDataMeta = containerData.map(resolveElement);
             containerDataMeta.forEach(appendMetaElement); 
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
               console.log("transition complete:",contain.className,"tabindex=",tabindex,",calling cb");
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
        var trigger=function(p) {
          return x.startsWith(p) && !isNaN(x.substr(p.length)); 
        };
        
        if ( trigger("scroll") || trigger("scrollFast") || trigger("snap") ) {
           return;
        }
        
        clsName+=" "+x;
      });
      
      
      if (setMode==="snap") {
        transitionCallback=undefined;
        contain.className=clsName + ' notransition'; // Disable transitions
        contain.offsetHeight; // Trigger a reflow, flushing the CSS changes
        contain.className=clsName;
        return typeof cb==='function'?cb():cb;
      }  
      transitionCallback=cb;
      contain.className=clsName;
    }
    
    var transitions = {
      abort : function(){},
      chain : transitionScript
    };
    
    
   function resolveElement (data,index){
       var 
       vars = {},
       content = options.on_need_element(containerId,index+1,data,vars); 
       if (typeof content==='string') {
          return {el:crEl(undefined,"div",contained,content),vars:vars};
       } else {
          if (content.classList) {
             content.classList.add(contained);
          }
          return {el:content,vars:vars};
       }

    } 
    
    function fixElementOrder(){
      containerDataMeta.forEach(function(meta){
        contain.appendChild(meta.el);
       
      });
      
       if (typeof options.on_freshen_element==='function') {
            containerDataMeta.forEach(function(meta,index){
               options.on_freshen_element(
                 containerId,
                 meta.el,
                 index+1,
                 containerData[index],
                 meta.vars
               ) ; 
            });
       }
    }
    
    function appendMetaElement(meta,index) {
         contain.appendChild(meta.el);
         meta.el.id=containerId+"_tab_"+(index+1).toString();
     }
     
    function unshiftElement (data) {
      var 
       newIndex=0,
       meta=resolveElement(data,newIndex);
      
       containerDataMeta.unshift(meta);
       containerData.unshift(data);
       appendMetaElement(meta,newIndex);
       fixElementOrder();
      
       if (containerData.length>=maxCount) {
           maxCount+= Math.floor(maxCount / 8);
           api.render();
       }
       contain.classList.add('notransition');
       setDragX((mouse&&mouse.enableDragX)||(touch&&touch.enableDragX)); 
       setEvenOdd (false);
       contain.offsetHeight;
       contain.classList.remove('notransition');
       snapToSect(tabindex===1?3:1);
        
          scrollToSect(1,function (){
         
         
   
         
       });
  
    }

    
    function pushElement ( data ) {
      
       var 
       newIndex=containerData.length,
       meta=resolveElement(data,newIndex);
      
       containerDataMeta.push(meta);
       containerData.push(data);
       appendMetaElement(meta,newIndex);
      
       if (containerData.length>=maxCount) {
           maxCount+= Math.floor(maxCount / 8);
           api.render();
       }
       contain.classList.add('notransition');
       setDragX((mouse&&mouse.enableDragX)||(touch&&touch.enableDragX)); 
       setEvenOdd (false);
       contain.offsetHeight;
       contain.classList.remove('notransition');
       snapToSect(tabindex);
       scrollToSect(newIndex+1);
  
     
    }

    function popElement ( cb ) {
        if (containerDataMeta.length===0) {
          return undefined;
        }
      
        var result = {};
      
        scrollToSect(containerDataMeta.length,function(){
          
            result.meta = containerDataMeta.pop();
            contain.removeChild(result.meta.el);
            result.data = containerData.pop(); 
            setDragX((mouse&&mouse.enableDragX)||(touch&&touch.enableDragX)); 
            setEvenOdd (false);
     
          
           
            scrollToSect(containerDataMeta.length);
          
            if (typeof cb==='function') {
               cb(result);
             }
           
      
        });
        
       
        return result;
    }
    
    function shiftElement (cb) {
       if (containerDataMeta.length===0) {
          return undefined;
        }
      
        var result = {};
      
        scrollToSect(1,function(){
          
            result.meta = containerDataMeta.shift();
            contain.removeChild(result.meta.el);
            fixElementOrder();
            result.data = containerData.shift(); 
            setDragX((mouse&&mouse.enableDragX)||(touch&&touch.enableDragX)); 
            setEvenOdd (false);
            
            scrollToSect(1);
           

            if (typeof cb==='function') {
             cb(result);
            }

      
        });
        
       
        return result;
    }

    
  
    function getElement ( index ) {
       return {
         meta : containerDataMeta[index],
         data : containerData[index]
       };
    }

    function setElement ( index, el ) {

    }
 
    
    function indexFromClassName(x) {
       var result;
       if (x.className.split(' ').some(function(c){
         if (c.startsWith('snap')) {
           result=Number(c.substr(4));
           return !isNaN(result);
         }
         if (c.startsWith('scrollFast')) {
           result=Number(c.substr(10));
           return !isNaN(result);
         }
         if (c.startsWith('scroll')) {
           result=Number(c.substr(6));
          return !isNaN(result);
         }
       }))
         return result;
      return false;
    }
    
    function transitionScript(cmds,cb) {
      
      var CB=cb,
          moves = cmds.map(function(cmd){return Object.keys(cmd)[0]}),
          indexes = cmds.map(function(cmd,ix){
            return cmd[moves[ix]];
          }),
          classes= moves.map(function(mov,ix){return mov+indexes[ix].toString();}),
          limit = cmds.length,
          player = function(index,e) {
             var mov=moves[index],
                 ix=indexes[index];
            
             /*if (mov==="snap") {
                var snapClass='snap'+ix
                if ( contain.classList.contains(snapClass) ) {
                   return player(index+1,e);
                }
               
                if (indexFromClassName(contain)===ix) {
                  contain.classList.add('notransition');
                  contain.classList.remove('scroll'+ix);
                  contain.classList.remove('scrollFast'+ix);
                  contain.classList.add(snapClass);
                  contain.offsetHeight; // Trigger a reflow, flushing the CSS changes
                  contain.classList.remove('notransition');
                  return player(index+1,e);
               }
               
             }*/
            
            
             if (index<limit) {
               
                setSectionIndex(ix,mov,function(e){
                   tabindex=ix;
                   player(index+1,e);
                });
               
             } else {
               if (typeof CB==='function') CB(e);
               
               
             }
          };
          console.log(JSON.stringify({transitionScript:classes}));
          player(0);
         
          var self = {
           abort : function () {
             CB=undefined;
             limit=-1;
             transitions = {
               abort : function(){},
               chain : transitionScript
             };
           },
           chain : function(newcmds,newcb) {
             CB=function(){
               CB=undefined;
               limit=-1;
               var newSelf = transitionScript(newcmds,newcb);
               self.abort=newSelf.abort;
               self.chain=newSelf.chain;
             };
           }
         };
          return self;
          
    }

    function snapLeft(cb) {
      
      var count = contain.children.length,
          CB = typeof cb==='function'?cb:undefined;
      
      
      if (tabindex >= count)  {
         if(wrap) {
           tabindex=1;
         } else {
           tabindex = count;
         }
        } else {
           tabindex++;
      }
      transitions.abort();
      transitions.chain([{snap:tabindex}],function(e){
           updateDragStyle(tabindex);
           notifySelected(tabindex);
           if (CB) CB(e);
      });
    }
    
    function snapRight(cb) {
      var count=contain.children.length,
          CB = typeof cb==='function'?cb:undefined;
      
       if (tabindex < 1)  {
         if(wrap) {
            tabindex=count;
         } else {
            tabindex = 1;
         }
         
      } else {
        tabindex--;
      }
     transitions.abort();
     transitions.chain([{snap:tabindex}],function(e){
           updateDragStyle(tabindex);
           notifySelected(tabindex);
           if (CB) CB(e);
      });
         
    }

    
    var last_meta_selected,last_index_selected;
    
    function notifySelected(tabindex) {
      if ((tabindex<=0) || (tabindex>contain.children.length)) return;
      if ((typeof options.on_element_deselected === 'function') && (last_index_selected!==undefined)) {
         options.on_element_deselected(
           containerId,
           last_meta_selected.el,
           last_index_selected,
           containerData[last_index_selected-1],
           last_meta_selected.vars
         ) ;
        
      } 
      var meta = containerDataMeta[tabindex-1];
      if (typeof options.on_element_selected === 'function') {
         options.on_element_selected(
           containerId,
           meta.el,
           tabindex,
           containerData[tabindex-1],
           meta.vars
         ) ;
      }
      last_meta_selected=meta;
      last_index_selected=tabindex;
    }
 
    function scrollLeft(e,cb) {
       
         if (e.detail.shiftKey) 
             return snapLeft(e,cb);
       var velocity = e.detail.swipeVelocity;
        var suffix = e.detail.ctrlKey||velocity>1.5 ? "Fast" :"";
        //console.log("left",e.type, suffix ,velocity, e.detail.swipeDevice);
     
        var count=contain.children.length,
            CB_= typeof cb==='function'?cb:undefined,
            CB=function(e) {
               updateDragStyle(tabindex);
               notifySelected(tabindex);
               if (CB_) CB_(e);
            };
      console.log({scrollLeft:tabindex});
      transitions.abort();
      switch (tabindex) {
        case 0 :
            if (wrap) {
               
                return  transitions.chain([
                {scroll:1},
                {snap:1},
                {scroll:1}
              ],CB);
            } else {
              return  transitions.chain([
                  {snap:0},
                  {snap:count},
                  {scroll:count},
              ],CB);
            }
        case count:
          if (wrap) {
             return  transitions.chain([
               {snap:0},
                {scroll:1}
              ],CB);
          } else {
              return  transitions.chain([
               {snap:count},
               {scroll:count}              
              ],CB);
          }
        case count+1:
          if (wrap) {
             return  transitions.chain([
                {snap:0},
                {scroll:1}
              ],CB);
          } else {
             return   transitions.chain([
               {snap:count},
               {scroll:count}              
              ],CB);
          }
       default:
           tabindex++;
           transitions.chain([
             {scroll:tabindex},
           ],CB);
      }
        
 
      
    }
    
    function scrollRight (e,cb) {
      
     
       if (e.detail.shiftKey) return snapRight(e,cb);
      var velocity = e.detail.swipeVelocity;
      var suffix = e.detail.ctrlKey||velocity>1.5 ? "Fast" :"";
      
      //console.log("right",e.type,  suffix, velocity, e.detail.swipeDevice);
     
      var count=contain.children.length,
          CB_= typeof cb==='function'?cb:undefined,
            CB=function(e) {
               updateDragStyle(tabindex);
               notifySelected(tabindex);
               if (CB_) CB_(e);
            };
      
      console.log({scrollRight:tabindex});
      transitions.abort();
      switch (tabindex) {
        case 0 :
          if (wrap) {
              return transitions.chain([
                {snap:count+1},
                {scroll:count}
              ],CB);
          } else {
              return  transitions.chain([
                {snap:1},
                {scroll:1}
              ],CB);
          }
          break;
        case 1 :
           if (wrap) {
              return transitions.chain([
                {snap:count+1},
                {scroll:count}
              ],CB);
          } else {
              return  transitions.chain([
                {snap:1},
                {scroll:1}
              ],CB);
          }
        
        case count+1:
           if (wrap) {
             return  transitions.chain([
                {scroll:count},
               ],CB);
          } else {
           return     transitions.chain([
                {snap:1},
                {scroll:1}
              ],CB);
          }
          break;
        default:
           tabindex--;
          return transitions.chain([
             {scroll:tabindex},
           ],CB);
      }

      
      
   
    }

    function scrollToSect(n,cb) {
      setSectionIndex(n,"scroll",function(){
         tabindex=n;
         updateDragStyle(tabindex);
         notifySelected(tabindex);
         if(typeof cb==='function') cb();
      });
    }

    function snapToSect(n,cb) {
      setSectionIndex(n,"snap",function(){
         tabindex=n;
         updateDragStyle(tabindex);
         notifySelected(tabindex);
          if(typeof cb==='function') cb();
      });
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
    
    function setDragX(enabled) {
      var addRemove     = ["add","remove"];
      var c=contain.children.length,i;
      var start =0,end=c-1;
      for (i=0;i<c;i++) {
        var el=contain.children[i],o=i%2,e=1-o;
           el.classList[addRemove[enabled?0:1]]("drag_x");
          
         
        }
    }
    var mouse;
    if (options.mouse) {
      mouse  = mouseSwipeEvents(contain,scrollLeft , scrollRight) ;
      mouse.xDragGranularity = options.xDragGranularity|| window.xDragGranularity;
      mouse.yDragGranularity = options.yDragGranularity|| window.yDragGranularity;
      mouse.enableDragX = !!mouse.xDragGranularity;
      mouse.enableDragY = !!mouse.yDragGranularity;
    }
    var touch;
    if (options.touch) {
      touch=touchSwipeEvents(contain, scrollLeft, scrollRight);
      touch.xDragGranularity = options.xDragGranularity|| window.xDragGranularity;
      touch.yDragGranularity = options.yDragGranularity|| window.yDragGranularity;
      touch.enableDragX = !!touch.xDragGranularity;
      touch.enableDragY = !!touch.yDragGranularity;
    }
    
    setDragX((mouse&&mouse.enableDragX)||(touch&&touch.enableDragX)); 
    
    setEvenOdd (false);
    
    notifySelected(1);
 
  
    
    

    return {
      //meta         : containerDataMeta,
      scrollLeft   : scrollLeft,
      scrollRight  : scrollRight,
      snapLeft     : snapLeft,
      snapRight    : snapRight,
      scrollTo     : scrollToSect,
      snapTo       : snapToSect,
      
      push         : pushElement,
      unshift      : unshiftElement,
      
      pop          : popElement,
      shift        : shiftElement,
      
      
      getElement   : getElement,
      setElement   : setElement
      
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
  
  function prependStyleSheet(newStyleSheet){
    var bodyClass = document.getElementsByTagName('head')[0];         
    bodyClass.insertBefore(newStyleSheet, bodyClass.childNodes[2]);
  }
  
  function appendStyleSheet(newStyleSheet){
     var bodyClass = document.getElementsByTagName('head')[0];         
     bodyClass.appendChild(newStyleSheet);
  }

  function scrollCssElement(container,contained,width,index,speed,suffix) {
    var suffixTxt=suffix?suffix:"";
    return (
      "."+container+ ".scroll"+suffixTxt+index+" ."+contained+ "{"+eol+
      " transform: translate("+  (width*(1-index)).toString()+"px,0);"+ eol +
      csstransition(speed,"ease-in-out") + eol +
      "}" + eol +
     (
         suffix ? "" : (
        "."+container+ ".snap"+index+" ."+contained+ "{"+eol+
        " transform: translate("+  (width*(1-index)).toString()+"px,0);"+ eol +
      //  csstransition(0.01,"ease-in-out") + eol +
        "}" ) 
     )
    );
    
  }
  

  function scrollCss (container_clip,container,contained,width,height,left,top,count,speed,fastSpeed){
    
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
    cssTxt += "width:"+width_+";"+eol;
    cssTxt += "height:"+height_+"; "+eol;
    cssTxt += "position:absolute;"+eol;
    cssTxt += "top:"+top.toString()+"px;"+eol;
    cssTxt += "left:"+left.toString()+"px;"+eol;
    cssTxt += "padding:0;"+eol;
    cssTxt += "margin:0;"+eol;
    cssTxt += "}"+eol;

    cssTxt += "."+container+" {"+eol;
    cssTxt += "width:"+((count+2)*width).toString()+"px;"+eol;
    cssTxt += "position: absolute;"+eol;
    cssTxt += "left:0;"+eol;
    cssTxt += "top:0;"+eol;
    cssTxt += "padding:0;margin:0;"+eol;
    cssTxt += "clip:rect(0,"+width_+","+height_+",0);"+eol;
    cssTxt += "}"+eol;
    cssTxt += "."+contained+" {"+eol;
    cssTxt += "position:relative;"+eol;
    cssTxt += "display:inline-block;"+eol;
    cssTxt += "width:"+width_+";"+eol;
    cssTxt += "height:"+height_+";"+eol;
    cssTxt += "margin:0;"+eol;
    cssTxt += "padding:0;"+eol;
    cssTxt += "}"+eol;

    for (var index=0;index<count+2;index++) {
      cssTxt+=(eol+scrollCssElement(container,contained,width,index,speed)) ;
    }
    if (fastSpeed) {
         for (var index=0;index<count+2;index++) {
          cssTxt+=(eol+scrollCssElement(container,contained,width,index,fastSpeed,"Fast")) ;
      }
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
  
   function xcls(x) {
      var d = x<0?"left_":"right_",X = x<0?0-x:x;  
      return "drag_"+d+X.toString();
    }
  
   function ycls(y) {
      var d = y<0?"up_":"down_",Y = y<0?0-y:y;  
      return "drag_"+d+Y.toString();
    }

  function dragXCss(fromX,toX,step,left) {
    var csstext = "";
    for(var x = fromX;x<=toX;x+=step ) {
      csstext += "div.container_clip."+xcls(x)+" div.container div.contained.drag_x {"+eol;
      csstext += " transform: translate("+(left+x).toString()+"px,0px);"+eol;
      csstext += "}"+eol+eol;
    }
    return csstext;
  }
  
  var 
  scrollStyle = document.createElement('style'),
  dragStyle   = document.createElement('style'),
  render = function (){
    scrollStyle.innerHTML = scrollCss (container_clip,container,contained,width,height,left,top,maxCount,speed,fastSpeed);
  };
  updateDragStyle=function(index){
  var
    xGranularity=window.xGranularity||10,
    dragWidth= Math.ceil(width/xGranularity)*xGranularity;
    dragStyle.innerHTML   = dragXCss(-dragWidth,+dragWidth,xGranularity,(0-(index-1))*width);
  };
  
  api = {
    
    render:render,
    
    setWidth : function(aWidth) {
       width=aWidth;
       render();
    },
    
    setSpeed : function (aSpeed) {
      speed=aSpeed;
       render();
    }
    
  };
  
  scrollStyle.type = 'text/css';
  dragStyle.type   = 'text/css';
 
  api.setWidth(width);
  updateDragStyle(1);
  appendStyleSheet(scrollStyle); 
  appendStyleSheet(dragStyle); 
  
  var controllers = elementIds.map(wrapContainer).filter (function(c){
    return (c!==null); 
  });

  controllers.forEach(function(c){
    c.styleRules=api;
  });
  
 return controllers[0];
  
}
function scriptCheck(e,o,t,n){if("object"!=typeof window||t&&typeof window[t]===n)return!1;var r=document.getElementsByTagName("script"),s=r[r.length-1].src;return!!s.startsWith("https://"+o+"/")&&(!(e.concat([o]).indexOf(location.hostname)>=0)&&(console.error("PLEASE DON'T SERVE THIS FILE FROM "+o),console.warn("Please download "+s+" and serve it from your own server."),!0))}
})();
