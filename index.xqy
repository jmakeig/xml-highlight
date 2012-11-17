xquery version "1.0-ml";
declare namespace dir="http://marklogic.com/xdmp/directory";
declare option xdmp:output "method=html";
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
  <script type="text/javascript" src="lib/jquery-1.8.2-min.js">//</script>
  <script type="text/javascript" src="utils.js">//</script>
  <script type="text/javascript" src="lib/tmpl.js">//</script>
  <script type="text/javascript" src="lib/sax.js">//</script>
  <script type="text/javascript" src="lib/clarinet.js">//</script>
  <script type="text/javascript" src="xml-highlight.js">//</script>
  <script type="text/javascript" src="json-highlight.js">//</script>
  <script type="text/javascript" src="index.js">//</script>
  <link type="text/css" rel="stylesheet" href="xml-highlight.css"/>
  <link type="text/css" rel="stylesheet" href="index.css"/>
</head>
<body>
  <div>
    <h1>Input</h1>
    <div class="control">
      <label for="input-xml">Source</label>
      <select id="input-xml-source">{
        for $e in xdmp:filesystem-directory($HOME || "test/inputs")/dir:entry
        return <option value="{xdmp:document-get(string($e/dir:pathname))}">{string($e/dir:filename)}</option>
      }
      </select>
    </div>
    <div class="control">
    <div class="label"><label for="input-xml">Input XML</label></div>
      <div id="error-message">ASDF</div>
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
  <div id="output-tools">
    <button id="collapse-all">Collapse All</button>
    <button id="expand-all">Expand All</button>
    <span class="total"></span>
    <input type="checkbox" id="hide-close-tags"/><label for="hide-close-tags">Hide close tags?</label>
  </div>
  <div id="node-details"><!-- Populated by rendered #node_details_template --></div>
  <script type="text/html;template" id="node_details_template" src="templates/node-details.html"></script>
  <div id="output" tabindex="10"></div>
</body>
</html>
