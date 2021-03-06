/* global  caches, BroadcastChannel, self,localforage ,github_io_user, github_io_files, Rusha */

self.isSw = typeof WindowClient+typeof SyncManager+typeof addEventListener==='functionfunctionfunction';

function toJSON(response) { return response.json(); }

function toText(response) {  return response.text() }

function fromResponseToArrayBuffer(response){ return response.arrayBuffer(); }



function fromBuffertoSha1DigestBuffer(buffer){ 
        return self.isSw ? Promise.resolve(Rusha.createHash().update(buffer).digest()) 
                         : window.crypto.subtle.digest("SHA-1", buffer); 
    
}

function fromBufferToHex(buffer){ 
    return new Promise(function (resolve,reject){
        try {
            const hex = bufferToHex(buffer);
            resolve(hex);
        } catch (e) {
            reject(e);
        }
    });
}


function viaConsoleX(via,x,prefix,suffix) {
    
    return function (whatever) {
        if (prefix) {
            if (suffix) {
                console[x](prefix,whatever,suffix);
            } else {
                console[x](prefix,whatever);
            }
        } else {
            if (suffix) {
                console[x](whatever,suffix);
            } else {
                console[x](whatever);
            }
        } 
        return via?via(whatever):Promise.resolve(whatever);
    };
    
}


function viaConsoleInfo(prefix,suffix) {
    return viaConsoleX(false,"info",prefix,suffix);
}

function viaConsoleWarn(prefix,suffix) {
    return viaConsoleX(false,"warn",prefix,suffix);
}

function viaConsoleError(prefix,suffix) {
    return viaConsoleX(false,"error",prefix,suffix);
}

function viaConsoleLog(prefix,suffix) {
    return viaConsoleX(false,"log",prefix,suffix);
}

function rejectViaConsoleWarn(reject,prefix,suffix) {
    return viaConsoleX(reject,"warn",prefix,suffix);
}

function rejectViaConsoleInfo(reject,prefix,suffix) {
    return viaConsoleX(reject,"info",prefix,suffix);
}

function rejectViaConsoleError(reject,prefix,suffix) {
    return viaConsoleX(reject,"error",prefix,suffix);
}

function rejectViaConsoleLog(reject,prefix,suffix) {
    return viaConsoleX(reject,"log",prefix,suffix);
}


function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}

function bufferToText(x) {return new TextDecoder("utf-8").decode(x);}

function bufferToHex(buffer) {
    const padding = '00000000';
    const hexCodes = [];
    const view = new DataView(buffer);
    if (view.byteLength===0) return '';
    if (view.byteLength % 4 !== 0) throw new Error("incorrent buffer length - not on 4 byte boundary");

    for (let i = 0; i < view.byteLength; i += 4) {
        // Using getUint32 reduces the number of iterations needed (we process 4 bytes each time)
        const value = view.getUint32(i);
        // toString(16) will give the hex representation of the number without padding
        const stringValue = value.toString(16);
        // We use concatenation and slice for padding
        const paddedValue = (padding + stringValue).slice(-padding.length);
        hexCodes.push(paddedValue);
    }
    // Join all the hex strings into one
    return hexCodes.join("");
}

function bufferFromHex (hex) {
    if (hex.length === 0) return new ArrayBuffer(0);
    if ((hex.length % 8) !== 0 ) throw new Error("incorrent hex length - need multiples of 8 digits");
    
    const ui32Array = [];
    for (let i =0; i < hex.length; i+=8) {
        ui32Array.push(Number.parseInt("0x"+hex.substr(i,8)));
    }
    return Uint32Array.from(ui32Array).buffer;
}    


function cachedResolve(resolve,fn,x) {
    const res = function (x) {  return resolve((fn.cached=x));};
    if (x) {
       return res(x); 
    } else {
       return res;
    }
}



function cachedPromise(cacher,promiser){
    return cacher.cache ? Promise.resolve(cacher.cache) : new Promise(promiser);
}

function isPromise(p) {
  return !!p&&typeof p==='object'&&p.constructor===Promise;    
}

function toPromise(p){
   return !!p&&typeof p==='object'&&p.constructor===Promise?p:typeof p==='function'&&p.length===2?new Promise(p):Promise.resolve(p);
}
var cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);

