/* global define*/
define(function(require, exports, module) {
    plugin.provides = ["sandbox"];
    return plugin;

    function plugin(options, imports, register) {
        var api = require("/zed/app/js/sandbox.chrome.js")();
        register(null, {
            sandbox: api
        });
    }
});
