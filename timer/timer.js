

/*jshint maxerr: 10000 */

/* global fs_api,ace,keycodes,keyNames,keyNamesHtml*/

const oneSecond = 1000;
const oneMinute = 60 * oneSecond;
const skip_granularity = 15 * oneSecond;

const ace_url = "https://cdnjs.cloudflare.com/ajax/libs/ace/1.15.2/ace.js";
const ace_hash = "sha512-NSbvq6xPdfFIa2wwSh8vtsPL7AyYAYRAUWRDCqFH34kYIjQ4M7H2POiULf3CH11TRcq3Ww6FZDdLZ8msYhMxjg==";

var timerWin;

window.addEventListener("unload", onControlUnload);

let doc = document;
let qs = doc.querySelector.bind(doc);
let getEl = doc.getElementById.bind(doc);

let shifting = false;
let controlling = false;

let stylesheet1 = getEl("style_1");
let stylesheet1_obj;


replaceStylesheet(stylesheet1, function (ev) {
    stylesheet1_obj = ev;
});

let aceScript;
let elapsedDisp = getEl("elapsed_disp");
let remainDisp = getEl("remain_disp");
let startedDisp = getEl("started_disp");
let endsDisp = getEl("ends_disp");

let remainInfoDisp = getEl("remain_info_message");

let custom_message = getEl("custom_message");

let keycodesEdit = document.querySelector("#custom_key_edit div");
updateKeycodesEdit(keycodesEdit);


let durationDisp = getEl("duration_disp");
let extraTimeDisp = getEl("extra_time_disp");

let nowDisp = getEl("now_disp");
let keyDisp = getEl("key_disp");
let dispNextMins = getEl("disp_next_mins");
let html = qs("html");
let progress = qs('.progress');
let pausedAt;
let pauseAcum = 0;

let runMode = "controller";

let timerStack = [];

var audioTrig = null;

if (window.location.search.startsWith("?presenter")) {

    html.classList.add("reduced");
    runMode = "presenter";
    if (fs_api.isFullscreen()) {
        document.title = "Presentation Timer - Remote Screen (Fullscreen)";
    } else {
        document.title = "Presentation Timer - Remote Screen";
    }

} else {

    if (fs_api.isFullscreen()) {
        document.title = "Presentation Timer - Control Screen (Fullscreen)";
    } else {
        document.title = "Presentation Timer - Control Screen";
    }

}

let defaultDuration = readNumber("defaultDuration", 10 * oneMinute);
let thisDuration = defaultDuration;
let startedAt = readNumber("startedAt", Date.now());
let endsAt = readNumber("endsAt", startedAt + defaultDuration);
let seekEndsAt = readNumber("seekEndsAt", endsAt);


let lastUpdateTick = 0;
let lastTimeText = "";
let enterTimeText = "";
let enterHoursText = "";
let tab_id = "tab_" + Date.now().toString();

custom_message.addEventListener('focus', function () {
    setTimeout(function () {
        document.execCommand('selectAll', false, null);
    }, 2);
});


progress.style.width = '0%';

dispNextMins.textContent = secToStr(defaultDuration / 1000);

let restartNeeded = isNaN(startedAt) || isNaN(endsAt);
if (!restartNeeded) {

    let overshoot = 1000 * 60 * 10;
    if ((Date.now() > endsAt + overshoot) || (Date.now() > seekEndsAt + overshoot)) {
        restartNeeded = true;
    }

}

if (restartNeeded) {
    restartTimer();
} else {

    if ((Date.now() > endsAt) || (Date.now() > seekEndsAt)) {
        endsAt = seekEndsAt;
        setHtmlClass("over");
    }
    startedDisp.textContent = new Date(startedAt).toLocaleTimeString();
    endsDisp.textContent = new Date(endsAt).toLocaleTimeString();
    durationDisp.textContent = secToStr((endsAt - startedAt) / 1000);


    pausedAt = readNumber("pausedAt", pausedAt);
    pauseAcum = readNumber("pauseAcum", pauseAcum);



    if (pausedAt !== undefined) {
        setHtmlClass("paused");
    }


    displayUpdate();

    if (readNumber("showbar", 0) === 1) {
        setHtmlClass("showbar");
    }

    if (readNumber("showtimenow", 0) === 1) {
        setHtmlClass("showtimenow");
    } else {
        clearHtmlClass("showtimenow");

    }


    if (readNumber("showmessages", 0) === 1) {
        setHtmlClass("showmessages");
    } else {
        clearHtmlClass("showmessages");
    }



    localStorage.setItem("remainDispClass", html.className);
}

dispNextMins.textContent = secToStr(defaultDuration / oneSecond);

setInterval(displayUpdate, 100);
doc.addEventListener("keyup", onDocKeyUp);
doc.addEventListener("keydown", onDocKeyDown);
doc.addEventListener("audio-trigger",onAudioTrigger);

doc.addEventListener("contextmenu", function (e) { e.preventDefault(); });
addEventListener('storage', onLocalStorage);

[].forEach.call(document.querySelectorAll('div.buttons div.btn'), function (el) {
    el.addEventListener('click', keyMacroClick);
});

