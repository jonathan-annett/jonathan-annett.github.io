/*global self*/


self.addEventListener('storage',function(){
    const wid = window.wid;
    if (wid) {
        const positonKey    = "windowTools.cmd."+wid+".positonArgs";
        const positonArgs   = localStorage.getItem(positonKey);

        if (positonArgs) {
            localStorage.removeItem(positonKey);
            restoreCapturedState(JSON.parse(positonArgs));
        } else {
            const reportPositionKey  = "windowTools.cmd."+wid+".reportPosition";
            const reportPositionArgs = localStorage.getItem(reportPositionKey);
            if (reportPositionArgs) {
               const reportPositionReplyKey  = "windowTools.cmd."+wid+".reportPosition.reply";
               const args = winRestoreCapture ();
               localStorage.setItem(reportPositionReplyKey,JSON.stringify(args.slice(-2)));
               localStorage.removeItem(reportPositionKey);
            } else {
                const closeKey  = "windowTools.cmd."+wid+".close";
                const closeArgs = localStorage.getItem(closeKey);
                if (closeArgs) {
                    localStorage.removeItem(closeArgs);
                    window.close();
                } 
            }
        }
    }
});



function winRestoreCapture () {
    const win = window;
    const cmds = [
      [ "moveTo",   [0,0]   ],
      [ "resizeTo", [win.outerWidth,win.outerHeight] ]
    ];
    if (!(win.screenX===0&&win.screenY===0)) {
       cmds.push([ "moveTo",  [win.screenX,win.screenY]   ]);
    }
    return cmds;
}

function restoreCapturedState(cmds) {
    const 
    win=window,
    len=cmds.length;
    for(var i = 0; i < len; i++) {
        var x = cmds[i];
        win[x[0]].apply(win,x[1]);
        x[1].splice(0,2);
        x.splice(0,2);
    }
    cmds.splice(0,len);
}