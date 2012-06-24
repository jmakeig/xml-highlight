xquery version "1.0-ml";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
declare namespace js="http://marklogic.com/xdmp/json/basic";
declare namespace local="local";
declare function local:serialize($results as item()*) as map:map* {
  for $r in $results
  return
    let $m := map:map()
    let $type := 
    typeswitch($r)
      case element(js:json)
        return "json"
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
        return "other"
      return (
        xdmp:log($type),
        map:put($m, "type", $type),
        map:put($m, "content", 
          if(("document", "element") = $type) then
            xdmp:quote(root(document {$r})/node())
          else if("text" = $type) then
            data($r)
          else if("binary" = $type) then
            "Binary"
          else if("attribute" = $type) then
            concat(name($r), "=&quot;", data($r), "&quot;")
          else if("json" = $type) then
            json:transform-to-json($r)
          else $r
        ),
        $m
      )
};

xdmp:set-response-content-type("application/json"),
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