function keyMacroClick(e) {

    // the keycodes used by the button are stored in the "keys" attribute
    // and are encoded as a comma separated list of keycodes, using the default value
    // when executed, they are converted to the current keymap, so macros don't need to 
    // be redefined when the keymap changes.
    // since keycodes are only ever numbers (which are not redifinable in the keymap, or Space and Enter, and a few sepecial keys like Control, Shift, etc),
    // the only "encoding" that takes place when a macro is recorded is for Space and Enter
    let keys = this.dataset.keys.split(",").map(function (code) {

        if (code.startsWith('!')) {

            return { key: code.substr(1), __up: true };
        } else {
            return { key: code };
        }
    });

    if (e.shiftKey && keys[0].key === " ") {

        if (enterTimeText !== "") {
            // typed in a duration and pressed shift while clicking the button
            // this means "set this button to the duration I just typed"
            this.dataset.keys = ' ,' + enterTimeText.split('').join(',') + ', ';
            this.innerHTML = enterTimeText;
            clearHtmlClass("editing");
            dispNextMins.textContent = secToStr(defaultDuration / 1000);
            enterTimeText = "";
            return;

        } else {
            // pressed shift while clicking the button (no duration typed)
            // this means "use the duration of the click button as the new default duration"
            keys = this.dataset.keys.split(",").map(function (code) {
                if (code === " ") {
                    return { key: "Enter" };// replace space with enter, which forces a set default command, rather than a start timer command
                }
                return { key: keycodes[code] || code };
            });
        }
    }

    keys.forEach(function (e_encoded) {
        // make a temp event object for the document key handler
        // the keycodes are converted to the current keymap
        // since we only inspect .key in the event object, we can just create a new object
        // with only the .key property
        let e = {
            key: keycodes[e_encoded.key] || e_encoded.key
        };

        if (e_encoded.__up) {
            onDocKeyUp(e);
        } else {
            onDocKeyDown(e);
        }
    });
}

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

function displayUpdate() {

    let tabCount = getTabCount(), timeNow = Date.now();
    let controllerCount = getTabCount(true);

    if (tabCount === 1) {
        clearHtmlClass("twoplus");
    } else {
        setHtmlClass("twoplus");
    }

    if (!fs_api.isFullscreen()) {
        if (runMode === "presenter") {
            if (tabCount === 1) {
                document.title = "Presentation Timer - Single Window";
            } else {
                document.title = "Presentation Timer - Remote Screen";
            }
        } else {
            if (runMode === "controller") {
                document.title = "Presentation Timer - Control Screen";
            } else {
                document.title = "Presentation Timer";
            }
        }
    } else {
        if (runMode === "presenter") {
            document.title = "Presentation Timer - Remote Screen (Fullscreen)";
        } else {
            if (runMode === "controller") {
                document.title = "Presentation Timer - Control Screen (Fullscreen)";
            } else {
                document.title = "Presentation Timer (Fullscreen)";
            }
        }
    }

    if (runMode === "controller" || tabCount === 1) {

        let pausedMsec = pausedAt ? timeNow - pausedAt : 0;

        let actualRemain = (seekEndsAt - timeNow) / oneSecond;
        if (actualRemain > 0) actualRemain++;

        if (seekEndsAt < endsAt - 500) {

            if (seekEndsAt < endsAt - skip_granularity) {
                //endsAt -= skip_granularity;
            }

            endsAt -= 25;
            setRemainClass("adjustingDown");
            clearRemainClass("adjusting");

            keyDisp.textContent = "speeding up to match actual time (" + secToStr(actualRemain) + ")  " + Number((endsAt - seekEndsAt) / oneSecond).toFixed(1) + " seconds offset";
            writeNumber("endsAt", endsAt);
        } else {
            if (seekEndsAt > endsAt + 500) {
                if (seekEndsAt > endsAt + skip_granularity) {
                    //endsAt += skip_granularity;
                }
                endsAt += 25;
                setRemainClass("adjusting");
                clearRemainClass("adjustingDown");
                keyDisp.textContent = "slowing down to match actual time (" + secToStr(actualRemain) + ")  " + Number((endsAt - seekEndsAt) / oneSecond).toFixed(1) + " seconds offset";
                writeNumber("endsAt", endsAt);
            } else {
                endsAt = seekEndsAt;
                clearRemainClass("adjusting");
                clearRemainClass("adjustingDown");
                keyDisp.textContent = tabCount === 1 ? "" : controllerCount > 1 ? "MULTIPLE CONTROLLERS TABS ARE OPEN. CLOSE ONE!" : pausedMsec === 0 ? "remote display active" : "countdown was paused at " + new Date(pausedAt).toLocaleTimeString();
                writeNumber("endsAt", endsAt);
            }
        }


        let secondsRemain = ((endsAt - timeNow) + (pausedMsec)) / oneSecond;
        let timeText, elapsedText;


        if (pausedMsec != 0) {
            remainInfoDisp.textContent = runMode === "presenter" ? "Paused" : secToStr(pausedMsec / oneSecond);
            endsDisp.textContent = new Date(seekEndsAt + pausedMsec).toLocaleTimeString();
            extraTimeDisp.textContent = "+ " + secToStr((pauseAcum + pausedMsec) / oneSecond) + " pauses";

        } else {
            remainInfoDisp.textContent = "";
            if (pauseAcum === 0) {
                extraTimeDisp.textContent = "";
            } else {
                extraTimeDisp.textContent = "+ " + secToStr(pauseAcum / oneSecond) + " pauses";
            }
        }




        let elapsedMSec = (timeNow - startedAt) - (pausedMsec + pauseAcum);
        if (elapsedMSec < 0) {

            setHtmlClass("future");
            if (elapsedMSec > -60000) {
                setHtmlClass("impending");
            } else {
                clearHtmlClass("impending");
            }
            seekEndsAt = startedAt + thisDuration;
            bumpEnd(0, 0);
            endsAt = seekEndsAt;
            elapsedText = secToStr((0 - elapsedMSec) / oneSecond);
            elapsedDisp.textContent = elapsedText;
            timeText = secToStr(thisDuration / 1000);
            localStorage.setItem("elapsedDisp", elapsedText);



        } else {

            clearHtmlClass("future");
            if (secondsRemain >= 0) {
                timeText = secToStr(secondsRemain + 1);

            } else {
                timeText = secToStr((0 - secondsRemain));

            }
            elapsedText = secToStr(elapsedMSec / oneSecond);

        }

        if (lastTimeText !== timeText) {
            if (lastUpdateTick === 0 || timeNow - lastUpdateTick > 750) {
                lastUpdateTick = timeNow;
                remainDisp.textContent = timeText;
                elapsedDisp.textContent = elapsedText;


                lastTimeText = timeText;

                if (secondsRemain >= 0) {

                    clearHtmlClass("over");

                    if (elapsedMSec >= 0) {
                        if (secondsRemain <= 60) {
                            setHtmlClass("impending");
                        } else {
                            clearHtmlClass("impending");
                        }
                    }

                    setBar(elapsedMSec, thisDuration);
                } else {
                    setHtmlClass("over");
                    clearHtmlClass("impending");

                    setBarPct(100);
                }
                localStorage.setItem("remainDisp", timeText);
            }
        }
        localStorage.setItem("remainDispClass", html.className);

    } else {
        keyDisp.textContent = tabCount + " tabs open";
    }
    nowDisp.textContent = timeNowStr();
}

