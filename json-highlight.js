/**
 * Turns JSON into semantic HTML for display (and beyond).
 * json <String>: The JSON to
 * handler <Function<String>>: The function to call upon successful conversion
 * options <Object>
 * errorHandler <Function<Object>>: The function to call in the event of an error
 */
function highlightJSON(json, handler, options, errorHandler) {
  "use strict"
  // Accumulates HTML as the parsing happens. Concatenated in the send function.
  var accumulator = [];
  // Local state
  var stack = [];
  var parser = exports.parser(options);
  var options = options || {}, 
    truncate = options.truncate || -1,
    textCollapse = options.textCollapse || 100,
    tabIndex = options.tabIndex || 1;
  
  /* Utils */
  // Checks the stack to see what the top is. Possible values are 
  // "object", "array", or "key-value"
  function isIn(type) {
    function top() {
      if(stack.length < 1) return undefined;
      return stack[stack.length - 1]; 
    }
    if(stack.length < 1) return false;
    return top() === type;
  }
  // If we're processing a key-value, close its div and pop it off the stack
  function popKV() {
    if(isIn("key-value")) {
      stack.pop();
      //accumulator.push("END-KV " + stack[stack.length - 1]);
      if(isIn("object")) accumulator.push('<span class="json-separator">, </span>');
      accumulator.push("</div>");
    }
  }
  // This is UGLY. It goes up the stack and finds the first json-separator and removes it.
  // This is useful for removing the final separator when closing object key-values and array values
  function popLastSeparator(context /* Only used for debugging */) {
    var len = accumulator.length;
    for(var i = len - 1; i >= 0; i--) {
      if(/json-array/.test(accumulator[i]) || /json-object/.test(accumulator[i])) break;
      if(/json-separator/.test(accumulator[i])) {
        //<span style="background: yellow;">REMOVED from ' + context + '</span>
        accumulator[i] = '<!-- removed json-separator -->';
        return;
      }
    }
  }

  /* Parsers handlers */
  parser.onready = function() { }
  parser.onerror = function(error) {
    // console.error(error);
    // TODO: Unroll stack here
    errorHandler(error);
  }
  parser.onvalue = function(v) {
    var quote = '';
    var type = typeof v;
    if("object" === type && !v) type = "null";
    if("string" === type) {
      quote = '"';
      v = escapeForHTML(v);
    }
    if(isIn("array")) accumulator.push('<div class="json-array-item">')
    accumulator.push('<span class="json-value">' + quote + '<span class="json-' + type + '">' + v + '</span>' + quote);
    if(isIn("array")) accumulator.push('<span class="json-separator">, </span>');
    accumulator.push('</span>'); // closes .json-value
    if(isIn("array")) accumulator.push('</div>'); // closes .json-array-item
    popKV();
  };
  parser.onopenobject = function(key) {
    // opened an object. key is the first key.
    if(isIn("array")) accumulator.push('<div class="json-array-item">');
    stack.push("object");
    accumulator.push('<div class="json-object">');
    accumulator.push('<span class="toggle"></span><span class="json-object-open">{</span>');
    accumulator.push('<div class="json-object-value">');
    if(key) accumulator.push(doKey(key));
  };
  parser.oncloseobject = function () {
    stack.pop()
    // Hack to remove the last trailing comma on the child key-value pairs
    popLastSeparator("oncloseobject");
    accumulator.push('</div><span class="json-object-close">}</span>');
    accumulator.push('</div>');
    popKV();
    if(isIn("array")) {
      accumulator.push('<span class="json-separator">, </span>');
      accumulator.push('</div>'); // closes .json-array-item
    }
  };
  
  parser.onkey = function(key) {
    // Got a key in an object, numbers 2 to n. The first key is in the openobject event, curiously.
    doKey(key);
  };
  function doKey(key) {
    stack.push("key-value");
    accumulator.push('<div class="json-key-value">'); // closed in popKV()
    accumulator.push('<span class="json-key">"<span class="json-key-name">' + key + '</span>": </span>');
  }
  parser.onopenarray = function () {
    //console.log("openarray");
    if(isIn("array")) accumulator.push('<div class="json-array-item">');
    stack.push("array");
    accumulator.push('<div class="json-array"><span class="toggle"></span><span class="json-array-open">[</span>');
    accumulator.push('<div class="json-array-value">')
  };
  parser.onclosearray = function () {
    if(isIn("array")) popLastSeparator("onclosearray");
    accumulator.push('</div>'); // closing div.json-array-value
    accumulator.push('<span class="json-array-close">]</span>');
    stack.pop();
    accumulator.push('</div>'); // closes .json-array
    popKV();
    if(isIn("array")) {
      accumulator.push('<span class="json-separator">, </span>');
      accumulator.push('</div>'); // closes .json-array-item
    }
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
      console.warn("TODO: Need to implement stack unroll in the case of truncation");
      for(var i = stack.length - 1; i >= 0; i--) {
        // Close element and element-value blocks due to truncation
        // TODO: This should happen more elegantly than chopped off elements
        // TODO: There should really be some interactive way to lazily format the next chunk
        //cleanUp.push('<!-- stack: ' + stack[i] + ' --></div></div>');
      }
      //message = '<div class="message">For performance reasons, you’re only looking at the first ' + options.truncate + '-character chunk. To see the full result, output the query as raw text.</div>';
    }
    // FIXME: This is test code. It's expsensive and doesn't belong here
    //var outcomes = testJSON(accumulator.join("")) //, ['data[0].firstName === "Wayne"']);
    //if(outcomes.length > 0) console.dir(outcomes);
    // FIXME: End test 
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