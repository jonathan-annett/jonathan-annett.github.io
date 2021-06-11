/* global define */
define(function(require, exports, module) {
    plugin.provides = ["windows"];
    return plugin;

    function plugin(options, imports, register) {
        var apiProm = require("/zed/app/js/windows.chrome.js")();
        apiProm.then(function(api) {
            register(null, {
                windows: api
            });
        });
    }
});