function promiseToCB (nm,fn,THIS) {
    if (typeof nm==='function') {
        THIS=fn;fn=nm;nm=fn.name;
    }
    THIS=THIS||this;
    const func = function () {
       let args = cpArgs(arguments);
        if (typeof args[args.length-1]==='function') {
            const cb = args.pop();
            return fn.apply(THIS,args).then(function(r){
               cb (undefined,r);
            }).catch(cb);  
        } else {
            return fn.apply(THIS,args);
        }
    };
    Object.defineProperty(func,'name',{value:nm,enumerable:false,configurable: true});
    if (THIS[nm]) delete THIS[nm];
    Object.defineProperty(THIS,nm,{value:func,enumerable:false,configurable: true});
    return func;
}

function cbToPromise (nm,fn,THIS) {
    if (typeof nm==='function') {
        THIS=fn;fn=nm;nm=fn.name;
    }
    THIS=THIS||this;
    const func = function () {
       let args = cpArgs(arguments);
        if (typeof args[args.length-1]==='function') {
            return fn.apply(THIS,args);
        } else {
            return new Promise(function(resolve,reject){
                
                args.push(function(err,result){
                      if (err) return reject(err);
                      if (arguments.length==2) {
                         return resolve(result);
                      }
                      return resolve(cpArgs(arguments,1));
                });
                          
                fn.apply(THIS,args);
                
            });
        }
    };
    Object.defineProperty(func,'name',{value:nm,enumerable:false,configurable: true});
    if (THIS[nm]) delete THIS[nm];
    Object.defineProperty(THIS,nm,{value:func,enumerable:false,configurable: true});
    return func;

}

function asPromise (args,resolver,no_err) {
    const cb = args[args.length-1],
    promise  = new Promise(resolver);
    return (typeof cb==='function')  ? promise.then(function(result){return cb(no_err,result)}).catch(cb) : promise;
}

function asCallback (args,wrap,no_err) {
    const cb = args[args.length-1],
    promise=new Promise(function resolver(resolve,reject) {
        return wrap (function (err,result) {
             if (err) return reject(err);
             resolve(result);
        });
    });
    return (typeof cb==='function')  ? promise.then(function(result){return cb(no_err,result)}).catch(cb) : promise;
}


Promise.prototype.delay = function(t) {
    return this.then(function(v) {
        return new Promise(function(resolve) { 
            setTimeout(function(){resolve(v);},t);
        });
    });
}

Promise.timeout = function (t, v) { return Promise.resolve(v).delay(t);}


