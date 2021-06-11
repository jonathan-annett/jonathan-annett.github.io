/* global define */
define(function(require, exports, module) {
    "use strict";

    var oop = require("ace/lib/oop");
    var TextMode = require("ace/mode/text").Mode;
    var CommitHighlightRules = require("/zed/app/js/mode/commit_highlight_rules.js").CommitHighlightRules;

    var Mode = function() {
        this.HighlightRules = CommitHighlightRules;
    };
    oop.inherits(Mode, TextMode);

    (function() {
        this.type = "text";

        this.getNextLineIndent = function(state, line) {
            return this.$getIndent(line);
        };
        this.$id = "mode/commit";
    }).call(Mode.prototype);

    exports.Mode = Mode;
});
