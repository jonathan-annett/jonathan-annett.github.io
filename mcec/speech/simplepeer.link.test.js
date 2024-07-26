/*

global simplePeerLink

*/
const wss_link_url = localStorage.getItem('wss');

const keys = [
    '--captions-right'	,
    '---captions-height'	,	
    '--captions-height'	,	
    '--caption-disclaimer', 
    '--color-main-background',	
    '--font-size',
    '--captions-bottom',
    'captions',		
    'PPTCaptions',
    '--captions-left',
    '--font-family',
    '--text-color',
    '--captions-color'    
];
let bootstrap = false;
if (wss_link_url) {
    simplePeerLink(wss_link_url).then((function(socket){

       

        socket.onmessage = (data) => {
            const {key,oldValue,newValue} = JSON.parse(data);
            console.log("received",key,newValue);
            if (keys.indexOf(key)>=0){
                if (newValue===null) {
                    localStorage.removeItem(key)
                } else {
                    localStorage.setItem(key,newValue)
                }
            }
        };

        window.onstorage=function(ev){
            const {key,oldValue,newValue} = ev;

            if (keys.indexOf(key)>=0){

                console.log("sending",key,newValue);
                socket.send(JSON.stringify({key,oldValue,newValue}));
                if (!bootstrap) {
                    keys.forEach(function(k){
                        if (k===key) return;
                        socket.send(JSON.stringify({key:k,oldValue:null,newValue:localStorage.getValue(k)}));
                    });
                    bootstrap=true;
                }
            } else {
                console.log('ignoring',{key,oldValue,newValue});
            }
        };
    }));
}
