/*

global simplePeerLink

*/
const wss_link_url = localStorage.get('wss');
if (wss_link_url) {
    simplePeerLink(wss_link_url);
}
