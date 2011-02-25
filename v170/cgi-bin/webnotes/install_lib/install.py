# -------------------------------------------------------------------------------------------------------------
import os,sys
sys.path.append(os.getcwd())

def copy_file(template_path,target_path):
		try:
			print "Copying %s to %s"%(template_path,target_path)
			cp_cmd = 'cp'
			ret = os.system(cp_cmd +' '+ template_path+' '+target_path)
		except Exception,e:
			raise e

# -------------------------------------------------------------------------------------------------------------

def create_log_folder(path):
	import os
	try:   		 
		os.mkdir(os.path.join(path,'log'))
		webnotes.LOG_FILENAME = os.path.join(path,'log','wnframework.log')
		open(webnotes.LOG_FILENAME,'w+').close()
	except Exception,e:
		print e
		pass
	
# -------------------------------------------------------------------------------------------------------------	

class Installer:
	def __init__(self,wn_folder,conn = None):
	
		sys.path.append(wn_folder)
		from webnotes import defs
		import webnotes
		import webnotes.db
		from webnotes.model.db_schema import DbManager
		import db_init
		
		if not conn:
			self.conn = webnotes.db.Database(user=defs.root_login, password=defs.root_password)
			
		else:
			self.conn = conn
		
		self.dbman = DbManager(self.conn)		
		self.webnotes_folder = wn_folder
		self.mysql_path = hasattr(defs, 'mysql_path') and webnotes.defs.mysql_path or ''
		self.DbInt = db_init.DatabaseInstance(self.conn,'webnotesdb')

	

	def import_from_db(self,source):
		"""
		a very simplified version, just for the time being..will eventually be deprecated once the framework stabilizes.
		"""
		target = "webnotesdb"
		# delete user (if exists)
		self.dbman.delete_user(target)

		# create user and db
		self.dbman.create_user(target,getattr(defs,'db_password',None))
	
		self.dbman.create_database(target)

		self.dbman.grant_all_privileges(target,target)

		self.dbman.flush_privileges()

		self.dbman.set_transaction_isolation_level('GLOBAL','READ COMMITTED')

		source_path = os.path.join(os.path.dirname(getattr(defs,'webnotes_folder')),'data')+'/' +source +'.sql'

		# import in target
		self.dbman.restore_database(target,source_path,getattr(defs,'root_password'))

		self.conn.use(target)
		self.dbman.drop_table('__DocTypeCache')
		self.conn.sql("create table `__DocTypeCache` (name VARCHAR(120), modified DATETIME, content TEXT, server_code_compiled TEXT)")


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
		return target
		

	def install_base_fw(self):
		"""
		Create Base Tables for framework:
			1.tabSessions
			2.tabSingles
			3.__DocTypeCache
			4.tabRole
			5.tabDocField
			6.tabDocPerm
			7.tabDocFormat
			8.tabDocType
			9.tabModule Def
			10.tabPrint Format
			11.tabEvent Role
			12.tabSearch Criteria
			13.tabSeries
			14.tabWeb Visitor
			15.tabUserRole
			16.tabTweet
			17.tabTransfer Module
			18.tabTransfer Account
			19.tabToDo Item
			20.tabTicket
			21.tabPrint Format
			22.tabPage
			23.tabFile
		
		Insert records into tabDocType:
			1.DocType
			2.DocPerm
			3.DocFormat
			4.DocField
			5.Module
		"""
			
		self.DbInt.create_db_and_user()
		
		self.DbInt.create_singles()
		self.DbInt.create_sessions()
		self.DbInt.create_doctypecache()
		self.DbInt.create_role()
		self.DbInt.create_docfield()
		self.DbInt.create_docperm()
		
		self.DbInt.create_docformat()
		self.DbInt.create_doctype()
		
		self.DbInt.create_module_def()
		self.DbInt.create_base_doctype_records()
		
		#Import doctype,docperm,docfield,docformat,core etc.
		from webnotes.modules.import_module import import_from_files
		import webnotes.db
		webnotes.conn = self.conn
		import_from_files(['core'])
		
		
		
		self.DbInt.post_cleanup()
		
		

# Installation
# -------------------------------------------------------------
#TODO: 1. tabDefaults table creation

if __name__=='__main__':



	defs_path = os.path.join(os.getcwd(),'webnotes','defs.py')

	if not os.path.exists(defs_path):
		defs_template_path = os.path.join(os.getcwd(),'webnotes','defs')
		print "Creating defs.py"	
		copy_file(defs_template_path,defs_path)

	from webnotes import defs
	log_path = getattr(defs,'log_file_path',None)
	if log_path:
		print "Creating log folder and file..."
		create_log_folder(os.path.dirname(log_path))
		
	sys.path.append(os.getcwd())
	
	if sys.argv[1]=='install':

		Inst = Installer(getattr(defs,'webnotes_folder'))
		#Inst.install_base_fw()
		
		Inst.import_from_db("Framework")
		
		
		

		
