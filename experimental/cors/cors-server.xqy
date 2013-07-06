let $origin := xdmp:get-request-header("Origin")
let $whitelist := ("http://localhost:8854", "http://some.other.origin")
return
  xdmp:add-response-header("Access-Control-Allow-Origin", if($origin = $whitelist) then $origin else "null"),  (: http://stackoverflow.com/a/1850482/563324 :)
  xdmp:add-response-header("Access-Control-Allow-Credentials", "true"), (: Send cookies:)
  xdmp:add-response-header("Access-Control-Expose-Headers", "X-Blah"),
  xdmp:add-response-header("Access-Control-Allow-Methods", "PUT, DELETE"),
  let $m := map:map()
  return (
    map:put($m, "HTTP method", xdmp:get-request-method()),
    for $h in xdmp:get-request-header-names()
    return map:put($m, $h, xdmp:get-request-header($h)),
    xdmp:add-response-header("X-Blah", "some stuff"),
    xdmp:add-response-header("Content-Type", "application/json"),
    xdmp:log(xdmp:to-json($m)),
    if("OPTIONS" != xdmp:get-request-method()) then
      xdmp:to-json($m)
    else ()
  )
