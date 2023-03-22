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

    "TogglePresenterScreen"          : "p",
    "TOGGLEPRESENTERSCREEN"          : "P",

    "SingleScreenMode"          : "s",
    "SINGLESCREENMODE"          : "S",

    "ExtendTimerToDefault"          : "x",
    "EXTENDTIMERTODEFAULT"          : "X",

    "ToggleCustomMessage"          : "c",
    "TOGGLECUSTOMMESSAGE"          : "C",

    "OpenRemoteWindow"          : "r",
    "OPENREMOTEWINDOW"          : "R",

    "KeyCodeEditor"          : "k",
    "KEYCODEEDITOR"          : "K",
    
    "StyleEditor"          : "e",
    "STYLEEDITOR"          : "E",


};

var keyNames = {

    "getting started, with two monitors (the secondary monitor for the presenters countdown)" : [],
    "Open remote (presenter) window":       [ "OpenRemoteWindow","OPENREMOTEWINDOW" ],
    "after dragging a window to a particular monitor, use:" : [],
 
    "Toggle Fullscreen Mode"              : [ "ToggleFullScreen","TOGGLEFULLSCREEN"],

    "when using a single monitor, you can use the following keys to switch between various modes":[],
    
    "Toggle presenter screen mode" :        [ "TogglePresenterScreen","TOGGLEPRESENTERSCREEN"],
    
    "Single screen mode" :                  [ "SingleScreenMode","SINGLESCREENMODE"],
    
    "editing the duration in minutes... (use number keys, along with)" : [],
    "hours and minutes separator" :         [ "Colon",   "COLON" ],
    "decimal point for minutes" :           [ "Period",  "PERIOD" ],
    
    "after entering a duration, use one of ": [],
    "Confirm entered duration":             [ "Enter", "ENTER" ],    
    "Restart timer":                        [ "Space","SPACE" ],

    "advanced features... (use the following keys)" : [],

    "Pause/resume the countdown"          : [ "Pause", "PAUSE" ],
    "Undo pause (removes any added time)" : [ "UndoPause", "UNDOPAUSE" ],
    
    "Toggle Progress Bar Display"         : [ "ToggleProgressBar","TOGGLEPROGRESSBAR"],
    "Toggle Standard Messages"            : [ "ToggleMessagesMode","TOGGLEMESSAGESMODE"],
        
    "Toggle current time display" :         [ "ToggleTimeOfDay","TOGGLETIMEOFDAY"],
    
    
    "Extend timer to default":              [ "ExtendTimerToDefault","EXTENDTIMERTODEFAULT" ],
    "Toggle/edit custom message":           [ "ToggleCustomMessage","TOGGLECUSTOMMESSAGE"],
    "Delete last entered character":        [ "Backspace", "BACKSPACE" ],
     "Edit Key codes":                       [ "KeyCodeEditor","KEYCODEEDITOR" ],
    
     "Edit Style":                           [ "StyleEditor","STYLEEDITOR" ],

};

var keynamesDefault = Object.assign({}, keyNames);



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



function keyNamesHtml (){
    updateKeyStyles();
    return '<table>'+Object.keys(keyNames).map(function(keyName){
        const keylist = keyNames[keyName];
        if (keylist.length===0) {
            return '<tr><td class="header">'+keyName+'</td><td colspan="2"></td></tr>';
        }
        const key = keylist[0]; // eg " " or "f"
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

        if (keyname && keynamesDefault[keyname].length>0) {

            if (unconfigurableKeys.indexOf( keynamesDefault[keyname][0] )>=0 )  {
                td.parentElement.style.display="none";
                return;
            }
        } else {
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