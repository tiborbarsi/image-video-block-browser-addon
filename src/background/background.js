// background.js
// jshint esversion: 6


/* Request Blocker */
class RequestBlocker
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;

    browser.webRequest.onBeforeRequest.addListener(this._cancelRequest.bind(this),
      {urls: ['<all_urls>'], types: ['image', 'imageset', 'media']}, ['blocking']);
    browser.webRequest.onHeadersReceived.addListener(this._cancelXMLHttpRequest.bind(this),
      {urls: ['<all_urls>'], types: ['xmlhttprequest']}, ['blocking', 'responseHeaders']);
  }

  _cancelRequest(details)
  {
    let siteSettings = this._getSiteSettings(details.originUrl);

    if (details.type === 'image' || details.type === 'imageset')
      return {cancel: siteSettings.imgBlock};

    else if (details.type === 'media')
      return {cancel: siteSettings.mediaBlock};
  }

  _cancelXMLHttpRequest(details)
  {
    let siteSettings = this._getSiteSettings(details.originUrl);
    let mediaType = this._getContentTypeHeader(details.responseHeaders);

    if (siteSettings.imgBlock && mediaType.startsWith('image/'))
      return {redirectUrl: 'data:,'};  // Cancel request

    else if (siteSettings.mediaBlock && mediaType.startsWith('video/'))
      return {redirectUrl: 'data:,'};  // Cancel request

    else if (siteSettings.mediaBlock && mediaType.startsWith('audio/'))
      return {redirectUrl: 'data:,'};  // Cancel request
  }

  _getContentTypeHeader(headers)
  {
    for (let header of headers)
      if (header.name.toLowerCase() === 'content-type')
        return header.value;
  }

  _getSiteSettings(originUrl)
  {
    let url = URLUtils.trimUrl(originUrl);
    let siteUrl = this._settingsManager.hasSite(url) ? url : 'global';

    return this._settingsManager.getSiteSettings(siteUrl);
  }
}


/* Popup Badge Indicator */
class PopupBadgeIndicator
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;
    this._badgeTextMaker = new BadgeTextMaker();

    this._activeTabs = {};  // {windowId: {tabId: id, tabUrl: url}}

    browser.tabs.onActivated.addListener(this._onActiveTabChange.bind(this));
    browser.tabs.onUpdated.addListener(this._onTabUpdate.bind(this));

    this._settingsManager.onSiteSettingsChange.addListener(this._setBadge.bind(this));
    this._settingsManager.onSiteListChange.addListener(this._setBadge.bind(this));
  }

  _setBadge()
  {
    for (let windowId in this._activeTabs) {

      let activeTabId = this._activeTabs[windowId].tabId;
      let activeTabUrl = this._activeTabs[windowId].tabUrl;

      let siteSettings = this._settingsManager.getSiteOrGlobalSettings(activeTabUrl);
      let badgeText = this._badgeTextMaker.makeText(siteSettings);

      browser.browserAction.setBadgeText({text: badgeText, tabId: activeTabId});
    }
  }

  _onActiveTabChange(activeInfo)
  {
    browser.tabs.query({active: true}).then(tabs => {
      let activeTabs = {};

      for (let tab of tabs)
        activeTabs[tab.windowId] = {tabId: tab.id, tabUrl: URLUtils.trimUrl(tab.url)};

      this._activeTabs = activeTabs;
      this._setBadge();
    });
  }

  _onTabUpdate(tabId, changeInfo, tab)
  {
    if (!tab.active || !changeInfo.url)
      return;

    this._activeTabs[tab.windowId].tabId = tabId;
    this._activeTabs[tab.windowId].tabUrl = URLUtils.trimUrl(tab.url);
    this._setBadge();
  }
}


class BadgeTextMaker
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
  }

  makeText(siteSettings)
  {
    let badgeText = '';

    for (let k in this._badgeLetters)
      if (siteSettings[k]) badgeText += this._badgeLetters[k];

    return badgeText;
  }
}


/* Context Menu Handler */
class ContextMenuHandler
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;

    this._menuItems = [
      {id: 'imgBlock', checked: false, title: browser.i18n.getMessage('imgBlockText') + ' (globally)'},
      {id: 'mediaBlock', checked: false, title: browser.i18n.getMessage('mediaBlockText')},
      {id: 'videoHide', checked: false, title: browser.i18n.getMessage('videoHideText')},
      {id: 'flashHide', checked: false, title: browser.i18n.getMessage('flashHideText')},
      {id: 'canvasHide', checked: false, title: browser.i18n.getMessage('canvasHideText')},
      {id: 'svgHide', checked: false, title: browser.i18n.getMessage('svgHideText')},
    ];

    this._settingsManager.onSiteSettingsChange.addListener(this._updateCheckedState.bind(this));

    browser.menus.onClicked.addListener(this._onMenuItemClick.bind(this));

    this._createMenuItems();
  }

  _createMenuItems()
  {
    let siteSettings = this._settingsManager.getSiteSettings('global');

    for (let item of this._menuItems) {
      item.checked = siteSettings[item.id];
      browser.menus.create({
        id: 'menu#' + item.id,
        type: 'checkbox',
        title: item.title,
        checked: item.checked,
        contexts: ['page', 'editable', 'frame', 'link', 'image', 'video']
      });
    }
  }

  _updateCheckedState()
  {
    let siteSettings = this._settingsManager.getSiteSettings('global');

    for (let item of this._menuItems) {
      if (item.checked == siteSettings[item.id])
        continue;

      item.checked = siteSettings[item.id];
      browser.menus.update('menu#' + item.id, {
        checked: siteSettings[item.id]
      });
    }
  }

  _onMenuItemClick(info)
  {
    let siteSettings = this._settingsManager.getSiteSettings('global');

    for (let item of this._menuItems) {
      if ((info.menuItemId == "menu#" + item.id)) {
        item.checked = !item.checked;
        siteSettings[item.id] = item.checked;
      }
    }

    this._settingsManager.setSiteSettings('global', siteSettings);
  }
}


