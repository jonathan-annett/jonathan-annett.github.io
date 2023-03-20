var keycodes = {
/*  logicalKey     event keycode*/
    "Space"      : " ",
    "Enter"      : "Enter",
    "Backspace"  : "Backspace",

    "1"          : "1",
    "2"          : "2",
    "3"          : "3",
    "4"          : "4",
    "5"          : "5",
    "6"          : "6",
    "7"          : "7",
    "8"          : "8",
    "9"          : "9",
    "0"          : "0",
    
    "Period"     : ".",
    "Colon"      : ":",

    "Pause"      : '"',
    "UndoPause"  : "'",

    "ArrowDown"  : "ArrowDown",
    "ArrowUp"    : "ArrowUp",
    "ArrowLeft"  : "ArrowLeft",
    "ArrowRight" : "ArrowRight",

    "q"          : "q",
    "Q"          : "Q",
    
    "b"          : "b",
    "B"          : "B",
    
    "f"          : "f",
    "F"          : "F",

    "m"          : "m",
    "M"          : "M",

    "t"          : "t",
    "T"          : "T",

    "p"          : "p",
    "P"          : "P",

    "s"          : "s",
    "S"          : "S",

    "x"          : "x",
    "X"          : "X",

    "c"          : "c",
    "C"          : "C",

    "r"          : "r",
    "R"          : "R",

    "k"          : "k",
    "K"          : "K"  

};


 const keyStyleWidth = {
    "Space"      :   100,
    "Enter"      :   100,
    "Tab"        :   100
 };

 const keyStyleContent = {
    "LeftArrow"  :   "\2190",
    "RightArrow" :   "\2192",
    "DownArrow"  :   "\2193",
    "UpArrow"    :   "\2191",
    '"'          :   "\0022",
    "'"          :   "\0027"
 };

 
const renameKeys = {
   " "           : "Space"
 };

const unconfigurableKeys = [
   "k","K","Backspace",".",":"
];

function renameKey(k) {
    return renameKeys[k] || k;
} 

const keyClasses = {
    " " : "key__button key__space",
    "'" : "key__button key__undopause",
    '"' : "key__button key__pause",
};

function keyClass (k) {
    return  keyClasses [k] || "key__button key__"+k.toLowerCase();
}

function keyStyleText (key) {
    const keycode = renameKey ( keycodes[key] );
    const cls = "key__"+key.toLowerCase();
    const wth = keyStyleWidth   [keycode] ? "."+cls+" { width : "+keyStyleWidth[keycode]+"px;}\n" : "";
    const ctx = 
      'content : "' + (
            keyStyleContent [keycode] || keycode
      ) + '"; '

    return wth + "."+cls+":after { "+ctx+" }";
}

function keyStyleTextAll () {
    return Object.keys(keycodes).filter(function(k){
        return k.length===1 && k===k.toUpperCase() || k.length>1;
    }).map(keyStyleText).join("\n");
}
let keyStyleSheet;

function updateKeyStyles() {
    if (keyStyleSheet) {
        keyStyleSheet.innerHTML = keyStyleTextAll();
    } else {
        keyStyleSheet = document.createElement("style");
        keyStyleSheet.innerHTML = keyStyleTextAll();
        document.head.appendChild(keyStyleSheet);
    }
}

var keyNames = {
    "Toggle Fullscreen Mode" : ["f","F"],
    "Toggle Progress Bar Display" : ["b","B"],
    "Toggle Standard Messages" : ["m","M"],
    "Pause/resume the countdown" : ['"'],
    "Undo pause (removes any added time)" : ["'"],
    "Toggle current time display" : ["t","T"],
    "Toggle presenter screen mode" : ["p","P"],
    "hours and minutes separator" : [":"],
    "decimal point for minutes" : ["."],
    "Single screen mode" : ["s","S"],
    "Restart timer": [" "],
    "Extend timer to default": ["x","X"],
    "Toggle/edit custom message": ["c","C"],
    "Confirm entered duration": ["Enter"],
    "Delete last entered character": ["Backspace"],
    "Open remote window": ["r","R"],
    "Edit Key codes": ["k","K"]
};

