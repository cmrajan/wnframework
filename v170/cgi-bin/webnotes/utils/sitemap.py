# to generate sitemaps

frame_xml = """<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">%s
</urlset>"""

# generate the sitemap XML
def generate_xml(conn, site_prefix):
	global frame_xml
	import urllib

	# settings
	max_doctypes = 10
	max_items = 1000
	
	site_map = ''
	# list of all Guest pages (static content)
	for r in conn.sql("SELECT tabPage.name, tabPage.modified FROM `tabPage Role`, tabPage WHERE `tabPage Role`.role='Guest' AND `tabPage Role`.parent = tabPage.name ORDER BY tabPage.modified DESC"):
		site_map += '\n<url><loc>%s?page=Page/%s</loc><lastmod>%s</lastmod></url>' % (site_prefix, urllib.quote(r[0]), r[1].strftime('%Y-%m-%d'))
	
	# list of all Records that are viewable by guests (Blogs, Articles etc)
	for dt in conn.sql("SELECT DISTINCT parent FROM `tabDocPerm` WHERE role='Guest' AND IFNULL(`read`,0) = 1 AND IFNULL(`permlevel`,0) = 0 LIMIT %s" % max_doctypes):
		
		for d in conn.sql("SELECT name, modified FROM `tab%s` WHERE docstatus != 2 ORDER BY modified DESC LIMIT %s" % (dt[0], max_items)):
		
			site_map += '\n<url><loc>%s?page=Form/%s/%s</loc><lastmod>%s</lastmod></url>' % (site_prefix, dt[0], urllib.quote(d[0]), d[1].strftime('%Y-%m-%d'))

	return frame_xml % site_map

# to be called by cron
def create(site_prefix, ac_name = None):
	fname = os.path.dirname(__file__) + '/../../../sitemap.xml'

	import webnotes.db
	conn = webnotes.db.Database(use_default=1)
		
	if ac_name:
		db_name = conn.sql('select db_name from tabAccount where ac_name=%s', ac_name)[0][0]
		conn = webnotes.db.Database(user = db_name)
		conn.use(db_name)
		
	xml = generate_xml(conn, site_prefix)
	
	f = open(fname, 'w')
	f.write(xml)
	f.close()

# executed form command line
if __name__ == '__main__':
	import sys
	
	if not len(sys.argv) > 1:
		print "Please specify the site prefix as argument\nExample: 'http://www.example.com/'"
		
	import sys, os
	
	sys.path.append(os.path.abspath(os.path.dirname(sys.argv[0]) + '/../../'))

	create(sys.argv[1], sys.argv[2])