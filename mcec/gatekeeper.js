
const gatekeeperStyle = document.createElement('style');
gatekeeperStyle.textContent = `

    .gatekeeper {
       display:block;
    }

    .gatekept {
       display:none;
    }


`;
const masterKeys = [];

document.head.appendChild(gatekeeperStyle);

document.addEventListener('DOMContentLoaded',function(){
    // build list of elements needing dynamic load (scripts/images/embeds/iframes)
    const needsSrc = [].forEach.call(document.querySelectorAll('.gatekept'),
    function(el){
        return !!el.dataset.src;
    });

    //build list of anchors needing setting
    const needsHref = [].forEach.call(document.querySelectorAll('.gatekept'),
    function(el){
        return !!el.dataset.href;
    })

    // id this browser (locally, does not get sent anywhere, unless user opts in)
    let browserId = localStorage.getItem('gatekeeper-id');
    let locationUrl = location.url.split('?')[0].replace(location.origin,'');
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
    crypto.subtle.digest('sha256',new Blob([locationUrl,browserId])).then(unlock);

    function unlock(key) {
        browserId = undefined;
        // master keys unlock entire site
        if (masterKeys.indexOf(key)< 0) {

            // specific pages can be gatekept from other browsers (ie those without master keys)
            if (document.body.dataset.gatekeeperKeys) {
                const keys = document.body.dataset.gatekeeperKeys.split(',');
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
            gatekeeperStyle.parentElement.removeChild(gatekeeperStyle);
           
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