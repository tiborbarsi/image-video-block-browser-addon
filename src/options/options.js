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


new KeyboardShortcutsChanger();
