// options.js
// jshint esversion: 6


var $ = document.querySelector.bind(document);


class KeyboardShortcutsChanger
{
  constructor()
  {
    this._elements = {
      'imgBlock': $('#keyboard-imgBlock'),
      'mediaBlock': $('#keyboard-mediaBlock'),
      'videoHide': $('#keyboard-videoHide'),
      'flashHide': $('#keyboard-flashHide'),
      'canvasHide': $('#keyboard-canvasHide'),
      'svgHide': $('#keyboard-svgHide')
    };

    for (let e in this._elements)
      this._elements[e].addEventListener('change', this._onElementValueChange.bind(this));

    this._populate();  // Initial
  }

  _populate()
  {
    browser.commands.getAll().then(commands => {
      for (let command of commands)
        this._elements[command.name].value = command.shortcut;
    });
  }

  _onElementValueChange(e)
  {
    let name = e.target.id.replace('keyboard-', '');
    let shortcut = e.target.value;

    let success = this._updateKeyboardShortcut(name, shortcut);
    this._displayValidateStatus(e.target, success);
  }

  _updateKeyboardShortcut(name, shortcut)
  {
    try {
      browser.commands.update({name: name, shortcut: shortcut});
      return true;

    } catch (e) {
      return false;
    }
  }

  _displayValidateStatus(el, success)
  {
    el.style.border = success ? '2px solid GREEN' : '2px solid RED';
  }
}


class ContextMenuToggler
{
  constructor(addonSettingsManager)
  {
    this._addonSettingsManager = addonSettingsManager;

    this._element = $('#context-menu');

    this._element.addEventListener('change', this._onElementChange.bind(this));
    this._addonSettingsManager.onInit.addListener(this._initCheckedState.bind(this));
  }

  _initCheckedState()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    this._element.checked = addonSettings.contextMenuEnabled;
  }

  _onElementChange(e)
  {
    let checked = e.target.checked;
    this._addonSettingsManager.setSettings({contextMenuEnabled: checked});
  }
}


/* Addon Settings Manager */
class AddonSettingsManager
{
  constructor()
  {
    this._addonSettings = {};
    this._DEFAULT_SETTINGS = {contextMenuEnabled: true};

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
new KeyboardShortcutsChanger();
new ContextMenuToggler(new AddonSettingsManager());
