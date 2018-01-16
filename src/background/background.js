// background.js

/* context menus */
function onCreated() {
  if (browser.runtime.lastError) {
    console.log(`Error: ${browser.runtime.lastError}`);
  }
}

var contextMenus = {
  menuItems: [
    {  title: "Block Image", popupId: "imgBlock", checked: false },
    {  title: "Hide Videos", popupId: "videoHide", checked: false },
    {  title: "Hide Flash", popupId: "flashHide", checked: false },
    {  title: "Hide Canvas", popupId: "canvasHide", checked: false },
    {  title: "Hide SVGs", popupId: "svgHide", checked: false }
  ],

  createMenuItems: function() {
    var self = this
    chrome.storage.local.get(function(data) {
      for (var i in self.menuItems) {
        var item = self.menuItems[i];
        item.checked = data[item.popupId];
        browser.menus.create({
          id: "menu#"+item.popupId,
          type: "checkbox",
          title: item.title,
          checked: item.checked,
          contexts: ['page', 'editable', 'frame', 'link', 'image', 'video'],
        }, onCreated);
      }
    });

    // initialize check status
    self.onStorageChange()
  },

  onStorageChange: function() {
    var self = this
    chrome.storage.local.get(function(data) {
      for (var i in self.menuItems) {
        var item = self.menuItems[i];
        if (item.checked == data[item.popupId]) {
          continue;
        }
        item.checked = data[item.popupId];
        browser.menus.update("menu#"+item.popupId, {
          checked: data[item.popupId]
        });
      }
    });
  },

  onClick: function(info, tab) {
    var self = this

    var data = {};
    for (var i in this.menuItems) {
      var item = this.menuItems[i];
      if ((info.menuItemId == "menu#"+item.popupId)) {
        item.checked = !item.checked
        data[item.popupId] = item.checked
      }
    }

    chrome.storage.local.set(data);
  },

  init: function() {
    var self = this;
    self.createMenuItems();
    browser.menus.onClicked.addListener(self.onClick.bind(self));
    chrome.storage.onChanged.addListener(self.onStorageChange.bind(self));
  }
}

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

contextMenus.init();
blocker.init();