function updateEnteredTimeText() {
    if (enterHoursText === "") {
        dispNextMins.textContent = secToStr(Number(enterTimeText) * 60);
    } else {
        dispNextMins.textContent = secToStr((Number(enterHoursText) * 3600) + (Number(enterTimeText) * 60));
    }
}

function replaceStylesheet(el, cb) {

    let src = el.href;
    var xhr = new XMLHttpRequest(),
        css = '';//Empty string variable intended for the XMLHttpRequest response data...

    function processRequest() {
        if (xhr.readyState == 4) {
            css = this.responseText;
            let editor, editorPre;
            let sheet = document.createElement('style');
            sheet.innerHTML = css;
            let storedCss = localStorage.getItem("custom_css");
            if (storedCss) {
                sheet.innerHTML = storedCss;
                document.body.appendChild(sheet);
                el.parentNode.removeChild(el);
            }
            if (cb) {
                cb(Object.defineProperties({}, {
                    sheet: { value: sheet },
                    css: {
                        set: function (newCss) {
                            sheet.innerHTML = newCss;
                        },
                        get: function () {
                            return sheet.innerHTML;
                        }
                    },
                    reset: {
                        value: function () {
                            sheet.innerHTML = css;
                            localStorage.removeItem("custom_css");
                        }
                    },
                    editToggle: {

                        value: function () {
                            if (editor) {
                                sheet.innerHTML = editor.getValue();
                                localStorage.setItem("custom_css", sheet.innerHTML);
                                editorPre.parentNode.removeChild(editorPre);
                                editor = undefined;
                            } else {
                                let startEditor = function () {

                                    editorPre = document.createElement("pre");
                                    editorPre.id = "css_editor";
                                    document.body.appendChild(editorPre);

                                    setTimeout(function () {
                                        editor = ace.edit("css_editor");
                                        editor.setTheme("ace/theme/chrome");
                                        editor.session.setMode("ace/mode/css");
                                        editor.setValue(sheet.innerHTML);
                                        editor.focus();
                                        editor.gotoLine(1);
                                    }, 10);
                                };

                                if (aceScript) {


                                    let iv = setInterval(function () {
                                        if (window.ace) {
                                            clearInterval(iv);
                                            startEditor();
                                        }
                                    }, 100);

                                } else {


                                    aceScript = document.createElement("script");
                                    aceScript.setAttribute('integrity', ace_hash);
                                    aceScript.setAttribute('crossorigin', "anonymous");
                                    aceScript.setAttribute('referrerpolicy', "no-referrer");
                                    aceScript.setAttribute('src', ace_url);
                                    document.body.appendChild(aceScript);

                                    let iv = setInterval(function () {
                                        if (window.ace) {
                                            clearInterval(iv);
                                            startEditor();
                                        }
                                    }, 100);

                                }

                            }
                        }
                    },
                    editing: {
                        get: function () {
                            return !!editor;
                        }
                    }
                }));
            }
        }
    }

    xhr.responseType = 'text';
    xhr.open('GET', src);
    xhr.onreadystatechange = processRequest;
    xhr.send();

}

