/* global htmlRenderer*/

function tabCallsApp() {
    
  window.gifLoaded = gifLoaded;
  
  window.showGif   = showGif;
  
   var gifEvents = {}, 

       htmlTemplates={
         
         send_others_info_header   : {  },
         send_others_info_table    : {  },
         send_others_buttons_header: {  },
         send_others_buttons_table : {  },
         
         
       };

  function JSON_stringifyFuncs (x) {
        // example replacer function
        var replacer = function (name, val) {
          // convert RegExp to string
          if ( val && typeof val=== 'function') {
              return 'function '+val.name+'('+val.length+' args){...}' ;
          } else {
              return val; // return as is
          }
        };
    
    return JSON.stringify(x,replacer,4);
 
  }
    
  function gifLoaded(gif) {
       gif=typeof gif==='string'?document.getElementById(gif):gif;
       // back up the source url so we can utilize it later, (image itself is cached now)
       gif.dataset.src= gif.src;
       // lock in dimensions (in case auto was used for width or height)
       var ht = ""+gif.height+"px",wt = ""+gif.width+"px"; 
       gif.style.width=wt;gif.style.height=ht;

       // swizzle out the loader to handle the hiding after data-msec milliseconds
       gif.onload=function() {
         gif.style.visibility="visible";
         setTimeout(function(){
            gif.style.visibility="hidden";
            if (gifEvents[gif.id]) {
               gifEvents[gif.id]();
               delete gifEvents[gif.id];
            }
         },gif.dataset.msec);
       };
    }
  
  function showGif(gif,cb) {
       gif=typeof gif==='string'?document.getElementById(gif):gif;
       gif.style.visibility="hidden";
       gif.src = "";
       gif.src= gif.dataset.src;
       if (typeof cb==='function') {
          gifEvents[gif.id]=cb;
       } else {
          if(gifEvents[gif.id]) delete gifEvents[gif.id];
       }
    }
     
  var renderer = htmlRenderer("tabcalls-test-template.html",htmlTemplates);
  
  return function (storageSend) {
    
    var peers        = document.getElementById("peers");
    var send_others  = document.getElementById("send_others");
    var log          = document.getElementById("log");
    var reverse_log  = document.getElementById("reverse_log");
    var local_id     = document.getElementById("local_id");
    var ws_device_id = document.getElementById("ws_device_id");

    // fake console.log - appends html to a div 
    
    reverse_log.onchange = function () {
         var display; 
       if (console_log.lines.length>30) {
          display = console_log.lines.slice(console_log.lines.length-10);
        } else {
          display = console_log.lines.slice(0);
        }
        if (reverse_log.checked) display.reverse();
        log.innerHTML = display.join("\n");
        display.splice(0,display.length);
    };
    function console_log(msg) {
       console_log.lines.push(new Date().toLocaleString().split(" ")[1]+"| "+msg);
       reverse_log.onchange ();
    }
    
   

    // set_led named by id+"_"+id_suffix to specfic classs, based on state 
    function set_led(id,id_suffix,on_state,off_state,state,quiet) {

      var el = id ? document.getElementById(id+"_"+id_suffix) : false;
      if (el) {
        el.classList.add(state ? on_state : off_state);
        el.classList.remove( state ? off_state : on_state);
      } else {
         if (!quiet) console_log("element "+id+"_"+id_suffix+" not found");
      }
      return el;
    }

    // set background color optionally for msec seconds
     var shades = [
         "shade_orange","shade_green","shade_red","shade_lime","shade_pink","shade_blue","shade_b4ffa6" 
     ];
    function shade(ids,color,msec,cb,cbArgs) {
       var el = typeof ids==="object" ? ids.map(function(id){return document.getElementById(id+"_info")}).filter(function(el){ return !!el;}) : document.getElementById(ids+"_info");
       var isList = !!el &&  el.constructor===Array && el.length > 0;
        if (isList || !!el && el.constructor !==Array) {
         var go = function (ADD,REMOVE) {
            shades.forEach(function(x){
              var go2 = function(el){el.classList[x==="shade_"+color?ADD:REMOVE](x);};
              if (isList) el.forEach(go2) ; else go2(el) 
            });
         };
         go("add","remove");
         if (msec) {
           return setTimeout (function(){
             go("remove","remove");
             if (typeof cb==='function') {

                 if (typeof cbArgs==='object' && cbArgs.constructor===Array) {
                    cb.apply(this,cbArgs);
                 } else {
                    cb ();
                 }
             }
           },msec);
         }
       }
    }

 
    console_log.lines=[new Date().toLocaleString().split(" ")[1]+"| Log Started..."];
    log.innerHTML = console_log.lines.join("\n");
    

    window.console_log = console_log;


    storageSend.variables.toggle = false;

    var this_tab_local_id = storageSend.id;
    var this_tab_device_id = storageSend.WS_DeviceId;
    var this_tab_full_id = this_tab_device_id+"."+this_tab_local_id;
    local_id.innerHTML=this_tab_local_id;
    
    
    
    function vibrateIfYouCan(pattern) {
       try {
         if (window.navigator.vibrate) window.navigator.vibrate(pattern);
       } catch(e) {
         
       }
    }
    
    var simpleFunctionDemoClick = simpleTest(storageSend);
    var callbackAndResultDemoClick = callbackTest(storageSend);
    var promiseDemoClick = promisesTest(storageSend);
    var sendToAllDemoClick = sendToAllTest(storageSend);
    
    function simpleTest(storageSend) {

      storageSend.message_no_cb = function (callInfo,msg) {
          // this function can be called locally or from another tab
          var full = storageSend.__getFullId(callInfo.from);
          console_log("got a message from "+full+":"+JSON.stringify(msg));
          shade([full,full+"_btn"],"lime",1000);
          shade([this_tab_full_id, this_tab_full_id+"_btn"],"green",1000);
          vibrateIfYouCan(0);
          vibrateIfYouCan(100);
      };
      
      function simpleFunctionDemoClick(btn){
          shade([btn.dataset.tab_id  ,btn.dataset.tab_id +"_btn"],"b4ffa6",500);
          var msg = "the time is "+new Date().toString();
          storageSend.tabs[btn.dataset.tab_id].message_no_cb( msg );
          console_log("sent message to :"+btn.dataset.tab_id+" &gt;&gt; "+msg);
          btn.blur();
          vibrateIfYouCan(0);
          vibrateIfYouCan(100);
        
         storageSend.__call("node.js","serverConsoleLog",false,"sent message to :"+btn.dataset.tab_id+" >> "+msg);

      }
      
      return simpleFunctionDemoClick;
    }    
     
    function callbackTest(storageSend) {

      storageSend.tester = function (life,universe,everything,cb) {
        
          console_log(JSON.stringify({life,universe,everything}));
          if (typeof cb==='function'){
            
               showGif(this_tab_full_id+"_countdown");
               console_log("setting callback timer for 5 seconds");
               vibrateIfYouCan(100);
            
               shade([this_tab_full_id, this_tab_full_id+"_btn"],"green",5000,function(num){
                    vibrateIfYouCan(500);
                    cb(num);
               },[life+universe+everything]);
          }
          return life+universe+everything;
      };
      
      function callbackAndResultDemoClick(btn){
          var 
          life = 10,
          universe = 20,
          everything = 12,
          started = Date.now(),
          warnTimeout,
          kill_warn = function () { if (warnTimeout) {clearTimeout(warnTimeout);warnTimeout=undefined; } };

          showGif(btn.dataset.tab_id+"_countdown");
          warnTimeout = shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"orange",7000,function(){
              console_log("callback request to "+btn.dataset.tab_id+" did not get a callback");
              shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"red");
          });
        
          vibrateIfYouCan(0);
          vibrateIfYouCan(5000);
          storageSend.tabs[btn.dataset.tab_id].tester(life,universe,everything,function(meaning){
                  kill_warn();
                  if (meaning===(life+universe+everything) ) {
                      shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"lime",1000);
                      console_log("correct callback value:"+meaning);
                    
                       showGif(btn.dataset.tab_id+"_dont_panic");
                       vibrateIfYouCan([
                              100,100,  200,100,  100,100,  200,100, 
                              100,100,  200,100,  100,100,  200,100, 
                              100,100,  200,100,  100,100,  200,100, 
                              100,100,  200,100,  100,100,  200,100, 
                              100,100,  200,100,  100,100,  200,100
                              ]);
          
                    
                  } else {
                      shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"red",1000);
                      console_log("incorrect callback value:"+meaning);
                  }
              }
                  

          ).result( function (callInfo,answer) {
                  kill_warn();
                  vibrateIfYouCan(0);
                   btn.blur();
                  console_log("the (immediate) result of a remote call to tab['"+btn.dataset.tab_id+"']."+callInfo.fn+"("+
                  callInfo.args.map(function(x){return typeof x==='function'?'&lt;fn&gt;':x;}).join(",")+
                  ") is "+answer);

                  console_log("expect a callback in about 5 seconds (the answer to the ultimate question)");

                  warnTimeout = shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"b4ffa6",(started+6000)-Date.now(),function(){
                       shade(btn.dataset.tab_id,"red",1000);
                  });

           });
        
          btn.blur();
      }   
      
      return callbackAndResultDemoClick;
    }

    function promisesTest(storageSend) {
      
          storageSend.promiseTest = function (resolve, reject) {
               //this is a promise to be invoked from a remote tab

               var dice,
                   dice_rolled = diceFor(this_tab_full_id),
                   spins = setInterval(function(){
                      dice = 1 + Math.floor(Math.random()*6);
                      dice_rolled.className = "dice dice-"+dice.toString();
                   },100);
            
            
               vibrateIfYouCan(0);
               vibrateIfYouCan(100);
               shade([this_tab_full_id,this_tab_full_id+"_btn"],"orange",3000,function(){

                   shade([this_tab_full_id,this_tab_full_id+"_btn"],"orange");   
                   vibrateIfYouCan(100);

                   clearInterval(spins);

                   setTimeout(function(){

                       if (dice < 4) {

                          var roll = {
                              roll : dice,
                              info : "you rolled less than 4!"
                          };

                          setTimeout(resolve,500,roll); 
                          vibrateIfYouCan(500);
                          shade([this_tab_full_id,this_tab_full_id+"_btn"],"lime",5000,function(){
                             dice_rolled.className = "dice dice-0";
                             
                          });


                      } else {
                           var reason = new DiceRollError('Sorry: you rolled:'+dice.toString(),dice);
                           setTimeout(reject,500,reason); // reject
                           vibrateIfYouCan([250,100,500,100,1000]);
                           shade([this_tab_full_id,this_tab_full_id+"_btn"],"red",5000,function(){
                               dice_rolled.className = "dice dice-0";
                               vibrateIfYouCan([250,100,500,100,1000]);
                          });
                     }

                   },500);

               });
              
           

          };
      
          function diceFor(id,roll) {
            var dice = document.getElementById(id+"_dice_rolled");
            if (typeof roll==='number') dice.className = "dice dice-"+roll.toString();
            return dice;
          }


          class DiceRollError extends Error {
            constructor(message,roll) {
              super(message);
              this.name = "DiceRollError";
              this.info = "You rolled higher than 3!";
              this.roll = roll;
            }
          }

          function promiseDemoClick(btn){

              var      
                 warnTimeout,

                 kill_warn = function () { if (warnTimeout) {clearTimeout(warnTimeout);warnTimeout=undefined; } };

              showGif(btn.dataset.tab_id+"_countdown");

              warnTimeout = shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"b4ffa6",6000,function(){
                  console_log("callback request to "+btn.dataset.tab_id+" did not get a callback");
                  shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"red");
              });


              diceFor(btn.dataset.tab_id,0); 
              vibrateIfYouCan(0);
              vibrateIfYouCan(100);

              new Promise(

                     storageSend.tabs[btn.dataset.tab_id].promiseTest

                  ) .then(function (fulfilled) {
                      // you rolled 1,2, or 3
                      kill_warn();

                      diceFor(btn.dataset.tab_id,fulfilled.roll); 

                      console_log("promise fullfilled:" +JSON.stringify(fulfilled));  
                      vibrateIfYouCan(500);

                      shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"lime",5000,function(){
                          diceFor(btn.dataset.tab_id,0);
                      });


                  })
                  .catch(function (error) {
                      // oops, you rolled 4,5,or 6
                      kill_warn();

                      diceFor(btn.dataset.tab_id,error.roll);

                      console_log("promise rejected:" +JSON.stringify({message:error.message,roll:error.roll,info:error.info}));
                      vibrateIfYouCan([250,100,500,100,1000]);
                      shade([btn.dataset.tab_id,btn.dataset.tab_id+"_btn"],"red",5000,function(){
                          diceFor(btn.dataset.tab_id,0);
                      });

                  });


              console_log("a promise request was sent to:"+btn.dataset.tab_id+", rolling the dice...");
            
              btn.blur();

          }
      
        
      
          return promiseDemoClick;
    }
    
    function sendToAllTest(storageSend){
          return sendToAll;
      
          function sendToAll(e){
            var 
              life = 10,
              universe = 20,
              everything = 12;
            
            shade([this_tab_full_id,this_tab_full_id+"_btn"],"orange",6000);
            
            var dests = 
                storageSend
                   .__senderIds
                     .filter(function(id){return id !== this_tab_full_id;})
                       .map(storageSend.__localizeId);

            storageSend.__call(
                dests,'tester',true,
              
                life,universe,everything,
              
              function(callInfo,meaning){

                      if (meaning===(life+universe+everything) ) {
                        var full = storageSend.__getFullId(callInfo.from);
                        shade([full,full+"_btn"],"lime",5000);
                        
                        console_log("got correct answer from:"+full+":"+meaning);
                        showGif(full+"_dont_panic");
                        
                      } else {
                          shade([full,full+"_btn"],"red",5000);
                        console_log("got incorrect answer from:"+full+":"+meaning);
                      }
                  }

              ).result( function (callInfo,answer) {
                      var full = storageSend.__getFullId(callInfo.from);
                      shade([full,full+"_btn"],"pink",1000);
              
                      console_log("the (immediate) result of a remote call to tab['"+full+"']."+callInfo.fn+"("+
                      callInfo.args.map(function(x){return typeof x==='function'?'&lt;fn&gt;':x;}).join(",")+
                      ") is "+answer);

                      console_log("expect a callback in about 5 seconds (the answer to the ultimate question)");


               });

        }
      
    }
    

    function displayMessage (msg,cb) {
        log.innerHTML += "local:"+JSON.stringify(msg,undefined,4)+"\n";
        setTimeout(cb,5000,{msg:"all done"});
        return {thanks:true};    
    }

    storageSend.on('change',updateUI);

    storageSend.on('message',displayMessage);

    document.getElementById("btnSendAll").addEventListener("click",sendToAllDemoClick);

    document.getElementById("btnClear").addEventListener("click",function(){
        localStorage.clear();
        localStorage.WS_Secret = storageSend.randomId(32); 
        location.reload();
    });


    function toggleClick (btn) {
       //var vars = storageSend.tabs[btn.dataset.tab_id].variables;
       var vars  = storageSend.tabs[btn.dataset.tab_id].variables;

       vars.toggle = !vars.toggle;
       btn.blur();
    }

    storageSend.variables.api.addTrigger(
      "toggle",
      function on_var_test_update(value,key,id,full_id) {
            var led = set_led(full_id,"toggle","led-red","led-yellow",value);
          //  set_led(id,"toggle_local","led-red","led-yellow",value,true);
        
            storageSend.tabs[full_id].__send_compact = value;
       
        var help = 'Toggles the sending mode for this tab. Mode is indicated by a red/yellow LED above. currently '+(value?"compact":"full" ) ;
        if (led) led.setAttribute('aria-label', help );
        var btn = document.getElementById(full_id+"_toggleModebtn");
        if (btn) btn.setAttribute('aria-label', help ); {
            if (full_id===this_tab_full_id ) {
               btn.classList.add(value?"shade_red":"shade_lime");
               btn.classList.remove(!value?"shade_red":"shade_lime");
            } 
        }
        

      }
    );

    storageSend.variables.api.addTrigger(
      "focused",
      function on_var_test_update(value,key,id,full_id) {
            set_led(full_id,"focused","led-blue","led-yellow",value);
      }
    );

    storageSend.variables.api.addTrigger(
      "sleeping",
      function on_var_test_update(value,key,id,full_id) {
          set_led(full_id,"sleeping","led-red","led-green",value);
      }
    );

    
    var icon_index = {
        generic : '<i class="fa fa-desktop" style="font-size:18px"></i>',
        laptop  : '<i class="fa fa-laptop" style="font-size:18px"></i>',
        mobile  : '<i class="fa fa-mobile" style="font-size:24px"></i>',
        tablet  : '<i class="fa fa-tablet" style="font-size:24px"></i>'
    };
          
    var icon_updater = function(icon_id,update_element,list){
         var device_type = list.contains("mobile") ? "mobile":
                           ( list.contains("desktop") && list.contains("screen_tablet_landscape") ?  "laptop" :  "generic");
         var html = device_type ? icon_index[device_type] : icon_index.generic;
         if (update_element===false) return html;
         document.getElementById(icon_id).innerHTML = html ;
    };


    function updateUI(){

        this_tab_local_id  = storageSend.id;
        this_tab_device_id = storageSend.WS_DeviceId;
        this_tab_full_id   = this_tab_device_id+"."+this_tab_local_id;

        var isSolo=true;
        var otherTabsExist=false;
        var sessionIds = storageSend.__senderIds.filter(
          
            function(id){
                //if (thisId===id) return false;
                otherTabsExist=true;
                if (!id.contains(".")) isSolo=false;
                return true;
            }
          
        ).map(function(local_id){
          
          return !local_id.contains(".") ? this_tab_device_id+"."+local_id :  local_id;
          
        });
      
      
        sessionIds.sort();
      
        var isWS = localStorage[ this_tab_local_id ] === "tabCallViaWS";
        local_id.innerHTML = this_tab_local_id;
        document.body.classList[ isWS   ? "add" : "remove"]("isWS");
        document.body.classList[ isSolo ? "add" : "remove"]("solo");

        var  toggle_class = storageSend.variables.toggle ? "led-red"  : "led-yellow";
        var btnEvents={};
    
        
        
      ws_device_id.innerHTML = this_tab_device_id;
    
      var header_data = {
        devices_title : (otherTabsExist ?  ""+sessionIds.length+" tabs in device group" : "No other tabs exist"),
        short_id      : this_tab_local_id,
        tab_id        : this_tab_full_id,
      }
      
      var collect_data = function(buttons,tab_id,index){
         
           var  
           tab = storageSend.tabs[tab_id],
           is_local = tab_id.startsWith(this_tab_device_id+"."),
           tabx_id  = is_local ? tab_id.split(".")[1] : tab_id,
           local_id = is_local ? tabx_id:tab_id,
           icon_id  = tab_id + ( is_local ? "_local_icon" : "_remote_icon"), 
           cls = tab_id===this_tab_full_id  ?  ' is_this_tab' : (is_local ?  ''  : ' is_remote'),
           
           is_ws = localStorage[ local_id ] === (is_local  ? "tabCallViaWS" : "tabRemoteCallViaWS"),

           db = {
               short_id          : tabx_id,
               tab_id            : tab_id,
               local_id          : local_id,
               ws_flag_class     : is_ws ? "is_ws" : "not_ws",
               extra_classes     : cls,
               local_remote_tab  : is_local                      ? "local tab" : "remote tab",
               header_row_class  : index===0?"device_table_first_header":"device_table_header",
               odd_even          : index % 2 === 0 ? "even" : "odd",
               device_table_styles: index===0? "" : "position:relative;top:-100px;",
               
            };
        
           if (buttons) {
             db[tab_id + '_sendOtherbtn']    = { click : simpleFunctionDemoClick   };
             db[tab_id + '_callOtherbtn']    = { click : callbackAndResultDemoClick };
             db[tab_id + '_promiseOtherbtn'] = { click : promiseDemoClick          };
             db[tab_id + '_toggleModebtn']   = { click : toggleClick               };
           } else {
             
             var
               peer_classList = tab.elements.$html.classList,
               tab_vars = tab.variables,
               device_icon = icon_updater(false,false,peer_classList);
               
               //peer_classList.addEventListener("change",true,icon_updater.bind(this,icon_id));

             
              db.local_icon   = is_local ? device_icon : "&nbsp;";
              db.remote_icon  = is_local ? '&nbsp;' : device_icon;
              db.focus_class  = tab_vars && tab_vars.focused  ? "led-blue"  : "led-yellow";
              db.sleep_class  = tab_vars && tab_vars.sleeping ? "led-red"   : "led-green";
              db.toggle_class = tab_vars && tab_vars.toggle   ? "led-red"   : "led-yellow";
              db[tab_id + '_toggle']         = { click : toggleClick               };
           }
           
             return db;
        
        
       }
            
      var footer_data = {};
      
      renderer(
         {
             send_others : [
               { send_others_info_header    : header_data },
               { send_others_info_table     : sessionIds.map(collect_data.bind(this,false))},
               { send_others_buttons_header : footer_data},
               { send_others_buttons_table :  sessionIds.map(collect_data.bind(this,true)) } ]
         }
       );
      
       

    }




    storageSend.pairingSetup( function() {
       updateUI();
       //storageSend.variables.focused=true;
       //storageSend.variables.sleeping=false;
    });



  document.body.classList.remove("boot");


}
  
}
