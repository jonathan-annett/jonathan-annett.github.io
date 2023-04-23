
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

const own_id_    = document.querySelector('#own_id');
const peer_id_   = document.querySelector('#peer_id');
const timer_btn_ = document.querySelector('#timer_btn');
const control_btn_ = document.querySelector('#control_btn');

own_id_.innerHTML = own_id;
peer_id_.innerHTML = peer_id;
let timerWin, controlWin;

timer_btn_.onclick = function(e) {
    openTimerWindow(!!timerWin);
};

control_btn_.onclick = function(e) {
    openControlWindow(!!timerWin);
};


function openTimerWindow(close) {
    if (close === true) {
        if (timerWin) timerWin.close();
        timerWin = undefined;
    } else {
        timerWin = open("timer.html?presenter", 'remote_timer_window', "location=0");
        if (timerWin) timerWin.addEventListener("unload", onTimerWinUnload);

    }
    return false;
}

function onTimerWinUnload() {
    timerWin = undefined;
}

function openControlWindow(close) {
    if (close === true) {
        if (controlWin) controlWin.close();
        controlWin = undefined;
    } else {
        controlWin = open("timer.html", 'remote_control_window', "location=0");
        if (controlWin) controlWin.addEventListener("unload", onControlWinUnload);

    }
    return false;
}

function onControlWinUnload() {
    controlWin = undefined;
}