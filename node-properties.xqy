xquery version "1.0-ml";
import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy";
import module namespace json = "http://marklogic.com/json" at "/MarkLogic/appservices/utils/json.xqy";

declare namespace db="http://marklogic.com/xdmp/database";

declare option xdmp:mapping "false";

let $element-local := xdmp:get-request-field("localName")
let $element-nsuri := xdmp:url-decode(xdmp:get-request-field("namespaceUri"))
let $type := "string"
let $collation := "http://marklogic.com/collation/"
let $positions := false()

let $map := map:map()
let $_ := map:put($map, "localName", $element-local)
let $_ := map:put($map, "namespaceUri", $element-nsuri)

let $config := admin:get-configuration()


return 
  if("GET" eq xdmp:get-request-method()) then (
    xdmp:set-response-content-type("application/json"),
    json:serialize(
      (: This is super crufty :)
      <indexes>{
        for $ri in admin:database-get-range-element-indexes($config, xdmp:database()) 
          [db:localname = $element-local and db:namespace-uri = $element-nsuri]
        return element {translate(local-name($ri), "-", "_")} {
          (: Force serialization as an array even if there's only one :)
          attribute array { "true" },
          $ri/*
        }
      }</indexes>
    )
  ) else if("POST" eq xdmp:get-request-method()) then
    let $index := admin:database-range-element-index(
      $type, 
      $element-nsuri,
      $element-local, 
      $collation,
		  $positions
		)
		return (
		  admin:save-configuration(
		    admin:database-add-range-element-index($config, xdmp:database(), $index)
		  )
		)
  else ()

