
/* global ml,self */
ml(0,ml(1),[],function(){ml(2,ml(3),ml(4),

    {
        Window:                   function libEvents(lib) {return libEventManager;},
        ServiceWorkerGlobalScope: function libEvents(lib) {return libEventManager;},
    }, (()=>{  return{
        Window:                   [],
        ServiceWorkerGlobalScope: [],
    };

    })()

    );
    
    function libEventManager (lib,evs) {    
          
          const cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);
                  
          
          const libEvents = {
              
          };
          if (Array.isArray(evs)) {
              evs.forEach(addLibEventType)
          }
          
          const Hysteresis={};   
          
          Object.defineProperties(lib,{
               addLibEvent                : readOnlyValue(addLibEvent),
               removeLibEvent             : readOnlyValue(removeLibEvent),
               on                         : readOnlyValue(addLibEvent),
               off                        : readOnlyValue(removeLibEvent),
               addEventListener           : readOnlyValue(addLibEvent),
               removeEventListener        : readOnlyValue(removeLibEvent),
               emitLibEvent               : readOnlyValue(emitLibEvent),
               emitLibEventwithHysteresis : readOnlyValue(emitLibEventwithHysteresis),
               addLibEventType            : readOnlyValue(addLibEventType),
               removeLibEventType         : readOnlyValue(removeLibEventType),
               removeAllEventTypes        : readOnlyValue(removeAllEventTypes),
               events                     : readOnlyValue(libEvents),
          });
          
          return lib;
          
          
          
          
          function addLibEventType(e) {
              if (typeof e==='string') {
                  const fns = libEvents[e];
                  if (!Array.isArray(fns)) {
                      libEvents [e] = [];
                  }
              }
              
          }
          
          function removeLibEventType(e) {
              libEvents [e] = [];
              
              if (typeof e==='string') {
                  const fns = libEvents[e];
                  if (Array.isArray(fns)) {
                      fns.splice(0,fns.length);
                  }
              }
          }
          
          function removeAllEventTypes () {
              Object.keys(libEvents).forEach(removeLibEventType);
          }
          
          // add a handler for THIS window - move,size,minimized,maximized, restored, fulscreen(true/false),state, closed
          function addLibEvent (e,fn) {
              if (typeof e+typeof fn==='stringfunction') {
                  const fns = libEvents[e];
                  if (Array.isArray(fns)) {
                      if ( fns.indexOf(fn) < 0 ) {
                          fns.push(fn);
                      }
                  }
              }
          }
          
          // remove previously added handler for THIS window
          function removeLibEvent (e,fn) {
             if (typeof e+typeof fn==='stringfunction') {
                 const fns = libEvents[e];
                 if (Array.isArray(fns)) {
                     const ix = fns.indexOf(fn);
                     if (ix >=0 ) {
                        fns.splice(ix,1);
                     }
                 }
             }
          }
          
          // emit an event for this window
          function emitLibEvent (e) {
              if (typeof e==='string') {
                  const fns = libEvents[e], args = cpArgs(arguments,1);
                  if (Array.isArray(fns)) {
                      fns.forEach(function(fn) {
                          fn.apply(this,args);
                      });
                  }
              }
          }
          
          // emit an event for this window, after h msec (replaces any pending events issued via emitLibEventwithHysteresis() for "e")
          function emitLibEventwithHysteresis (h,e) {
              if (typeof e==='string') {
                  const fns = libEvents[e];
                  if (Array.isArray(fns)) {
                      
                      if (Hysteresis[e]) {
                          clearTimeout(Hysteresis[e]);
                      }
                      const args = cpArgs(arguments,2);
                      Hysteresis[e] = setTimeout(
                        function () {
                            delete Hysteresis[e];
                            fns.forEach(function(fn) {
                                fn.apply(this,args);
                            });
                        },h);
                  }
              }
          }
              
              
          function readOnlyValue(v) {
              return {
                          value        : v,
                          writable     : false,
                          enumerable   : true,
                          configurable : true,
              };
          }
      
      }

});





