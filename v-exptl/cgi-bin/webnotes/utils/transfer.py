# accept a module coming from a remote server
# ==============================================================================
def accept_module(super_doclist):
	import webnotes
	import webnotes.utils
	
	form = webnotes.form
	cint = webnotes.utils.cint
	msg, i = [], 0

	for dl in super_doclist:
		msg.append(set_doc(dl, 1, 1, 1, 0))
	msg = '<br>'.join(msg)

	if not webnotes.conn.in_transaction:
		webnotes.conn.sql("START TRANSACTION")

	# clear over-written records / deleted child records
	webnotes.utils.clear_recycle_bin()
	
	# clear cache
	webnotes.conn.sql("DELETE from __DocTypeCache")
	webnotes.conn.sql("COMMIT")


	return msg

# prepare a list of items in a module
# ==============================================================================

def get_module_items(mod):
	import webnotes

	transfer_types = ['Role', 'Print Format','DocType','Page','DocType Mapper','Search Criteria','TDS Category','TDS Rate Chart']
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
# ==============================================================================

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


# Import a record (with its chilren)
# ==============================================================================
def set_doc(doclist, ovr=0, ignore=1, onupdate=1, allow_transfer_control=1):
	import webnotes
	from webnotes.model.doc import Document
	from webnotes.model.code import get_obj
	from webnotes.model.code import get_server_obj
	from webnotes.model.meta import get_table_fields
	
	sql = webnotes.conn.sql
	override = 0
	
	if not doclist:
		return 'No Doclist'
	doc = Document(fielddata = doclist[0])
	orig_modified = doc.modified

	exists = webnotes.conn.exists(doc.doctype, doc.name)

	print doc.name

	if not webnotes.conn.in_transaction: 
		sql("START TRANSACTION")
	
	if exists: 
		if ovr:
			# Special Treatement
			# ------------------
			if allow_transfer_control:
				#if webnotes.conn.exists('DocType', 'Transfer Control'):
				#	tc = get_obj('Transfer Control')
				#	if tc.override_transfer.has_key(doc.doctype):
				#		return getattr(tc, tc.override_transfer.get(doc.doctype))(doclist, ovr, ignore, onupdate)
			
				if doc.doctype == 'DocType':
					return ovr_doctype(doclist, ovr, ignore, onupdate) 

				if doc.doctype == 'DocType Mapper':
					return ovr_mapper(doclist, ovr, ignore, onupdate)

				if doc.doctype == 'Module Def':
					return ovr_module_def(doclist, ovr, ignore, onupdate)
					
			# check modified timestamp
			# ------------------------
			ts = sql("select modified from `tab%s` where name=%s" % (doc.doctype, '%s'), doc.name)[0][0]
			if str(ts)==doc.modified:
				return doc.name + ": No update"

			# Replace the record
			# ------------------

			# remove main doc
			newname = '__overwritten:'+doc.name
			n_records = sql("SELECT COUNT(*) from `tab%s` WHERE name like '%s%%'" % (doc.doctype, newname))
			if n_records[0][0]:
				newname = newname + '-' + str(n_records[0][0])
				
			sql("UPDATE `tab%s` SET name='%s', docstatus=2 WHERE name = '%s' limit 1" % (doc.doctype, newname, doc.name))
			
			# remove child elements
			tf_list = get_table_fields(doc.doctype)
			for t in tf_list:
				sql("UPDATE `tab%s` SET parent='%s', docstatus=2 WHERE parent='%s' AND parentfield='%s'" % (t[0], 'oldparent:'+doc.name, doc.name, t[1]))
				
		else:
			if webnotes.conn.in_transaction: 
				sql("ROLLBACK")
			return doc.name + ": Exists / No change"

	# save main
	doc.save(new = 1, ignore_fields = ignore, check_links=0)
	
	# save others
	dl = [doc]
	for df in doclist[1:]:
		try:
			d = Document(fielddata = df)
			d.save(new = 1, ignore_fields = ignore, check_links=0)
			dl.append(d)
		except:
			pass # ignore tables
	
	if onupdate:
		if doc.doctype=='DocType':
			import webnotes.model.doctype
			webnotes.model.doctype.update_doctype(dl)
		else:
			so = get_server_obj(doc, dl)
			if hasattr(so, 'on_update'):
				so.on_update()
			
		
	# reset modified
	webnotes.conn.set(doc, 'modified', orig_modified)

	if webnotes.conn.in_transaction: 
		sql("COMMIT")

	return doc.name + ': Completed'


# Transfer DocType
# ==============================================================================

