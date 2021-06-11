/*global define, chrome, zed  */
define(function(require, exports, module) {
    var options = require("/zed/app/js/lib/options.js");
    return function(url) {
        var parts;
        
        // TODO: Generalize this
        if (url.indexOf("config:") === 0) {
            return Promise.resolve("/zed/app/js/fs/config.chrome.fs");
        } else if (url.indexOf("manual:") === 0) {
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/static.js",
                url: "manual",
                readOnlyFn: function() {
                    return true;
                }
            });
        } else if (url.indexOf("syncfs:") === 0) {
            // Deprecated
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/sync.js",
                namespace: "notes"
            });
        } else if (url.indexOf("dropbox:") === 0) {
            var path = url.substring("dropbox:".length);
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/dropbox.js",
                rootPath: path
            });
        } else if (url.indexOf("local:") === 0) {
            var id = url.substring("local:".length);
            // We're opening a specific previously opened directory here
            return new Promise(function(resolve, reject) {
                if (id) {
                    chrome.fileSystem.restoreEntry(id, function(dir) {
                        if(!dir) {
                            return reject(new Error("Not accessible"));
                        }
                        resolve({
                            packagePath: "/zed/app/js/fs/local.js",
                            dir: dir,
                            id: id
                        });
                    });
                } else {
                    // Show pick directory
                    chrome.fileSystem.chooseEntry({
                        type: "openDirectory"
                    }, function(dir) {
                        if (!dir) {
                            return chrome.app.window.current().close();
                        }
                        var id = chrome.fileSystem.retainEntry(dir);
                        var title = dir.fullPath.slice(1);
                        options.set("title", title);
                        options.set("url", "local:" + id);
                        resolve({
                            packagePath: "/zed/app/js/fs/local.js",
                            dir: dir,
                            id: id
                        });
                        setTimeout(function() {
                            console.log("Now setting open Projects");
                            var openProjects = zed.getService("windows").openProjects;
                            delete openProjects["local:"];
                            openProjects["local:" + id] = chrome.app.window.current();
                        }, 2000);
                    });
                }
            });
        } else if (url === "local_files:") {
            return new Promise(function(resolve, reject) {
                // Show pick directory
                chrome.fileSystem.chooseEntry({
                    type: "openWritableFile",
                    acceptsMultiple: true
                }, function(fileEntries) {
                    if(!fileEntries) {
                        return chrome.app.window.current().close();
                    }

                    if(fileEntries.length === 1) {
                        options.set("title", fileEntries[0].name);
                    } else {
                        options.set("title", "Zed");
                    }
                    options.set("url", "local_files:");
                    resolve({
                        packagePath: "/zed/app/js/fs/local_files.js",
                        entries: fileEntries
                    });
                });
            });
        } else if(url.indexOf("textarea:") === 0) {
            var text = url.substring("textarea:".length);
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/textarea.js",
                text: text,
                id: options.get("id")
            });
        } else if(url.indexOf("gh:") === 0) {
            var repoBranch = url.substring("gh:".length);
            parts = repoBranch.split(":");
            var repo = parts[0];
            var branch = parts[1] || "master";
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/github.js",
                repo: repo,
                branch: branch
            });
        } else if(url.indexOf("s3:") === 0) {
            var bucket = url.substring("s3:".length);
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/s3.js",
                bucket: bucket
            });
        } else {
            parts = url.split('?');
            var webfsParts = parts[1] ? parts[1].split("&") : [];
            var webfsOpts = {};

            webfsParts.forEach(function(part) {
                var spl = part.split('=');
                webfsOpts[spl[0]] = decodeURIComponent(spl[1]);
            });
            return Promise.resolve({
                packagePath: "/zed/app/js/fs/web.js",
                fullUrl: url,
                url: parts[0],
                user: webfsOpts.user,
                pass: webfsOpts.pass,
                keep: webfsOpts.keep
            });
        }
    };
});
