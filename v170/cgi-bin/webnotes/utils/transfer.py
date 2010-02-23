# accept a module coming from a remote server
def accept_module(super_doclist):
	import webnotes
	import webnotes.utils
	from webnotes.model.import_docs import set_doc
	
	cint = webnotes.utils.cint
	msg, i = [], 0

	for dl in super_doclist:
		msg.append(set_doc(dl, cint(form.getvalue('ovr')), cint(form.getvalue('ignore')), cint(form.getvalue('onupdate'))))
	msg = '<br>'.join(msg)

	if not webnotes.conn.in_transaction:
		webnotes.conn.sql("START TRANSACTION")
	webnotes.utils.clear_recycle_bin()
	webnotes.conn.sql("COMMIT")

	out['message'] = msg

# prepare a list of items in a module
def get_module_items(mod):
	import webnotes

	transfer_types = ['Role', 'Print Format','DocType','Page','DocType Mapper','Search Criteria','Menu Item','TDS Category','TDS Rate Chart']
	dl = ['Module Def,'+mod]
	  
	for dt in transfer_types:
		try:
			dl2 = webnotes.conn.sql('select name from `tab%s` where module="%s"' % (dt,mod))
			dl += [(dt+','+e[0]) for e in dl2]
		except:
			pass
	
	dl1 = webnotes.conn.sql('select doctype_list from `tabModule Def` where name=%s', mod)
	dl1 = dl1 and dl1[0][0] or ''
	if dl1:
		dl += dl1.split('\n')

	# build finally
	dl = [e.split(',') for e in dl]
	dl = [[e[0].strip(), e[1].strip()] for e in dl] # remove blanks
	return dl

# build a list of doclists of items in that module and send them
def get_module():
	import webnotes
	import webnotes.model.doc
	
	module = webnotes.form.getvalue('module')
	item_list = get_module_items(module)
	
	# build the super_doclist
	super_doclist = []
	for i in item_list:
		dl = webnotes.model.doc.get(i[0], i[1])
		
		# remove compiled code (if any)
		if dl[0].server_code_compiled:
			dl[0].server_code_compiled = None
			
		# add to super
		super_doclist.append([d.fields for d in dl])
		
	webnotes.response['super_doclist'] = super_doclist