def ovr_doctype(doc_list, ovr, ignore, onupdate):
	import webnotes
	from webnotes.model.doc import Document
	from webnotes.model import doclist
	from webnotes.utils import cint
	from webnotes.utils import cstr
	doc_list = [Document(fielddata = d) for d in doc_list]
	doc = doc_list[0]
	orig_modified = doc.modified
	cur_doc = Document('DocType',doc.name)
	added = 0
	prevfield = ''
	prevlabel = ''
	idx = 0
	fld_lst = ''
	
	sql = webnotes.conn.sql

	# fields
	# ------
	for d in doclist.getlist(doc_list, 'fields'):
		fld = ''
		# if exists
		if d.fieldname:
			fld = sql("select name from tabDocField where fieldname=%s and parent=%s", (d.fieldname, d.parent))
		elif d.label: # for buttons where there is no fieldname
			fld = sql("select name from tabDocField where label=%s and parent=%s", (d.label, d.parent))

		if (not fld) and d.label: # must have label
			if prevfield:
				idx = sql("select idx from tabDocField where fieldname = %s and parent = %s",(prevfield,d.parent))[0][0]
			elif prevlabel and not prevfield:
				idx = sql("select idx from tabDocField where label = %s and parent = %s",(prevlabel,d.parent))[0][0]
			sql("update tabDocField set idx = idx + 1 where parent=%s and idx > %s", (d.parent, cint(idx)))					

			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.idx = cint(idx)+1
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += 'Label : '+cstr(d.label)+'	 ---	 Fieldtype : '+cstr(d.fieldtype)+'	 ---	 Fieldname : '+cstr(d.fieldname)+'	 ---	 Options : '+cstr(d.options)
			added += 1
			
		# clean up
		if d.fieldname:
			prevfield = d.fieldname
			prevlabel = ''
		elif d.label:
			prevfield = ''
			prevlabel = d.label
			
	# Print Formats
	# -------------
	for d in doclist.getlist(doc_list, 'formats'):
		fld = ''
		# if exists
		if d.format:
			fld = sql("select name from `tabDocFormat` where format=%s and parent=%s", (d.format, d.parent))
					
		if (not fld) and d.format: # must have label
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst = fld_lst + '\n'+'Format : '+cstr(d.format)
			added += 1
				
	# code
	# ----
	
	cur_doc.server_code_core = cstr(doc.server_code_core)
	cur_doc.client_script_core = cstr(doc.client_script_core)
	cur_doc.save(ignore_fields = ignore, check_links = 0)	
	

	# update schema
	# -------------
	import webnotes.model
	try:
		dl = webnotes.model.doc.get('DocType', doc.name)
		webnotes.model.doctype.update_doctype(dl)
	except:
		pass
	
	webnotes.conn.set(doc,'modified',orig_modified)
	
	if webnotes.conn.in_transaction: sql("COMMIT")
	
	if added == 0:
		added_fields = ''
	else:
		added_fields =	' Added Fields :'+ cstr(fld_lst)
		
	return doc.name + (' Upgraded: %s fields added' % added)+added_fields

# Transfer Mapper
# ==============================================================================

