// classname tools v3 (no delayed options)

var _html = document.querySelector('html'),
  _classLists = typeof _html.classList === 'object';

//returns true if el contains className
var has_class_name = _classLists ? function(el, className) {
  return el !== undefined ? className !== undefined ? el.classList.contains(className) : false : false;
} : function(el, className) {
  if ((el !== undefined) && (className !== undefined)) {
    var c = el.className.trim();
    if (c === className) return true;
    if (c.indexOf(" " + className + " ") > 0) return true;
    var ln = className.length + 1;
    return (c.substr(0, ln) === className + " ") || (c.substr(0 - ln) === " " + className);
  }
  return false;
};

var add_class_name = _classLists ? function(el, className) {

    if ((el !== undefined) && (className !== undefined) && (el.classList !== undefined)) {
      // console.log("add_class_name:adding",className,"to",el.tagName);
      el.classList.add(className);
    } else
      /*jshint -W087 */
      debugger;

  } : function(el, className) {
    if ((el !== undefined) && (className !== undefined) && (el.className !== undefined)) {
      if (has_class_name(el, className) !== true) el.className = el.className + " " + className;
    } else {
      /*jshint -W087 */
      debugger;
    }
  },
  add_class_name_quick = add_class_name; //depricated.

var remove_class_name = _classLists ? function(el, className, recursive) {
  if ((el !== undefined) && (className !== undefined) && (el.classList !== undefined)) {
    // console.log("remove_class_name:removing",className,"from",el.tagName);
    el.classList.remove(className);
    if (recursive && (el.children !== undefined)) {
      var i, l = el.children.length;
      for (i = 0; i < l; i++) {
        remove_class_name(el.children[i], className, true);
      }
    }
  } else
    /*jshint -W087 */
    debugger;

} : function(el, className, recursive) {
  if ((el !== undefined) && (className !== undefined) && (el.className !== undefined) && (el.className !== "")) {
    var list = el.className.split(' ');
    var i = list.indexOf(className);
    if (i < 0) return;
    list.splice(i, 1);
    el.className = list.join(' ');
    if (recursive && (el.children !== undefined)) {
      l = el.children.length;
      for (i = 0; i < l; i++) {
        remove_class_name(el.children[i], className, true);
      }
    }
  } else {
    //debugger;
  }
};

// a full toggle (swaps a for b if either is set)
var swap_class_names = function (el, a, b,recursive) {
  var retval,i,l,c,rv,
      deep = ((recursive!==undefined) && el.children && ((l=el.children.length)>0)),
      fn = deep && (typeof recursive==='function') ? recursive : false;
  
  if (has_class_name(el, a)) {
    add_class_name(el, b);
    remove_class_name(el, a);
    retval = b;
  } else {
    if (has_class_name(el, b)) {
      add_class_name(el, a);
      remove_class_name(el, b);
      retval = a;
    } else {
      retval = false;
    }
  }
  if (deep) {
    if (fn) fn(el,retval);
    for(i=0;i<l;i++) {
      rv = swap_class_names ((c=el.children[i]), a, b,recursive);
      if (fn) fn(c,rv);
    }
  }
  return retval;  
};

// a half toggle (only swaps a for b if a is set)
var half_swap_class_names = function (el, a, b,recursive) {
  var retval,i,l,c,rv,
      deep = ((recursive!==undefined) && el.children && ((l=el.children.length)>0)),
      fn = deep && (typeof recursive==='function') ? recursive : false;
  
  if (has_class_name(el, a)) {
    add_class_name(el, b);
    remove_class_name(el, a);
    retval = b;
  } else {  
    retval = false;
  }
  if (deep) {
    if (fn) fn(el,retval);
    for(i=0;i<l;i++) {
      rv = half_swap_class_names ((c=el.children[i]), a, b,recursive);
      if (fn) fn(c,rv);
    }
  }
  return retval;  
};

var set_class_name = _classLists ? function(el, className) {
  if (el && className && el.classList) {

    var cname, ix, adding = className.split(" "),

      i = 0;
    while (i < el.classList.length) {
      cname = el.classList.item(i);
      if ((ix = adding.indexOf(cname)) >= 0) {
        adding.splice(ix, 1);
        i++;
      } else {
        el.classList.remove(cname);
      }
    }

    adding.forEach(function(cname) {
      el.classList.add(cname);
    });

  } else
    /*jshint -W087 */
    debugger;

} : function(el, className) {
  if ((el !== undefined) && (className !== undefined) && (el.className !== undefined)) {
    el.className = className;
  } else {
    /*jshint -W087 */
    debugger;
  }
};

var add_class_names = _classLists ? function(el, classNames) {
  if ((el !== undefined) && (classNames !== undefined) && (el.classList !== undefined)) {
    var i, l = classNames.length;
    for (i = 0; i < l; i++) {
      //console.log("add_class_names:adding",classNames[i],"to",el.tagName);
      el.classList.add(classNames[i]);
    }
  } else {
    /*jshint -W087 */
    debugger;
  }

} : function(el, classNames) {

  if ((el !== undefined) && (classNames !== undefined) && (el.className !== undefined)) {

    var l = classNames.length,
      c = el.className,
      x, list = c.split(' ');

    for (i = 0; i < l; i++) {
      if (list.indexOf((x = classNames[i])) < 0)
        c += ' ' + x;
    }

    el.className = c.trim();
  } else {
    /*jshint -W087 */
    debugger;
  }

};

