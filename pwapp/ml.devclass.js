/* global zip_url_base,zip_files, parent_link,BroadcastChannel*/


/* global ml,self,caches,BroadcastChannel, swResponseZipLib  */
ml(`

classToolsLib   | ml.classtools.js
timerManagerLib | ml.timerman.js 

`,function(){ml(2,

    {
        Window: function devClassLib( lib ) {
            lib = lib ||{};
            // add / override window specific methods here
            
            return lib;
        }
    }, {
        Window: [
            ()=> devClassLib
        ]

    }

    );


    function devClassLib () {
       
        
        // device_classes.js v2
        
        // imports from ml.classtools.js
       
       const {
                 
                 set_class_name_group_quick,
                 set_class_name_group_class_quick,
                 has_class_name,
                 remove_class_name,
                 add_class_name_quick,
                 add_class_names,
                 remove_class_names,
                 add_class_name
                 
             } = ml.i.classToolsLib; 
    
        const TimerManager = ml.i.timerManagerLib;
        
        
        var mouseover_autoclick = false,
          pointerover_autoclick = false;
        
        var class_names = {
          pointer_track: "pointer_track",
        
          // present as long as mouse or finger is "over" an element
          pointerover: {
            generic: "in_pointerover",
            mouse: "in_mouseover",
            finger: "in_fingerover"
          },
        
          // if this class is added to an element, whenever the pointer is over the the element
          // or any of it's children, x_toggle_on will be set, otherwise x_toggle_off will be set
          //
          pointerover_toggle_target: {
            generic: "in_pointerover_toggle_target",
            mouse: "in_mouseover_toggle_target"
          },
        
          // present as long as mouse or finger is "over" an element + a configurable lag time (allows for hystersys in ui design)
          pointerover_lag: {
            generic: "in_pointerover_lag",
            mouse: "in_mouseover_lag",
            finger: "in_fingerover_lag"
          },
        
          pointerover_lag_toggle_target: {
            generic: "in_pointerover_lag_toggle_target",
            mouse: "in_mouseover_lag_toggle_target"
          },
        
          // present whenever mouse or finger is depressed on an element
          pointerdown: {
            generic: "in_pointerdown",
            mouse: "in_mousedown",
            finger: "in_fingerpress"
          },
        
          pointerdown_long: {
            generic: "in_pointerdown_long",
            mouse: "in_mousedown_long",
            finger: "in_fingerpress_long"
          },
        
          // present while mouse or finger is moving over/inside an object.
          pointermove: {
            generic: "in_pointermove",
            mouse: "in_mousemove",
            finger: "in_fingermove"
          },
        
          // maps to mouse.click & finger.press
          toggle: {
            generic: {
              off: "pointer_toggle_off",
              on: "pointer_toggle_on",
              cascade: "pointer_toggle_cascade_off",
              switch: "pointer_toggle_switch"
            },
            mouse: {
              off: "click_toggle_off",
              on: "click_toggle_on",
              cascade: "click_toggle_cascade_off",
              switch: "click_toggle_switch"
            },
            finger: {
              off: "tap_toggle_off",
              on: "tap_toggle_on",
              cascade: "tap_toggle_cascade_off",
              switch: "finger_toggle_switch"
            }
          },
          // maps to mouse.doubleclick & finger.longpress
          toggle2: {
            generic: {
              off: "pointer_toggle2_off",
              on: "pointer_toggle2_on",
              cascade: "pointer_toggle2_cascade_off",
              switch: "pointer_toggle2_switch"
            },
            mouse: {
              off: "mousedown_long_toggle_off",
              on: "mousedown_long_toggle_on",
              cascade: "mousedown_long_toggle_cascade_off",
              switch: "mousedown_long_toggle_switch"
            },
            finger: {
              off: "fingerpress_long_toggle_off",
              on: "fingerpress_long_toggle_on",
              cascade: "fingerpress_long_toggle_cascade_off",
              switch: "fingerpress_toggle_switch"
            }
          },
          toggle3: {
            generic: {
              off: "pointer_toggle3_off",
              on: "pointer_toggle3_on",
              cascade: "pointer3_toggle_cascade_off",
              switch: "pointer_toggle3_switch"
            },
            mouse: {
              off: "doubleclick_toggle_off",
              on: "doubleclick_toggle_on",
              cascade: "doubleclick_toggle_cascade_off",
              switch: "doubleclick_toggle_switch"
            },
            finger: {
              off: "fingerswipe_toggle_off",
              on: "fingerswipe_toggle_on",
              cascade: "fingerswipe_toggle_cascade_off",
              switch: "fingerswipe_toggle_switch"
            }
          }
        };
        
        var pointer_timing = {
          pointer: {
            over_lag_msec: 800
          },
        
          mouse: {
            click_max_msec: 1500,
        
            // user need to tap mouse twice within 500 msec to register a doubleclick
            // (used to affect pointer_toggle2 and doubleclick_toggle)
            doubleclick_max_msec: 500,
        
            //move_min_msec: keep in_mousemove on elements
            //for 500 msec after the mouse stops moving
            move_min_msec: 500,
        
            //
            over_lag_msec: 300,
        
            longpress_min_msec: 1500
          },
        
          finger: {
            tap_min_msec: 10,
            longpress_min_msec: 1500,
            //move_min_msec: keep in_mousemove on elements
            //for 500 msec after finger stops moving
            move_min_msec: 100,
        
            // number of msec finger after touches screen before tap is initatated
            // (response will be quicker if user lifts earlier, this is just for ui updates )
            over_tap_delay: 50,
        
            // debounce msec when transitioning between simulated over and press gestures
            tap_entry_overlap: 250,
        
            over_lag_msec: 500
          }
        };
        
        var fs_api = (function() {
          var fs_api = makeFullScreenApi(document.body, function(api) {
            var persistent = false,
              trigger = false,
              api_enterFullscreen = api.enterFullscreen,
              api_exitFullscreen = api.exitFullscreen,
              trigger_func = function(ev) {
                if (trigger) {
                  api_enterFullscreen();
                }
              },
              bdy = document.body,
              add = function(x) {
                bdy.classList.add(x);
              },
              remove = function(x) {
                bdy.classList.remove(x);
              };
        
            api.on("enter", function() {
              trigger = false;
              add("fullscreen");
              remove("fullscreen_temp_off");
            });
        
            api.on("exit", function() {
              if (persistent) {
                trigger = true;
                add("fullscreen_temp_off");
              } else {
                trigger = false;
                if (persistent) {
                  document.removeEventListener("keydown", trigger_func);
                  document.removeEventListener("keyup", trigger_func);
                  document.removeEventListener("mousedown", trigger_func);
                  document.removeEventListener("mouseup", trigger_func);
                  document.removeEventListener("touchstart", trigger_func);
                }
                remove("fullscreen_temp_off");
                remove("fullscreen");
              }
            });
        
            api.enterFullscreen = function(persist) {
              persistent = !!persist;
              trigger = false;
              if (persistent) {
                document.addEventListener("keydown", trigger_func);
                document.addEventListener("keyup", trigger_func);
                document.addEventListener("mousedown", trigger_func);
                document.addEventListener("mouseup", trigger_func);
                document.addEventListener("touchstart", trigger_func);
              }
        
              api_enterFullscreen();
            };
        
            api.exitFullScreen = function() {
              persistent = false;
              trigger = false;
              remove("fullscreen_temp_off");
              remove("fullscreen");
              api_exitFullscreen();
            };
          });
          fs_api.newApi = makeFullScreenApi;
          return fs_api;
        
          function makeFullScreenApi(element, cb) {
            var notify = function(evs, isFs) {
                evs.forEach(function(fn) {
                  fn(element, isFs);
                });
              },
              fs_api = {
                isFullscreen: function() {
                  return false;
                },
                exitFullscreen: function() {
                  if (document.exitFullscreen) {
                    document.exitFullscreen();
                  } else if (document.mozCancelFullScreen) {
                    document.mozCancelFullScreen();
                  } else if (document.webkitCancelFullScreen) {
                    document.webkitCancelFullScreen();
                  } else if (document.msExitFullscreen) {
                    document.msExitFullscreen();
                  }
                },
                __events: {
                  enter: [],
                  exit: [],
                  toggle: []
                },
                on: function(e, f) {
                  var fns = fs_api.__events[e];
                  if (
                    typeof f === "function" &&
                    typeof fns === "object" &&
                    fns.constructor === Array &&
                    fns.indexOf(f) < 0
                  ) {
                    fns.push(f);
                  }
                }
              },
              setNotifiers = function(ev, flag) {
                (fs_api.isFullscreen = function() {
                  return !!document[flag];
                }),
                  document.addEventListener(
                    ev,
                    function() {
                      var isFs = fs_api.isFullscreen();
                      notify(isFs ? fs_api.__events.enter : fs_api.__events.exit, isFs);
                      notify(fs_api.__events.toggle, isFs);
                    },
                    false
                  );
              };
        
            if (element.requestFullscreen) {
              fs_api.enterFullscreen = function() {
                var attempts = 0,
                  fallback = 50;
                var tryit = function() {
                  element.requestFullscreen().catch(function(err) {
                    if (attempts++ < 3) {
                      fallback *= 2;
                      setTimeout(tryit, fallback);
                    }
                  });
                };
                tryit();
              };
              setNotifiers("fullscreenchange", "fullscreen");
            } else if (element.msRequestFullscreen) {
              fs_api.enterFullscreen = function() {
                return element.msRequestFullscreen();
              };
              setNotifiers("msfullscreenchange", "msFullscreenElement");
            } else if (element.mozRequestFullScreen) {
              fs_api.enterFullscreen = function() {
                return element.mozRequestFullScreen();
              };
              setNotifiers("mozfullscreenchange", "mozFullScreen");
            } else if (element.webkitRequestFullscreen) {
              fs_api.enterFullscreen = function() {
                return element.webkitRequestFullscreen();
              };
              setNotifiers("webkitfullscreenchange", "webkitIsFullScreen");
            } else {
              fs_api.enterFullscreen = console.log.bind(
                console,
                "Fullscreen API is not supported"
              );
              fs_api.exitFullscreen = fs_api.enterFullscreen;
            }
            if (typeof cb === "function") cb(fs_api);
            return fs_api;
          }
        })();
        
        var transitionEvent = (function whichTransitionEvent() {
          var t;
          var el = document.createElement("fakeelement");
          var transitions = {
            transition: "transitionend",
            OTransition: "oTransitionEnd",
            MozTransition: "transitionend",
            WebkitTransition: "webkitTransitionEnd"
          };
        
          for (t in transitions) {
            if (el.style[t] !== undefined) {
              return transitions[t];
            }
          }
        })();
        var ___pseudos = [
          ["::after", ":after"],
          ["::before", ":before"],
          [":after", ":after"],
          [":before", ":before"]
        ];
        
        function addPropertyTransitionListener(element, property, event) {
          if (
            typeof transitionEvent === "string" &&
            ["string", "object"].indexOf(typeof element) >= 0 &&
            typeof property === "string" &&
            typeof event === "function"
          ) {
            var pseudo;
        
            if (typeof element === "string") {
              element = element.trim();
              var ps,
                ps_l,
                i,
                l = ___pseudos.length;
        
              for (i = 0; i < l; i++) {
                ps = ___pseudos[i][0];
                ps_l = ps.length;
                if (element.substr(0 - ps_l) === ps) {
                  pseudo = ___pseudos[i][1];
                  element = element.substr(0, element.length - ps_l);
                  break;
                }
              }
        
              element = document.querySelector(element) || undefined;
            }
            if (typeof element === "object") {
              var handler = function(element, pseudo) {
                var h = function() {
                  var style = window.getComputedStyle(element, pseudo, property);
                  if (style) {
                    var value = style.getPropertyValue(property);
                    event(value, {
                      element: element,
                      property: property,
                      pseudo: pseudo,
                      handler: h
                    });
                    return true;
                  }
                };
        
                return h;
              };
        
              element.addEventListener(
                transitionEvent,
                handler(element, pseudo, property)
              );
            }
          }
        }
        
        function monitor_device_classes(el, cn, tm) {
          var media_query_info = [
              {
                name: "screen_unknown",
                color: "white",
                backgroundColor: "red"
              },
              {
                name: "screen_mobile_portrait",
                groups: ["screen_mobile", "screen_handheld", "screen_portrait"],
                color: "black",
                backgroundColor: "yellow"
              },
              {
                name: "screen_mobile_landscape",
                groups: ["screen_mobile", "screen_handheld", "screen_landscape"],
                color: "black",
                backgroundColor: "lime"
              },
              {
                name: "screen_tablet_portrait",
                groups: ["screen_handheld", "screen_large", "screen_portrait"],
                color: "black",
                backgroundColor: "orange"
              },
              {
                name: "screen_tablet_landscape",
                groups: ["screen_handheld", "screen_large", "screen_landscape"],
                color: "white",
                backgroundColor: "green"
              },
              {
                name: "screen_desktop_portrait",
                groups: ["screen_desktop", "screen_large", "screen_portrait"],
                backgroundColor: "yellow"
              },
              {
                name: "screen_desktop_landscape",
                groups: ["screen_desktop", "screen_large", "screen_landscape"],
                color: "black",
                backgroundColor: "pink"
              }
            ],
            media_query_class_group = [],
            media_query_class_group_classes = [];
        
          media_query_info.forEach(function(x) {
            media_query_class_group.push(x.name);
            if (x.groups) {
              x.groups.forEach(function(group) {
                if (media_query_class_group_classes.indexOf(group) < 0)
                  media_query_class_group_classes.push(group);
              });
            }
          });
        
          /* Listen for a transition! */
          var media_query_show = document.querySelector(".media_query_show"),
            media_query_detect = document.querySelector(".media_query_detect"),
            media_query_targets = [document.querySelector("html")],
            media_query_mode = media_query_detect.clientHeight,
            media_query_target_info = media_query_info[media_query_mode],
            media_query_notify_target = function(target) {
              switch (typeof target) {
                case "function":
                  return target(media_query_target_info);
                case "object":
                  if (target.className || target.classList) {
                    //console.log("setting target to:", media_query_target_info);
                    set_class_name_group_quick(
                      target,
                      media_query_target_info.name,
                      media_query_class_group
                    );
                    if (media_query_target_info.groups) {
                      set_class_name_group_class_quick(
                        target,
                        media_query_target_info.groups,
                        media_query_class_group_classes
                      );
                    }
                  }
              }
            },
            media_query_change_event = function() {
              media_query_mode = media_query_detect.clientHeight;
              media_query_target_info = media_query_info[media_query_mode];
              media_query_targets.forEach(media_query_notify_target);
              if (media_query_show) {
                media_query_show.innerHTML = media_query_target_info.name;
                media_query_show.style.backgroundColor =
                  media_query_target_info.backgroundColor;
                media_query_show.style.color = media_query_target_info.color;
              }
            };
        
          media_query_change_event();
        
          if (transitionEvent) {
            media_query_detect.addEventListener(
              transitionEvent,
              media_query_change_event
            );
          }
        
          function get_classname_target(el) {
            if (has_class_name(el, "ptr_sendto_parent")) {
              var t = el;
              while ((t = t.parentElement) !== document.body) {
                if (has_class_name(t, "ptr_target_from_child")) {
                  return t;
                }
              }
            } else {
              if (el.tagName === "A")
                if (el.parentElement.tagName === "LI") return el.parentElement;
            }
        
            return el;
          }
        
          function add_media_query_watcher(target) {
            var el =
              typeof target === "string" ? document.querySelector(target) : target;
            if (el) {
              media_query_targets.push(el);
              media_query_notify_target(el);
            }
          }
        
          function remove_media_query_watcher(target) {
            var ix = media_query_targets.indexOf(target);
            if (ix >= 0) {
              media_query_targets.splice(ix, 1);
            }
          }
        
          window.add_media_query_watcher = add_media_query_watcher;
          window.remove_media_query_watcher = remove_media_query_watcher;
        
          var /*destructure classnames for simplified access at runtime*/
        
            pointer_track = cn.pointer_track,
            in_pointerover = cn.pointerover.generic,
            in_mouseover = cn.pointerover.mouse,
            in_fingerover = cn.pointerover.finger,
            in_pointerover_toggle_target = cn.pointerover_toggle_target.generic,
            in_mouseover_toggle_target = cn.pointerover_toggle_target.mouse,
            in_pointerover_lag_toggle_target = cn.pointerover_lag_toggle_target.generic,
            in_mouseover_lag_toggle_target = cn.pointerover_lag_toggle_target.mouse,
            in_pointerover_lag = cn.pointerover_lag.generic,
            in_mouseover_lag = cn.pointerover_lag.mouse,
            in_fingerover_lag = cn.pointerover_lag.finger,
            in_pointerdown = cn.pointerdown.generic,
            in_mousedown = cn.pointerdown.mouse,
            in_fingerpress = cn.pointerdown.finger,
            in_pointerdown_long = cn.pointerdown_long.generic,
            in_mousedown_long = cn.pointerdown_long.mouse,
            in_fingerpress_long = cn.pointerdown_long.finger,
            in_pointermove = cn.pointermove.generic,
            in_mousemove = cn.pointermove.mouse,
            in_fingermove = cn.pointermove.finger,
            pointer_toggle = cn.toggle.generic,
            click_toggle = cn.toggle.mouse,
            tap_toggle = cn.toggle.finger,
            pointer_toggle2 = cn.toggle2.generic,
            mousedown_long_toggle = cn.toggle2.mouse,
            fingerpress_long_toggle = cn.toggle2.finger,
            pointer_toggle3 = cn.toggle3.generic,
            doubleclick_toggle = cn.toggle3.mouse,
            swipe_toggle = cn.toggle3.finger,
            pointerover_lag_msec = tm.pointer.over_lag_msec,
            mouseover_lag_msec = tm.mouse.over_lag_msec,
            fingerover_lag_msec = tm.finger.over_lag_msec,
            click_max_msec = tm.mouse.click_max_msec,
            doubleclick_threshold = tm.mouse.doubleclick_max_msec,
            mouse_move_min_msec = tm.finger.move_min_msec,
            finger_move_min_msec = pointer_timing.finger.move_min_msec,
            tap_max_msec = tm.finger.tap_min_msec,
            tap_threshold = tm.finger.longpress_min_msec - tap_max_msec,
            in_contextmenu = "in_contextmenu",
            contextmenu_toggle_on = "contextmenu_toggle_on",
            contextmenu_toggle_off = "contextmenu_toggle_off",
            contextmenu_start = "contextmenu_start",
            finger_press_timer,
            tap_at,
            finger_over_timer,
            mouse_press_timer,
            doubleclick_timer,
            click_counter,
            click_at,
            doubleclick_at,
            pointerovertarget_top = document.querySelector("html"),
            move_timer,
            kill_press_timers = function() {
              if (finger_press_timer) {
                clearTimeout(finger_press_timer);
                finger_press_timer = undefined;
              }
              if (finger_over_timer) {
                clearTimeout(finger_over_timer);
                finger_over_timer = undefined;
              }
              if (mouse_press_timer) {
                clearTimeout(mouse_press_timer);
                mouse_press_timer = undefined;
              }
              if (move_timer) {
                clearTimeout(move_timer);
                move_timer = undefined;
              }
            },
            kill_click_timers = function() {
              if (doubleclick_timer) {
                clearTimeout(doubleclick_timer);
                doubleclick_timer = click_counter = click_at = doubleclick_at = undefined;
              }
            };
        
          el.style.pointerEvents = "auto";
          var on = function(x, f) {
              el.addEventListener(x, function(e) {
                if (e.target.className.indexOf(pointer_track) >= 0) {
                  return f(e);
                }
              });
            },
            dbg_announce = function(x, e) {
              console.log(
                "in " +
                  x +
                  ":" +
                  e.pointerType +
                  "," +
                  e.target.tagName +
                  "," +
                  (e.target.hidden ? "hidden" : "showing")
              );
            },
            dbg_announce_delayed = function(x, e) {
              //dbg_announce(x,e);
            },
            debug = function(x, f) {
              el.addEventListener(x, function(e) {
                if (e.target.className.indexOf(pointer_track) >= 0) {
                  dbg_announce(x, e);
                  return f(e);
                }
              });
            },
            on_ = function(x, f) {
              el.addEventListener(x, function(e) {
                if (e.target.className.indexOf(pointer_track) >= 0) {
                  if (f(e) === false) {
                    e.preventDefault();
                    return false;
                  }
                }
              });
            },
            debug_ = function(x, f) {
              el.addEventListener(x, function(e) {
                if (e.target.className.indexOf(pointer_track) >= 0) {
                  dbg_announce(x, e);
                  if (f(e) === false) {
                    dbg_announce("preventing default for " + x, e);
                    e.preventDefault();
                    return false;
                  }
                }
              });
            },
            toggle_set_on = function(el, xon, xoff, xcascade) {
              if (has_class_name(el, xoff)) {
                remove_class_name(el, xoff);
                add_class_name_quick(el, xon);
                return true;
              } else {
                return false;
              }
            },
            toggle_set_off = function(el, xon, xoff, xcascade) {
              var result = false;
              if (has_class_name(el, xon)) {
                result = true;
                remove_class_name(el, xon);
                add_class_name_quick(el, xoff);
        
                if (has_class_name(el, xcascade)) {
                  var offski = el.querySelectorAll("." + xon),
                    el_c,
                    i,
                    l = offski.length;
        
                  for (i = 0; i < l; i++) {
                    el_c = offski[i];
        
                    remove_class_name(el_c, xon);
                    add_class_name_quick(el_c, xoff);
                  }
                }
              }
              return result;
            },
            toggle_switch = function(el, xswitch, force) {
              // /debugger;
            },
            toggle_switched_on = function(el, p, xon, xoff, xcascade, xswitch) {
              var result = toggle_set_on(el, xon, xoff, xcascade);
              if (result === true) {
                var switch_on = xswitch + "_on",
                  switch_off = xswitch + "_off",
                  c,
                  i,
                  l;
        
                remove_class_name(p, switch_off);
                add_class_name_quick(p, switch_on);
        
                // turn off any other siblings that are turned on.
                l = p.children.length;
                for (i = 0; i < l; i++) {
                  c = p.children[i];
        
                  if (c && has_class_name(c, xon) && c !== el) {
                    remove_class_name(c, xon);
                    add_class_name_quick(c, xoff);
                  }
                }
              }
        
              return result;
            },
            toggle_switched_off = function(el, p, xon, xoff, xcascade, xswitch) {
              var result = toggle_set_off(el, xon, xoff, xcascade);
        
              if (result === true) {
                var switch_on = xswitch + "_on",
                  switch_off = xswitch + "_off",
                  c,
                  i,
                  l,
                  count = 0;
        
                // iterate p.children as c
                if (has_class_name(el, xcascade) === true) {
                  // when cascading off for a switch, we need to also cascade the off for any
                  // child  switch parents
                  var offski = el.querySelectorAll("." + switch_on),
                    el_c;
                  l = offski.length;
        
                  for (i = 0; i < l; i++) {
                    el_c = offski[i];
                    remove_class_name(el_c, switch_on);
                    add_class_name_quick(el_c, switch_off);
                  }
                } else {
                  
                  // see if aby siblings are turned on.
                  l = p.children.length;
                  for (i = 0; i < l; i++) {
                    c = p.children[i];
        
                    if (c && has_class_name(c, xon)) {
                      count++;
                    }
                  }
                }
        
                if (count === 0) {
                  remove_class_name(p, switch_on);
                  add_class_name_quick(p, switch_off);
                } else {
                  remove_class_name(p, switch_off);
                  add_class_name_quick(p, switch_on);
                }
              }
              return result;
            },
            toggle_switched = function(el, p, xon, xoff, xcascade, xswitch, force) {
              switch (force) {
                case "on":
                  return toggle_switched_on(el, p, xon, xoff, xcascade, xswitch);
                case "off":
                  return toggle_switched_off(el, p, xon, xoff, xcascade, xswitch);
                default:
                  if (
                    toggle_switched_on(el, p, xon, xoff, xcascade, xswitch) === false
                  ) {
                    toggle_switched_off(el, p, xon, xoff, xcascade, xswitch);
                  }
              }
            },
            toggle_switched_legacy = function(el, p, xon, xoff, xcascade, xswitch) {
              var switch_on = xswitch + "_on",
                switch_off = xswitch + "_off",
                c,
                i,
                l;
              if (toggle_set_off(el, xon, xoff, xcascade) === true) {
                var count = 0;
                // iterate p.children as c
                if (has_class_name(el, xcascade) === true) {
                  // when cascading off for a switch, we need to also cascade the off for any
                  // child  switch parents
                  var offski = el.querySelectorAll("." + switch_on),
                    el_c;
                  l = offski.length;
        
                  for (i = 0; i < l; i++) {
                    el_c = offski[i];
                    remove_class_name(el_c, switch_on);
                    add_class_name_quick(el_c, switch_off);
                  }
                } else {
                  // see if aby siblings are turned on.
                  l = p.children.length;
                  for (i = 0; i < l; i++) {
                    c = p.children[i];
        
                    if (c && has_class_name(c, xon)) {
                      count++;
                    }
                  }
                }
        
                if (count === 0) {
                  remove_class_name(p, switch_on);
                  add_class_name_quick(p, switch_off);
                } else {
                  remove_class_name(p, switch_off);
                  add_class_name_quick(p, switch_on);
                }
              } else {
                if (toggle_set_on(el, xon, xoff, xcascade) === true) {
                  remove_class_name(p, switch_off);
                  add_class_name_quick(p, switch_on);
        
                  // turn off any other siblings that are turned on.
                  l = p.children.length;
                  for (i = 0; i < l; i++) {
                    c = p.children[i];
        
                    if (c && has_class_name(c, xon) && c !== el) {
                      remove_class_name(c, xon);
                      add_class_name_quick(c, xoff);
                    }
                  }
                }
              }
            },
            toggle_normal = function(el, xon, xoff, xcascade, force) {
              switch (force) {
                case "on":
                  return toggle_set_on(el, xon, xoff, xcascade);
                case "off":
                  return toggle_set_off(el, xon, xoff, xcascade);
                default:
                  if (toggle_set_off(el, xon, xoff, xcascade) === false) {
                    toggle_set_on(el, xon, xoff, xcascade);
                  }
              }
            },
            togglex = function(el, xon, xoff, xcascade, xswitch, force) {
              var p = el.parentElement;
              if (p && has_class_name(p, xswitch)) {
                return toggle_switched(el, p, xon, xoff, xcascade, xswitch, force);
              } else {
                if (xswitch && has_class_name(el, xswitch)) {
                  return toggle_switch(el, xswitch, force);
                } else {
                  return toggle_normal(el, xon, xoff, xcascade, force);
                }
              }
            },
            toggle = function(el, x, suffix, force) {
              if (!suffix) suffix = "";
              return togglex(
                el,
                x.on + suffix,
                x.off + suffix,
                x.cascade + suffix,
                x.switch + suffix,
                force
              );
            },
            obj_timers = new TimerManager();
        
          var tap_entry_overlap = pointer_timing.finger.tap_entry_overlap,
            over_tap_delay = pointer_timing.finger.over_tap_delay,
            longpress_min_msec = pointer_timing.finger.longpress_min_msec,
            longclick_min_msec = pointer_timing.mouse.longpress_min_msec;
        
          var do_pointerdown = {
            mouse: function(detailedEvent, el, tgt) {
              add_class_names(el, [in_mousedown, in_pointerdown]);
              click_at = 0 + new Date().getTime();
        
              mouse_press_timer = setTimeout(function() {
                mouse_press_timer = undefined;
                add_class_names(el, [in_mousedown_long, in_pointerdown_long]);
                toggle(el, mousedown_long_toggle);
                toggle(el, pointer_toggle2);
              }, longclick_min_msec);
            },
            touch: function(detailedEvent, el, tgt) {
              add_class_names(el, [
                in_fingerover,
                in_pointerover,
                in_fingerover_lag,
                in_pointerover_lag
              ]);
        
              tap_at = 0 + new Date().getTime();
        
              finger_press_timer = setTimeout(function() {
                finger_press_timer = undefined;
                add_class_names(el, [in_fingerpress_long, in_pointerdown_long]);
                toggle(el, fingerpress_long_toggle);
                toggle(el, pointer_toggle2);
                if (el.fo_tap_timer && el.fo_tap_timer._tap_info) {
                  do_click(el, "abort", el.fo_tap_timer._tap_info);
                }
              }, longpress_min_msec);
        
              finger_over_timer = setTimeout(function() {
                finger_over_timer = undefined;
        
                add_class_names(el, [in_fingerpress, in_pointerdown]);
        
                obj_timers.resetTimer(
                  el,
                  "fo_tap_timer",
                  tap_entry_overlap,
                  function() {
                    remove_class_names(el, [in_fingerover, in_pointerover]);
        
                    obj_timers.resetTimer(
                      el,
                      "fo_timer",
                      fingerover_lag_msec,
                      function() {
                        if (has_class_name(el, in_fingerover) === false)
                          remove_class_name(el, in_fingerover_lag);
                      }
                    );
        
                    obj_timers.resetTimer(
                      el,
                      "ptrout_timer",
                      pointerover_lag_msec,
                      function() {
                        if (has_class_name(el, in_pointerover) === false)
                          remove_class_name(el, in_pointerover_lag);
                      }
                    );
                  }
                );
                var tap_info = do_click(el, "early", "finger");
                if (el.fo_tap_timer) {
                  el.fo_tap_timer._tap_info = tap_info;
                }
              }, over_tap_delay);
            },
            event: function(detailedEvent) {
              var tgt = detailedEvent.target,
                el = get_classname_target(tgt);
              kill_press_timers();
              return do_pointerdown[detailedEvent.pointerType](detailedEvent, el, tgt);
            }
          };
          on_("pointerdown", do_pointerdown.event);
        
          var pointer_downflags = [
            in_pointerdown,
            in_mousedown,
            in_mousedown_long,
            in_pointerdown_long,
            in_fingerpress,
            in_fingerpress_long,
        
            in_contextmenu
          ];
        
          var do_doubleclick = function(el, info) {
            var ud,
              retval,
              h = el.id ? find_event_handler(el) : ud,
              ev = h ? h.events : ud,
              ev_x = ev ? ev[el.id] : ud,
              clckrs = ev_x ? ev_x.click : ud,
              clckr = clckrs ? clckrs.double : ud;
            if (clckr) clckr.call(el, info);
          };
        
          /*
          
           on click of toggle_target:
             
             toggle_target_status should be defined (because you need to mouseover to get to click)
             if it is undefined, use same logic as mouseover event to define it.
             
             if toggle_target_status is off:
                set toggle to on, and toggle_target_status to undefined 
                
             if toggle_target_status is on:
                set toggle to off, and toggle_target_status to undefined 
          
          
          
          */
        
          var cleanup_toggle_parent = function(
            el,
            toggle_key,
            toggle_classes,
            undefine_x
          ) {
            var p = el;
            while (p !== pointerovertarget_top) {
              if (undefine_x && p[undefine_x]) p[undefine_x] = undefined;
              if (has_class_name(p, toggle_key)) {
                toggle(p, toggle_classes, undefined, "off");
                return p;
              }
              remove_class_names(p, [in_pointerdown, in_mousedown, in_fingerpress]);
              p = p.parentElement;
            }
          };
        
          var check_toggle_over_click = function(el, toggle_key, x, cleanup) {
            var parent_key = "__" + toggle_key,
              status_key = "__" + toggle_key + "_status",
              // for lagged events flip the state, otherwise force on.
              flip_on = "on",
              flip_off = "off";
        
            if (has_class_name(el, toggle_key)) {
              var status_value = el[status_key];
              if (status_value === undefined) {
                set_toggle_over_status(el, el, status_key, x);
              }
        
              switch (status_value) {
                case "on": {
                  toggle(el, x, undefined, flip_on);
                  el[status_key] = undefined;
                  break;
                }
                case "off": {
                  toggle(el, x, undefined, flip_off);
                  el[status_key] = undefined;
                  break;
                }
        
                default:
              }
            } else {
              if (el[parent_key]) {
                if (cleanup) {
                  cleanup_toggle_parent(el, toggle_key, x, status_key);
                }
              } else {
                console.log("click on non", toggle_key, "node", el.tagName);
              }
            }
          };
        
          function find_event_handler(el) {
            var p = el;
            while (p._events === undefined) {
              p = p.parentElement;
              if (p === pointerovertarget_top) break;
              if (p._events !== undefined) {
                Object.defineProperty(el, "_events", {
                  enumerable: false,
                  configurable: true,
                  value: p._events
                });
              } else {
              }
            }
            return el._events;
          }
        
          var do_click = function(el, mode, info) {
            var ud,
              h = el.id ? find_event_handler(el) : ud,
              ev = h ? h.events : ud,
              ev_x = ev ? ev[el.id] : ud,
              clckrs = ev_x ? ev_x.click : ud,
              clckr = clckrs ? clckrs[mode] : ud;
        
            switch (mode) {
              case "early": {
                // triggered the instant the click occurs (on pointerup)
                // info will be undefined
        
                if (info === "mouse") {
                  obj_timers.cancelTimers();
        
                  if (pointerover_autoclick) {
                    check_toggle_over_click(
                      el,
                      in_pointerover_toggle_target,
                      pointer_toggle,
                      clckr !== undefined
                    );
                    check_toggle_over_click(
                      el,
                      in_pointerover_lag_toggle_target,
                      pointer_toggle,
                      false
                    );
                  } else {
                    if (clckr) {
                      cleanup_toggle_parent(
                        el,
                        in_pointerover_toggle_target,
                        pointer_toggle,
                        "__" + in_pointerover_toggle_target + "_status"
                      );
                    }
                  }
        
                  if (mouseover_autoclick) {
                    check_toggle_over_click(
                      el,
                      in_mouseover_toggle_target,
                      click_toggle,
                      clckr !== undefined
                    );
                    check_toggle_over_click(
                      el,
                      in_mouseover_lag_toggle_target,
                      click_toggle,
                      false
                    );
                  }
                }
        
                if (info === "finger") {
                  obj_timers.cancelTimers();
        
                  if (clckr !== undefined) {
                    cleanup_toggle_parent(
                      el,
                      in_pointerover_toggle_target,
                      pointer_toggle,
                      undefined
                    );
                  }
                }
        
                if (clckr) return clckr.call(el, info);
                return null;
              }
        
              case "final": {
                // triggered after smoothing (once we are sure it's not the first of a double click)
                // (info will contain any value that was returned from early)
                if (clckr) clckr.call(el, info);
        
                break;
              }
              case "abort": {
                // tiggered if a doubleclick occured and should void/undo the early click.
                // (info will contain any value that was returned from early)
                if (clckr) clckr.call(el, info);
                break;
              }
            }
          };
        
          var do_pointerup = {
            mouse: function(detailedEvent, el, now) {
              if (click_at) {
                // click at should have been set when the mouse went down
                var click_info,
                  click_time = now - click_at;
                if (click_time < click_max_msec) {
                  // mouse went down and up within 1000 msec - qualifes as a "click"
                  click_counter = click_counter ? click_counter + 1 : 1;
        
                  switch (click_counter) {
                    case 1: {
                      // only had 1 click - start a timer to end at 500 msec past the initial mouse down
                      doubleclick_at = click_at;
                      kill_click_timers();
        
                      // toggle the real time click states
                      toggle(el, click_toggle);
                      toggle(el, pointer_toggle);
        
                      doubleclick_timer = setTimeout(function() {
                        click_info = doubleclick_timer._click_info;
                        doubleclick_timer = click_counter = click_at = doubleclick_at = undefined;
        
                        // toggle the smoothed click states
                        toggle(el, click_toggle, "_smoothed");
                        toggle(el, pointer_toggle, "_smoothed");
                        do_click(el, "final", click_info);
        
                        // process any pending context menu
                        if (has_class_name(el, contextmenu_start)) {
                          if (has_class_name(el, contextmenu_toggle_off)) {
                            add_class_name_quick(el, contextmenu_toggle_on);
                            remove_class_names(el, [contextmenu_toggle_off]);
                          } else {
                            remove_class_names(el, [
                              contextmenu_toggle_on,
                              contextmenu_start
                            ]);
                            add_class_name_quick(el, contextmenu_toggle_off);
                          }
                        }
                      }, doubleclick_threshold - click_time); //500-click_time
        
                      click_info = do_click(el, "early", "mouse");
                      if (click_info === null) return;
                      else doubleclick_timer._click_info = click_info;
                      return false;
                    }
                    case 2: {
                      if (doubleclick_timer) {
                        // had 2 clicks since we last reset. if timer is still around, it's because
                        // we are within the expiry time, and nothing else has trashed it - looking good for double click
                        click_info = doubleclick_timer._click_info;
                        console.log("got double click");
        
                        var doubleclick_time = now - doubleclick_at;
                        if (doubleclick_time < doubleclick_threshold) {
                          // yep - within threshold - stop the click being registered.
                          console.log("accepting valid double click");
                          kill_click_timers();
        
                          // toggle any doubleclick status.
                          toggle(el, doubleclick_toggle);
                          toggle(el, pointer_toggle3);
                          do_doubleclick(el, click_info);
        
                          // and reverse the click_toggle we just f-cked up in the initial click of this double click
                          toggle(el, click_toggle);
                          toggle(el, pointer_toggle);
        
                          do_click(el, "abort", click_info);
                        } else {
                          // it's been too long - just let the timer fire and do a standard click, ignoring the second one.
                          console.log("discarding stale double click");
                        }
                        return false;
                      }
                      break;
                    }
                    default: {
                    }
                  }
                }
              }
              // no previous clicks, or mouse was down longer than 100 msec - reset click/doubleclick status
              kill_click_timers();
            },
        
            touch: function(detailedEvent, el, now, tap_fired) {
              if (finger_over_timer) {
                clearTimeout(finger_over_timer);
                finger_over_timer = undefined;
              }
        
              remove_class_names(el, [in_pointerover, in_fingerover]);
        
              if (tap_at) {
                var tap_time = now - tap_at;
                if (tap_time < tap_threshold) {
                  if (tap_time > tap_max_msec) {
                    toggle(el, tap_toggle);
                    toggle(el, pointer_toggle);
        
                    if (tap_fired) {
                      do_click(el, "final", el.fo_tap_timer._tap_info);
                    } else {
                      var tap_info = do_click(el, "early", "finger");
                      do_click(el, "final", tap_info === null ? undefined : tap_info);
                      if (tap_info === null) return;
                    }
        
                    return false;
                  } else {
                    kill_press_timers();
                  }
                }
              }
            },
        
            event: function(detailedEvent) {
              var now = 0 + new Date().getTime(),
                el = get_classname_target(detailedEvent.target),
                tap_fired = finger_over_timer
                  ? false
                  : el.fo_tap_timer
                  ? el.fo_tap_timer._tap_info
                    ? true
                    : false
                  : false;
        
              kill_press_timers();
              remove_class_names(el, pointer_downflags);
              return do_pointerup[detailedEvent.pointerType](
                detailedEvent,
                el,
                now,
                tap_fired
              );
            }
          };
        
          debug_("pointerup", do_pointerup.event);
        
          // returns true if el or any of el's children(recursive) has over_class
          var get_x_over = function(el, over_class) {
            var res = false,
              r = function(el) {
                if (el.parentElement.querySelector(":hover") === el) {
                  res = true;
                  return;
                }
        
                if (el.children) {
                  var i,
                    l = el.children.length;
                  for (i = 0; i < l; i++) {
                    r(el.children[i]);
                    if (res) {
                      break;
                    }
                  }
                }
              };
            r(el);
            return res;
          };
        
          // looks for toggle_key in el's pedigree, caching the located ancestor in a non-enumerable property in el
          // returns undefined if toggle_key is not found, otherwise returns the target
          var locate_pointerover_target = function(el, toggle_key) {
            var parent_key = "__" + toggle_key,
              status_key = "__" + toggle_key + "_status",
              p = el[parent_key];
            //see if we have previously scanned for a target in the pedigree.
            if (p === null) return undefined; // previously determined this el does not point to an ancestor target
            if (p === undefined) {
              // first time over this el
              // look at the el's pedegiree up as far as document.body,
              // scanning for an appropriate classname (toggle_key)
              p = el;
              while (p !== undefined) {
                if (has_class_name(p, toggle_key)) {
                  // found this el's parent target.
                  // we don't need to do this again - save in parent_key
                  Object.defineProperty(el, parent_key, {
                    enumerable: false,
                    configurable: true,
                    value: p
                  });
                  return p;
                }
        
                p = p.parentElement;
        
                if (p === pointerovertarget_top) {
                  // determined this el is an orphan
                  // we don't need to do this again - set parent_key to null to stop rescanning
                  Object.defineProperty(el, parent_key, {
                    enumerable: false,
                    configurable: true,
                    value: null
                  });
                  return undefined;
                }
              }
            }
            return p;
          };
        
          // assuming p[status_key] is undefined, set_toggle_over_status will
          // ensure p has xon class, and removes xoff class
          // aso sets p[status_key] to either "on" or "off" depending on xon/xoff status
          var set_toggle_over_status = function(el, p, status_key, x) {
            var result,
              is_new,
              lagged = status_key.indexOf("_lag_") > 0; // we always toggle lagged hovers.
            if (
              p &&
              status_key &&
              x &&
              (is_new = p[status_key] === undefined || lagged)
            ) {
              if (has_class_name(p, x.on)) {
                if (is_new) p[status_key] = result = "on";
                if (lagged && el === p && p.children && p.children.length > 1)
                  toggle(p, x, "");
              } else {
                if (has_class_name(p, x.off)) {
                  if (is_new) p[status_key] = result = "off";
                  if (is_new || lagged)
                    toggle(lagged ? el : p, x, "", lagged ? undefined : "on");
                }
              }
            }
            return result;
          };
        
          /*
            on mouseover of toggle_target and children:
          
              if toggle_target_status is undefined:
                if toggle_on,  set toggle_target_status to on
                otherwise if toggle_off, set toggle_target_status to off
              set toggle_on, clear toggle_off
        
          */
        
          var pointerover_toggle_check = function(el, toggle_key, x) {
              var p = locate_pointerover_target(el, toggle_key);
              if (p !== undefined) {
                var status_key = "__" + toggle_key + "_status";
                set_toggle_over_status(el, p, status_key, x);
              }
            },
            pointerover_hystereis_begin = function(tgt, el, ev) {
              obj_timers.resetTimer(
                el,
                "ptrover_timer",
                pointerover_lag_msec,
                function() {
                  dbg_announce_delayed("pointerover(lag)", ev);
                  if (has_class_name(el, in_pointerover)) {
                    add_class_name(el, in_pointerover_lag);
                    if (pointerover_autoclick) {
                      pointerover_toggle_check(
                        tgt,
                        in_pointerover_lag_toggle_target,
                        pointer_toggle
                      );
                    }
                  }
                }
              );
              obj_timers.resetTimer(el, "msover_timer", mouseover_lag_msec, function() {
                dbg_announce_delayed("mouseover(lag)", ev);
                if (has_class_name(el, in_mouseover)) {
                  add_class_name(el, in_mouseover_lag);
                  if (mouseover_autoclick) {
                    pointerover_toggle_check(
                      tgt,
                      in_mouseover_lag_toggle_target,
                      click_toggle
                    );
                  }
                }
              });
            };
        
          var do_pointerover = {
            mouse: function(detailedEvent, el, tgt) {
              obj_timers.cancelTimer(el, "ptrover_timer");
              obj_timers.cancelTimer(el, "msover_timer");
              add_class_names(el, [in_pointerover, in_mouseover]);
        
              if (pointerover_autoclick) {
                pointerover_toggle_check(
                  tgt,
                  in_pointerover_toggle_target,
                  pointer_toggle
                );
              }
              if (mouseover_autoclick) {
                pointerover_toggle_check(tgt, in_mouseover_toggle_target, click_toggle);
              }
              pointerover_hystereis_begin(tgt, el, detailedEvent);
            },
            touch: function(detailedEvent, el, tgt) {},
            event: function(detailedEvent) {
              var tgt = detailedEvent.target,
                el = get_classname_target(tgt);
              return do_pointerover[detailedEvent.pointerType](detailedEvent, el, tgt);
            }
          };
          on_("pointerover", do_pointerover.event);
        
          var /*
                on mouseout (lag) of toggle_target and children, 
             
             if toggle_target_status is not undefined:
                see if any target and any chidren have mouseover status
                    if not, restore toggle_on / toggle_off based on toggle_target_on/off
             
             set toggle_target_status to undefined
             */
        
            pointerout_check_toggle_over = function(el, toggle_key, over_class, x) {
              var p = locate_pointerover_target(el, toggle_key);
              if (p !== undefined) {
                var status_key = "__" + toggle_key + "_status",
                  status_value = p[status_key];
        
                if (status_value !== undefined) {
                  if (get_x_over(p, over_class) === false) {
                    switch (status_value) {
                      case "off":
                      case "on": {
                        toggle(p, x, "", status_value);
                        break;
                      }
                    }
                    p[status_key] = undefined;
                  }
                }
              }
            };
        
          var pointerout_hysteresis_end = function(tgt, el, ev) {
            obj_timers.resetTimer(el, "ptrout_timer", pointerover_lag_msec, function() {
              dbg_announce_delayed("pointerout(lag)", ev);
              if (has_class_name(el, in_pointerover) === false) {
                remove_class_name(el, in_pointerover_lag);
                if (pointerover_autoclick) {
                  pointerout_check_toggle_over(
                    el,
                    in_pointerover_toggle_target,
                    in_pointerover,
                    pointer_toggle
                  );
                }
              }
            });
            obj_timers.resetTimer(el, "msout_timer", mouseover_lag_msec, function() {
              dbg_announce_delayed("mouseout(lag)", ev);
              if (has_class_name(el, in_mouseover) === false) {
                remove_class_name(el, in_mouseover_lag);
                if (mouseover_autoclick) {
                  pointerout_check_toggle_over(
                    el,
                    in_mouseover_toggle_target,
                    in_mouseover,
                    click_toggle
                  );
                }
              }
            });
          };
        
          var do_pointerout = {
            mouse: function(detailedEvent, el, tgt) {
              obj_timers.cancelTimer(el, "ptrout_timer");
              obj_timers.cancelTimer(el, "msout_timer");
              remove_class_names(el, [in_mouseover, in_mousemove]);
              pointerout_hysteresis_end(tgt, el, detailedEvent);
            },
            touch: function(detailedEvent, el, tgt) {
              console.log("in pointer/finger out");
        
              remove_class_names(el, [
                in_fingermove,
                in_pointerover,
                in_pointerdown,
                in_fingerpress,
                in_pointerdown_long,
                in_fingerpress_long
              ]);
        
              if (has_class_name(el, in_pointerover_toggle_target)) {
                remove_class_name(el, click_toggle.off);
              }
            },
            event: function(detailedEvent) {
              var tgt = detailedEvent.target,
                el = get_classname_target(tgt);
        
              kill_press_timers();
              kill_click_timers();
        
              remove_class_names(el, [in_pointerover, in_pointermove]);
              return do_pointerout[detailedEvent.pointerType](detailedEvent, el, tgt);
            }
          };
          on_("pointerout", do_pointerout.event);
        
          var do_x = {
            mouse: function(detailedEvent, el, tgt) {},
            touch: function(detailedEvent, el, tgt) {},
            event: function(detailedEvent) {
              var tgt = detailedEvent.target,
                el = get_classname_target(tgt);
        
              return do_x[detailedEvent.pointerType](detailedEvent, el, tgt);
            }
          };
          on_("x", do_x.event);
        
          var do_device_move = function(el, move_modes, lag) {
            // nb: function wraper is needed here to ensure move_modes is captured by timer func.
            (function(move_modes, lag) {
              if (move_timer) {
                clearTimeout(move_timer);
                move_timer = undefined;
              }
              add_class_names(el, move_modes);
        
              move_timer = setTimeout(function() {
                move_timer = undefined;
                remove_class_names(el, move_modes);
              }, lag);
            })(move_modes, 0 + lag);
          };
        
          var do_pointermove = {
            mouse: function(detailedEvent, el, tgt) {
              return do_device_move(
                el,
                [in_mousemove, in_pointermove],
                mouse_move_min_msec
              );
            },
            touch: function(detailedEvent, el, tgt) {
              return do_device_move(
                el,
                [in_fingermove, in_pointermove],
                finger_move_min_msec
              );
            },
            event: function(detailedEvent) {
              var tgt = detailedEvent.target,
                el = get_classname_target(tgt);
              return do_pointermove[detailedEvent.pointerType](detailedEvent, el, tgt);
            }
          };
          on_("pointermove", do_pointermove.event);
        
          /*
          on_("pointermove", function(detailedEvent) {
            var el = get_classname_target(detailedEvent.target);
            var isMouse = detailedEvent.pointerType === 'mouse';
            do_device_move(
              el,
              isMouse ? [in_mousemove, in_pointermove] : [in_fingermove, in_pointermove],
              isMouse ? pointer_timing.mouse.move_min_msec : pointer_timing.finger.move_min_msec
            );
          });*/
        
          on_("pointerleave", function(detailedEvent) {
            var el = get_classname_target(detailedEvent.target);
        
            if (has_class_name(el, in_pointerdown)) {
              add_class_name_quick(el, "in_pointerdown_outside");
            }
        
            if (has_class_name(el, in_fingerpress)) {
              add_class_name_quick(el, "in_fingerpress_outside");
            }
        
            if (has_class_name(el, in_mousedown)) {
              add_class_name_quick(el, "in_mousedown_outside");
            }
        
            remove_class_names(el, [in_mousemove, in_pointermove, in_fingermove]);
          });
        
          var pointerenter_classes = [
            "in_mousedown_outside",
            "in_fingerpress_outside",
            "in_pointerdown_outside",
            in_mousemove
          ];
        
          on_("pointerenter", function(detailedEvent) {
            var el = get_classname_target(detailedEvent.target);
            remove_class_names(el, pointerenter_classes);
          });
        
          on_("pointercancel", function(detailedEvent) {
            kill_press_timers();
            kill_click_timers();
            var el = get_classname_target(detailedEvent.target);
            remove_class_names(el, [
              in_pointerover,
              in_mouseover,
              in_mousemove,
              in_mousedown,
              in_mousedown_long,
              in_pointerdown_long,
              in_fingerpress,
              in_pointerdown,
              in_fingerpress_long,
              "in_mousedown_outside",
              "in_fingerpress_outside",
              "in_pointerdown_outside"
            ]);
          });
        
          on_("contextmenu", function(event) {
            var el = get_classname_target(event.target);
        
            if (has_class_name(el, contextmenu_toggle_off)) {
              add_class_names(el, [
                contextmenu_toggle_on,
                in_contextmenu,
                contextmenu_start
              ]);
            } else {
              add_class_name_quick(el, in_contextmenu);
            }
          });
        }
        
        function monitor_modifier_keys(monitorElement, cssStyleElement) {
          var keys = ["Shift", "Control", "Alt"],
            codes = [
              "ShiftLeft",
              "ShiftRight",
              "ControlLeft",
              "ControlRight",
              "AltLeft",
              "AltRight"
            ];
          monitorElement = monitorElement || document;
          cssStyleElement = cssStyleElement || document.body;
        
          monitorElement.addEventListener("keydown", keyDown);
          monitorElement.addEventListener("keyup", keyUp);
        
          monitorElement.addEventListener("mousemove", mouseMove);
        
          function mouseMove(ev) {
            cssStyleElement.classList[!!ev.shiftKey ? "add" : "remove"]("Shift");
            cssStyleElement.classList[!!ev.ctrlKey ? "add" : "remove"]("Control");
            cssStyleElement.classList[!!ev.altKey ? "add" : "remove"]("Alt");
          }
        
          function keyDown(ev) {
            if (keys.indexOf(ev.key) >= 0) cssStyleElement.classList.add(ev.key);
            if (codes.indexOf(ev.code) >= 0) cssStyleElement.classList.add(ev.code);
          }
        
          function keyUp(ev) {
            if (keys.indexOf(ev.key) >= 0) cssStyleElement.classList.remove(ev.key);
            if (codes.indexOf(ev.code) >= 0) cssStyleElement.classList.remove(ev.code);
          }
        }
        
        (function() {
          var i = 2;
          var timer;
        
          var boot = function() {
            if (i-- < 0) {
              clearTimeout(timer);
              monitor_device_classes(document.body, class_names, pointer_timing);
              monitor_modifier_keys(document);
            } else {
              timer = setTimeout(boot, 500);
            }
          };
        
          boot();
        })();
        
        const lib = {
            
            fs_api,
            
        }  ;
        return lib;
    }

 

});

