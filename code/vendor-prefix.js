//based loosely on: https://davidwalsh.name/vendor-prefix
  
  (function(){
 if (scriptLock(['cdpn.io','codepen.io'],'jonathan-annett.github.io') || 
     (typeof window!=='object') ||  (typeof window.vendorPrefix!=='undefined') )
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
   function scriptLock(domain,offsite){
    var scripts = document.getElementsByTagName('script');
    var src = scripts[scripts.length - 1].src; 
    if (!src.startsWith('https://'+offsite+'/')) return false;
    if (domain.indexOf(location.hostname)>=0) return false;
    console.error("PLEASE DON'T SERVE THIS FILE FROM "+offsite);
    console.warn('Please download '+src+' and serve it from your own server.');
    return true;
  }
})();
