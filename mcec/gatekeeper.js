
const gatekeeperStyle = document.createElement('style');
const gatekeeperAlgo = "SHA-256";
gatekeeperStyle.textContent = `

    .gatekeeper {
       display:block;
    }

    .gatekept {
       display:none;
    }


`;
const masterKeys = ["5597de04d9ed42745c4ec8e2300bc3bb12819ae2528f94048eedc1d067c20cf3"];

document.head.appendChild(gatekeeperStyle);

document.addEventListener('DOMContentLoaded',function(){
    // build list of elements needing dynamic load (scripts/images/embeds/iframes)
    const needsSrc = [].filter.call(document.querySelectorAll('.gatekept'),
    function(el){
        return !!el.dataset.src;
    });

    //build list of anchors needing setting
    const needsHref = [].filter.call(document.querySelectorAll('.gatekept'),
    function(el){
        return !!el.dataset.href;
    })

    // id this browser (locally, does not get sent anywhere, unless user opts in)
    let browserId = localStorage.getItem('gatekeeper-id');
    let locationUrl = location.href.split('?')[0].replace(location.origin,'');
    if (!browserId){
        browserId =  `${
            Math.random().toString(36).substring(3)
        }-${
            Math.random().toString(36).substring(3)
        }-${
            Date.now().toString(36).substring(6)
        }`;
        localStorage.setItem('gatekeeper-id',browserId);
    }

    //hash the id for comparison in inclusion list
    crypto.subtle.digest(gatekeeperAlgo,new TextEncoder().encode(browserId)).then(unlock);

    function unlock(key) {
        browserId = undefined;
        // convert digest to hex
        key = Array.from(new Uint8Array( key )).map((b) => b.toString(16).padStart(2, "0")).join("");
        
        // master keys unlock entire site
        if (masterKeys.indexOf(key)< 0) {

            // specific pages can be gatekept from other browsers (ie those without master keys)
            if (document.body.dataset.gatekeeperkeys) {
                const keys = document.body.dataset.gatekeeperkeys.split(',');
                if (keys.indexOf(key)< 0) {
                    // this page has been gatekept from user

                    if (document.body.dataset.gatekeeperRedirect) {
                        return location.replace(document.body.dataset.gatekeeperRedirect);
                    }

                    const customEvent = new CustomEvent('gatekeeper', {
                        detail: {
                        key:key,
                        unlocked:false
                        }
                    });
                    document.dispatchEvent(customEvent);
                    console.log("This Browser Key:",key);
                    return;
                }
            }
        }
        const promises = needsSrc.map(function(el){
            el.src=el.dataset.src;
        });
        Promise.all(promises).then(function(){
            needsHref.forEach(
                function (el_1) {
                    el_1.href = el_1.dataset.href;
                }
            );
            // remove the styling that hides gatekept elements
            gatekeeperStyle.textContent = `

             html, body {
                height: 100%;
                margin: 0;
                padding: 0;
            }
 
            iframe.gatekept {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                border: none;
            }

            .gatekeeper {
                display : none;
            }
`;
                   
            //user can access this page
            const customEvent = new CustomEvent('gatekeeper', {
                detail: {
                   key:key,
                   unlocked:true
                }
            });
            document.dispatchEvent(customEvent);
        });        

    }
    
     
});