def ovr_mapper(doc_list, ovr, ignore, onupdate):
	import webnotes
	from webnotes.model.doc import Document
	from webnotes.model import doclist
	from webnotes.model.code import get_obj
	from webnotes.utils import cint
	from webnotes.utils import cstr
	import webnotes.db
	doc_list = [Document(fielddata = d) for d in doc_list]
	doc = doc_list[0]
	orig_modified = doc.modified
	cur_doc = Document('DocType Mapper',doc.name)
	added = 0
	fld_lst = ''
		
	sql = webnotes.conn.sql
	
	# Field Mapper Details fields
	# ------
	for d in doclist.getlist(doc_list, 'field_mapper_details'):
		fld = ''
		# if exists
		if d.from_field and d.to_field:
			fld = sql("select name from `tabField Mapper Detail` where from_field=%s and to_field=%s and parent=%s", (d.from_field, d.to_field, d.parent))
					
		if (not fld) and d.from_field and d.to_field: # must have label
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += '\n'+'From Field : '+cstr(d.from_field)+'	 ---	 To Field : '+cstr(d.to_field)
			added += 1
			
	# Table Mapper Details fields
	# ------
	for d in doclist.getlist(doc_list, 'table_mapper_details'):
		fld = ''
		# if exists
		if d.from_table and d.to_table: 
			fld = sql("select name from `tabTable Mapper Detail` where from_table=%s and to_table = %s and parent=%s", (d.from_table, d.to_table, d.parent))
					
		if (not fld) and d.from_table and d.to_table: # must have label
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += '\n'+'From Table : '+cstr(d.from_table)+'	 ---	 To Table : '+cstr(d.to_table)
			added += 1
					 
	cur_doc.save(ignore_fields = ignore, check_links = 0)
	
	if onupdate:
		so = get_obj('DocType Mapper', doc.name, with_children = 1)
		if hasattr(so, 'on_update'):
			so.on_update()
	
	webnotes.conn.set(doc,'modified',orig_modified)
	
	if webnotes.conn.in_transaction: sql("COMMIT")
	
	if added == 0:
		added_fields = ''
	else:
		added_fields =	' Added Fields:'+ cstr(fld_lst)
	return doc.name + ('Upgraded: %s fields added' % added)+added_fields

	added = 0
	fld_lst = ''
		
	sql = webnotes.conn.sql
	
	# Field Mapper Details fields
	# ------
	for d in doclist.getlist(doc_list, 'field_mapper_details'):
		fld = ''
		# if exists
		if d.from_field and d.to_field:
			fld = sql("select name from `tabField Mapper Detail` where from_field=%s and to_field=%s and parent=%s", (d.from_field, d.to_field, d.parent))
					
		if (not fld) and d.from_field and d.to_field: # must have label
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += '\n'+'From Field : '+cstr(d.from_field)+'	 ---	 To Field : '+cstr(d.to_field)
			added += 1
			
	# Table Mapper Details fields
	# ------
	for d in doclist.getlist(doc_list, 'table_mapper_details'):
		fld = ''
		# if exists
		if d.from_table and d.to_table: 
			fld = sql("select name from `tabTable Mapper Detail` where from_table=%s and to_table = %s and parent=%s", (d.from_table, d.to_table, d.parent))
					
		if (not fld) and d.from_table and d.to_table: # must have label
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += '\n'+'From Table : '+cstr(d.from_table)+'	 ---	 To Table : '+cstr(d.to_table)
			added += 1
					 
	cur_doc.save(ignore_fields = ignore, check_links = 0)
	
	if onupdate:
		so = get_obj('DocType Mapper', doc.name, with_children = 1)
		if hasattr(so, 'on_update'):
			so.on_update()
	
	webnotes.conn.set(doc,'modified',orig_modified)
	
	if webnotes.conn.in_transaction: sql("COMMIT")
	
	if added == 0:
		added_fields = ''
	else:
		added_fields =	' Added Fields:'+ cstr(fld_lst)
	return doc.name + ('Upgraded: %s fields added' % added)+added_fields


# Transfer Module Def
# ============================================================
def ovr_module_def(doc_list, ovr, ignore, onupdate):
	import webnotes
	from webnotes.model.doc import Document
	from webnotes.model import doclist
	from webnotes.model.code import get_obj
	from webnotes.utils import cint
	from webnotes.utils import cstr
	import webnotes.db
	doc_list = [Document(fielddata = d) for d in doc_list]
	doc = doc_list[0]
	orig_modified = doc.modified
	cur_doc = Document('Module Def',doc.name)
	added, idx = 0, 0
	fld_lst, prev_dt, prev_dn, prev_dis_name = '', '', '', ''
		
	sql = webnotes.conn.sql
	
	# Module Def Item table fields
	for d in doclist.getlist(doc_list, 'items'):
		fld = ''
		# if exists
		if d.doc_type and d.doc_name:
			fld = sql("select name from `tabModule Def Item` where doc_type=%s and doc_name=%s and ifnull(display_name,'') = %s and parent=%s", (d.doc_type, d.doc_name, cstr(d.display_name), d.parent))
					
		if (not fld) and d.doc_type and d.doc_name:
			if prev_dt and prev_dn:
				idx = sql("select idx from `tabModule Def Item` where doc_type = %s and doc_name = %s and ifnull(display_name,'') = %s and parent = %s",(prev_dt, prev_dn, cstr(prev_dis_name), d.parent))[0][0]
			sql("update `tabModule Def Item` set idx = idx + 1 where parent=%s and idx > %s", (d.parent, cint(idx)))
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.idx = cint(idx)+1
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += '\n'+'Doc Type : '+cstr(d.doc_type)+'   ---	 Doc Name : '+cstr(d.doc_name)+'   ---	 Display Name : '+cstr(d.display_name)
			added += 1

		# clean up
		prev_dt = d.doc_type
		prev_dn = d.doc_name
		prev_dis_name = cstr(d.display_name)
			
	cur_doc.save(ignore_fields = ignore, check_links = 0)
	
	if onupdate:
		so = get_obj('Module Def', doc.name, with_children = 1)
		if hasattr(so, 'on_update'):
			so.on_update()
	
	webnotes.conn.set(doc,'modified',orig_modified)
	
	if webnotes.conn.in_transaction: sql("COMMIT")
	
	if added == 0:
		added_fields = ''
	else:
		added_fields =	' Added Fields:'+ cstr(fld_lst)
	return doc.name + ('Upgraded: %s fields added' % added)+added_fields
