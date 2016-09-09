
var test = require('tape');
var zwoosh = require('../zwoosh.js');
var css = require("./lib/css.js");

test('calling zwoosh on a div', function (t) {
  var div = document.createElement('div');
  var innerHTML = div.innerHTML;
  document.body.appendChild(div);
  var z = zwoosh(div);
  var scale = div.childNodes[0];
  var inner = scale.childNodes[0];

  t.equals(css.hasClass(div, 'zw-outer'), true, 'container gets the zw-outer class');
  t.equals(css.hasClass(scale, 'zw-scale'), true, 'containers child element gets the zw-scale class');  
  t.equals(css.hasClass(inner, 'zw-inner'), true, 'scale elements child element gets the zw-inner class');
  t.equals(css.hasClass(inner, 'zw-grab'), true, 'scale elements child element gets the zw-grab class');  
  t.equals(innerHTML, inner.innerHTML, 'inner element has the same contents as the original div');
  t.end();
});


test('calling zwoosh on body', function (t) {
  var div = document.createElement('div');
  document.body.appendChild(div);
  var innerHTML = document.body.innerHTML;
  var z = zwoosh(document.body);
  var fakebody = document.body.childNodes[0];
  var scale = fakebody.childNodes[0];
  var inner = scale.childNodes[0];

  t.equals(css.hasClass(fakebody, 'zw-fakebody'), true, 'fakebody container gets the zw-fakebody class');
  t.equals(css.hasClass(fakebody, 'zw-outer'), true, 'fakebody container gets the zw-outer class');
  t.equals(css.hasClass(scale, 'zw-scale'), true, 'fakebody containers child element gets the zw-scale class');  
  t.equals(css.hasClass(inner, 'zw-inner'), true, 'scale elements child element gets the zw-inner class');
  t.equals(css.hasClass(inner, 'zw-grab'), true, 'scale elements child element gets the zw-grab class');  
  t.equals(innerHTML, inner.innerHTML, 'inner element has the same contents as the original body');
  t.end();
});

