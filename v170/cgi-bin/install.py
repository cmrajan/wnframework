from webnotes.settings import account_map

# -------------------------------------------------------------

def copy_db(source, target=''):
	import webnotes.defs

	if not webnotes.defs.server_prefix:
		webnotes.msgprint("Server Prefix must be set in defs.py")
		raise Exception

	import os
	os.chdir(os.path.normpath('../data'))
	
	# dump
	mysqldump(source)

	# import
	target = import_db(source, target)
	
	# delete dump
	os.system('rm %s.sql' % source)
	
	return target

# -------------------------------------------------------------

def get_db_name(conn, server_prefix):
	global dbman
	db_list = dbman.get_database_list()
	db_list.sort()
	if not server_prefix:
		server_prefix = db_list[-1][:3]
	if db_list:
		dbn = server_prefix + ('%.3i' % (int(db_list[-1][-3:]) + 1))
	else:
		dbn = server_prefix + '001'
	return dbn

# -------------------------------------------------------------

def import_db(source, target='', is_accounts=0):

	# dump source

	import webnotes
	import webnotes.db
	from webnotes import defs
	import os
	from webnotes.model.db_schema import DbManager
	
	mysql_path = hasattr(webnotes.defs, 'mysql_path') and webnotes.defs.mysql_path or ''
	
	conn = None
	# login as root (if set)
	if defs.root_login:
		conn = webnotes.db.Database(user=defs.root_login, password=defs.root_password)
	
	dbman = DbManager(conn)
	# get database number
	if not target:
		global dbman
		target = get_db_name(conn, webnotes.defs.server_prefix)

	
	# delete user (if exists)
	dbman.delete_user(target)


	# create user and db
	dbman.create_user(target,getattr(defs,'db_password',None))
	
	dbman.create_database(target)

	dbman.grant_all_privileges(target,target)

	dbman.flush_privileges()


	dbman.set_transaction_isolation_level('GLOBAL','READ COMMITTED')

	source_path = get_source_path(source)		

	# import in target
	dbman.restore_database(target,source_path,getattr(defs,'root_password',None))


	conn.use(target)
	dbman.drop_table('__DocTypeCache')
	conn.sql("create table `__DocTypeCache` (name VARCHAR(120), modified DATETIME, content TEXT, server_code_compiled TEXT)")


	conn.sql("update tabProfile set password = password('admin') where name='Administrator'")
	conn.sql("update tabDocType set server_code_compiled = NULL")

	# temp
 	conn.sql("alter table tabSessions change sessiondata sessiondata longtext")
	try: 	
		conn.sql("alter table tabSessions add index sid(sid)")
	except Exception, e:
		if e.args[0]==1061:
			pass
		else:
			raise e
	return target

# -------------------------------------------------------------

def get_source_path(s):
	import os
	
	cwd = os.path.split(os.getcwd())[-1]
	
	if cwd == 'cgi-bin':
		f = '../data/' + s + '.sql'
	elif cwd == 'data':
		f = target + '.sql'
	else:
		f = 'data/' + s + '.sql'
		
	# check if exists
	if os.path.exists(f):
		return f
	else:
		raise Exception, "Target file '%s' does not exist" % f

# -------------------------------------------------------------

def rewrite_account_map(ac_name_map={}, domain_name_map={}, default_db_name=None):
	import datetime
	
	fn = account_map.__file__
	if fn.endswith('c'): fn = fn[:-1] # for .pyc
	
	f = open(fn, 'w')
	f.write('# Account/Domain Name to Database Mapping file\n')
	f.write('# --------------------------------------------\n')
	f.write('# last updated on: ' + datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S'))
	f.write('\n\ndefault_db_name = "%s"' % (default_db_name or account_map.default_db_name))
	f.write('\n\nac_name_map = %s' % str(ac_name_map or account_map.ac_name_map))
	f.write('\n\n# without www')
	f.write('\ndomain_name_map = %s' % str(domain_name_map or account_map.domain_name_map))
	f.close()
	
# -------------------------------------------------------------

def create_account_record(ac_name, newdb, domain=''):
	
	if not getattr(account_map, 'ac_name_map'): account_map.ac_name_map = {}
	if not getattr(account_map, 'domain_name_map'): account_map.domain_name_map = {}
	
	account_map.ac_name_map[ac_name] = newdb
	if domain:
		account_map.domain_name_map[domain] = newdb
		
	rewrite_account_map()


# -------------------------------------------------------------

def create_account(ac_name, ac_type='Framework'):
	import webnotes.db

	newdb = import_db(ac_type)

	# set account id
	conn = webnotes.db.Database(user=newdb)
	conn.use(newdb)
	sql = conn.sql
	
	conn.begin()
	sql("update tabSingles set value=%s where doctype='Control Panel' and field='account_id'", ac_name)

	conn.commit()

	# create entry in Account table in 'accounts' (default) database
	create_account_record(ac_name, newdb)
	
	return "%s,%s" % (ac_name, newdb)


# -------------------------------------------------------------

def create_log_folder(path):
	import os
    	try:   
		 
	        os.mkdir(os.path.join(path,'log'))

        	webnotes.LOG_FILENAME = os.path.join(path,'log','wnframework.log')
	        open(webnotes.LOG_FILENAME,'w+').close()
	except Exception,e:
		print e
		pass


# -------------------------------------------------------------

def copy_defs_py():
	import os
	try:
		cur_path = os.getcwd()
		defs_path = os.path.join(cur_path,'webnotes','defs')
		cp_cmd = 'cp'
		
		ret = os.system(cp_cmd +' '+ defs_path+' '+defs_path+'.py')
		assert ret == 0 
		print ret
	except Exception,ret:
		print ret


# Installation
# -------------------------------------------------------------

if __name__=='__main__':
	import sys,os
	# set path
	sys.path.append(os.path.abspath(os.path.dirname(sys.argv[0]) + '/../../'))	

	if not os.path.exists(os.path.join(os.getcwd(),'webnotes','defs.py')):

		print "Creating defs.py"	
		copy_defs_py()

	from webnotes import defs
	print "Creating log folder and file..."
	log_path = getattr(defs,'log_file_path',None)
	if log_path:
		create_log_folder(os.path.dirname(log_path))


	import webnotes	 #Should be here since it requires defs.py
	
	if sys.argv[1]=='install':
		# create the first account
		from webnotes.model.db_schema import DbManager
		import webnotes.db
		import webnotes.defs

	
		
		print "Importing Framework.sql..." 
		import_db("Framework", "accounts")
		
		print "Setting up Account..."
		create_account_doctype(conn,'accounts')

# -----------------------------------------------------------------------
# this is a patch that will build account_map.py from deprecated "accounts" database

def build_account_map():
	from webnotes.db import Database
	conn = Database(user='accounts')
	
	if not getattr(account_map, 'ac_name_map'): account_map.ac_name_map = {}
	if not getattr(account_map, 'domain_name_map'): account_map.domain_name_map = {}	

	for ac in conn.sql("select ac_name, db_name from tabAccount"):
		account_map.ac_name_map[ac[0]] = ac[1]
		
	rewrite_account_map()
		