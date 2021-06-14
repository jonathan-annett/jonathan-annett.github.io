
/* global self, importScripts, caches ,registration,clients ,Response,localforage */

/* global cachedPromise, cachedResolve, downloadJSON   */

/* global getConfig ,getPWAFiles   */

/* global sw_install, sw_message, sw_fetch, sw_activate, sw_fetch_, sw_fetch */

var 

config_url  = "/zed/pwa/files.json",
version     = 1.2,
cacheName   = config_url.replace(/\//g,'-').substr(1).replace('.json', '-'+version);

//importScripts("https://cdnjs.cloudflare.com/ajax/libs/localforage/1.9.0/localforage.min.js");
importScripts(
    //"/zed/pwa/zen-observable.js","/zed/pwa/localforage.js","/zed/pwa/localforage-observable.js"

    "https://unpkg.com/zen-observable@0.2.1/zen-observable.js", 
    "https://unpkg.com/localforage@1.9.0/dist/localforage.js",
    "https://unpkg.com/localforage-observable@2.1.1/dist/localforage-observable.js",    
    

    "swivel.min.js",
    "utils.js",  
    "config.js", 
    "install.js", 
    "fetch.js", 
    "activate.js"
);

//addEventListener("message",  sw_message);
addEventListener("install",  sw_install);
addEventListener("fetch",    sw_fetch_);  
addEventListener("activate", sw_activate);

 