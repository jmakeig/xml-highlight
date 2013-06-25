xquery version "1.0-ml"; 
declare option xdmp:mapping "true"; 


(: <https://developer.mozilla.org/en-US/docs/Web/API/window.atob> JavaScript convert from base64 :)
(: <http://stackoverflow.com/questions/10473932/browser-html-force-download-of-image-from-src-dataimage-jpegbase64/10473992#10473992> :)

let $m := map:map()
let $b := doc(xdmp:get-request-field("doc"))

return
  let $_ := (
    map:put($m, "type", xdmp:uri-content-type(xdmp:node-uri($b))), 
    map:put($m, "value", (: force serialization :) xs:base64Binary($b))
  )
  return (
    xdmp:set-response-content-type("application/json"),
    xdmp:add-response-header("Cache-Control", "no-cache"),
    xdmp:to-json($m)
  )