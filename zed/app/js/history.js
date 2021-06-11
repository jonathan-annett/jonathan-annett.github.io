/* global define */
define(function(require, exports, module) {
    plugin.provides = ["history"];
    return plugin;

    function plugin(options, imports, register) {
        var api = require("/zed/app/js/history.chrome.js")();
        register(null, {
            history: api
        });
    }
});
