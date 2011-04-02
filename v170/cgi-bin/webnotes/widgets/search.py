# Search
import webnotes

# this is called when a new doctype is setup for search - to set the filters
def getsearchfields():

	sf = webnotes.conn.sql("select search_fields from tabDocType where name=%s", webnotes.form.getvalue("doctype"))
	sf = sf and sf[0][0] or ''
	sf = [s.strip() for s in sf.split(',')]
	if sf and sf[0]:
		res =  webnotes.conn.sql("select fieldname, label, fieldtype, options from tabDocField where parent='%s' and fieldname in (%s)" % (webnotes.form.getvalue("doctype","_NA"), '"'+'","'.join(sf)+'"'))
	else:
		res = []

	res = [[c or '' for c in r] for r in res]
	for r in res:
		if r[2]=='Select' and r[3] and r[3].startswith('link:'):
			dt = r[3][5:]
			ol = webnotes.conn.sql("select name from `tab%s` where docstatus!=2 order by name asc" % dt)
			r[3] = '\n'.join([''] + [o[0] for o in ol])

	webnotes.response['searchfields'] = [['name', 'ID', 'Data', '']] + res

def make_query(fields, dt, key, txt, start, length):
	return  """SELECT %(fields)s 
		FROM `tab%(dt)s` 
		WHERE `tab%(dt)s`.`%(key)s` LIKE '%(txt)s' AND `tab%(dt)s`.docstatus != 2
		ORDER BY `tab%(dt)s`.`%(key)s` 
		DESC LIMIT %(start)s, %(len)s """ % {
			'fields': fields,
			'dt': dt,
			'key': key,
			'txt': txt + '%',
			'start': start, 
			'len': length
		}

def get_std_fields_list(dt, key):
	# get additional search fields
	sflist = webnotes.conn.sql("select search_fields from tabDocType where name = '%s'" % dt)
	sflist = sflist and sflist[0][0] and sflist[0][0].split(',') or []

	sflist = ['name'] + sflist
	if not key in sflist:
		sflist = sflist + [key]

	return ['`tab%s`.`%s`' % (dt, f.strip()) for f in sflist]

def build_for_autosuggest(res):
	from webnotes.utils import cstr
	
	results = []
	for r in res:
		info = ''
		if len(r) > 1:
			info = ','.join([cstr(t) for t in r[1:]])
			if len(info) > 30:
				info = info[:30] + '...'
				
		results.append({'id':r[0], 'value':r[0], 'info':info})
	return results
	
def scrub_custom_query(query, key, txt):
	if '%(key)s' in query:
		query = query.replace('%(key)s', key)
	if '%s' in query:
		query = query.replace('%s', key)
		
	return query

# this is called by the Link Field
def search_link():
	import webnotes.widgets.query_builder

	txt = webnotes.form.getvalue('txt')
	dt = webnotes.form.getvalue('dt')
	query = webnotes.form.getvalue('query')
	
	if query:
		res = webnotes.conn.sql(scrub_custom_query(query, 'name', txt))
	else:
		q = make_query(', '.join(get_std_fields_list(dt, 'name')), dt, 'name', txt, '0', '10')
		res = webnotes.widgets.query_builder.runquery(q, ret=1)

	# make output
	webnotes.response['results'] = build_for_autosuggest(res)

# this is called by the search box
def search_widget():
	import webnotes.widgets.query_builder

	dt = webnotes.form.getvalue('doctype')
	txt = webnotes.form.getvalue('txt') or ''
	key = webnotes.form.getvalue('searchfield') or 'name' # key field
	user_query = webnotes.form.getvalue('query') or ''

	if user_query:
		query = scrub_custom_query(user_query, key, txt)
	else:
		query = make_query(', '.join(get_std_fields_list(dt, key)), dt, key, txt, webnotes.form.getvalue('start') or 0, webnotes.form.getvalue('page_len') or 50)
	
	webnotes.widgets.query_builder.runquery(query)
