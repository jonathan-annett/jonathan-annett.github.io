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

if (wss_link_url) {
    simplePeerLink(wss_link_url).then((function(socket){
        socket.onmessage = (data) => {
            const {key,oldValue,newValue} = JSON.parse(data);
            if (keys.indexOf(ev.key)>=0){
                if (newValue===null) {
                    localStorage.removeItem(key)
                } else {
                    localStorage.setItem(key,newValue)
                }
            }
        };

        window.onstorage=function(ev){
            const {key,oldValue,newValue} = ev;

            if (keys.indexOf(ev.key)>=0){
                socket.send(JSON.stringify({key,oldValue,newValue}));
            }
        }
    }));
}
