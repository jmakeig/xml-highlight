xquery version "1.0-ml"; 
declare option xdmp:mapping "true"; 


(: <https://developer.mozilla.org/en-US/docs/Web/API/window.atob> JavaScript convert from base64 :)
(: <http://stackoverflow.com/questions/10473932/browser-html-force-download-of-image-from-src-dataimage-jpegbase64/10473992#10473992> :)

let $m := map:map()

let $b := 
  if(xdmp:get-request-field("doc")) then 
    doc(xdmp:get-request-field("doc"))
  else
    xdmp:external-binary("/Users/jmakeig/Workspaces/xml-highlight/experimental/binary/binaries/Workbook2.xlsx")

return
  let $_ := (
    map:put($m, "type", if(xdmp:node-uri($b)) then xdmp:uri-content-type(xdmp:node-uri($b)) else ("application/octet-stream")), 
    map:put($m, "name", if(xdmp:node-uri($b)) then tokenize(xdmp:node-uri($b), "/")[last()] else ("some binary")), 
    map:put($m, "value", (: force serialization :) xs:base64Binary($b))
  )
  return (
    xdmp:set-response-content-type("application/json"),
    xdmp:add-response-header("Cache-Control", "no-cache"),
    xdmp:to-json($m)
  )