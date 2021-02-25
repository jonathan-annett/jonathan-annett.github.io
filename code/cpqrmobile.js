(function(d,QRCode,device){
  
  if ( !(
           device && (typeof device.desktop ==='function') &&  device.desktop() && 
           (typeof QRCode==='function')  &&
           ( (location.hostname==='jonathan-annett.github.io') ||    
              (
                 ( location.hostname==="cdpn.io") &&  (location.pathname.split('/')[2]==='debug') 
              
               )
            )
         
     ) ) return;
  
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



var defaultUrls = [
    "https://i3.ytimg.com/vi/MQ3FI2-gsEI/hqdefault.jpg",
    "https://www.youtube.com/watch?v=Jsj-hDW9bS8",
    "https://www.youtube.com/watch?v=nQK3izm77tI&t=1s",
    "NsUWXo8M7UA",
    "2RocXKPPx4o",
    "https://www.youtube.com/watch?v=ovtcUfyVwy0",

    "Ywy9JEBbyuI",
    "https://www.youtube.com/watch?v=wtCSXIl0eqA",
    "https://www.youtube.com/watch?v=TH09EPRZ9rA",
    "https://www.youtube.com/watch?v=09gJX0Cc6p0"
  ];

var urls=location.href.indexOf('clear')<0? localStorage.ytHist : undefined;
if (urls) {
  urls=JSON.parse(urls);
} else {
   urls = defaultUrls;
   localStorage.ytHist = JSON.stringify(defaultUrls);
}

var vidHist = videoHistoryScroller("videoHistoryScroller",urls); 

function pushUrl() {
  var urlText = document.querySelector("#url");
  
  var c = vidHist.length;
  if (  vidHist.push(urlText.value) > c) {
    urls.push(urlText.value);
    localStorage.ytHist = JSON.stringify(urls);
  };
  urlText.value="";
}



document.querySelector("#btnAdd").addEventListener("click", pushUrl);
 
 
