(function (functionName) {
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

  if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      functionName,
      "function"
    )
  )
    return;
  
  window[functionName]=elementResizeWatcher;
  
  function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
      s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      !(e.concat([o]).indexOf(location.hostname) >= 0) &&
      (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
      console.warn(
        "Please download " + s + " and serve it from your own server."
      ),
      !0)
    );
  }
  
   function elementResizeWatcher(element, callback) {

    var
    resolve=function(element) {
      return (typeof element==='string' 
              ?  document[  
        ['.','#'].indexOf(element.charAt(0)) < 0 ? "getElementById" : "querySelector"
      ] (element) 
              : element);
    },
        observer,
        watched = [], 
        checkForElementChanges = function (data) {
          var w=data.el.offsetWidth,h=data.el.offsetHeight;
          if (
            data.offsetWidth  !== w ||
            data.offsetHeight !== h
          ) {
            data.offsetWidth  = w;
            data.offsetHeight = h;
            data.cb({
              target : data.el,
              width  : w,
              height : h
            });
          }
        },

        checkForChanges=function(){
          watched.forEach(checkForElementChanges);
        },
        started=false,
        self = {

          start: function () {

            if (!started) {

              // Listen to the window resize event
              window.addEventListener("resize", checkForChanges);

              // Listen to the element being checked for width and height changes
              observer = new MutationObserver(checkForChanges);
              observer.observe(document.body, {
                attributes: true,
                childList: true,
                characterData: true,
                subtree: true
              });

              started=true;
            }
          },
          stop : function ( ) {
            if (started) {
              window.removeEventListener('resize', checkForChanges);
              observer.disconnect();
              started = false;
            }
          },
          addListener : function (element,callback) {

            if (typeof callback!=='function') 
              return;

            var el = resolve(element);
            if (typeof el==='object') {
              watched.push({
                el           : el,
                offsetWidth  : el.offsetWidth,
                offsetHeight : el.offsetHeight,
                cb           : callback
              });
            }
          },

          removeListener : function (element,callback) {
            var 
            el = resolve(element);
            watched = watched.filter(function(data){
              return !((data.el===el) && (data.cb===callback));
            });
          }
        };

    self.addListener(element,callback);

    self.start();

    return self;
  }
  
})("elementResizeWatcher");
