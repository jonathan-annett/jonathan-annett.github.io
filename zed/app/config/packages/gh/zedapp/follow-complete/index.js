/* global _*/
"use strict";
var db = require("zed/db");

var ID_REGEX = /[A-Za-z0-9_\$]/;
var HIGH_NUMBER = 1000000;

module.exports = function(info) {
    var path = info.path;
    var text = info.inputs.text;
    var modeName = info.inputs.modeName;
    if(!info.inputs.mode) {
        return;
    }
    var separators = info.inputs.mode.completionTriggers;

    if(!separators) {
        return;
    }

    var i = 0;

    var results = {};
    var total = 0;

    console.log("Indexing", path);

    try {
        index();
    } catch (e) {
        console.error("Error", e.message);
    }

    var items = _.map(results, function(count, key) {
        var parts = key.split("~");
        return {
            id: path + "~" + key,
            path: path,
            count: count,
            rank: HIGH_NUMBER - count, // used for sorting in index
            prev: parts[1],
            follow: parts[2],
            sep: parts[0],
            mode: modeName
        };
    });

    return db.query("follow", [">=", path, "<=", path + "~~"]).then(function(existingObjs) {
        // First remove old entries
        return db.deleteMany("follow", _.pluck(existingObjs, "id"));
    }).then(function() {
        // Then save new ones
        // console.log("Indexed", items);
        return db.putMany("follow", items);
    }).
    catch (function(err) {
        console.error("Error saving", err);
    });

    function index() {
        var prevIdn = '';
        while (i < text.length) {
            var ch = text[i];
            var sep = findSep();
            if (ID_REGEX.exec(ch)) {
                prevIdn += ch;
            } else if (sep && prevIdn) {
                var followIdn = findForwardIdn();
                if (followIdn) {
                    var id = sep + "~" + prevIdn + "~" + followIdn;
                    if (!results[id]) {
                        results[id] = 0;
                    }
                    results[id]++;
                    total++;
                    prevIdn = followIdn;
                    i--;
                }
            } else if (ch === '(') {
                // recurse
                i++;
                index();
            } else if (ch === ')') {
                // pop from the stack
                prevIdn = '';
                return;
            } else {
                prevIdn = '';
            }
            i++;
        }
    }

    function findSep() {
        for(var j = 0; j < separators.length; j++) {
            var sep = separators[j];
            var match = true;
            for_label: for(var k = 0; k < sep.length; k++) {
                if(sep[k] !== text[i + k]) {
                    match = false;
                    break for_label;
                }
            }
            if(match) {
                i += sep.length;
                return sep;
            }
        }
        return false;
    }
    function findForwardIdn() {
        var idn = '';
        while (i < text.length) {
            var ch = text[i];
            if (ID_REGEX.exec(ch)) {
                idn += ch;
            } else if (ch === "(") {
                idn += "()";
                return idn;
            } else {
                return idn;
            }
            i++;
        }
    }

};
