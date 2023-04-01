/*jshint esversion: 6 */


var http = require('http'),fs=require("fs");

const max_json_size = 1024 * 16; // 16KB per message per client. since the largest message will be some css, this should be plenty
const max_connections = 100; // max number of simultaneous connections allowed

// files to be served
var files = [
    "index.html",
    "index.js",
    "timer.html",
    "timer.js",
    "timer.css",
    "keys.js",
    "fsapi.js",
    "keyhelp.js",
    "keyhelp.css"];
// read files into memory
var data  = files.map(function(fn){
    return fs.readFileSync("./"+fn);
});

// connections holds each connection id and its state
var connections = {};

var connectionsChecker ;
// checkExpiredConnections will be before allocating a new connection, and before allowing a client to connect to one
// this is to ensure that we don't have any stale connections hanging around
// once a connection is created, all connections will be checked every 5 minutes
// if a connection has been idle for 5 minutes, it will be removed from the connections list
// this is mainly to prevent the connections list from growing indefinitely

function checkExpiredConnections() {
    
    if (connectionsChecker) clearTimeout(connectionsChecker);

    var now = Date.now();
    for (var id in connections) {   
        var conn = connections[id];
        if (now - conn.touched > 1000 * 60 * 5) {
            // connection has been idle for 5 minutes
            // remove it from the connections list

            // pendatically empty the fifo, to expedite garbage collection
            conn.fifo.splice(0, conn.fifo.length);
            delete connections[id];
        }
    }

    connectionsChecker = setTimeout(checkExpiredConnections, 1000 * 60 * 5); // check every 5 minutes    
}
    



