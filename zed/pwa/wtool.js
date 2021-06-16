
var [btn,inp] = ["button","input"].map(qs);

btn.onclick = function(){
  alert(inp.value)  ;
};




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