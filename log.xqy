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
  let $date := substring($line, 1, 10)
  let $time := substring($line, 12, 12)
    let $m := substring($line, 25)
  let $level := substring-before($m, ":")
  let $message := substring-after($m, ":")
  return
    if(starts-with(xdmp:get-request-header("Accept"), "text/html")) then (
      xdmp:set-response-content-type("text/html"),
      <tr data-timestamp="{xs:dateTime($date || 'T' || $time)}" class="level-{lower-case($level)}">
        <td class="log-level {lower-case($level)}" data-level="{lower-case($level)}">{$level}</td>
        <td data-date="{$date}">{$date}</td>
        <td data-time="{$time}">{$time}</td>
        <td data-level="{$level}">{$level}</td>
        <td>{$message}</td>
      </tr>
    ) else if(starts-with(xdmp:get-request-header("Accept"), "application/xml")) then (
      xdmp:set-response-content-type("application/xml"),
      <line timestamp="{xs:dateTime($date || 'T' || $time)}">
        <date>{$date}</date>
        <time>{$time}</time>
        <level>{$level}</level>
        <message>{$message}</message>
      </line>
    ) else (
      xdmp:set-response-content-type("text/plain"),
      $line
    )
