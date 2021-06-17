/* global wTools*/

var [btn, url, title,wleft,wtop,textarea] = ["button","#url", "#title","#left","#top","textarea"].map(qs);

btn.onclick = function(){
    wTools.open(url.value,title.value,Number.parseInt(wleft.value)||0,Number.parseInt(wtop.value)||0);
};


wTools.on("setKey",monitor);

window.addEventListener("storage",monitor);

function monitor(){
    var info={};
    Object.keys(localStorage).forEach(function(k){
        
        if (k.startsWith("windowTools.")){
            info[k]=JSON.parse(localStorage.getItem(k));
        }
        
    });
    textarea.value = JSON.stringify(info,undefined,4);
}


// generic tools 

function qs(d,q,f) {
    let r,O=typeof {},S=typeof O,FN=typeof qs,D=typeof d,Q=typeof q,F=typeof f;
    if (D+Q+F===S+'number'+O){q=r;}//handle map iterator
    if (D===S) {f=q;q=d;d=document;D=O;Q=S;F=typeof f}//handle implied d=document
    if (D+Q===O+S){
       r = d.querySelector(q);
       if (r&&typeof r+typeof f===O+FN) {
            if (f.name.length>0) 
               r.addEventListener(f.name,f);
            else 
               f(r);
        }
    }
    return r;
}