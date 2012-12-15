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
  <script type="text/javascript" src="utils.js">//</script>
  <script type="text/javascript" src="lib/balloon.js">//</script>
  <script type="text/javascript" src="lib/tmpl.js">//</script>
  <script type="text/javascript" src="lib/sax.js">//</script>
  <script type="text/javascript" src="lib/clarinet.js">//</script>
  <script type="text/javascript" src="xml-highlight.js">//</script>
  <script type="text/javascript" src="json-highlight.js">//</script>
  <script type="text/javascript" src="lib/codemirror.js">//</script>
  <script type="text/javascript" src="lib/xquery.js">//</script>
  <script type="text/javascript" src="index.js">//</script>
  <link type="text/css" rel="stylesheet" href="lib/balloon.css"/>
  <link type="text/css" rel="stylesheet" href="lib/codemirror.css"/>
  <link type="text/css" rel="stylesheet" href="lib/xquery.css"/>
  <link type="text/css" rel="stylesheet" href="xml-highlight.css"/>
  <link type="text/css" rel="stylesheet" href="index.css"/>
</head>
<body>
  <section>
    <div class="h"><h1 id="input">Input</h1></div>
    <div>
      <div class="control">
        <label for="input-xml">Source</label>
        <select id="input-xml-source">
          <option selected="selected"></option>
        {
          for $e in xdmp:filesystem-directory($HOME || "test/inputs")/dir:entry
          return <option>{string($e/dir:filename)}</option>
        }
        </select>
      </div>
      <div class="control">
      <div id="error-message">&nbsp;</div>
      <div class="label"><label for="input-xml">Input XML</label></div>
        <textarea id="input-xml" spellcheck="false"></textarea>
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
    <div><h1 id="outputH">Output</h1></div>
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
      <input type="text" id="ErrorsFilter"/>
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
    <h3 class="detail-localname"><?tmpl- element.localname ??></h3>  
    <div class="detail-localname"><?tmpl- element["namespace-uri"] ??></div>
    <div class="detail-estimate"><?tmpl- element.estimate ??></div>
    <h4>Element Range Indexes</h4>
    <?tmpl if("range-element-indexes" in database) { ??>
    <table>
      <tr><th>Type</th><th>Positions</th></tr>
      <?tmpl
        var ri = database["range-element-indexes"];
        for(var i=0; i < ri.length; i++) {
      ??>
      <tr>
        <td>
          <?tmpl- ri[i]["scalar-type"] ??> 
          <?tmpl- ri[i].collation ??>
        </td>
        <td><?tmpl- ri[i]["range-value-positions"] ??></td>
      </tr>
      <?tmpl } ??>
    </table>
    <?tmpl } ??>
    <h4>Fields</h4>
    <?tmpl if("fields" in database) { ??>
    <table>
      <tr><th>Name</th><th>Includes</th><th>Excludes</th><th>Range Indexes</th></tr>
      <?tmpl
        var fields = database.fields;
        for(var i=0; i < fields.length; i++) {
      ??>
      <tr>
        <td><?tmpl- fields[i]["field-name"] ??></td>
        <td><ul><li></li></ul></td>
        <td><ul><li></li></ul></td>
        <td></td>
      </tr>
      <?tmpl } ??>
    </table>
    <?tmpl } ??>
  </script>
  <script type="text/html;template" id="document_info_template">
    <h3>Info</h3>
    <div>
      <table>
      <?tmpl for(var el in elements) { ??>
        <tr>
          <td><?tmpl- el ??></td><td><?tmpl- elements[el].count ??></td>
          <td>
            <?tmpl for(var p in elements[el].paths) { ??>
              <div><?tmpl- p ??></div>
            <?tmpl } ??>
          </td>
        </tr>
      <?tmpl } ??>
      </table>
    </div>
  </script>
</body>
</html>