http.createServer(function (req, res) {


  var url = req.url === "/" ? "index.html" : req.url.replace(/^\//,"");

  if (req.method === "GET") {

    if (url === "api/create") {
        // definatively force a check for expired connections before allocating a new one
        checkExpiredConnections();
        // originating browser will get a connection id
        // which it shares with peer via qr code or other means (out of band)
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(createConnection()));
        return;

    } else {

        if (url.startsWith("api/connect")) {
            // definatively force a check for expired connections before allowing a client to connect to one
            checkExpiredConnections();

            // connecting browser will receive a connection id
            // which was shared with it by peer via qr code or other means (out of band)

            let id = url.substring("api/connect/".length);
            let conn = connections[id];
            if (conn) {
                if (conn.connected) {
                    // we don't allow multiple connections to the same id
                    // this means each browser peer needs it's own id

                    // since we always reply with json, we return a json boolean value of false
                    // client can also check the http status code, if applicable                        
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end("false");
                } else {
                    // tell the connecting browser that the connection is ready (true)
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end("true");
                    conn.connected = true;
                    conn.touched = Date.now();
                }
            } else {
                // since we always reply with json, we return a json boolean value of false
                // client can also check the http status code, if applicable
                        
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end("false");
            }
            return;

        } else {

            if (url.startsWith("api/close/")) {
                let id = url.substring("api/close/".length);
                let conn = connections[id];
                if (conn) {
                    conn.fifo.splice(0, conn.fifo.length);
                    delete connections[id];
                }
                // always say the connection was closed, even if it wasn't
                // this because both sides are able to close the connection, and
                // we don't know which one will do it first. we just ignore the second.
                // in any case, since we validate the connection before we try to read/or write it
                // we can't get into a situation where we try to read/write a closed connection
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end("true");
                return;
            } else {
                if (url.startsWith("api/read/")) {
                    let conn = getConnection(url.substring("api/read/".length));
                    if (conn) {
                                conn.touched = Date.now();
                                if (conn.fifo.length) {
                                    // json messages are concatenated into a single string
                                    // are relayed to the client, without parsing on the server
                                    // this is to simplify later implementation of the protocol on
                                    // devices like routers that don't need to parse the messages
                                    // the browser will parse the messages and process them as needed
                                    // in most cases, the browser will receive an array with a single element
                                    // but it is possible to receive an array with multiple elements
                                    // if the client has been offline or the connection has been lost

                                    res.writeHead(200, { 'Content-Type': "application/json" });
                                    res.end("["+conn.fifo.splice(0, conn.fifo.length).map(function (data) {
                                        // allow for both string and buffer
                                        return typeof data === 'string' ? data : data.toString();
                                    }).join(",")+"]");

                                    return;
                                } else {
                                    // there is no data waiting for the peer, so we just save the response object
                                    // and wait for the peer to send us data
                                    
                                    conn.longPollReply = res;
                                    req.socket.close_cb_func = function () {
                                        // callback is fired when connection closed (e.g. closing the browser)
                                        conn.longPollReply = null;
                                        req.socket.removeListener('close', req.socket.close_cb_func);
                                        delete req.socket.close_cb_func;
                                    };

                                    req.socket.addListener('close', req.socket.close_cb_func);
                                
                                    return;
                                }
                            

                    } else {
                        // connection not found, so we return an error
                        // since we always reply with json, we return a json boolean value of false
                        // client can also check the http status code, if applicable
                        res.writeHead(404, { 'Content-Type': 'application/json' });
                        res.end("false");
                        return;
                    }
                } else {
                    var index = files.indexOf(url);
                    var contentType = index < 0 ? 'text/plain' :
                        url.endsWith(".html") ? 'text/html' :
                            url.endsWith(".js") ? 'text/javascript' :
                                url.endsWith(".css") ? 'text/css' : "text/plain";

                    res.writeHead(index < 0 ? 404 : 200, { 'Content-Type': contentType });
                    res.end(index < 0 ? "not found" : data[index]);

                }
            }
        }

    }
                          

  } else {


    if (req.method === "POST") {
            
        if (url.startsWith("api/write/")) {
            let conn = getConnection(url.substring("api/write/".length));
            if (conn) {
                let json = [];

                // get the post body which should be a well formed json string
                // it might arrive in more than one chunk, and we aren't sure if it's a string or buffer,
                // so we capture the chunks as they arrive and deal with them later.
                // it's most likely a buffer, but might depend on the browser/node version ?
                // in any case we'll get it as a string.
                req.on('data', function (chunk) {
                    json.push(chunk);                    
                });

                req.on('end', function () {
                    // acknowledge receipt of message (to sender)
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end("true");

                    // coalece the post body into a json string
                    let json_str = json.splice(0,json.length).map(function (data) {
                        // allow for both string and buffer
                        return typeof data === 'string' ? data : data.toString();
                    }).join("");

                    // we silently ignore messages that are too large
                    // this is to prevent a malicious client from flooding the server
                    // or a buggy client from sending too much data
                    if (json_str.length <= max_json_size)  {
                         conn.fifo.push(json_str);
               
                        if (conn.longPollReply) {
                            // if there is a long poll waiting for data, we send it the data
                            // and clear the long poll reply object, along with the fifo
                            conn.longPollReply.writeHead(200, { 'Content-Type': 'application/json' });
                            conn.longPollReply.end("["+conn.fifo.splice(0, conn.fifo.length).join(",")+"]");
                            conn.longPollReply = null;

                            if (req.socket.close_cb_func) {
                                req.socket.removeListener('close', req.socket.close_cb_func);
                                delete req.socket.close_cb_func;
                            }
                        }

                    }

                    conn.touched = Date.now();

                });
            }
        }
    }
  }

 
}).listen(8124, "127.0.0.1");

console.log('Server running at http://127.0.0.1:8124/');


function newId() {
    var id = Math.random().toString(36).substring(2);
    if (connections[id]) return newId();
    return id;
}

function createConnection() {
   let id = newId();
   connections[id] = {id:id,fifo:[],connected:false,longPollReply:null,touched:Date.now()};
   return {
       id:id
   };
}

function getConnection(id) {
    return connections[id];
}
