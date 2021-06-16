
/* global self, importScripts, caches ,registration,clients ,Response,localforage */

/* global cachedPromise, cachedResolve, toJSON   */

/* global getConfig ,getPWAFiles   */

/* global sw_install, sw_message, sw_fetch, sw_activate, sw_fetch_, sw_fetch */

var 

config_url  = "/zed/pwa/files.json",
github_io_user = "jonathan-annett",
github_io_files = [
    // changing any of these files triggers a full re-registration of service worker
    "zed/pwa/files.json",
    "zed/pwa/boot.js",
    "zed/pwa/sw/activate.js",
    "zed/pwa/sw/background.sw.js",
    "zed/pwa/sw/config.js",
    "zed/pwa/sw/fetch.js",
    "zed/pwa/sw/rusha.min.js",
    "zed/pwa/sw/install.js",
    "zed/pwa/sw/utils.js"].sort(),
    
version     = 1.3,
cacheName   = config_url.replace(/\//g,'-').substr(1).replace('.json', '-'+version);


//importScripts("https://cdnjs.cloudflare.com/ajax/libs/localforage/1.9.0/localforage.min.js");
importScripts(
    //"/zed/pwa/zen-observable.js","/zed/pwa/localforage.js","/zed/pwa/localforage-observable.js"

    "rusha.min.js",
    "https://unpkg.com/zen-observable@0.2.1/zen-observable.js", 
    "https://unpkg.com/localforage@1.9.0/dist/localforage.js",
    "https://unpkg.com/localforage-observable@2.1.1/dist/localforage-observable.js",    
    

    "utils.js",  
    "config.js", 
    "install.js", 
    "fetch.js", 
    "activate.js"
);
 