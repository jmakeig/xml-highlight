  function highlight(xml, handler, options) {
    var WHITE = /^\s+$/; // all whitespace
    //console.log(xml);
    var accumulator = [];
    var stack = [];
    var ti = 0; // tabindex counter
    var p = new SAXParser(true);
    var isSent = false;
    var options = options || {}, 
      truncate = options.truncate || -1,
      textCollapse = options.textCollapse || 100,
      tabIndex = options.tabIndex || 1;
    function bail(position) {
      if(-1 === truncate) return true;
      if(!isSent && position > truncate) {
        accumulator.push("<div class='more'><a href='asdf'>Check out the text version</a></div>");
        send();
        isSent = true;
        return false;
      }
      return true;
    }
    
    function send() {
      handler("<div class='root'>" + accumulator.join("") + "</div>");
    }
    // Parse a qname into its prefix and local parts
    function parsePrefix(qname) {
      var tokens = qname.split(":");
      if(2 === tokens.length) {
        return "<span class='namespace-prefix'>" + tokens[0] + "</span>:" + parsePrefix(tokens[1]);
      } else {
        return "<span class='local-name'>" + qname + "</span>";
      }
    }
    p.onopentag = function(node) {
      if(bail(p.position)) {
        //stack.push(node.name);
        var attrs = []
        var ns = []
        for(a in node.attributes) {
          if(a.substr(0, 5) === "xmlns") {
            var prefix = "";
            if(":" === a[5]) {
              prefix = ":<span class='namespace-prefix'>" + a.substring(6) + "</span>";
            }
            ns.push("<span class='namespace'><span class='xmlns'>xmlns</span>" + prefix + "=&quot;<span class='namespace-uri'>" + node.attributes[a] + "</span>&quot;</span>")
          } else {
            attrs.push("<span class='attribute'><span class='attribute-name'>" + parsePrefix(a) + "</span>=&quot;<span class='attribute-value'>" + prepareText(node.attributes[a]) + "</span>&quot;</span>");
          }
        }
        accumulator.push("<div class='element'><span class='element-open' tabindex='" + tabIndex + "'>&lt;<span class='element-name'>" + parsePrefix(node.name) + "</span>" + attrs.join("") + ns.join(""));
        accumulator.push("&gt;</span><div class='element-value'>");
      }
    }
    p.onclosetag = function(name) {
      if(bail(p.position)) {
        //console.dir(stack);
        accumulator.push("</div>"); // element-value
        accumulator.push("<span class='element-close'>&lt;/<span class='element-name'>" + name + "</span>&gt;</span></div>");
      }
    }
    function prepareText(text) {
      return text
        .replace(/</gm, "&lt;")
        .replace(/\n/gm, "<br/>")
        .replace(/\t/gm, "&nbsp;&nbsp;");
    }
    p.ontext = function(text) {
      if(bail(p.position)) {
        // Whether to collapse a simple text node (still wonky). Currently implemented at the client
        var shortFlag = ""; //!WHITE.test(text) && text.length < textCollapse ? " short" : ""; 
        if(!WHITE.test(text)) { // if it's only whitespace. This feels dangerous.
          accumulator.push("<div class='text" + shortFlag + "'>" + prepareText(text) + "</div>");
        }
      }
    }
    p.oncomment = function(comment) {
      accumulator.push("<div class='comment'><span class='comment-open'>&lt;--</span><div class='comment-value'>" + prepareText(comment) + "</div><span class='comment-close'>--&gt;</span></div>");
    }
    p.onend = function() {
      if(!isSent) send();
    }
    p.write(xml).close();
  }