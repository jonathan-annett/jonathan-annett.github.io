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
  
  var wrapperDiv = d.createElement('div'),
	    qrDiv = d.createElement('div'),
      qrEmbed = d.createElement('div'),
      qrP=d.createElement('p'),
      qrStyle=d.createElement('style');
	
	
      qrP.innerHTML='the qr code lets you easily open this page on your camera equipped touch enabled device.';
      qrStyle.type='text/css';
      qrStyle.innerHTML='div.qr_wrapper {	display: grid; 	height: 100%; width: 100%;} div.qr {margin: auto; display:block;  position:absolute; left:calc(98% -  320px); top: calc( 98% - 350px ); z-index:9999; background-color: white; width:320px; height:350px; } div.qr p, div.qr img { margin: 10px; width: 300px; height: auto; } html.mobile div.qr {display:none};';
      qrDiv.className='qr';
      qrDiv.appendChild(qrEmbed);
      qrDiv.appendChild(qrP);
    	wrapperDiv.className='qr_wrapper';
	    wrapperDiv.appendChild(qrDiv);
      d.body.appendChild(wrapperDiv);
      d.getElementsByTagName('head')[0].appendChild(qrStyle);
  
      var qrcode = new QRCode(qrEmbed, {
        width:  300,
        height: 300
      });
     qrcode.makeCode(location.href + "?reload" + Math.random().toString(36)); 
	
     	dragElement(qrDiv);


function dragElement(elmnt) {
	var pos1 = 0,
		pos2 = 0,
		pos3 = 0,
		pos4 = 0;

	addTouchToMouse(elmnt);
	elmnt.onmousedown = dragMouseDown;

	function dragMouseDown(e) {
		e = e || window.event;
		e.preventDefault();
		// get the mouse cursor position at startup:
		pos3 = e.clientX;
		pos4 = e.clientY;
		document.onmouseup = closeDragElement;
		document.onmousemove = elementDrag;
	}

	function elementDrag(e) {
		e = e || window.event;
		e.preventDefault();
		// calculate the new cursor position:
		pos1 = pos3 - e.clientX;
		pos2 = pos4 - e.clientY;
		pos3 = e.clientX;
		pos4 = e.clientY;
		// set the element's new position:
		elmnt.style.top = elmnt.offsetTop - pos2 + "px";
		elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
	}

	function closeDragElement() {
		document.onmouseup = null;
		document.onmousemove = null;
	}
	
  

	function addTouchToMouse(forEl) {
		doc = document;

		if (typeof forEl.removeTouchToMouse === "function") return;

		doc.addEventListener("touchstart", touch2Mouse, true);
		doc.addEventListener("touchmove", touch2Mouse, true);
		doc.addEventListener("touchend", touch2Mouse, true);
		var touching = false;
		
		 function isValidTouch (el) {
					if (el===forEl) return true;

					if ((el.parentElement===forEl)&&["INPUT","A","BUTTON"].indexOf(el.tagName)<0) return true;
				}
		function touch2Mouse(e) {
			var theTouch = e.changedTouches[0];
			var mouseEv;

			if (!isValidTouch(e.target)) return;

			switch (e.type) {
				case "touchstart":
					if (e.touches.length !== 1) return;
					touching = true;
					mouseEv = "mousedown";
					break;
				case "touchend":
					if (!touching) return;
					mouseEv = "mouseup";
					touching = false;
					break;
				case "touchmove":
					if (e.touches.length !== 1) return;
					mouseEv = "mousemove";
					break;
				default:
					return;
			} 

			var mouseEvent = document.createEvent("MouseEvent");
			mouseEvent.initMouseEvent(
				mouseEv,
				true,
				true,
				window,
				1,
				theTouch.screenX,
				theTouch.screenY,
				theTouch.clientX,
				theTouch.clientY,
				false,
				false,
				false,
				false,
				0,
				null
			);
			theTouch.target.dispatchEvent(mouseEvent);

			e.preventDefault();
		}

		forEl.removeTouchToMouse = function removeTouchToMouse() {
			doc.removeEventListener("touchstart", touch2Mouse, true);
			doc.removeEventListener("touchmove", touch2Mouse, true);
			doc.removeEventListener("touchend", touch2Mouse, true);
		};
	}
}

 
 })(document,window.QRCode,window.device||{});
