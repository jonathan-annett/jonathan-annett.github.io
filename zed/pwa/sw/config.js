/* global cachedPromise, cachedResolve, downloadJSON,config_url  */


function getConfig() {
    
    return cachedPromise(getConfig,function (resolve,reject){
        
        fetch(config_url)
          .then(downloadJSON)
            .then(cachedResolve(resolve,getConfig)).catch(reject);
      
    });
}
