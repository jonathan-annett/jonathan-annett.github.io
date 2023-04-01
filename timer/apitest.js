
const api_endpoint = "http://localhost:8124/api/";


// callREST is a generic function for making REST calls to the server, which acts as 
// dumb relay between browsers. the server is agnostic as to what messages are passed
// between browsers, and only relays them. (the only limitation is that the message can't exceed 16kb in size)
// it's nominally a json string per message, but it's not validated by the server (or even parsed at all)
// so it's possible to send any string, and the server will just relay it to the other browsers, however be warned
// that each message is prefixed by a '[' and suffxed by a ']', and more than one message could be 
// combined forming them into a single json array. providing each message is valid JSON, the server will
// relay it to the other browsers as if it was an array of json objects.
// however at this level, this function just receives *something that is valid JSON*, which could be 
// a boolean value, a string, a number, an array, or an object, or a null value.


// connection logic:

// the operator's timer screen will publish an outgoing connnection id, 
// which can be used by a presenter to establish an incoming connection
// since the presenter screen is a passive display of information from the timer screen, it doesn't need to be able to 
// send messages back to the operator's timer

// the operator's timer screen can also publish an duplex connnection id, to be used by devices like streamdeck or anything that
// needs to both display the timer information, and also send commands to the timer screen

// finally, the operator's timer screen can publish a connection id that is only used receiving control messages



const apiResponses = {
    create  : { id : 'string' },
    connect : { },
    message : { }
};

