xquery version "1.0-ml";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
declare namespace js="http://marklogic.com/xdmp/json/basic";
declare namespace local="local";
declare option xdmp:mapping "false";

declare variable $truncate as xs:int? := xs:int(xdmp:get-request-field("truncate", ()));

declare function local:serialize($results as item()*) as map:map* {
    local:serialize($results, ())
};
declare function local:serialize($results as item()*, $output-type as xs:string?) as map:map* {
  for $r in $results
  (:let $_ := xdmp:log($r):)
  return
    let $m := map:map()
    let $type := 
    typeswitch($r)
      case json:object
        return "json"
      case json:array
        return "json"
      (: Should we really do this translation automatically? :)
      case element(js:json)
        return "json-basic"
      case document-node()
        return "document"
      case element()
        return "element"
      case text()
        return "text"
      case attribute()
        return "attribute"
      case xs:float
        return "float"
      case xs:double
        return "double"
      case xs:decimal
        return "decimal"
      case xs:boolean
        return "boolean"
      case xs:duration
        return "duration"
      case xs:date
        return "date"
      case xs:string
        return "string"
      case xs:dateTime
        return "dateTime"
      case xs:QName
        return "QName"
      case binary()
        return "binary"
      case comment()
        return "comment"
      case processing-instruction()
        return "processing-instruction"
      default 
        (: TODO: Need some error handling here :)
        return "other"
      return (
        xdmp:log($type),
        map:put($m, "type", $type),
        map:put($m, "uri", 
          if("document" = $type) then xdmp:node-uri($r) else ()
        ),
        map:put($m, "content", 
          if(("document", "element") = $type) then
            let $quote := xdmp:quote(
              root(document {$r})/node(), 
              (: This provides some nice hierarchical indentation, but it's probably not what 
                 someone would want for "raw" output where they want to see exactly the 
                 infoset they built
              :)
              (:<options xmlns="xdmp:quote">
                <indent-untyped>yes</indent-untyped>
              </options>:) ()
            )
            return 
              (: TODO: Is this if condition correct? :)
              if($truncate gt 0) then substring($quote, 1, $truncate)
              else $quote
          else if("text" = $type) then
            data($r)
          else if("binary" = $type) then
            (: TODO: What should/can we do with binaries? :)
            "Binary"
          else if("attribute" = $type) then
            (:concat(name($r), "=&quot;", data($r), "&quot;"):)
            replace(
              string-join(
                tokenize(
                  xdmp:quote(element a { $r }), "\s")[2 to 3], 
                  " "), 
              "/>$", 
            "")
          else if("comment" = $type) then
            concat("&lt;!-- ", string($r), " -->")
          else if("json-basic" = $type) then
            json:transform-to-json($r)
          else if("json" = $type) then
            xdmp:to-json($r)
          else $r
        ),
        $m
      )
};

xdmp:set-response-content-type("application/json"),
xdmp:set-response-encoding("UTF-8"),
xdmp:to-json(
  (: This eval is a total hack, is completely unprotected, and has no error handling. Other than that, it works. :)
  local:serialize(
    xdmp:eval(
      xdmp:get-request-body("text"), 
      (),
      (: This is a protection to make sure no updates happen. :)
      <options xmlns="xdmp:eval">
        <isolation>same-statement</isolation>
      </options>
    )
  )
)
