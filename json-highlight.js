function highlightJSON(json, handler, options, errorHandler) {
  "use strict"
  var WHITESPACE = /^\s+$/; // all whitespace
  // Accumulates HTML as the parsing happens. Concatenated in the send function.
  var accumulator = [];
  // Local state
  var stack = [], justOpenedArray = false;
  var parser = exports.parser(options);
  var options = options || {}, 
    truncate = options.truncate || -1,
    textCollapse = options.textCollapse || 100,
    tabIndex = options.tabIndex || 1;

  function isInArray() {
    if(stack.length < 1) return false;
    return top() === "array";
  }
  function isInObject() {
    if(stack.length < 1) return false;
    return top() === "object";
  }
  function top() {
    if(stack.length < 1) return undefined;
    return stack[stack.length - 1]; 
  }
  
  parser.onready = function() { 
    //console.log("ready!")
  }
  parser.onerror = function(error) {
    console.error(error);
    // TODO: Unroll stack here
    errorHandler(error);
  }
  
  
  parser.onvalue = function(v) {
    // got some value.  v is the value. cant be string, int, bool, and null.
    //console.log("value: " + v);
    //console.log(stack.join(", "));
    var quote = '', array = '';
    var type = typeof v;
    if("object" === type && !v) type = "null";
    if("string" === type) quote = '"'
    //if(isInArray()) array = "array-";
    accumulator.push('<span class="json-value">' + quote + '<span class="json-' + type + '">' + v + '</span>' + quote);
    accumulator.push('<span class="json-separator">, </span>');
    accumulator.push('</span>');
    justOpenedArray = false;
    popKV();
  };
  function popKV() {
    if(top() === "key-value") {
      accumulator.push("</div>");
      stack.pop();
    }
  }
  // This is UGLY. It goes up the stack and finds the first json-separator and removes it.
  // This is useful for removing the final separator when closing object key-values and array values
  function popLastSeparator() {
    var len = accumulator.length;
    for(var i = len - 1; i >= 0; i--) {
      if(/json-separator/.test(accumulator[i])) {
        accumulator[i] = "<!-- removed json-separator -->";
        return;
      }
    }
  }
  parser.onopenobject = function(key) {
    // opened an object. key is the first key.
    //console.log("openobject: " + key);
    //if(stack[stack.length - 1] === "array") accumulator.push(", ");
    stack.push("object");
    accumulator.push('<span class="json-object-open">{</span>');
    accumulator.push('<div class="json-object"><div class="json-object-value">');
    if(key) accumulator.push(doKey(key));
    justOpenedArray = false;
  };
  parser.oncloseobject = function () {
    // closed an object.
    //console.log("closeobject");
    //console.log("Popping (object) " + 
      stack.pop()
    //);
    //console.log("> " + stack.join(", "));
    // Hack to remove the last trailing comma on the child key-value pairs
    popLastSeparator();
    accumulator.push('</div><span class="json-object-close">}</span>');
    if(isInArray()) accumulator.push('<span class="json-separator">, </span>');
    accumulator.push('</div>');
    popKV();
  };
  
  parser.onkey = function(key) {
    // Got a key in an object, numbers 2 to n. The first key is in the openobject event, curiously.
    //console.log("key: " + key);
    doKey(key);
  };
  function doKey(key) {
    stack.push("key-value");
    accumulator.push('<div class="json-key-value">'); // closed in popKV()
    accumulator.push('<span class="json-key">"<span class="json-key-name">' + key + '</span>": </span>');
  }
  parser.onopenarray = function () {
    // opened an array.
    //console.log("openarray");
    stack.push("array");
    accumulator.push('<span class="json-array-open">[</span>');
    accumulator.push('<div class="json-array">');
    accumulator.push('<div class="json-array-values">')
    justOpenedArray = true;
  };
  parser.onclosearray = function () {
    // closed an array.
    //console.log("closearray");
    popLastSeparator();
    accumulator.push('</div>'); // closing div.json-array-values
    accumulator.push('<span class="json-array-close">]</span></div>');
    //console.log("Popping (array) " + 
      stack.pop()
    //);
    //console.log("> " + stack.join(", "));
    popKV();
  };
  parser.onend = function() {
    if(!parser.error) send();
  }
  function send() {
    var cleanUp = [];
    var message = "";
    //console.dir(stack);
    //console.log(p.state);
    if(stack.length > 0) {
      console.error(stack.join(", "));
      for(var i = stack.length - 1; i >= 0; i--) {
        // Close element and element-value blocks due to truncation
        // TODO: This should happen more elegantly than chopped off elements
        // TODO: There should really be some interactive way to lazily format the next chunk
        //cleanUp.push('<!-- stack: ' + stack[i] + ' --></div></div>');
      }
      //message = '<div class="message">For performance reasons, you’re only looking at the first ' + options.truncate + '-character chunk. To see the full result, output the query as raw text.</div>';
    }
    handler(
      "\n\n<!-- START JSON-HIGHLIGHT -->" + 
      "<div class='root'>" + 
        accumulator.join("") + 
        cleanUp.join("") + 
      "</div>"
      + "<!-- END JSON-HIGHLIGHT -->\n\n"
      + message
    );
  }
  parser.write(-1 === options.truncate ? json : json.substring(0, options.truncate)).close();
}
