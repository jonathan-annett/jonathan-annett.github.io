/* global define */
define(function(require, exports, module) {
    plugin.consumes = ["eventbus", "background", "command"];
    plugin.provides = ["window"];
    return plugin;

    function plugin(options, imports, register) {
        var api = require("/zed/app/js/window.chrome.js")(imports.eventbus, imports.background);
        register(null, {
            window: api
        });
    }
});
