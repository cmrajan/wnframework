
# accept a module coming from a remote server
# ==============================================================================
def accept_module(super_doclist):
	import webnotes
	import webnotes.utils
	
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
	if not module:
		module = webnotes.form.getvalue('module')
	webnotes.response['super_doclist'] = get_module_doclist(doclist)

def get_module_doclist(module):
	import webnotes
	import webnotes.model.doc
	
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
	
	return super_doclist

# export to files
# ==============================================================================

def export_to_files(module, record_list=()):	
	module_doclist =[]
	# get the items
	if record_list:
		import webnotes.model.doc
		for record in record_list:
			module_doclist.append([d.fields for d in webnotes.model.doc.get(record[0], record[1])])
	else:
		for d in module:
			module_doclist +=get_module_doclist(d)
	
	# write files
	for doclist in module_doclist:
		write_document_file(doclist, module)

# ==============================================================================

def write_document_file(doclist, module):
	import os
	import webnotes
	import re	
	
	# create the folder
	folder = os.path.join(webnotes.get_index_path(), 'modules', module, doclist[0]['doctype'], doclist[0]['name'].replace('/', '-'))
	webnotes.create_folder(folder)

	# separate code files
	separate_code_files(doclist, folder)
	
	# write the data file
	txtfile = open(os.path.join(folder, doclist[0]['name'].replace('/', '-')+'.txt'),'w+')
	txtfile.write(str(doclist))
	txtfile.close()

# ==============================================================================

def separate_code_files(doclist, folder):
	import os
	import webnotes
	# code will be in the parent only
	code_fields = webnotes.code_fields_dict.get(doclist[0]['doctype'], [])
	
	for code_field in code_fields:
		if doclist[0].get(code_field[0]):
			fname = doclist[0]['name']
#			fname.replace('/','-')  #Weirdly, doesn't work..using a hack instead.
			temp = fname.rsplit('/')
			fname = '-'.join(temp)
			# 2 htmls
			if code_field[0]=='static_content':
				fname+=' Static'
			
			# write the file
			codefile = open(os.path.join(folder, fname+'.'+code_field[1]),'w+')
			codefile.write(doclist[0][code_field[0]])
			codefile.close()
		
			# clear it from the doclist
			doclist[0][code_field[0]] = None

# ==============================================================================

def import_from_files(module, record_list=[]):
	import os
	import webnotes
	import fnmatch


	doclist = []
	module_doclist = []

	# get the folder list
	if record_list:
		folder_list=[]
		for record in record_list:
			folder_list.append(os.path.join(webnotes.get_index_path(), module, record[0], record[1]))
			
	else:
#		folder_list = get_module_folders(module)
		get_lowest_file_path(os.path.join(webnotes.get_index_path(),'modules',module))
		folder_list = low_folder_list

	# build into doclist
	for folder in folder_list:
		# get the doclist
#		doclist = eval(open(os.path.join(folder, os.path.basename(folder)+'.txt'),'r').read())	
		file_list = os.listdir(folder)
		for each in file_list:
			if fnmatch.fnmatch(each,'*.txt'):
				doclist = eval(open(os.path.join(folder,each),'r').read())
		# add code
		add_code_from_files(doclist, folder)
		
		# add to the module "super" doclist
		module_doclist.append(doclist)
		
	accept_module(module_doclist)
	

# ==============================================================================

def add_code_from_files(doclist, folder):
	import webnotes
	import os
	# code will be in the parent only
	code_fields = webnotes.code_fields_dict.get(doclist[0]['doctype'], [])
	code = ''	
	for code_field in code_fields:
		# see if the file exists
		
		fname = os.path.join(folder, os.path.basename(folder)+code_field[1])
		if code_field[0]=='static_content':
			fname += ' Static'
		
		try:
			code = open(fname,'r').read()
		except Exception, e:
			if e.args[0]==2:
				pass
			else:
				raise e
		
		doclist[0][code_field[0]] = code
		
	
# ==============================================================================

def get_module_folders(module):
	import os
	import webnotes

	doc_folder_list = []

	# get all the types
	type_dir_list = os.listdir(os.path.join(webnotes.get_index_path(), 'modules', module))
	
	for type_dir in type_dir_list:
		if os.path.isdir(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir)):
			
			# get all items of this type
			item_dir_list = os.listdir(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir))
			
			for item_dir in item_dir_list:
				if os.path.isdir(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir, item_dir)):
#					if item_dir != 'SRCH': #Hacky for the time being.	
						doc_folder_list.append(os.path.join(webnotes.get_index_path(), 'modules', module, type_dir, item_dir))
					
	return doc_folder_list

# =============================================================================

low_folder_list = []
# Get the deepmost folder with files in the given path tree....
def get_lowest_file_path(path):
	import os
	global	low_folder_list 
	folderlist = os.listdir(path)
	for each in folderlist:
		temp = os.path.join(path,each)

		if os.path.isdir(temp):
#			print temp	
			get_lowest_file_path(temp)
		else:
	#		print "folder",os.path.dirname(temp)
			low_folder_list.append(os.path.dirname(temp))
	return low_folder_list



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


# Transfer Module Def
# ============================================================
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
