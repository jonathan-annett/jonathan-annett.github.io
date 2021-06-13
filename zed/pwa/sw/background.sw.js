
/* global self, importScripts, caches ,registration,clients ,Response,localforage */

/* global cachedPromise, cachedResolve, downloadJSON   */

/* global getConfig ,getPWAFiles   */

/* global sw_install, sw_message, sw_fetch, sw_activate, sw_fetch_, sw_fetch */

var 

config_url  = "/zed/pwa/files.json",
version     = 1.3,
cacheName   = config_url.replace(/\//g,'-').substr(1).replace('.json', '-'+version);


importScripts("https://cdnjs.cloudflare.com/ajax/libs/localforage/1.9.0/localforage.min.js");
importScripts("/zed/pwa/zen-observable.js", "/zed/pwa/localforage-observable.js");


importScripts("utils.js", "message.js", "config.js", "install.js", "fetch.js", "activate.js");

addEventListener("message",  sw_message);
addEventListener("install",  sw_install);
addEventListener("fetch",    sw_fetch_);  
addEventListener("activate", sw_activate);


localforage.ready(function() {

  localforage.setItem('test1', 'value1').then(function() {
    console.log('setItem(\'test1\', \'value1\')');
    return localforage.setItem('test2', 'value2');
  }).then(function() {
    console.log('setItem(\'test2\', \'value2\')');
    return localforage.setItem('test2', 'value2b');
  }).then(function() {
    console.log('setItem(\'test2\', \'value2b\')');
    return localforage.setItem('test2', 'value2b');
  }).then(function() {
    console.log('setItem(\'test2\', \'value2b\')');
    return localforage.setItem('test3', 'value3');
  }).then(function() {
    console.log('setItem(\'test3\', \'value3\')');
    //subscription.unsubscribe();
    return localforage.setItem('notObservedKey', 'notObservedValue');
  }).then(function() {
  // console.log('setItem(\'notObservedKey\', \'notObservedValue\')');
  //  return localforage.clear();
  });
});