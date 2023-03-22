/* global   html */


// keycodes is a map of logical keys to event keycodes
// the logical keys are the keys that are used in the code
// the event keycodes are the keycodes that are returned by the event.key property

var keycodes = {
/*  logicalKey     event keycode*/
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

    "Space"      : " ",
    "SPACE"      : " ",

    "Enter"      : "Enter",
    "ENTER"      : "Enter",

    "Backspace"  : "Backspace",
    "BACKSPACE"  : "Backspace",


    
    "Period"     : ".",
    "PERIOD"     : ".",
    
    "Colon"      : ":",
    "COLON"      : ":",

    "Pause"      : '"',
    "PAUSE"      : '"',
    
    "UndoPause"  : "'",
    "UNDOPAUSE"  : "'",

    "ArrowDown"  : "ArrowDown",
    "ARROWDOWN"  : "ArrowDown",
    
    "ArrowUp"    : "ArrowUp",
    "ARROWUP"    : "ArrowUp",

    "ArrowLeft"  : "ArrowLeft",
    "ARROWLEFT"  : "ArrowLeft",

    "ArrowRight" : "ArrowRight",
    "ARROWRIGHT" : "ArrowRight",

    "QuitApp"    : "q",
    "QUITAPP"    : "Q",
    
    "ToggleProgressBar"  : "b",
    "TOGGLEPROGRESSBAR"  : "B",
    
    "ToggleFullScreen"          : "f",
    "TOGGLEFULLSCREEN"          : "F",

    "ToggleMessagesMode"          : "m",
    "TOGGLEMESSAGESMODE"          : "M",

    "ToggleTimeOfDay"          : "t",
    "TOGGLETIMEOFDAY"          : "T",

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
    "LeftArrow"  :   "\\2190",
    "RightArrow" :   "\\2192",
    "DownArrow"  :   "\\2193",
    "UpArrow"    :   "\\2191",
    '"'          :   "\\0022",
    "'"          :   "\\0027"
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


// keyStyleText () returns the CSS text for a single key    

function keyStyleText (suffix,key) {
    suffix=suffix||"";
    const keycode = renameKey ( keycodes[key] );
    const cls = "key__"+key.toLowerCase()+suffix;
    const wth = keyStyleWidth [keycode] ? "."+cls+" { width : "+keyStyleWidth [keycode]+"px;}\n" : "";
    const ctx = 
      'content : "' + (
            keyStyleContent [keycode] || (  keycode.length===1 ?  keycode.toUpperCase() : keycode ) // if the keycode is a single character, use the uppercase version
            // this means codes like Tab and Enter will be left in their original case
            // this is to simulate the look and feel of an actual keyboard 
            // although this does of course depend on the manufacturer of the keyboard
      ) + '"; '

    return wth + "."+cls+":after { "+ctx+" }";
}


// keyStyleTextAll () returns the CSS text for all keys

function keyStyleTextAll (suffix) {
    // filterFunc - only include keys that are single characters and uppercase, or longer than 1 character
    const filterFunc = function(k){
        return k!==k.toUpperCase();
    };

    const mapper = keyStyleText.bind (this,suffix); 
    
    return Object.keys(keycodes).filter(filterFunc).map(mapper).join("\n");
}

// keyStyleSheet and defKeyStyleSheet are the style sheets for the keys
let keyStyleSheet;
let defKeyStyleSheet;

// updateKeyStyles () updates the key stylesheets
function updateKeyStyles() {
    if (keyStyleSheet) {
        // update the styleshet using current object values
        keyStyleSheet.innerHTML = keyStyleTextAll();
    } else {
        // first time scenario - create the style sheets (and add them to the document)
        keyStyleSheet = document.createElement("style");
        keyStyleSheet.innerHTML = keyStyleTextAll();
        document.head.appendChild(keyStyleSheet);

        defKeyStyleSheet = document.createElement("style");
        defKeyStyleSheet.innerHTML = keyStyleTextAll("_def");// add _def as a suffix to the class names
        document.head.appendChild(defKeyStyleSheet);
        

    }
}

var keyNames = {
    "Toggle Fullscreen Mode"              : [ "f","F"],
    "Toggle Progress Bar Display"         : [ "b","B"],
    "Toggle Standard Messages"            : [ "m","M"],
    "Pause/resume the countdown"          : [ "Pause", "PAUSE" ],
    "Undo pause (removes any added time)" : [ "UndoPause", "UNDOPAUSE" ],
    "Toggle current time display" :         [ "t","T"],
    "Toggle presenter screen mode" :        [ "p","P"],
    "hours and minutes separator" :         [ "Colon",   "COLON" ],
    "decimal point for minutes" :           [ "Period",  "PERIOD" ],
    "Single screen mode" :                  [ "s","S"],
    "Restart timer":                        [ "Space","SPACE" ],
    "Extend timer to default":              [ "x","X" ],
    "Toggle/edit custom message":           [ "c","C"],
    "Confirm entered duration":             [ "Enter", "ENTER" ],
    "Delete last entered character":        [ "Backspace", "BACKSPACE" ],
    "Open remote window":                   [ "r","R" ],
    "Edit Key codes":                       [ "k","K" ]
};

var keynamesDefault = Object.assign({}, keyNames);


function keyNamesHtml (){
    updateKeyStyles();
    return '<table>'+Object.keys(keyNames).sort().map(function(keyName){
        const key = keyNames[keyName][0]; // eg " " or "f"
        const defKey = keynamesDefault[keyName][0];
        const dispKey = renameKey(key);
        const dispDefKey = renameKey(defKey);
        return "<tr><td>"+keyName+'</td><td class="'+keyClass (defKey)+'" data-keyname="'+keyName+'">'+
        '</td><td> Default : <Span class="'+keyClass (defKey)+'_def">'+"</span></td></tr>"; 
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
                td.classList.remove("defining");
                td.classList.remove("error");
                td.classList["add"]("redefined");
                    
                    
           } else {
                document.body.addEventListener("keydown",customKeydown);
                customKeydownAssigned = true;
                td.classList.add("defining");
                html.classList.add("defining");
            }
        };

        customKeydown = function (ev) {

            ev.preventDefault();
            if (ev.key === "Shift" || ev.key === "Control" || ev.key === "Alt") {
                // ignore modifier keys
                return false;
            }
            const k0 = ev.key, k1 = k0.toLowerCase(),k2 = k0.toUpperCase();
            if (k0.length === 1 && k1 >= 'a' && k1 <= 'z') {

                if ( keyIsUsed(k1) || keyIsUsed(k2)) {
                    // the key is already used, so we can't use it
                    // so we don't update the keycodes object
                    td.classList.add("error");
                    return false; 
                } else {
                   keyNames[keyname] =  [ k1, k2 ];
                }
            } else {
                if (keyIsUsed(k0) || keyIsUsed(k2)) {                
                    // the key is already used, so we can't use it
                    // so we don't update the keycodes object
                    td.classList.add("error");
                    return false; 

                } else {

                    keyNames[keyname] = [ k0, k2 ];
 
                }
            }

            console.log("updating",keyname,"from",keyNames[keyname]);

            // update the keycodes constant for the given keyname to reflect the new assignment 
            keynamesDefault[keyname].forEach(function(codedKey,ix){
                keycodes[codedKey] = keyNames[keyname][ix];
            
            });

            console.log(keyname,"is now",keyNames[keyname],"default is",keynamesDefault[keyname]);


            document.body.removeEventListener("keydown",customKeydown);
            customKeydownAssigned =false;

            // this will overwrite innerHTML in keycodesEdit, and free up the temp object and calbacks etc
            updateKeycodesEdit(keycodesEdit);

            let newtd=keycodesEdit.querySelectorAll("td:nth-of-type(2)")[ix];
            newtd.classList.add("redefined");
            newtd.classList.remove("defining");
            newtd.classList.remove("error");

            html.classList.remove("defining");

            setTimeout(function(){
                newtd.classList.remove("redefined");
            },1500);

        };


        td.addEventListener("click",customClick);
        


        
    });
}


function keyWasPressed (nm,ev) {

  if (ev.key===keycodes[nm]) {
     return true;
  }

  if (ev.key===keycodes[nm.toUpperCase()]) {
    return true;
  }

  if (ev.key===keycodes[nm+"_1"]) {
    return true;
  }

  return (ev.key===keycodes[nm+"_2"]);

}