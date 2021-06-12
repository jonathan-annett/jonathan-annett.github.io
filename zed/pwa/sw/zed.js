

/* global self, importScripts, caches ,registration,clients ,Response,localforage,cacheName,zedMessage  */    


var openProjects = {}, ignoreClose = false;


function openEditor(title, url, urlPostfix) {
    
    zedMessage.send ({cmd:"openEditor",args:[title,url,urlPostfix]});
    
}

function showWindow() {
    openEditor("Zed", "");
}

//chrome.app.runtime.onLaunched.addListener(restoreOpenWindows);
function chromeExtTextArea (){
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
}



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


function closeAllWindows () {
    const urls = Object.keys(openProjects);
    zedMessage.send ({cmd:"closeAllWindows",args:[ urls ]});
}

function getOpenWindows () {

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
    
}

function saveOpenWindows() {
    if (!ignoreClose) {
        
        localforage.setItem("openWindows",{
            openWindows: window.getOpenWindows()
        });
    }
}

function restoreOpenWindows() {
    var wins = window.getOpenWindows();
    if (wins.length) return openProjects[wins[0].url].win.focus();
    
    ignoreClose = false;
    localforage.getItem("openWindows").then(function(result) {
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
