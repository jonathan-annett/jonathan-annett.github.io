 
/* global ml,self,caches,BroadcastChannel, swResponseZipLib,ace  */
ml([],function(){ml(2,

    {
        Window: function aceSessionLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        }
    }, {
        Window: [
            ()=> aceSessionLib ()
        ]

    }

    );


    function aceSessionLib () {
       var filterHistory = function(deltas){ 
           return deltas.filter(function (d) {
               return d.group != "fold";
           });
       }
       
       var sessionToJSON = function(session) {
           return {
               selection: session.selection.toJSON(),
               value: session.getValue(),
               history: {
                   undo: session.$undoManager.$undoStack.map(filterHistory),
                   redo: session.$undoManager.$redoStack.map(filterHistory)
               },
               scrollTop: session.getScrollTop(),
               scrollLeft: session.getScrollLeft(),
               options: session.getOptions()
           }
       }
       
       var sessionFromJSON = function(data) {
           var session = ace.createEditSession(data.value);
           session.$undoManager.$doc = session; // workaround for a bug in ace
           if (data.options) session.setOptions(data.options);
           if (data.history) {
               session.$undoManager.$undoStack = data.history.undo;
               session.$undoManager.$redoStack = data.history.redo;
           }
           if (data.selection)  session.selection.fromJSON(data.selection);
           if (data.scrollTop)  session.setScrollTop(data.scrollTop);
           if (data.scrollLeft) session.setScrollLeft(data.scrollLeft);
           return session;
       };
       
       function serialize (editor,omit,data,cb) {
           if (typeof data==='function') {
               cb=data;
               data={};
           }
           if (typeof omit==='function') {
               cb=omit;
               omit=undefined;
               data={};
           }
           try {
                cb(undefined,(function(session){
                    
               
                   var object = {
                       editor : {
                           theme : editor.getTheme().split("/").pop()
                       },
                       session : sessionToJSON(session),
                       data : data
                   }
                   
                   if (omit) {
                       omit.forEach(function(k){delete object.session[k];delete object.editor[k]});
                   }
               
                   return JSON.stringify(object);
                   
               })(editor.getSession()));
           } catch (err) {
               cb(err);
           }
       }
       
       function deserialize (editor,json,cb) {
           
           try {
                  cb (undefined,(function(session,state){
           
                   if (state.editor.theme) {
                       editor.setTheme("ace/theme/"+state.editor.theme);
                   }
                   const oldSession = editor.getSession();
                   editor.setSession(sessionFromJSON(state.session));
                   if (oldSession) {
                      oldSession.destroy();
                   }
   
                   return state.data;
               })(editor.getSession(),JSON.parse(json)));
               
           } catch (err) {
               cb(err);
           }
       }
       
       return  {
           serialize   : serialize,
           deserialize : deserialize
        };
       
       
    }

 

});

