import webnotes

backup_folder = '../../backups'

def mysqldump(db, folder=''):
	global mysql_path
	import os
	os.system('%(path)smysqldump %(db)s > %(folder)s%(db)s.sql -u %(db)s -p%(pwd)s --ignore-table=%(db)s.__DocTypeCache' % {'path':mysql_path, 'db':db, 'pwd':db_password, 'folder':folder})

def backup_db(db, from_all=0):
	import os
	global backup_folder

	try:
	# Check processlist
		if len(sql("show processlist")) == 1:
			p = '../backups'
			if from_all: p = '../backups/dumps'	

			# clear old file
			os.system('rm %s/%s.tar.gz' % (p,db))

			# dump
			mysqldump(db, p+'/')
			
			# zip
			os.system('tar czf %s/%s.tar.gz %s/%s.sql' % (p, db, p, db))
			os.system('rm %s/%s.sql' % (p, db))
		else:
			msgprint("Another process is running in database. Please try again")
	except Exception, e:
		#sql('unlock tables')
		raise e
		
def backup_all():
	# backups folder
	import os
	dblist = sql_accounts('select db_name from tabAccount')

	# backup -all in /backups folder
	for d in (('accounts'),) + dblist:
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