function restartTimer() {
    lastUpdateTick = 0;
    startedAt = Date.now();
    endsAt = startedAt + defaultDuration;
    pausedAt = undefined;
    pauseAcum = 0;
    thisDuration = defaultDuration;
    seekEndsAt = endsAt;
    startedDisp.textContent = new Date(startedAt).toLocaleTimeString();
    endsDisp.textContent = new Date(endsAt).toLocaleTimeString();
    durationDisp.textContent = secToStr(defaultDuration / 1000);
    extraTimeDisp.textContent = "";


    writeNumber("pausedAt", pausedAt);
    writeNumber("pauseAcum", pauseAcum);

    writeNumber("startedAt", startedAt);
    writeNumber("endsAt", endsAt);
    writeNumber("seekEndsAt", seekEndsAt);
    clearHtmlClass("countup-override");
    clearHtmlClass("paused");
    setBarPct(0);
}

function pushTimer (msec,msg) {
     
   let pushed = {
            startedAt: startedAt,
            endsAt: endsAt, 
            pausedAt: pausedAt,
            pauseAcum: pauseAcum,
            thisDuration: thisDuration,
            defaultDuration : defaultDuration,
            custom_message : custom_message.textContent,
            showing_custom_message : html.classList.contains("show_custom_message")
   };

   timerStack.push(pushed);
   defaultDuration = msec;
   restartTimer();
   if (msg ) {
        custom_message.textContent = msg;
        html.classList.add("show_custom_message");
   } else {
        custom_message.textContent = "";
        html.classList.remove("show_custom_message");                
   }
}

function popTimer () {
   let popped = timerStack.pop();
   if (popped) {
        startedAt = popped.startedAt;
        endsAt = popped.endsAt;
        pausedAt = popped.pausedAt;
        pauseAcum = popped.pauseAcum;
        thisDuration = popped.thisDuration;
        defaultDuration = popped.defaultDuration;
        custom_message.textContent = popped.custom_message;
        if (popped.showing_custom_message) {
            html.classList.add("show_custom_message");
        } else {
            html.classList.remove("show_custom_message");
        }
        displayUpdate();
   }
}

function getAudioInput(cb) {
    navigator.mediaDevices.enumerateDevices().then(function (devices) {
        devices = devices.filter(function (d) {
            return d.kind === 'audioinput';
        });

        switch (devices.length) {

            case 0: {
                localStorage.removeItem("audioInput");
                clearHtmlClass("audio-setup");

                return cb(undefined);
            }

            case 1: {
                localStorage.removeItem("audioInput");
                clearHtmlClass("audio-setup");

                return cb(devices[0].deviceId);
            }

            default: {
                let stored = localStorage.getItem("audioInput");
                if (stored) {
                    clearHtmlClass("audio-setup");

                    return cb(stored);
                    break;
                }

                let el = qs("#audio-setup div");
                el.innerHTML = devices.map(function (d) {
                    return "<button value='" + d.deviceId + "'>" + d.label + "</button><br>";
                }).join("\n");

                el.querySelectorAll("button").forEach(function (b) {
                    b.addEventListener("click", function () {
                        let audioInput = b.value;
                        localStorage.setItem("audioInput", audioInput);
                        el.innerHTML = "";
                        clearHtmlClass("audio-setup");
                        cb(b.value);
                    });
                });
                setHtmlClass("audio-setup");

            }
        }
    });
}

function setPresenterMode() {
    runMode = "presenter";
    html.classList.add("reduced");

}

function setControllerMode() {
    runMode = "controller";
    html.classList.remove("reduced");
}

function extendDefaultToCurrentTimer() {
    lastUpdateTick = 0;
    endsAt = startedAt + defaultDuration;
    thisDuration = defaultDuration;
    seekEndsAt = endsAt;
    writeNumber("endsAt", endsAt);
    writeNumber("seekEndsAt", seekEndsAt);
    durationDisp.textContent = secToStr(defaultDuration / 1000);
    displayUpdate();
}


function onLocalStorage(ev) {



    if (runMode === "presenter" && (ev.key === "showbar" || ev.key.startsWith("remainDisp"))) {

        remainDisp.textContent = localStorage.getItem("remainDisp");
        html.className = localStorage.getItem("remainDispClass") + " reduced";
        if (readNumber("showbar", 0) === 1) {
            setHtmlClass("showbar");
            setBarPct(Number(localStorage.getItem("barpct")));
        } else {
            clearHtmlClass("showbar");
        }



    }

    if (ev.key === "elapsedDisp") {
        elapsedDisp.textContent = localStorage.getItem("elapsedDisp");
    }

    if (ev.key === "showtimenow") {

        if (readNumber("showtimenow", 0) === 1) {
            setHtmlClass("showtimenow");
        } else {
            clearHtmlClass("showtimenow");


        }

    }

    if (ev.key === "showmessages") {

        if (readNumber("showmessages", 0) === 1) {
            setHtmlClass("showmessages");
        } else {
            clearHtmlClass("showmessages");
        }

    }

    if (ev.key === "custom_message") {
        let msg = localStorage.getItem("custom_message");
        custom_message.textContent = msg;
        if (msg === "") {
            clearHtmlClass("show_custom_message");
        } else {
            setHtmlClass("show_custom_message");
        }

    }

    if (stylesheet1_obj && !stylesheet1_obj.editing && ev.key === "custom_css") {

        let storedCss = localStorage.getItem("custom_css");
        if (storedCss) {
            stylesheet1_obj.css = storedCss;
        } else {
            stylesheet1_obj.reset();
        }

    }
}

