import webnotes
import webnotes.model.doc

def getdoc():
	import webnotes
	
	form = webnotes.form
	session = webnotes.session
	
	doclist = []
	if form.getvalue('doctype'):
		doclist = load_single_doc(form.getvalue('doctype'), form.getvalue('name'), (form.getvalue('user') or session['user']))

		# execute page
		#import webnotes.utils
		#if form.getvalue('doctype')=='Page' and webnotes.utils.cint(form.getvalue('is_page'))==1:
			# check for import
		#	doclist[0].__script = server.page_import(doclist[0].script)
			
		#	if doclist[0].fields.get('content') and doclist[0].content.startswith('#python'):
		#		doclist[0].__content = server.exec_page(doclist[0].content)

	# add tweets and n of comments
	load_comments(doclist[0].doctype, doclist[0].name)

	if form.getvalue('getdoctype'):
		import webnotes.model.doctype
		doclist += webnotes.model.doctype.get(form.getvalue('doctype'))

	webnotes.response['docs'] = doclist
	

def load_comments(dt, dn):
	try:
		tag = dt + '/' + dn
		webnotes.response['n_tweets'] = server.cint(sql("select count(*) from tabTweet where tag=%s", (tag))[0][0] or 0)
		lc = webnotes.conn.sql("select creation,`by`,comment from tabTweet where tag=%s order by name desc limit 1", tag)
		webnotes.response['last_comment'] = lc and [server.cstr(t) for t in lc[0]] or []
	except: 
		pass

def getdoctype():
	# load parent doctype too
	from webnotes.model.doctype import get
	
	form, doclist = webnotes.form, []
	
	dt = form.getvalue('doctype')
	with_parent = form.getvalue('with_parent')

	# with parent (called from report builder)
	if with_parent:
		parent_dt = self.get_parent_dt()
		if parent_dt:
			doclist = get(parent_dt)
			webnotes.response['parent_dt'] = parent_dt
	
	if not doclist:
		doclist = get(dt)
	
	# if single, send the record too
	if doclist[0].issingle:
		doclist += webnotes.model.doc.get(dt)

	# load search criteria for reports (all)
	doclist += get_search_criteria(dt)

	webnotes.response['docs'] = doclist

def load_single_doc(dt, dn, user):
	import webnotes.model.code

	if not dn: dn = dt
	dl = webnotes.model.doc.get(dt, dn)

	try:
		so = webnotes.model.code.get_server_obj(dl[0], dl)
		r = webnotes.model.code.run_server_obj(so, 'onload')
		if hasattr(so, 'custom_onload'):
			r = webnotes.model.code.run_server_obj(so, 'custom_onload')
		if r: 
			webnotes.msgprint(r)
	except Exception, e:
		webnotes.errprint(webnotes.utils.getTraceback())
		webnotes.msgprint('Error in script while loading')
		raise e

	if dl and not dn.startswith('_'):
		webnotes.user.update_recent(dt, dn)

	# load search criteria ---- if doctype
	if dt=='DocType':
		dl += get_search_criteria(dt)

	return dl
	
def get_search_criteria(dt):
	# load search criteria for reports (all)
	dl = []
	try: # bc
		sc_list = webnotes.conn.sql("select name from `tabSearch Criteria` where doc_type = '%s' or parent_doc_type = '%s' and (disabled!=1 OR disabled IS NULL)" % (dt, dt))
		for sc in sc_list:
			dl += webnotes.model.doc.get('Search Criteria', sc[0])
	except Exception, e:
		pass # no search criteria
	return dl
	