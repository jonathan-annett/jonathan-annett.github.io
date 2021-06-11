/*global define, _, nodeRequire */
define(function(require, exports, module) {
    plugin.consumes = [];
    plugin.provides = ["local_store"];
    return plugin;

    function plugin(options, imports, register) {
        var api = require("/zed/app/js/local_store.chrome.js")();
        register(null, {
            local_store: api
        });
    }
});