function getTabCount(cont) {
    let dead = [];
    let count = 1, tickNow = Date.now(), oldest = tickNow - 3000;
    if (getTabCount.last) {
        // use cached value if it's less than 500ms old
        if (getTabCount.last > tickNow - 500) {
            return getTabCount.count;
        }
    }
   
    if (!cont) {
        writeNumber(tab_id, tickNow);
        if (runMode === "controller") {
            writeNumber("controller_" + tab_id, tickNow);
        } else {
            localStorage.removeItem("controller_" + tab_id);
        }
    }

    for (let i = 0; i < localStorage.length; i++) {
        let key = localStorage.key(i);
        if (key !== tab_id && key.startsWith("tab_")) {
            if (Number(localStorage.getItem(key)) < oldest) {
                dead.push(key);
            } else {
                if (cont) {
                    if (readNumber("controller_" + key, 0) > 0) {
                        count++;
                    }
                } else {
                    count++;
                }
            }

        } else {

            if (key.startsWith("controller_tab_")) {
                if (Number(localStorage.getItem(key)) < oldest) {
                    dead.push(key);
                }
            }
        }

    }
    dead.forEach(function (key) {
        localStorage.removeItem(key);
    });
    getTabCount.count = count;
    getTabCount.last = tickNow;
    return count;
}

let custom_msg_timeout;

function onAudioTrigger() {
    //start the timer
    onDocKeyDown({ key: keycodes.Space });
    if (audioTrig) {
        // dispose of the audio monitor
        audioTrig.hide();
        audioTrig.stop();
        writeNumber("audioThreshold", audioTrig.getThreshold());        
        audioTrig=null;
    }

}

