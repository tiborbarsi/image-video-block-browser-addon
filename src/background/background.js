// background.js
// jshint esversion: 6


/* Request Blocker */
class RequestBlocker
{
  constructor()
  {
    this._imgBlock = false;
    this._mediaBlock = false;

    browser.storage.onChanged.addListener(this._updateState.bind(this));
    browser.webRequest.onBeforeRequest.addListener(this._cancelRequest.bind(this),
      {urls: ['<all_urls>'], types: ['image', 'imageset', 'media']}, ['blocking']);
    browser.webRequest.onHeadersReceived.addListener(this._cancelXMLHttpRequest.bind(this),
      {urls: ['<all_urls>'], types: ['xmlhttprequest']}, ['blocking', 'responseHeaders']);

    this._updateState();  // Initial
  }

  _updateState()
  {
    browser.storage.local.get().then(data => {
      this._imgBlock = data.imgBlock;
      this._mediaBlock = data.mediaBlock;
    });
  }

  _cancelRequest(details)
  {
    if (details.type === 'image' || details.type === 'imageset')
      return {cancel: this._imgBlock};

    else if (details.type === 'media')
      return {cancel: this._mediaBlock};
  }

  _cancelXMLHttpRequest(details)
  {
    let mediaType = this._getContentTypeHeader(details.responseHeaders);

    if (this._imgBlock && mediaType.startsWith('image/'))
      return {redirectUrl: 'data:,'};  // Cancel request

    else if (this._mediaBlock && mediaType.startsWith('video/'))
      return {redirectUrl: 'data:,'};  // Cancel request

    else if (this._mediaBlock && mediaType.startsWith('audio/'))
      return {redirectUrl: 'data:,'};  // Cancel request
  }

  _getContentTypeHeader(headers)
  {
    for (let header of headers)
      if (header.name.toLowerCase() === 'content-type')
        return header.value;
  }
}


/* Context Menu Handler */
class ContextMenuHandler
{
  constructor()
  {
    this._menuItems = [
      {title: browser.i18n.getMessage('imgBlockText'), popupId: 'imgBlock', checked: false},
      {title: browser.i18n.getMessage('mediaBlockText'), popupId: 'mediaBlock', checked: false},
      {title: browser.i18n.getMessage('videoHideText'), popupId: 'videoHide', checked: false},
      {title: browser.i18n.getMessage('flashHideText'), popupId: 'flashHide', checked: false},
      {title: browser.i18n.getMessage('canvasHideText'), popupId: 'canvasHide', checked: false},
      {title: browser.i18n.getMessage('svgHideText'), popupId: 'svgHide', checked: false},
    ];

    browser.storage.onChanged.addListener(this._updateCheckedState.bind(this));
    browser.menus.onClicked.addListener(this._onMenuItemClick.bind(this));

    this._createMenuItems();
    this._updateCheckedState();
  }

  _createMenuItems()
  {
    browser.storage.local.get().then(data => {
      for (let item of this._menuItems) {
        item.checked = data[item.popupId];
        browser.menus.create({
          id: 'menu#' + item.popupId,
          type: 'checkbox',
          title: item.title,
          checked: item.checked,
          contexts: ['page', 'editable', 'frame', 'link', 'image', 'video']
        });
      }
    });
  }

  _updateCheckedState()
  {
    browser.storage.local.get().then(data => {
      for (let item of this._menuItems) {
        if (item.checked == data[item.popupId])
          continue;

        item.checked = data[item.popupId];
        browser.menus.update('menu#' + item.popupId, {
          checked: data[item.popupId]
        });
      }
    });
  }

  _onMenuItemClick(info, tab)
  {
    let data = {};
    for (let item of this._menuItems) {
      if ((info.menuItemId == "menu#" + item.popupId)) {
        item.checked = !item.checked;
        data[item.popupId] = item.checked;
      }
    }

    browser.storage.local.set(data);
  }
}


/* Keyboard Command Handler */
class KeyboardCommandHandler
{
  constructor()
  {
    this._optionStateChanger = new OptionStateChanger();

    browser.commands.onCommand.addListener(this._onCommand.bind(this));
  }

  _onCommand(command)
  {
    this._optionStateChanger.toggleOption(command);
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


/* Popup Badge Indicator */
class PopupBadgeIndicator
{
  constructor()
  {
    this._badgeLetters = {
      'imgBlock': 'i',
      'mediaBlock': 'm',
      'videoHide': 'v',
      'flashHide': 'f',
      'canvasHide': 'c',
      'svgHide': 's'
    };

    browser.storage.onChanged.addListener(this._setBadge.bind(this));
    this._setBadge();  // Initial
  }

  _setBadge()
  {
    browser.storage.local.get().then(data => {
      let badgeText = this._makeBadgeText(data);
      browser.browserAction.setBadgeText({text: badgeText});
    });
  }

  _makeBadgeText(settings)
  {
    let badgeText = '';
    for (let k in this._badgeLetters)
      if (settings[k]) badgeText += this._badgeLetters[k];

    return badgeText;
  }
}


// Init
new RequestBlocker();
new ContextMenuHandler();
new KeyboardCommandHandler();
new PopupBadgeIndicator();
