/* global define*/
define(function(require, exports, module) {
    plugin.consumes = ["command"];
    plugin.provides = ["configfs"];
    return plugin;

    function plugin(options, imports, register) {
        var api = require("/zed/app/js/configfs.chrome.js")(imports.command);
        register(null, {
            configfs: api
        });
    }
});
