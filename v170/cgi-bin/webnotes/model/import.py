# IMPORT DOCS
# -----------

def import_docs(docs = []):

	doc_list = {}
	created_docs = []
	already_exists = []

	out, tmp ="", ""

	for d in docs:
		cur_doc = Document(fielddata = d)
		if not cur_doc.parent in already_exists: # parent should not exist
			try:
				cur_doc.save(1)
				out += "Created: " + cur_doc.name + "\n"
				created_docs.append(cur_doc)
	
				# make in groups
				if cur_doc.parent:
					if not doc_list.has_key(cur_doc.parent):
						doc_list[cur_doc.parent] = []
					doc_list[cur_doc.parent].append(cur_doc)

			except Exception, e:
				out += "Creation Warning/Error: " + cur_doc.name + " :"+ str(e) + "\n"
				already_exists.append(cur_doc.name)

	# Run scripts for main docs
	for m in created_docs:
		if doc_list.has_key(m.name):
			tmp = run_server_obj(get_server_obj(m, doc_list.get(m.name, [])),'on_update')
			out += 'Executed: '+ str(m.name) + ', Err:' + str(tmp) + "\n"

	return out

def ovr_doctype(doclist, ovr, ignore, onupdate):
	doclist = [Document(fielddata = d) for d in doclist]
	doc = doclist[0]
	cur_doc = Document('DocType',doc.name)
	added = 0
	
	# fields
	# ------
	for d in getlist(doclist, 'fields'):
		# if exists
		if d.fieldname:
			fld = sql("select name from tabDocField where fieldname=%s and parent=%s", (d.fieldname, d.parent))
		else:
			fld = sql("select name from tabDocField where label=%s and parent=%s", (d.label, d.parent))

		if (not fld) and d.label: # must have label
			# re number - following fields
			
			sql("update tabDocField set idx = idx + 1 where parent=%s and idx > %s", (d.parent, d.idx))
			
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore)
			added += 1

	# code
	# ----
	
	cur_doc.server_code_core = cstr(doc.server_code_core)
	cur_doc.client_script_core = cstr(doc.client_script_core)
	
	cur_doc.save(ignore_fields = ignore)
	
	if onupdate:
		so = get_obj('DocType', doc.name, with_children = 1)
		if hasattr(so, 'on_update'):
			so.on_update()

	if in_transaction: sql("COMMIT")

	return doc.name + (' Upgraded: %s fields added' % added)

def set_doc(doclist, ovr=0, ignore=1, onupdate=1):
	global in_transaction
	override = 0
	
	if not doclist:
		return 'No Doclist'
	doc = Document(fielddata = doclist[0])
	orig_modified = doc.modified

	exists = db_exists(doc.doctype, doc.name)

	if not in_transaction: sql("START TRANSACTION")
	
	if exists: 
		if ovr:
			# Special Treatement
			# ------------------
			if db_exists('DocType', 'Transfer Control'):
				tc = get_obj('Transfer Control')
				if tc.override_transfer.has_key(doc.doctype):
					return getattr(tc, tc.override_transfer.get(doc.doctype))(doclist, ovr, ignore, onupdate) # done
			
			if doc.doctype == 'DocType':
				return ovr_doctype(doclist, ovr, ignore, onupdate) # done

			# Replace the record
			# ------------------

			# remove main doc
			newname = '__overwritten:'+doc.name
			n_records = sql("SELECT COUNT(*) from `tab%s` WHERE name like '%s%%'" % (doc.doctype, newname))
			if n_records[0][0]:
				newname = newname + '-' + str(n_records[0][0])
				
			sql("UPDATE `tab%s` SET name='%s', docstatus=2 WHERE name = '%s' limit 1" % (doc.doctype, newname, doc.name))
			
			# remove child elements
			tf_list = db_gettablefields(doc.doctype)
			for t in tf_list:
				sql("UPDATE `tab%s` SET parent='%s', docstatus=2 WHERE parent='%s' AND parentfield='%s'" % (t[0], 'oldparent:'+doc.name, doc.name, t[1]))
				
		else:
			if in_transaction: sql("ROLLBACK")
			return doc.name + " Exists / No change"

	# save main
	doc.save(new = 1, ignore_fields = ignore, check_links=0)
	
	# save others
	dl = [doc]
	for df in doclist[1:]:
		try:
			d = Document(fielddata = df)
			d.save(new = 1, ignore_fields = ignore)
			dl.append(d)
		except:
			pass # ignore tables
	
	if onupdate:
		so = get_server_obj(doc, dl)
		if hasattr(so, 'on_update'):
			so.on_update()

	# reset modified
	set(doc, 'modified', orig_modified)

	if in_transaction: sql("COMMIT")

	return doc.name + ' Completed'	
