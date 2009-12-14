# Search

def search_link(form, session):
	txt = form.getvalue('txt')
	dt = form.getvalue('dt')
	query = form.getvalue('query')
	sflist = ['`tab%s`.name' % dt]
	if query:
		if '%(key)s' in query:
			query = query.replace('%(key)s', 'name')
		if '%s' in query:
			query = query % (txt + '%')

		res = sql(query)
	else:
		sf = sql('select search_fields from tabDocType where name = "%s"' % dt)
		sf = sf and sf[0][0] or ''
		if sf:
			sf = sf.split(',')
			for s in sf:
				sflist.append('`tab%s`.`%s`' % (dt, s.strip()))

		q = """
			SELECT %(fields)s 
			FROM `tab%(dt)s` 
			WHERE `tab%(dt)s`.`%(key)s` LIKE '%(txt)s' AND `tab%(dt)s`.docstatus != 2
			ORDER BY `tab%(dt)s`.`%(key)s` 
			DESC LIMIT %(start)s, %(len)s """ % {
				'fields': ', '.join(sflist),
				'dt': dt,
				'key': 'name',
				'txt': txt + '%',
				'start': '0', 
				'len': '10'
			}

		res = runquery(form, session, q, ret=1)

	# make output
	results = []
	for r in res:
		info = ''
		if len(r) > 1:
			info = ','.join([server.cstr(t) for t in r[1:]])
			if len(info) > 30:
				info = info[:30] + '...'
				
		results.append({'id':r[0], 'value':r[0], 'info':info})
	out['results'] = results
	
def search2(form, session):
	dt = form.getvalue('doctype')
	txt = form.getvalue('txt') or ''
	key = form.getvalue('searchfield') or 'name' # key field
	start = form.getvalue('start') or 0
	page_len = form.getvalue('page_len') or 50
	user_query = form.getvalue('query') or ''

	# get additional search fields
	sflist = sql("select search_fields from tabDocType where name = '%s'" % dt)
	sflist = sflist and sflist[0][0] and sflist[0][0].split(',') or []

	sflist = ['name'] + sflist
	if not key in sflist:
		sflist = sflist + [key]

	sflist = ['`tab%s`.`%s`' % (dt, f.strip()) for f in sflist]

	if not user_query:
		query = """
			SELECT %(fields)s 
			FROM `tab%(dt)s` 
			WHERE `tab%(dt)s`.`%(key)s` LIKE '%(txt)s' 
				AND `tab%(dt)s`.docstatus != 2
			ORDER BY `tab%(dt)s`.`%(key)s` 
			DESC LIMIT %(start)s, %(len)s """ % {
				'fields': ', '.join(sflist),
				'dt': dt,
				'key': key,
				'txt': txt + '%',
				'start': start, 
				'len': page_len
			}
	else:
		if '%(key)s' in user_query:
			user_query = user_query.replace('%(key)s', key)
		if '%s' in user_query:
			user_query = user_query % (txt + '%')
		
		query = user_query

	runquery(form, session, query)
