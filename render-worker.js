var exports = {}
var window = {}

// Escape text for HTML, including line breaks
function prepareText(text) {
  return text
    .replace(/&/gm, "&amp;")
    .replace(/</gm, "&lt;")
    //.replace(/[\n\r]/gm, "<br/>")
    .replace(/\t/gm, "&nbsp;&nbsp;");
}
/** Replace < and & for literal dispaly in HTML */
function escapeForHTML(str) {
  if(typeof str === "undefined") return "";
  return prepareText(str)
    .replace(/[\n\r]/gm, "<br/>");
}

self.importScripts("lib/sax.js", "xml-highlight.js");
self.importScripts("lib/clarinet.js", "json-highlight.js");
self.onmessage = function(event) {
  if("json-basic" === event.data.type) {
    highlightJSON(event.data.content, function(html) {
      self.postMessage({"id": event.data.id, "html": html});
    });
  } else {
    highlight(event.data.content, function(html, info) {
      self.postMessage({"id": event.data.id, "html": html, "info": info});
    });
  }
};