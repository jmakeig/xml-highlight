xquery version "1.0-ml";
declare option xdmp:mapping "true";

let $origin := xdmp:get-request-header("Origin")
let $whitelist as xs:string* := ("http://localhost:8854", "http://some.other.origin")
let $exposed-headers as xs:string* := ("X-Blah")
let $allowed-methods as xs:string* := ("GET", "DELETE")
return (
  xdmp:add-response-header("Access-Control-Allow-Origin", if($origin = $whitelist) then $origin else "null"),  (: http://stackoverflow.com/a/1850482/563324 :)
  xdmp:add-response-header("Access-Control-Allow-Credentials", "true"), (: Send cookies:)
  xdmp:add-response-header("Access-Control-Expose-Headers", string-join($exposed-headers, ",")),
  xdmp:add-response-header("Access-Control-Allow-Methods", string-join($allowed-methods, ",")),
  let $m := map:map()
  return (
    map:put($m, "HTTP method", xdmp:get-request-method()),
    for $h in xdmp:get-request-header-names()
    return map:put($m, $h, xdmp:get-request-header($h)),
    xdmp:add-response-header("X-Blah", "some stuff"),
    xdmp:add-response-header("Content-Type", "application/json"),
    xdmp:log(xdmp:to-json($m)),
    (: Don't send data back for “preflight”:)
    if("OPTIONS" != xdmp:get-request-method()) then
      xdmp:to-json($m)
    else ()
  )
)
