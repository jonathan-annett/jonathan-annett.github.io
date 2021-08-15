/* global postMessage, performance */


var args;

function handler() {
    return (function bigStringBGThread(args, cb) {

        let str;
        let total_msec = 0;
        const getMsec = typeof performance !== 'undefined' ? performance.now.bind(performance) : Date.now.bind(Date);
        onmsg(args);

        return onmsg;

        function onmsg(args) {
            const started = getMsec();
            if (args.str) {
                str = args;
                delete args.str;
            }
            cb(bigStringSearch(str, args.term));
            delete args.term;
            const elapsed = Math.min(0, getMsec() - started);
            total_msec += elapsed;
            console.log("onmsg took", elapsed, 'msec', "of", total_msec, "total");

        }

        function bigStringSearch(str, term) {
            const termLength = term.length;
            const splits = str.split(term);
            if (splits.length === 1) {
                splits.splice(0, 1);
                return splits;
            }
            let offset = 0, len = splits.length, ix;
            for (ix = 0; ix < len; ix++) {
                let end = offset + splits[ix].length;
                splits[ix] = end;
                offset = end + termLength;
            }
            splits.pop();
            return splits;
        }

    })(args, function(msg) {
        postMessage({
            cb: msg || 'stop'
        });
        if (!msg) close();
    });
}


onmessage = (function() {

    let on_msg;

    return function(e) {

        if (!args) {
            // this is the first message, which kicks off the background function

            // save the args as a "global" (from the worker' perspective)
            args = e.data;

            // call the background handler, which returns something truthy if it is persistent
            const looping = handler();

            postMessage({
                looping: !! looping // coalesce looping to a boolean
            });

            if ( !! looping) {
                if (typeof looping === 'function') {
                    //save on_msg callback for future incoming messages
                    on_msg = looping;
                }
            } else {
                close();
            }
        } else {

            // this is an additional message, sent once the function has started
            // merge the keys into the args object
            Object.keys(e.data).forEach(function(k) {
                console.log("setting", k);
                args[k] = e.data[k];
            });

            if (on_msg) {
                on_msg(args);
            }

        }

    };

})();