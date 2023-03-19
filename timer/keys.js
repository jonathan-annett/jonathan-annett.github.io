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

var keynamesDefault = Object.assign({}, keyNames);


function keyNamesHtml (){
    return '<table>'+Object.keys(keyNames).sort().map(function(keyName){
        return "<tr><td>"+keyName+"</td><td>"+keyNames[keyName][0]+"</td></tr>";
    }).join("\n")+"</table>";
}

function keyIsUsed (k) {
    return Object.values(keyNames).some(function(keycodes){
        return keycodes.indexOf(k)>=0;
    });
}

function updateKeycodesEdit(keycodesEdit) {
    keycodesEdit.innerHTML = keyNamesHtml();
    [].forEach.call(keycodesEdit.querySelectorAll("td"), function(td,ix){
        let keyname = keyNames[ix];
        td.addEventListener("click", function(){
            // replace the inside of the faux-button wih an input box
            // this enables us to trap a keystroke so we can update the new keycode 
            var input = document.createElement("input");
            input.value = "press key";
            input.style = "width: 100%; height: 100%; background-color:yellow;";

            td.appendChild(input);
            input.focus();
            input.addEventListener("keydown", function(ev){
                ev.preventDefault();
                // this event invoked when a key is pressed inside the input box
                const k0 = ev.key, k1 = k0.toLowerCase(),k2 = k0.toUpperCase();
                if (k0.length === 1 && k1 >= 'a' && k1 <= 'z') {
                    // this is a letter key which may be upper or lower case
                    // hence we need to store both

                    if (keyIsUsed(k1) || keyIsUsed(k2)) {
                        // the key is already used, so we can't use it
                        // so we don't update the keycodes object
                        input.style.backgroundColor = "red";
                        return false; 
                    } else {
                       keyNames[keyname] =  [ k1, k2 ];
                       td.innerHTML = k1;                
                    }
                } else {
                    // this is a special key, or a number key, so only one keycode is needed
                    if (keyIsUsed(k0)) {
                        // the key is already used, so we can't use it
                        // so we don't update the keycodes object
                        input.style.backgroundColor = "red";
                        return false; 

                    } else {

                        keyNames[keyname] = [ k0 ];
                        td.innerHTML = k0;                
                    }
                }

                // update the keycodes constant for the given keyname to reflect the new assignment 
                keynamesDefault[keyname].forEach(function(codedKey,ix){
                    keycodes[codedKey] = keyNames[keyname][ix];
                });


                // this will overwrite innerHTML in keycodesEdit, and free up the temp object and calbacks etc
                updateKeycodesEdit(keycodesEdit);
            });
        });
    });
}