function onDocKeyDown(ev) {

    if (html.classList.contains("edit_custom_message")) {

        if (ev.key === keycodes.Enter || ev.key === keycodes.ENTER) {
            custom_message.contentEditable = false;
            html.classList.remove("edit_custom_message");
            if (custom_message.textContent === "custom message") {
                html.classList.remove("show_custom_message");
                localStorage.setItem("custom_message", "");

            } else {
                html.classList.add("show_custom_message");
                custom_msg_timeout = setTimeout(function () {
                    custom_msg_timeout = undefined;
                    localStorage.setItem("custom_message", custom_message.textContent);
                }, 500);
            }
        }
        return;
    } else {
        if (html.classList.contains("show_custom_message")) {

            if (ev.key === keycodes.c || ev.key === keycodes.C) {
                html.classList.remove("edit_custom_message");
                html.classList.remove("show_custom_message");
                if (custom_msg_timeout) {
                    clearTimeout(custom_msg_timeout);
                    custom_msg_timeout = undefined;
                }
                localStorage.setItem("custom_message", "");
                return;


            }

        }
    }

    if (html.classList.contains("custom_key_edit")) {
        if (html.classList.contains("defining")) {
            return false;
        }
        ev.preventDefault();
        if (keyWasPressed("KeyCodeEditor", ev)) {
            html.classList.remove("custom_key_edit");
            return;
        }
        // when editing keycodes, ignore all other keys in this callback
        return false;

    }




    if (stylesheet1_obj && stylesheet1_obj.editing && location.protocol === "https:") {


        if (keyWasPressed("StyleEditor", ev) && ev.ctrlKey) {
            ev.preventDefault();
            stylesheet1_obj.editToggle();
            if (ev.shiftKey) {
                stylesheet1_obj.reset();
            }
        }

        return;

    }

    let tabCount = getTabCount(), timeNow = Date.now();

    let factor = controlling ? 60000 : 1000;

    let endDelta = controlling ? 60000 : 0;
    let seekEndDelta = controlling ? 60000 : 1000;


    if (typeof ev.key === 'string' && ((ev.key >= 1 && ev.key <= 9) || ev.key === "0")) {
        enterTimeText = enterTimeText + "" + ev.key;
        setHtmlClass("editing");
        updateEnteredTimeText();
    } else {


        if (keyWasPressed("Space", ev)) {

            const preserve_default = defaultDuration;

            if (controlling) {
                lastUpdateTick = 0;
                endsAt = seekEndsAt;
                clearRemainClass("adjusting");
                clearRemainClass("adjustingDown");
                keyDisp.textContent = tabCount + " tabs open";
                writeNumber("endsAt", endsAt);
            } else {
                saveEditedTime();

                if (shifting)
                    extendDefaultToCurrentTimer();
                else
                    restartTimer();

                if (defaultDuration !== preserve_default) {
                    defaultDuration = preserve_default;
                    dispNextMins.textContent = secToStr(defaultDuration / 1000);
                    clearHtmlClass("editing");
                    writeNumber("defaultDuration", defaultDuration);
                }

            }
            return;
        }

        if (keyWasPressed("KeyCodeEditor", ev)) {
            html.classList.add("custom_key_edit");
            return;
        }

        if (keyWasPressed("Pause", ev)) {

            html.classList.toggle("paused");
            if (html.classList.contains("paused")) {
                pausedAt = Date.now();
                writeNumber("pausedAt", pausedAt);
                endsAt = seekEndsAt;
                extraTimeDisp.textContent = "+ " + secToStr(pauseAcum / oneSecond) + " pauses";

            } else {
                let pausedMsec = pausedAt ? timeNow - pausedAt : 0;
                pausedAt = undefined;
                seekEndsAt += pausedMsec;
                pauseAcum += pausedMsec;
                writeNumber("pausedAt", pausedAt);
                writeNumber("pauseAcum", pauseAcum);

                extraTimeDisp.textContent = "+ " + secToStr(pauseAcum / oneSecond) + " pauses";

                endsAt = seekEndsAt;
                endsDisp.textContent = new Date(seekEndsAt).toLocaleTimeString();

            }



            return;
        }

        if (keyWasPressed("UndoPause", ev)) {

            clearHtmlClass("paused");
            pausedAt = undefined;
            pauseAcum = 0;
            extraTimeDisp.textContent = "";

            seekEndsAt = startedAt + thisDuration;
            endsAt = seekEndsAt;
            endsDisp.textContent = new Date(seekEndsAt).toLocaleTimeString();

            return;

        }

        if (keyWasPressed("Period", ev)) {
            if ((enterTimeText !== "") && (enterTimeText.indexOf(".") < 0)) {

                enterTimeText = enterTimeText + ev.key;
                setHtmlClass("editing");
                updateEnteredTimeText();

            }
            return;
        }


        if (keyWasPressed("Colon", ev)) {
            if (enterHoursText === "") {
                enterHoursText = enterTimeText;
                enterTimeText = "";
                setHtmlClass("editing");
                dispNextMins.textContent = secToStr((Number(enterHoursText) * 3600) + (Number(enterTimeText) * 60));
            }
            return;
        }


        if (keyWasPressed("Backspace", ev)) {

            if (enterTimeText !== "") {
                enterTimeText = enterTimeText.substr(0, enterTimeText.length - 1);
                updateEnteredTimeText();
            } else {
                clearHtmlClass("editing");
                dispNextMins.textContent = secToStr(defaultDuration / 1000);

            }
            return;
        }

        if (keyWasPressed("Enter", ev)) {

            if (controlling) {
                lastUpdateTick = 0;
                endsAt = seekEndsAt;
                clearRemainClass("adjusting");
                clearRemainClass("adjustingDown");
                keyDisp.textContent = tabCount + " tabs open";
                writeNumber("endsAt", endsAt);
            } else {
                saveEditedTime();
            }
            return;
        }

        if (keyWasPressed("QuitApp", ev)) {
            if (controlling) {
                if (is_nwjs()) {
                    require('nw.gui').App.quit();
                }
            }

            return;
        }


        if (keyWasPressed("ArrowDown", ev)) {


            //if (controlling && ev.key==="-") break;

            if (!html.classList.contains("editing")) {
                if (shifting) {
                    bumpStart(factor);
                } else {
                    bumpEnd(0 - seekEndDelta, 0 - endDelta);
                }
                durationDisp.textContent = secToStr((seekEndsAt - startedAt) / 1000);
                displayUpdate();
            }
            else {

            }
            return;
        }


        if (keyWasPressed("ArrowUp", ev)) {
            //if (controlling && ev.key==="+") break;

            if (!html.classList.contains("editing")) {
                if (shifting) {
                    bumpStart(0 - factor);
                } else {
                    bumpEnd(seekEndDelta, endDelta);
                }
                durationDisp.textContent = secToStr((seekEndsAt - startedAt) / 1000);
                displayUpdate();
            }
            else {

            }
            return;
        }

        if (keyWasPressed("ArrowLeft", ev)) {
            bumpStart(0 - factor);
            bumpEnd(0 - seekEndDelta, 0 - endDelta);

            durationDisp.textContent = secToStr((seekEndsAt - startedAt) / 1000);
            displayUpdate();

            return;
        }

        if (keyWasPressed("ArrowRight", ev)) {
            bumpStart(factor);
            bumpEnd(seekEndDelta, endDelta);

            durationDisp.textContent = secToStr((seekEndsAt - startedAt) / 1000);
            displayUpdate();

            return;
        }

        if (ev.key === "Shift") {
            shifting = true;
            setHtmlClass("shifting");
            return;
        }

        if (ev.key === "Control") {
            controlling = true;
            setHtmlClass("controlling");
            return;
        }



        if (ev.key === "i" || ev.key === "I") {
            if (controlling && shifting) {
                ev.preventDefault();
            }
            return;
        }



        if (keyWasPressed("ToggleFullScreen", ev)) {
            if (fs_api.isFullscreen()) {
                fs_api.exitFullscreen();
            } else {
                fs_api.enterFullscreen();
            }
            return;

        }

        if (keyWasPressed("ToggleProgressBar", ev)) {
            html.classList.toggle("showbar");
            writeNumber("showbar", html.classList.contains("showbar") ? 1 : 0);

            return;
        }


        if (keyWasPressed("ToggleMessagesMode", ev)) {
            html.classList.toggle("showmessages");
            writeNumber("showmessages", html.classList.contains("showmessages") ? 1 : 0);
            return;
        }

        if (keyWasPressed("ToggleTimeOfDay", ev)) {
            html.classList.toggle("showtimenow");
            writeNumber("showtimenow", html.classList.contains("showtimenow") ? 1 : 0);
            return;
        }

        if (keyWasPressed("TogglePresenterScreen", ev)) {

            if (window.location.search !== "?presenter" && tabCount === 1) {
                html.classList.toggle("reduced");
                runMode = html.classList.contains("reduced") ? "presenter" : "controller";

            }
            html.classList[html.classList.contains("reduced") ? "remove" : "add"]("showbuttons");
            return;
        }



        if (keyWasPressed("SingleScreenMode", ev)) {



            if (window.location.search !== "?presenter" && tabCount === 1) {
                html.classList.add("reduced");
                html.classList.add("showbuttons");
                runMode = "presenter";
                if (!fs_api.isFullscreen()) {
                    fs_api.enterFullscreen();
                }
            }

            return;
        }


        if (keyWasPressed("StyleEditor", ev)) {
            if (ev.ctrlKey) {
                if (stylesheet1_obj) {
                    if (ev.shiftKey) {
                        stylesheet1_obj.reset();
                        if (stylesheet1_obj.editing) {
                            stylesheet1_obj.editToggle();
                        }
                    } else {
                        stylesheet1_obj.editToggle();
                    }
                }
                ev.preventDefault();

            }
            return;
        }

        if (keyWasPressed("ExtendTimerToDefault", ev)) {
            // extend current timer to default time
            extendDefaultToCurrentTimer();
            return;
        }

        if (keyWasPressed("ToggleCustomMessage", ev)) {


            html.classList.add("edit_custom_message");
            html.classList.remove("show_custom_message");
            custom_message.innerText = "custom message";
            custom_message.contentEditable = true;
            custom_message.focus();
            ev.preventDefault();

            return;
        }

        if (keyWasPressed("OpenRemoteWindow", ev)) {

            ev.preventDefault();
            openTimerWindow(tabCount > 1);

            return;

        }


        if (keyWasPressed("ToggleAudio", ev)) {

            if (audioTrig) {

                if (shifting) {
                    //shift-a = stop monitoring audio and hide meter
                    audioTrig.stop();
                    writeNumber("audioThreshold", audioTrig.getThreshold());    
                    audioTrig=null;
                    return;
                }

                if (controlling) {
                       // ctrl-a = show meter wait for trigger
                       audioTrig.show();
                       audioTrig.reset();
                } else {
                    // a = toggle display of audio meter
                    audioTrig.toggle();
                }

            } else {
                if (shifting) {
                    // shift-a = stop monitoring audio and hide meter
                    // already stopped,and object does not exist

                    return;
                }
                let doReset = controlling;
            
                getAudioInput(

                    function (deviceId) {

                        if(audioTrig) {
                            audioTrig.stop();
                            audioTrig=null;
                            setTimeout(startAudio,500,deviceId,doReset);
                        } else {
                            startAudio(deviceId,doReset);
                        }

                    
                    }

                );


                


            }
        }

        if (keyWasPressed("Devices",ev)) {
            localStorage.removeItem("audioInput");  
            getAudioInput(

                function (deviceId) {

                    if(audioTrig) {
                        audioTrig.stop();
                        audioTrig=null;
                        setTimeout(startAudio,500,deviceId);
                    } else {
                        startAudio(deviceId);
                    }

                    
                }

            );

        }
    }

    function startAudio(deviceId,doReset){
        audioTrig = audioTriggers(deviceId);
        audioTrig.setThreshold(readNumber("audioThreshold"),audioTrig.getThreshold());
        audioTrig.show(); 
        if (doReset) {
            audioTrig.reset();
        }

    }

}
function saveEditedTime() {
    if (!((enterTimeText === "") || (enterTimeText === ""))) {
        defaultDuration = ((Number(enterHoursText) * 3600) + (Number(enterTimeText) * 60)) * 1000;

        if (Date.now() - startedAt < 0) {
            // if editing a future start time
            thisDuration = defaultDuration;
        }
        enterTimeText = "";
        enterHoursText = "";

        dispNextMins.textContent = secToStr(defaultDuration / 1000);
        clearHtmlClass("editing");
        writeNumber("defaultDuration", defaultDuration);
    }
}

