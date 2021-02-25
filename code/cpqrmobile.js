(function(d,QRCode,device){
  
  if ( !(
         device && typeof device.desktop ==='function' &&  device.desktop() && 
         typeof QRCode==='function'  &&
    ( (location.hostname==='jonathan-annett.github.io') || 
         (
            ( location.hostname==="cdpn.io") &&  (location.pathname.split('/')[2]==='debug') 
              
         )
        ) 
     ) return;
  
  var qrDiv = d.createElement('div'),
      qrEmbed = d.createElement('div'),
      qrP=d.createElement('p'),
      qrStyle=d.createElement('style');
      qrP.innerHTML='the qr code lets you easily open this page on your camera equipped touch enabled device.';
      qrStyle.type='text/css';
      qrStyle.innerHTML='div.qr { display:inline-block;margin:10px;position:absolute;right:0;top:0;z-index:9999;background-color:white;} div.qr p, div.qr img { margin: 10px; width: 300px; height: auto; } html.mobile div.qr {display:none};';
      qrDiv.className='qr';
      qrDiv.appendChild(qrEmbed);
      qrDiv.appendChild(qrP);
      d.body.appendChild(qrDiv);
      d.getElementsByTagName('head')[0].appendChild(qrStyle);
  
      var qrcode = new QRCode(qrEmbed, {
        width:  300,
        height: 300
      });
     qrcode.makeCode(location.href + "?reload" + Math.random().toString(36)); 
   
     
   
})(document,window.QRCode,window.device||{});
