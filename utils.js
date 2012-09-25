"use strict"
/** Firefox 3.6 doesn't implement the Object.create function. Let's do it ourselves in the case where it doesn't exist already. Requires the non-standard __proto__ property. */
if(typeof Object.create !== "function") {
  if(console && console.warn) console.warn("Implementing Object.create in custom code");
  Object.create = function(proto) {
    var obj = new Object();
    obj.__proto__ = proto;
    return obj;
  }
}
/** If it's an arry just return it. If not, wrap it in an array. */
function wrapArray(obj) {
  if(toString.call(obj) === '[object Array]') 
    return obj;
  else 
    return [obj];
}
/** http://stackoverflow.com/questions/985272/jquery-selecting-text-in-an-element-akin-to-highlighting-with-your-mouse/2838358#2838358 */
function selectElementText(el, win) {
    win = win || window;
    var doc = win.document, sel, range;
    if (win.getSelection && doc.createRange) {
        sel = win.getSelection();
        range = doc.createRange();
        range.selectNodeContents(el);
        sel.removeAllRanges();
        sel.addRange(range);
    } else if (doc.body.createTextRange) {
        range = doc.body.createTextRange();
        range.moveToElementText(el);
        range.select();
    }
}
/** http://bugs.jquery.com/ticket/3368 */
function isJustCommandKey(keyEvent) {
  var isMac = /^Mac/.test(window.navigator.platform);
  if(isMac) return keyEvent.metaKey && !keyEvent.ctrlKey;
  else keyEvent.ctlKey;
}
/** Replace < and & for literal dispaly in HTML */
function escapeForHTML(str) {
  if(typeof str === "undefined") return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;")
}

/** Hack to center a modal dialog */
jQuery.fn.center = function() {
  this.css("position", "absolute");
  this.css("top", (($(window).height() - this.outerHeight()) / 2) + $(window).scrollTop() + "px");
  this.css("left", (($(window).width() - this.outerWidth()) / 2) + $(window).scrollLeft() + "px");
  return this;
}