function cbPromiseTest(){
    /*global sampleFunc1,sampleFunc2*/
    
    const local = {}; 
    promiseToCB(function sampleFunc1(arg1,arg2) {
        console.log("deciding:",arg1,arg2);
        return new Promise(function(resolve,reject){
       
           const timer = setTimeout(function(){reject([arg1,arg2,"ouch"].join("-"));},5000);
           
           setTimeout(function(){
               if (arg2.endsWith("-pass") || (!arg2.endsWith("-fail") && Math.random()<0.5)) {
    
                   console.log("complete:",arg1,arg2);
                   clearTimeout(timer);
                   resolve([arg1,arg2,"all good"].join("-"));
               }
           },2000);
        
        });
    });
    
    cbToPromise('sampleFunc2',function someOtherName(arg1,arg2,cb) {
       console.log("deciding:",arg1,arg2);
       const timer = setTimeout(function(){cb([arg1,arg2,"ouch"].join("-"));},5000);
       
       setTimeout(function(){
           if (arg2.endsWith("-pass") || (!arg2.endsWith("-fail") && Math.random()<0.5)) {
               console.log("complete:",arg1,arg2);
               clearTimeout(timer);
               cb(undefined,[arg1,arg2,"all good"].join("-"));
           }
       },2000);
        
    },local);
    
    function sampleFunc3(arg1,arg2) {return asPromise(arguments,function(resolve,reject){
       console.log("deciding:",arg1,arg2);
       const timer = setTimeout(function(){reject([arg1,arg2,"ouch"].join("-"));},5000);
       
       setTimeout(function(){
           if (arg2.endsWith("-pass") || (!arg2.endsWith("-fail") && Math.random()<0.5)) {
               console.log("complete:",arg1,arg2);
               clearTimeout(timer);
               resolve([arg1,arg2,"all good"].join("-"));
           }
       },2000);
        
    });}
    
    function sampleFunc4(arg1,arg2) {return asCallback(arguments,function(cb){
       console.log("deciding:",arg1,arg2);
       const timer = setTimeout(function(){cb([arg1,arg2,"ouch"].join("-"));},5000);
       
       setTimeout(function(){
           if (arg2.endsWith("-pass") || (!arg2.endsWith("-fail") && Math.random()<0.5)) {
               console.log("complete:",arg1,arg2);
               clearTimeout(timer);
               cb(undefined,[arg1,arg2,"all good"].join("-"));
           }
       },2000);
        
    });}
    
    const log=console.log.bind(console),info=console.info.bind(console),error=console.error.bind(console);
    
    sampleFunc1("sample1","promise").then (log).catch(error);
    local.sampleFunc2("sample2","promise").then (log).catch(error);
    sampleFunc3("sample3","promise").then (log).catch(error);
    sampleFunc4("sample4","promise").then (log).catch(error);

    sampleFunc1("sample1","callback",info);
    local.sampleFunc2("sample2","callback",info);
    sampleFunc3("sample3","callback",info);
    sampleFunc4("sample4","callback",info);
    
    sampleFunc1("sample1","promise-pass").then (log).catch(error);
    local.sampleFunc2("sample2","promise-pass").then (log).catch(error);
    sampleFunc3("sample3","promise-pass").then (log).catch(error);
    sampleFunc4("sample4","promise-pass").then (log).catch(error);

    sampleFunc1("sample1","callback-pass",info);
    local.sampleFunc2("sample2","callback-pass",info);
    sampleFunc3("sample3","callback-pass",info);
    sampleFunc4("sample4","callback-pass",info);
    
    
    sampleFunc1("sample1","promise-fail").then (log).catch(error);
    local.sampleFunc2("sample2","promise-fail").then (log).catch(error);
    sampleFunc3("sample3","promise-fail").then (log).catch(error);
    sampleFunc4("sample4","promise-fail").then (log).catch(error);
    
    sampleFunc1("sample1","callback-fail",info);
    local.sampleFunc2("sample2","callback-fail",info);
    sampleFunc3("sample3","callback-fail",info);
    sampleFunc4("sample4","callback-fail",info);
 
}
//cbPromiseTest();

function findWorker() {return asPromise(arguments,function(resolve,reject){
    
    navigator.serviceWorker.getRegistrations().then(function(registrations) {
      
      if (!registrations.some(function(reg){
          const worker = reg.controller || reg.active || reg.installing || reg.waiting;
          if (worker) {
              resolve(worker);
              return true;
          }
      })){
          
         reject(new Error("no worker found"));
      }
    });
    
});}
 
