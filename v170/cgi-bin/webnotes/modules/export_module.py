# to use module manger, set the path of the modules folder in defs.py

transfer_types = ['Role', 'Print Format','DocType','Page','DocType Mapper','GL Mapper','Search Criteria', 'Patch']
# TDS Category and TDS Rate chart updates should go, if at all as Patches not here.


# ==============================================================================
# export to files
# ==============================================================================

def export_to_files(modules = [], record_list=[], from_db=None, from_ac=None, verbose=1):
	# Multiple doctype  and multiple modules export to be done
	# for Module Def, right now using a hack..should consider table update in the next version
	# all modules transfer not working, because source db not known
	# get the items

	if from_ac or from_db:
		init_db_login(from_ac, from_db)
	
	out = []
	import webnotes.model.doc
	module_doclist =[]
	if record_list:
		for record in record_list:
			module_doclist.append([d.fields for d in webnotes.model.doc.get(record[0], record[1])])
		
	# build the doclist
	if modules:
		for m in modules:
			module_doclist +=get_module_doclist(m)
			
	# write files
	for doclist in module_doclist:
		if verbose:
			out.append("Writing for " + doclist[0]['doctype'] + " / " + doclist[0]['name'])
		write_document_file(doclist)
	
	# write the module.info file
	if modules:
		for m in modules:
			write_module_info(m)
				
	return out

# ==============================================================================
# write module.info file with last updated timestamp
# ==============================================================================

def write_module_info(mod):
	import webnotes.utils, os

	file = open(os.path.join(webnotes.defs.modules_path, mod, 'module.info'), 'w+')
	file.write(str({'update_date': webnotes.utils.now()}))
	file.close()
	
# ==============================================================================
# prepare a list of items in a module
# ==============================================================================

def get_module_items(mod):
	import webnotes

	dl = []
	for dt in transfer_types:
		try:
			dl2 = webnotes.conn.sql('select name, modified from `tab%s` where module="%s"' % (dt,mod))
			for e in dl2:
				dl += [dt+','+e[0]+',0']
				if e[0] == 'Control Panel':
					dl += [e[0]+','+e[0]+',1']
		except:
			pass
	dl1 = webnotes.conn.sql('select doctype_list from `tabModule Def` where name=%s', mod)
	dl1 = dl1 and dl1[0][0] or ''
	if dl1:		
		dl1 = dl1.split('\n')
		dl += [t+',1' for t in dl1]
	dl += ['Module Def,'+mod+',0']
	# build finally
	dl = [e.split(',') for e in dl]
	dl = [[e[0].strip(), e[1].strip(), e[2]] for e in dl] # remove blanks
	return dl


# ==============================================================================
# build a list of doclists of items in that module and send them
# ==============================================================================
def get_module_doclist(module):
	import webnotes
	import webnotes.model.doc
	item_list = get_module_items(module)
	
	# build the super_doclist
	super_doclist = []
	for i in item_list:
		dl = webnotes.model.doc.get(i[0], i[1])
		if i[2]=='1':
			dl[0].module = module
		# remove compiled code (if any)
		if dl[0].server_code_compiled:
			dl[0].server_code_compiled = None
			
		# add to super
		super_doclist.append([d.fields for d in dl])
		
	return super_doclist


# ==============================================================================
# Write doclist into file
# ==============================================================================
def write_document_file(doclist):
	import os
	import webnotes
	import webnotes.defs

	# create the folder
	folder = os.path.join(webnotes.defs.modules_path, doclist[0]['doctype'] == 'Module Def' and doclist[0]['name'] or doclist[0]['module'], doclist[0]['doctype'], doclist[0]['name'].replace('/', '-'))
	
	webnotes.create_folder(folder)

	# separate code files
	separate_code_files(doclist, folder)
		
	# write the data file
	txtfile = open(os.path.join(folder, doclist[0]['name'].replace('/', '-')+'.txt'),'w+')
	txtfile.write(str(doclist))
	txtfile.close()

# ==============================================================================
# Create seperate files for code
# ==============================================================================

def separate_code_files(doclist, folder):
	import os
	import webnotes
	# code will be in the parent only
	code_fields = webnotes.code_fields_dict.get(doclist[0]['doctype'], [])
	for code_field in code_fields:
		if doclist[0].get(code_field[0]):
			fname = doclist[0]['name']
			fname = fname.replace('/','-')  #Weirdly, doesn't work..using a hack instead.
			# 2 htmls
			if code_field[0]=='static_content':
				fname+=' Static'
			# write the file
			codefile = open(os.path.join(folder, fname+'.'+code_field[1]),'w+')
			codefile.write(doclist[0][code_field[0]])
			codefile.close()
		
			# clear it from the doclist
			doclist[0][code_field[0]] = None

