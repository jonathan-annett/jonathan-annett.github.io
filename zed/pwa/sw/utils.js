/* global  caches, BroadcastChannel, self */

function downloadJSON(response) { return response.json(); }
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
                
                // reply channel for worker
                channel = typeof BroadcastChannel === 'function' ? new BroadcastChannel('installing') : false,
                
                // temp channel that "wakes up" worker and sends the reques
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
                    if (channel) {
                        channel.close();
                        channel = undefined;
                    }
                },
                close_notifier = function(){
                    if (notifier) {
                        notifier.close();
                        notifier = undefined;
                    }
                },
                // default reply handlers for resolve and reject
                replies = {
                    resolve         : _resolve,
                    reject          : _reject
                };
                
                channel.onmessage=function(msg){
                    // filter out other messages
                    if (msg.id===id) {
                        close_notifier();
                        delete msg.id;
                        const key = Object.keys(msg)[0];
                        const fn = replies[key];
                        const payload = msg[key];
                        delete  msg[key];
                        
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
                    channel.postMessage(replyMsg);
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