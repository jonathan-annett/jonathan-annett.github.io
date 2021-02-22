(function({
classAnimations(window,console); 
 
   if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      "classAnimations",
      "function"
    )
  )
    return;
   
window.classAnimations=classAnimations;
 
function classAnimations(w,console) {
  
    if (!console) {console={log:function(){}};} 
    function getEl(el) {
      return document.getElementById(el);
    }
    var 
    EOL="\n",
    ON='addEventListener',
    OFF='removeEventListener',
    notrans='notransition';
  
    function appendStyleSheet(newStyleSheet){
       var bodyClass = document.getElementsByTagName('head')[0];         
       bodyClass.appendChild(newStyleSheet);
    }

  
    function customXYTranslate(cls,X,Y,time){ 
      
      var rule = document.createElement('style');
      rule.type = 'text/css';
      
      var transform_text= 'transform: translate('+X.toString()+'px, '+Y.toString()+'px);';

      rule.innerHTML = 
        '.'+cls+'Snap {'+
        transform_text+EOL+
        '-webkit-transition: none !important;'+EOL+
        '-moz-transition: none !important;'+EOL+
        '-o-transition: none !important;'+EOL+
        'transition: none !important;'+EOL+
        '}'+EOL+
        '.'+cls+'Trans {'+EOL+
        transform_text+EOL+
        'transition : '+time.toString()+'s ease-in;'+ EOL+
        '}'+EOL;

      appendStyleSheet(rule);
      return rule;
    }
  
    var customs={};
  
    function translate(x,y,time) {
      
 
        var 
        cls="c"+x.toString(36)+time.toString().split('.').join('_'),
        c = customs[cls];
        if (!c) {
           customs[cls]=customXYTranslate(cls,x,y,time||1) ;
        }
        return cls; 
   
      
    }

    function sleep(el,msec,cb,inscript) {
        var ts = Date.now();
        el = typeof el==='object'?el:getEl(el);
        if (inscript)
            ts = el.dataset.ts
        else
            el.dataset.ts=ts;

        var prev = el.dataset.current; 
        console.log("sleep",msec,"msec"," on ",prev);
        delete el.dataset.currentName; 
        setTimeout(function(){
           if (ts==el.dataset.ts) {
             el.dataset.currentName=prev;
             if (typeof cb==='function') cb(el,prev,prev);
           }
        },msec);
    }

    function snap(el,name,cb,inscript) {
        var ts = Date.now();
        el = typeof el==='object'?el:getEl(el);
        if (!inscript)
            el.dataset.ts=ts;

      var clsname = name+"Snap";
      el.classList.add(notrans);
      var prev = el.dataset.current;
      console.log("snap",prev,"-->",clsname);
      if (prev) 
         el.classList.remove(prev);
      el.classList.add(clsname);
      el.dataset.current=clsname;
      el.classList.remove(notrans); 
      el.offsetHeight; // Trigger a reflow, flushing the CSS changes
      el.dataset.currentName=name;
      if (typeof cb==='function')  cb(el,clsname,prev)
    }

    function transition(el,name,cb,inscript) {
        var ts = Date.now();
        el = typeof el==='object'?el:getEl(el);
        if (inscript)
            ts = el.dataset.ts
        else
            el.dataset.ts=ts;
      var clsname = name+"Trans";

      el.classList.add(notrans);
      var prev = el.dataset.current;
      if (el.dataset.currentName===name) {
        console.log("skipping:transition",prev,"-->",clsname);
        return (typeof cb==='function') ? cb (el,prev,prev):cb;
      }
      console.log("transition",prev,"-->",clsname);
      if (prev) 
         el.classList.remove(prev);
      el.dataset.current=clsname;
      delete el.dataset.currentName; 
      var ev;
      el[ON]('transitionend',(ev=function(){
        el[OFF]('transitionend',ev);
        el[OFF]('transitioncancel',ev);
        if (ts==el.dataset.ts) {
          el.dataset.currentName=name;
          if (typeof cb==='function') {
            cb(el,clsname,prev)
          }
        }
      }));
      el[ON]('transitioncancel',ev);

      el.classList.remove(notrans);
      el.classList.add(clsname);


    }

    function exec(el,fn,cb,inscript) {
        var ts = Date.now();
        el = typeof el==='object'?el:getEl(el);
        if (inscript)
            ts = el.dataset.ts
        else
            el.dataset.ts=ts;

        var prev = el.dataset.current; 

        delete el.dataset.currentName; 

        var args = fn.args||[];

        fn = typeof fn==='function'?fn:fn.fn;

        var 
        contin_timer,
        contin = function(){
           if (contin_timer) {
             clearTimeout(contin_timer);
              contin_timer = undefined;
           }
           if (ts==el.dataset.ts) {
             el.dataset.currentName=prev;
             if (typeof cb==='function') cb(el,prev,prev);
           }
        };

        if (typeof fn==='function') {
           contin_timer=setTimeout(contin,5000);
           console.log("exec",fn.name,args);
           args.push(contin); 
           args.unshift(el.dataset.current);
           args.unshift(el);

           fn.apply(this,args);
        } else {
           contin_timer=setTimeout(contin,1);
        }
    }

    function script (el,scr,cb) {
      el = typeof el==='object'?el:getEl(el);

      var  ts=Date.now(), ix=0,cmds = [], prev = el.dataset.current;

      el.dataset.ts=ts;

      while (ix<scr.length) {
         cmds.push(
            {
              fn   : scr[ix],
              name : scr[ix+1]
            }
         );
        ix+=2;
      }

      var exec = function (cmd) {

        cmd.fn(el,cmd.name,function(){
          if (el.dataset.ts!=ts) return;

          if (cmds.length===0) {
            delete el.dataset.ts;
            return typeof cb==='function'?cb (el,el.dataset.current,prev):cb;
          } 
          exec(cmds.shift()); 
        },true);

      };

      exec(cmds.shift()); 


    }

   
  if (w) {
      w.sleep=sleep;
      w.snap=snap;
      w.transition=transition;
      w.exec=exec;
      w.translate=translate;
      w.script=script;
  }
  
  return {
    sleep:sleep,
    snap:snap,
    transition:transition,
    exec:exec,
    translate:translate,
    script:script,
    get:function(cb) {
       cb(sleep,snap,transition,exec,translate,script);
    } 
  }
}

function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
      s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      (!(e.concat([o]).indexOf(location.hostname) >= 0) &&
        (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
        console.warn(
          "Please download " + s + " and serve it from your own server."
        ),
        !0))
    );
  }

})();
