/*global _ $ ace */

window.boot_zed=function (){
require.config({
    baseUrl: "js",
    paths: {
        "text":   "/zed/app/dep/text",
        "json5":  "/zed/app/dep/json5",
        // "zedb":   "/zed/app/dep/zedb",
        "async":  "/zed/app/config/api/zed/lib/async",
        "events": "/zed/app/js/lib/emitter"
    },
});

/* global ace, $, _ */
require([
    "/zed/app/dep/architect.js", 
    "/zed/app/js/lib/options.js",
    "/zed/app/js/fs_picker.js", 
    "text!/zed/app/manual/intro.md"
    ], function(
        architect, 
        options, 
        fsPicker, 
        introText) {
    "use strict";

    var baseModules = [
        "/zed/app/js/eventbus.js",
        "/zed/app/js/ui.js",
        "/zed/app/js/command.js",
        "/zed/app/js/editor.js",
        "/zed/app/js/title_bar.js",
        "/zed/app/js/symbol.js",
        "/zed/app/js/config.js",
        "/zed/app/js/goto.js",
        "/zed/app/js/tree.js",
        "/zed/app/js/state.js",
        "/zed/app/js/project.js",
        "/zed/app/js/keys.js",
        "/zed/app/js/complete.js",
        "/zed/app/js/session_manager.js",
        "/zed/app/js/modes.js",
        "/zed/app/js/split.js",
        "/zed/app/js/file.js",
        "/zed/app/js/preview.js",
        "/zed/app/js/dnd.js",
        "/zed/app/js/handlers.js",
        "/zed/app/js/action.js",
        "/zed/app/js/theme.js",
        "/zed/app/js/log.js",
        "/zed/app/js/window_commands.js",
        "/zed/app/js/analytics.js",
        "/zed/app/js/menu.js",
        "/zed/app/js/db.js",
        "/zed/app/js/webservers.js",
        "/zed/app/js/version_control.js",
        "/zed/app/js/sandboxes.js",
        "/zed/app/js/open_ui.js",
        "/zed/app/js/background.js",
        "/zed/app/js/history.js",
        "/zed/app/js/local_store.js",
        "/zed/app/js/sandbox.js",
        "/zed/app/js/webserver.js",
        "/zed/app/js/window.js",
        "/zed/app/js/windows.js",
        "/zed/app/js/analytics_tracker.js",
        "/zed/app/js/configfs.js"];

    if (options.get("url")) {
        openUrl(options.get("url"));
    } else {
        projectPicker();
    }

    function projectPicker() {
        var modules = baseModules.slice();
        modules.push("/zed/app/js/fs/empty.js");
        return boot(modules, false).then(function(app) {
            app.getService("open_ui").boot();
        });
    }

    window.projectPicker = projectPicker;

    function openUrl(url) {
        fsPicker(url).then(function(fsConfig) {
            var modules = baseModules.slice();
            modules.push(fsConfig);
            return boot(modules, true);
        }).
        catch (function(err) {
            console.log("Error", err);
            var modules = baseModules.slice();
            modules.push("/zed/app/js/fs/empty.js");
            boot(modules, false).then(function(zed) {
                // Remove this project from history
                zed.getService("history").removeProject(url);
                zed.getService("ui").prompt({
                    message: "Project not longer accessible by Zed. Will now return to project picker."
                }).then(projectPicker);
            });
        });
    }


    function boot(modules, bootEditor) {
        $("div").remove();
        $("span").remove();
        $("webview").remove();
        $("body").append("<img src='/zed/app/Icon.png' id='wait-logo'>");
        return new Promise(function(resolve, reject) {
            architect.resolveConfig(modules, function(err, config) {
                if (err) {
                    console.error("Architect resolve error", err);
                    return reject(err);
                }
                console.log("Architect resolved");
                try {
                    var app = architect.createApp(config, function(err, app) {
                        if (err) {
                            window.err = err;
                            console.error("Architect createApp error", err, err.stack);
                            return reject(err);
                        }
                        $("#wait-logo").remove();
                        try {
                            window.zed = app;

                            // Run hook on each service (if exposed)
                            _.each(app.services, function(service) {
                                if (service.hook) {
                                    service.hook();
                                }
                            });
                            // Run init on each service (if exposed)
                            _.each(app.services, function(service) {
                                if (service.init) {
                                    service.init();
                                }
                            });

                            if (bootEditor) {
                                app.getService("analytics_tracker").trackEvent("Editor", "FsTypeOpened", options.get("url").split(":")[0]);

                                setupBuiltinDoc("zed::start", introText);
                                setupBuiltinDoc("zed::log", "Zed Log\n===========\n");

                            } else {
                                app.getService("eventbus").on("urlchanged", function() {
                                    openUrl(options.get("url"));
                                });
                            }

                            console.log("App started");
                            resolve(app);
                        } catch (e) {
                            console.error("Error booting", e);
                            reject(e);
                        }

                        function setupBuiltinDoc(path, text) {
                            var session_manager = app.getService("session_manager");
                            var editor = app.getService("editor");
                            var eventbus = app.getService("eventbus");

                            var session = editor.createSession(path, text);
                            session.readOnly = true;

                            eventbus.on("modesloaded", function modesLoaded(modes) {
                                if (modes.get("markdown")) {
                                    modes.setSessionMode(session, "markdown");
                                    eventbus.removeListener("modesloaded", modesLoaded);
                                }
                            });

                            session_manager.specialDocs[path] = session;
                        }
                    });

                    app.on("service", function(name) {
                        console.log("Loaded " + name);
                    });
                    app.on("error", function(err) {
                        console.error("Error", err);
                    });

                    window.zed_app = app;
                } catch (err) {
                    console.error("Exception while creating architect app", err);
                    reject(err);
                }
            });
        });
    }
});


};