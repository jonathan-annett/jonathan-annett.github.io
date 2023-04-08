/* global evenSimplerPeer */      
let peer,
logger = document.querySelector("pre"),
json = document.querySelector("textarea"),
btn = document.querySelector("button");

//document.body.appendChild(logger);
document.body.onload=function(){
peer = evenSimplerPeer();

let peerSend = function (msg) {
peer.send(msg);
logger.innerHTML += "out:"+JSON.stringify(msg,undefined,4)+"\n";
};

peer.on('connected',function(){
document.title = "connected";
peerSend({hello:"world"});
document.querySelector("iframe").style.display = "none";
});

peer.on('message',function(msg){
logger.innerHTML += "in: "+JSON.stringify(msg,undefined,4)+"\n";
});

peer.on('disconnected',function(){
document.title = "disconnected";
document.querySelector("iframe").style.display = "block";
});


btn.onclick = function(){
 try {
   let msg = JSON.parse(json.value);
   peerSend(msg);
   json.value = JSON.stringify(msg,undefined,4);
 } catch (e) {
   
 }
};
};

