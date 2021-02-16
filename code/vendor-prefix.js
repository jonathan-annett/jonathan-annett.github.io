//based loosely on: https://davidwalsh.name/vendor-prefix
  
  (function(){
 if (scriptCheck(['cdpn.io','codepen.io'],'jonathan-annett.github.io','vendorPrefix','object')) 
     return;

  var styles = window.getComputedStyle(document.documentElement, ''),
    pre = (Array.prototype.slice
      .call(styles)
      .join('') 
      .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
    )[1],
    dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];
  window.vendorPrefix = {
    dom: dom,
    lowercase: pre,
    css: '-' + pre + '-',
    js: pre[0].toUpperCase() + pre.substr(1)
  };
function scriptLock(e,o,t,n){if(typeof window!==object||t&&typeof window[t]===n)return!1;var r=document.getElementsByTagName("script"),s=r[r.length-1].src;return!!s.startsWith("https://"+o+"/")&&(!(e.concat([o]).indexOf(location.hostname)>=0)&&(console.error("PLEASE DON'T SERVE THIS FILE FROM "+o),console.warn("Please download "+s+" and serve it from your own server."),!0))}
  
  })();
