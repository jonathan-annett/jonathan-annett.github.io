/* global 

   cachedPromise, cachedResolve, downloadJSON,config_url, 
   localforage, 
   promiseToCB,
   promise2errback, 
   promiseAll2errback,
   downloadPWAFiles,
   getConfig*/


promiseToCB(
    function getConfig() {
        
        return cachedPromise(getConfig,function (resolve,reject){
            
            fetch(config_url)
              .then(downloadJSON)
                .then(filterConfigComments)
                  .then(cachedResolve(resolve,getConfig)).catch(reject);
          
        });
    }
);

promiseToCB(
//function downloadPWAFiles_(cb) {return promise2errback(downloadPWAFiles(),cb);}
function downloadPWAFiles() {
    
    return new Promise(function(resolveConfig,reject) {
        
        
        getConfig(function (err,config){
            
           if (err) return reject(err);
           
           
            console.log("fetched...:",config);
            
            var github_io_base = config.site.root;
            
            console.log("github_io_base:",github_io_base);
            
            
            const mapped = config.github.map(getGithubFileList(github_io_base));
            
            promiseAll2errback(mapped,function(err,arrayOfFileLists){
                if (err) return reject(err);
                
                console.log("resolved:",arrayOfFileLists) ;
                resolveConfig({ 
                     site   : config.site.files,
                     github : [].concat.apply([],arrayOfFileLists)
                });
                
            });
            
            
        });      
        

    });
       
}
);

promiseToCB(
//function getPWAFiles_(cb){promise2errback(getPWAFiles(),cb);}
function getPWAFiles() {
    const key = '.PWAFiles';
    
    return cachedPromise(getPWAFiles,function (resolve,reject){
        localforage.getItem(key).then(function (files) {
            
            if (files) {
                
                console.log("fetched files from localForage");
                return cachedResolve(resolve,getPWAFiles,files);
                
            } else {
                
                return downloadPWAFiles().then(function(files){
                    localforage.setItem(key, files).then(function () {
                        console.log("downloaded, saved files in localForage");
                        return cachedResolve(resolve,getPWAFiles,files);
                    });

                }).catch(reject);
                
            }
            
        }).catch(function () {
            
             return downloadPWAFiles().then(function(files){
                 localforage.setItem(key, files).then(function () {
                     console.log("downloaded, saved files in localForage");
                     return cachedResolve(resolve,getPWAFiles,files);
                 });

             }).catch(reject);
             
        })
        
        
    });
    
}
);


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

function getGithubFileList (github_io_base) {
    
    return function iterator(github_config) {
        
       const isIncluded = get_X_cluded ( github_io_base, github_config.include );
       const isExcluded = get_X_cluded ( github_io_base, github_config.exclude );
       
       console.log({
           isIncluded,
           isExcluded
       });
  
       return new Promise(function (resolveList,reject) {

           fetch(github_config.url).then(downloadJSON).then(function(github_data){

             return resolveList( 
                 
                 
                 github_data.tree.filter(
                     
                     function(item){ 
                         
                         const 
                         excluded =  isExcluded(item.path),
                         result = item.type === "blob" && isIncluded(item.path) && !excluded;
                         return result;
                     }
                     
                 ).map(
                     
                     function (item){ 
                         //console.log("including:",github_io_base+item.path);
                         return github_io_base+item.path; 

                     }
                     
                     
                 )
                 
                 
              );
           
           });
           
       });
       
    };
    
}

function removeJSONArrayComments(txt) {
    return !txt.startsWith("<--");
}

function filterConfigComments (config) {
    config.site.files = config.site.files.filter(removeJSONArrayComments);
    config.site.betaTesterKeys = config.site.betaTesterKeys.filter(removeJSONArrayComments);
    return Promise.resolve(config);
}
