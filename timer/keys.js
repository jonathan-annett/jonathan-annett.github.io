var keycodes = {
    "Space": " ",
    "Enter": "Enter",
    "Backspace": "Backspace",
    "1": "1",
    "2": "2",
    "3": "3",
    "4": "4",
    "5": "5",
    "6": "6",
    "7": "7",
    "8": "8",
    "9": "9",
    "0": "0",
    
    "Period": ".",
    "Colon" : ":",
    "Pause" : '"',

    "UndoPause" : "'",

    "ArrowDown" : "ArrowDown",
    "ArrowUp" : "ArrowUp",
    "ArrowLeft" : "ArrowLeft",
    "ArrowRight" : "ArrowRight",

    "q" : "q",
    "Q" : "Q",
    
    "b"  :"b",
    "B"  :"B",
    
    "f"  : "f",
    "F"  : "F",

    "m" : "m",
    "M" : "M",

    "t" : "t",
    "T" : "T",

    "p":"p",
    "P":"P",

    "s":"s",
    "S":"S",

    "x":"x",
    "X":"X",

    "c" : "c",
    "C" : "C",

    "r" : "r",
    "R" : "R",


};

var keyNames = {
    "Toggle Fullscreen Mode" : ["f","F"],
    "Toggle Progress Bar Display" : ["b","B"],
    "Toggle Standard Messages" : ["m","M"],
    "Pause/resume the countdown" : ["Pause"],
    "Undo pause (removes any added time)" : ["UndoPause"],
    "Toggle current time display" : ["t","T"],
    "Toggle presenter screen mode" : ["p","P"],
    "Single screen mode" : ["s","S"],
    "Restart timer": ["Space"],
    "Extend timer to default": ["x","X"],
    "Toggle/edit custom message": ["c","C"],
    "Confirm entered duration": ["Enter"],
    "Delete last entered character": ["Backspace"],
    "Open remote window": ["r","R"]
};


function keyNamesHtml (){
    return '<table>'+Object.keys(keyNames).sort().map(function(keyName){
        return "<tr><td>"+keyName+"</td><td>"+keyNames[keyName][0]+"</td></tr>";
    }).join("\n")+"</table>";
}

