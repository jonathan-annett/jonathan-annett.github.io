"use strict";
var db = require("zed/db");

var ID_REGEX = /[A-Za-z0-9_\$]/;
var HIGH_NUMBER = 1000000;

module.exports = function(info) {
    var i = info.inputs.cursorIndex - 1;
    var text = info.inputs.text;
    var modeName = info.inputs.modeName;
    if(!info.inputs.mode) {
        return;
    }
    var separators = info.inputs.mode.completionTriggers;

    if(!separators) {
        return [];
    }

    var prefix = "";
    var prev;
    var sep = findSep();
    if (!sep) {
        prefix = getBackIdentifier();
    }
    sep = findSep();
    if (sep) {
        i -= sep.length;
        prev = getBackIdentifier();
        if (prev) {
            return db.queryIndex("follow", "pred_idn", [">=", [modeName, sep, prev, 0, prefix], "<=", [modeName, sep, prev, HIGH_NUMBER, prefix + "~"], {
                limit: 200
            }]).then(function(candidates) {
                var totalScores = {};
                candidates.forEach(function(candidate) {
                    if (!totalScores[candidate.follow]) {
                        totalScores[candidate.follow] = 0;
                    }
                    totalScores[candidate.follow] += candidate.count;
                });
                var results = Object.keys(totalScores).map(function(follow) {
                    var score = totalScores[follow];
                    if (follow.indexOf("(") !== -1) {
                        return {
                            name: follow,
                            value: follow,
                            snippet: follow.replace(/\$/g, "\\$").replace(")", "${1})"),
                            icon: "function",
                            score: 100 + score,
                            meta: "follow"
                        };
                    } else {
                        return {
                            name: follow,
                            value: follow,
                            icon: "property",
                            score: 100 + score,
                            meta: "follow"
                        };
                    }
                });
                return results;
            });
        }
    } else {
        return [];
    }

    function getBackIdentifier() {
        var characters = [];
        while (i >= 0) {
            var ch = text[i];
            if (ID_REGEX.exec(ch)) {
                characters.push(ch);
                i--;
            } else if (ch === ")") {
                characters.push(")", "(");
                handleBrace();
            } else {
                return characters.reverse().join('');
            }
        }
        return characters.reverse().join('');
    }

    function findSep() {
        for(var j = 0; j < separators.length; j++) {
            var sep = separators[j];
            var match = true;
            for_label: for(var k = sep.length-1; k >= 0; k--) {
                if(sep[k] !== text[i - ((sep.length - 1) - k)]) {
                    match = false;
                    break for_label;
                }
            }
            if(match) {
                return sep;
            }
        }
        return false;
    }

    function handleBrace() {
        i--;
        while (i > 0) {
            if (text[i] === "(") {
                i--;
                return;
            } else if (text[i] === ")") {
                handleBrace();
            }
            i--;
        }
    }
};
