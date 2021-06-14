/* global  caches */
var cpArgs = Array.prototype.slice.call.bind(Array.prototype.slice);

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
    Object.defineProperty(func,'name',{value:nm,enumerable:false});
    THIS[nm]=func;
    return func;
}

function CBtoPromise (nm,fn,THIS) {
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
    Object.defineProperty(func,'name',{value:nm,enumerable:false});
    THIS[nm]=func;
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