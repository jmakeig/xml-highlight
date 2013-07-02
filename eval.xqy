xquery version "1.0-ml";
import module namespace json = "http://marklogic.com/xdmp/json" at "/MarkLogic/json/json.xqy";
declare namespace qry="http://marklogic.com/cts/query";
declare namespace js="http://marklogic.com/xdmp/json/basic";
declare namespace local="local";
declare option xdmp:mapping "false";

declare variable $truncate as xs:int? := xs:int(xdmp:get-request-field("truncate", ()));

(: Serialized for conveying as JSON. :)
declare function local:serialize-content($r as item()) as item()* {
  typeswitch($r)
    case document-node()
      (: FIXME: This should never happen. Should we really throw an error? :)
      (: return local:serialize-content($r/node()) :)
      return error(xs:QName("local:DOCUMENT-NODE"), "Instances of document-node should be trapped previously, not serialized here.")
    case element()
      return xdmp:quote($r, ())
    case binary()
      return 
        let $b := map:map()
        return (
          map:put($b, "mimeType", if(xdmp:node-uri($r)) then xdmp:uri-content-type(xdmp:node-uri($r)) else ()), 
          map:put($b, "fileName", if(xdmp:node-uri($r)) then tokenize(xdmp:node-uri($r), "/")[last()] else "binary-" || xdmp:random()),
          map:put($b, "base64", xs:base64Binary($r)),
          map:put($b, "size", xdmp:binary-size($r)),
          $b
        )
    case attribute()
      return replace(
        string-join(
          tokenize(xdmp:quote(element a { $r }), "\s")
            [2 (: attribute :) to 3 (: namespace :)], 
        " "), 
        "/>$", 
      "")
    case comment()
      return concat("&lt;!-- ", string($r), " -->")
    case json:object
      return xdmp:to-json($r)
    case json:array
      return xdmp:to-json($r)
    (: case map:map :)
    case processing-instruction()
      return xdmp:quote($r, ())
    default
      return data($r)
};

(: Get the type of anything. Hopefully, everything is captured here. :)
declare function local:item-type($r as item()?) as xs:string {
  if(empty($r)) 
    then "empty"
  else
    typeswitch($r)
        case json:object
          return "json"
        case json:array
          return "json"
        (: Should we really do this translation automatically? No. :)
        (: case element(js:json)
          return "json-basic" :)
        case element(qry:query-plan)
          return "query-plan"
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
          return "base64Binary"
        case comment()
          return "comment"
        case processing-instruction()
          return "processing-instruction"
        (: TODO: Need to enumerate all of the other possible types. :)
        default 
          (: TODO: Need some error handling here :)
          return error(xs:QName("TypeError"), $r)
};

declare function local:serialize($results as item()*) as map:map* {
  for $result in $results
  let $m := map:map()
  (: Document nodes aren't interesting for serialization. They are just an envelope. 
     The UI will have to convey that it's a document, but the guts are what matter 
     for actual serialization. :)
  let $r := if($result instance of document-node()) then $result/node() else $result
  return (
    map:put($m, "type", local:item-type($r)),
    map:put($m, "isDocument", $result instance of document-node()),
    map:put($m, "uri", if($r instance of node()) then xdmp:node-uri($r) else ()),
    map:put($m, "content", local:serialize-content($r)),
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
