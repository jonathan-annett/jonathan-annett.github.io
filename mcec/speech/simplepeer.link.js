/*

global SimplePeer,generateTOTP,generateSecret,QRCode

*/

function simplePeerLink(wss_url) {

    const [uu, qq] = location.href.split('?');
    if (qq && qq.length === 6) {
        sessionStorage.setItem('peerDigits', qq);
        location.replace(uu);
    }
    const loglines = [];
    const logel = document.getElementById('log') || { textContent: "" };
    const realLog = console.log.bind(console);
    console.log = logger;
    function logger(...args) {
        realLog(...args);
        const line = args.map((e) => {
            try {
                return typeof e === 'string' ? e : JSON.stringify(e)
            } catch (xx) {
                return e.toString ? e.toString() : String(e)
            }
        }).join(' ');
        loglines.push(line);
        while (loglines.length > 10) loglines.shift();
        logel.textContent = loglines.join('\n');

        function toString(e) {

        }

    }



    return new Promise(function(resolve){
        peerConnect('#clock', '#digits').then((socket) => {
            resolve(socket);
        });
    });

    async function getTime_(ws) {
        if (typeof getTime_.offset === 'number') {
            //  getTimeVal().then(()=>{});
            return Date.now() + getTime_.offset;
        }
        const cached = sessionStorage.getItem("getTimeOffset");
        if (cached) {
            getTime_.offset = parseInt(getTime_.offset, 36);
            // getTimeVal().then(()=>{});
            return Date.now() + getTime_.offset;
        } else {
            if (ws) {
                return await getTimeValWs();
            }
            return await getTimeVal();
        }

        async function getTimeVal() {

            const start = Date.now();
            const serverTime_ = await fetch("/time");
            const end = Date.now();
            const serverTime = parseInt(await serverTime_.text());
            const error = Math.floor((end - start) / 2);
            getTime_.offset = (serverTime - error) - start;
            sessionStorage.setItem("getTimeOffset", getTime_.offset.toString(36));
            return Date.now() + getTime_.offset;
        }

        async function getTimeValWs() {

            const start = Date.now();
            const serverTime = await new Promise(function (resolve) {
                ws.timeResolve = resolve;
                ws.send('time');
            });
            console.log("got server time", serverTime);
            const end = Date.now();
            const error = Math.floor((end - start) / 2);
            getTime_.offset = (serverTime - error) - start;
            sessionStorage.setItem("getTimeOffset", getTime_.offset.toString(36));
            return Date.now() + getTime_.offset;
        }
    }

    function getTime() {
        if (getTime_.offset) {
            return Date.now() + getTime_.offset;
        }

        return Date.now();
    }

    function peerConnect(clockQ, digitsQ, asEvent) {

        let urlDigits = sessionStorage.getItem('peerDigits') || '';

        let lastSecret = urlDigits ? null : sessionStorage.getItem('secret');
        let lastPeerSecret = urlDigits ? null : sessionStorage.getItem('peerSecret');

        if (!(lastPeerSecret && lastSecret)) {
            lastSecret = null;
            lastPeerSecret = null;
            sessionStorage.removeItem('secret');
            sessionStorage.removeItem('peerSecret');
        }


        let lastSecretTimeout = /* lastSecret ?

           setTimeout(function () {
                sessionStorage.removeItem('secret');
                sessionStorage.removeItem('peerSecret');
                location.reload();
            }, 15000) :  */null;
       


        return new Promise(function (resolve, reject) {

            let stopClockDisplay;

            document.body.classList.add('start');
            window.enteredDigits.textContent = '';
            document.addEventListener("DOMContentLoaded", kickStartTimerLoop);

            function getElapsedTimePercentage() {
                const currentTime = getTime();//  Date.now();
                const elapsedTime = currentTime % 30000;
                const percentage = (elapsedTime / 30000) * 100;
                return percentage;
            }

            function tryTimeResolve(ws, e) {
                if (ws.timeResolve) {
                    try {
                        const time = parseInt(e.data);
                        if (!isNaN(time) && time > 0) {
                            ws.timeResolve(time);
                            delete ws.timeResolve
                            return true;
                        }
                    } catch (e) {

                    }
                }
                return false;
            }

            async function openWebsocket(secret) {

                let typedOTP = urlDigits;

                const socket = new WebSocket(wss_url);

                socket.onopen = async (event) => {
                    console.log('WebSocket is connected!');
                    const id = Math.round(Math.random() * 100);

                    await getTime_(socket);

                    if (lastPeerSecret) {
                        typedOTP = (await generateTOTP(lastPeerSecret, 0)).toString().padStart(6, '0');
                        document.body.classList.remove('start');
                        window.enteredDigits.textContent = typedOTP;
                        socket.send(JSON.stringify({ typedOTP, fromOTP: await getOTPs(secret) }));
                    } else {

                        if (urlDigits) {
                            typedOTP = urlDigits;
                            document.body.classList.remove('start');
                            window.enteredDigits.textContent = typedOTP;
                            socket.send(JSON.stringify({ typedOTP, fromOTP: await getOTPs(secret) }));
                        }
                    }

                    document.body.addEventListener('keydown', onKeyDown);
                };

                socket.onmessage = (e) => {
                    if (tryTimeResolve(socket, e)) return;
                    const incoming = JSON.parse(e.data);
                    if (incoming === true) {
                        document.body.removeEventListener('keydown', onKeyDown);
                        stopClockDisplay();
                        socket.send(JSON.stringify({ secret }));
                        socket.onmessage = (e) => {

                            try {
                                socket.peerSecret = JSON.parse(e.data).secret;
                                if (socket.peerSecret) {
                                    socket.secret = secret;

                                    sessionStorage.setItem('secret', socket.secret);
                                    sessionStorage.setItem('peerSecret', socket.peerSecret);

                                    if (lastSecretTimeout) {

                                        clearTimeout(lastSecretTimeout)
                                        lastSecretTimeout = null;
                                    }


                                    const initiator = socket.peerSecret < secret;

                                    const userSocket = abstractMessenger({ sender: sendViaWebsocket });

                                    socket.onmessage = function receiveViaWebsocket(e) {
                                        if (tryTimeResolve(socket, e)) return;
                                        try {
                                            const { data } = JSON.parse(e.data);

                                            if (data) {
                                                userSocket.emit('message', asEvent ? { data } : data);
                                            }

                                        } catch (e) {

                                        }

                                    };

                                    startPeer(userSocket, initiator);


                                    resolve(userSocket);


                                }
                            } catch (e) {

                            }


                        };



                    }
                };


                socket.onclose = (e) => {
                    location.reload();
                };



                function startPeer(userSocket, initiator) {

                    let peer = new SimplePeer({ initiator, trickle: false });

                    socket.onmessage = function (e) {
                        if (tryTimeResolve(socket, e)) return;
                        const { signal, data } = JSON.parse(e.data);
                        if (signal) {
                            console.log("got signal from ws", signal);
                            peer.signal(signal);
                        } else {
                            if (data) {
                                console.log("got data from ws", data);

                                userSocket.emit('message', data);
                            }
                        }
                    };

                    peer.on('signal', function (signal) {
                        console.log("relaying signalto peer via ws:", signal);
                        socket.send(JSON.stringify({ signal }));
                    });

                    peer.once('connect', function () {
                        console.log("peer connected");

                        userSocket.off('send');
                        userSocket.on('send', function (data) {

                            console.log("sending via webrtc peer:", data);

                            peer.send(data);

                        });

                        peer.on('data', peer_on_data);


                    });

                    peer.on('error', peer_on_error);

                    peer.on('close', peer_on_close);

                    function peer_on_data(x) {

                        userSocket.emit('message', asEvent ? { data: x.toString() } : x.toString());

                    }

                    function peer_on_error() {
                        userSocket.off('send');
                        userSocket.on('send', sendViaWebsocket);
                        peer.off('close', peer_on_close);
                        peer.off('data', peer_on_data);

                        setTimeout(startPeer, 500, userSocket, initiator);
                    }

                    function peer_on_close() {

                        userSocket.off('send');
                        userSocket.on('send', sendViaWebsocket);

                        setTimeout(startPeer, 500, userSocket, initiator);


                    }

                }


                function sendViaWebsocket(data) {

                    console.log("sending via ws:", data);
                    socket.send(JSON.stringify({ data }));
                }






                async function onKeyDown(e) {

                    if (e.key >= '0' && e.key <= '9') {

                        typedOTP = (typedOTP + e.key).substr(-6);
                        window.enteredDigits.textContent = typedOTP;
                        if (typedOTP.length === 6) {
                            socket.send(JSON.stringify({ typedOTP, fromOTP: await getOTPs(secret) }));
                        }
                        document.body.className = '';
                    }


                    else {

                        if (e.key === "q") {

                            showqr(window.digits.textContent);

                        } else {
                            document.body.className = ''
                        }
                    }

                }

            }

            async function getOTPs(secret) {

                const arr = [];
                for (let i = -3; i < 1; i++) {
                    arr.push((await generateTOTP(secret, i)).toString().padStart(6, '0'));
                }

                return arr;
            }

            async function displayTOTP(secret, first) {

                const warn = 27000;

                const animatedElement = document.querySelector(clockQ);

                window.digits.textContent = (await generateTOTP(secret)).toString().padStart(6, '0');

                if (document.body.classList.contains('qr')) {
                    showqr(window.digits.textContent);
                }

                const currentTime = getTime();// Date.now();
                const elapsedTime = currentTime % 30000;
                const msecToNextTotp = 30000 - elapsedTime;



                if (first) {
                    const currentTime = getTime();// Date.now();
                    const elapsedTime = currentTime % 30000;
                    if (elapsedTime < warn) {
                        animatedElement.className = 'green';

                        setTimeout(function () {
                            animatedElement.className = 'red';

                        }, warn - elapsedTime);


                    } else {
                        animatedElement.className = 'red';
                    }

                } else {

                    animatedElement.className = 'green';

                    setTimeout(function () {
                        animatedElement.className = 'red';
                    }, warn);
                }

                setTimeout(displayTOTP, msecToNextTotp, secret, false);
            }

            async function kickStartTimerLoop() {
                const animatedElement = document.querySelector(clockQ);
                const digits = document.querySelector(digitsQ);

                const secret = lastSecret ? lastSecret : await generateSecret();





                function getElapsedTimeDegrees() {
                    const currentTime = getTime();// Date.now();
                    const elapsedTime = currentTime % 30000;
                    const degrees = (elapsedTime / 30000) * 360;
                    return degrees;
                }

                async function startAnimation(first) {

                    //await getTime_();
                    const elapsedTimeDegrees = getElapsedTimeDegrees();
                    animatedElement.style.setProperty('--lead-in-degrees', `${elapsedTimeDegrees}deg`);
                    animatedElement.style.animation = `fadeIn 0.5s forwards, leadInAnimation ${elapsedTimeDegrees / 360 * 30}s linear forwards, syncAnimation 30s linear infinite`;

                }


                startAnimation();

                let int = setInterval(startAnimation, 30000);

                displayTOTP(secret, true);

                openWebsocket(secret);

                stopClockDisplay = function () {
                    clearInterval(int);
                    document.body.className = "connected";
                };

            }
        });
    }



    function showqr(code) {

        const qrcode_el = document.getElementById("qrcode");

        if (!qrcode) return;

        qrcode_el.innerHTML = "";
        let size = 300,
            qrcode = new QRCode(qrcode_el, {
                text: location.href.split('?')[0] + '?' + code,
                width: size,
                height: size,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H,
            });

        document.body.className = 'qr'

    }

    function abstractMessenger({ sender }) {

        const events = new Map([
            ['message', new Set()],
            ['send', new Set()],
            ['close', new Set()],
            ['error', new Set()]
        ]);
        const self = {
            on, off,
            addEventListener: on, removeEventListener: off,
            addListener: on, removeListener: off,
            removeAllListeners: clear,
            removeListeners: clear,
            emit,
            send
        };


        if (sender) {
            events.get('send').add(sender);
        }

        function emit(e, ...args) {
            if (events.has(e)) {
                events.get(e).forEach((fn) => { fn(...args); });
            }
            const fn = self['on' + e];
            if (typeof fn === 'function') {
                fn(...args);
            }
        }
        function on(e, fn) {
            if (events.has(e) && typeof fn === 'function') {
                events.get(e).add(fn);
            }
        }
        function off(e, fn) {
            if (events.has(e)) {
                if (typeof fn === 'function') {
                    events.get(e).delete(fn);
                } else {
                    events.get(e).clear();
                }
            }
        }

        function clear() {
            events.forEach((set) => {
                set.clear();
            });
        }

        function send(text) {
            emit('send', text);
        }


        return self;


    }
}