function workerCmd(cmdName,msgData,callHandler,invocationHandler,localInvHandler,THIS) {
    THIS=THIS||this;
    
    if (self.isSw) {
        
        if (!workerCmd.commands) {
            workerCmd.commands = {};
        }
        workerCmd.commands[cmdName] = {
            handler  : invocationHandler,
            msgData  : msgData
        };
        
        if (localInvHandler===true) {
            // allow local calls via simulated channel
            if (THIS[cmdName]) delete THIS[cmdName];
            
            Object.defineProperty(
                THIS,
                cmdName, {  
                    value        : localInvocationWrapper.bind(THIS,invocationHandler),
                    enumerable   : false,
                    configurable : true
                
                }
            );
        
            
           
        } else {
            
            if (typeof localInvHandler==='function') {
                // provide alternate code if invoked locally
                if (THIS[cmdName]) delete THIS[cmdName];
                Object.defineProperty(
                    THIS,
                    cmdName,
                    {  
                        value        : localInvHandler,
                        enumerable   : false,
                        configurable : true
                    
                    }
                );
            }
            
        }
    } else {
        if (THIS[cmdName]) delete THIS[cmdName];
        Object.defineProperty(THIS,cmdName,{value:localCallWrapper,enumerable:false,configurable: true});
    }
    
    return THIS[cmdName];
    
    function localCallWrapper () {
        const args = cpArgs(arguments);
        return asPromise(arguments,function(resolve,reject){
        
            findWorker(function(err,navSw){
            
                if (err) return reject(err);
            
                let 
                
                // reply replyChannel for worker
                replyChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(cmdName+'_replies') : false,
                
                // temp replyChannel that "wakes up" worker and sends the reques
                notifier = new MessageChannel();
                
                const 
                // poor mans GUID
                // because replies come back via broadcast,
                // we need to ensure we are receiving correct reply
                id = (Date.now().toString(36).substr(4)+Math.random().toString(36)+Math.random().toString(36)).replace(/0+\./g,'-'),
                wakeupMsg= {
                   id : id  
                },
                close_channel = function(){
                    if (replyChannel) {
                        replyChannel.close();
                        replyChannel = undefined;
                    }
                },
                close_notifier = function(){
                    if (notifier) {
                        notifier.port1.close();
                        notifier.port2.close();
                        notifier = undefined;
                    }
                },
                // default reply handlers for resolve and reject
                replies = {
                    resolve         : _resolve,
                    reject          : _reject
                };
                
                replyChannel.onmessage=function(e){
                    // filter out other messages
                    if (e.data.id===id) {
                        close_notifier();
                        delete e.data.id;
                        const key = Object.keys(e.data)[0];
                        const fn = replies[key];
                        const payload = e.data[key];
                        delete  e.data[key];
                        
                        if (typeof fn==='function') fn(payload);
                    }
                };
                
                // default replies to resolve/reject
                function _resolve(result) {
                    close_channel();
                    resolve(result);
                }
                
                function _reject (err) {
                    close_channel();
                    reject(err);
                }
                
                function send (name,msg) {
                    const replyMsg = {};
                    replyMsg[name] = msg;
                    replyChannel.postMessage(replyMsg);
                }
                
                // invoke callHandler, which may add additional reply methods
                const handler_args=[replies, _resolve, _reject, send, id].concat(args);
                callHandler.apply(this,  handler_args);
                
                // wake up the service worker
                wakeupMsg[cmdName]=msgData;
                navSw.postMessage(wakeupMsg,[notifier.port2]);
                
            });
        });
    }

    
}

function localInvocationWrapper(invocationHandler,data,replies){
 
     return asPromise(arguments,function(resolve,reject){
     
         replies = replies || {};
         replies.resolve  = _resolve;
         replies.reject   = _reject;
         
         function reply(data) {
             // filter out other messages
                 delete data.id;
                 const key = Object.keys(data)[0];
                 const fn = replies[key];
                 const payload = data[key];
                 delete  data[key];
                 if (typeof fn==='function') fn(payload);
             
         }
    
         invocationHandler(data,_resolve,_reject,reply);
         
         function _resolve(x) {
             resolve(x);
         }
         function _reject(x) {
             reject(x);
         }
        
     });
     
} 

if (self.isSw) {
    workerCmd.onmessage = function ( e ) {
        if (workerCmd.commands) {
           
           const id = e.data.id;
           if ( id && Object.keys(e.data).length===2) {
               
               delete e.data.id;
               const cmdName = Object.keys(e.data)[0];
               
               const cmd = workerCmd.commands[cmdName];
               if (cmd && typeof cmd.handler==='function') {
        
        
                   e.waitUntil (
                       
                      new Promise(function(resolve,reject){
                          
                          const
                          
                          replyChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(cmdName+'_replies') : false,
                          
                          reply = function  (name,msg) {
                              const wrap = {
                                  id : id
                              };
                              wrap[name]=msg;
                              replyChannel.postMessage(wrap);
                              resolve();
                          },
                          
                          _resolve = function(result) {
                              reply('resolve',result);
                              replyChannel.close();
                          },
                          
                          _reject = function  (err) {
                              reply('reject',err);
                              replyChannel.close();
                              reject();
                          };
                          
                          
                          replyChannel.onmessage = workerCmd.onmessage;
        
                          cmd.handler(e.data,_resolve,_reject,reply);
                          
                      })
                   
                   );
                   
        
                   
               }
               
           }
        }
    };
    serviceWorkerEvent("message",  workerCmd.onmessage,false);
}
 
 

