# code sync - syncs code from files and is called from webnotes.model.doc.get

# -------------------------------------------------

# check if the .svn folder is updated - if yes, clear the cache


def get_code(module, dt, dn, extn, is_static=None):
	from webnotes.defs import modules_path
	from webnotes.modules import scrub
	import os, webnotes
	
	# get module (if required)
	if not module:
		module = webnotes.conn.sql("select module from `tab%s` where name=%s" % (dt,'%s'),dn)[0][0]
		
	# file names
	if dt != 'Control Panel':
		dt, dn = scrub(dt), scrub(dn)

	# get file name
	fname = dn + '.' + extn
	if is_static:
		fname = dn + '_static.' + extn

	# code
	try:
		file = open(os.path.join(modules_path, scrub(module), dt, dn, fname), 'r')
	except IOError, e:
		return ''
		
	code = file.read()
	file.close()
	return code

#==============================================================================

def check_modules_update():
	import webnotes.defs
	import webnotes
	import os
	
	fs = None
	try:
		fs = str(os.stat(os.path.join(webnotes.defs.modules_path, '.svn')).st_mtime)
	except OSError, e:
		if e.args[0]!=2:
			raise e
				
	if fs != webnotes.conn.get_global('modules_last_update'):
		# clear cache
		webnotes.conn.sql("delete from __DocTypeCache")
		webnotes.conn.set_global('modules_last_update', fs)
		return 1

# -------------------------------------------------

def sync_doctype(doc):
	import webnotes
	
	file_timestamp = get_file_timestamp(doc, ['','txt'])
	
	if file_timestamp and (file_timestamp != get_system_timestamp(doc, ['record'])):
		from webnotes.modules import import_module
		
		# import
		import_module.import_from_files(record_list=[[doc.module, doc.doctype, doc.name]])
		
		# implicit commit (?)
		webnotes.conn.begin()
		
		# update
		update_timestamp(doc, ['record'], file_timestamp)

# -------------------------------------------------

def get_file_timestamp(doc, code_field):
	import os
	try:
		return str(os.stat(get_code_path(doc, code_field)).st_mtime)			
	except OSError, e:
		if e.args[0]!=2:
			raise e
		else:
			return None

# -------------------------------------------------

def get_system_timestamp(doc, code_field):
	import webnotes
	
	try:
		return webnotes.conn.sql("select `timestamp` from __CodeFileTimeStamps where doctype=%s and name=%s and code_field=%s", (doc.doctype, doc.name, code_field[0]))[0][0]
	except IndexError, e:
		return None
	except Exception, e:
		if e.args[0]==1146: # no table
			make_table()
			return None
		else:
			raise e

# -------------------------------------------------

def make_table():
	import webnotes
	webnotes.conn.sql("create table `__CodeFileTimeStamps` (name VARCHAR(120), doctype VARCHAR(120), code_field VARCHAR(120), `timestamp` VARCHAR(120))")
	

# -------------------------------------------------

def update_timestamp(doc, code_field, file_timestamp):
	import webnotes
	# update or insert
	if webnotes.conn.sql("select name from __CodeFileTimeStamps where doctype=%s and name=%s and code_field=%s", (doc.doctype, doc.name, code_field[0])):
		webnotes.conn.sql("update __CodeFileTimeStamps set `timestamp`=%s where doctype=%s and name=%s and code_field=%s", (file_timestamp, doc.doctype, doc.name, code_field[0]))
	else:
		webnotes.conn.sql("insert into __CodeFileTimeStamps (`timestamp`, doctype, name, code_field) values (%s, %s, %s, %s)", (file_timestamp, doc.doctype, doc.name, code_field[0]))

# -------------------------------------------------

def get_code_path(doc, code_field):
	import webnotes.defs, os
	fname = doc.name
	if code_field[0]=='static_content':
		fname+=' Static'

	return os.path.join(webnotes.defs.modules_path, doc.module or 'System', doc.doctype, doc.name, fname) \
		+ '.' + code_field[1]
