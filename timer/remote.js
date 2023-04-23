
if ( location.search.startsWith('?') && location.search.length===25) {
    const own_id=location.search.substr(1,12);
    const peer_id=location.search.substr(13,12);
    if (evenSimplerPeer.validateId (own_id)) {
        if (evenSimplerPeer.validateId (peer_id)) {
            localStorage.setItem('own_id',own_id);
            localStorage.setItem('peer_id',peer_id);
            location.replace(location.href.replace(/\?.*/,''))
        }
    } 
    location.replace(location.href.replace(/\?.*/,''))
} 

const own_id = localStorage.getItem('own_id') || '';
const peer_id = localStorage.getItem('peer_id') || '';

const own_id_ = document.querySelector('#own_id');
const peer_id_ = document.querySelector('#peer_id');

own_id_.innerHTML = own_id;
peer_id.innerHTML = peer_id;