function windowCmd(cmdName,msgData,callHandler,invocationHandler,localInvHandler,THIS) {
    THIS=THIS||this;  
    
          
    if (!self.isSw) {
         // windows keep their message channel active  
         const messageChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(cmdName+'_invocation') : false;
  
         messageChannel.onmessage=function(e){ 
            
            const id = e.data.id;
            // filter out other messages
            if (id && e.data[cmdName]) {
                delete e.data.id;
                
                const  
                reply = function  (name,msg) {
                    const wrap = {
                        id : id
                    };
                    wrap[name]=msg;
                    messageChannel.postMessage(wrap);
                },
                
                _resolve = function(result) {
                    reply('resolve',result);
                },
                
                _reject = function  (err) {
                    reply('reject',err);
                };
                
                
                invocationHandler(e.data,_resolve,_reject,reply);
               
            }
        };
        
        if (localInvHandler===true) {
            // allow local calls via simulated channel
            if (THIS[cmdName]) delete THIS[cmdName];
            
            Object.defineProperty(
                THIS,
                cmdName, {  
                    value        : localInvocationWrapper.bind(THIS,invocationHandler),
                    enumerable   : false,
                    configurable : true
                
                }
            );
        
            
           
        } else {
            
            if (typeof localInvHandler==='function') {
                // provide alternate code if invoked locally
                if (THIS[cmdName]) delete THIS[cmdName];
                Object.defineProperty(
                    THIS,
                    cmdName,
                    {  
                        value        : localInvHandler,
                        enumerable   : false,
                        configurable : true
                    
                    }
                );
            }
            
        }
        
        
         return;
    }
    

    if (THIS[cmdName]) delete THIS[cmdName];
    
    Object.defineProperty(THIS,cmdName,{value:localCallWrapper,enumerable:false,configurable: true});
    
    return THIS[cmdName];
    
    function localCallWrapper () {
        const args = cpArgs(arguments);
        return asPromise(arguments,function(resolve,reject){
        
   
                const 
                //worker opens channel per call
                messageChannel = typeof BroadcastChannel === 'function' ? new BroadcastChannel(cmdName+'_invocation') : false,
  
                
                // poor mans GUID
                // because replies come back via broadcast,
                // we need to ensure we are receiving correct reply
                id = (Date.now().toString(36).substr(4)+Math.random().toString(36)+Math.random().toString(36)).replace(/0+\./g,'-'),
                cmdMsg= {
                   id : id  
                },
                
                close_channel = function(){
                    if (messageChannel) {
                        messageChannel.close();
                    }
                },
                
                // default reply handlers for resolve and reject
                replies = {
                    resolve         : _resolve,
                    reject          : _reject
                };
                
                messageChannel.onmessage=function(e){
                    // filter out other messages
                    if (e.data.id===id) {
                        delete e.data.id;
                        const key = Object.keys(e.data)[0];
                        const fn = replies[key];
                        const payload = e.data[key];
                        delete  e.data[key];
                        
                        if (typeof fn==='function') fn(payload);
                    }
                };
                
                // default replies to resolve/reject
                function _resolve(result) {
                    close_channel();
                    resolve(result);
                }
                
                function _reject (err) {
                    close_channel();
                    reject(err);
                }
                
                function send (name,msg) {
                    const replyMsg = {};
                    replyMsg[name] = msg;
                    messageChannel.postMessage(replyMsg);
                }
                
                // invoke callHandler, which may add additional reply methods
                const handler_args=[replies, _resolve, _reject, send, id].concat(args);
                callHandler.apply(this,  handler_args);
                
                // send message to client
                cmdMsg[cmdName]=msgData;
                messageChannel.postMessage(cmdMsg);
                
            
        });
    }
    
}

function get_X_cluded (base,exclusionsList) {
    
    const exclusions  = exclusionsList.map(
        function (excl) {
            if (typeof excl === "string" ) { 
                
                console.log('get_X_cluded:literal:',excl);
                return function(path){ 
                    return path === excl ;
                };
                
            } else {
                
                if (typeof excl.RegExp === "string") {
                    const re = new RegExp(excl.RegExp,'');
                    console.log('get_X_cluded:regex:',re);
                    return re.test.bind(re);
                } else {
                    return null;
                }
                
            }
        }   
    ).filter(function(x){ return x !== null;})
    
    const fn =  function  (path) {
       
        return exclusions.some(function(test){ return test(path);});
    };
    
    fn.list = exclusionsList;
    
    return fn;
}

