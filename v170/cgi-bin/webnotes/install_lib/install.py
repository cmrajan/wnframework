import os,sys

cgi_bin_path = os.path.sep.join(__file__.split(os.path.sep)[:-3])

sys.path.append(cgi_bin_path)


from webnotes import defs
import webnotes
import webnotes.db
		
#
# make a copy of defs.py (if not exists)
#		
def copy_defs():
	global cgi_bin_path
	if not os.path.exists(os.path.join(cgi_bin_path, 'webnotes', 'defs.py')):
		ret = os.system('cp '+ os.path.join(cgi_bin_path, 'webnotes', 'defs_template.py')+\
			' '+os.path.join(cgi_bin_path, 'webnotes', 'defs.py'))
		print 'Made copy of defs.py'

#
# Main Installer Class
#
class Installer:
	def __init__(self, root_login, root_password):
	
		self.root_password = root_password
		from webnotes.model.db_schema import DbManager
		
		self.conn = webnotes.db.Database(user=root_login, password=root_password)			
		
		self.dbman = DbManager(self.conn)
		self.mysql_path = hasattr(defs, 'mysql_path') and webnotes.defs.mysql_path or ''

	#
	# run framework related cleanups
	#
	def framework_cleanups(self, target):
		self.conn.use(target)
		self.dbman.drop_table('__DocTypeCache')
		self.conn.sql("create table `__DocTypeCache` (name VARCHAR(120), modified DATETIME, content TEXT, server_code_compiled TEXT)")

		# set the basic passwords
		self.conn.sql("update tabProfile set password = password('admin') where name='Administrator'")
		self.conn.sql("update tabDocType set server_code_compiled = NULL")

		# temp
		self.conn.sql("alter table tabSessions change sessiondata sessiondata longtext")
		try: 	
			self.conn.sql("alter table tabSessions add index sid(sid)")
		except Exception, e:
			if e.args[0]==1061:
				pass
			else:
				raise e	

	#
	# main script to create a database from
	#
	def import_from_db(self, target, source_path='', password = 'admin', verbose=0):
		"""
		a very simplified version, just for the time being..will eventually be deprecated once the framework stabilizes.
		"""
		
		# get the path of the sql file to import
		if not source_path:
			source_path = os.path.join(os.path.sep.join(webnotes.__file__.split(os.path.sep)[:-3]), 'data', 'Framework.sql')

		# delete user (if exists)
		self.dbman.delete_user(target)

		# create user and db
		self.dbman.create_user(target,getattr(defs,'db_password',None))
		if verbose: print "Created user %s" % target
	
		# create a database
		self.dbman.create_database(target)
		if verbose: print "Created database %s" % target

		# grant privileges to user
		self.dbman.grant_all_privileges(target,target)
		if verbose: print "Granted privileges to user %s and database %s" % (target, target)

		# flush user privileges
		self.dbman.flush_privileges()

		# import in target
		if verbose: print "Starting database import..."
		self.dbman.restore_database(target, source_path, self.root_password)
		if verbose: print "Imported from database %s" % source_path

		# framework cleanups
		self.framework_cleanups(target)
		if verbose: print "Ran framework startups on %s" % target
		
		return target		

#
# load the options
#
def get_parser():
	from optparse import OptionParser

	parser = OptionParser(usage="usage: %prog [options] ROOT_LOGIN ROOT_PASSWORD DBNAME")
	parser.add_option("-x", "--database-password", dest="password", default="admin", help="Optional: New password for the Framework Administrator, default 'admin'")	
	parser.add_option("-s", "--source", dest="source_path", default=None, help="Optional: Path of the sql file from which you want to import the instance, default 'data/Framework.sql'")
	
	return parser


#
# execution here
#
if __name__=='__main__':

	parser = get_parser()
	(options, args)	= parser.parse_args()
		
	if len(args)==3:
		
		root_login, root_password, db_name = args[0], args[1], args[2]
		inst = Installer(root_login, root_password)

		inst.import_from_db(db_name, source_path=options.source_path, \
			password = options.password, verbose = 1)

		copy_defs()

		print "Database created, please edit defs.py to get started"		
	else:
		parser.print_help()

	

		
			
		

		
