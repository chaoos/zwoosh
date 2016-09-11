
var test = require('tape');
var css = require("./lib/css.js");
var event = require("./lib/events.js");
var zwoosh = require('../zwoosh.js');
var dom = require('./lib/dom.js');

test('emit mouse events', function (t) {

  var div = dom.createEnv();
  var span = div.childNodes[0].childNodes[0];
  var z = zwoosh(div);
  var r = span.getBoundingClientRect();
  var mouseEvent = { which: 1, clientX: r.left, clientY: r.top };

  event.trigger(span, 'mousedown', mouseEvent);
  t.equals(css.hasClass(document.body, 'zw-grabbing'), true, 'body gets the zw-grabbing class after mousedown');
  t.equals(z.dragging, true, 'state after mousedown is dragging');
  
  mouseEvent.clientY++;
  event.trigger(document.documentElement, 'mousemove', mouseEvent);
  t.equals(z.dragging, true, 'state after mousemove is dragging');

  mouseEvent.clientY++;
  event.trigger(document.documentElement, 'mouseup', mouseEvent);
  t.equals(css.hasClass(document.body, 'zw-grabbing'), false, 'body has no zw-grabbing class anymore after mouseup');
  t.equals(z.dragging, false, 'final state after mouseup is not dragging');
  
  t.end();
});
