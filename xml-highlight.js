  function highlight(xml, handler, options, errorHandler) {
    var WHITESPACE = /^\s+$/; // all whitespace
    // Accumulates HTML as the parsing happens. Concatenated in the send function.
    var accumulator = [];
    // Keeps track of elements whose start tags have been parsed, 
    // but whose end tags haven't been encountered. This is 
    // required to clean up the unclosed elements in the case 
    // that the XML is truncated.
    var stack = [];
    var elements = {};
    var namespaces = {};
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
      console.error(error);
      // How do we know if it's a real error? If so, we need to invoke the error handler.
      //errorHandler(error);
      // Truncation throws a parse error as well. However, in the case of truncation we just want to clean up and proceed as normal.
      send();
    }
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
          attrs.push(" <span class='attribute' title='"+attr.name+" ("+attr.uri+")' data-attribute-name='"+attr.name+"' data-attribute-localname='"+attr.local+"' data-attribute-prefix='"+attr.prefix+"' data-attribute-namespace-uri='"+attr.uri+"' data-attribute-value='"+attr.value+"'><span class='attribute-name'>" + parsePrefix(a) + "</span>=&quot;<span class='attribute-value'>" + escapeForHTML(attr.value) + "</span>&quot;</span>");
        }
      }
      accumulator.push("<div class='element' data-element-name='"+node.name+"' data-element-prefix='"+node.prefix+"' data-element-localname='"+node.local+"' data-element-namespace-uri='"+node.uri+"'><span class='toggle'></span><span class='element-open' tabindex='" + tabIndex + "'>&lt;<span class='element-name' title='"+node.name+" ("+node.uri+")'>" + parsePrefix(node.name) + "</span><span class='element-meta'>" + attrs.join("") + ns.join("") + '</span>');
      accumulator.push("&gt;</span><div class='element-value'>");
      
      var key = "{" + (node.uri || "") + "}" + node.local; // Clark notation

      //console.log("Pushing " + node.name);
      stack.push(key);

      // Keep track of elements
      if(elements[key]) { 
        elements[key].count++ 
      } else { 
        elements[key] = { 
          "localname": node.local, 
          "namespace-uri": node.uri, 
          "count": 1, 
          "paths": {}
        } 
      } 
      var stackKey = "/" + stack.slice().join("/");
      if(elements[key].paths[stackKey]) {
        elements[key].paths[stackKey].count++;
      } else {
        elements[key].paths[stackKey] = { "count": 1 }
      }
    }
    p.onclosetag = function(name) {
      accumulator.push("</div>"); // element-value
      accumulator.push("<span class='element-close'>&lt;/<span class='element-name'>" + name + "</span>&gt;</span></div>");
      //console.log("Popping " + name);
      stack.pop();
    }

    p.ontext = function(text) {
      // Whether to collapse a simple text node (still wonky). Currently implemented at the client
      var shortFlag = "";
      if(!WHITESPACE.test(text)) { // if it's only whitespace. This feels dangerous.
        accumulator.push("<div class='text" + shortFlag + "'>" + escapeForHTML(text) + "</div>");
      }
    }
    p.oncomment = function(comment) {
      accumulator.push(buildComment(comment, tabIndex));
    }
    p.onprocessinginstruction = function(pi) {
      accumulator.push('<div class="processing-instruction"><span class="toggle"></span><span class="processing-instruction-open" tabindex="' + tabIndex + '">&lt;?</span><span class="processing-instruction-value"><span class="processing-instruction-name">' + pi.name + '</span> <span class="processing-instruction-body"> ' + pi.body + '</span></span><span class="processing-instruction-close">?></span></div>');
    }
    p.onopennamespace = function(ns /* {"prefix", "uri"} */) {
      if(namespaces[ns.uri]) {
        namespaces[ns.uri].push(ns.prefix);
      } else {
        namespaces[ns.uri] = [ns.prefix];
      }
    }
    p.onend = function() {
      // console.dir(elements);
      if(!p.error) send();
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
        + message,
        {"elements": elements, "namespaces": namespaces}
      );
    }
    p.write(-1 === options.truncate ? xml : xml.substring(0, options.truncate)).close();
  }
  function buildComment(comment, tabIndex) {
    return "<div class='comment'><span class='toggle'></span><span class='comment-open' tabindex='" + tabIndex + "'>&lt;!--</span><div class='comment-value'>" + escapeForHTML(comment) + "</div><span class='comment-close'>--&gt;</span></div>"
  }

  function buildAttribute(attr) {
    /*
        attr = {name: "", localName: "", prefix: "", namespaceURI: "", value: ""}
    */
    /*
    <span class="element-meta"> 
      <span class="attribute" title="x:href (XXXXX)" data-attribute-name="x:href" data-attribute-localname="href" data-attribute-prefix="x" data-attribute-namespace-uri="XXXXX" data-attribute-value="XXXXX binding">
        <span class="attribute-name">
          <span class="namespace-prefix">x</span>:<span class="local-name">href</span>
        </span>="
        <span class="attribute-value">XXXXX binding</span>"
      </span> 
      <span class="namespace">
        <span class="xmlns">xmlns</span>:
        <span class="namespace-prefix">x</span>="
        <span class="namespace-uri">XXXXX</span>"
      </span>
    </span>
    */
    //var attr = result.content
    var accumulator = []
    accumulator.push('<div class="root">')
    accumulator.push('<span class="naked-attribute"><span class="attribute" title="'+attr.name+' ('+(attr.namespaceURI ? '('+attr.namespaceURI+')' : '')+')" data-attribute-name="'+attr.name+'" data-attribute-localname="'+attr.localName+'" data-attribute-prefix="'+attr.prefix+'" data-attribute-namespace-uri="'+attr.prefix+'" data-attribute-value="'+attr.value+'"><span class="attribute-name">')
    if(attr.prefix) accumulator.push('<span class="namespace-prefix">'+attr.prefix+'</span>:')
    accumulator.push('<span class="local-name">'+attr.localName+'</span></span>="<span class="attribute-value">'+escapeForHTML(attr.value)+'</span>"</span>')
    if(attr.namespaceURI) accumulator.push(' <span class="namespace"><span class="xmlns">xmlns</span>:<span class="namespace-prefix">'+attr.prefix+'</span>="<span class="namespace-uri">'+attr.namespaceURI+'</span>"</span>')
    accumulator.push('</span></div>')
    return accumulator.join('')
  }