var remove_class_names = _classLists ? function(el, classNames, recursive) {

  if ((el !== undefined) && (classNames !== undefined) && (el.classList !== undefined)) {
    var i, l = classNames.length;
    for (i = 0; i < l; i++) {
      if (recursive && (el.children !== undefined) && (el.children.length > 0)) {
        remove_class_name(el, classNames[i], true);
      } else {
        el.classList.remove(classNames[i]);
      }
    }

  } else
    /*jshint -W087 */
    debugger;
} : function(el, classNames, recursive) {
  if ((el !== undefined) && (classNames !== undefined) && (el.className !== undefined) && (el.className !== "")) {
    var ix, classList = el.className.split(' '),
      // iterate classnNames as item
      item, i, l = classNames.length;
    for (i = 0; i < l; i++) {
      item = classNames[i];
      if ((ix = classList.indexOf(item)) >= 0) {
        classList.splice(ix, 1);
      }
    }
    el.className = classList.join(' ');
    if (recursive && el.children && ((l = el.children.length) > 0)) {
      for (i = 0; i < l; i++) {
        remove_class_names(el.children[i], true);
      }
    }
  } else {
    //debugger;
  }
};

var x_class_name = _classLists ? function(el, className) {
  if (el && className && el.classList) {

  }
} : function(el, className) {
  if ((el !== undefined) && (className !== undefined) && (el.className !== undefined)) {

  }
};

// in el, adds className and removes any others from groups.
// note: if className is not in groups, it is still added, and all those listed in groups will be removed
var set_class_name_group = _classLists ? function(el, className, groups) {
    if (el && groups && className && el.classList) {
      var adding = true,
        x, i, l = groups.length;
      for (i = 0; i < l; i++) {
        if ((x = groups[i]) === className) {
          adding = false;
        } else {
          el.classList.remove(x);
        }
      }
      el.classList.add(className);
    }
  } : function(el, className, groups) {

    if ((el !== undefined) && (groups !== undefined) && (className !== undefined)) {

      var
        ix, classList = el.className.split(' '),
        changed = false,
        needed = true,
        already,
        //iterate groups as item
        item, i, l = groups.length;
      for (i = 0; i < l; i++) {
        item = groups[i];
        already = classList.indexOf(item) >= 0;
        if (item === className) {
          if (already) {
            needed = false;
          } else {
            classList.push(className);
            changed = true;
          }
        } else {
          if (already) {
            if ((ix = classList.indexOf(item)) >= 0) classList.splice(ix, 1);
            changed = true;
          }
        }
      }

      if (changed) {
        // most likely: we updated classList by adding / removing classes, so need to export them back to classlist.
        el.className = classList.join(' ');
      } else {
        // edge case for adding className not in group, and none in group were already set.
        if (needed) el.className = el.className + ' ' + className;
      }

    } else {
      /*jshint -W087 */
      debugger;
    }
  },
  set_class_name_group_quick = set_class_name_group; // depricated.

// plural version of set_class_name_group (can set multiple classNames instead of just 1)
var set_class_name_group_class = _classLists ? function(el, classNames, groups) {
    if (el && groups && classNames && el.classList) {
      var
      // make a copy of classNames so we can prune it if needed.
        ix, adding = classNames.slice(),

        // iterate groups as item
        item, i, l = groups.length;
      for (i = 0; i < l; i++) {
        item = groups[i];

        if (classNames.indexOf(item) >= 0) {
          // item is a classname we need to set
          if (el.classList.contains(item)) {
            // we don't need to add item as it's already there
            if ((ix = adding.indexOf(item)) >= 0) adding.splice(ix, 1);
          }
        } else {
          // get rid of x as it's not in list being set
          // note: we don't know if it actually exists in el.classList, so this will silently fail if not
          el.classList.remove(item);
        }
      }

      while (adding.length > 0) {
        // add each classname to the list (will silently ignore any are already there)
        el.classList.add(adding.pop());
      }
    }

  } : function(el, classNames, groups) {
    if ((el !== undefined) && (groups !== undefined) && (classNames !== undefined) && (el.className !== undefined)) {

      var
      // make a copy of classNames so we can prune it if needed.
        ix, adding = classNames.slice(),
        // convert el.clasNames as an array.
        dirty = false,
        classList = el.className.split(' '),

        // iterate groups as item
        item, i, l = groups.length;
      for (i = 0; i < l; i++) {
        item = groups[i];

        if (classNames.indexOf(item) >= 0) {
          // item is a classname we need to set
          if (classList.indexOf(item) >= 0) {
            // we don't need to add item as it's already there
            if ((ix = adding.indexOf(item)) >= 0) adding.splice(ix, 1);
          }
        } else {

          if ((ix = classList.indexOf(item)) >= 0) {
            // we need to get rid of x as it's not in list being set, and exists in the element.
            classList.splice(ix, 1);
            dirty = true;
          }
        }
      }

      while (adding.length > 0) {
        item = adding.pop();
        if (classList.indexOf(item) < 0) {
          classList.push(item);
          dirty = true;
        }
      }

      if (dirty) {
        // we changed something.
        el.className = classList.join(' ');
      }
    } else {
      /*jshint -W087 */
      debugger;
    }
  },
  set_class_name_group_class_quick = set_class_name_group_class;