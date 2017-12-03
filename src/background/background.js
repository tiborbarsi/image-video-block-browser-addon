// background.js


/* Blocker */
var blocker = {
  imgBlock: false,

  get: function() {
    var self = this;
    chrome.storage.local.get(function(data) {
      self.imgBlock = data.imgBlock;
    });
  },
  init: function() {
    this.get();
    chrome.storage.onChanged.addListener(this.get.bind(this));

    var self = this;
    chrome.webRequest.onBeforeRequest.addListener(function(details) {
      return {cancel: self.imgBlock};
    }, {urls: ['<all_urls>'], types: ['image', 'imageset']}, ['blocking']);
  }
};


blocker.init();
