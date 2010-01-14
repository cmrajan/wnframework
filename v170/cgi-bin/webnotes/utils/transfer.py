
# ----------------------------------------
# Account Transfer using HTTP Web Services
# ----------------------------------------

def acctr_get_sid(form, session):
	rem_serv = webnotes.utils.webservice.FrameworkServer(
		form.getvalue('server')
		,form.getvalue('path')
		,form.getvalue('user')
		,form.getvalue('pwd')
		,form.getvalue('account', '')
	)
	
	out['sid'] = rem_serv.cookies['sid150']
	out['dbx'] = rem_serv.cookies.get('dbx','')
	out['__account'] = rem_serv.account_id
	
	# get 500 doctypes
	res = rem_serv.http_get_response('acctr_remote_dtlist', args = {
		'dt':'DocType', 'txt':'', 'limit':'500'
	})
	
	# return 500 doctypes
	data = eval(res.read())
	if data.get('dt_list', []): out['dt_list'] = data['dt_list']	

	# get modules defs
	res = rem_serv.http_get_response('acctr_remote_dtlist', args = {
		'dt':'Module Def' ,'txt':'' ,'limit':'500'
	})
	
	data = eval(res.read())
	if data.get('dt_list', []): out['moduledef_list'] = data['dt_list']

def acctr_get_dtlist(form, session):
	# get doctype list
	rem_serv = webnotes.utils.webservice.FrameworkServer(
		form.getvalue('server')
		,form.getvalue('path')
		,cookies = { 'sid150': form.getvalue('sid'), 'dbx': form.getvalue('dbx', '') }
	)
	
	# get records
	res = rem_serv.http_get_response('acctr_remote_dtlist', args = {
		'dt':form.getvalue('dt')
		,'txt':form.getvalue('txt', '')
		,'limit':form.getvalue('limit', '100')
	})
	
	# return 500 doctypes
	data = eval(res.read())
	if data.get('dt_list', []):
		out['dt_list'] = data['dt_list']	

def acctr_do_transfer(form, session):
	# get doclist from source
	# -----------------------
		
	# connect
	src_serv = webnotes.utils.webservice.FrameworkServer(
		form.getvalue('src_server')
		,form.getvalue('src_path')
		,cookies = { 'sid150': form.getvalue('src_sid'), 'dbx': form.getvalue('src_dbx') }
	)
	
	# get
	myargs = {'__account':form.getvalue('src__account')}
	if form.has_key('dt'): myargs['dt'] = form.getvalue('dt')
	if form.has_key('dn'): myargs['dn'] = form.getvalue('dn')
	if form.has_key('query'): myargs['query'] = form.getvalue('query')
	if form.has_key('moduledef'): myargs['moduledef'] = form.getvalue('moduledef')
	
	res = src_serv.http_get_response(
		method = 'acctr_remote_getdoclist', 
		args = myargs,
	)
	data = res.read()

	# if no, then return error

	# put it in target
	# ----------------

	# connect
	tar_serv = webnotes.utils.webservice.FrameworkServer(
		form.getvalue('tar_server')
		,form.getvalue('tar_path')
		,cookies = { 'sid150': form.getvalue('tar_sid'), 'dbx': form.getvalue('tar_dbx') }
	)

	# set
	myargs = {
		'ovr': form.getvalue('ovr'),
		'ignore': form.getvalue('ignore'),
		'onupdate': form.getvalue('onupdate'),
		'super_doclist': data,
		'__account':form.getvalue('tar__account')
	}
	
	res = tar_serv.http_get_response(
		method = 'acctr_remote_setdoclist',
		args = myargs 
	)
	data = res.read()
	data = eval(data)

	out['message'] = data['message']
	if data.has_key('exc'):
		out['exc']=data['exc']

def acctr_remote_dtlist(form, session):
	dt = form.getvalue('dt')
	limit = form.getvalue('limit', '100')
	dl = sql("SELECT name FROM `tab%s` WHERE name LIKE '%s%%' LIMIT %s" % (dt, form.getvalue('txt', ''), limit))
	out['dt_list'] = '\n'.join([t[0] for t in dl])

# create doclist to send for transfer
def acctr_remote_getdoclist(form, session):
	super_doclist = []

	# one at a time
	if form.has_key('dt'):
		t = server.getdoc(form.getvalue('dt'), form.getvalue('dn'))
		if t[0].server_code_compiled:
			t[0].server_code_compiled = None
		super_doclist.append([d.fields for d in t])

	# from a query
	if form.has_key('query'):
		dl = sql(form.getvalue('query'))
		for d in dl:
			t = server.getdoc(d[0], d[1])
			if t[0].server_code_compiled:
				t[0].server_code_compiled = None			
			super_doclist.append([d.fields for d in t])
			
	# from moduledef
	if form.has_key('moduledef'):
		dl = get_module_items(form.getvalue('moduledef'))
		for d in dl:
			t = server.getdoc(d[0], d[1])
			if t[0].server_code_compiled:
				t[0].server_code_compiled = None			
			super_doclist.append([d.fields for d in t])

	# return
	out['super_doclist'] = super_doclist

def acctr_remote_setdoclist(form, session):
	cint = server.cint
		
	msg, i = [], 0
	super_doclist = eval(form.getvalue('super_doclist'))['super_doclist']

	for dl in super_doclist:
		msg.append(server.set_doc(dl, cint(form.getvalue('ovr')), cint(form.getvalue('ignore')), cint(form.getvalue('onupdate'))))
	msg = '<br>'.join(msg)

	if not server.in_transaction:
		sql("START TRANSACTION")
	server.clear_recycle_bin()
	sql("COMMIT")

	out['message'] = msg