function onDocKeyUp(ev) {
    switch (ev.key) {
        case "Shift":
            shifting = false;
            clearHtmlClass("shifting");
            break;
        case "Control":
            controlling = false;
            clearHtmlClass("controlling");
            break;
    }
}


function bumpStart(factor) {
    startedAt += factor;
    startedDisp.textContent = new Date(startedAt).toLocaleTimeString();
    writeNumber("startedAt", startedAt);
}

function bumpEnd(seekEndDelta, endDelta) {
    seekEndsAt += seekEndDelta;
    endsAt += endDelta;

    thisDuration = seekEndsAt - startedAt;

    endsDisp.textContent = new Date(seekEndsAt).toLocaleTimeString();
    writeNumber("seekEndsAt", seekEndsAt);
}


function setBarPct(pct) {
    progress.style.width = pct + '%';
    localStorage.setItem("barpct", pct.toString());
}

function setBar(elapsed, total) {
    let pct = Math.floor((elapsed / total) * 100);
    setBarPct(pct);
}


function readNumber(nm, def) {
    let str = localStorage.getItem(nm);
    return str ? Number(str) : def;
}

function writeNumber(nm, val) {
    if (val === undefined) {
        localStorage.removeItem(nm);
    } else {
        localStorage.setItem(nm, val.toString());
    }
}

