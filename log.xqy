declare variable $ERROR_LOG as xs:string := "/Users/jmakeig/Library/Application Support/MarkLogic/Data/Logs/ErrorLog.txt";
declare variable $ERROR_LENGTH as xs:int := 100;
for $line at $i in
  tokenize(
    xdmp:document-get($ERROR_LOG), 
    "[\n\r]"
  )[last() - $ERROR_LENGTH to last()]
where string-length($line) > 0
order by $i descending
return 
  if(starts-with(xdmp:get-request-header("Accept"), "text/html")) then (
    xdmp:set-response-content-type("text/html"),
    <tr data-timestamp="{xs:dateTime(substring($line, 1, 10) || 'T' || substring($line, 12, 12))}">
      <td class="log-date">{substring($line, 1, 10)}</td>
      <td class="log-time">{substring($line, 12, 12)}</td>
      <td class="log-message">{substring($line, 25)}</td>
    </tr>
  ) else if(starts-with(xdmp:get-request-header("Accept"), "application/xml")) then (
    xdmp:set-response-content-type("application/xml"),
    <line timestamp="{xs:dateTime(substring($line, 1, 10) || 'T' || substring($line, 12, 12))}">
      <date>{substring($line, 1, 10)}</date>
      <time>{substring($line, 12, 12)}</time>
      <message>{substring($line, 25)}</message>
    </line>
  ) else (
    xdmp:set-response-content-type("text/plain"),
    $line
  )
