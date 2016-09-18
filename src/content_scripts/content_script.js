// content_script.js


// Hides IMG, VIDEO, SVG, CANVAS
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

  document.head.appendChild(style);
});
