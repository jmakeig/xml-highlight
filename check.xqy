xquery version "1.0-ml";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
declare namespace js="http://marklogic.com/xdmp/json/basic";
declare namespace e="http://marklogic.com/xdmp/error";
declare namespace local="local";
declare option xdmp:mapping "false";

declare function local:transform-to-json($node as node()) as xs:string {
  let $config as map:map := json:config("custom")
  let $_ := map:put($config, "camel-case", true())

  return json:transform-to-json($node, $config)
};

(:
declare function local:resolve-view($response, $views, $accept-content-type, $accept-lang) {
  let $view := map:get($views, $accept-content-type)
  return
    xdmp:set-response-content-type($accept-content-type),
};
:)

let $query as xs:string := xdmp:get-request-body("text")
let $accept as xs:string := xdmp:get-request-header("Accept", "application/json")
(:
let $views as map:map := map:map()
let $_ := map:put($views, "application/json", function() {})
let $_ := map:put($views, "application/xml", ())
:)

return
  try {
    (
      let $_ := xdmp:pretty-print($query)
      return
      (), (: Send back an intentionally empty response :)
      xdmp:set-response-code(204, "No Content")
    )
  } catch($error) {
    (
      let $response := <error:error>{
        $error/e:code,
        $error/e:name,
        $error/e:xquery-version,
        $error/e:format-string,
        $error/e:stack/e:frame[1]
      }</error:error>
      return
        if("application/json" = $accept) then (
          xdmp:set-response-content-type("application/json"),
          local:transform-to-json($response)
        )
        else (
          xdmp:set-response-content-type("application/xml"),
          $response
        ),
        xdmp:set-response-code(400, "Static Check Error")
    )
  }