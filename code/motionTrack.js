(function (functionName) {
  /*
  MIT License
Copyright (c) 2021 Jonathan Annett
Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
  
  */

  if (
    scriptCheck(
      ["cdpn.io", "codepen.io"],
      "jonathan-annett.github.io",
      functionName,
      "function"
    )
  )
    return;

  window[functionName] = motionTrack;
  
  function scriptCheck(e, o, t, n) {
    if ("object" != typeof window || (t && typeof window[t] === n)) return !1;
    var r = document.getElementsByTagName("script"),
        s = r[r.length - 1].src;
    return (
      !!s.startsWith("https://" + o + "/") &&
      !(e.concat([o]).indexOf(location.hostname) >= 0) &&
      (console.error("PLEASE DON'T SERVE THIS FILE FROM " + o),
       console.warn(
        "Please download " + s + " and serve it from your own server."
      ),
       !0)
    );
  }

  function motionTrack(devicesToTrack) {
    devicesToTrack = devicesToTrack || ["mouse", "touch"];
    var 
      resizeWatcher = elementResizeWatcher(),
      WHAT = typeof devicesToTrack === "string" ? [devicesToTrack] : devicesToTrack,
      ON = "addEventListener",
      OFF = "remove" + ON.substr(3),
      MENU = "contextmenu",
      X = "clientX",
      T = "touches",
      MODES = WHAT.map(function (w) {
        var t = w === "touch";
        return {
          t: t,
          w: w,
          d: t ? "touchstart" : w + "down",
          m: w + "move",
          u: t ? "touchend" : w + "up",
          l: t ? undefined : w + "leave",
          f: t ? 1.0 : 0.5
        };
      });

    function appendStyleSheet(newStyleSheet) {
      var bodyClass = document.getElementsByTagName("head")[0];
      bodyClass.appendChild(newStyleSheet);
    }

    function getTransformX(el) {
      var style = window.getComputedStyle(el),
        matrix =
          style &&
          (style.transform || style.webkitTransform || style.mozTransform);

      if (!matrix || matrix === "none") return 0;

      return Math.ceil(Number(matrix.split(",")[4].trim()));
    }

    function trackX(el, options, cb) {
      el = typeof el === "string" ? document.querySelector(el) : el;
      var 
        self,
        inDragClass,
        minusPrefix,
        plusPrefix,
        contextClass,
        transformClass,
        granularity = 10,
        snapWidth,
        data_source,
        data_render,
        longPressTimeout=1000,
        contextModeTimeout=1000;
      if (typeof options === "object") {
        minusPrefix = options.minusPrefix;
        plusPrefix = options.plusPrefix;
        contextClass = options.contextClass;
        transformClass = options.transformClass;
        inDragClass = options.dragClass;
        granularity = options.granularity;
        snapWidth = options.snapWidth;
        data_source = options.data;
        data_render = options.per_data_html;
        longPressTimeout =  options.longPressTimeout || 1000;
        contextModeTimeout =  options.contextModeTimeout || 1000;
        if (
          typeof data_source === "object" &&
           data_source.constructor === Array &&
          typeof data_render === "function"
        ) {
          


          el.innerHTML   = data_source.map(data_render).join("");
          el.style.width = (options.snapWidth * data_source.length).toString() + "px";
          
          
        }
      } else {
         data_source = []
         data_render = function (data){
           return "<pre>"+data.toString()+"</pre>";
         };
      }

      var _u /*ndefined*/,
        CB_ = options && options.onSelected||cb,
        CB = undefined,
        auto_id = function (prefix) {
          var res;
          do {
            res = (prefix || "id") + Math.random().toString(36).substr(2);
          } while (!!document.getElementById(res));
          return res;
        },
        granular = function (x) {
          var gran = typeof granularity === "number" ? granularity : 10;
          return Math.round(x / gran) * gran;
        },
        snapToWidth = function (x, delta) {
          if (typeof snapWidth !== "number") {
            return x;
          }

          if (typeof delta !== "number") {
            return Math.round(x / snapWidth) * snapWidth;
          }

          var floor = Math.floor(x / snapWidth) * snapWidth,
            ceil = Math.ceil(x / snapWidth) * snapWidth,
            frac = Math.abs(delta / snapWidth);

          if (delta < 0) {
            return frac > 0.15 ? floor : ceil;
          }
          return frac > 0.15 ? floor + snapWidth : floor;
        },
        started = Date.now(),
        impassive = { passive: false },
        style = transformClass ? document.createElement("style") : _u,
        styleIdleCSS = !!transformClass
          ? [
              0,
              "." + transformClass + " {\n" + "transform: translateX(",
              1,
              "px);\n" + "}\n",
              0,
              "." + transformClass + ".snap {\n" + "transform: translateX(",
              1,
              "px);\n" + "}\n"
            ]
          : _u,
        styleTransCSS = !!transformClass
          ? [
              0,
              "." + transformClass + " {\n" + "transform: translateX(",
              1,
              "px);\n" + "}\n",
              0,
              "." + transformClass + ".snap {\n" + "transform: translateX(",
              2,
              "px);\n" + "transition: ",
              3,
              "s ease-in;\n" + "}\n"
            ]
          : _u,
        styleCSS = !!transformClass
          ? [
              0,
              "." +
                transformClass +
                " {\n" +
                "-webkit-transition: none !important;\n" +
                "-moz-transition: none !important;\n" +
                "-o-transition: none !important;\n" +
                "transition: none !important;\n" +
                "transform: translate(",
              1,
              "px,0px);\n" + "}\n",

              0,
              "." + transformClass + ".snap {\n" + "transform: translateX(",
              1,
              "px);\n" + "}\n"
            ]
          : _u,
        transformedEls = !!transformClass
          ? el.querySelectorAll("." + transformClass)
          : _u,
        check_element_id = function (el) {
        if (!el.id) {
          var newId = auto_id(transformClass + "_");

          el.setAttribute("id", newId);
        }
      };

      transformedEls = transformedEls && Array.prototype.slice.call(transformedEls, 0);
      transformedEls.forEach(check_element_id);
      
      var viewportWidth = function () {
          return Number(
            window
              .getComputedStyle(transformedEls[0].parentElement)
              .clip.split(",")[1]
              .split("px")[0]
          );
        },
        transformedElsX = transformedEls && transformedEls.map(getTransformX),
        transformedElsBounceStart = transformedElsX.slice(),
        transformedElsOffsetsAtIndex = function (index) {
          var offset = 0 - index * options.snapWidth;
          return transformedElsBounceStart.map(function (x) {
            return x + offset;
          });
        },
        transformedElsBounceEnd = function () {
          var count = Math.floor(viewportWidth() / options.snapWidth);
          return transformedElsOffsetsAtIndex((transformedEls.length - count)+0);
        },
        transformedElsReleaseX = transformedElsX.slice(),
        transformedElsFinalX = transformedElsX.slice(),
        getVarValue = function (useIx0, v, ix) {
          switch (typeof v) {
            case "number":
              return v.toString();
            case "string":
              return v;
            case "object":
              return useIx0 ? v[0] : v[ix + 1];
          }
        },
        renderVars = function (vars, ix, x) {
          return typeof x === "number"
            ? getVarValue(vars[0] === "", vars[x], ix)
            : x;
        },
        makeRenderVars = function (css, vars) {
          return function (el, ix) {
            vars[0] = el && typeof el.id === "string" ? "#" + el.id : "";
            return css.map(renderVars.bind(this, vars, ix)).join("");
          };
        },
        setIdle = function (x, secs) {
          
          var 
          
          snapX = snapToWidth(x),
              
          x_per = [x].concat(
              transformedElsX.map(function (xx) {
                return xx + x;
              })
           ),
            
           snapX_per = [snapX].concat(transformedElsFinalX),
              
           isTrans = typeof secs === "number",
            render_noTrans = makeRenderVars(styleIdleCSS, [0, x]),
            render = isTrans
              ? makeRenderVars(styleTransCSS, [0, x_per, snapX_per, secs])
              : render_noTrans,
            render_final = isTrans
              ? makeRenderVars(styleIdleCSS, [0, snapX_per])
              : false,
            initialCSS = render() + transformedEls.map(render).join(""),
            finalCSS = isTrans
              ? render_final() + transformedEls.map(render_final).join("")
              : false;

          if (isTrans) {
            transformedEls.forEach(function (el, ix) {
              var ev;
              el[ON](
                "transitionend",
                (ev = function () {
                  el[OFF]("transitionend", ev);
                  el[OFF]("transitioncancel", ev);
                  transformedElsX[ix] = transformedElsFinalX[ix];
                  if (finalCSS) {
                    style.innerHTML = finalCSS;
                    finalCSS = undefined;
                  }
                })
              );
              el[ON]("transitioncancel", ev);
            });
          }

          style.innerHTML = initialCSS;
        },
        setDragX = function (x) {
          var x_per = [x].concat(
              transformedElsX.map(function (xx) {
                return xx + x;
              })
            ),
            render = makeRenderVars(styleCSS, [0, x_per]);

          style.innerHTML = render() + transformedEls.map(render).join("");
        },
        cl = function (cb) {
          var l = (el && el.classList) || false;
          if (l) cb(l);
        },
        add = function (c, c2) {
          if (!c) return;
          if (typeof c2 === "number") c += "" + c2;
          cl(function (l) {
            if (!l.contains(c)) l.add(c);
          });
        },
        remove = function (c, c2) {
          if (!c) return;
          if (typeof c2 === "number") c += "" + c2;
          cl(function (l) {
            l.remove(c);
          });
        },
        toggle = function (c, c2) {
          if (!c) return;
          if (typeof c2 === "number") c += "" + c2;
          cl(function (l) {
            l.toggle(c);
          });
        },
        inside = function (child, parent) {
          var limits = [document.body, parent.parentElement];
          while (child && limits.indexOf(child) < 0) {
            var p = child.parentElement;
            if (p === parent) {
              return true;
            }
            child = p;
          }
          return false;
        },
        touch_outside = function (e) {
          if (e.buttons === 0) return true;
          var t = e[T];
          t = t && t[0];
          return t && !inside(document.elementFromPoint(t.pageX, t.pageY), el);
        },
          
        notifyVisibleItems= function(){
         
          var sw = options.snapWidth,
              index = 0 - Math.floor(transformedElsX[0] / sw),
              el0 = transformedEls[0],
              count = Math.floor(viewportWidth() / sw),
              visible = transformedEls.slice(index, index + count),
              notvisible = transformedEls.filter(function(x){
                return visible.indexOf(x)<0;
              });

          CB_(function(){}, index, count, visible,notvisible);

        },
          
          
        longPressTimer,
        clearLongPressTimer = function(){
          if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer=undefined;
          }
        },
        doLongPress=function(el){
          clearLongPressTimer();
          if (options && typeof options.onLongPress === 'function') {
           options.onLongPress(el);
          }
        },
          
        swapContextModeTimer,
        clearContextTimer = function(){
          if (swapContextModeTimer) {
            clearTimeout(swapContextModeTimer);
            swapContextModeTimer=undefined;
          }
        },
          
         setContextMode=function(mode) {
          if (mode ) {
            valid_buttons = [2];
            el.parentElement.classList.add('dragmode');
          } else {
             valid_buttons = [2,1];
            el.parentElement.classList.remove('dragmode');
          }
         },
        swapContextMode = function(){
          clearContextTimer();
          setContextMode( ! el.parentElement.classList.contains('dragmode') ) ;
        },
       
          
          ignoreContextMenu = function (e) {
            clearContextTimer();
            e.preventDefault();
            el[OFF](MENU, ignoreContextMenu);
          },

        toggleContextClass = function (e) {
          clearContextTimer();
          e.preventDefault();
          el[OFF](MENU, toggleContextClass);
          toggle(contextClass);
        },
          
        notifyScrolled = function (
          cleanup,
          deltaX,
          deltaSnapX,
          msec,
          els,
          factor,
          cb
        ) {
          var sw = options.snapWidth,
            speed = Math.round((0 - deltaX / msec) * factor);
          speed = (Math.abs(speed) - 1) * Math.sign(speed);

          var index = 0 - Math.floor(transformedElsFinalX[0] / sw);

          if (speed != 0) {
            transformedElsFinalX = transformedElsOffsetsAtIndex(index + speed);
            index = 0 - Math.floor(transformedElsFinalX[0] / sw);
          }

          var el = els[index],
            el0 = els[0],
            count = Math.floor(viewportWidth() / sw),
            visible = els.slice(index, index + count),
            notvisible = transformedEls.filter(function(x){
                return visible.indexOf(x)<0;
            }),
            ids = visible.map(function (elx) {
              return elx.id;
            });

          if (visible.length === count) {
            cb(cleanup, index, count, visible, notvisible);
          } else {
            transformedElsFinalX = transformedElsBounceEnd();
            cleanup(0.25, transformedElsFinalX[0]);
          }
        },
        dn = function (x) {
          //add(inDragClass);
          //add(plusPrefix,0);
          remove(contextClass);
        },
          
        mv = function (x, lastX) {
          if(Math.abs(x) >20) {
            if (swapContextModeTimer) {
              clearContextTimer();
            }
            if (longPressTimer) {
               clearLongPressTimer(); 
            }
          }
          if (style) {
            setDragX(x);
          }
          add(inDragClass);
          if (lastX !== undefined) {
            if (lastX < 0) {
              remove(minusPrefix, 0 - lastX);
            } else {
              remove(plusPrefix, lastX);
            }
          }
          if (x !== undefined) {
            if (x < 0) {
              add(minusPrefix, 0 - x);
            } else {
              add(plusPrefix, x);
            }
          }
        },
          
        up = function (x, lastX, factor) {
          var when = Date.now(),
            bounce = false,
            class_cleanup = function (transTime, newX) {
              if (lastX !== undefined) {
                if (lastX < 0) {
                  remove(minusPrefix, 0 - lastX);
                } else {
                  remove(plusPrefix, lastX);
                }
              }

              if (x !== undefined) {
                if (x < 0) {
                  remove(minusPrefix, 0 - x);
                } else {
                  remove(plusPrefix, x);
                }
              }
              remove(inDragClass);
              if (style) {
                //var snapX = snapToWidth(x);
                setIdle(newX || x, transTime || 0.5);
                transformedEls.forEach(function (el) {
                  if (!el.classList.contains("snap")) {
                    el.classList.add("snap");
                  }
                });
              }
            };
          
          clearLongPressTimer(); 
          clearContextTimer();

          // calc current left per element (so we can pass it callback)
          transformedElsReleaseX = transformedElsX.map(function (elX, ix) {
            if (ix === 0) {
              if (elX + x > 0) {
                bounce = true;
              }
            }
            return elX + x;
          });

          // calculate snapped left per element

          transformedElsFinalX = bounce
            ? transformedElsBounceStart
            : transformedElsReleaseX.map(function (elX) {
                return snapToWidth(elX, x);
              });

          if (typeof CB === "function" && !bounce) {
            notifyScrolled(
              class_cleanup,
              x,
              snapToWidth(x),
              when - started,
              transformedEls,
              factor,
              CB
            );
            CB = undefined;
          } else {
            class_cleanup();
          }
        },
        bound_dn = {},
        valid_buttons=[1],
        dn_ = function (TOUCH, DOWN, MOVE, UP, LEAVE, FACTOR, e) {
          var now_ = Date.now(), t = e[T], valid = t ? t.length === 1 : valid_buttons.indexOf(e.buttons)>=0;  
          
          if (valid) {
            
            
            var 
              started = now_,
              E = valid ? (!!t ? t[0] : e) : {},
              start = E[X],
              last = 0,
              delta = function (e, cb) {
                e.preventDefault();
                var t = e[T],
                  E = t ? (t.length >= 1 ? t[0] : {}) : e,
                  x = E[X],
                  u,
                  now = x === u ? last : granular(x - start);

                if (now === last) {
                  return now;
                }

                if (typeof cb === "function" && now !== undefined) {
                  cb(now, last);
                  last = now;
                } else {
                  return now;
                }
              },
              mv_,
              up_ = function (e) {
                var valid = !e.touches || e.touches.length === 0;
                if (valid) {
                  el[OFF](UP, up_);
                  el[OFF](MOVE, mv_);
                  if (LEAVE) {
                    el[OFF](LEAVE, up_);
                  }
                  up(delta(e), last, FACTOR);
                  el[ON](DOWN, bound_dn[DOWN], impassive);
                }
              };
              mv_ = function (e) {
                if (touch_outside(e)) {
                  return up_(e);
                }
                delta(e, mv);
              };
                
                
            
            CB = CB_;
            el[OFF](DOWN, bound_dn[DOWN]);
           
            e.preventDefault(); 
            el[ON]( UP,up_,impassive );
            el[ON]( MOVE,mv_,impassive );
            
            if (LEAVE) {
              el[ON](LEAVE, up_, impassive);
            }
            clearLongPressTimer();
             if (!!t || (e.buttons === 1)) {
               
               if (e.target!==el) {
                 //console.log("setting timeout for longpress",e.target);
                 longPressTimer = setTimeout(doLongPress,longPressTimeout,e.target);
               }
            }

            if (e.buttons === 2) {
                swapContextModeTimer = setTimeout(swapContextMode,contextModeTimeout);
                el[ON](  MENU,ignoreContextMenu, impassive );
               
            }

            dn(0);
          } else {
            if (e.buttons === 2) {
              var mnu;
              if (contextClass) {
                el[ON](  MENU,toggleContextClass,impassive );
              }
                 
            }
          }
        },
        arraymove = function(arr, fromIndex, toIndex) {
            if (fromIndex===toIndex) return;
            if ( (fromIndex<0)|| (toIndex<0) ) return;
            var limit=arr.length-1;
            if ( (fromIndex>limit)|| (toIndex>limit) ) return;
                
            var element = arr[fromIndex];
            arr.splice(fromIndex, 1);
            arr.splice(toIndex, 0, element);
        },
          
        pushUnshift=function(add,data){
        
            var ix=self.indexOf(data)
            if (ix>=0) {
              
              if (add==='push') {
                  var last = transformedEls.length-1;
                  if (ix<last) {
                    arraymove(transformedEls,ix,last);
                    arraymove(transformedElsX,ix,last);
                    arraymove(transformedElsBounceStart,ix,last);
                    transformedEls.forEach(function(ch){ el.appendChild(ch); });
                  } 
                  
              } else {
                  if (ix>0) {
                    arraymove(transformedEls,ix,0);
                    arraymove(transformedElsX,ix,0);
                    arraymove(transformedElsBounceStart,ix,0);
                    transformedEls.forEach(function(ch){ el.appendChild(ch); });
                } 
              }
              
               
            }
            else 
            {
              data_source[add](data);
              var 
              temp = document.createElement("div");
              temp.innerHTML = data_render(data,transformedEls.length);
              var child = temp.children[0];
              el.style.width = (options.snapWidth * data_source.length).toString() + "px";
              el[(add==="push")?"appendChild":"prependChild"](child);
              check_element_id(child);
              transformedEls[add](child);
              var x = getTransformX(child)
              transformedElsX[add](x);
              transformedElsBounceStart[add](x);
          }
            transformedElsX = add==="push" ? transformedElsBounceEnd() : transformedElsBounceStart.slice();
            
            setIdle(0.25,transformedElsX[0]);
            return transformedEls.length;
        }; 
      
        if (contextClass==='dragmode') {
          valid_buttons.unshift(2);
        }
      
      
          
        self = {
          indexOf : function(data) {
            return data_source.indexOf(data);
          },
          push : pushUnshift.bind(this,"push"),
          unshift : pushUnshift.bind(this,"unshift"),
          
          pop : function () {
            if (data_source.length===0) return undefined;
            el.removeChild(el.children[el.children.length-1]);
            el.style.width = options.snapWidth * (data_source.length-1).toString() + "px"; 
            transformedEls.pop();
            transformedElsX.pop();
            transformedElsBounceStart.pop();
            return data_source.pop();
          },
          
          shift : function () {
            if (data_source.length===0) return undefined;
            el.removeChild(el.children[0]);
            el.style.width = options.snapWidth * (data_source.length-1).toString() + "px";
            transformedEls.shift();
            transformedElsX.shift;
            transformedElsBounceStart.shift();
            return data_source.shift();
          },
          
           setContextMode:setContextMode
          
        };
      
      Object.defineProperties(self,{
        
        length : {
          
          configurable : false,
          get : function() {
            return data_source.length
          } 
        }
        
      });

      if (style) {
        style.type = "text/css";
        style.innerHTML = styleIdleCSS.join("0");
        appendStyleSheet(style);
        transformedEls.forEach(function (el) {
          el.classList.remove("snap");
        });
        setIdle(0);
      }

      MODES.forEach(function (m) {
        (function (TOUCH, WHAT, DOWN, MOVE, UP, LEAVE, FACTOR) {
          if (el && typeof el[ON] === "function") {
            bound_dn[DOWN] = dn_.bind(
              this,
              TOUCH,
              DOWN,
              MOVE,
              UP,
              LEAVE,
              FACTOR
            );
            el[ON](DOWN, bound_dn[DOWN], impassive);
          }
        })(m.t, m.w, m.d, m.m, m.u, m.l, m.f);
      });
      
      resizeWatcher.addListener(el.parentElement,notifyVisibleItems);
      
      
      notifyVisibleItems();  
      
      return self;
    }

    return {
      x: trackX
    };
  }
  
})("motionTrack");
