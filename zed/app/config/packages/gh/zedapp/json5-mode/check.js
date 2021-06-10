/**
 * Required inputs: text
 */
module.exports = function(info) {
    var text = info.inputs.text;
    try {
        JSON5.parse(text);
    } catch (e) {
        var lines = text.substring(0, e.at).split("\n");
        return [{
            row: lines.length - 1,
            text: e.message,
            type: "error"
        }];
    }
    return [];
};
