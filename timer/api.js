

function _timerApi_obj(obj) {
    var cmd = obj.cmd;
    var duration = obj.duration || 0;
    var id = obj.id;
    var data = obj.data;
    var result = null;
    if (cmd==='start') {
       
    }
    if (cmd==='pause') {
       
    }
    if (cmd==='resume') {

    }
    if (cmd==='setDefault') {

    }
    
  
    return result;
}
function _timerApi_json(json) {
    var obj = JSON.parse(json);
    return _timerApi_obj(obj);
}

function timerApi(cmd) {    
    if (typeof cmd==='object') return _timerApi_obj(cmd);
    if (typeof cmd==='string') return _timerApi_json(cmd);
}