function getGitubCommitHash(user,repo,full){return asPromise(arguments,function(resolve,reject){
    //https://api.github.com/repos/jonathan-annett/jonathan-annett.github.io/deployments?per_page=1
    full = typeof full==='boolean'&&full;
    const url = "https://api.github.com/repos/"+user+"/"+repo+"/deployments?per_page=1";
    fetch(url)
      .then(toJSON)
          .then(
              function(deploymentsArray) {
                  resolve(full ? deploymentsArray[0] : deploymentsArray[0].sha);
              }
        ).catch(reject);

    
});}

function getGitubCommitFileHashes(user,repo,files) {return asPromise(arguments,function(resolve,reject){
//  https://api.github.com/repos/jonathan-annett/jonathan-annett.github.io/git/trees/83a18ce10879bcdc1235fecf3dad09e883f5abe7?recursive=1
    const url_template = ["https://api.github.com/repos/"+user+"/"+repo+"/git/trees/","?recursive=1"];
    
    getGitubCommitHash(user,repo,true, function(err,deploy){
        if (err) return reject(err);

        fetch( url_template.join(deploy.sha) )
          .then ( toJSON )
          .then ( function(gitub_data) {
              const result = {
                  deploy_sha: deploy.sha,
                  created_at: deploy.created_at,
                  updated_at: deploy.updated_at,
                  hashes : {}
              };
              
              //add the file names in order, so the keys exist in the object that way
              files.forEach(function(path){
                  result.hashes[path] = null;
              });
              const hashes = [];
              gitub_data.tree.forEach(function(x){
                  if ( result.hashes[x.path]===null) {
                      hashes.push(x.sha)
                      result.hashes[x.path] = {sha:x.sha,size:x.size};
                  }
              });
              
              
              
              fromBuffertoSha1DigestBuffer( bufferFromHex(hashes.join('')) )
              
                 .then ( fromBufferToHex )
                 
                  .then (function(groupHash){
                      
                      result.files_sha1 = groupHash;
                      resolve(result);
                      
                  }). catch(reject);
              

             
              
          } ).catch(reject); 


    });
    
});}

function checkGithubIOCommitHash() {return asPromise(arguments,function(resolve,reject){
    
    const repo = github_io_user+'.github.io';
    const key  = repo+'.hashes';
    if (checkGithubIOCommitHash.cache) {
   
        return checkGithubIOCommitHash.cache.then(resolve).catch(reject);
    
    }
    
    checkGithubIOCommitHash.cache = new Promise(function(resolve,reject){
        
        localforage.getItem(key).then(function (localData) {
            
            getGitubCommitFileHashes(github_io_user, repo, github_io_files, function(err,serverData){
                
                if (err) {
                    
                    reject(err);
                    
                } else {
                    
                    const changed=localData &&(localData.files_sha1!==serverData.files_sha1), 
                          result={changed:changed,localData,serverData,repo};
                     
                    if ( changed || !localData ) {
                        
                        localforage.setItem(key,serverData).then(function () {
                            console.log("checkGithubIOCommitHash:saved in localforage-->",result);    
                            resolve (result);
                        });
                        
                    } else {
                        
                        console.log("checkGithubIOCommitHash:",result);   
                        resolve (result);
                        
                    }
                }
            });
            
        });
        
    });
    
    checkGithubIOCommitHash.cache.then(resolve).catch(reject);
    
    
});}

function serviceWorkerEvent(eventName,normalEvent,changedEvent) {
    if (normalEvent||changedEvent) {
        console.log("registering installation handler for",eventName,"event");
        var handler = function (e) {
          const setHandler = function(hnd,resolve) {
              let waitUntilPromise;
              handler=hnd;
              
              e.waitUntil=function(capture) {
                  waitUntilPromise=capture;
              };
              handler(e);
              if (waitUntilPromise) {
                  waitUntilPromise.then(resolve);
              } else {
                  resolve();
              }
          };
        
           e.waitUntil (
               
               new Promise(function( resolve,reject) {
                    
                   checkGithubIOCommitHash(function(err,result){
                       if (err) {
                           console.log(err);
                           return reject(err);
                       }
                      
                       if ( result.changed && result.localHash ) {
                           
                           if (changedEvent){
                               console.log("site has changed, registering alternate",eventName,"event");
                               setHandler(changedEvent,resolve);
                           } else {
                               console.log("site has changed, not registering ",eventName,"event");
                               return resolve();
                           }
                           
                       } else {
                           
                           if (normalEvent) {
                               console.log("registering",eventName,"event");
                               setHandler(normalEvent,resolve);
                           }
                       }
                   })
               })
           ) 
        };
        
        self.addEventListener(eventName,function (e){ return handler (e) ; });
    }
}

