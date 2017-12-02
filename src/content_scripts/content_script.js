// content_script.js


var StyleUpdater = {
  styleEl: null,

  update: function() {
    var self = this;

    chrome.storage.local.get(function(data) {
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

      self.styleEl.innerText = style;
    });
  },

  init: function() {
    this.styleEl = document.createElement('style');
    document.head.appendChild(this.styleEl);

    chrome.storage.onChanged.addListener(this.update.bind(this));
    this.update();
  }
};


StyleUpdater.init();
