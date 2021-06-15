/* global  caches, BroadcastChannel, self */

self.isSw = typeof WindowClient+typeof SyncManager+typeof addEventListener==='functionfunctionfunction';

function toJSON(response) { return response.json(); }


function toText(response) {  return response.text() }

function toArrayBuffer(response){ return response.arrayBuffer(); }

function toSha1Hash(buffer){ return window.crypto.subtle.digest("SHA-1", buffer); }

function bufferFromText(x) {return new TextEncoder("utf-8").encode(x);}

function bufferToText(x) {return new TextEncoder("utf-8").decode(x);}

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
 

function workerCmd(cmdName,msgData,handler,worker_handler,THIS) {
    
    if (self.isSw) {
        if (!workerCmd.commands) {
            workerCmd.commands = {};
        }
        workerCmd.commands[cmdName] = {
            handler  : worker_handler,
            msgData  : msgData
        };
        return;
    }
    
    function func () {
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
                
                // invoke handler, which may add additional reply methods
                const handler_args=[navSw,replies, _resolve, _reject, send, id].concat(args);
                handler.apply(this,  handler_args);
                
                // wake up the service worker
                wakeupMsg[cmdName]=msgData;
                navSw.postMessage(wakeupMsg,[notifier.port2]);
                
            });
        });
    }
    
    THIS=THIS||this;
    if (THIS[cmdName]) delete THIS[cmdName];
    
    Object.defineProperty(THIS,cmdName,{value:func,enumerable:false,configurable: true});
    return func;
    
}


function windowCmd(cmdName,msgData,handler,window_handler,THIS) {
    
    if (!self.isSw) {
        
        if (!windowCmd.commands) {
            windowCmd.commands = {};
        }
        windowCmd.commands[cmdName] = {
            handler  : window_handler,
            msgData  : msgData
        };
        return;
    }
    
    function func () {
        const args = cpArgs(arguments);
        return asPromise(arguments,function(resolve,reject){
        
            
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
                
                // invoke handler, which may add additional reply methods
                const handler_args=[navSw,replies, _resolve, _reject, send, id].concat(args);
                handler.apply(this,  handler_args);
                
                // wake up the service worker
                wakeupMsg[cmdName]=msgData;
                navSw.postMessage(wakeupMsg,[notifier.port2]);
                
            
        });
    }
    
    THIS=THIS||this;
    if (THIS[cmdName]) delete THIS[cmdName];
    
    Object.defineProperty(THIS,cmdName,{value:func,enumerable:false,configurable: true});
    return func;
    
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


function getGitubCommitHash(user,repo){return asPromise(arguments,function(resolve,reject){
    //https://api.github.com/repos/jonathan-annett/jonathan-annett.github.io/deployments
    
    const url = "https://api.github.com/repos/"+user+"/"+repo+"/deployments";
    fetch(url)
      .then(toJSON)
          .then(
              function(deploymentsArray) {
                  resolve(deploymentsArray[0].sha);
              }
        ).catch(reject);

    
});}

function getGithubIOHashlist(user,root,include,exclude ){return asPromise(arguments,function(resolveList,reject){
    
    const repo = user+'.github.io';
    
    
    getGitubCommitHash(user,repo,function(err,hash){
        
        if (err) return reject(err);
        
        const url =  "https://api.github.com/repos/"+user+"/"+repo+"/git/trees/"+hash+"?recursive=1";
        const github_io_base = "https://" +  (repo + root.replace(/^\//,'/')).replace(/\/$/,'')+'/';
        
        const isIncluded = get_X_cluded ( github_io_base, include );
        const isExcluded = get_X_cluded ( github_io_base, exclude );
        
        fetch(url).then(toJSON).then(function(github_data){

    
             const arrayOfHashers =  
             
                github_data.tree
                  .filter( checkInclusions )
                      .map(hashLocalItem);
                  
                      
                    
                promiseAll2errback(arrayOfHashers,function(err,arrayOfResults){
                                  
                    if (err) return reject(err);
                    
                    return resolveList( arrayOfResults );    
                                
                });  
                
                function checkInclusions(item){ 
                
                    const 
                    excluded =  isExcluded(item.path),
                    result = item.type === "blob" && isIncluded(item.path) && !excluded;
                    return result;
                }

                function hashLocalItem(item){
                    return new Promise(function(resolve,reject) {
                        
                        caches.match(github_io_base+item.path).then (function(response){
                             console.log(response);
                             return response;
                         })  
                         
                         .then(toArrayBuffer)
    
                         .then(toSha1Hash)
                        
                        .then (function (hash){
                              hash = bufferToHex(hash);
                              //console.log(item.path,"sha1=",hash);
                              item.currentHash=hash;
                              return item; 
                         })
                         
                        .then (resolve)
                        
                        .catch(reject);
                        
                    });
                }
               
               
        
        }).catch(reject);

    });
     
    
    
});}



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
    console.log("registering workerCmd.onmessage");
    self.addEventListener("message",  workerCmd.onmessage);
}
 
 
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