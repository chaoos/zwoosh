
var test = require('tape');
var css = require("./lib/css.js");
var event = require("./lib/events.js");
var zwoosh = require('../zwoosh.js');

test('emit custom events when zwoosh initialzed and the inner element collides.', function (t) {

  var div = document.createElement('div');
  var span = document.createElement('span');
  span.innerHTML = 'Just some random contents.'
  div.appendChild(span);
  document.body.appendChild(div);
  t.plan(4);

  var z = zwoosh(div)
  .on('collide.left', function(e) {
    t.pass('collide.left event triggered');
  })
  .on('collide.top', function(e) {
    t.pass('collide.top event triggered');
  })
  .on('collide.right', function(e) {
    t.pass('collide.right event triggered');
  })
  .on('collide.bottom', function(e) {
    t.pass('collide.bottom event triggered');
  });

  z.destroy();
  z = null;
  t.end();
});

test('emit custom events when scrollTo() is called and the inner element collides.', function (t) {

  var div = document.createElement('div');
  var div2 = document.createElement('div');
  div2.innerHTML = 'Just some random contents.';
  div.appendChild(div2);
  document.body.appendChild(div);
  div2.style.width = '100px'
  div2.style.height = '100px'
  div.style.overflow = 'hidden';
  div.style.width = '50px';
  div.style.height = '50px';

  t.plan(6);
  var z = zwoosh(div)
  .on('collide.left', function(e) {
    t.pass('collide.left event triggered');
  })
  .on('collide.top', function(e) {
    t.pass('collide.top event triggered');
  })
  .on('collide.right', function(e) {
    t.pass('collide.right event triggered');
  })
  .on('collide.bottom', function(e) {
    t.pass('collide.bottom event triggered');
  });

  z.scrollTo(5, 5, false);
  setTimeout(function () { z.scrollTo(0, 5, false); }, 100); //left
  setTimeout(function () { z.scrollTo(5, 0, false); }, 200); //top
  setTimeout(function () { z.scrollTo(50, 5, false); }, 300); //right
  setTimeout(function () { z.scrollTo(5, 50, false); }, 400); //bottom
  setTimeout(function () { z.destroy(); z = null; t.end(); }, 500); //end

});

test('emit custom events when the event is triggered outside the zwoosh object context.', function (t) {

  var div = document.createElement('div');
  var div2 = document.createElement('div');
  div2.innerHTML = 'Just some random contents.';
  div.appendChild(div2);
  document.body.appendChild(div);
  div2.style.width = '100px'
  div2.style.height = '100px'
  div.style.overflow = 'hidden';
  div.style.width = '50px';
  div.style.height = '50px';
  div.scrollLeft = 10;
  div.scrollTop = 10

  var z = zwoosh(div)
  .on('collide.left', function(e) {
    t.pass('collide.left event triggered');
  })
  .on('collide.top', function(e) {
    t.pass('collide.top event triggered');
  })
  .on('collide.right', function(e) {
    t.pass('collide.right event triggered');
  })
  .on('collide.bottom', function(e) {
    t.pass('collide.bottom event triggered');
  });

  z.scrollTo(10, 10, false); //scroll somewhere not triggering anything
  var inner = div.childNodes[0].childNodes[0];

  t.plan(4);
  event.trigger(inner, 'collide.left');
  event.trigger(inner, 'collide.top');
  event.trigger(inner, 'collide.right');
  event.trigger(inner, 'collide.bottom');
  z.destroy();
  z = null;
  t.end();

});


test('emit custom events when attaching an event handler when zwoosh has already initialzed and the element is collided', function (t) {

  var div = document.createElement('div');
  var div2 = document.createElement('div');
  div2.innerHTML = 'Just some random contents.';
  div.appendChild(div2);
  document.body.appendChild(div);
  div2.style.width = '100px'
  div2.style.height = '100px'
  div.style.overflow = 'hidden';
  div.style.width = '50px';
  div.style.height = '50px';

  var z = zwoosh(div);
  z.scrollTo(10, 10, false); //scroll somewhere not triggering anything
  t.plan(4);

  setTimeout(function () {
    z.scrollTo(0, 5, false);
    z.on('collide.left', function(e){
      t.pass('collide.left event triggered');
    });
  }, 100);

  setTimeout(function () {
    z.scrollTo(5, 0, false);
    z.on('collide.top', function(e){
      t.pass('collide.top event triggered');
    });
  }, 200);

  setTimeout(function () {
    z.scrollTo(50, 5, false);
    z.on('collide.right', function(e){
      t.pass('collide.right event triggered');
    });
  }, 300);

  setTimeout(function () {
    z.scrollTo(5, 50, false);
    z.on('collide.bottom', function(e){
      t.pass('collide.bottom event triggered');
    });
  }, 400);

  setTimeout(function () {
    z.destroy();
    z = null;
    t.end();
  }, 500); //end

});