/* Keyboard Command Handler */
class KeyboardCommandHandler
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;

    browser.commands.onCommand.addListener(this._onCommand.bind(this));
  }

  _onCommand(command)
  {
    let siteSettings = this._settingsManager.getSiteSettings('global');
    siteSettings[command] = !siteSettings[command];

    this._settingsManager.setSiteSettings('global', siteSettings);
  }
}


/* Settings Manager */
class SettingsManager
{
  constructor()
  {
    this._siteSettings = {global: {}};
    this._cacheSiteSettings = {};

    this.onSiteListChange = new EventEmitter();
    this.onSiteSettingsChange = new EventEmitter();

    browser.storage.onChanged.addListener(this._onStorageChange.bind(this));

    this._initStorage();
  }

  addSite(siteUrl)
  {
    this._siteSettings[siteUrl] = {};
    this._saveSettings();
  }

  removeSite(siteUrl)
  {
    if (siteUrl === 'global')
      return;

    delete this._siteSettings[siteUrl];
    this._saveSettings();
  }

  getSiteList()
  {
    return Object.keys(this._siteSettings);
  }

  hasSite(siteUrl)
  {
    return !!this._siteSettings[siteUrl];
  }

  setSiteSettings(siteUrl, newSiteSettings)
  {
    this._siteSettings[siteUrl] = Object.assign({}, newSiteSettings);
    this._saveSettings();
  }

  getSiteSettings(siteUrl)
  {
    if (!this.hasSite(siteUrl))
      return null;

    return Object.assign({}, this._siteSettings[siteUrl]);
  }

  getSiteOrGlobalSettings(siteUrl)
  {
    if (this.hasSite(siteUrl))
      return this.getSiteSettings(siteUrl);

    return this.getSiteSettings('global');
  }

  _saveSettings()
  {
    browser.storage.local.set({siteSettings: this._siteSettings});
  }

  _initStorage()
  {
    browser.storage.local.get().then(data => {
      this._siteSettings = Object.assign({global: {}}, data.siteSettings);
      this._cacheSiteSettings = JSON.parse(JSON.stringify(this._siteSettings));

      // Initial
      this.onSiteListChange.fire();
      this.onSiteSettingsChange.fire();
    });
  }

  _onStorageChange(newData)
  {
    if (newData.siteSettings) {

      let oldSettings = this._cacheSiteSettings;
      let newSettings = Object.assign({global: {}}, newData.siteSettings.newValue);

      this._siteSettings = newSettings;
      this._cacheSiteSettings = JSON.parse(JSON.stringify(this._siteSettings));

      this._fireChanges(oldSettings, newSettings);
    }
  }

  _fireChanges(oldSettings, newSettings)
  {
    if (''+Object.keys(oldSettings) !== ''+Object.keys(newSettings))
      this.onSiteListChange.fire();

    for (let k in oldSettings) {
      if (newSettings[k] && (JSON.stringify(oldSettings[k]) !== JSON.stringify(newSettings[k]))) {
        this.onSiteSettingsChange.fire();
        break;
      }
    }
  }
}


/* URL Utils */
class URLUtils
{
  static getActiveTabUrl()
  {
    return browser.tabs.query({active: true, currentWindow: true})
      .then(tabs => tabs[0].url)
      .then(url => this.validateUrl(url) ? this.trimUrl(url) : '');
  }

  static trimUrl(url)
  {
    return url
      .replace(/^https?:\/\//, '')
      .replace(/\/.*/, '');
  }

  static validateUrl(url)
  {
    return /.+\..+/.test(url);
  }
}


/* Event Emitter */
class EventEmitter
{
  constructor()
  {
    this._listeners = [];
  }

  addListener(fn)
  {
    this._listeners.push(fn);
  }

  fire(data)
  {
    for (let listener of this._listeners)
      listener(data);
  }
}


// Init
let settingsManager = new SettingsManager();
new RequestBlocker(settingsManager);
new PopupBadgeIndicator(settingsManager);

new ContextMenuHandler(settingsManager);
new KeyboardCommandHandler(settingsManager);
