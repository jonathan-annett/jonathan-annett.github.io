/*

global simplePeerLink

*/
const wss_link_url = localStorage.getItem('wss');
if (wss_link_url) {
    simplePeerLink(wss_link_url).then((function(socket){
        socket.onmessage = (data) => {
            window.output.textContent = data;
        };

        window.txt.oninput = (e) => {
            socket.send(window.txt.value);
        };

    }));
}
