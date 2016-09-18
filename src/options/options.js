// options.js


var $ = document.querySelector.bind(document);


/* options */
var options = {
  els: {
    imgBlock: $('input#imgBlock'),
    videoHide: $('input#videoHide'),
    flashHide: $('input#flashHide'),
    svgHide: $('input#svgHide'),
    canvasHide: $('input#canvasHide')
  },

  get: function() {
    var self = this;
    chrome.storage.local.get(function(data) {
      self.els.imgBlock.checked = data.imgBlock;
      self.els.videoHide.checked = data.videoHide;
      self.els.flashHide.checked = data.flashHide;
      self.els.svgHide.checked = data.svgHide;
      self.els.canvasHide.checked = data.canvasHide;
    });
  },
  set: function(e) {
    var data = {};
    data[e.target.id] = e.target.checked;
    chrome.storage.local.set(data);
  },
  init: function() {
    this.get();
    chrome.storage.onChanged.addListener(this.get.bind(this));

    for (var el in this.els)
      this.els[el].addEventListener('change', this.set);
  }
};


options.init();
