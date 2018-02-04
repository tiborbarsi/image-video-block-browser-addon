// popup.js
// jshint esversion: 6


var $ = document.querySelector.bind(document);


class Popup
{
  constructor()
  {
    this.elements = {
      'imgBlock': $('#imgBlock'),
      'videoHide': $('#videoHide'),
      'flashHide': $('#flashHide'),
      'canvasHide': $('#canvasHide'),
      'svgHide': $('#svgHide'),
      'downloadImgs': $('#downloadImgs')
    };

    browser.storage.onChanged.addListener(this._onStorageChange.bind(this));
    document.body.addEventListener('click', this._onElementClick.bind(this));

    this._onStorageChange();  // Initial
  }

  _onStorageChange()
  {
    this._updateElementState();
  }

  _onElementClick(event)
  {
    var elId = event.target.id;

    if (!this.elements[elId])
      return;

    if (elId === 'downloadImgs')
      return this._requestDownload();

    this._toggleOptionState(elId);
  }

  _updateElementState()
  {
    var self = this;
    chrome.storage.local.get(function(data) {
      for (var id in self.elements)
        if (data[id])
          self.elements[id].classList.add('active');
        else
          self.elements[id].classList.remove('active');
    });
  }

  _toggleOptionState(optionId)
  {
    chrome.storage.local.get(function(oldData) {
      var newData = {};

      newData[optionId] = !oldData[optionId];
      chrome.storage.local.set(newData);
    });
  }

  _requestDownload()
  {
    // Send request to content_script.js
    browser.tabs.query({currentWindow: true, active: true})
      .then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {downloadImages: true});
      });
  }
}


// Init
new Popup();
