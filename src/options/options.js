// options.js
// jshint esversion: 6


var $ = document.querySelector.bind(document);


/* Keyboard Shortcuts Changer */
class KeyboardShortcutsChanger
{
  constructor(addonSettingsManager)
  {
    this._addonSettingsManager = addonSettingsManager;

    this._elements = {
      'imgBlock': $('#keyboard-imgBlock'),
      'mediaBlock': $('#keyboard-mediaBlock'),
      'videoHide': $('#keyboard-videoHide'),
      'flashHide': $('#keyboard-flashHide'),
      'canvasHide': $('#keyboard-canvasHide'),
      'svgHide': $('#keyboard-svgHide')
    };

    this._addonSettingsManager.onChange.addListener(this._enableOrDisableInput.bind(this));

    for (let e in this._elements)
      this._elements[e].addEventListener('change', this._onElementValueChange.bind(this));

    this._populate();  // Initial
  }

  _enableOrDisableInput()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    let disabled = !addonSettings.keyboardShortcutsEnabled;

    for (let e in this._elements)
      this._elements[e].disabled = disabled;
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


/* Keyboard Shortcuts Toggler */
class KeyboardShortcutsToggler
{
  constructor(addonSettingsManager)
  {
    this._addonSettingsManager = addonSettingsManager;

    this._element = $('#keyboard-checkbox');

    this._element.addEventListener('change', this._onElementChange.bind(this));
    this._addonSettingsManager.onInit.addListener(this._initCheckedState.bind(this));
  }

  _initCheckedState()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    this._element.checked = addonSettings.keyboardShortcutsEnabled;
  }

  _onElementChange(e)
  {
    let checked = e.target.checked;
    this._addonSettingsManager.setSettings({keyboardShortcutsEnabled: checked});
  }
}


/* Context Menu Toggler */
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


/* Password Protection Settings Manager */
class PasswordProtectionSettingsManager
{
  constructor(addonSettingsManager)
  {
    this._addonSettingsManager = addonSettingsManager;

    this._elements = {
      'checkbox': $('#pp-checkbox'),
      'input': $('#pp-input')
    };

    this._addonSettingsManager.onInit.addListener(this._changeCheckboxState.bind(this));
    this._addonSettingsManager.onChange.addListener(this._changeInputState.bind(this));

    this._elements.checkbox.addEventListener('change', this._onCheckboxChange.bind(this));
    this._elements.input.addEventListener('change', this._onInputChange.bind(this));
  }

  _changeCheckboxState()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    this._elements.checkbox.checked = addonSettings.passwordEnabled;
  }

  _changeInputState()
  {
    let addonSettings = this._addonSettingsManager.getSettings();
    this._elements.input.disabled = !addonSettings.passwordEnabled;
    this._elements.input.value = addonSettings.password;
  }

  _onCheckboxChange()
  {
    let state = this._elements.checkbox.checked;
    this._addonSettingsManager.setSettings({passwordEnabled: state});
  }

  _onInputChange()
  {
    let password = this._elements.input.value;
    this._addonSettingsManager.setSettings({password: password});
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
let addonSettingsManager = new AddonSettingsManager();
new KeyboardShortcutsChanger(addonSettingsManager);
new KeyboardShortcutsToggler(addonSettingsManager);
new ContextMenuToggler(addonSettingsManager);
new PasswordProtectionSettingsManager(addonSettingsManager);
