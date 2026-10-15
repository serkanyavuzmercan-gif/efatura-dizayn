<?xml version="1.0" encoding="UTF-8"?>
<!-- efatura-dizayn-builtin -->
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
  xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
  xmlns:inv="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
  exclude-result-prefixes="cbc cac inv">

  <xsl:output method="html" encoding="UTF-8" indent="no" omit-xml-declaration="yes"/>
  <xsl:decimal-format name="tr" decimal-separator="," grouping-separator="."/>

  <xsl:param name="logoSrc" select="''"/>
  <xsl:param name="logoAlign" select="'left'"/>
  <xsl:param name="noteBank" select="''"/>
  <xsl:param name="notePayment" select="''"/>
  <xsl:param name="noteGeneral" select="'Bu fatura elektronik ortamda düzenlenmiştir.'"/>
  <xsl:param name="notePosition" select="'side'"/>
  <xsl:param name="col_lineNo" select="'1'"/>
  <xsl:param name="col_name" select="'1'"/>
  <xsl:param name="col_qty" select="'1'"/>
  <xsl:param name="col_unit" select="'1'"/>
  <xsl:param name="col_price" select="'1'"/>
  <xsl:param name="col_discount" select="'1'"/>
  <xsl:param name="col_vatRate" select="'1'"/>
  <xsl:param name="col_vatAmount" select="'1'"/>
  <xsl:param name="col_lineTotal" select="'1'"/>

  <xsl:variable name="invoice" select="(/*[local-name()='Invoice'])[1]"/>

  <xsl:template match="/">
    <html>
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <title>e-Fatura</title>
        <style id="efatura-design" type="text/css" data-builtin="1">
