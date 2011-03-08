# webnotes init (all shared variables come here)
code_fields_dict = {
	'Page':[('script', 'js'), ('content', 'html'), ('style', 'css'), ('static_content', 'html'), ('server_code', 'py')],
	'DocType':[('server_code_core', 'py'), ('client_script_core', 'js')],
	'Search Criteria':[('report_script', 'js'), ('server_script', 'py'), ('custom_query', 'sql')],
	'Patch':[('patch_code', 'py')],
	'Stylesheet':['stylesheet', 'css'],
	'Page Template':['template', 'html'],
	'Control Panel':[('startup_code', 'js'), ('startup_css', 'css')]
}


version = 'v170'
form_dict = {}
auth_obj = None
conn = None
form = None
session = None
user = None
is_testing = None
incoming_cookies = {}
add_cookies = {}
cookies = {}
auto_masters = {}
tenant_id = None


# for applications
app_conn = None
adt_list = ['DocType', 'DocField', 'DocPerm']



# json response object
response = {'message':'', 'exc':''}

debug_log, message_log = [], []

import os
import defs

import sys
sys.path.append(getattr(defs,'modules_path',None))

def getTraceback():
	import webnotes.utils
	webnotes.utils.getTraceback()

def errprint(msg):
	debug_log.append(str(msg or ''))

def msgprint(msg, small=0):
	message_log.append((small and '__small:' or '')+str(msg or ''))

def is_apache_user():
	import os
	if os.environ.get('USER') == 'apache':
		return True 
	else:
		return (not os.environ.get('USER'))
		# os.environ does not have user, so allows a security vulnerability,fixed now. 

def get_index_path():
	import os
	return os.sep.join(os.path.dirname(os.path.abspath(__file__)).split(os.sep)[:-2])

def get_files_path():
	global conn
	import defs, os

	if not conn:
		raise Exception, 'You must login first'

	if defs.files_path:
		return os.path.join(defs.files_path, conn.cur_db_name)
	else:
		return os.path.join(get_index_path(), 'user_files', conn.cur_db_name)
	
def create_folder(path):
	import os
	
	try:
		os.makedirs(path)
	except Exception, e:
		if e.args[0]==17: 
			pass
		else: 
			raise e


###############################################################################
#	BEGIN: TENTATIVE CODE FEELS LIKE A CLASS/TEMPLATE IS A BETTER IDEA FOR THESE VARIABLES.
#	Bad idea combining/using one function to set conn,user,session variables.
#	Need to split up.
###############################################################################

def set_as_account_master():
	import webnotes.db
	global conn
	conn = webnotes.db.Database(use_default = 1)

def set_as_administrator():
	
	global user
	
	if is_apache_user():
		raise Exception, 'Not for web users!'

	import webnotes.profile
	user = webnotes.profile.Profile('Administrator')

def set_as_admin_session():
	global session
	session = {'user':'Administrator'}

###############################################################################
#END  
###############################################################################


def set_as_admin(db_name=None, ac_name=None):

	import os
	if is_apache_user():
		raise Exception, 'Not for web users!'

	global conn
	global session
	global user
	
	import webnotes.db
	if ac_name:
		conn = webnotes.db.Database(ac_name = ac_name)
	else:
		set_as_account_master()
		if db_name:
			conn.use(db_name)
		
	session = {'user':'Administrator'}
	import webnotes.profile
	user = webnotes.profile.Profile('Administrator')


# Environment Variables
#-----------------------------------------------------------
def get_env_vars(env_var):
	return getattr(os.environ,env_var,'None')

remote_ip = get_env_vars('REMOTE_ADDR')		#Required for login from python shell

# Logging
# -----------------------------------------------------------

logger = None


def setup_logging():
	import logging
	import logging.handlers
	# Also please set umask for apache to 002.
	global logger

	logger = logging.getLogger('WNLogger')
	logger.setLevel(eval(defs.log_level))

	log_handler = logging.handlers.RotatingFileHandler(defs.log_file_name), maxBytes = defs.log_file_size, backupCount = defs.log_file_backup_count)	
	formatter = logging.Formatter('%(name)s - %(asctime)s - %(levelname)s\n%(message)s\n-------------------')
	
	log_handler.setFormatter(formatter)
	logger.addHandler(log_handler)

if getattr(defs, 'log_file_name', None):
	setup_logging()
	
