// popup.js
// jshint esversion: 6


var $ = document.querySelector.bind(document);


/* Add Site Controller */
class AddSiteController
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;

    this._inputEl = $('.site-add input');
    this._validationEl = $('.site-add .validation-error');
    this._addEl = $('.site-add a');

    this.onAddSite = new EventEmitter();

    this._inputEl.addEventListener('keypress', e => {
      if (e.key === 'Enter') this.addSite();
    });
    this._addEl.addEventListener('click', this.addSite.bind(this));

    this._preFillInput();  // Initial
  }

  addSite()
  {
    let url = URLUtils.trimUrl(this._inputEl.value);

    if (!this._validateSite(url))
      return;

    this._inputEl.value = '';
    this.onAddSite.fire(url);
    this._settingsManager.addSite(url);
  }

  _validateSite(url)
  {
    this._validationEl.style.display = 'none';

    if (URLUtils.validateUrl(url))
      return true;

    this._validationEl.style.display = 'block';
    return false;
  }

  _preFillInput()
  {
    URLUtils.getActiveTabUrl().then(siteUrl => {
      if (!this._settingsManager.hasSite(siteUrl))  // NOTE: Maybe asyc bug.
        this._inputEl.value = siteUrl;
    });
  }
}


/* Site List Controller */
class SiteListController
{
  constructor(settingsManager)
  {
    this._settingsManager = settingsManager;
    this._selectedSite = null;

    this.onSelectedSiteChange = new EventEmitter();

    this._selectEl = $('.site-list select');

    this._selectEl.addEventListener('change', this._onSelectElChange.bind(this));
    this._settingsManager.onSiteListChange.addListener(this.renderSiteList.bind(this));
  }

  setSelectedSite(site)
  {
    this._selectEl.value = site;
    this._selectedSite = site;

    this.onSelectedSiteChange.fire();
  }

  getSelectedSite()
  {
    return this._selectedSite;
  }

  _onSelectElChange()
  {
    this.setSelectedSite(this._selectEl.value);
  }

  renderSiteList()
  {
    let siteList = this._settingsManager.getSiteList();

    this._removeSiteListOptions();

    for (let site of siteList)
      if (site === 'global')
        this._selectEl.appendChild(this._createSiteListOption(site, 'Global Settings'));
      else
        this._selectEl.appendChild(this._createSiteListOption(site, site));

    this.setSelectedSite(this._selectEl.value);
  }

  _removeSiteListOptions()
  {
    while (this._selectEl.firstChild)
      this._selectEl.removeChild(this._selectEl.firstChild);
  }

  _createSiteListOption(value, text)
  {
    let option = document.createElement('option');
    option.value = value;
    option.textContent = text;
    return option;
  }
}


/* Select Site Handler */
class SelectSiteHandler
{
  constructor(settingsManager, addSiteController, siteListController)
  {
    this._settingsManager = settingsManager;
    this._addSiteController = addSiteController;
    this._siteListController = siteListController;

    this._addSiteController.onAddSite.addListener(this._onAddSite.bind(this));
    this._siteListController.onSelectedSiteChange.addListener(this.selectSite.bind(this));

    this._siteListInit = false;
    this._lastSiteAdded = false;
  }

  selectSite()
  {
    if (!this._siteListInit) {
      this._siteListInit = true;

      URLUtils.getActiveTabUrl().then(siteUrl => {
        if (this._settingsManager.hasSite(siteUrl))
          this._siteListController.setSelectedSite(siteUrl);
      });

    } else if (this._lastSiteAdded) {
      let siteUrl = this._lastSiteAdded;
      this._lastSiteAdded = '';
      this._siteListController.setSelectedSite(siteUrl);
    }
  }

  _onAddSite(siteUrl)
  {
    this._lastSiteAdded = siteUrl;
  }
}


/* Remove Site Controller */
class RemoveSiteController
{
  constructor(settingsManager, selectSiteController)
  {
    this._settingsManager = settingsManager;
    this._selectSiteController = selectSiteController;

    this._removeEl = $('.site-list a');

    this._removeEl.addEventListener('click', this.removeSite.bind(this));
    this._selectSiteController.onSelectedSiteChange.addListener(this._toggleVisibility.bind(this));
  }

  removeSite()
  {
    let siteUrl = this._selectSiteController.getSelectedSite();
    this._settingsManager.removeSite(siteUrl);
  }

  _toggleVisibility()
  {
    let site = this._selectSiteController.getSelectedSite();
    this._removeEl.style.visibility = (site === 'global') ? 'hidden' : 'visible';
  }
}


/* Site Settings Controller */
class SiteSettingsController
{
  constructor(settingsManager, selectSiteController)
  {
    this._settingsManager = settingsManager;
    this._selectSiteController = selectSiteController;

    this._optionEls = {
      'imgBlock': $('#imgBlock'),
      'mediaBlock': $('#mediaBlock'),
      'videoHide': $('#videoHide'),
      'flashHide': $('#flashHide'),
      'canvasHide': $('#canvasHide'),
      'svgHide': $('#svgHide'),
      'downloadImgs': $('#downloadImgs')
    };

    document.body.addEventListener('click', this._onClick.bind(this));
    this._selectSiteController.onSelectedSiteChange.addListener(this.updateElementState.bind(this));
    this._settingsManager.onSiteSettingsChange.addListener(this.updateElementState.bind(this));
  }

