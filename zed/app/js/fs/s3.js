/*global define, $ */
define(function(require, exports, module) {
    plugin.consumes = ["history", "local_store"];
    plugin.provides = ["fs"];
    return plugin;

    function plugin(options, imports, register) {
        var tokenStore = imports.local_store;
        var history = imports.history;
        var mimeTypes    = require("/zed/app/js/lib/mime_types");
        var pathUtil     = require("/zed/app/js/lib/path.js");
        var AWS          = require("/zed/app/js/lib/aws-sdk.min.js");
        var poll_watcher = require("/zed/app/js/fs/poll_watcher.js");
        var fsUtil       = require("/zed/app/js/fs/util.js");
        
        var bucket = options.bucket;

        var s3;

        Promise.all([tokenStore.get("awsAccessKey"), tokenStore.get("awsSecretKey")]).then(function(keys) {
            if (!keys[0] || !keys[1]) {
                console.error("Tokens not set: awsAccessKey and awsSecretKey");
                return register(new Error("Tokens not set"));
            }

            AWS.config.update({
                accessKeyId: keys[0],
                secretAccessKey: keys[1]
            });

            s3 = new AWS.S3();

            register(null, {
                fs: api
            });
        });

        var api = {
            listFiles: function() {
                return new Promise(function(resolve, reject) {
                    s3.listObjects({
                        Bucket: bucket
                    }, function(err, result) {
                        if (err) {
                            return reject(err);
                        }
                        var filenames = [];
                        result.Contents.forEach(function(file) {
                            filenames.push("/" + file.Key);
                        });
                        resolve(filenames);
                    });
                });
            },
            readFile: function(path) {
                return new Promise(function(resolve, reject) {
                    s3.getObject({
                        Bucket: bucket,
                        Key: path.substring(1)
                    }, function(err, data) {
                        if (err) {
                            return reject(err.statusCode);
                        }
                        watcher.setCacheTag(path, data.ETag);
                        resolve(fsUtil.uint8ArrayToBinaryString(data.Body));
                    });
                });
            },
            writeFile: function(path, content, binary) {
                return new Promise(function(resolve, reject) {
                    var body;
                    var ext = pathUtil.ext(path);
                    var contentType = mimeTypes[ext] || "application/octet-stream";
                    if (binary) {
                        body = fsUtil.binaryStringAsUint8Array(content);
                    } else {
                        body = content;
                    }
                    s3.putObject({
                        Bucket: bucket,
                        ContentType: contentType,
                        Key: path.substring(1),
                        Body: body
                    }, function(err, result) {
                        if (err) {
                            return reject(err);
                        }
                        watcher.setCacheTag(path, result.ETag);
                        resolve();
                    });
                });
            },
            deleteFile: function(path) {
                return new Promise(function(resolve, reject) {
                    s3.deleteObject({
                        Bucket: bucket,
                        Key: path.substring(1)
                    }, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            resolve();
                        }
                    });
                });
            },
            watchFile: function(path, callback) {
                watcher.watchFile(path, callback);
            },
            unwatchFile: function(path, callback) {
                watcher.unwatchFile(path, callback);
            },
            getCacheTag: function(path) {
                return new Promise(function(resolve, reject) {
                    s3.headObject({
                        Bucket: bucket,
                        Key: path.substring(1)
                    }, function(err, result) {
                        if (err) {
                            return reject(err.statusCode);
                        }
                        resolve(result.ETag);
                    });
                });
            },
            getCapabilities: function() {
                return {};
            }
        };

        var watcher = poll_watcher(api, 5000);
        history.pushProject("S3 [" + bucket + "]", "s3:" + bucket);
    }
});
