/* global define */
define(function(require, exports, module) {
    plugin.provides = ["webserver"];
    return plugin;

    function plugin(options, imports, register) {
        var api = require("/zed/app/js/webserver.chrome.js")();
        register(null, {
            webserver: api
        });
    }
});
