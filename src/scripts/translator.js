// translator.js
// jshint esversion: 6


class Translator
{
  constructor()
  {
    this._regex = /__MSG_([^_]+)__/;
    this._attrs = ['title'];  // HTML attrs to translate.

    this._replaceAll();
  }

  _replaceAll()
  {
    var els = document.body.querySelectorAll('*');
    for (var i = 0; i < els.length; i++) {
      this._replaceAttrs(els[i]);
      this._replaceText(els[i]);
    }
  }

  _replaceAttrs(el)
  {
    for (var i = 0; i < this._attrs.length; i++) {
      var attr = this._attrs[i];
      var content = el[attr];

      el[attr] = this._translate(content);
    }
  }

  _replaceText(el)
  {
    var childNodes = Array.from(el.childNodes);
    var textNodes = childNodes.filter(node => node.nodeType === Node.TEXT_NODE);

    for (var i = 0; i < textNodes.length; i++) {
      var content = textNodes[i].textContent;
      textNodes[i].textContent = this._translate(content);
    }
  }

  _translate(content)
  {
    var msgKeyArr, msgKey, msg;
    while ((msgKeyArr = this._regex.exec(content)) !== null) {
      msgKey = msgKeyArr[1];
      msg = browser.i18n.getMessage(msgKey);
      content = content.replace('__MSG_' + msgKey + '__', msg);
    }
    return content;
  }
}


// Init
new Translator();
