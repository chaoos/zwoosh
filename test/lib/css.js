'use strict';

function hasClass (el, cssClass) {
  var re = new RegExp(" " + cssClass + " ");
  return el.className.match(re) !== null;
}

module.exports = {
  hasClass: hasClass
};