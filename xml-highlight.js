  function highlight(xml, handler, options, errorHandler) {
    var WHITESPACE = /^\s+$/; // all whitespace
    // Accumulates HTML as the parsing happens. Concatenated in the send function.
    var accumulator = [];
    // Keeps track of elements whose start tags have been parsed, 
    // but whose end tags haven't been encountered. This is 
    // required to clean up the unclosed elements in the case 
    // that the XML is truncated.
    var stack = [];
    var p = new exports.SAXParser(true, {xmlns: true});
    var options = options || {}, 
      truncate = options.truncate || -1,
      textCollapse = options.textCollapse || 100,
      tabIndex = options.tabIndex || 1;

    // Parse a qname into its prefix and local parts
    function parsePrefix(qname) {
      var tokens = qname.split(":");
      if(2 === tokens.length) {
        return "<span class='namespace-prefix'>" + tokens[0] + "</span>:" + parsePrefix(tokens[1]);
      } else {
        return "<span class='local-name'>" + qname + "</span>";
      }
    }
    p.onready = function() {}
    p.onerror = function(error) {
      console.warn("Truncating result to " + options.truncate + " characters");
      //console.dir(stack);
      //errorHandler(error);
    }
    p.onopentag = function(node) {
      //console.dir(node.name);
      var attrs = []
      var ns = []
      for(a in node.attributes) {
        var attr = node.attributes[a];
        console.dir(attr);
        if(a.substr(0, 5) === "xmlns") {
          var prefix = "";
          if(":" === a[5]) {
            prefix = ":<span class='namespace-prefix'>" + a.substring(6) + "</span>";
          }
          ns.push(" <span class='namespace'><span class='xmlns'>xmlns</span>" + prefix + "=&quot;<span class='namespace-uri'>" + node.attributes[a].value + "</span>&quot;</span>")
        } else {
          attrs.push(" <span class='attribute'><span class='attribute-name'>" + parsePrefix(a) + "</span>=&quot;<span class='attribute-value'>" + prepareText(node.attributes[a].value) + "</span>&quot;</span>");
        }
      }
      accumulator.push("<div class='element' data-namespace-uri='"+node.uri+"' data-namespace-prefix='"+node.prefix+"' data-local-name='"+node.local+"'><span class='element-open' tabindex='" + tabIndex + "'>&lt;<span class='element-name'>" + parsePrefix(node.name) + "</span><span class='element-meta'>" + attrs.join("") + ns.join("") + '</span>');
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
      accumulator.push("<div class='comment'><span class='comment-open' tabindex='" + tabIndex + "'>&lt;--</span><div class='comment-value'>" + prepareText(comment) + "</div><span class='comment-close'>--&gt;</span></div>");
    }
    p.onprocessinginstruction = function(pi) {
      accumulator.push('<div class="processing-instruction"><span class="processing-instruction-open" tabindex="' + tabIndex + '">&lt;?</span><span class="processing-instruction-value"><span class="processing-instruction-name">' + pi.name + '</span> <span class="processing-instruction-body"> ' + pi.body + '</span></span><span class="processing-instruction-close">?></span></div>');
    }
    p.onopennamespace = function(prefix, uri) {
        //console.dir(arguments);
    }
    p.onend = function() {
      send();
    }
    function send() {
      var cleanUp = [];
      var message = "";
      //console.dir(stack);
      //console.log(p.state);
      if(stack.length > 0) {
        for(var i = stack.length - 1; i >= 0; i--) {
          /* Close element and element-value blocks due to truncation */
          /* TODO: This should happen more elegantly than chopped off elements */
          /* TODO: There should really be some interactive way to lazily format the next chunk */
          cleanUp.push('<!-- stack: ' + stack[i] + ' --></div></div>');
        }
        message = '<div class="message">For performance reasons, you’re only looking at the first ' + options.truncate + '-character chunk. To see the full result, output the query as raw text.</div>';
      }
      handler(
        "\n\n<!-- START XML-HIGHLIGHT -->" + 
        "<div class='root'>" + 
          accumulator.join("") + 
          cleanUp.join("") + 
        "</div>"
        + "<!-- END XML-HIGHLIGHT -->\n\n"
        + message
      );
    }
    p.write(-1 === options.truncate ? xml : xml.substring(0, options.truncate)).close();
  }
