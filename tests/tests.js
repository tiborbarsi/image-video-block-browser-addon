// tests.js


var $ = document.querySelector.bind(document);


// Elements
var els = {
  img: $('img'),
  video: $('video'),
  flash: $('[type="application/x-shockwave-flash"]'),
  svg: $('svg'),
  canvas: $('canvas')
};


// Tests
function tests() {

  console.log('Testing ...');

  for (var el in els) {
    opacity = getComputedStyle(els[el]).opacity;

    if (opacity != '0')  // NOT OK
      console.log('%cNOT OK%c '+el+' is Not hidden', 'color: red;');

    else if (opacity == '0')  // OK
      console.log('%cOK%c '+el+' is hidden', 'color: green;');
  }
}


// Run Tests
document.addEventListener('DOMContentLoaded', tests);