function secToStr(sec) {
    let prefix = sec < 0 ? "-" : "";
    if (sec < 0) {
        sec = 0 - sec;
    }
    let min = Math.trunc(sec / 60) % 60;
    let hr = Math.trunc(sec / 3600);
    let sx = Math.trunc(sec % 60);


    let sx_ = (sx < 10 ? "0" : "") + sx.toString();
    if (hr < 1) {
        let min_ = min.toString();
        return prefix + min_ + ":" + sx_;
    }
    let min_ = (min < 10 ? "0" : "") + min.toString();
    let hr_ = hr.toString();
    return prefix + hr_ + ":" + min_ + ":" + sx_;
}

function timeNowStr() {
    let when = new Date();
    return when.toLocaleTimeString();
}

function setRemainClass(cls) {
    if (!remainDisp.classList.contains(cls)) remainDisp.classList.add(cls);
}

function clearRemainClass(cls) {
    if (remainDisp.classList.contains(cls)) remainDisp.classList.remove(cls);
}

function toggleRemainClass(cls) {
    remainDisp.classList.toggle(cls);
}

function setHtmlClass(cls) {
    if (!html.classList.contains(cls)) html.classList.add(cls);
}

function clearHtmlClass(cls) {
    if (html.classList.contains(cls)) html.classList.remove(cls);
}

function onTimerWinUnload() {
    timerWin = undefined;
}

function onControlUnload() {
    if (timerWin) {
        timerWin.close();
        timerWin = undefined;
    }
}

function is_nwjs() {
    try {
        return (typeof require('nw.gui') !== "undefined");
    } catch (e) {
        return false;
    }
}

function audioTriggers(deviceId) {

    // Initialize variables
    let activeStream = null;
    let audioContext = new AudioContext();
    let analyserNode = audioContext.createAnalyser();
    analyserNode.fftSize = 2048;
    const bufferLength = analyserNode.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    let threshold = 0.5;

    let callbackTriggered=true;

    // Create canvas element
    const canvas = document.getElementById('audio-canvas');
    const canvasCtx = canvas.getContext('2d');
    canvas.width  = 10;//canvas.offsetWidth;
    canvas.height = 100;//canvas.offsetHeight;

    // Create mouse event listener to set threshold
    canvas.addEventListener('mousedown', function (e) {
        const rect = canvas.getBoundingClientRect();
        const mouseY = e.clientY - rect.top;
        threshold = 1 - mouseY / canvas.height;
    });

    // Create reset method to restart monitoring
    function resetAudioTrigger() {
        callbackTriggered=false;
    }


    // Connect analyser node to audio source and update visualization


        navigator.mediaDevices.getUserMedia( 
            deviceId ? {  audio:{deviceId: deviceId} } :  { audio: true }
        ).then(function (stream) {
            const source = audioContext.createMediaStreamSource(stream);
            activeStream = stream;
            source.connect(analyserNode);
            updateVisualization();
        })
        .catch(function (err) {
            console.error('Error accessing microphone: ', err);
        });

    // Function to update the visualization
    function updateVisualization() {
        if (!!activeStream) {
            requestAnimationFrame(updateVisualization);
            analyserNode.getByteFrequencyData(dataArray);
            canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
            const average = dataArray.reduce((acc, val) => acc + val) / bufferLength;
            const normalizedAverage = average / 255;
            canvasCtx.fillStyle = 'white'
            const y = canvas.height - (normalizedAverage * canvas.height);
            canvasCtx.fillRect(0, y, canvas.width, canvas.height);

            // Draw threshold line
            canvasCtx.beginPath();
            canvasCtx.lineWidth = 2;
            canvasCtx.moveTo(0, canvas.height - (threshold * canvas.height));
            canvasCtx.lineTo(canvas.width, canvas.height - (threshold * canvas.height));
            canvasCtx.strokeStyle =  'yellow';
            canvasCtx.stroke();

            if (normalizedAverage >= threshold && !callbackTriggered) {
                callbackTriggered = true;
                const audioTriggerEvent = new Event('audio-trigger');
                document.dispatchEvent(audioTriggerEvent);
            }
        }
    }


    function toggle() {
        html.classList.toggle("audio");
    }

    function show() {
        html.classList.add("audio");
    }

    function hide() {
        html.classList.remove("audio");

    }

    function stop () {
        if (activeStream && analyserNode) {
            analyserNode.disconnect(activeStream);
            if (activeStream.getTracks) {
                activeStream.getTracks().forEach(function(track) {
                    track.stop();
                });
            }
            activeStream=null;
            analyserNode=null;
            audioContext=null;
        }
        html.classList.remove("audio");

    }

    return {
        reset: resetAudioTrigger,
        toggle: toggle,
        show: show,
        hide: hide,
        stop:stop,
        setThreshold: function (val) {
            threshold = val;
        },
        getThreshold: function () {
            return threshold;
        }

    };


}