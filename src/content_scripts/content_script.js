// content_script.js
// jshint esversion: 6


class ContentManager
{
  constructor()
  {
    this.styleEl = document.createElement('style');
    this.styleGenerator = new StyleGenerator();
    this.imageLoader = new ImageLoader();

    document.head.appendChild(this.styleEl);

    chrome.storage.onChanged.addListener(this.onChange.bind(this));
    this.onChange();  // Initial
  }

  onChange()
  {
    var self = this;
    chrome.storage.local.get(function(data) {
      self._setStyle(data);
      self._loadImagesIfNeeded(data);
    });
  }

  _setStyle(data)
  {
    this.styleEl.innerText = this.styleGenerator.generate(data);
  }

  _loadImagesIfNeeded(data)
  {
    if (!data.imgBlock && document.readyState === 'complete')
      this.imageLoader.loadImages(document.images);
  }
}


class StyleGenerator
{
  generate(data)
  {
    var style = '';

    if (data.imgBlock)
      style += 'img {opacity: 0 !important;}' +
               '* {background-image: none !important;}';

    if (data.videoHide)
      style += 'video {opacity: 0 !important;}';

    if (data.svgHide)
      style += 'svg {opacity: 0 !important;}';

    if (data.canvasHide)
      style += 'canvas {opacity: 0 !important;}';

    if (data.flashHide)
      style += '[type="application/x-shockwave-flash"] {opacity: 0 !important;}';

    return style;
  }
}


class ImageLoader
{
  loadImages(imgElList)
  {
    for (var i = 0; i < imgElList.length; i++)
      this.loadImage(imgElList[i]);

  }

  loadImage(imgEl)
  {
    imgEl.src = imgEl.src;  // Redownload
  }
}


// Init
new ContentManager();