function callREST(url,jsonObj,cb) {
    if (typeof jsonObj==='function') {
        // no json object passed, so shift arguments
        // which also implies a GET request
        // note that it's also valid to do callREST(url,null,cb) which will be a GET request
        // while callREST(url,cb) will always be a GET request
        // the only reason POST is used is if there is a json object to send
        // which at time of writing is only used for the simulated websocket write function
        cb = jsonObj;
        jsonObj = null;
    }
    let method = jsonObj ? 'POST' : 'GET';
    var xhr = new XMLHttpRequest();

    xhr.open( method, url, true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    
    if (!!jsonObj) {
        xhr.send(JSON.stringify(jsonObj));
    } else {
        xhr.send();
    }

    xhr.onreadystatechange = function() {

        if (xhr.readyState == 4 && xhr.status == 200) {
            var result = xhr.responseText;
            try {
                result = JSON.parse(result);
                if (result===false) {
                    return cb(new Error('Error in API call'));
                }
                return cb (null,result);
            }   catch(e) {
                console.log(e);
            }
        }
        if (xhr.readyState == 4 && xhr.status != 200) {
            return cb(new Error('Error in API call'));
        }
    }
}

function expectJSON(sample,json,cb) {
    if (typeof sample+typeof json+typeof cb ==='objectobjectfunction') {
        const keys = Object.keys(sample);
        if (keys.some(function(key){
            return sample[key].indexOf( typeof json[key]) < 0;
        })) return cb (new Error("invalid json object"));

        return cb(null,json);
        
    } else {
        throw new Error('expectJSON: invalid arguments');
    }
}

function emitter (events) {
    return function emit(ev,data) {
        const triggers = events[ev];
        if (typeof triggers==='object') {
            for (let i=0;i<triggers.length;i++) {
                triggers[i](data);
            }
        }
    };
}

function connectionObject(events,cmds) {
    cmds = cmds || {};

    cmds.on = on;
    cmds.off = off;
        
    return cmds;

    function on(ev,fn){
        const triggers = events[ev];
        if (typeof triggers+typeof fn==='objectfunction') {
            let ix = triggers.indexOf(fn);
            if (ix<0) {
                // only allow fn to be attached to named event once
                triggers.push(fn);
            }
        }

   }

   function off (ev,fn){
        const triggers = events[ev];
        if (typeof triggers+typeof fn==='objectfunction') {
            let ix = triggers.indexOf(fn);
            if (ix>=0) {
                triggers.splice(ix,1);
            }
        }
   }
}

function createIncomingEndpoint(){

    const  events = {
        error    : [],// something is rotten in the state of Denmark
        ready    : [],// the connection is ready for the peer to connect (this is where you get the id in order to publish it)
        message  : [],// incoming messages from a connected peer
    },
    emit = emitter (events);


    let connection = null;


    callREST(api_endpoint+"create",function(err,result){
        expectJSON(apiResponses.create,result,function(err,conn){
            if (!err) {
                connection = conn;
                emit('ready',connection);
                longPoller();
            }
        });
    });

    function longPoller () {
        if (!connection) return;
        callREST(api_endpoint+"read/"+connection.id,function(err,message){
            if (err) {
                emit('error',err);
                return setTimeout(longPoller,500);// try again in half a second
            }
            if (message) {
                emit('message',message);
            }
            longPoller();
        });
    }

    return connectionObject(events,{
    });


}

function connectAsOutgoingEndpoint(id) {

    const  events = {
        error    : [],
        ready    : [],
    },
    emit = emitter (events);

    let connection = null;

    callREST(api_endpoint+"connect/"+id,function(err,result){
        expectJSON(apiResponses.connect,result,function(err,conn){
            if (!err) {
                connection = conn;
                emit('ready',connection);
            }
        });
    });


    return connectionObject(events,{
        write : function(data) {
            if (connection) {
                callREST(api_endpoint+"write/"+connection.id,data);
            }
        }
    });
}

function createOutgoingEndpoint () {

    const  events = {
        error    : [],
        ready    : [],
    },
    emit = emitter (events);

    let connection = null;

    callREST(api_endpoint+"create",function(err,result){
        expectJSON(apiResponses.connect,result,function(err,conn){
            if (!err) {
                connection = conn;
            }
        });
    });

    return connectionObject(events,{
        write : function(data) {
            if (connection) {
                callREST(api_endpoint+"write/"+connection.id,data);
            }
        }
    });

}

function connectAsIncomingEndpoint (id) {

    const  events = {
        error    : [],
        ready    : [],
        message  : [],
    },
    emit = emitter (events);

    let connection = null;

    callREST(api_endpoint+"connect/"+id,function(err,result){
        expectJSON(apiResponses.connect,result,function(err,conn){

            if (err) {
                return emit('error',err);
            }
            connection = conn;
            emit('ready',connection);
            longPoller();
            
        });
    });

    function longPoller () {
        if (!connection) return;
        callREST(api_endpoint+"read/"+connection.id,function(err,message){
            if (err) {
                emit('error',err);
                return setTimeout(longPoller,500);// try again in half a second
            }
            if (message) {
                emit('message',message);
            }
            longPoller();
        });
    }

    // return the connection object, with atached event handlers
    return connectionObject(events,{
    });
      
}

function createDuplexEndpoint( ) {

    // a duplex endpoint is a combination of an incoming and outgoing endpoint
    // we literally create 2 connections as that's the simplest way to do it
    // in this context we are inventing a new id and creating a connection that will 
    // be connected to by a peer, once we publish the id.

    const  events = {
        error    : [],// error gets emitted when an error occurs
        ready    : [],// ready gets emitted when both incoming and outgoing connections are ready AND a peer has connected
        message  : [],// message gets emitted when a message is received from the peer
    },
    emit = emitter (events);

    let connection = null;

    let incoming,outgoing = createOutgoingEndpoint();
    
    // relay any errors from the outgoing connection to the duplex connection handler
    outgoing.on('error',emit.bind(this,'error'));

    outgoing.on("ready",function(out_conn){
        // ready is emitted when the server is able to start buffering or relaying messages to 
        // a potential peer's incoming connection. 
        // it does NOT mean that the peer's incoming connection is ready to receive messages.
        // it does however mean we create an incoming reply connection (for messages coming back from the peer),
        // and once it is ready, we send the id of the reply connection to the peer's incoming connection
        // this means we only need to "publish" 1 id, and the reply is id is exchaged automatically by 
        // the peers when they connect 


   

        incoming = createIncomingEndpoint();
        incoming.on("ready",function(in_conn){
            // ok so we now have 2 connections, one for outgoing messages, and one for incoming messages
            // we don't know if any peer has even connected yet, just that it will have been shared
            // an id (somehow - qr- email - whatever) and that it will be able to connect to us via the server


            // we emit the ready event here once we have an id, in order to 
            // publish it. this means the servar has both connections established
            // from OUR point of view, but the peer won't have any way to know that yet,
            // with duplex connections the ready event will be emited again once the peer has 
            // established the connect, and in that case, and additional reply_id value will be
            // included, which is the id of the return connection that the peer has created
            // so if you need to know when the peer is actually there, look for the reply_id value
            emit('ready',out_conn);

            let duplex_conn = {
                id       : out_conn.id,
                reply_id : in_conn.id // unlikely to be used, but just in case, and for debugging
            };

            outgoing.write({duplex:duplex_conn});


            // install a handler for the first message
            incoming.on('message',bootstrapDuplex);
            incoming.on('error',emit.bind(this,'error'));
            
            
            function bootstrapDuplex (message){
                // once we have received our first message from 
                // the peer, we can set the connection object 
                // and emit the ready event
                connection = duplex_conn;
                // we are now ready to send and receive messages 
        
                emit('ready',connection);
                
                incoming.off('message',bootstrapDuplex);
                emit('message',message);

                // from now on, messages can just go straight to the emitter
                incoming.on('message',emit.bind(this,'message')); 
            }

        });
        

    });


    return connectionObject(events,{
        write : function(data) {
            if (outgoing) {
                outgoing.write(data);
            }
        }
    });

}

function connectAsDuplexEndpoint (id) {
    // a duplex endpoint is a combination of an incoming and outgoing endpoint
    // we literally create 2 connections as that's the simplest way to do it
    // in this context, we are connecting to a previously published endpoint id
    // which we know is a duplex endpoint (by context of what it's being used for)
    // since IDs are always attached to a url in some way, we will know the context of the url

    const  events = {
        error    : [],
        ready    : [],
        message  : [],
    },
    emit = emitter (events);

    let connection = null;

    let outgoing,incoming = connectAsIncomingEndpoint(id);

    incoming.on('error',emit.bind(this,'error'));
    incoming.on("message",boostrapDuplex);
    
    function boostrapDuplex(message){
        if (message.duplex) {
            outgoing = connectAsOutgoingEndpoint(message.duplex.reply_id);
            incoming.off("message",boostrapDuplex);
    
            // from now on, messages can just go straight to the emitter
            incoming.on('message',emit.bind(this,'message'));

            // send a dummy message to the peer to let it know we are ready
            outgoing.write(null);

            outgoing.on('error',emit.bind(this,'error'));

            emit('ready',message.duplex);
        }
    }

    return connectionObject(events,{
        write : function(data) {
            if (outgoing) {
                outgoing.write(data);
            }
        }
    });


}