xquery version "1.0-ml";
import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy";
(:import module namespace json = "http://marklogic.com/json" at "mljson/json.xqy";:)
import module namespace json = "http://marklogic.com/json" at "/MarkLogic/appservices/utils/json.xqy";

declare namespace http="xdmp:http";
declare namespace db="http://marklogic.com/xdmp/database";
declare namespace dbm="http://marklogic.com/manage/databases";

declare option xdmp:mapping "false";

let $element-local := xdmp:get-request-field("elementLocalname")
let $element-nsuri := xdmp:url-decode(xdmp:get-request-field("elementNamespaceUri"))
let $attribute-local := xdmp:get-request-field("attributeLocalname")
let $attribute-nsuri := xdmp:url-decode(xdmp:get-request-field("attributeNamespaceUri", ""))
let $attribute-value := xdmp:get-request-field("attributeValue")
(:
let $node := (
  QName($element-nsuri, $element-local),
  if($attribute-local) then (
    QName($attribute-nsuri, $attribute-local),
    $attribute-value
  ) else ()
)
:)

return 
  if("GET" eq xdmp:get-request-method()) then (
    let $response := xdmp:http-get(concat("http://localhost:8002/manage/v1/databases/", xdmp:database-name(xdmp:database()), "/config?format=xml"),
      <options xmlns="xdmp:http">
       <authentication method="digest">
         <username>admin</username>
         <password>admin</password>
       </authentication>
      </options>)
    let $db-config := if(data($response[1]/http:code) != 200) then error(xs:QName("ERROR"), "HTTP error") else $response[2]
    (: Missing element word query through, phrase through, element word lexicons, geospatial * indexes :)
    let $xsl := <xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:dbm="http://marklogic.com/manage/databases">
      <xsl:template match="/dbm:database-config">
        <database>
          <test/><!-- Hack to force the database object not to render as null -->
          <xsl:apply-templates select="//(dbm:range-element-indexes|dbm:fields|dbm:range-field-indexes)"/>
        </database>
      </xsl:template>
      <xsl:template match="dbm:range-element-indexes">
        <xsl:apply-templates select="dbm:range-element-index[dbm:localname='{$element-local}' and dbm:namespace-uri='{$element-nsuri}']"/>
      </xsl:template>
      <xsl:template match="dbm:range-field-indexes">
        <xsl:variable name="fields" select="//dbm:field[//dbm:included-element/dbm:localname='{$element-local}' and //dbm:included-element/dbm:namespace-uri='{$element-nsuri}']/dbm:field-name/data(.)"/>
        <xsl:apply-templates select="dbm:range-field-index[dbm:field-name = $fields]"/>
      </xsl:template>
      <xsl:template match="dbm:fields">
          <xsl:apply-templates select="dbm:field[.//dbm:included-element/dbm:localname='{$element-local}' and .//dbm:included-element/dbm:namespace-uri='{$element-nsuri}']"/>
      </xsl:template>
      <xsl:template match="dbm:included-elements|dbm:excluded-elements">
        <xsl:apply-templates/>
      </xsl:template>
      <xsl:template match="dbm:range-element-index|dbm:field|dbm:range-field-index|dbm:included-element|dbm:excluded-element">
        <xsl:element name="{{concat(local-name(), if(ends-with(local-name(), 'x')) then 'es' else 's')}}">
          <xsl:copy-of select="@*"/>
          <xsl:attribute name="array">true</xsl:attribute>
          <xsl:apply-templates/>
        </xsl:element>
      </xsl:template>
      <xsl:template match="element()">
        <xsl:copy>
          <xsl:apply-templates select="@*,node()"/>
        </xsl:copy>
      </xsl:template>
      <xsl:template match="attribute()|text()|comment()|processing-instruction()">
        <xsl:copy/>
      </xsl:template>
    </xsl:stylesheet>
    let $xsl-attr := <xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:dbm="http://marklogic.com/manage/databases">
      <xsl:template match="/dbm:database-config">
        <database>
          <test/><!-- Hack to force the database object not to render as null -->
          <xsl:apply-templates select="//(dbm:range-element-attribute-indexes|dbm:fields|dbm:range-field-indexes)"/>
        </database>
      </xsl:template>
      <!--
        <range-element-attribute-indexes>
          <range-element-attribute-index>
            <scalar-type>string</scalar-type>
            <collation>http://marklogic.com/collation/it</collation>
            <parent-namespace-uri>http://PARENT</parent-namespace-uri>
            <parent-localname>parent</parent-localname>
            <namespace-uri>http://ATTRIBUTE</namespace-uri>
            <localname>attr</localname>
          <range-value-positions>true</range-value-positions>
          </range-element-attribute-index>
        </range-element-attribute-indexes>
      -->
      <xsl:template match="dbm:range-element-attribute-indexes">
        <xsl:apply-templates select="dbm:range-element-attribute-index[
              dbm:parent-localname='{$element-local}' and dbm:parent-namespace-uri='{$element-nsuri}'
          and dbm:localname='{$attribute-local}' and dbm:namespace-uri='{$attribute-nsuri}'
        ]"/>
      </xsl:template>
      <xsl:template match="dbm:range-field-indexes">
        <xsl:variable name="fields" select="//dbm:field[//dbm:included-element/dbm:localname='{$element-local}' and //dbm:included-element/dbm:namespace-uri='{$element-nsuri}']/dbm:field-name/data(.)"/>
        <xsl:apply-templates select="dbm:range-field-index[dbm:field-name = $fields]"/>
      </xsl:template>
      <xsl:template match="dbm:fields">
          <xsl:apply-templates select="dbm:field[.//dbm:included-element/dbm:localname='{$element-local}' and .//dbm:included-element/dbm:namespace-uri='{$element-nsuri}']"/>
      </xsl:template>
      <xsl:template match="dbm:included-elements|dbm:excluded-elements">
        <xsl:apply-templates/>
      </xsl:template>
      <xsl:template match="dbm:range-element-index|dbm:field|dbm:range-field-index|dbm:included-element|dbm:excluded-element">
        <xsl:element name="{{concat(local-name(), if(ends-with(local-name(), 'x')) then 'es' else 's')}}">
          <xsl:copy-of select="@*"/>
          <xsl:attribute name="array">true</xsl:attribute>
          <xsl:apply-templates/>
        </xsl:element>
      </xsl:template>
      <xsl:template match="element()">
        <xsl:copy>
          <xsl:apply-templates select="@*,node()"/>
        </xsl:copy>
      </xsl:template>
      <xsl:template match="attribute()|text()|comment()|processing-instruction()">
        <xsl:copy/>
      </xsl:template>
    </xsl:stylesheet>
    return json:serialize(
      <node>
        <element>
          <localname>{$element-local}</localname>
          <namespace-uri>{$element-nsuri}</namespace-uri>
          <estimate>{
            xdmp:estimate(
              cts:search(
                collection(), 
                cts:element-query(
                  QName($element-nsuri, $element-local),
                  cts:and-query(())
                )
              )
            )}
          </estimate>
          {
            try {
              for $v in cts:element-values(QName($element-nsuri, $element-local), (), ("frequency-order", "truncate=10"))
              return <samples>
                <frequency>{cts:frequency($v)}</frequency>
                <value>{$v}</value>
              </samples>
            } catch($err) {
              ()
            }
          }
        </element>
        {if($attribute-local) then
          <attribute>
            <localname>{$attribute-local}</localname>
            <namespace-uri>{$attribute-nsuri}</namespace-uri>
            <value>{$attribute-value}</value>
          </attribute>
        else ()}
      {xdmp:log(xdmp:xslt-eval(if($attribute-local) then $xsl-attr else $xsl, $db-config)/element())}
      {xdmp:xslt-eval(if($attribute-local) then $xsl-attr else $xsl, $db-config)/element()}
      </node>
    )
  ) else if("POST" eq xdmp:get-request-method()) then
(:
    let $config := admin:get-configuration()
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
:)
    error(xs:QName("ERROR"), "Not able to POST yet")
  else ()

