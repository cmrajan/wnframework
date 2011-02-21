# -------------------------------------------------------------------------------------------------------------
import os,sys

# -------------------------------------------------------------------------------------------------------------

def get_source_path(source_path):
	import os
		
	cwd = os.path.split(os.getcwd())[-1]
	if not os.path.exists(source_path):
		if cwd == 'cgi-bin':
			source_path = '../data/' + source_path + '.sql'
		else:
			source_path = 'data/' + s + '.sql'
		
	# check if exists
	if os.path.exists(source_path):
		return source_path
	else:
		raise Exception, "Target file '%s' does not exist" % source_path




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
	
		import webnotes
		import webnotes.db
		from webnotes import defs
		from webnotes.model.db_schema import DbManager
		import db_init
		
		
		if defs.root_login:
			self.conn = webnotes.db.Database(user=defs.root_login, password=defs.root_password)
		
		self.dbman = DbManager(conn)		
		self.webnotes_folder = wn_folder
		#self.source_path = get_source_path(source_path)
		self.mysql_path = hasattr(defs, 'mysql_path') and webnotes.defs.mysql_path or ''
		self.DbInt = db_init.DatabaseInstance(self.conn,'webnotesdb')

	def copy_template_to_py(template_path,target_path):
		try:
			print "Copying %s to %s"%(template_path,target_path)
			cp_cmd = 'cp'
		
			ret = os.system(cp_cmd +' '+ template_path+' '+target_path)

		except Exception,e:
			raise e


	def copy_from_db_dump(source, target=''):
		import defs

		if not defs.server_prefix:
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

	



	def install_base_fw(self):
	"""
	Create Base Tables for framework:
		1.tabSession
		2.tabSingles
		3.__DocTypeCache
		4.tabRole
		5.tabDocField
		6.tabDocPerm
		7.tabDocFormat
		8.tabDocType
		9.tabModule Def
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

#	defs_template_path = os.path.join(cur_path,'webnotes','defs')
#	defs_path = os.path.join(cur_path,'webnotes','defs.py')

#	if not os.path.exists(defs_path):
#		print "Creating defs.py"	
#		copy_template_to_py(defs_template_path,defs_path)

#	from webnotes import defs
	
#	log_path = getattr(defs,'log_file_path',None)
#	if log_path:
#		print "Creating log folder and file..."
#		create_log_folder(os.path.dirname(log_path))
	sys.path.append(os.getcwd())
	
	if sys.argv[1]=='install':

		wn_folder = os.path.split(list(os.path.split(sys.path[0]))[:-1][0])[:-1][0]  #Hacky,Hard cody
		Inst = Installer(wn_folder)
		Inst.install_base_fw()

		
		

		
