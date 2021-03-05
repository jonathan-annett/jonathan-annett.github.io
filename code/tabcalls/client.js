/*global webSocketSender,QRCode, jsQR,tabCallsApp,hljs */

var app = tabCallsApp();

var 
storageSendOptions = {
  prefix       : "messages",
  firstTimeout : 250,
  maxTimeout   : 15000,
  pair_by_sms  : false,
  pair_by_email: false,
  pair_by_tap  : true,
  pair_by_qr   : true
},
storageSend =  webSocketSender(storageSendOptions);
//hljs.initHighlightingOnLoad();
app(storageSend);
 