/* global diffUsingJS*/

document.addEventListener('DOMContentLoaded',bootPage);


function bootPage(){
    
    let file = location.search ? location.search.substr(1): "manifest.json";
    
    showFileDifference (
        
        "https://raw.githubusercontent.com/zedapp/zed/master/app",
        "https://jonathan-annett.github.io/zed/app",
        
        "https://github.com/zedapp/zed/blob/master/app",
        "https://github.com/jonathan-annett/jonathan-annett.github.io/zed/app",
        
        file,
        0);
}

function loadURLS(url1, url2,link1,link2) {
    
    return new Promise(promised);
    
    function promised(resolve,reject){
        
        const byId = function (id) { return document.getElementById(id); },
        toElement = function(id,url) { 
            return function(text) { 
                byId(id).value=text; 
                byId(id+"_caption").innerHTML='<a href="'+url+'">'+url.split('/').pop()+'</a>'; 
                return Promise.resolve(); }; 
        };
                
        fetch(url1)
        .then(toText)
        .then(toElement("baseText",link1))
        .then(function(){
            
            fetch(url2)
                .then(toText)
                .then(toElement("newText",link2))
                .then(function(){
                    resolve();
                    
                })
            
        })
    }

    function toText(response){ return response.text()}
}

function showFileDifference(base,newBase,linkBase,newLinkBase,file,viewType) {
    const fixurl = function(base,file){ return 'https://' + (base.replace(/^https:\/\//,'') + '/' + file).replace(/\/\//g,'/'); };
    const url1 = fixurl(base,file);
    const url2 = fixurl(newBase,file);
    
    const link1 = fixurl(linkBase,file);
    const link2 = fixurl(newLinkBase,file);

    loadURLS(url1, url2, link1,link2) 
    
      .then (function(diffs) {
                  
           diffUsingJS(viewType);
           
      });                
}
    
    
    
    
    
 