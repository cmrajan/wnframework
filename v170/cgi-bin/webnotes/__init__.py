# webnotes init (all shared variables come here)
code_fields_dict = {
	'Page':[('script','js'), ('content','html'), ('style','css'), ('static_content','html')],
	'DocType':[('server_code_core','py'),('client_script_core','js')],
	'Search Criteria':[('report_script','js'),('server_script','py'),('custom_query','sql')]
}


version = 'v170'

auth_obj = None
conn = None
form = None
session = None
user = None
is_testing = None
incoming_cookies = {}
add_cookies = {}

# for applications
app_conn = None
adt_list = ['DocType', 'DocField', 'DocPerm']

# json response object
response = {'message':'', 'exc':''}

debug_log, message_log = [], []

def errprint(msg):
	debug_log.append(str(msg or ''))

def msgprint(msg, small=0):
	message_log.append((small and '__small:' or '')+str(msg or ''))

def is_apache_user():
	import os
	if os.environ.get('USER') == 'apache':
		return 1

def get_index_path():
	import os
	return os.sep.join(os.path.dirname(os.path.abspath(__file__)).split('/')[:-2])

def create_folder(path):
	import os
	
	try:
		os.makedirs(path)
	except Exception, e:
		if e.args[0]==17: 
			pass
		else: 
			raise e

def set_as_admin():
	import os
	if is_apache_user():
		raise Exception, 'Not for web users!'

	global conn
	global session
	global user
	
	import webnotes.db
	conn = webnotes.db.Database(use_default=1)
	session = {'user':'Administrator'}
	import webnotes.profile
	user = webnotes.profile.Profile('Administrator')
