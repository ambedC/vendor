<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="2.0" 
                xmlns:html="http://www.w3.org/TR/REC-html40"
                xmlns:sitemap="http://www.sitemaps.org/schemas/sitemap/0.9"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
	<xsl:output method="html" version="1.0" encoding="UTF-8" indent="yes"/>
	<xsl:template match="/">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<title>XML Sitemap</title>
				<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
				<style type="text/css">
					body {
						font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen-Sans, Ubuntu, Cantarell, "Helvetica Neue", sans-serif;
						color: #333;
						margin: 0;
						padding: 40px;
						background-color: #f9fafb;
					}
					h1 {
						color: #111;
						font-size: 24px;
						margin-bottom: 20px;
					}
					p.intro {
						font-size: 14px;
						color: #666;
						margin-bottom: 30px;
					}
					table {
						width: 100%;
						border-collapse: collapse;
						background: #fff;
						box-shadow: 0 1px 3px rgba(0,0,0,0.1);
						border-radius: 8px;
						overflow: hidden;
					}
					th {
						background-color: #f3f4f6;
						text-align: left;
						padding: 12px 15px;
						font-size: 13px;
						font-weight: 600;
						color: #4b5563;
						text-transform: uppercase;
						letter-spacing: 0.05em;
						border-bottom: 1px solid #e5e7eb;
					}
					td {
						padding: 12px 15px;
						font-size: 14px;
						border-bottom: 1px solid #e5e7eb;
					}
					tr:last-child td {
						border-bottom: none;
					}
					tr:hover td {
						background-color: #f9fafb;
					}
					a {
						color: #2563eb;
						text-decoration: none;
					}
					a:hover {
						text-decoration: underline;
					}
					.priority {
						display: inline-block;
						padding: 2px 8px;
						border-radius: 12px;
						font-size: 12px;
						font-weight: 500;
					}
					.priority-high { background-color: #dcfce7; color: #166534; }
					.priority-medium { background-color: #fef9c3; color: #854d0e; }
					.priority-low { background-color: #f3f4f6; color: #374151; }
				</style>
			</head>
			<body>
				<h1>XML Sitemap</h1>
				<p class="intro">
					This sitemap is generated dynamically and helps search engines index your site.
					There are <xsl:value-of select="count(sitemap:urlset/sitemap:url)"/> URLs in this sitemap.
				</p>
				<table>
					<thead>
						<tr>
							<th width="70%">URL</th>
							<th width="15%">Priority</th>
							<th width="15%">Last Modified</th>
						</tr>
					</thead>
					<tbody>
						<xsl:for-each select="sitemap:urlset/sitemap:url">
							<tr>
								<td>
									<xsl:variable name="itemURL">
										<xsl:value-of select="sitemap:loc"/>
									</xsl:variable>
									<a href="{$itemURL}">
										<xsl:value-of select="sitemap:loc"/>
									</a>
								</td>
								<td>
									<xsl:variable name="p">
										<xsl:value-of select="sitemap:priority"/>
									</xsl:variable>
									<span class="priority">
										<xsl:choose>
											<xsl:when test="$p &gt; 0.7">
												<xsl:attribute name="class">priority priority-high</xsl:attribute>
											</xsl:when>
											<xsl:when test="$p &gt; 0.4">
												<xsl:attribute name="class">priority priority-medium</xsl:attribute>
											</xsl:when>
											<xsl:otherwise>
												<xsl:attribute name="class">priority priority-low</xsl:attribute>
											</xsl:otherwise>
										</xsl:choose>
										<xsl:value-of select="sitemap:priority"/>
									</span>
								</td>
								<td>
									<xsl:value-of select="sitemap:lastmod"/>
								</td>
							</tr>
						</xsl:for-each>
					</tbody>
				</table>
			</body>
		</html>
	</xsl:template>
</xsl:stylesheet>
