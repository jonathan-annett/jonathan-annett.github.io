/*global chrome, define*/
define(function(require, exports, module) {
    return function(eventbus, background) {
        var win = chrome.app.window.current();

        var userAgent = require("ace/lib/useragent");
        var opts      = require("/zed/app/js/lib/options.js");

        eventbus.declare("windowclose");

        var closeHandler = null;

        background.registerWindow(opts.get("title"), opts.get("url"), win);

        var api = {
            close: function(force) {
                if (force || !closeHandler) {
                    win.close();
                } else {
                    eventbus.emit("windowclose");
                    closeHandler();
                }
            },
            setCloseHandler: function(handler) {
                closeHandler = handler;
            },
            useNativeFrame: function() {
                return userAgent.isLinux;
                // return false;
            },
            fullScreen: function() {
                if (win.isFullscreen()) {
                    win.restore();
                } else {
                    win.fullscreen();
                }
            },
            maximize: function() {
                if (win.isMaximized()) {
                    win.restore();
                } else {
                    win.maximize();
                }
            },
            minimize: function() {
                win.minimize();
            },
            getBounds: function() {
                var bounds = win.getBounds();
                return {
                    width: bounds.width,
                    height: bounds.height,
                    top: bounds.top,
                    left: bounds.left,
                    isMaximized: win.isMaximized()
                };
            },
            setBounds: function(bounds) {
                if (bounds.isMaximized) {
                    win.maximize();
                } else {
                    if (bounds.width < 200 || bounds.height < 200) {
                        // Bounds messed up, let's just ignore and use defaults
                        return;
                    }
                    delete bounds.isMaximized;
                    win.setBounds(bounds);
                }
            },
            addResizeListener: function(listener) {
                win.onBoundsChanged.addListener(listener);
            },
            focus: function() {
                chrome.app.window.current().focus();
            }
        };

        return api;
    };
});
