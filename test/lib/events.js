'use strict';

var doc = global.document;

function trigger (el, type, options) {
  var o = options || {};
  var e = doc.createEvent("Event");
  e.initEvent(type, true, true);
  Object.keys(o).forEach(apply);
  el.dispatchEvent(e);
  function apply (key) {
    e[key] = o[key];
  }
  return e;
}

module.exports = {
  trigger: trigger
};