/* global define */
define(function(require, exports, module) {
    plugin.provides = ["background"];
    return plugin;

    function plugin(opts, imports, register) {
        var bgProm = require("/zed/app/js/background.chrome.js")();
        bgProm.then(function(bg) {
            register(null, {
                background: bg
            });
        });
    }
});
