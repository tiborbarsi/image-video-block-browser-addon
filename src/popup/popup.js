// popup.js
// jshint esversion: 6


var $ = document.querySelector.bind(document);


class OptionManager
{
  constructor()
  {
    this._optionStateChanger = new OptionStateChanger();
    this._imageDownloadRequester = new ImageDownloadRequester();

    this._optionElements = {
      'imgBlock': $('#imgBlock'),
      'mediaBlock': $('#mediaBlock'),
      'videoHide': $('#videoHide'),
      'flashHide': $('#flashHide'),
      'canvasHide': $('#canvasHide'),
      'svgHide': $('#svgHide'),
      'downloadImgs': $('#downloadImgs')
    };

    document.body.addEventListener('click', this._handleClickEvent.bind(this));
    browser.storage.onChanged.addListener(this._updateElementState.bind(this));

    this._updateElementState();  // Initial
  }

  _handleClickEvent(event)
  {
    var optionId = event.target.id;

    if (!this._optionElements[optionId])
      return;

    if (optionId === 'downloadImgs')
      return this._imageDownloadRequester.requestDownload();

    this._optionStateChanger.toggleOption(optionId);
  }

  _updateElementState()
  {
    browser.storage.local.get().then(data => {
      for (var optionId in this._optionElements)
        if (data[optionId])
          this._optionElements[optionId].classList.add('active');
        else
          this._optionElements[optionId].classList.remove('active');
    });
  }
}


class OptionStateChanger
{
  toggleOption(optionId)
  {
    browser.storage.local.get().then(oldData => {
      var newData = {};

      newData[optionId] = !oldData[optionId];
      browser.storage.local.set(newData);
    });
  }
}


class ImageDownloadRequester
{
  requestDownload()
  {
    // Send request to content_script.js
    browser.tabs.query({currentWindow: true, active: true})
      .then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {downloadImages: true});
      });
  }
}


$('#closeWindow').addEventListener('click', _ => {
  window.close();

  // Android popup close workaround
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1433604#c5
  browser.tabs.update({active: true});
});


// Init
new OptionManager();
