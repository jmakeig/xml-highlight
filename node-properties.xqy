xquery version "1.0-ml";
import module namespace admin = "http://marklogic.com/xdmp/admin" at "/MarkLogic/admin.xqy";
(:import module namespace json = "http://marklogic.com/json" at "mljson/json.xqy";:)
import module namespace json = "http://marklogic.com/json" at "/MarkLogic/appservices/utils/json.xqy";

declare namespace http="xdmp:http";
declare namespace db="http://marklogic.com/xdmp/database";
declare namespace dbm="http://marklogic.com/manage/databases";

declare option xdmp:mapping "false";

let $element-local := xdmp:get-request-field("localName")
let $element-nsuri := xdmp:url-decode(xdmp:get-request-field("namespaceUri"))


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
    let $xsl := <xsl:stylesheet version="2.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:dbm="http://marklogic.com/manage/databases">
      <xsl:template match="/dbm:database-config">
        <database>
          <xsl:apply-templates select="//(dbm:range-element-indexes|dbm:fields|dbm:range-field-indexes)"/>
        </database>
      </xsl:template>
      <xsl:template match="dbm:range-element-indexes">
        <xsl:apply-templates select="dbm:range-element-index[dbm:localname='key' and dbm:namespace-uri='some://namespace-uri']"/>
      </xsl:template>
      <xsl:template match="dbm:range-field-indexes">
        <xsl:variable name="fields" select="//dbm:field[//dbm:included-element/dbm:localname='key' and //dbm:included-element/dbm:namespace-uri='some://namespace-uri']/dbm:field-name/data(.)"/>
        <xsl:apply-templates select="dbm:range-field-index[dbm:field-name = $fields]"/>
      </xsl:template>
      <xsl:template match="dbm:fields">
          <xsl:apply-templates select="dbm:field[.//dbm:included-element/dbm:localname='key' and .//dbm:included-element/dbm:namespace-uri='some://namespace-uri']"/>
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
          {(:
            try {
              for $v in cts:element-values(QName($element-nsuri, $element-local), (), ("frequency-order", "truncate=10"))
              return <samples>
                <frequency>{cts:frequency($v)}</frequency>
                <value>{$v}</value>
              </samples>
            } catch($err) {
              ()
            }
          :)}
        </element>
        <!-- attribute -->
        <!-- attribute value? -->
      {
      xdmp:xslt-eval($xsl, $db-config)/element()
      }
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

