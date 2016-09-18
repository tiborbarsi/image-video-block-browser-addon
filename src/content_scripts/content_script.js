// content_script.js


// Hides IMG, VIDEO, FLASH, SVG, CANVAS
chrome.storage.local.get(function(data) {
  var style = document.createElement('style');

  if (data.imgBlock)
    style.innerText += 'img {opacity: 0 !important;}';

  if (data.videoHide)
    style.innerText += 'video {opacity: 0 !important;}';

  if (data.svgHide)
    style.innerText += 'svg {opacity: 0 !important;}';

  if (data.canvasHide)
    style.innerText += 'canvas {opacity: 0 !important;}';

  if (data.flashHide)
    style.innerText += '[type="application/x-shockwave-flash"] {opacity: 0 !important;}';

  document.head.appendChild(style);
});
