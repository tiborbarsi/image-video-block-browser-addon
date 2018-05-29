// content_script.js
// jshint esversion: 6


/* Content Manager */
class ContentManager
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;
    this._styleGenerator = new StyleGenerator();
    this._imageLoader = new ImageLoader();

    this._styleEl = document.createElement('style');
    this._location = window.location.hostname;

    document.head.appendChild(this._styleEl);
    browser.runtime.onMessage.addListener(this._onMessage.bind(this));
    this._settingsManager.onSiteSettingsChange.addListener(this._onChange.bind(this));
    this._settingsManager.onSiteListChange.addListener(this._onChange.bind(this));
  }

  _onChange()
  {
    let siteSettings = this._settingsManager.getSiteOrGlobalSettings(this._location);
    this._styleEl.textContent = this._styleGenerator.generate(siteSettings);
  }

  _onMessage(data)
  {
    if (data.downloadImages)
      this._imageLoader.loadImages(document.images);
  }
}


class StyleGenerator
{
  generate(settings)
  {
    var style = '';

    if (settings.imgBlock)
      style += 'img {opacity: 0 !important;}' +
               '* {background-image: none !important;}';

    if (settings.videoHide)
      style += 'video {opacity: 0 !important;}';

    if (settings.svgHide)
      style += 'svg {opacity: 0 !important;}';

    if (settings.canvasHide)
      style += 'canvas {opacity: 0 !important;}';

    if (settings.flashHide)
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
let contentManager = new ContentManager(settingsManager);
