xquery version "1.0-ml";
declare namespace dir="http://marklogic.com/xdmp/directory";
declare option xdmp:output "method=html"; (: This causes PIs to be serialized incorrectly :)
(: There's no way to get a file relative to a module, so you'll have to set this path to the location of index.xqy :)
declare variable $HOME as xs:string := "/Users/jmakeig/Workspaces/xml-highlight/";
xdmp:set-response-content-type("text/html"),
'<!DOCTYPE html>',
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>xml-highlight</title>
  <script type="text/javascript">
    // Intentionally global: Used for NPM-style imports in sax.js and clarinet.js.
    exports = {{}}
  </script>
  <script type="text/javascript" src="lib/underscore-min.js">//</script>
  <script type="text/javascript" src="lib/jquery-1.8.2-min.js">//</script>
  <script type="text/javascript" src="lib/base64.js">//</script>
  <script type="text/javascript" src="utils.js">//</script>
  <script type="text/javascript" src="lib/tmpl.js">//</script>
  <script type="text/javascript" src="lib/sax.js">//</script>
  <script type="text/javascript" src="lib/clarinet.js">//</script>
  <script type="text/javascript" src="xml-highlight.js">//</script>
  <script type="text/javascript" src="json-highlight.js">//</script>
  <script  type="text/javascript" src="http://d1n0x3qji82z53.cloudfront.net/src-min-noconflict/ace.js">//</script>
  <script type="text/javascript" src="index.js">//</script>
  <link type="text/css" rel="stylesheet" href="xml-highlight.css"/>
  <link type="text/css" rel="stylesheet" href="index.css"/>
</head>
<body>
  <!--<div id="Navigation"><a href="#input">Input</a> <a href="#output">Output</a> <a href="#errors">Errors</a></div>-->
  <section>
    <div class="h"><h1 id="input">Input</h1></div>
    <div>
      <div class="control">
        <label for="input-xml">Pre-sets</label>
        <select id="input-xml-source">
          <option selected="selected"></option>
        {
          try {
          for $e in xdmp:filesystem-directory($HOME || "test/inputs")/dir:entry
          return <option>{string($e/dir:filename)}</option>
          } catch($error) {
            xdmp:log($HOME || " could not be opened for reading. Proceeding without any pre-sets.", "warning")
          }
        }
        </select>
      </div>
      <div class="control">
      <div id="error-message">&nbsp;</div>
      <div class="label"><label for="input-xml">Input XML</label></div>
        <!--<textarea id="input-xml" spellcheck="false"></textarea>-->
        <div id="input-xml"></div>
      </div>
      <h2 id="options">Options</h2>
      <div>
        <div class="control"><label for="truncate">Truncate</label> <input id="truncate" value="-1"/> <span class="guide">Truncate to approximately this number of characters. <code>-1</code> for no truncation.</span></div>
        <div class="control"><label for="results-max">Maximum number of results</label> <input id="results-max" value="-1"/> <span class="guide">The maximum number of results to display.</span></div>
        <div class="control"><label for="short-max">Maximum inline size</label> <input id="short-max" value="100"/> <span class="guide">The maximum number of characters in an element to cause that element’s value to display inline.</span></div>
      </div>
      <div>
        <button id="run">Highlight</button>
        <button id="validate">Validate</button>
      </div>
    </div>
  </section>
  <section>
    <h1 id="out">Output</h1>
    <div>
      <div id="output-tools">
        <button id="collapse-all">Collapse All</button>
        <button id="expand-all">Expand All</button>
        <span class="total"></span>
        <input type="checkbox" id="hide-close-tags"/><label for="hide-close-tags">Hide close tags?</label>
      </div>
      <div id="output" tabindex="10"></div>
    </div>
  </section>
  <section>
    <div><h1 id="errors">Errors</h1></div>
    <div id="ErrorLog">
      <!--<button id="errors-clear">Clear</button>-->
      <!--
      <div>
        <ol class="log-levels">{
        for $level in ('emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'config', 'debug', 'fine', 'finer', 'finest')
        return <li><label><input type="checkbox" checked="checked"/><span class="{$level}">{$level}</span></label></li>
      }</ol></div>
      -->
      <table>
        <col class="log-level" />
        <col class="log-date" />
        <col class="log-time" />
        <col />
        <col class="log-message" />
        <thead>
          <tr>
            <th scope="col"><!--Level--></th>
            <th scope="col">Date</th>
            <th scope="col">Time</th>
            <th scope="col">Level</th>
            <th scope="col">Message</th>
          </tr>
        </thead>
        <tbody><!-- --></tbody>
      </table>
    </div>
  </section>
  <div id="node-details"><!-- Populated by rendered #node_details_template --></div>
  <script type="text/html;template" id="node_details_template">

    <div class="detail-close">X</div>
    <h3 class="detail-localname"><?_- element.localname ??></h3>  
    <div class="detail-localname"><?_- element["namespace-uri"] ??></div>
    <div class="detail-estimate"><?_- element.estimate ??></div>
    <h4>Element Range Indexes</h4>
    <?_ if("range-element-indexes" in database) { ??>
    <table>
      <tr><th>Type</th><th>Positions</th></tr>
      <?_
        var ri = database["range-element-indexes"];
        for(var i=0; i < ri.length; i++) {
      ??>
      <tr>
        <td>
          <?_- ri[i]["scalar-type"] ??> 
          <?_- ri[i].collation ??>
        </td>
        <td><?_- ri[i]["range-value-positions"] ??></td>
      </tr>
      <?_ } ??>
    </table>
    <?_ } ??>
    <h4>Fields</h4>
    <?_ if("fields" in database) { ??>
    <table>
      <tr><th>Name</th><th>Includes</th><th>Excludes</th><th>Range Indexes</th></tr>
      <?_
        var fields = database.fields;
        for(var i=0; i < fields.length; i++) {
      ??>
      <tr>
        <td><?_- fields[i]["field-name"] ??></td>
        <td><ul><li></li></ul></td>
        <td><ul><li></li></ul></td>
        <td></td>
      </tr>
      <?_ } ??>
    </table>
    <?_ } ??>
  </script>
  <script type="text/html;template" id="document_info_template">
    <!-- FIXME: What's the best way to actually show this? -->
    <h3><?_- (uri ? uri : "Synth") ??></h3>
    <div>
      <table>
      <?_ for(var el in elements) { ??>
        <tr>
          <td><?_- el ??></td><td><?_- elements[el].count ??></td>
          <td>
            <?_ for(var p in elements[el].paths) { ??>
              <div><?_- p ??></div>
            <?_ } ??>
          </td>
        </tr>
      <?_ } ??>
      </table>
    </div>
  </script>
</body>
</html>
