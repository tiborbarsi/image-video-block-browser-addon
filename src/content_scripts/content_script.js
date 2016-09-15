// content_script.js


// Hides IMG, VIDEO, SVG, CANVAS
chrome.storage.local.get(function(data) {
  var style = document.createElement('style');

  if (data.imgBlock)
    style.innerHTML += 'img {opacity: 0 !important;}';

  if (data.videoHide)
    style.innerHTML += 'video {opacity: 0 !important;}';

  if (data.svgHide)
    style.innerHTML += 'svg {opacity: 0 !important;}';

  if (data.canvasHide)
    style.innerHTML += 'canvas {opacity: 0 !important;}';

  document.head.appendChild(style);
});
