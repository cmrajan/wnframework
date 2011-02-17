
# =============================================================================
# Import a record (with its chilren)
# =============================================================================
def set_doc(doclist, ovr=0, ignore=1, onupdate=1):
	import webnotes
	from webnotes.model.doc import Document
	from webnotes.model.code import get_obj
	from webnotes.model.code import get_server_obj
	from webnotes.model.meta import get_table_fields

	sql = webnotes.conn.sql

	if not doclist:
		return 'No Doclist'

	doc = Document(fielddata = doclist[0])
	orig_modified = doc.modified

	# check timestamp
	timestamp = sql("select modified from `tab%s` where name=%s" % (doc.doctype, '%s'), doc.name)
	if timestamp and timestamp[0][0]==doc.modified:
		return doc.doctype + '/' + doc.name + ': Same timestamp - nothing to do'
	
	#print doc.doctype, doc.name
	if not webnotes.conn.in_transaction: 
		sql("START TRANSACTION")
	
	if timestamp:
		 
		if ovr:
			if doc.doctype == 'DocType':
				return merge_doctype(doclist, ovr, ignore, onupdate) 

			if doc.doctype == 'DocType Mapper':
				return merge_mapper(doclist, ovr, ignore, onupdate)

			if doc.doctype == 'Module Def':
				return merge_module_def(doclist, ovr, ignore, onupdate)
			
					
			# check modified timestamp
			# ------------------------
			ts = sql("select modified from `tab%s` where name=%s" % (doc.doctype, '%s'), doc.name)[0][0]
			if str(ts)==doc.modified:
				return doc.name + ": No update"

			# Replace the record
			# ------------------
				
			sql("DELETE FROM `tab%s` WHERE name = '%s' limit 1" % (doc.doctype, doc.name))
			
			# remove child elements
			tf_list = get_table_fields(doc.doctype)
			for t in tf_list:
				sql("DELETE FROM `tab%s` WHERE parent='%s' AND parentfield='%s'" % (t[0], doc.name, t[1]))
				
		else:
			if webnotes.conn.in_transaction: 
				sql("ROLLBACK")
			return doc.name + ": Exists / No change"

	# save main
	check_links = 1	
	if doc.doctype == 'Patch':
		doc.save(make_autoname = 0, new = 1, ignore_fields = ignore, check_links=0)
	else:
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
		so = get_server_obj(doc, dl)
		if hasattr(so, 'on_update'):
			so.on_update()
			
		
	# reset modified
	webnotes.conn.set(doc, 'modified', orig_modified)

	if webnotes.conn.in_transaction: 
		sql("COMMIT")

	return doc.name + ': Completed'


# =============================================================================
# Transfer DocType
# =============================================================================
def merge_doctype(doc_list, ovr, ignore, onupdate):
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
			# add field
			nd = Document(fielddata = d.fields)
			nd.oldfieldname, nd.oldfieldtype = '', ''
			nd.save(new = 1, ignore_fields = ignore, check_links = 0)
			fld_lst += 'Label : '+cstr(d.label)+'	 ---	 Fieldtype : '+cstr(d.fieldtype)+'	 ---	 Fieldname : '+cstr(d.fieldname)+'	 ---	 Options : '+cstr(d.options)
			added += 1
			
			
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
	cur_doc.module = doc.module
	cur_doc.save(ignore_fields = ignore, check_links = 0)	
	
	# reorganize sequence
	re_index_doctype(doc.module.lower().replace(' ', '_'), doc.name.lower().replace(' ', '_'))

	# update schema
	# -------------
	if not doc.issingle:
		from webnotes.model import db_schema
		db_schema.updatedb(doc.name)
	
	webnotes.conn.set(doc,'modified',orig_modified)
	
	if webnotes.conn.in_transaction: sql("COMMIT")
	
	if added == 0:
		added_fields = ''
	else:
		added_fields =	' Added Fields :'+ cstr(fld_lst)
		
	return doc.name + (' Upgraded: %s fields added' % added)+added_fields

# =============================================================================
# Reorganize Fields in DocType
# =============================================================================


def re_index_doctype(module, dt):
	import webnotes
	from webnotes.defs import modules_path
	
	import os
	
	file = open(os.path.join(modules_path, module, 'doctype', dt, dt + '.txt'),'r')
	doclist = eval(file.read())
	file.close()

	dt = doclist[0]['name']
	
	extra = get_extra_fields(doclist, dt)
	
	clear_section_breaks(dt)
	
	add_section_breaks_and_renum(doclist, dt)
	
	fix_extra_fields(extra, dt)
	
	webnotes.conn.sql("delete from __DocTypeCache where name=%s", dt)

# get extra fields
# ----------------

def get_extra_fields(doclist, dt):
	import webnotes
	
	prev_field, prev_field_key = '', ''
	extra = []
	
	# get new fields and labels
	fieldnames = [d.get('fieldname') for d in doclist]
	labels = [d.get('label') for d in doclist]

	# check if all existing are present
	for f in webnotes.conn.sql("select fieldname, label, idx from tabDocField where parent=%s and fieldtype not in ('Section Break', 'Column Break', 'HTML') order by idx asc", dt):
		if f[0] and not f[0] in fieldnames:
			extra.append([f[0], f[1], prev_field, prev_field_key])
		elif f[1] and not f[1] in labels:
			extra.append([f[0], f[1], prev_field, prev_field_key])
			
		prev_field, prev_field_key = f[0] or f[1], f[0] and 'fieldname' or 'label'
	
	return extra

# adjust the extra fields
# -----------------------

def fix_extra_fields(extra, dt):
	import webnotes

	# push fields down at new idx
	for e in extra:
		# get idx of the prev to extra field
		idx = 0
		if e[2]:
			idx = webnotes.conn.sql("select idx from tabDocField where %s=%s and parent=%s" % (e[3], '%s', '%s'), (e[2], dt))
			idx = idx and idx[0][0] or 0
		
		if idx:
			webnotes.conn.sql("update tabDocField set idx=idx+1 where idx>%s and parent=%s", (idx, dt))	
			webnotes.conn.sql("update tabDocField set idx=%s where %s=%s and parent=%s" % \
				('%s', e[0] and 'fieldname' or 'label', '%s', '%s'), (idx+1, e[0] or e[1], dt))

# clear section breaks
# --------------------

def clear_section_breaks(dt):
	import webnotes

	webnotes.conn.sql("delete from tabDocField where fieldtype in ('Section Break', 'Column Break', 'HTML') and parent=%s", dt)

# add section breaks and renum
# ----------------------------

def add_section_breaks_and_renum(doclist, dt):
	import webnotes
	from webnotes.model.doc import Document
	for d in doclist:
		if d.get('parentfield')=='fields':
			if d.get('fieldtype') in ('Section Break', 'Column Break', 'HTML'):
				tmp = Document(fielddata = d)
				tmp.fieldname = ''
				tmp.name = None
				tmp.save(1)
			else:
				webnotes.conn.sql("update tabDocField set idx=%s where %s=%s and parent=%s" % \
					('%s', d.get('fieldname') and 'fieldname' or 'label', '%s', '%s'), (d.get('idx'), d.get('fieldname') or d.get('label'), dt))


	
# =============================================================================
# Transfer Mapper
# =============================================================================

def merge_mapper(doc_list, ovr, ignore, onupdate):
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

# =============================================================================
# Transfer Module Def
# =============================================================================
def merge_module_def(doc_list, ovr, ignore, onupdate):
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

	cur_doc.widget_code = cstr(doc.widget_code)
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
	
	

