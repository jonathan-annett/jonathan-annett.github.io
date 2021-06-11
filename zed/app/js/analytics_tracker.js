/* global define */
define(function(require, exports, module) {
    plugin.consumes = ["config"];
    plugin.provides = ["analytics_tracker"];
    return plugin;

    function plugin(options, imports, register) {
        var apiProm = require("/zed/app/js/analytics_tracker.chrome.js")(imports.config);
        apiProm.then(function(api) {
            register(null, {
                analytics_tracker: api
            });
        });
    }
});