  updateElementState()
  {
    let site = this._selectSiteController.getSelectedSite();
    let settings = this._settingsManager.getSiteSettings(site);

    for (let optionId in this._optionEls) {
      if (settings[optionId])
        this._optionEls[optionId].classList.add('active');
      else
        this._optionEls[optionId].classList.remove('active');
    }
  }

  _onClick(e)
  {
    let optionId = e.target.id;

    if (!this._optionEls[optionId])
      return;

    if (optionId === 'downloadImgs')
      return ImageDownloadRequester.requestDownload();

    let site = this._selectSiteController.getSelectedSite();
    this._toggleSiteSettings(site, optionId);
  }

  _toggleSiteSettings(site, optionId)
  {
    let settings = this._settingsManager.getSiteSettings(site);
    settings[optionId] = !settings[optionId];

    this._settingsManager.setSiteSettings(site, settings);
  }
}


class ImageDownloadRequester
{
  static requestDownload()
  {
    // Send request to content_script.js
    browser.tabs.query({currentWindow: true, active: true})
      .then(tabs => {
        browser.tabs.sendMessage(tabs[0].id, {downloadImages: true});
      });
  }
}


/* Password Protection Controller */
class PasswordProtectionController
{
  constructor(addonSettingsManager)
  {
    this._addonSettingsManager = addonSettingsManager;

    this._elements = {
      'unlocker': $('#unlocker'),
      'content': $('#content'),
      'passwordInput': $('#password-input'),
      'unlockBtn': $('#unlock-btn')
    };

    this._addonSettingsManager.onInit.addListener(this._toggleAccess.bind(this));

    this._elements.unlockBtn.addEventListener('click', this._unlock.bind(this));
    this._elements.passwordInput.addEventListener('keypress', e => {
      if (e.key === 'Enter') this._unlock();
    });
  }

  _toggleAccess()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    let enabled = addonSettings.passwordEnabled;

    this._elements.unlocker.style.display = enabled ? 'block' : 'none';
    this._elements.content.style.display = enabled ? 'none' : 'block';
  }

  _unlock()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    let unlocked = this._elements.passwordInput.value === addonSettings.password;

    this._elements.unlocker.style.display = unlocked ? 'none' : 'block';
    this._elements.content.style.display = unlocked ? 'block' : 'none';
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

    this._initStorage();  // Initial
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
    if (!newData.siteSettings)
      return;

    let oldSettings = this._cacheSiteSettings;
    let newSettings = Object.assign({global: {}}, newData.siteSettings.newValue);

    this._siteSettings = newSettings;
    this._cacheSiteSettings = JSON.parse(JSON.stringify(this._siteSettings));

    this._fireChanges(oldSettings, newSettings);
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


/* Addon Settings Manager */
class AddonSettingsManager
{
  constructor()
  {
    this._addonSettings = {};

    this._DEFAULT_SETTINGS = {
      keyboardShortcutsEnabled: true,
      contextMenuEnabled: true,
      passwordEnabled: false,
      password: ''
    };

    this.onChange = new EventEmitter();
    this.onInit = new EventEmitter();

    browser.storage.onChanged.addListener(this._onStorageChange.bind(this));

    this._initStorage();  // Initial
  }

  getSettings()
  {
    let addonSettings = Object.assign({}, this._DEFAULT_SETTINGS, this._addonSettings);
    return JSON.parse(JSON.stringify(addonSettings));
  }

  setSettings(newSettings)
  {
    this._addonSettings = Object.assign(this._addonSettings, newSettings);
    this._saveSettings();
  }

  _saveSettings()
  {
    browser.storage.local.set({addonSettings: this._addonSettings});
  }

  _initStorage()
  {
    browser.storage.local.get().then(data => {
      this._addonSettings = Object.assign(this._DEFAULT_SETTINGS,
                                          data.addonSettings);
      // Initial
      this.onChange.fire();
      this.onInit.fire();
    });
  }

  _onStorageChange(newData)
  {
    if (!newData.addonSettings)
      return;

    this._addonSettings = Object.assign(this._DEFAULT_SETTINGS,
                                        newData.addonSettings.newValue);
    this.onChange.fire();
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


$('#closeWindow').addEventListener('click', _ => {
  window.close();

  // Android popup close workaround
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1433604#c5
  browser.tabs.update({active: true});
});


// Init
let settingsManager = new SettingsManager();
let addSiteController = new AddSiteController(settingsManager);
let siteListController = new SiteListController(settingsManager);
let selectSiteHandler = new SelectSiteHandler(settingsManager, addSiteController, siteListController);
let removeSiteController = new RemoveSiteController(settingsManager, siteListController);
let siteSettingsController = new SiteSettingsController(settingsManager, siteListController);
let addonSettingsManager = new AddonSettingsManager();
let passwordProtectionController = new PasswordProtectionController(addonSettingsManager);
