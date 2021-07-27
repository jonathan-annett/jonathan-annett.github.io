/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml([],function(){ml(2,

    {
        Window: function timerManagerLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        }
    }, {
        Window: [
            ()=> timerManagerLib ()
        ]

    }

    );


    function timerManagerLib () {
        const lib = { TimerManager }  ;
        
        
        function TimerManager() {
          function HashTable() {
            var hash = {};
        
            return {
              hash: hash,
        
              setValue: function(obj, key, value) {
                if (!HashTable.uid) {
                  HashTable.uid = 0;
                }
                if (typeof obj === "string") {
                  hash[obj + "-" + key] = value;
                } else {
                  if (obj._hashId === undefined) {
                    Object.defineProperty(obj, '_hashId', {
                      enumerable: false,
                      value: HashTable.uid++
                    });
                  }
                  hash[obj._hashId + "-" + key] = value;
                }
                return value;
              },
              getValue: function(obj, key) {
                var objkey;
                if (typeof obj === "string") {
                  objkey = obj._hashId + "-" + key;
                } else {
                  if (obj._hashId !== undefined) {
                    objkey = obj._hashId + "-" + key;
                  } else {
                    return;
                  }
                }
                return hash[objkey];
              },
        
              removeValue: function(obj, key) {
                var objkey, retval;
                if (typeof obj === "string") {
                  objkey = obj + "-" + key;
                  retval = hash[objkey];
                  delete hash[objkey];
                  return retval;
                } else {
                  if (obj._hashId !== undefined) {
                    objkey = obj._hashId + "-" + key;
                    retval = hash[objkey];
                    delete hash[objkey];
                    return retval;
                  }
                }
              }
            };
          }
        
          var hash = new HashTable(),
            _handler = function(obj, timerName) {
              return function() {
                var info = hash.removeValue(obj, timerName);
                if (info) {
                  if (info.fn) {
                    info.fn();
                    delete info.fn;
                  }
                  delete info.timer;
                }
              };
            },
            cancelTimer = function(obj, timerName) {
              var info = hash.removeValue(obj, timerName);
              if (info) {
                if (info.timer) {
                  clearTimeout(info.timer);
                  delete info.timer;
                }
                if (info.fn) delete info.fn;
              }
            },
            setTimer = function(obj, timerName, msec, fn) {
              if (obj && timerName && msec && fn) {
                cancelTimer(obj, timerName);
                return hash.setValue(
                  obj,
                  timerName, {
                    fn: fn,
                    timer: setTimeout(_handler(obj, timerName), msec)
                  }
                );
              }
            },
            resetTimer = function(obj, timerName, msec, fn) {
              if (obj && timerName) {
        
                if ((msec === undefined) && (fn === undefined)) {
                  // resetTimer (obj,timerName) is alias for cancelTimer
                  return cancelTimer(obj, timerName);
                }
        
                if (msec && fn) {
                  // resetTimer with msec && fn defined is an alias for setTimer 
                  return setTimer(obj, timerName, msec, fn);
                }
        
                if (typeof msec === 'function') {
                  // resetTimer(obj,timer,function(){}) is alias for resetTimer(obj,timer,undefined,function(){})
                  fn = msec;
                  msec = undefined;
                }
        
                var info = hash.getValue(obj, timerName);
                if (info) {
                  if (msec) {
                    // resetTimer (obj,timerName,msec) extends: timeout period until msec from now
                    if (info.timer) {
                      clearTimeout(info.timer);
                      delete info.timer;
                    }
                    info.timer = setTimeout(_handler(obj, timerName), msec);
                  } else {
                    if (fn) {
                      // ,undefined,fn) swaps out the completion function
                      delete info.fn;
                      info.fn = fn;
                    }
                  }
                }
              }
        
            },
            cancelTimers = function(obj) {
              var
                kv, k, v, i,
                timers = Object.keys(hash.hash),
                filter = obj ? obj._hashId : undefined,
                l = timers.length;
              for (i = 0; i < l; i++) {
                kv = timers[i].split('-');
                if ((filter === undefined) || (filter == kv[0])) {
                  cancelTimer(kv[0], kv[1]);
                }
              }
            };
        
          return {
            cancelTimer: cancelTimer,
            setTimer: setTimer,
            resetTimer: resetTimer,
            cancelTimers: cancelTimers
          };
        }
        
        
        return lib;
    }

 

});

