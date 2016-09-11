var test = require('tape');
var css = require("./lib/css.js");
var event = require("./lib/events.js");
var zwoosh = require('../zwoosh.js');
var dom = require('./lib/dom.js');

function wheelUp(el) {
  var r = el.getBoundingClientRect();
  var mouseEvent = { deltaY: -100, clientX: r.right-10, clientY: r.bottom-10 };
  event.trigger(el, 'wheel', mouseEvent);
}

function wheelDown(el) {
  var r = el.getBoundingClientRect();
  var mouseEvent = { deltaY: 100, clientX: r.right-10, clientY: r.bottom-10 };
  event.trigger(el, 'wheel', mouseEvent);
}

function getRoundedScale(el) {
  if (typeof el.style.transform != 'undefined') {
    var r = el.style.transform.match(/scale\(([0-9,\.]+)\)/) || [""];
    return Math.round((parseFloat(r[1]) || 1) * 10) / 10;
  }
  return 1;
}

test('wheelzoom', function (t) {

  var div = dom.createEnv('<span>Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.</span>');
  var span = div.childNodes[0].childNodes[0];
  var z = zwoosh(div, {
    wheelScroll: false,
    wheelZoom: true,
  });
  var scale = div.childNodes[0];
  var inner = scale.childNodes[0];

  t.plan(12);
  var x = scale.offsetWidth;
  var y = scale.offsetHeight;
  var s = 1;

  wheelUp(div);
  s = 1.1;
  t.equals(getRoundedScale(inner), s, 'scale is ~ 1.1 after wheel up');
  t.equals(scale.offsetWidth, Math.round(s*x), 'offsetWidth is ~ x*1.1 after wheel up');
  t.equals(scale.offsetHeight, Math.round(s*y), 'offsetHeight is ~ y*1.1 after wheel up');

  wheelDown(div);    
  t.equals(getRoundedScale(inner), 1, 'scale is 1 after wheel down');
  t.equals(scale.offsetWidth, x, 'offsetWidth equals the original value after wheel down');
  t.equals(scale.offsetHeight, y, 'offsetHeight equals the original value after wheel down');

  wheelDown(div);
  s = 1/1.1;
  t.equals(getRoundedScale(inner), Math.round(s*10)/10, 'scale is ~ 0.9 after wheel down');
  t.equals(scale.offsetWidth, Math.round(s*x), 'offsetWidth is ~ x*0.9 after wheel down');
  t.equals(scale.offsetHeight, Math.round(s*y), 'offsetHeight is ~ y*0.9 after wheel down');  

  wheelUp(div);
  t.equals(getRoundedScale(inner), 1, 'scale is 1 after wheel down');
  t.equals(scale.offsetWidth, x, 'offsetWidth equals the original value after wheel up');
  t.equals(scale.offsetHeight, y, 'offsetHeight equals the original value after wheel up');  

});
