xdmp:set-response-content-type("text/html"),
"<!DOCTYPE html>",
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>xml-highlight</title>
  <link type="text/css" rel="stylesheet" href="xml-highlight.css"/>
</head>
<body>
  <h1>asdf</h1>
  {
    xdmp:xslt-invoke("server-html.xsl", <a:person xmlns:a="http://a">Bob</a:person>)
  }
  <!-- START XML-HIGHLIGHT -->
  <!--
  <div class='root'>
    <div class='element' data-element-name='a:A' data-element-prefix='a' data-element-localname='A' data-element-namespace-uri='AaA'>
      <span class='toggle'></span>
      <span class='element-open' tabindex='100'>&lt;<span class='element-name' title='a:A (AaA)'><span class='namespace-prefix'>a</span>:<span class='local-name'>A</span>&#32;</span><span class='element-meta'>&#32;<span class='attribute' title='asdf ()' data-attribute-name='asdf' data-attribute-localname='asdf' data-attribute-prefix='' data-attribute-namespace-uri='' data-attribute-value='qwer'><span class='attribute-name'><span class='local-name'>asdf</span></span>=&quot;<span class='attribute-value'>qwer</span>&quot;</span> <span class='namespace'><span class='xmlns'>xmlns</span>:<span class='namespace-prefix'>a</span>=&quot;<span class='namespace-uri'>AaA</span>&quot;</span></span>&gt;</span><div class='element-value'><div class='element' data-element-name='b:B' data-element-prefix='b' data-element-localname='B' data-element-namespace-uri='BbB'><span class='toggle'></span><span class='element-open' tabindex='100'>&lt;<span class='element-name' title='b:B (BbB)'><span class='namespace-prefix'>b</span>:<span class='local-name'>B</span></span><span class='element-meta'> <span class='namespace'><span class='xmlns'>xmlns</span>:<span class='namespace-prefix'>b</span>=&quot;<span class='namespace-uri'>BbB</span>&quot;</span></span>&gt;</span><div class='element-value'><div class='text'>B</div></div><span class='element-close'>&lt;/<span class='element-name'>b:B</span>&gt;</span></div></div><span class='element-close'>&lt;/<span class='element-name'>a:A</span>&gt;</span>
    </div>
  </div>
  -->
  <!-- END XML-HIGHLIGHT -->
</body>
</html>
