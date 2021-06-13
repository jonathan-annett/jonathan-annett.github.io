/* global diffUsingJS*/

document.addEventListener('DOMContentLoaded',bootPage);


function bootPage(){
    
    let file = location.search ? location.search.substr(1): "manifest.json";
    
    showFileDifference (
        
        "https://raw.githubusercontent.com/zedapp/zed/master/app",
        "https://jonathan-annett.github.io/zed/app",
        file,
        0);
}

function loadURLS(url1, url2) {
    
    return new Promise(promised);
    
    function promised(resolve,reject){
        
        const byId = function (id) { return document.getElementById(id); },
        toElement = function(id) { return function(text) { byId(id).value=text; return Promise.resolve(); }; };
                
        fetch(url1)
        .then(toText)
        .then(toElement("basetext"))
        .then(function(){
            
            fetch(url1)
                .then(toText)
                .then(toElement("newtext"))
                .then(function(){
                    resolve();
                    
                })
            
        })
    }

    function toText(response){ return response.text()}
}

function showFileDifference(base,newbase,file,viewType) {
    
    const url1 = 'https://' + (base.replace(/^https:\/\//,'') + '/' + file).replace(/\/\//g,'/');
    const url2 = 'https://' + (newbase.replace(/^https:\/\//,'') + '/' + file).replace(/\/\//g,'/');
    
    loadURLS(url1, url2) 
    
      .then (function(diffs) {
                  
           diffUsingJS(viewType);
           
      });                
}
    
    
    
    
    
 