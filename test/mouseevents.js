
var test = require('tape');
var css = require("./lib/css.js");
var event = require("./lib/events.js");
var zwoosh = require('../zwoosh.js');

test('emit mouse events', function (t) {

  var div = document.createElement('div');
  var span = document.createElement('span');
  span.innerHTML = 'Just some random contents.'
  div.appendChild(span);
  document.body.appendChild(div);
  var z = zwoosh(div);
  var r = span.getBoundingClientRect();
  var inner = div.childNodes[0].childNodes[0];
  var mouseEvent = { which: 1, clientX: r.left, clientY: r.top };

  event.trigger(span, 'mousedown', mouseEvent);
  t.equals(css.hasClass(document.body, 'zw-grabbing'), true, 'body gets the zw-grabbing class after mousedown');
  event.trigger(document.documentElement, 'mousemove', mouseEvent);
  event.trigger(document.documentElement, 'mouseup', mouseEvent);
  t.equals(css.hasClass(document.body, 'zw-grabbing'), false, 'body has no zw-grabbing class anymore after mouseup');
  
  t.end();
});