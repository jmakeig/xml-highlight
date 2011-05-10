xquery version "1.0-ml";
declare namespace local="local";
declare function local:serialize($results as item()*) as map:map {
  for $r in $results
  return
    let $m := map:map()
    let $type := 
    typeswitch($r)
      case document-node()
        return "document"
      case element()
        return "element"
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
      default return "Other"
      return (
        map:put($m, "type", $type),
        map:put($m, "content", 
          if(("document", "element") = $type) then
            xdmp:quote(root(document {$r})/node())
          else if("binary" = $type) then
            "BINARY"
          else if("attribute" = $type) then
            "ATTRIBUTE"
          else $r
        ),
        $m
      )
};

xdmp:to-json(
  let $result := xdmp:eval(xdmp:get-request-body("text"))
  return
    for $r in $result
    return local:serialize($r)
)