/* efatura-tokens
primary: #143d66
heading: #143d66
text: #1c2430
border: #c5ced9
borderWidth: 1
headerBg: #e7eef6
font: Segoe UI, Arial, sans-serif
fontSize: 11
headingSize: 18
logoWidth: 132
*/
/* efatura-columns
lineNo|6|1
name|24|1
qty|8|1
unit|8|1
price|12|1
discount|10|1
vatRate|9|1
vatAmount|11|1
lineTotal|12|1
*/
@page { size: A4; margin: 10mm; }
html, body { margin: 0; padding: 0; background: #ffffff; }
body { color: #1c2430; font-family: Segoe UI, Arial, sans-serif; font-size: 11px; }
.page { padding: 8mm 10mm 12mm; }
table { border-collapse: collapse; }
.head { width: 100%; border-bottom: 2px solid #143d66; margin-bottom: 8px; }
.head td { vertical-align: top; padding: 0 8px 8px 0; }
.kicker { font-size: 11px; letter-spacing: 0.12em; font-weight: 700; color: #143d66; }
h1 { margin: 2px 0 0; font-size: 18px; line-height: 1.15; color: #143d66; font-weight: 700; }
.subtitle { margin-top: 2px; }
#company-logo { width: 132px; height: auto; }
.align-left { text-align: left; }
.align-center { text-align: center; }
.align-right { text-align: right; }
.meta { margin-top: 6px; }
.meta th { text-align: left; font-weight: 700; color: #143d66; padding: 1px 10px 1px 0; white-space: nowrap; vertical-align: top; }
.meta td { padding: 1px 0; vertical-align: top; }
.ettn { font-size: 9px; word-break: break-all; }
.qr-cell { text-align: right; }
#gib-qrcode { display: inline-block; width: 28mm; height: 28mm; border: 1px dashed #c5ced9; text-align: center; color: #143d66; font-size: 9px; line-height: 28mm; vertical-align: top; }
#gib-qrcode img { width: 24mm; height: 24mm; vertical-align: middle; }
.parties { width: 100%; margin: 8px 0; }
.parties td { width: 50%; vertical-align: top; border: 1px solid #c5ced9; padding: 6px 8px; }
.parties td + td { border-left: 0; }
.party-title { margin: 0 0 4px; font-size: 10px; letter-spacing: 0.08em; color: #143d66; font-weight: 700; }
.party-name { font-weight: 700; margin-bottom: 2px; }
#line-table { width: 100%; margin-top: 8px; }
#line-table th, #line-table td { border: 1px solid #c5ced9; padding: 4px 5px; vertical-align: top; }
#line-table th { background: #e7eef6; color: #143d66; font-weight: 700; }
.num { text-align: right; white-space: nowrap; }
.ctr { text-align: center; }
.item-name { font-weight: 700; }
.item-desc { font-size: 10px; margin-top: 1px; }
.footer { width: 100%; margin-top: 10px; }
.notes { font-size: 10px; line-height: 1.45; }
.notes p { margin: 0 0 4px; }
.totals { width: 100%; }
.totals td { padding: 3px 4px; vertical-align: top; }
.totals td.lbl { text-align: left; }
.totals td.val { text-align: right; white-space: nowrap; }
.totals tr.grand td { font-weight: 700; border-top: 2px solid #143d66; padding-top: 5px; }
.fine { margin-top: 8px; font-size: 9px; color: #5c6675; }
        </style>
      </head>
      <body>
        <xsl:choose>
          <xsl:when test="$invoice">
            <div class="page">
              <table class="head">
                <tr>
                  <td width="34%">
                    <div id="logo-wrap">
                      <xsl:attribute name="class">
                        <xsl:text>logo-wrap align-</xsl:text>
                        <xsl:value-of select="$logoAlign"/>
                      </xsl:attribute>
                      <xsl:if test="$logoSrc != ''">
                        <img id="company-logo" alt="Firma logosu">
                          <xsl:attribute name="src">
                            <xsl:value-of select="$logoSrc"/>
                          </xsl:attribute>
                        </img>
                      </xsl:if>
                    </div>
                  </td>
                  <td width="42%">
                    <div class="kicker">e-FATURA</div>
                    <h1>
                      <xsl:call-template name="profile-name">
                        <xsl:with-param name="code" select="$invoice/cbc:ProfileID"/>
                      </xsl:call-template>
                    </h1>
                    <div class="subtitle">
                      <xsl:call-template name="type-name">
                        <xsl:with-param name="code" select="$invoice/cbc:InvoiceTypeCode"/>
                      </xsl:call-template>
                    </div>
                    <table class="meta">
                      <tr>
                        <th>Fatura No</th>
                        <td><xsl:value-of select="$invoice/cbc:ID"/></td>
                      </tr>
                      <tr>
                        <th>Fatura Tarihi</th>
                        <td>
                          <xsl:call-template name="tr-date">
                            <xsl:with-param name="value" select="$invoice/cbc:IssueDate"/>
                          </xsl:call-template>
                        </td>
                      </tr>
                      <tr>
                        <th>ETTN</th>
                        <td class="ettn"><xsl:value-of select="$invoice/cbc:UUID"/></td>
                      </tr>
                      <tr>
                        <th>Para Birimi</th>
                        <td><xsl:value-of select="$invoice/cbc:DocumentCurrencyCode"/></td>
                      </tr>
                    </table>
                  </td>
                  <td width="24%" class="qr-cell">
                    <xsl:call-template name="qr-block"/>
                  </td>
                </tr>
              </table>

              <table class="parties">
                <tr>
                  <td>
                    <xsl:call-template name="party-block">
                      <xsl:with-param name="title" select="'SATICI'"/>
                      <xsl:with-param name="party" select="$invoice/cac:AccountingSupplierParty/cac:Party"/>
                    </xsl:call-template>
                  </td>
                  <td>
                    <xsl:call-template name="party-block">
                      <xsl:with-param name="title" select="'ALICI'"/>
                      <xsl:with-param name="party" select="$invoice/cac:AccountingCustomerParty/cac:Party"/>
                    </xsl:call-template>
                  </td>
                </tr>
              </table>

              <table id="line-table">
                <thead>
                  <tr>
                    <xsl:if test="$col_lineNo = '1'">
                      <th data-col="lineNo" class="ctr" style="width:6%">Sıra No</th>
                    </xsl:if>
                    <xsl:if test="$col_name = '1'">
                      <th data-col="name" style="width:24%">Mal/Hizmet Adı</th>
                    </xsl:if>
                    <xsl:if test="$col_qty = '1'">
                      <th data-col="qty" class="num" style="width:8%">Miktar</th>
                    </xsl:if>
                    <xsl:if test="$col_unit = '1'">
                      <th data-col="unit" class="ctr" style="width:8%">Birim</th>
                    </xsl:if>
                    <xsl:if test="$col_price = '1'">
                      <th data-col="price" class="num" style="width:12%">Birim Fiyat</th>
                    </xsl:if>
                    <xsl:if test="$col_discount = '1'">
                      <th data-col="discount" class="num" style="width:10%">İskonto</th>
                    </xsl:if>
                    <xsl:if test="$col_vatRate = '1'">
                      <th data-col="vatRate" class="num" style="width:9%">KDV Oranı</th>
                    </xsl:if>
                    <xsl:if test="$col_vatAmount = '1'">
                      <th data-col="vatAmount" class="num" style="width:11%">KDV Tutarı</th>
                    </xsl:if>
                    <xsl:if test="$col_lineTotal = '1'">
                      <th data-col="lineTotal" class="num" style="width:12%">Toplam</th>
                    </xsl:if>
                  </tr>
                </thead>
                <tbody>
                  <xsl:for-each select="$invoice/cac:InvoiceLine">
                    <tr>
                      <xsl:if test="$col_lineNo = '1'">
                        <td data-col="lineNo" class="ctr">
                          <xsl:choose>
                            <xsl:when test="string(cbc:ID)"><xsl:value-of select="cbc:ID"/></xsl:when>
                            <xsl:otherwise><xsl:value-of select="position()"/></xsl:otherwise>
                          </xsl:choose>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_name = '1'">
                        <td data-col="name">
                          <div class="item-name"><xsl:value-of select="cac:Item/cbc:Name"/></div>
                          <xsl:if test="normalize-space(cac:Item/cbc:Description)">
                            <div class="item-desc"><xsl:value-of select="cac:Item/cbc:Description"/></div>
                          </xsl:if>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_qty = '1'">
                        <td data-col="qty" class="num">
                          <xsl:value-of select="format-number(cbc:InvoicedQuantity, '#.##0,###', 'tr')"/>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_unit = '1'">
                        <td data-col="unit" class="ctr">
                          <xsl:call-template name="unit-name">
                            <xsl:with-param name="code" select="cbc:InvoicedQuantity/@unitCode"/>
                          </xsl:call-template>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_price = '1'">
                        <td data-col="price" class="num">
                          <xsl:call-template name="money">
                            <xsl:with-param name="value" select="cac:Price/cbc:PriceAmount"/>
                          </xsl:call-template>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_discount = '1'">
                        <td data-col="discount" class="num">
                          <xsl:choose>
                            <xsl:when test="cac:AllowanceCharge[cbc:ChargeIndicator='false' or cbc:ChargeIndicator='0']/cbc:Amount">
                              <xsl:call-template name="money">
                                <xsl:with-param name="value" select="sum(cac:AllowanceCharge[cbc:ChargeIndicator='false' or cbc:ChargeIndicator='0']/cbc:Amount)"/>
                              </xsl:call-template>
                            </xsl:when>
                            <xsl:otherwise>
                              <xsl:call-template name="money">
                                <xsl:with-param name="value" select="0"/>
                              </xsl:call-template>
                            </xsl:otherwise>
                          </xsl:choose>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_vatRate = '1'">
                        <td data-col="vatRate" class="num">
                          <xsl:variable name="rate" select="cac:TaxTotal/cac:TaxSubtotal/cbc:Percent | cac:TaxTotal/cac:TaxSubtotal/cac:TaxCategory/cbc:Percent"/>
                          <xsl:choose>
                            <xsl:when test="$rate">
                              <xsl:value-of select="format-number($rate, '#0.##', 'tr')"/>
                              <xsl:text>%</xsl:text>
                            </xsl:when>
                            <xsl:otherwise>-</xsl:otherwise>
                          </xsl:choose>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_vatAmount = '1'">
                        <td data-col="vatAmount" class="num">
                          <xsl:call-template name="money">
                            <xsl:with-param name="value" select="sum(cac:TaxTotal/cbc:TaxAmount)"/>
                          </xsl:call-template>
                        </td>
                      </xsl:if>
                      <xsl:if test="$col_lineTotal = '1'">
                        <td data-col="lineTotal" class="num">
                          <xsl:call-template name="money">
                            <xsl:with-param name="value" select="cbc:LineExtensionAmount"/>
                          </xsl:call-template>
                        </td>
                      </xsl:if>
                    </tr>
                  </xsl:for-each>
                </tbody>
              </table>

              <xsl:choose>
                <xsl:when test="$notePosition = 'below'">
                  <div class="footer">
                    <xsl:call-template name="totals"/>
                    <div style="height:8px"></div>
                    <xsl:call-template name="notes"/>
                  </div>
                </xsl:when>
                <xsl:otherwise>
                  <table class="footer">
                    <tr>
                      <td width="62%" valign="top">
                        <xsl:call-template name="notes"/>
                      </td>
                      <td width="38%" valign="top">
                        <xsl:call-template name="totals"/>
                      </td>
                    </tr>
                  </table>
                </xsl:otherwise>
              </xsl:choose>
              <p class="fine">UBL-TR · XSLT 1.0</p>
            </div>
          </xsl:when>
          <xsl:otherwise>
            <p>Fatura düğümü bulunamadı. UBL-TR Invoice XML yükleyin.</p>
          </xsl:otherwise>
        </xsl:choose>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="party-block">
    <xsl:param name="title"/>
    <xsl:param name="party"/>
    <div class="party-title"><xsl:value-of select="$title"/></div>
    <div class="party-name">
      <xsl:choose>
        <xsl:when test="normalize-space($party/cac:PartyName/cbc:Name)">
          <xsl:value-of select="$party/cac:PartyName/cbc:Name"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$party/cac:Person/cbc:FirstName"/>
          <xsl:text> </xsl:text>
          <xsl:value-of select="$party/cac:Person/cbc:FamilyName"/>
        </xsl:otherwise>
      </xsl:choose>
    </div>
    <div>
      <xsl:text>VKN/TCKN: </xsl:text>
      <xsl:value-of select="$party/cac:PartyIdentification/cbc:ID"/>
    </div>
    <xsl:if test="normalize-space($party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name)">
      <div>
        <xsl:text>Vergi Dairesi: </xsl:text>
        <xsl:value-of select="$party/cac:PartyTaxScheme/cac:TaxScheme/cbc:Name"/>
      </div>
    </xsl:if>
    <xsl:if test="normalize-space($party/cac:PostalAddress/cbc:StreetName)">
      <div><xsl:value-of select="$party/cac:PostalAddress/cbc:StreetName"/></div>
    </xsl:if>
    <div>
      <xsl:value-of select="$party/cac:PostalAddress/cbc:CitySubdivisionName"/>
      <xsl:if test="normalize-space($party/cac:PostalAddress/cbc:CitySubdivisionName) and normalize-space($party/cac:PostalAddress/cbc:CityName)">
        <xsl:text> / </xsl:text>
      </xsl:if>
      <xsl:value-of select="$party/cac:PostalAddress/cbc:CityName"/>
    </div>
  </xsl:template>

  <xsl:template name="qr-block">
    <div id="gib-qrcode">
      <xsl:variable name="qrNode" select="$invoice/cac:AdditionalDocumentReference[cbc:DocumentType='QRCODE' or cbc:DocumentType='KAREKOD' or contains(cbc:DocumentType, 'QR')][1]"/>
      <xsl:variable name="raw" select="normalize-space($qrNode/cac:Attachment/cbc:EmbeddedDocumentBinaryObject)"/>
      <xsl:choose>
        <xsl:when test="$raw != ''">
          <img alt="Karekod">
            <xsl:attribute name="src">
              <xsl:choose>
                <xsl:when test="contains($raw, 'data:')">
                  <xsl:value-of select="$raw"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>data:image/png;base64,</xsl:text>
                  <xsl:value-of select="$raw"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
          </img>
        </xsl:when>
        <xsl:otherwise>
          <span class="qr-label">Karekod</span>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="notes">
    <div id="notes-block" class="notes">
      <xsl:for-each select="$invoice/cbc:Note">
        <p><xsl:value-of select="."/></p>
      </xsl:for-each>
      <xsl:for-each select="$invoice/cac:PaymentMeans">
        <p>
          <strong>Ödeme: </strong>
          <xsl:value-of select="cac:PayeeFinancialAccount/cbc:PaymentNote"/>
          <xsl:if test="normalize-space(cac:PayeeFinancialAccount/cbc:ID)">
            <xsl:text> · </xsl:text>
            <xsl:value-of select="cac:PayeeFinancialAccount/cbc:ID"/>
          </xsl:if>
        </p>
      </xsl:for-each>
      <xsl:if test="$noteBank != ''">
        <p><strong>Banka Bilgileri: </strong><xsl:value-of select="$noteBank"/></p>
      </xsl:if>
      <xsl:if test="$notePayment != ''">
        <p><strong>Ödeme Koşulları: </strong><xsl:value-of select="$notePayment"/></p>
      </xsl:if>
      <xsl:if test="$noteGeneral != ''">
        <p><xsl:value-of select="$noteGeneral"/></p>
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="totals">
    <table class="totals" id="totals-block">
      <tr>
        <td class="lbl">Mal/Hizmet Toplam Tutarı</td>
        <td class="val">
          <xsl:call-template name="money">
            <xsl:with-param name="value" select="$invoice/cac:LegalMonetaryTotal/cbc:LineExtensionAmount"/>
          </xsl:call-template>
        </td>
      </tr>
      <xsl:if test="$invoice/cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount">
        <tr>
          <td class="lbl">Toplam İskonto</td>
          <td class="val">
            <xsl:call-template name="money">
              <xsl:with-param name="value" select="$invoice/cac:LegalMonetaryTotal/cbc:AllowanceTotalAmount"/>
            </xsl:call-template>
          </td>
        </tr>
      </xsl:if>
      <xsl:for-each select="$invoice/cac:TaxTotal[1]/cac:TaxSubtotal">
        <tr>
          <td class="lbl">
            <xsl:text>KDV %</xsl:text>
            <xsl:value-of select="cbc:Percent | cac:TaxCategory/cbc:Percent"/>
          </td>
          <td class="val">
            <xsl:call-template name="money">
              <xsl:with-param name="value" select="cbc:TaxAmount"/>
            </xsl:call-template>
          </td>
        </tr>
      </xsl:for-each>
      <tr>
        <td class="lbl">Hesaplanan KDV</td>
        <td class="val">
          <xsl:call-template name="money">
            <xsl:with-param name="value" select="($invoice/cac:TaxTotal/cbc:TaxAmount)[1]"/>
          </xsl:call-template>
        </td>
      </tr>
      <xsl:if test="$invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount != $invoice/cac:LegalMonetaryTotal/cbc:PayableAmount">
        <tr>
          <td class="lbl">Vergiler Dahil Toplam</td>
          <td class="val">
            <xsl:call-template name="money">
              <xsl:with-param name="value" select="$invoice/cac:LegalMonetaryTotal/cbc:TaxInclusiveAmount"/>
            </xsl:call-template>
          </td>
        </tr>
      </xsl:if>
      <tr class="grand">
        <td class="lbl">Genel Toplam</td>
        <td class="val">
          <xsl:call-template name="money">
            <xsl:with-param name="value" select="$invoice/cac:LegalMonetaryTotal/cbc:PayableAmount"/>
          </xsl:call-template>
        </td>
      </tr>
    </table>
  </xsl:template>

  <xsl:template name="money">
    <xsl:param name="value" select="0"/>
    <xsl:choose>
      <xsl:when test="string($value) = '' or string($value) = 'NaN'">0,00</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="format-number($value, '#.##0,00', 'tr')"/>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:if test="$invoice/cbc:DocumentCurrencyCode">
      <xsl:text> </xsl:text>
      <xsl:value-of select="$invoice/cbc:DocumentCurrencyCode"/>
    </xsl:if>
  </xsl:template>

  <xsl:template name="tr-date">
    <xsl:param name="value"/>
    <xsl:choose>
      <xsl:when test="string-length($value) &gt;= 10">
        <xsl:value-of select="substring($value, 9, 2)"/>
        <xsl:text>.</xsl:text>
        <xsl:value-of select="substring($value, 6, 2)"/>
        <xsl:text>.</xsl:text>
        <xsl:value-of select="substring($value, 1, 4)"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$value"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="profile-name">
    <xsl:param name="code"/>
    <xsl:choose>
      <xsl:when test="$code='TICARIFATURA'">Ticari Fatura</xsl:when>
      <xsl:when test="$code='TEMELFATURA'">Temel Fatura</xsl:when>
      <xsl:when test="$code='EARSIVFATURA'">e-Arşiv Fatura</xsl:when>
      <xsl:when test="$code='YOLCUBERABERFATURA'">Yolcu Beraber</xsl:when>
      <xsl:when test="$code='IHRACAT'">İhracat</xsl:when>
      <xsl:when test="$code='KAMU'">Kamu</xsl:when>
      <xsl:when test="$code='HKS'">Hal Kayıt Sistemi</xsl:when>
      <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="type-name">
    <xsl:param name="code"/>
    <xsl:choose>
      <xsl:when test="$code='SATIS'">Satış</xsl:when>
      <xsl:when test="$code='IADE'">İade</xsl:when>
      <xsl:when test="$code='TEVKIFAT'">Tevkifat</xsl:when>
      <xsl:when test="$code='ISTISNA'">İstisna</xsl:when>
      <xsl:when test="$code='OZELMATRAH'">Özel Matrah</xsl:when>
      <xsl:when test="$code='IHRACKAYITLI'">İhraç Kayıtlı</xsl:when>
      <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="unit-name">
    <xsl:param name="code"/>
    <xsl:choose>
      <xsl:when test="$code='C62' or $code='NIU'">Adet</xsl:when>
      <xsl:when test="$code='KGM'">kg</xsl:when>
      <xsl:when test="$code='GRM'">g</xsl:when>
      <xsl:when test="$code='LTR'">lt</xsl:when>
      <xsl:when test="$code='MTR'">m</xsl:when>
      <xsl:when test="$code='MTK'">m2</xsl:when>
      <xsl:when test="$code='MTQ'">m3</xsl:when>
      <xsl:when test="$code='DAY'">Gün</xsl:when>
      <xsl:when test="$code='HUR'">Saat</xsl:when>
      <xsl:when test="$code='MON'">Ay</xsl:when>
      <xsl:otherwise><xsl:value-of select="$code"/></xsl:otherwise>
    </xsl:choose>
  </xsl:template>
</xsl:stylesheet>