var keynamesDefault = Object.assign({}, keyNames);


function keyNamesHtml (){
    updateKeyStyles();
    return '<table>'+Object.keys(keyNames).sort().map(function(keyName){
        const key = keyNames[keyName][0]; // eg " " or "f"
        const defKey = keynamesDefault[keyName][0];
        const dispKey = renameKey(key);
        const dispDefKey = renameKey(defKey);
        return "<tr><td>"+keyName+'</td><td class="'+keyClass (key)+'" data-keyname="'+keyName+'">'+
        '</td><td> Default : <Span class="'+keyClass (defKey)+'">'+"</span></td></tr>"; 
    }).join("\n")+"</table>";
}

function keyIsUsed (k) {
    return Object.values(keyNames).some(function(keycodes){
        return keycodes.indexOf(k)>=0;
    });
}

function updateKeycodesEdit(keycodesEdit) {
    keycodesEdit.innerHTML = keyNamesHtml();
    [].forEach.call(keycodesEdit.querySelectorAll("td:nth-of-type(2)"), function(td,ix){

        let keyname = td.dataset.keyname;

        if (unconfigurableKeys.indexOf( keynamesDefault[keyname][0] )>=0 )  {
            td.parentElement.style.display="none";
            return;
        }

        let customKeydown,customKeydownAssigned = false;
        let customClick =  function(){
           
            if (customKeydownAssigned) {
                document.body.removeEventListener("keydown",customKeydown);
                customKeydownAssigned =false;
                td.style.backgroundColor = null;
           } else {
                document.body.addEventListener("keydown",customKeydown);
                customKeydownAssigned = true;
                td.style.backgroundColor = "yellow";
            }


        };

        customKeydown = function (ev) {

            ev.preventDefault();
            if (ev.key === "Shift" || ev.key === "Control" || ev.key === "Alt") {
                // ignore modifier keys
                return false;
            }
            // this event invoked when a key is pressed inside the input box
            const k0 = ev.key, k1 = k0.toLowerCase(),k2 = k0.toUpperCase();
            if (k0.length === 1 && k1 >= 'a' && k1 <= 'z') {
                // this is a letter key which may be upper or lower case
                // hence we need to store both

                if (keyIsUsed(k1) || keyIsUsed(k2)) {
                    // the key is already used, so we can't use it
                    // so we don't update the keycodes object
                    td.style.backgroundColor = k1===keyNames[keyname][0] ? "yellow" :  "red";
                    td.innerHTML = k1;
                    return false; 
                } else {
                   keyNames[keyname] =  [ k1, k2 ];
                }
            } else {
                // this is a special key, or a number key, so only one keycode is needed
                if (keyIsUsed(k0)) {
                    // the key is already used, so we can't use it
                    // so we don't update the keycodes object
                    td.style.backgroundColor = k0===keyNames[keyname][0] ? "yellow" :  "red";
                    td.innerHTML = keyDisplay(k0);
                    return false; 

                } else {

                    keyNames[keyname] = [ k0 ];
                }
            }

            // update the keycodes constant for the given keyname to reflect the new assignment 
            keynamesDefault[keyname].forEach(function(codedKey,ix){
                keycodes[codedKey] = keyNames[keyname][ix];
            });


            document.body.removeEventListener("keydown",customKeydown);
            customKeydownAssigned =false;

            // this will overwrite innerHTML in keycodesEdit, and free up the temp object and calbacks etc
            updateKeycodesEdit(keycodesEdit);

            let newtd=keycodesEdit.querySelectorAll("td:nth-of-type(2)")[ix];
            newtd.style.backgroundColor = "green";

            setTimeout(function(){
                newtd.style.backgroundColor = null;
            },1500);

        };


        td.addEventListener("click",customClick);
        


        
    });
}
