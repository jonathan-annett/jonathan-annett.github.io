/*

global simplePeerLink

*/
const wss_link_url = localStorage.getItem('wss');
if (wss_link_url) {
    simplePeerLink(wss_link_url);
}
