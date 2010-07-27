import webnotes
import webnotes.db
import webnotes.model.import_docs

# Application Manager
# =====================================================================================

class AppManager:
	def __init__(self, master):
		self.master = master
		self.acc_conn = None
		self.app_list = []
		if not webnotes.session:
			webnotes.session = {'user':'Administrator'}
	
	# load list of applications
	# ----------------------------------
	def load_app_list(self, al=[]):
		if not al:
			self.acc_conn = webnotes.db.Database(use_default=1)
			al = [a[0] for a in self.acc_conn.sql('select ac_name from tabAccount')]
		print al
		for a in al:
			self.app_list.append(App(self.master, a))

	# sync all the apps
	# ----------------------------------
	def sync_apps(self, dt='', dn='', app_list=[]):
		''' app_list is list of ac_names '''
		self.load_app_list(app_list)
		for app in self.app_list:
			if dt and dn:
				app.connect(app.ac_name)
				app.sync_doc(dt, dn)
				app.close()
			else:
				print "app.ac_name : "+app.ac_name
				app.sync(ac_name = app.ac_name)
	
	# execute a script in all apps
	# ----------------------------------
	def execute_script(self, script):
		for app in self.app_list():
			app.run_script(script)
	
	# create a new app
	# ----------------------------------
	def new_app(self, ac_name):
		import webnotes.setup

		# setup
		print 'Creating new application...'
		ret = webnotes.setup.create_account(ac_name)
		ret, db_name = ret.split(',')
		print app_id + ' created'
		
		# sync
		app = App(self.master, db_name)
		app.delete_doc('DocType', 'Ticket') # clear Ticket as it is very different from the new ticket
		app.sync(1)
		print app_id + ' synced'
		
		# run setup script
		app.run_setup_control()
	
	# create multiple apps
	# ----------------------------------
	def create_apps(self, n, start):
		for i in range(n):
			self.new_app('ax.%07d' % (start + i))
			
	# get the next app in line
	# ----------------------------------
	def register_app(self):
		ret = self.acc_conn.sql("select ac_name from tabAccount where ifnull(registered,0)=0 order by ac_name limit 1")
		if not ret:
			raise Exception, "No more apps to register"

		self.acc_conn.sql("update tabAccount set registered=1 where ac_name=%s", ret[0][0])
		return ret[0][0]
		
		
# Application Instance
# =====================================================================================
class App:
	def __init__(self, master, ac_name):
		self.ignore_modules = ['Development', 'Recycle Bin', 'System']
		self.ac_name = ac_name
		self.master = master
		self.verbose = 0
	
	# Get db Login
	# -------------
	def get_db_login(self, ac_name):
		acc_conn = webnotes.db.Database(use_default=1)
		det = acc_conn.sql('select db_login, db_name from tabAccount where ac_name = "%s"' % (ac_name))
		return det[0][0] or det[0][1]


	# make connections to master and app
	# ----------------------------------
	def connect(self, ac_name):
		if not webnotes.session:
			webnotes.session = {'user': 'Administrator'}
		print "ac_name"+ac_name
		print "self.master"+self.master	
		self.master_conn = webnotes.db.Database(ac_name = self.master)
		self.master_conn.use(self.get_db_login(self.master))
		print "ac_name"+ac_name
		self.conn = webnotes.db.Database(ac_name = ac_name)
		self.conn.use(self.get_db_login(ac_name))
	
	# close
	# ----------------------------------
	def close(self):
		self.conn.close()
		self.master_conn.close()
	
	# sync application doctypes
	# ----------------------------------
	def sync(self, verbose = 0, ac_name = ''):			
		self.verbose = verbose
		self.connect(ac_name)
		self.sync_records('Role')
		self.sync_records('DocType')
		self.sync_records('Search Criteria')
		self.sync_records('Page')
		self.sync_records('Module Def')
		self.sync_records('Print Format')
		self.sync_records('DocType Mapper')
		self.sync_records('DocType Label')
		#self.sync_control_panel()
		self.close()
		
	# sync control panel
	# ----------------------------------
	def sync_control_panel(self):
		self.conn.sql("start transaction")
		startup_code = self.master_conn.get_value('Control Panel', None, 'startup_code')
		self.conn.set_value('Control Panel', None, 'startup_code', startup_code)

		startup_css = self.master_conn.get_value('Control Panel', None, 'startup_css')
		self.conn.set_value('Control Panel', None, 'startup_css', startup_css)
		self.conn.sql("commit")

	# sync records of a particular type
	# ----------------------------------
	def sync_records(self, dt):
		if self.verbose:
			print "Sync: " + dt
			
		try:
			ml = self.get_master_list(dt)
			for m in ml:
				if self.is_modified(dt, m[0], m[1]):
					self.sync_doc(dt, m[0])
				else:
					if self.verbose:
						print "No update in " + m[0]
		except Exception, e:
			if e.args[0]==1146:
				print "No table %s in master" % dt
			else:
				raise e
	
	# sync a particular record
	# ----------------------------------
	def sync_doc(self, dt, dn):
		import webnotes
		from webnotes.utils import transfer
		
		webnotes.conn = self.master_conn
		import webnotes.model.doc

		# get from master
		doclist = webnotes.model.doc.get(dt, dn)
		
		# put
		webnotes.conn = self.conn
		print transfer.set_doc([d.fields for d in doclist], ovr = 1)
	
	# get the list from master
	# ----------------------------------
	def get_master_list(self, dt):
		c = ''
		
		cl = [i[0] for i in self.master_conn.sql("desc `tab%s`" % dt)]
		
		if 'standard' in cl:
			c += ' and standard="Yes"'
		if 'module' in cl and self.ignore_modules:
			c += ' and (' + ' and '.join(['module!="%s"' % i for i in self.ignore_modules]) + ')'
		return self.master_conn.sql("select name, modified from `tab%s` where docstatus != 2 %s" % (dt, c))
	
	# check if record is modified
	# ----------------------------------
	def is_modified(self, dt, dn, modified):
		ret = self.conn.sql("select modified from `tab%s` where name=%s" % (dt, '%s'), dn)
		if ret and ret[0][0]==modified:
			return 0
		else:
			return 1
	
	# run script remotely
	# ----------------------------------
	def run_script(self, script):
		webnotes.conn = self.conn
		from webnotes.model.code import get_obj
		sc = get_obj('Control Panel').execute_test(script)
			
	# run setup control in the app
	# ----------------------------------
	def run_setup_control(self):
		webnotes.conn = self.conn
		from webnotes.model.code import get_obj
		sc = get_obj('Setup Control').do_setup()
		
	# delete a record
	# ----------------------------------
	def delete_doc(self, dt, dn):
		webnotes.conn = self.conn
		import webnotes.model
		
		webnotes.model.delete_doc(dt, dn)
