var test = require('tape');
var css = require("./lib/css.js");
var event = require("./lib/events.js");
var zwoosh = require('../zwoosh.js');
var dom = require('./lib/dom.js');

test('grid system', function (t) {

  var div = dom.createEnv('<span>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</span>');
  var span = div.childNodes[0].childNodes[0];
  var z = zwoosh(div, {
    gridX: 10,
    gridY: 10,
  });
  var r = span.getBoundingClientRect();  
  var mouseEvent = { which: 1, clientX: r.left+2, clientY: r.top+2 };

  t.plan(4);
  event.trigger(span, 'mousedown', mouseEvent);

  mouseEvent.clientX-=15;
  mouseEvent.clientY-=15;
  event.trigger(document.documentElement, 'mousemove', mouseEvent);
  t.equals(div.scrollLeft, 15, 'current x-coordinate equals 15');
  t.equals(div.scrollTop, 15, 'current y-coordinate equals 15');

  event.trigger(document.documentElement, 'mouseup', mouseEvent);

  setTimeout(function () {
    t.equals(div.scrollLeft, 20, 'final x-coordinate is rounded to a multiply of gridX (20)');
    t.equals(div.scrollTop, 20, 'final y-coordinate is rounded to a multiply of gridY (20)');
  }, 250);

});
