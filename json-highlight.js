function highlightJSON(json, handler, options, errorHandler) {
  "use strict"
  var WHITESPACE = /^\s+$/; // all whitespace
  // Accumulates HTML as the parsing happens. Concatenated in the send function.
  var accumulator = [];
  // Local state
  var stack = [], justOpenedArray = false;
  console.dir(exports);
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
  
  parser.onready = function() { console.log("ready!")}
  parser.onerror = function(error) {
    console.error(error);
    // TODO: Unroll stack here
    errorHandler(error);
  }
  
  
  parser.onvalue = function(v) {
    // got some value.  v is the value. cant be string, int, bool, and null.
    //console.log("value: " + v);
    console.log(stack.join(", "));
    if(isInArray() && !justOpenedArray) accumulator.push(", ");
    var quote = '';
    var type = typeof v;
    if("object" === type && !v) type = "null";
    if("string" === type) quote = '"'
    accumulator.push('<span class="json-value">' + quote + '<span class="json-value json-' + type + '">' + v + '</span>' + quote + '</span>');
    justOpenedArray = false;
    popKV();
  };
  function popKV() {
    if(top() === "key-value") {
      accumulator.push("</div>");
      stack.pop();
    }
  }
  parser.onopenobject = function(key) {
    // opened an object. key is the first key.
    //console.log("openobject: " + key);
    //if(stack[stack.length - 1] === "array") accumulator.push(", ");
    stack.push("object");
    accumulator.push('<div class="json-object"><span class="json-object-open">{</span><div class="json-object-value">');
    if(key) accumulator.push(doKey(key));
    justOpenedArray = false;
  };
  parser.oncloseobject = function () {
    // closed an object.
    //console.log("closeobject");
    console.log("Popping (object) " + stack.pop());
    console.log("> " + stack.join(", "));
    accumulator.push('</div><span class="json-object-close">}</span>');
    if(isInArray()) accumulator.push(", ");
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
    accumulator.push('<div class="json-array"><span class="json-array-open">[</span>');
    accumulator.push('<div class="json-array-value">')
    justOpenedArray = true;
  };
  parser.onclosearray = function () {
    // closed an array.
    //console.log("closearray");
    accumulator.push('</div>'); // closing div.json-array-value
    accumulator.push('<span class="json-array-close">]</span></div>');
    console.log("Popping (array) " + stack.pop());
    console.log("> " + stack.join(", "));
    popKV();
  };
  
  
  
  
/*    
  
  p.onopentag = function(node) {
    //console.dir(node.name);
    var attrs = []
    var ns = []
    for(a in node.attributes) {
      //console.dir(a);
      var attr = node.attributes[a];
      if(a.substr(0, 5) === "xmlns") {
        var prefix = "";
        if(":" === a[5]) {
          prefix = ":<span class='namespace-prefix'>" + a.substring(6) + "</span>";
        }
        ns.push(" <span class='namespace'><span class='xmlns'>xmlns</span>" + prefix + "=&quot;<span class='namespace-uri'>" + node.attributes[a].value + "</span>&quot;</span>")
      } else {
        attrs.push(" <span class='attribute' title='"+attr.name+" ("+attr.uri+")' data-attribute-name='"+attr.name+"' data-attribute-localname='"+attr.local+"' data-attribute-prefix='"+attr.prefix+"' data-attribute-namespace-uri='"+attr.uri+"' data-attribute-value='"+attr.value+"'><span class='attribute-name'>" + parsePrefix(a) + "</span>=&quot;<span class='attribute-value'>" + prepareText(attr.value) + "</span>&quot;</span>");
      }
    }
    accumulator.push("<div class='element' data-element-name='"+node.name+"' data-element-prefix='"+node.prefix+"' data-element-localname='"+node.local+"' data-element-namespace-uri='"+node.uri+"'><span class='toggle'></span><span class='element-open' tabindex='" + tabIndex + "'>&lt;<span class='element-name' title='"+node.name+" ("+node.uri+")'>" + parsePrefix(node.name) + "</span><span class='element-meta'>" + attrs.join("") + ns.join("") + '</span>');
    accumulator.push("&gt;</span><div class='element-value'>");
    //console.log("Pushing " + node.name);
    stack.push(node.name);
  }
  p.onclosetag = function(name) {
    accumulator.push("</div>"); // element-value
    accumulator.push("<span class='element-close'>&lt;/<span class='element-name'>" + name + "</span>&gt;</span></div>");
    //console.log("Popping " + name);
    stack.pop();
  }
  function prepareText(text) {
    return text
      .replace(/</gm, "&lt;")
      .replace(/\n/gm, "<br/>")
      .replace(/\t/gm, "&nbsp;&nbsp;");
  }
  p.ontext = function(text) {
    // Whether to collapse a simple text node (still wonky). Currently implemented at the client
    var shortFlag = "";
    if(!WHITESPACE.test(text)) { // if it's only whitespace. This feels dangerous.
      accumulator.push("<div class='text" + shortFlag + "'>" + prepareText(text) + "</div>");
    }
  }
  p.oncomment = function(comment) {
    accumulator.push("<div class='comment'><span class='toggle'></span><span class='comment-open' tabindex='" + tabIndex + "'>&lt;--</span><div class='comment-value'>" + prepareText(comment) + "</div><span class='comment-close'>--&gt;</span></div>");
  }
  p.onprocessinginstruction = function(pi) {
    accumulator.push('<div class="processing-instruction"><span class="toggle"></span><span class="processing-instruction-open" tabindex="' + tabIndex + '">&lt;?</span><span class="processing-instruction-value"><span class="processing-instruction-name">' + pi.name + '</span> <span class="processing-instruction-body"> ' + pi.body + '</span></span><span class="processing-instruction-close">?></span></div>');
  }
  p.onopennamespace = function(prefix, uri) {
      //console.dir(arguments);
  }
*/
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
