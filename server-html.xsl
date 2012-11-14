<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="2.0">
<xsl:output method="html" indent="yes" name="html"/>
  <xsl:template match="element()">
    <div class="element">
      <span class='element-open'>&lt;
        <span class='element-name' title='XXX'>
          <!--<span class='namespace-prefix'>XXX</span>:-->
          <span class='local-name'><xsl:value-of select="local-name()"/></span>
        </span>
      &gt;</span>
    </div>
  </xsl:template>
</xsl:stylesheet>
