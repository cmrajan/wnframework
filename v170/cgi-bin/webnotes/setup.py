# MYSQL ADMIN
# -----------

def backup_all():
	# backups folder
	import os
	dblist = sql_accounts('select db_name from tabAccount')

	# backup -all in /backups folder
	for d in dblist:
		backup_db(d[0], 1)
	
	# dump all in /daily folder
	import time, datetime
	fname = 'daily-' + time.strftime('%Y-%m-%d') + '.tar.gz'
	
	# daily dump
	os.system('tar czf ../backups/daily/%s ../backups/dumps' % fname) 

	# keep only three files
	if len(os.listdir('../backups/daily')) > 3:
		delete_oldest_file('../backups/daily')

	# if sunday, then copy to weekly
	if datetime.datetime.now().weekday()==6:
		os.system('cp ../backups/daily/'+fname+' ../backups/weekly/'+fname)
	
		# keep only three files
		if len(os.listdir('../backups/weekly')) > 3:
			delete_oldest_file('../backups/weekly')
	
def delete_oldest_file(folder):
	import os
	a = sorted(os.listdir(folder), key=lambda fn: os.stat(folder+'/'+fn).st_mtime, reverse=False)
	if a:
		os.system('rm %s/%s' % (folder, a[0]))

def mysqldump(db, folder=''):
	global mysql_path
	import os
	os.system('%(path)smysqldump %(db)s > %(folder)s%(db)s.sql -u %(db)s -p%(pwd)s --ignore-table=%(db)s.__DocTypeCache' % {'path':mysql_path, 'db':db, 'pwd':db_password, 'folder':folder})

def backup_db(db, from_all=0):
	import os

	if defs.root_login:
		global conn
		conn = MySQLdb.connect(user=defs.root_login, host=db_host, passwd=defs.root_password)
		
	sql('use %s' % db)

	#sql('FLUSH TABLES WITH READ LOCK')

	try:
		p = '../backups'
		if from_all: p = '../backups/dumps'	
		
		os.system('rm %s/%s.tar.gz' % (p,db))
	
		# dump
		mysqldump(db, p+'/')
		
		# zip
		os.system('tar czf %s/%s.tar.gz %s/%s.sql' % (p, db, p, db))
		os.system('rm %s/%s.sql' % (p, db))
		#sql('unlock tables')
	except Exception, e:
		#sql('unlock tables')
		raise e

def copy_db(source, target=''):
	if not server_prefix:
		msgprint("Server Prefix must be set in defs.py")
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

def import_db(source, target='', is_accounts=0):
	# dump source
	global mysql_path
	import os

	if defs.root_login:
		global conn
		conn = MySQLdb.connect(user=defs.root_login, host=db_host, passwd=defs.root_password)

	if not target:
		if is_accounts:
			target = 'accounts'
		else:
			res = sql('SHOW DATABASES')
			db_list = []
			for r in res:
				if r[0] and r[0].startswith(server_prefix):
					db_list.append(r[0])
			db_list.sort()
			
			if db_list:
				dbn = server_prefix + ('%.3i' % (int(db_list[-1][-3:]) + 1))
			else:
				dbn = server_prefix + '001'
			target = dbn
	
	os.chdir('../data')

	# create user and db
	sql("CREATE USER '%s'@'localhost' IDENTIFIED BY '%s'" % (target, db_password))
	sql("CREATE DATABASE IF NOT EXISTS `%s` ;" % target)
	sql("GRANT ALL PRIVILEGES ON `%s` . * TO '%s'@'localhost';" % (target, target))
	sql("FLUSH PRIVILEGES")
	sql("SET GLOBAL TRANSACTION ISOLATION LEVEL READ COMMITTED;")

	# import in target
	os.system('%smysql -u %s -p%s %s < %s.sql' % (mysql_path, target, db_password, target, source))

	sql("use %s;" % target)
	sql("create table `__DocTypeCache` (name VARCHAR(120), modified DATETIME, content TEXT)")
	sql("update tabProfile set password = password('admin') where name='Administrator'")

	# temp
 	sql("alter table tabSessions change sessiondata sessiondata longtext") 
	
	return target
	
def create_account(ac_name, ac_type='Framework'):

	if ac_name=='accounts':
		# first account
		newdb = import_db(ac_type, is_accounts = 1)
	else:
		newdb = import_db(ac_type)
		# update accounts
		use_account(my_db_name = 'accounts')
		ac = Document('Account')
		ac.ac_name = ac_name
		ac.db_name = newdb
		ac.name = newdb
		if not in_transaction:
			sql("start transaction")
		ac.save(1)
		sql("commit")

	# set account id
	use_account(my_db_name = newdb)
	if not in_transaction:
		sql("start transaction")
	sql("update tabSingles set value=%s where doctype='Control Panel' and field='account_id'", ac_name)

	if ac_name=='accounts':
		# create tabAccount
		ac = Document('DocType')
		ac.name = 'Account'
		ac.autoname = 'AC.#####'
		ac.save(1)
		
		f = addchild(ac, 'fields', 'DocField')
		f.label = 'Account Name'
		f.fieldname = 'ac_name'
		f.fieldtype = 'Data'
		f.save()

		f = addchild(ac, 'fields', 'DocField')
		f.label = 'Database Name'
		f.fieldname = 'db_name'
		f.fieldtype = 'Data'
		f.save()

		f = addchild(ac, 'fields', 'DocField')
		f.label = 'Database Login'
		f.fieldname = 'db_login'
		f.fieldtype = 'Data'
		f.save()
		
		f = addchild(ac, 'permissions', 'DocPerm')
		f.role = 'Administrator'
		f.read = 1
		f.write = 1
		f.create = 1
		f.save()
		
		get_obj('DocType', 'Account', with_children = 1).on_update()
		
	sql("commit")

	return "Created %s (%s)" % (ac_name, newdb)

