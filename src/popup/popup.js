// popup.js


var $ = {
  query: document.querySelector.bind(document),
  toggleClass: function(el, className) {
    el.classList.toggle(className);
  },
  addClass: function(el, className) {
    el.classList.add(className);
  },
  removeClass: function(el, className) {
    el.classList.remove(className);
  }
};


var options = {
  els: {
    imgBlock: $.query('#imgBlock'),
    videoHide: $.query('#videoHide'),
    flashHide: $.query('#flashHide'),
    svgHide: $.query('#svgHide'),
    canvasHide: $.query('#canvasHide')
  },

  set: function(e) {
    var data = {};
    data[e.target.id] = !e.target.classList.contains('active');
    $.toggleClass(e.target, 'active');

    chrome.storage.local.set(data);
  },

  update: function() {
    var self = this;
    chrome.storage.local.get(function(data) {
      for (var el in self.els) {
        if (data[self.els[el].id]) {
          $.addClass(self.els[el], 'active');
        } else {
          $.removeClass(self.els[el], 'active');
        }
      }
    });
  },

  init: function() {
    var self = this;
    chrome.storage.local.get(function(data) {
      Object.keys(self.els).forEach(function(key) {
        if (data[key]) self.els[key].classList.add('active');
      });
    });

    for (var el in this.els)
      this.els[el].addEventListener('click', this.set);

    chrome.storage.onChanged.addListener(this.update.bind(this));
  }
};


// Init
options.init();
