

/* global self, importScripts, caches ,registration,clients ,Response, localforage,cacheName,zedMessage,

   windowCmd, workerCmd

*/    
function zed_pwa_faux_background() {
    var api = {};
    var wtools = windowTools();
   


var openProjects = {}, ignoreClose = false;

function windowTools() {

        var On='addEventListener';
        
        function windowId() {
            return[
             Math.random,
             function (){ return (windowId.last ? windowId.last + Math.random() : Math.random() ) },
             Math.random,
             Date.now,
             Math.random
            ].map(function(fn){
                return fn().toString(36).substr(-4);
            }).join('_');
        }
        
        function on_window_close_poller (w,fn, interval) {
            if (w.closed) return fn();
            interval = interval || 500;
            setTimeout(on_window_close_poller, interval, w, fn, interval);
        }
        
        function on_window_close(w, fn) {
          if (typeof fn === "function" && w && typeof w === "object") {
            setTimeout(function() {
              if (w.closed) return fn(w);
        
              try {
                w[On]("beforeunload", function(){fn(w);});// this will throw for cross domain windows
              } catch (err) {
                on_window_close_poller(w,fn,500);
              }
            }, 1000);
          }
        }
        
        function on_window_open_poller (w,fn, interval) {
            if (w.closed) return ;
            
            if (w.length>1) {
                return fn (w);
            }
            if (interval) {
                return setTimeout(fn, interval, w);   
            }
            return setTimeout(on_window_open_poller, 400, w, fn, 1500);
        }
        
        function on_window_open(w, fn) {
          if (typeof fn === "function" && w && typeof w === "object") {
            
            try {
              w[On]("load", function(){fn(w);});// this will throw for cross domain windows
            } catch (err) {
              //wait until 1 subfram exiss or 2 seconds, whatever happens first
              setTimeout(on_window_open_poller, 100, w, fn);
            }
          }
        }
        
        function on_window_move (w,fn) {
          
           if (typeof fn === "function" && w && typeof w === "object") {
            try {
              
              var
              last_top=w.screenY,last_left=w.screenX,
              check = function(){
                 if(last_left != w.screenX || last_top != w.screenY){
                    last_left = w.screenX;
                    last_top = w.screenY; 
                    fn(last_left,last_top);
                   }
              },
              interval = setInterval(check,500);
              w[On]("resize", check);
              w[On]("focus", check);
              w[On]("blur", check);
              w.cancel_on_window_move = function(){
                 if (interval) clearTimeout(interval);
                 interval=undefined;
                 w.removeEventListener("resize", check);
                 w.removeEventListener("focus", check);
                 w.removeEventListener("blur", check);
              };
              
            } catch (err) {
               
            }
          }
        }
        
        function on_window_size(w,fn) {
            if (typeof fn === "function" && w && typeof w === "object") {
                try {
                  w[On]("resize", function(){
                    fn(w.outerWidth,w.outerHeight);
                  });
                } catch (err) {
                  console.log(err);
                }
              }  
        }
        
        function open_window(
          url,
          name,
          left,
          top,
          width,
          height,
          size,
          onClosed,
          onOpened
        ) {
          
          var pos = open_window.pos_cache[ name ];
          
          if (pos) {
             left= pos.left || left;
             top=  pos.top || top;
            } else {
            pos = {
              left:left,
              top:top
              };
            open_window.pos_cache[name] = pos;
          } 
            
           var opts =
              "toolbar=no, menubar=no, location=no, resizable=" +
              (size ? "yes" : "no") +
              "scrollbars=" +
              (size ? "yes" : "no") +
              ", top=" +
              top.toString() +
              ",left=" +
              left.toString() +
              ", width=" +
              width.toString() +
              ", height=" +
              height.toString(),
              
            // if a name is specified, use that, otherwise make up a random name
            w = window.open(url, name||"w_"+windowId(), opts);
            
            // if a name was specified, and it was reactivated instead of opened, it will be located 
            // by getWindowId(w), otherwise, make up a new window id
            const opened_id = getWindowId(w)||windowId();
            open_window.open_windows[opened_id]={
                win:w,
                lastTouch : Date.now()
            }; 
            if (w) {
              on_window_open  (w,onOpened);
              on_window_close (w,onClosed);
            }
            
            try {
                w.wid = wid;
            } catch (e) {
                // this will fail if the window is cross origin.
            }
           
            return w;// return then actual window.
        }
        
        open_window.pos_cache = {};
        open_window.open_windows = {};
        
        function getWindowId(w){
            
            let cross_origin=false;
            try {
                const wid = w.wid;
                if (typeof wid==='string') {
                    return wid;
                }
            } catch ( e ) {
                cross_origin = true;
                // cross origin 
            }
            
            // ok so do it the hard way
            return Object.keys(open_window.open_windows).find(function(wid){
                  if ( open_window.open_windows[wid].win===w ) {
                    
                     if (!cross_origin) {
                         try {
                             // cache it for next time
                             w.wid=wid;
                         } catch (e) {
                             
                         }
                     }
                     
                     return w; 
                  }
             });
        }
        
        var events = {
            open  : [],
            close : []
        };
        
        
        return {
            open : function (url,
                             name,
                             left,
                             top,
                             width,
                             height,
                             size) {
                let w = open_window(
                  url,
                  name,
                  left,
                  top,
                  width,
                  height,
                  size,
                  function (w){
                      const wid = getWindowId(w)
                      events.closed.forEach(function(fn){
                          fn(w,wid);
                      });
                      delete open_window.open_windows[wid];
                  } ,
                  function (w){
                      const wid = getWindowId(w);
                      events.open.forEach(function(fn){
                          fn(w,wid);
                      });
                  } 
                );
                
               return getWindowId(w);
            },
            
            getWindow : function(wid) {
                return open_window.open_windows [wid];
            },
            
            on : function (e,fn) {
                const handlers = events[e];
                if (typeof e==='string'&& Array.isArray(handlers) && typeof fn==='function') {
                    handlers.push(fn);
                }
            },
            off : function (e,fn) {
                  const handlers = events[e];
                  if (typeof e==='string'&& Array.isArray(handlers) && typeof fn==='function') {
                      let i = handlers.indexOf(fn);
                      while (i>=0) {
                          handlers.splice(i,1);
                          i = handlers.indexOf(fn);
                      }
                  }
              }
        }

}

windowCmd(
    'openEditor',['title', 'url', 'urlPostfix'],
    function workerCode( replies, resolve, reject, send, id, 
/* --args-->*/ sw_progress ){

        
      
    },
    function pageCode(msg,resolve,reject,reply) {
        
        let { title,url,urlPostfix } = msg;
        urlPostfix = urlPostfix || "";
  
        
            
        var wid = wtools.open (
          '/zed?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title) + urlPostfix, 
          undefined,
          0,
          0,
          1024,
          768,
          true
        );
        
        resolve ({wid:wid});
          
    },
    
    true
);     
      
    

windowCmd(
    'showWindow',[],
    function workerCode( replies, resolve, reject, send, id, 
/* --args-->*/ sw_progress ){


    },
    function pageCode(msg,resolve,reject,reply) {
        
        openEditor({ title:"Zed",url:""});
   
        
    },
    
    true
);     
     

windowCmd(
    'openProject',['title', 'url'],
    function workerCode( replies, resolve, reject, send, id, 
/* --args-->*/ sw_progress ){


    },
    function pageCode(msg,resolve,reject,reply) {
        
        let { title,url } = msg;
        
       
        
        if (openProjects[url]) {
            var win = openProjects[url].win;
            win.focus();
            win.contentWindow.zed.services.editor.getActiveEditor().focus();
        } else {
        
            openEditor({ title:title,url:url });
        }
   
        
    },
    
    true
);     
     
windowCmd(
    'registerWindow',['title', 'url', 'win'],
    function workerCode( replies, resolve, reject, send, id, 
/* --args-->*/ sw_progress ){


    },
    function pageCode(msg,resolve,reject,reply) {
        
        let { title,url, win } = msg;
        
       
        
        if(!url) {
            return;
        }
        openProjects[url] = {
            win: win,
            title: title,
            lastFocus: new Date()
        };
        win.contentWindow.addEventListener('focus', function() {
            openProjects[url].lastFocus = new Date();
        });
        win.onClosed.addListener(function() {
            delete openProjects[url];
            saveOpenWindows();
        });
        saveOpenWindows();
   
        
    },
    
    true
);     
     
 


//////////

/*global chrome*/

var isLinux = !! /linux/i.exec(navigator.platform);
// var isLinux = false;

function openEditor(title, url, urlPostfix) {
    urlPostfix = urlPostfix || "";
    return new Promise(function(resolve, reject) {
        chrome.app.window.create('editor.html?url=' + encodeURIComponent(url) + '&title=' + encodeURIComponent(title) + urlPostfix, {
            frame: isLinux ? 'chrome' : 'none',
            width: 1024,
            height: 768
        }, function(win) {
            win.focus();
            resolve(win);
        });
    });
}

function showWindow() {
    openEditor("Zed", "");
}

chrome.app.runtime.onLaunched.addListener(restoreOpenWindows);

var ongoingTextAreaEdits = {};

chrome.runtime.onConnectExternal.addListener(function(port) {
    var id = "" + Date.now();
    ongoingTextAreaEdits[id] = port;
    port.onMessage.addListener(function(req) {
        if (req.text !== undefined) {
            openEditor("Edit Text Area", "textarea:" + req.text, "&id=" + id).then(function(win) {
                win.onClosed.addListener(function() {
                    port.disconnect();
                    delete ongoingTextAreaEdits[id];
                });
            });
        }
    });
    port.onDisconnect.addListener(function() {
        delete ongoingTextAreaEdits[id];
    });
});

window.setTextAreaText = function(id, text) {
    ongoingTextAreaEdits[id].postMessage({
        text: text
    });
};


// Editor socket
// TODO: Factor this out somehow
var timeOut = 2000;
var reconnectTimeout = null;
var pingInterval = null;
var pongTimeout = null;
var editorSocketConn;
var currentSocketOptions = {};

function initEditorSocket(server) {
    function createUUID() {
        var s = [];
        var hexDigits = "0123456789ABCDEF";
        for (var i = 0; i < 32; i++) {
            s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
        }
        s[12] = "4";
        s[16] = hexDigits.substr((s[16] & 0x3) | 0x8, 1);

        var uuid = s.join("");
        return uuid;
    }

    chrome.storage.sync.get("zedremUserKey", function(results) {
        var userKey = results.zedremUserKey;
        if (!userKey) {
            userKey = createUUID();
            chrome.storage.sync.set({
                zedremUserKey: userKey
            });
        }
        currentSocketOptions = {
            server: server,
            userKey: userKey
        };
        editorSocket(currentSocketOptions);
    });
}


function closeSocket() {
    if (editorSocketConn) {
        currentSocketOptions.status = 'disconnected';
        if (reconnectTimeout) {
            clearTimeout(reconnectTimeout);
        }
        if (pingInterval) {
            clearInterval(pingInterval);
        }
        if (pongTimeout) {
            clearTimeout(pongTimeout);
        }
        editorSocketConn.onclose = function() {};
        editorSocketConn.close();
    }
}

function editorSocket(zedremConfig) {
    if (!zedremConfig.server) {
        // You can disable connecting to zedrem by setting server to null or false
        return;
    }
    console.log("Attempting to connect to", zedremConfig.server + "/editorsocket");
    editorSocketConn = new WebSocket(zedremConfig.server + '/editorsocket');
    editorSocketConn.onopen = function() {
        console.log("Connected to zedrem server!");
        currentSocketOptions.status = 'connected';
        editorSocketConn.send(JSON.stringify({
            version: "1",
            UUID: zedremConfig.userKey
        }));
        timeOut = 2000;
        pingInterval = setInterval(function() {
            console.log("Ping");
            editorSocketConn.send(JSON.stringify({
                type: "ping"
            }));
            pongTimeout = setTimeout(function() {
                console.log("Ping timed out, reconnecting...");
                closeSocket();
                initEditorSocket(zedremConfig.server);
            }, 3000);
        }, 5000);
    };
    editorSocketConn.onerror = function(err) {
        console.error("Socket error", err);
    };
    editorSocketConn.onmessage = function(e) {
        var message = e.data;
        try {
            message = JSON.parse(message);
            switch (message.type) {
                case 'pong':
                    clearTimeout(pongTimeout);
                    pongTimeout = null;
                    console.log("Got pong");
                    break;
                case 'open':
                    var url = zedremConfig.server.replace("ws://", "http://").replace("wss://", "https://") + "/fs/" + message.url;
                    console.log("Now have ot open URL:", url);
                    openEditor("Remote", url);
                    break;
            }
        } catch (e) {
            console.error("Couldn't deserialize:", message, e);
        }
    };
    editorSocketConn.onclose = function(e) {
        console.log("Close", e);
        if (timeOut < 5 * 60 * 1000) { // 5 minutes max
            timeOut *= 2;
        }
        closeSocket();
        console.log("Socket closed, retrying in", timeOut / 1000, "seconds");
        reconnectTimeout = setTimeout(function() {
            editorSocket(zedremConfig);
        }, timeOut);
    };
}

window.configZedrem = function(newServer) {
    if (currentSocketOptions.server !== newServer) {
        initEditorSocket(newServer);
    }
};

var openProjects = {}, ignoreClose = false;

window.openProject = function(title, url) {
    console.log("Going to open", title, url);
    if (openProjects[url]) {
        var win = openProjects[url].win;
        win.focus();
        win.contentWindow.zed.services.editor.getActiveEditor().focus();
    } else {
        openEditor(title, url);
    }
};

window.registerWindow = function(title, url, win) {
    if(!url) {
        return;
    }
    openProjects[url] = {
        win: win,
        title: title,
        lastFocus: new Date()
    };
    win.contentWindow.addEventListener('focus', function() {
        openProjects[url].lastFocus = new Date();
    });
    win.onClosed.addListener(function() {
        delete openProjects[url];
        saveOpenWindows();
    });
    saveOpenWindows();
};

window.getOpenWindows = function() {
    var wins = [];
    Object.keys(openProjects).forEach(function(url) {
        wins.push({
            title: openProjects[url].title,
            url: url,
            lastFocus: openProjects[url].lastFocus
        });
    });
    wins.sort(function(a, b) {
        return a.lastFocus < b.lastFocus;
    });
    return wins;
};

window.closeAllWindows = function() {
    ignoreClose = true;
    for (var url in openProjects) {
        openProjects[url].win.close();
    }
};

window.getSocketOptions = function() {
    return currentSocketOptions;
};

function saveOpenWindows() {
    if (!ignoreClose) {
        chrome.storage.local.set({
            openWindows: window.getOpenWindows()
        });
    }
}

function restoreOpenWindows(e) {
    var wins = window.getOpenWindows();
    if (wins.length) return openProjects[wins[0].url].win.focus();
    
    ignoreClose = false;
    console.log("On launched", e);
    chrome.storage.local.get("openWindows", function(result) {
        var openWindows = result.openWindows;
        if (!openWindows || openWindows.length === 0) {
            openWindows = [{
                title: "",
                url: ""
            }];
        }
        openWindows.forEach(function(win) {
            openEditor(win.title, win.url);
        });
    });
}

