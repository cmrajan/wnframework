# to use module manger, set the path of the modules folder in defs.py

transfer_types = ['Role', 'Print Format','DocType','Page','DocType Mapper','GL Mapper','Search Criteria', 'Patch']
# TDS Category and TDS Rate chart updates should go, if at all as Patches not here.


# ==============================================================================
# export to files
# ==============================================================================

def export_to_files(modules = [], record_list=[], verbose=0):	
	# Multiple doctype  and multiple modules export to be done
	# for Module Def, right now using a hack..should consider table update in the next version
	# all modules transfer not working, because source db not known
	# get the items

	import webnotes.model.doc
	module_doclist =[]
	if record_list:
		for record in record_list:
			module_doclist.append([d.fields for d in webnotes.model.doc.get(record[0], record[1])])
		
	if modules:
		for m in modules:
			module_doclist +=get_module_doclist(m)
	# write files
	for doclist in module_doclist:
		if verbose:
			print "Writing for " + doclist[0].doctype + "/" doclist[0].name
		write_document_file(doclist)

# ==============================================================================
# prepare a list of items in a module
# ==============================================================================

def get_module_items(mod):
	import webnotes


	dl = []
	for dt in transfer_types:
		try:
			dl2 = webnotes.conn.sql('select name from `tab%s` where module="%s"' % (dt,mod))
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


# ~~~~~~~~IMPORT~~~~~~~~IMPORT~~~~~~~~IMPORT~~~~~~~~IMPORT~~~~~~~~IMPORT~~~~~~~~

# ==============================================================================
# Import from files
# =============================================================================
def import_from_files(modules = [], record_list = [], execute_patches = 1, sync_cp = 0):
	import transfer
	# Get paths of folder which will be imported
	folder_list = get_folder_paths(modules, record_list)
	ret1, ret2, ret3, ret4 = '', '', '', ''
	if folder_list:
		# get all doclist
		all_doclist = get_all_doclist(folder_list)
	
		# import doclist
		ret1 = accept_module(all_doclist)
	
		# execute patches
		if execute_patches:
			ret2 = transfer.execute_patches(modules,record_list)
		
		# sync control panel
		if sync_cp:
			ret3 = sync_control_panel()
	else:
		ret4 = "Module/Record not found" 
		
	return ret1, ret2, ret3, ret4


# ==============================================================================
# Get list of folder path
# =============================================================================
def get_folder_paths(modules, record_list):
	import os
	import webnotes
	import fnmatch
	import webnotes.defs

	folder_list=[]
	global low_folder_list
	try:
		# get the folder list
		if record_list:
			for record in record_list:
				low_folder_list = []
				low_folder_list = get_lowest_file_paths(webnotes.defs.modules_path)
			
				for each in low_folder_list: 
					if fnmatch.fnmatch(each,'*'+record[0]+'*'+record[1].replace('/', '-')):
						folder_list.append(each)
		if modules:
			# system modules will be transferred in a predefined order and before all other modules
			sys_mod_ordered_list = ['Roles', 'System', 'Application Internal', 'Mapper', 'Settings']
			all_mod_ordered_list = [t for t in sys_mod_ordered_list if t in modules] + list(set(modules).difference(sys_mod_ordered_list))

			for each in all_mod_ordered_list:
				mod_path = os.path.join(webnotes.defs.modules_path, each)
				temp = os.listdir(mod_path)
				temp = list(set(temp).difference(['Control Panel']))
				all_transfer_types =[t for t in transfer_types if t in temp] + list(set(temp).difference(transfer_types))
				for d in all_transfer_types:
					low_folder_list = []
					low_folder_list = get_lowest_file_paths(os.path.join(webnotes.defs.modules_path, each, d))	
					folder_list+=low_folder_list

		return folder_list
	except Exception, e:
		return []

	
# ==============================================================================
# Get doclist for all folder
# =============================================================================
def get_all_doclist(folder_list):
	import fnmatch
	import os
		
	doclist = []
	all_doclist = []

	# build into doclist
	for folder in folder_list:
		# get the doclist
		file_list = os.listdir(folder)
		for each in file_list:

			if fnmatch.fnmatch(each,'*.txt'):
				doclist = eval(open(os.path.join(folder,each),'r').read())
				# add code
				all_doclist.append(add_code_from_files(doclist, folder))
	
	return all_doclist
	


# ==============================================================================
# Add code to doclist
# =============================================================================
def add_code_from_files(doclist, folder):
	import webnotes
	import os
	# code will be in the parent only
	code_fields = webnotes.code_fields_dict.get(doclist[0]['doctype'], [])
	code = ''
	for code_field in code_fields:
		# see if the file exists		
		fname = os.path.join(folder, os.path.basename(folder)+'.'+code_field[1])
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
	return doclist


# =============================================================================
# Get the deepmost folder with files in the given path tree....
# =============================================================================
def get_lowest_file_paths(path):
	import os
	folderlist = os.listdir(path)
	for each in folderlist:
		temp = os.path.join(path,each)

		if os.path.isdir(temp):
			get_lowest_file_paths(temp)
		else:
			if os.path.dirname(temp) not in low_folder_list:
				low_folder_list.append(os.path.dirname(temp))
	return low_folder_list
	

# ==============================================================================
# accept a module coming from a remote server
# ==============================================================================
def accept_module(super_doclist):
	import webnotes
	import webnotes.utils
	import transfer
	msg, i = [], 0
	
	for dl in super_doclist:
		msg.append(transfer.set_doc(dl, 1, 1, 1))

	if not webnotes.conn.in_transaction:
		webnotes.conn.sql("START TRANSACTION")

	# clear over-written records / deleted child records
	webnotes.utils.clear_recycle_bin()
	
	# clear cache
	webnotes.conn.sql("DELETE from __DocTypeCache")
	webnotes.conn.sql("COMMIT")
	
	return msg


# =============================================================================
# Sync control panel
# =============================================================================
def sync_control_panel():
	import transfer
	import webnotes.defs
	
	global low_folder_list
	low_folder_list = []
	low_folder_list = get_lowest_file_paths(webnotes.defs.modules_path)
			
	for each in low_folder_list: 
		if fnmatch.fnmatch(each,'*Control Panel/Control Panel'):
			cp_path = each
			
	if fnmatch.fnmatch(os.listdir(cp_path),'Control Panel.txt'):
		doclist = eval(open(os.path.join(cp_path, 'Control Panel.txt'),'r').read())
		transfer.sync_control_panel(doclist[0].startup_code, doclist[0].startup_css)
		return "Control Panel Synced!!!"


#==============================================================================
#Return module names present in File System
#==============================================================================
def get_modules_from_filesystem():
	import os, webnotes.defs
	modules = os.listdir(webnotes.defs.modules_path, 'modules'))
	return modules