function getGithubIOHashlist(user,root,include,exclude ){return asPromise(arguments,function(resolveList,reject){
    
    const repo = user+'.github.io';
    
    getGitubCommitHash(user,repo,function(err,hash){
        
        if (err) return reject(err);
        
        const url =  "https://api.github.com/repos/"+user+"/"+repo+"/git/trees/"+hash+"?recursive=1";
        const github_io_base = "https://" +  (repo + root.replace(/^\//,'/')).replace(/\/$/,'')+'/';
        
        const isIncluded = get_X_cluded ( github_io_base, include );
        const isExcluded = get_X_cluded ( github_io_base, exclude );
        
        fetch(url).then(toJSON).then(function(github_data){

    
             const 
                
                arrrayOfRequests = github_data.tree.filter( checkInclusions ),
                arrayOfHashers   = arrrayOfRequests.map(hashLocalItem),
                reparse = function (index) {
                    const item = JSON.parse(JSON.stringify(arrrayOfRequests[index]));
                    const path = item.path;
                    delete item.path;
                    return [ item, path ];
                };

                promiseAll2errback(arrayOfHashers,function(arrayOfErrors,arrayOfResults){

                     if (arrayOfResults) {
                         const result = {
                             errorCount  : 0,
                             resultCount : 0,
                             urlCount    : 0,
                             errors      : {},
                             results     : {}
                         }
                         
                         arrayOfErrors.forEach(function(err,index){
                             if (err) {
                                 const [item,path] = reparse(index);
                                 item.error = err.message || err;
                                 result.errors[ path ] = item;
                                 result.errorCount++;
                                 result.urlCount++;
                             }
                         });
                         
                         arrayOfResults.forEach(function(currentHash,index){
                             if (currentHash) {
                                 const [item,path ] = reparse(index);
                                 item.newHash = currentHash;
                                 result.results[ path ] = item;
                                 result.resultCount++;
                                 result.urlCount++;
                             }
                         });
                         
                         
                         return resolveList(result);        
                     }
                     return reject(err);
                    
                     
                                
                });  
                
                function checkInclusions(item){ 
                
                    const 
                    excluded =  isExcluded(item.path),
                    result = item.type === "blob" && isIncluded(item.path) && !excluded;
                    return result;
                }

                function hashLocalItem(item){
                    return new Promise(function(resolve,reject) {
                        
                         caches.match(github_io_base+item.path)
                         
                         .then ( viaConsoleInfo("caches.match("+item.path+")-->[","]") )
                         
                         .then( fromResponseToArrayBuffer )
    
                         .then( fromBuffertoSha1DigestBuffer )
                        
                         .then ( fromBufferToHex )
                         
                         .then ( viaConsoleInfo("sha1 digest --> [","]") )
                         
                         .then ( resolve )

                         .catch( rejectViaConsoleWarn(reject,"error hashing cache item "+item.path+" [","]") );
                        
                    });
                    
                   
                }
               
               
        
        }).catch(reject);

    });
     
});}


function promise2errback (p,cb) {
    toPromise(p).then(function(r){
        cb (undefined,r);
    }).catch(cb);
}

function promiseAll2errback (arr,cb) {
    let 
    remain  = arr.length,error_count=0,
    results = new Array(arr.length),
    errors  = new Array(arr.length);
    
    arr.forEach(function(p,index){
        
       p.then(function(x){
           returns(undefined,x);
       }).catch(function(x){
           returns(x,null);
       })
       
       function returns(err,value){
          remain--; 
          results[index]=value;
          errors[index]=err;
          if (err) {
              error_count++;
          }
          if (remain===0) {
              cb(error_count===0?undefined:errors,results)
          }
       }
   
    });
    

}


function caches_open(cacheName,cb) {
   return promise2errback(caches.open(cacheName),cb);
}

function cache_add(cache,req,cb) {
   return promise2errback(cache.add(req),cb);
}