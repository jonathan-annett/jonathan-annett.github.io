/*global define, _, chrome */
define(function(require, exports, module) {
    var architect = require("/zed/app/dep/architect.js");
    plugin.provides = ["fs"];
    return plugin;

    function plugin(options, imports, register) {
        var watchSelf = options.watchSelf;

        chrome.storage.local.get("configDir", function(results) {
            if (results.configDir) {
                console.log("Using local configuration dir");
                staticFs().then(function(configStatic) {
                    chrome.fileSystem.restoreEntry(results.configDir, function(dir) {
                        if (!dir) {
                            console.error("Could not open configuration dir, please reset it. Falling back to syncFS.");
                            return syncConfig();
                        }
                        getFs({
                            packagePath: "/zed/app/js/fs/local.js",
                            dir: dir,
                            id: results.configDir,
                            dontRegister: true
                        }).then(function(configLocal) {
                            getFs({
                                packagePath: "/zed/app/js/fs/union.js",
                                fileSystems: [configLocal, configStatic],
                                watchSelf: watchSelf
                            }).then(function(fs) {
                                register(null, {
                                    fs: fs
                                });
                            });
                        });
                    });
                });
            } else {
                syncConfig();
            }
        });

        function staticFs() {
            return getFs({
                packagePath: "/zed/app/js/fs/static.js",
                url: "config",
                readOnlyFn: function(path) {
                    return path !== "/.zedstate" && path !== "/user.json" && path !== "/user.css";
                }
            });
        }

        function syncConfig() {
            var configStatic;
            staticFs().then(function(configStatic_) {
                configStatic = configStatic_;
                return getFs({
                    packagePath: "/zed/app/js/fs/sync.js",
                    namespace: "config"
                });
            }).then(function(configSync) {
                return getFs({
                    packagePath: "/zed/app/js/fs/union.js",
                    fileSystems: [configSync, configStatic],
                    watchSelf: watchSelf
                });
            }).then(function(fs) {
                register(null, {
                    fs: fs
                });
            }, function(err) {
                register(err);
            });
        }
    }

    // Creates local architect application with just the file system module
    function getFs(config) {
        return new Promise(function(resolve, reject) {
            architect.resolveConfig([config, "./history"], function(err, config) {
                if (err) {
                    return reject(err);
                }
                architect.createApp(config, function(err, app) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(app.getService("fs"));
                });
            });
        });
    }
});
