'use strict';

var doc = global.document

function createEnv(contents) {
  if (contents === void 0) { contents = '<span>Just some random contents.</span>'; }
  var div = doc.createElement('div');
  var div2 = doc.createElement('div');
  div2.innerHTML = contents;
  div.appendChild(div2);
  doc.body.appendChild(div);
  div2.style.width = '100px'
  div2.style.height = '100px'
  div.style.overflow = 'hidden';
  div.style.width = '50px';
  div.style.height = '50px';
  return div;
}

module.exports = {
  createEnv: createEnv,
};