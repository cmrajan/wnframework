import webnotes
import webnotes.model.doc

def getdoc():
	import webnotes
	
	form = webnotes.form
	
	doclist = []
	if form.getvalue('doctype'):
		doclist = load_single_doc(form.getvalue('doctype'), form.getvalue('name'), (form.getvalue('user') or webnotes.session['user']))

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

#===========================================================================================

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

#===========================================================================================

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

#===========================================================================================

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

# Runserverobj - run server calls from form
#===========================================================================================

def runserverobj():
	import webnotes.model.code
	import webnotes.model.doclist
	from webnotes.utils import cint

	form = webnotes.form

	method = form.getvalue('method')
	doclist, clientlist = [], []
	arg = form.getvalue('arg')
	dt = form.getvalue('doctype')
	dn = form.getvalue('docname')
		
	if dt: # not called from a doctype (from a page)
		if not dn: dn = dt # single
		so = webnotes.model.code.get_obj(dt, dn)
	else:
		clientlist = webnotes.model.doclist.expand(form.getvalue('docs'))

		# find main doc
		for d in clientlist:
			if cint(d.get('docstatus')) != 2 and not d.get('parent'):
				main_doc = webnotes.model.doc.Document(fielddata = d)
	
		# find child docs
		for d in clientlist:
			doc = webnotes.model.doc.Document(fielddata = d)
			if doc.fields.get('parent'):
				doclist.append(doc)	
	
		so = webnotes.model.code.get_server_obj(main_doc, doclist)
				
	if so:
		try:
			r = webnotes.model.code.run_server_obj(so, method, arg)
			doclist = so.doclist # reference back [in case of null]
			if r:
				try:
					if r['doclist']:
						clientlist += r['doclist']
				except:
					pass
				webnotes.response['message'] = r
			if clientlist:
				doclist.append(main_doc)
				webnotes.response['docs'] = doclist
		except Exception, e:
			webnotes.errprint(webnotes.utils.getTraceback())
			raise e
	
# Document Save
#===========================================================================================

def _get_doclist(clientlist):
	# converts doc dictionaries into Document objects

	from webnotes.model.doc import Document
	form = webnotes.form

	midx = 0
	for i in range(len(clientlist)):
		if clientlist[i]['name'] == form.getvalue('docname'):
			main_doc = Document(fielddata = clientlist[i])
			midx = i
		else:
			clientlist[i] = Document(fielddata = clientlist[i])

	del clientlist[midx]
	return main_doc, clientlist

def _do_action(doc, doclist, so, method_name, docstatus):
	from webnotes.model.code import run_server_obj
	set = webnotes.conn.set

	if so and hasattr(so, method_name):
		errmethod = method_name
		run_server_obj(so, method_name)
		if hasattr(so, 'custom_'+method_name):
			run_server_obj(so, 'custom_'+method_name)
		errmethod = ''

		for d in [doc] + doclist:
			set(d, 'docstatus', docstatus)
			
	else:
		for d in [doc] + doclist:
			set(d, 'docstatus', docstatus)

def savedocs():
	import webnotes.model.doclist
	
	from webnotes.model.code import get_server_obj
	from webnotes.model.code import run_server_obj
	import webnotes.utils
	
	from webnotes.utils import cint

	sql = webnotes.conn.sql
	form = webnotes.form
	
	# action
	action = form.getvalue('action')
	
	# get docs	
	doc, doclist = _get_doclist(webnotes.model.doclist.expand(form.getvalue('docs')))

	# get server object	
	server_obj = get_server_obj(doc, doclist)
	
	# check for integrity / transaction safety
	res = sql('SELECT issingle FROM tabDocType WHERE name="%s"' % doc.doctype)
	if res:
		is_single = res[0][0]
	else:
		webnotes.errprint('DocType not found "%s"' % doc.doctype)
		return
		
	if (not is_single) and (not doc.fields.get('__islocal')):
		tmp = sql('SELECT modified FROM `tab%s` WHERE name="%s"' % (doc.doctype, doc.name))
		if tmp and str(tmp[0][0]) != str(doc.modified):
			webnotes.msgprint('Document has been modified after you have opened it. To maintain the integrity of the data, you will not be able to save your changes. Please refresh this document. [%s/%s]' % (tmp[0][0], doc.modified))
			return
	
	# validate links
	ret = webnotes.model.doclist.validate_links_doclist([doc] + doclist)
	if ret:
		webnotes.msgprint("[Link Validation] Could not find the following values: %s. Please correct and resave. Document Not Saved." % ret)
		return

	# saving & post-saving
	try:

		# validate befor saving and submitting
		if action in ('Save', 'Submit') and server_obj:
			if hasattr(server_obj, 'validate'):	
				t = run_server_obj(server_obj, 'validate')
			if hasattr(server_obj, 'custom_validate'):
				t = run_server_obj(server_obj, 'custom_validate')
				
		# set owner and modified times
		is_new = cint(doc.fields.get('__islocal'))
		if is_new and not doc.owner:
			doc.owner = form.getvalue('user')
		
		doc.modified, doc.modified_by = webnotes.utils.now(), webnotes.session['user']
		
		# save main doc
		try:
			t = doc.save(is_new)
		except NameError, e:
			webnotes.msgprint('Name Exists')
			webnotes.errprint(webnotes.utils.getTraceback())
			raise e
		
		# save child docs
		for d in doclist:
			deleted, local = d.fields.get('__deleted',0), d.fields.get('__islocal',0)
	
			if cint(local) and cint(deleted):
				pass
			elif d.fields.has_key('parent'):
				if d.parent and (not d.parent.startswith('old_parent:')):
					d.parent = doc.name # rename if reqd
					d.parenttype = doc.doctype
				d.modified, d.modified_by = webnotes.utils.now(), webnotes.session['user']
				d.save(new = cint(local))
	
		# on_update
		if action in ('Save','Submit') and server_obj:

			if hasattr(server_obj, 'on_update'):
				t = run_server_obj(server_obj, 'on_update')
				if t: webnotes.msgprint(t)

			if hasattr(server_obj, 'custom_on_update'):
				t = run_server_obj(server_obj, 'custom_on_update')
				if t: webnotes.msgprint(t)
				
		# on_submit
		if action == 'Submit':
			_do_action(doc, doclist, server_obj, 'on_submit', 1)
	
		# on_cancel
		if action == 'Cancel':
			_do_action(doc, doclist, server_obj, 'on_cancel', 2)
	
		# update recent documents
		webnotes.user.update_recent(doc.doctype, doc.name)

		# send updated docs
		webnotes.response['saved'] = '1'
		webnotes.response['main_doc_name'] = doc.name
		webnotes.response['docname'] = doc.name
		webnotes.response['docs'] = [doc] + doclist

	except Exception, e:
		webnotes.msgprint('Did not save')
		webnotes.errprint(webnotes.utils.getTraceback())
		raise e
